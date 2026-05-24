import type { ExtractedProject } from "./admin-types";

const CLAUDE_MODEL = "claude-sonnet-4-20250514";

const EXTRACT_SYSTEM_PROMPT = `Ești un asistent care extrage informații despre investiții publice din documente municipale românești.
Returnează DOAR un JSON valid: un array de obiecte, fiecare cu câmpurile:
name, description_original, status, category, budget_ron, responsible_institution, address, start_date, end_date, source_url.

Pentru status folosește una din: planned, procurement, starting, continuing, finalizing, delayed, completed.
Pentru category folosește una din: mobility, education, green, social, cultural, energy, housing, waste.
budget_ron trebuie să fie număr întreg în lei sau null dacă lipsește.
Dacă nu găsești proiecte, returnează [].`;

async function callClaude(
  messages: Array<{ role: string; content: unknown }>,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY lipsește din variabilele de mediu.");
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 8192,
      system: EXTRACT_SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error: ${res.status} ${err}`);
  }

  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const text = data.content.find((c) => c.type === "text")?.text ?? "";
  return text;
}

function parseJsonArray(raw: string): ExtractedProject[] {
  const trimmed = raw.trim();
  const jsonMatch = trimmed.match(/\[[\s\S]*\]/);
  const jsonStr = jsonMatch ? jsonMatch[0] : trimmed;
  const parsed = JSON.parse(jsonStr) as unknown;
  if (!Array.isArray(parsed)) return [];
  return parsed as ExtractedProject[];
}

export async function generatePlainSummary(
  descriptionOriginal: string,
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return descriptionOriginal.slice(0, 500);
  }

  const text = await callClaude([
    {
      role: "user",
      content: `Rezumă în limba română simplă, accesibilă cetățenilor (maxim 3 propoziții), următorul text administrativ despre un proiect public:\n\n${descriptionOriginal}`,
    },
  ]);

  return text.trim() || descriptionOriginal.slice(0, 500);
}

export async function extractProjectsFromText(
  content: string,
  sourceUrl?: string,
): Promise<ExtractedProject[]> {
  const text = await callClaude([
    {
      role: "user",
      content: `Extrage toate proiectele de investiții publice din acest document.${
        sourceUrl ? ` URL sursă: ${sourceUrl}` : ""
      }\n\n${content.slice(0, 120000)}`,
    },
  ]);
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
    headers: { "User-Agent": "TotulclujBot/1.0 (civic transparency)" },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) {
    throw new Error(`Nu s-a putut descărca pagina: ${res.status}`);
  }
  const html = await res.text();
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return extractProjectsFromText(text, url);
}

export async function extractProjectsFromPdfBase64(
  base64: string,
  fileName: string,
): Promise<ExtractedProject[]> {
  const text = await callClaude([
    {
      role: "user",
      content: [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        },
        {
          type: "text",
          text: `Extrage toate proiectele de investiții publice din acest document PDF (${fileName}).`,
        },
      ],
    },
  ]);
  return parseJsonArray(text);
}
