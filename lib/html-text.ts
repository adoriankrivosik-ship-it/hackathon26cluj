/** Decode common HTML entities in scraped page text. */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    )
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&apos;/gi, "'");
}

/** Pick the richest text block from HTML (main/article or full body). */
function pickMainHtml(html: string): string {
  const candidates: string[] = [];
  const patterns = [
    /<main[\s\S]*?>([\s\S]*?)<\/main>/i,
    /<article[\s\S]*?>([\s\S]*?)<\/article>/i,
    /<div[^>]+class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1] && match[1].length > 200) {
      candidates.push(match[1]);
    }
  }

  const bodyMatch = html.match(/<body[\s\S]*?>([\s\S]*?)<\/body>/i);
  if (bodyMatch?.[1]) candidates.push(bodyMatch[1]);

  candidates.push(html);

  return candidates.sort((a, b) => b.length - a.length)[0] ?? html;
}

/** Convert HTML page to plain text suitable for LLM extraction. */
export function htmlToPlainText(html: string): string {
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
  const metaDesc =
    html.match(
      /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
    )?.[1] ?? "";

  const chunk = pickMainHtml(html);
  const body = chunk
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
    .replace(/<header[\s\S]*?<\/header>/gi, " ")
    .replace(/<footer[\s\S]*?<\/footer>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const combined = decodeHtmlEntities(
    [title, metaDesc, body].filter(Boolean).join("\n\n"),
  ).trim();

  return combined;
}
