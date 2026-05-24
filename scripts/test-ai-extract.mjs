/** Test AI extraction with inline municipal sample text. */
import { readFileSync } from "fs";

const env = readFileSync(".env.local", "utf8");
for (const line of env.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const sample = `
Buget local Cluj-Napoca 2026 — obiective de investiții:
1. Pasarelă pietonală Mănăștur — 18.500.000 lei — execuție — mobilitate
2. Modernizare strada Fabricii — 9.200.000 lei — licitație
3. Reabilitare grădiniță Gheorgheni — 2.100.000 lei — planificat — educație
`;

const system = `Ești un asistent care extrage informații despre investiții publice din documente municipale românești.
Returnează DOAR un JSON valid: un array de obiecte, fiecare cu câmpurile:
name, description_original, status, category, budget_ron, responsible_institution, address, start_date, end_date, source_url.
Pentru status folosește una din: planned, procurement, starting, continuing, finalizing, delayed, completed.
Pentru category folosește una din: mobility, education, green, social, cultural, energy, housing, waste.`;

const apiUrl =
  process.env.OPENROUTER_API_URL ??
  "https://openrouter.ai/api/v1/chat/completions";

const res = await fetch(apiUrl, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    "HTTP-Referer": "https://totulcluj.ro",
    "X-Title": "TotulCluj Admin",
  },
  body: JSON.stringify({
    model: process.env.AI_MODEL,
    max_tokens: 4096,
    temperature: 0.2,
    messages: [
      { role: "system", content: system },
      { role: "user", content: `Extrage proiectele:\n\n${sample}` },
    ],
  }),
});

const data = await res.json();
const content = data.choices?.[0]?.message?.content ?? "";
console.log("API status:", res.status);
console.log("Raw:", content.slice(0, 600));

const match = content.match(/\[[\s\S]*\]/);
if (match) {
  const projects = JSON.parse(match[0]);
  console.log("Parsed projects:", projects.length);
  console.log(JSON.stringify(projects[0], null, 2));
}
