import "server-only";

import type { ExtractedProject } from "./admin-types";
import type {
  CitizenAnswers,
  CitizenProfile,
  CitizenProfileGenerationResult,
  CitizenProfileWeights,
} from "./citizen-profile-types";
import {
  buildHeuristicCitizenProfile,
  isNearlyEqualProfile,
} from "./citizen-profile-heuristic";
import { htmlToPlainText } from "./html-text";

const DEFAULT_MODEL = "google/gemma-4-31b-it:free";
const DEFAULT_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const AI_TIMEOUT_MS = 120_000;
const MIN_CONTENT_CHARS = 80;
const RETRY_DELAYS_MS = [2_000, 5_000, 10_000] as const;

/** Free OpenRouter models used when the primary model is rate-limited. */
const DEFAULT_FALLBACK_MODELS = [
  "openrouter/free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "google/gemma-4-26b-a4b-it:free",
] as const;

const EXTRACT_SYSTEM_PROMPT = `Ești un asistent care extrage informații despre investiții publice din documente municipale românești.
Returnează DOAR un JSON valid: un array de obiecte, fiecare cu câmpurile:
name, description_original, status, category, budget_ron, responsible_institution, address, start_date, end_date, source_url.

Pentru status folosește una din: planned, procurement, starting, continuing, finalizing, delayed, completed.
Pentru category folosește una din: mobility, education, green, social, cultural, energy, housing, waste.
budget_ron trebuie să fie număr întreg în lei sau null dacă lipsește.
Dacă nu găsești proiecte, returnează [].`;

function getAiConfig() {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY lipsește din variabilele de mediu.");
  }

  return {
    apiKey,
    model: process.env.AI_MODEL ?? DEFAULT_MODEL,
    apiUrl: process.env.OPENROUTER_API_URL ?? DEFAULT_API_URL,
  };
}

function getModelCandidates(): string[] {
  const primary = process.env.AI_MODEL ?? DEFAULT_MODEL;
  const fromEnv =
    process.env.AI_MODEL_FALLBACK?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  const fallbacks =
    fromEnv.length > 0 ? fromEnv : [...DEFAULT_FALLBACK_MODELS];
  return [...new Set([primary, ...fallbacks])];
}

function extractMessageText(message?: {
  content?: string | null;
  reasoning?: string | null;
}): string {
  const content = message?.content?.trim() ?? "";
  if (content) return content;

  const reasoning = message?.reasoning?.trim() ?? "";
  if (!reasoning) return "";

  const fenced = reasoning.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]?.trim()) return fenced[1].trim();

  const jsonArray = reasoning.match(/\[[\s\S]*\]/);
  if (jsonArray) return jsonArray[0];

  return reasoning;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitResponse(status: number, body: string): boolean {
  return status === 429 || /rate[- ]limit/i.test(body);
}

function isUpstreamRateLimit(body: string): boolean {
  return /temporarily rate-limited upstream/i.test(body);
}

function formatOpenRouterError(status: number, body: string): string {
  if (isRateLimitResponse(status, body)) {
    return "Modelul AI gratuit este suprasolicitat momentan (limită OpenRouter/Google). Reîncercați în 30–60 secunde sau setați AI_MODEL / AI_MODEL_FALLBACK în .env.local.";
  }

  let detail = body;
  try {
    const parsed = JSON.parse(body) as { error?: { message?: string } };
    detail = parsed.error?.message ?? body;
  } catch {
    /* keep raw body */
  }

  return `OpenRouter API error: ${status} ${detail.slice(0, 300)}`;
}

async function callAiOnce(
  model: string,
  userPrompt: string,
  systemPrompt: string,
): Promise<{ ok: true; content: string } | { ok: false; status: number; body: string }> {
  const { apiKey, apiUrl } = getAiConfig();

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://totulcluj.ro",
      "X-Title": "TotulCluj Admin",
    },
    signal: AbortSignal.timeout(AI_TIMEOUT_MS),
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const body = await res.text();

  if (!res.ok) {
    return { ok: false, status: res.status, body };
  }

  let data: {
    choices?: Array<{
      message?: { content?: string | null; reasoning?: string | null };
    }>;
  };
  try {
    data = JSON.parse(body) as typeof data;
  } catch {
    return { ok: false, status: res.status, body };
  }

  return {
    ok: true,
    content: extractMessageText(data.choices?.[0]?.message),
  };
}

async function callAi(
  userPrompt: string,
  systemPrompt = EXTRACT_SYSTEM_PROMPT,
): Promise<string> {
  const models = getModelCandidates();
  let lastRateLimitError = "";

  for (const model of models) {
    for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
      if (attempt > 0) {
        await sleep(RETRY_DELAYS_MS[attempt - 1] ?? 10_000);
      }

      const result = await callAiOnce(model, userPrompt, systemPrompt);

      if (result.ok) {
        if (result.content) return result.content;
        lastRateLimitError =
          "Modelul AI nu a returnat conținut. Reîncercați sau folosiți PDF.";
        continue;
      }

      if (isRateLimitResponse(result.status, result.body)) {
        lastRateLimitError = formatOpenRouterError(result.status, result.body);
        if (isUpstreamRateLimit(result.body)) break;
        continue;
      }

      throw new Error(formatOpenRouterError(result.status, result.body));
    }
  }

  throw new Error(
    lastRateLimitError ||
      "Toate modelele AI configurate sunt indisponibile. Reîncercați mai târziu.",
  );
}

