/**
 * Simulates lib/ai.ts retry + fallback against OpenRouter.
 * Usage: node --env-file=.env.local scripts/test-ai-retry.mjs
 */

const API_URL =
  process.env.OPENROUTER_API_URL ??
  "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = process.env.OPENROUTER_API_KEY;
const RETRY_DELAYS_MS = [2000, 5000, 10000];
const DEFAULT_FALLBACK = [
  "openrouter/free",
  "nvidia/nemotron-3-nano-30b-a3b:free",
  "google/gemma-4-26b-a4b-it:free",
];

function getModels() {
  const primary = process.env.AI_MODEL ?? "google/gemma-4-31b-it:free";
  const fromEnv =
    process.env.AI_MODEL_FALLBACK?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? [];
  return [...new Set([primary, ...(fromEnv.length ? fromEnv : DEFAULT_FALLBACK)])];
}

function extractMessageText(message) {
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

function isRateLimit(status, body) {
  return status === 429 || /rate[- ]limit/i.test(body);
}

async function callOnce(model, userPrompt, systemPrompt) {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
      "HTTP-Referer": "https://totulcluj.ro",
      "X-Title": "TotulCluj Admin",
    },
    signal: AbortSignal.timeout(120_000),
    body: JSON.stringify({
      model,
      max_tokens: 2048,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });
  const body = await res.text();
  if (!res.ok) return { ok: false, status: res.status, body };
  const data = JSON.parse(body);
  return {
    ok: true,
    model,
    content: extractMessageText(data.choices?.[0]?.message),
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const system = `Returnează DOAR JSON array cu name, description_original, status, category, budget_ron.
Status: planned|procurement|starting|continuing|finalizing|delayed|completed.
Category: mobility|education|green|social|cultural|energy|housing|waste.`;
const sample = `
Buget local Cluj-Napoca 2026:
1. Pasarelă Mănăștur — 18.500.000 lei — execuție — mobilitate
2. Modernizare strada Fabricii — 9.200.000 lei — licitație
`;

console.log("Models:", getModels().join(" → "));

for (const model of getModels()) {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1]);
    console.log(`Trying ${model} (attempt ${attempt + 1})…`);
    const result = await callOnce(
      model,
      `Extrage proiectele:\n${sample}`,
      system,
    );
    if (result.ok && result.content) {
      const match = result.content.match(/\[[\s\S]*\]/);
      const projects = match ? JSON.parse(match[0]) : [];
      console.log(`SUCCESS via ${model}: ${projects.length} proiect(e)`);
      process.exit(0);
    }
    if (!result.ok && isRateLimit(result.status, result.body)) {
      console.log(`  rate-limited (${result.status}), continue…`);
      if (/temporarily rate-limited upstream/i.test(result.body)) break;
      continue;
    }
    if (!result.ok) {
      console.log(`  error ${result.status}:`, result.body.slice(0, 120));
      break;
    }
    console.log("  empty content, continue…");
  }
}

console.error("FAIL: all models exhausted");
process.exit(1);
