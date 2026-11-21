// End-to-end checks against a running API: npx wrangler dev --local, then: node test/run.mjs [baseUrl]
const BASE = process.argv[2] || "http://localhost:8787", ORIGIN = "http://localhost:8000";
let pass = 0, fail = 0;
const ok = (c, m) => { if (c) pass++; else { fail++; console.log("FAIL:", m); } };
async function call(path, { method = "GET", token, body, origin = ORIGIN } = {}) {
  const h = { "content-type": "application/json" }; if (token) h.authorization = "Bearer " + token; if (origin) h.origin = origin;
  const r = await fetch(BASE + path, { method, headers: h, body: body ? JSON.stringify(body) : undefined });
  let data = null; try { data = await r.json(); } catch (e) {}
  return { status: r.status, data, cors: r.headers.get("access-control-allow-origin") };
}
const a = await call("/auth/code/new", { method: "POST" });
ok(a.status === 200 && /^LUMEN(-[A-Z2-9]{4}){4}$/.test(a.data.code), "new code account");
ok(a.cors === ORIGIN, "CORS header for allowed origin");
const t = a.data.token;
ok((await call("/me", { token: t })).data.user.hasCode === true, "me");
ok((await call("/save", { token: t })).data.version === 0, "empty save");
const w1 = await call("/save", { method: "PUT", token: t, body: { save: "AAA", baseVersion: 0 } });
ok(w1.status === 200 && w1.data.version === 1, "first write");
const stale = await call("/save", { method: "PUT", token: t, body: { save: "BBB", baseVersion: 0 } });
ok(stale.status === 409 && stale.data.save === "AAA" && stale.data.version === 1, "stale write is a conflict");
ok((await call("/save", { method: "PUT", token: t, body: { save: "CCC", baseVersion: 0, force: true } })).data.version === 2, "forced write");
const login = await call("/auth/code", { method: "POST", body: { code: a.data.code.toLowerCase().replace(/-/g, " ") } });
ok(login.status === 200 && login.data.user.id === a.data.user.id, "sign in with code (any case/spacing)");
ok((await call("/save", { token: login.data.token })).data.save === "CCC", "second device sees save");
ok((await call("/auth/code", { method: "POST", body: { code: "LUMEN-AAAA-BBBB-CCCC-DDDD" } })).status === 404, "unknown code");
const nc = await call("/me/code", { method: "POST", token: t });
ok(nc.status === 200 && nc.data.code !== a.data.code, "new code");
ok((await call("/auth/code", { method: "POST", body: { code: a.data.code } })).status === 404, "old code retired");
ok((await call("/auth/code", { method: "POST", body: { code: nc.data.code } })).status === 200, "new code works");
ok((await call("/auth/google", { method: "POST", body: { credential: "a.b.c" } })).status === 400, "bad google token rejected");
ok((await call("/save", { token: "nope" })).status === 401, "bad session rejected");
ok((await call("/save", { method: "PUT", token: t, body: { save: "x".repeat(600000), baseVersion: 2 } })).status === 413, "oversized save rejected");
ok((await call("/health", { origin: "https://evil.example" })).cors === null, "no CORS for other sites");
ok((await call("/logout", { method: "POST", token: t })).status === 200 && (await call("/me", { token: t })).status === 401, "logout ends session");
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
