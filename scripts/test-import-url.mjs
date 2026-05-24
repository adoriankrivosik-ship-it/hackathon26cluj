/**
 * Quick smoke test for URL import pipeline.
 * Usage: node --env-file=.env.local scripts/test-import-url.mjs [url]
 */

const url =
  process.argv[2] ??
  "https://www.primariaclujnapoca.ro/informatii-publice/";

const base = process.env.TEST_BASE ?? "http://localhost:3000";

async function login() {
  const res = await fetch(`${base}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "functionar@primarie.cluj",
      password: "totulcluj2026",
    }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status}`);
  const cookie = res.headers.getSetCookie?.()?.[0]?.split(";")[0];
  if (!cookie) throw new Error("No session cookie");
  return cookie;
}

async function main() {
  console.log("Login…");
  const cookie = await login();

  console.log("POST import/url", url);
  const started = Date.now();
  const res = await fetch(`${base}/api/admin/import/url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  console.log("Status:", res.status, `(${(Date.now() - started) / 1000}s)`);
  console.log("Projects:", data.projects?.length ?? 0);
  if (data.hint) console.log("Hint:", data.hint);
  if (data.error) console.log("Error:", data.error);
  if (data.projects?.length) {
    console.log("First:", JSON.stringify(data.projects[0], null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
