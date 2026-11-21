/* =========================================================
   LUMEN BEASTS — cloud save API (Cloudflare Worker + D1)

   Sign in with Google, or with an account code (a backup that
   needs no Google account). Each account keeps one save: the
   game's own signed save string. Every write bumps a version
   number, so two devices can't silently overwrite each other.

   Routes (JSON in, JSON out):
     GET  /health
     POST /auth/google        { credential }  -> { token, user }
     POST /auth/code/new                      -> { token, user, code }
     POST /auth/code          { code }        -> { token, user }
     GET  /me                                 -> { user }
     POST /me/code                            -> { code }   (new code; the old one stops working)
     POST /me/google          { credential }  -> { user }   (link Google to a code account)
     GET  /save                               -> { save, version, updatedAt }
     PUT  /save               { save, baseVersion, force? } -> { version, updatedAt } | 409 { save, version, updatedAt }
     POST /logout
   ========================================================= */

const SESSION_DAYS = 180;
const MAX_SAVE_BYTES = 512 * 1024;
const CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no I, L, O, 0, 1
const GOOGLE_ISSUERS = ["accounts.google.com", "https://accounts.google.com"];

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const cors = corsHeaders(origin, env);
    if (req.method === "OPTIONS") return new Response(null, { status: cors ? 204 : 403, headers: cors || {} });
    try {
      const res = await route(req, env);
      if (cors) for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
      return res;
    } catch (e) {
      const status = e instanceof HttpError ? e.status : 500;
      if (status === 500) console.error(e && e.stack || e);
      const res = json({ error: status === 500 ? "Server error" : e.message }, status);
      if (cors) for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
      return res;
    }
  }
};

