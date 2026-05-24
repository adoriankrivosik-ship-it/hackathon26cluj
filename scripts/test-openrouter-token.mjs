/**
 * Direct OpenRouter API smoke test (token + model).
 * Usage: node --env-file=.env.local scripts/test-openrouter-token.mjs
 */

const API_URL =
  process.env.OPENROUTER_API_URL ??
  "https://openrouter.ai/api/v1/chat/completions";
const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = process.env.AI_MODEL ?? "google/gemma-4-31b-it:free";

if (!API_KEY) {
  console.error("FAIL: OPENROUTER_API_KEY lipsește");
  process.exit(1);
}

console.log("=== Test token OpenRouter ===");
console.log("URL:", API_URL);
console.log("Model:", MODEL);
console.log("Token:", `${API_KEY.slice(0, 12)}…${API_KEY.slice(-8)}`);

async function chat(userPrompt, systemPrompt) {
  const started = Date.now();
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
      model: MODEL,
      max_tokens: 2048,
      temperature: 0.2,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const body = await res.text();
  const ms = Date.now() - started;

  let data;
  try {
    data = JSON.parse(body);
  } catch {
    return { ok: false, status: res.status, ms, error: body.slice(0, 300) };
  }

  if (!res.ok) {
    return {
      ok: false,
      status: res.status,
      ms,
      error: data.error?.message ?? body.slice(0, 300),
    };
  }

  const content = data.choices?.[0]?.message?.content?.trim() ?? "";
  return {
    ok: true,
    status: res.status,
    ms,
    content,
    usage: data.usage,
    id: data.id,
  };
}

const extractSystem = `Ești un asistent care extrage informații despre investiții publice din documente municipale românești.
Returnează DOAR un JSON valid: un array de obiecte, fiecare cu câmpurile:
name, description_original, status, category, budget_ron, responsible_institution, address, start_date, end_date, source_url.
Pentru status folosește una din: planned, procurement, starting, continuing, finalizing, delayed, completed.
Pentru category folosește una din: mobility, education, green, social, cultural, energy, housing, waste.
budget_ron trebuie să fie număr întreg în lei sau null dacă lipsește.`;

const sampleDoc = `
Buget local Cluj-Napoca 2026 — obiective de investiții:
1. Pasarelă pietonală Mănăștur — 18.500.000 lei — execuție — mobilitate — Primăria Cluj-Napoca
2. Modernizare strada Fabricii — 9.200.000 lei — licitație
3. Reabilitare grădiniță Gheorgheni — 2.100.000 lei — planificat — educație
`;

console.log("\n--- Test 1: ping simplu ---");
const ping = await chat("Răspunde doar cu cuvântul OK.", "Ești un asistent util.");
if (!ping.ok) {
  console.error("FAIL ping:", ping.status, ping.error);
  process.exit(1);
}
console.log("OK status:", ping.status, `(${ping.ms}ms)`);
console.log("Răspuns:", ping.content);

console.log("\n--- Test 2: extragere proiecte (JSON) ---");
const extract = await chat(
  `Extrage toate proiectele de investiții publice din acest document.\n\n${sampleDoc}`,
  extractSystem,
);
if (!extract.ok) {
  console.error("FAIL extract:", extract.status, extract.error);
  process.exit(1);
}
console.log("OK status:", extract.status, `(${extract.ms}ms)`);
console.log("Raw (primele 400 chars):", extract.content.slice(0, 400));

const jsonMatch = extract.content.match(/\[[\s\S]*\]/);
if (!jsonMatch) {
  console.error("FAIL: răspunsul nu conține array JSON");
  process.exit(1);
}

let projects;
try {
  projects = JSON.parse(jsonMatch[0]);
} catch (e) {
  console.error("FAIL: JSON invalid", e.message);
  process.exit(1);
}

if (!Array.isArray(projects) || projects.length === 0) {
  console.error("FAIL: array gol sau invalid");
  process.exit(1);
}

console.log(`SUCCESS: ${projects.length} proiect(e) extrase`);
console.log("Primul proiect:", JSON.stringify(projects[0], null, 2));
if (extract.usage) {
  console.log("Token usage:", extract.usage);
}

console.log("\n=== Tokenul funcționează corect ===");