function parseJsonArray(raw: string): ExtractedProject[] {
  if (!raw.trim()) {
    throw new Error("Modelul AI nu a returnat conținut.");
  }

  let jsonStr = raw.trim();
  const fenced = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) {
    jsonStr = fenced[1].trim();
  }

  const jsonMatch = jsonStr.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    throw new Error(
      "Răspunsul AI nu conține un array JSON valid. Încercați un alt URL sau PDF.",
    );
  }

  try {
    const parsed = JSON.parse(jsonMatch[0]) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as ExtractedProject[];
  } catch {
    throw new Error(
      "Nu s-a putut interpreta JSON-ul returnat de AI. Încercați din nou.",
    );
  }
}

export async function generatePlainSummary(
  descriptionOriginal: string,
): Promise<string> {
  if (!process.env.OPENROUTER_API_KEY) {
    return descriptionOriginal.slice(0, 500);
  }

  try {
    const text = await callAi(
      `Rezumă în limba română simplă, accesibilă cetățenilor (maxim 3 propoziții), următorul text administrativ despre un proiect public:\n\n${descriptionOriginal}`,
      "Ești un asistent civic care explică proiecte publice în limbaj simplu, în română.",
    );
    return text.trim() || descriptionOriginal.slice(0, 500);
  } catch {
    return descriptionOriginal.slice(0, 500);
  }
}

export async function extractProjectsFromText(
  content: string,
  sourceUrl?: string,
): Promise<ExtractedProject[]> {
  const text = await callAi(
    `Extrage toate proiectele de investiții publice din acest document.${
      sourceUrl ? ` URL sursă: ${sourceUrl}` : ""
    }\n\n${content.slice(0, 120000)}`,
  );
  const projects = parseJsonArray(text);
  return projects.map((p) => ({
    ...p,
    source_url: p.source_url ?? sourceUrl,
  }));
}

export async function extractProjectsFromUrl(
  url: string,
): Promise<ExtractedProject[]> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; TotulclujBot/1.0; +https://totulcluj.ro)",
      Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "ro-RO,ro;q=0.9,en;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(45_000),
  });

  if (!res.ok) {
    throw new Error(`Nu s-a putut descărca pagina: HTTP ${res.status}`);
  }

  const html = await res.text();
  const text = htmlToPlainText(html);

  if (text.length < MIN_CONTENT_CHARS) {
    throw new Error(
      "Pagina nu conține suficient text extras. Încercați un link direct către documentul proiectului sau încărcați PDF-ul.",
    );
  }

  return extractProjectsFromText(text, url);
}

async function extractPdfText(base64: string): Promise<string> {
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data: Buffer.from(base64, "base64") });
  try {
    const result = await parser.getText();
    return result.text.replace(/\s+/g, " ").trim();
  } finally {
    await parser.destroy();
  }
}

export async function extractProjectsFromPdfBase64(
  base64: string,
  fileName: string,
): Promise<ExtractedProject[]> {
  const pdfText = await extractPdfText(base64);
  if (!pdfText) {
    throw new Error(`Nu s-a putut extrage text din PDF-ul „${fileName}”.`);
  }

  return extractProjectsFromText(
    pdfText,
    fileName.endsWith(".pdf") ? undefined : `${fileName}.pdf`,
  );
}

const CITIZEN_PROFILE_SYSTEM_PROMPT = `Ești un asistent urban pentru locuință. Pe baza răspunsurilor utilizatorului despre stilul de viață, generează un obiect JSON CitizenProfile cu câmpurile:
weights (obiect cu: education, health, parks, transport, commercial, culture, sport, restaurants, banks — fiecare număr între 0 și 1),
excluded_categories (array de string-uri cu categoriile cu greutate 0),
profile_name (string scurt în română, ex. "Activ și conectat"),
profile_emoji (un singur emoji),
profile_summary (1-2 propoziții în română).

Greutățile din weights trebuie să însumeze exact 1.0. Categoriile excluse au greutate 0. Fii generos cu greutățile pentru prioritățile declarate.
Răspunsul trebuie să fie DOAR JSON valid, fără markdown.`;

const DEFAULT_CITIZEN_PROFILE: CitizenProfile = {
  weights: {
    education: 1 / 9,
    health: 1 / 9,
    parks: 1 / 9,
    transport: 1 / 9,
    commercial: 1 / 9,
    culture: 1 / 9,
    sport: 1 / 9,
    restaurants: 1 / 9,
    banks: 1 / 9,
  },
  excluded_categories: [],
  profile_name: "Echilibrat",
  profile_emoji: "🏘️",
  profile_summary:
    "Profil echilibrat cu importanță egală pentru toate categoriile din zonă.",
};