/* ---------- routing ---------- */
async function route(req, env) {
  const url = new URL(req.url), path = url.pathname.replace(/\/+$/, "") || "/", m = req.method;

  if (path === "/" || path === "/health") return json({ ok: true, service: "lumenbeasts-api", google: !!env.GOOGLE_CLIENT_ID });

  if (m === "POST" && path === "/auth/google") {
    const { credential } = await body(req);
    const g = await verifyGoogle(credential, env);
    let user = await env.DB.prepare("SELECT * FROM users WHERE google_sub = ?").bind(g.sub).first();
    if (!user) {
      user = { id: newId(), google_sub: g.sub, email: g.email || null, name: g.name || null, code_hash: null, created_at: Date.now() };
      await env.DB.prepare("INSERT INTO users (id, google_sub, email, name, code_hash, created_at) VALUES (?, ?, ?, ?, ?, ?)")
        .bind(user.id, user.google_sub, user.email, user.name, null, user.created_at).run();
    } else if (g.email !== user.email || g.name !== user.name) {
      await env.DB.prepare("UPDATE users SET email = ?, name = ? WHERE id = ?").bind(g.email || null, g.name || null, user.id).run();
      user.email = g.email || null; user.name = g.name || null;
    }
    return json({ token: await newSession(env, user.id), user: publicUser(user) });
  }

  if (m === "POST" && path === "/auth/code/new") {
    const code = newCode(), user = { id: newId(), google_sub: null, email: null, name: null, code_hash: await sha256(normCode(code)), created_at: Date.now() };
    await env.DB.prepare("INSERT INTO users (id, google_sub, email, name, code_hash, created_at) VALUES (?, NULL, NULL, NULL, ?, ?)")
      .bind(user.id, user.code_hash, user.created_at).run();
    return json({ token: await newSession(env, user.id), user: publicUser(user), code });
  }

  if (m === "POST" && path === "/auth/code") {
    const { code } = await body(req);
    const n = normCode(code);
    if (n.length !== 16) throw new HttpError(400, "That code doesn't look right. It should look like LUMEN-ABCD-EFGH-JKMN-PQRS.");
    const user = await env.DB.prepare("SELECT * FROM users WHERE code_hash = ?").bind(await sha256(n)).first();
    if (!user) { await sleep(400); throw new HttpError(404, "No account uses that code."); }
    return json({ token: await newSession(env, user.id), user: publicUser(user) });
  }

  // Everything below needs a signed-in session
  const { user, tokenHash } = await requireUser(req, env);

  if (m === "GET" && path === "/me") return json({ user: publicUser(user) });

  if (m === "POST" && path === "/me/code") {
    const code = newCode();
    await env.DB.prepare("UPDATE users SET code_hash = ? WHERE id = ?").bind(await sha256(normCode(code)), user.id).run();
    return json({ code });
  }

  if (m === "POST" && path === "/me/google") {
    const { credential } = await body(req);
    const g = await verifyGoogle(credential, env);
    const other = await env.DB.prepare("SELECT id FROM users WHERE google_sub = ?").bind(g.sub).first();
    if (other && other.id !== user.id) throw new HttpError(409, "That Google account already has its own Lumen Beasts save.");
    await env.DB.prepare("UPDATE users SET google_sub = ?, email = ?, name = ? WHERE id = ?").bind(g.sub, g.email || null, g.name || null, user.id).run();
    return json({ user: publicUser({ ...user, google_sub: g.sub, email: g.email || null, name: g.name || null }) });
  }

  if (m === "GET" && path === "/save") {
    const s = await env.DB.prepare("SELECT data, version, updated_at FROM saves WHERE user_id = ?").bind(user.id).first();
    return json(s ? { save: s.data, version: s.version, updatedAt: s.updated_at } : { save: null, version: 0, updatedAt: null });
  }

  if (m === "PUT" && path === "/save") {
    const b = await body(req, MAX_SAVE_BYTES + 4096);
    if (typeof b.save !== "string" || !b.save) throw new HttpError(400, "Missing save.");
    if (b.save.length > MAX_SAVE_BYTES) throw new HttpError(413, "Save is too large.");
    const base = Number.isInteger(b.baseVersion) ? b.baseVersion : -1, now = Date.now();
    const cur = await env.DB.prepare("SELECT data, version, updated_at FROM saves WHERE user_id = ?").bind(user.id).first();
    const curV = cur ? cur.version : 0;
    if (!b.force && base !== curV) return json({ error: "conflict", save: cur ? cur.data : null, version: curV, updatedAt: cur ? cur.updated_at : null }, 409);
    // Conditional write: only succeeds if nobody else wrote in between
    const r = cur
      ? await env.DB.prepare("UPDATE saves SET data = ?, version = version + 1, updated_at = ? WHERE user_id = ? AND version = ?").bind(b.save, now, user.id, curV).run()
      : await env.DB.prepare("INSERT OR IGNORE INTO saves (user_id, data, version, updated_at) VALUES (?, ?, 1, ?)").bind(user.id, b.save, now).run();
    if (!r.meta || r.meta.changes !== 1) {
      const s = await env.DB.prepare("SELECT data, version, updated_at FROM saves WHERE user_id = ?").bind(user.id).first();
      return json({ error: "conflict", save: s && s.data, version: s ? s.version : 0, updatedAt: s && s.updated_at }, 409);
    }
    return json({ version: curV + 1, updatedAt: now });
  }

  if (m === "POST" && path === "/logout") {
    await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(tokenHash).run();
    return json({ ok: true });
  }

  throw new HttpError(404, "Not found");
}

/* ---------- sessions ---------- */
async function newSession(env, userId) {
  const token = b64url(crypto.getRandomValues(new Uint8Array(32))), now = Date.now();
  await env.DB.prepare("INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)")
    .bind(await sha256(token), userId, now, now + SESSION_DAYS * 864e5).run();
  return token;
}
async function requireUser(req, env) {
  const h = req.headers.get("Authorization") || "", token = h.startsWith("Bearer ") ? h.slice(7).trim() : "";
  if (!token) throw new HttpError(401, "Please sign in.");
  const tokenHash = await sha256(token);
  const row = await env.DB.prepare("SELECT u.*, s.expires_at AS s_exp FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?").bind(tokenHash).first();
  if (!row || row.s_exp < Date.now()) throw new HttpError(401, "Your sign-in has expired. Please sign in again.");
  // Slide the expiry forward for active players (at most once a day)
  if (row.s_exp - Date.now() < (SESSION_DAYS - 1) * 864e5)
    await env.DB.prepare("UPDATE sessions SET expires_at = ? WHERE token_hash = ?").bind(Date.now() + SESSION_DAYS * 864e5, tokenHash).run();
  return { user: row, tokenHash };
}
const publicUser = u => ({ id: u.id, name: u.name || null, email: u.email || null, google: !!u.google_sub, hasCode: !!u.code_hash, createdAt: u.created_at });

