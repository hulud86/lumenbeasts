// Unit test for Google ID-token checks, using a locally generated key: node test/google.mjs
import { __test } from "../src/index.js";
const { subtle } = globalThis.crypto;
const kp = await subtle.generateKey({ name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["sign", "verify"]);
const jwk = { ...(await subtle.exportKey("jwk", kp.publicKey)), kid: "k1", alg: "RS256", use: "sig" };
__test.setKeys([jwk]);
const b64 = o => Buffer.from(typeof o === "string" ? o : JSON.stringify(o)).toString("base64url");
async function token(p, kid = "k1") {
  const h = b64({ alg: "RS256", kid, typ: "JWT" }), b = b64(p);
  const sig = Buffer.from(await subtle.sign("RSASSA-PKCS1-v1_5", kp.privateKey, new TextEncoder().encode(`${h}.${b}`))).toString("base64url");
  return `${h}.${b}.${sig}`;
}
const env = { GOOGLE_CLIENT_ID: "cid.apps.googleusercontent.com" }, now = Math.floor(Date.now() / 1000);
const good = { iss: "https://accounts.google.com", aud: env.GOOGLE_CLIENT_ID, sub: "123", email: "a@b.c", name: "Ann", exp: now + 3600 };
let pass = 0, fail = 0;
const expect = async (label, p, shouldPass, kid) => { try { await __test.verifyGoogle(await token(p, kid), env); shouldPass ? pass++ : (fail++, console.log("FAIL (accepted):", label)); } catch (e) { shouldPass ? (fail++, console.log("FAIL (rejected):", label, e.message)) : pass++; } };
await expect("valid", good, true);
await expect("wrong audience", { ...good, aud: "other" }, false);
await expect("wrong issuer", { ...good, iss: "https://evil.example" }, false);
await expect("expired", { ...good, exp: now - 3600 }, false);
const t = await token(good); const parts = t.split(".");
try { await __test.verifyGoogle(parts[0] + "." + b64({ ...good, sub: "999" }) + "." + parts[2], env); fail++; console.log("FAIL: tampered accepted"); } catch (e) { pass++; }
console.log(`${pass} passed, ${fail} failed`); process.exit(fail ? 1 : 0);