const WEIGHT_KEYS: (keyof CitizenProfileWeights)[] = [
  "education",
  "health",
  "parks",
  "transport",
  "commercial",
  "culture",
  "sport",
  "restaurants",
  "banks",
];

function parseCitizenProfileJson(raw: string): CitizenProfile | null {
  let jsonStr = raw.trim();
  const fenced = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) jsonStr = fenced[1].trim();

  const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (!objectMatch) return null;

  try {
    const parsed = JSON.parse(objectMatch[0]) as Partial<CitizenProfile>;
    if (!parsed.weights || typeof parsed.profile_name !== "string") {
      return null;
    }

    const weights = {} as CitizenProfileWeights;
    for (const key of WEIGHT_KEYS) {
      const v = Number(parsed.weights[key]);
      weights[key] = Number.isFinite(v) && v >= 0 ? v : 0;
    }

    let sum = WEIGHT_KEYS.reduce((acc, k) => acc + weights[k], 0);
    if (sum <= 0) return null;

    if (Math.abs(sum - 1) > 0.02) {
      for (const key of WEIGHT_KEYS) {
        weights[key] = weights[key] / sum;
      }
    }

    return {
      weights,
      excluded_categories: Array.isArray(parsed.excluded_categories)
        ? parsed.excluded_categories.filter((c) => typeof c === "string")
        : [],
      profile_name: parsed.profile_name.trim() || DEFAULT_CITIZEN_PROFILE.profile_name,
      profile_emoji:
        typeof parsed.profile_emoji === "string" && parsed.profile_emoji.trim()
          ? parsed.profile_emoji.trim().slice(0, 4)
          : DEFAULT_CITIZEN_PROFILE.profile_emoji,
      profile_summary:
        typeof parsed.profile_summary === "string" && parsed.profile_summary.trim()
          ? parsed.profile_summary.trim()
          : DEFAULT_CITIZEN_PROFILE.profile_summary,
    };
  } catch {
    return null;
  }
}

export async function generateCitizenProfile(
  answers: CitizenAnswers,
): Promise<CitizenProfile> {
  if (!process.env.OPENROUTER_API_KEY) {
    return DEFAULT_CITIZEN_PROFILE;
  }

  const userPrompt = `Generează profilul CitizenProfile pentru următoarele răspunsuri (JSON):
${JSON.stringify(answers, null, 2)}

Prioritățile sunt ordonate de la cea mai importantă la cea mai puțin importantă.
Ultimele 2 categorii din listă sunt excluse (greutate 0).`;

  try {
    const text = await callAi(userPrompt, CITIZEN_PROFILE_SYSTEM_PROMPT);
    return parseCitizenProfileJson(text) ?? DEFAULT_CITIZEN_PROFILE;
  } catch {
    return DEFAULT_CITIZEN_PROFILE;
  }
}

export async function generateCitizenProfileDetailed(
  answers: CitizenAnswers,
): Promise<CitizenProfileGenerationResult> {
  const aiConfigured = Boolean(process.env.OPENROUTER_API_KEY?.trim());
  const warnings: string[] = [];

  if (!aiConfigured) {
    warnings.push(
      "Cheia OPENROUTER_API_KEY lipsește — profilul e calculat local din răspunsurile tale.",
    );
    return {
      profile: buildHeuristicCitizenProfile(answers),
      source: "heuristic",
      warnings,
      aiConfigured: false,
    };
  }

  const userPrompt = `Generează profilul CitizenProfile pentru următoarele răspunsuri (JSON):
${JSON.stringify(answers, null, 2)}

Prioritățile sunt ordonate de la cea mai importantă la cea mai puțin importantă.
Ultimele 2 categorii din listă sunt excluse (greutate 0).
Răspunsul trebuie să fie DOAR JSON valid, fără markdown.`;

  try {
    const text = await callAi(userPrompt, CITIZEN_PROFILE_SYSTEM_PROMPT);
    const parsed = parseCitizenProfileJson(text);

    if (!parsed) {
      warnings.push(
        "AI nu a returnat JSON valid — folosim calcul local din prioritățile tale.",
      );
      return {
        profile: buildHeuristicCitizenProfile(answers),
        source: "heuristic",
        warnings,
        aiConfigured: true,
      };
    }

    if (
      isNearlyEqualProfile(parsed) &&
      answers.priorities.length >= 2
    ) {
      warnings.push(
        "AI a returnat un profil prea generic — am recalculat local din răspunsurile tale.",
      );
      return {
        profile: buildHeuristicCitizenProfile(answers),
        source: "heuristic",
        warnings,
        aiConfigured: true,
      };
    }

    return {
      profile: parsed,
      source: "ai",
      warnings,
      aiConfigured: true,
    };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Serviciul AI este indisponibil.";
    warnings.push(`AI: ${message}`);
    warnings.push("Profilul a fost generat local din răspunsurile tale.");
    return {
      profile: buildHeuristicCitizenProfile(answers),
      source: "heuristic",
      warnings,
      aiConfigured: true,
    };
  }
}

export type { CitizenAnswers, CitizenProfile };