/* ---------- Google sign-in (ID token from Google Identity Services) ---------- */
let jwksCache = { keys: null, until: 0 };
async function googleKeys(force) {
  if (!force && jwksCache.keys && Date.now() < jwksCache.until) return jwksCache.keys;
  const r = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  if (!r.ok) throw new HttpError(502, "Couldn't reach Google. Try again in a moment.");
  const maxAge = +((r.headers.get("cache-control") || "").match(/max-age=(\d+)/) || [0, 3600])[1];
  jwksCache = { keys: (await r.json()).keys, until: Date.now() + Math.min(maxAge, 86400) * 1000 };
  return jwksCache.keys;
}
async function verifyGoogle(credential, env) {
  if (!env.GOOGLE_CLIENT_ID) throw new HttpError(503, "Google sign-in isn't set up yet.");
  if (typeof credential !== "string" || credential.split(".").length !== 3) throw new HttpError(400, "Missing Google sign-in.");
  const [h, p, s] = credential.split(".");
  let header, payload;
  try { header = JSON.parse(b64urlText(h)); payload = JSON.parse(b64urlText(p)); } catch (e) { throw new HttpError(400, "Bad Google sign-in."); }
  if (header.alg !== "RS256") throw new HttpError(400, "Bad Google sign-in.");
  let jwk = (await googleKeys()).find(k => k.kid === header.kid);
  if (!jwk) jwk = (await googleKeys(true)).find(k => k.kid === header.kid);
  if (!jwk) throw new HttpError(401, "Google sign-in couldn't be verified.");
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify("RSASSA-PKCS1-v1_5", key, b64urlBytes(s), new TextEncoder().encode(`${h}.${p}`));
  const now = Date.now() / 1000;
  if (!ok || !GOOGLE_ISSUERS.includes(payload.iss) || payload.aud !== env.GOOGLE_CLIENT_ID || !(payload.exp > now - 60) || !payload.sub)
    throw new HttpError(401, "Google sign-in couldn't be verified.");
  return payload;
}

/* ---------- helpers ---------- */
class HttpError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
function json(obj, status = 200) { return new Response(JSON.stringify(obj), { status, headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" } }); }
async function body(req, limit = 16384) {
  const text = await req.text();
  if (text.length > limit) throw new HttpError(413, "Request too large.");
  try { return text ? JSON.parse(text) : {}; } catch (e) { throw new HttpError(400, "Bad request."); }
}
function corsHeaders(origin, env) {
  const allowed = (env.ALLOWED_ORIGINS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!origin || !allowed.includes(origin)) return null;
  return { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization", "Access-Control-Max-Age": "86400", "Vary": "Origin" };
}
const newId = () => crypto.randomUUID();
function newCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(16)); let s = "";
  for (const b of bytes) s += CODE_ALPHABET[b % CODE_ALPHABET.length];   // 31 symbols, ~79 bits
  return `LUMEN-${s.slice(0, 4)}-${s.slice(4, 8)}-${s.slice(8, 12)}-${s.slice(12, 16)}`;
}
function normCode(code) {
  let s = String(code || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (s.startsWith("LUMEN") && s.length === 21) s = s.slice(5);
  return s;
}
async function sha256(text) { const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)); return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, "0")).join(""); }
function b64url(bytes) { let s = ""; for (const b of bytes) s += String.fromCharCode(b); return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); }
function b64urlBytes(str) { const s = atob(str.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((str.length + 3) % 4)); return Uint8Array.from(s, c => c.charCodeAt(0)); }
function b64urlText(str) { return new TextDecoder().decode(b64urlBytes(str)); }
const sleep = ms => new Promise(r => setTimeout(r, ms));

// For the unit test in test/google.mjs only
export const __test = { verifyGoogle, setKeys: keys => { jwksCache = { keys, until: Infinity }; } };
