/* =========================================================
   LUMEN BEASTS — cloud saves & accounts
   Sign in with Google (or an account code) and your collection
   is saved online and follows you between devices. Playing
   without signing in works exactly as before.
   Server: worker/ (Cloudflare Worker + D1). Setup: CLOUD-SETUP.md
   ========================================================= */
window.Cloud = (() => {
  const G = window.Game, CFG = window.CLOUD_CONFIG || {};
  const API = (CFG.api || "").replace(/\/+$/, ""), GOOGLE_ID = CFG.googleClientId || "";
  const enabled = !!API, KEY = "lumenbeasts.cloud.v1";
  const $ = s => document.querySelector(s), esc = s => window.UI.esc(String(s == null ? "" : s));

  let st = { token: null, user: null, version: 0, dirty: false, syncedAt: 0 };
  try { st = Object.assign(st, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) {} };

  let status = enabled ? (st.token ? "syncing" : "signedout") : "off";
  let applying = false, pushTimer = null, pushing = false, pushAgain = false, conflict = null, lastError = "";

  /* ---------- network ---------- */
  async function call(path, { method = "GET", body, keepalive } = {}) {
    const headers = { "content-type": "application/json" };
    if (st.token) headers.authorization = "Bearer " + st.token;
    let r;
    try { r = await fetch(API + path, { method, headers, body: body ? JSON.stringify(body) : undefined, keepalive }); }
    catch (e) { setStatus("offline"); throw Object.assign(new Error("You're offline. Your progress is still saved on this device."), { offline: true }); }
    let data = {}; try { data = await r.json(); } catch (e) {}
    if (r.status === 401 && st.token) { signOutLocal(); window.UI.toast("!", "You've been signed out", "Sign in again to keep syncing"); }
    return { status: r.status, data };
  }

  /* ---------- status pill in the header ---------- */
  const LABEL = { signedout: "Sign in to save online", syncing: "Syncing…", synced: "Saved online", offline: "Offline, saved on this device", conflict: "Choose which save to keep", error: "Sync problem" };
  function setStatus(s) {
    status = s; paintPill();
    // Update just the status line, so a code being shown or typed isn't wiped
    const el = $("#cloudPanel .cl-state");
    if (el) { el.dataset.state = s; el.textContent = (LABEL[s] || "") + (s === "synced" ? ` · ${ago(st.syncedAt)}` : "") + (s === "error" && lastError ? `: ${lastError}` : ""); }
    const sync = $("#clSync"), res = $("#clResolve");
    if (s === "conflict" && sync) sync.outerHTML = `<button class="btn btn-gold btn-sm" id="clResolve">Choose a save</button>`;
    if (s !== "conflict" && res) res.outerHTML = `<button class="btn btn-ghost btn-sm" id="clSync">Sync now</button>`;
  }
  function paintPill() {
    const b = $("#btnCloud"); if (!b) return;
    b.hidden = !enabled; b.dataset.state = status; b.title = LABEL[status] || "Cloud save";
    b.setAttribute("aria-label", "Cloud save: " + (LABEL[status] || ""));
  }

  /* ---------- sync ---------- */
  function apply(code, version) {
    applying = true;
    const ok = G.importCode(code);
    applying = false;
    if (!ok) { lastError = "The cloud save couldn't be read."; setStatus("error"); return false; }
    st.version = version; st.dirty = false; st.syncedAt = Date.now(); persist();
    window.UI.refreshChrome(); window.UI.render();
    return true;
  }
  async function pull() {
    if (!st.token) return;
    setStatus("syncing");
    try {
      const { status: code, data } = await call("/save");
      if (code !== 200) throw new Error(data.error || "Couldn't load your cloud save.");
      if (!data.save) { st.version = 0; st.dirty = true; persist(); return push(); }       // brand-new account: upload this device
      if (data.version === st.version) { if (st.dirty) return push(); st.syncedAt = Date.now(); persist(); return setStatus("synced"); }
      // The cloud has something newer than what this device last synced
      if (!st.dirty || data.save === G.exportCode()) { apply(data.save, data.version); return setStatus("synced"); }
      return askWhich(data);
    } catch (e) { if (!e.offline) { lastError = e.message; setStatus("error"); } }
  }
  async function push() {
    if (!st.token) return;
    if (pushing) { pushAgain = true; return; }
    pushing = true; clearTimeout(pushTimer); setStatus("syncing");
    try {
      const save = G.exportCode();
      const { status: code, data } = await call("/save", { method: "PUT", body: { save, baseVersion: st.version } });
      if (code === 200) {
        st.version = data.version; st.syncedAt = Date.now();
        if (save === G.exportCode()) st.dirty = false;
        persist(); setStatus("synced");
      } else if (code === 409) {
        if (data.save === save) { st.version = data.version; st.dirty = false; persist(); setStatus("synced"); }
        else if (G.summarize().fresh) { apply(data.save, data.version); setStatus("synced"); }
        else askWhich(data);
      } else throw new Error(data.error || "Couldn't save online.");
    } catch (e) { if (!e.offline) { lastError = e.message; setStatus("error"); } }
    finally { pushing = false; if (pushAgain) { pushAgain = false; schedulePush(500); } }
  }
  function schedulePush(ms = 3000) { clearTimeout(pushTimer); pushTimer = setTimeout(push, ms); }

  // Every local save marks the cloud copy out of date, then uploads a few seconds later
  G.onSave(() => {
    if (applying || !st.token) return;
    st.dirty = true; persist();
    if (status !== "conflict") schedulePush();
  });
  // Last-chance upload when the tab is hidden; check for changes from other devices when it comes back
  document.addEventListener("visibilitychange", () => {
    if (!st.token || status === "conflict") return;
    if (document.visibilityState === "hidden" && st.dirty) {
      clearTimeout(pushTimer);
      call("/save", { method: "PUT", keepalive: true, body: { save: G.exportCode(), baseVersion: st.version } })
        .then(({ status: c, data }) => { if (c === 200) { st.version = data.version; st.dirty = false; st.syncedAt = Date.now(); persist(); } }).catch(() => {});
    } else if (document.visibilityState === "visible") pull();
  });
  window.addEventListener("online", () => { if (st.token) pull(); });

  /* ---------- "which save do you want?" ---------- */
  function askWhich(server) {
    conflict = server; setStatus("conflict");
    const here = G.summarize(), there = G.summarize(server.save) || {};
    const col = (title, s, btn, id) => `<div class="cl-choice"><h3>${title}</h3><ul>
<li><b>${s.species || 0}</b> of 120 creatures</li><li><b>${(s.packs || 0).toLocaleString()}</b> ${s.packs === 1 ? "pack" : "packs"} opened</li><li><b>${(s.wins || 0).toLocaleString()}</b> battle ${s.wins === 1 ? "win" : "wins"}</li><li><b>${(s.dust || 0).toLocaleString()}</b> Shard Dust</li>
<li class="cl-when">Last played ${ago(s.lastPlayed)}</li></ul><button class="btn ${id === "clKeepCloud" ? "btn-gold" : "btn-ghost"}" id="${id}">${btn}</button></div>`;
    window.UI.openModal(`<div class="cloud-modal"><h2>Which collection do you want to keep?</h2>
<p>Your account already has a cloud save that's different from the collection on this device. Pick one. The other will be replaced.</p>
<div class="cl-choices">${col("Cloud save", there, "Use cloud save", "clKeepCloud")}${col("This device", here, "Keep this device's", "clKeepLocal")}</div>
<p class="cl-fine">Tip: if you're not sure, keep the one with more creatures. You can also back up this device first from Settings.</p></div>`, "narrow");
  }
  function resolve(useCloud) {
    const c = conflict; if (!c) return; conflict = null;
    window.UI.closeModal();
    if (useCloud) { apply(c.save, c.version); setStatus("synced"); window.UI.toast("☁", "Cloud save loaded"); }
    else { st.version = c.version; st.dirty = true; persist(); push().then(() => window.UI.toast("☁", "This device's collection is now your cloud save")); }
  }

  /* ---------- sign in / out ---------- */
  async function finishSignIn(data, msg) {
    st = { token: data.token, user: data.user, version: 0, dirty: true, syncedAt: 0 }; persist();
    window.UI.toast("☁", msg || "Signed in", "Your collection now saves online");
    await pull();
    renderPanel();
  }
  async function signInGoogle(credential) {
    if (st.token) return linkGoogle(credential);
    const { status: c, data } = await call("/auth/google", { method: "POST", body: { credential } });
    if (c !== 200) return panelError(data.error || "Google sign-in didn't work.");
    finishSignIn(data, `Signed in as ${data.user.name || data.user.email || "you"}`);
  }
  async function linkGoogle(credential) {
    const { status: c, data } = await call("/me/google", { method: "POST", body: { credential } });
    if (c !== 200) return panelError(data.error || "Couldn't link Google.");
    st.user = data.user; persist(); window.UI.toast("✓", "Google account linked"); renderPanel();
  }
  async function newCodeAccount() {
    const { status: c, data } = await call("/auth/code/new", { method: "POST" });
    if (c !== 200) return panelError(data.error || "Couldn't create an account.");
    await finishSignIn(data, "Account created");
    showCode(data.code, true);
  }
  async function signInCode(code) {
    const { status: c, data } = await call("/auth/code", { method: "POST", body: { code } });
    if (c !== 200) return panelError(data.error || "That code didn't work.");
    finishSignIn(data);
  }
  async function makeCode() {
    const { status: c, data } = await call("/me/code", { method: "POST" });
    if (c !== 200) return panelError(data.error || "Couldn't make a code.");
    st.user = Object.assign({}, st.user, { hasCode: true }); persist(); showCode(data.code, false);
  }
  function signOutLocal() { st = { token: null, user: null, version: 0, dirty: false, syncedAt: 0 }; persist(); clearTimeout(pushTimer); setStatus("signedout"); }
  async function signOut() {
    if (st.dirty) await push();
    call("/logout", { method: "POST" }).catch(() => {});
    signOutLocal(); window.UI.toast("☁", "Signed out", "This device keeps a copy of your collection"); renderPanel();
  }

  /* ---------- account panel ---------- */
  function ago(t) {
    if (!t) return "never"; const s = Math.round((Date.now() - t) / 1000);
    return s < 60 ? "just now" : s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.round(s / 3600)} h ago` : `${Math.round(s / 86400)} days ago`;
  }
  function panelHTML() {
    if (!enabled) return `<div id="cloudPanel"></div>`;
    if (!st.token) return `<div id="cloudPanel" class="cl-panel">
<p>Sign in to save your collection online. It'll be safe if you clear your browser, and you can keep playing on your phone or another computer.</p>
${GOOGLE_ID ? `<div id="gsiBtn" class="gsi-slot"></div><div class="cl-or"><span>or</span></div>` : ""}
<div class="cl-code-box"><b>No Google account?</b> Use an account code instead: a private code that signs you in on any device.
<div class="row-btns"><button class="btn btn-ghost btn-sm" id="clNewCode">Create an account code</button></div>
<div class="cl-enter"><input id="clCodeIn" placeholder="LUMEN-XXXX-XXXX-XXXX-XXXX" autocomplete="off" spellcheck="false" aria-label="Account code"><button class="btn btn-ghost btn-sm" id="clUseCode">Sign in</button></div></div>
<p class="cl-err" id="clErr" role="alert"></p>
<p class="cl-fine">Your current collection on this device is uploaded when you sign in. We only store your save, your Google name and email, and nothing else.</p></div>`;
    const u = st.user || {}, who = u.name || u.email ? `${esc(u.name || "")}${u.email ? ` <span>${esc(u.email)}</span>` : ""}` : "Account code account";
    return `<div id="cloudPanel" class="cl-panel">
<div class="cl-who"><span class="cl-avatar">${esc(((u.name || u.email || "☁")[0] || "☁").toUpperCase())}</span><div><b>${who}</b><small class="cl-state" data-state="${status}">${esc(LABEL[status] || "")}${status === "synced" ? ` · ${ago(st.syncedAt)}` : ""}${status === "error" && lastError ? `: ${esc(lastError)}` : ""}</small></div></div>
<div class="row-btns">${status === "conflict" ? `<button class="btn btn-gold btn-sm" id="clResolve">Choose a save</button>` : `<button class="btn btn-ghost btn-sm" id="clSync">Sync now</button>`}
<button class="btn btn-ghost btn-sm" id="clCode">${u.hasCode ? "Get a new account code" : "Make a backup account code"}</button>
<button class="btn btn-ghost btn-sm" id="clOut">Sign out</button></div>
${!u.google && GOOGLE_ID ? `<div class="cl-link"><small>Link a Google account so you can sign in with one click:</small><div id="gsiBtn" class="gsi-slot"></div></div>` : ""}
<div id="clCodeShow"></div><p class="cl-err" id="clErr" role="alert"></p></div>`;
  }
  function panelError(msg) { const e = $("#clErr"); if (e) e.textContent = msg; else window.UI.toast("!", msg); }
  function showCode(code, isNew) {
    const box = $("#clCodeShow") || (open(), $("#clCodeShow")); if (!box) return;
    box.innerHTML = `<div class="cl-code-reveal"><b>${isNew ? "Your account code" : "Your new account code"}</b>
<code id="clCodeText">${esc(code)}</code><div class="row-btns"><button class="btn btn-gold btn-sm" id="clCopy">Copy code</button></div>
<small>Write it down or save it somewhere safe. It signs in to your collection on any device, so keep it private. ${isNew ? "We can't show it again." : "Your old code no longer works."}</small></div>`;
  }
  let gsiLoading = null;
  function loadGsi() {
    if (window.google && google.accounts && google.accounts.id) return Promise.resolve();
    return gsiLoading || (gsiLoading = new Promise((res, rej) => { const s = document.createElement("script"); s.src = "https://accounts.google.com/gsi/client"; s.async = true; s.onload = res; s.onerror = () => { gsiLoading = null; rej(); }; document.head.appendChild(s); }));
  }
  function bindPanel() {
    const slot = $("#gsiBtn"); if (!slot || !GOOGLE_ID) return;
    loadGsi().then(() => {
      google.accounts.id.initialize({ client_id: GOOGLE_ID, callback: r => signInGoogle(r.credential), cancel_on_tap_outside: true });
      if ($("#gsiBtn")) google.accounts.id.renderButton($("#gsiBtn"), { theme: "filled_black", size: "large", shape: "pill", text: st.token ? "continue_with" : "signin_with", width: 260 });
    }).catch(() => { if ($("#gsiBtn")) $("#gsiBtn").innerHTML = `<small>Google sign-in couldn't load. Check your connection or ad blocker, or use an account code.</small>`; });
  }
  function renderPanel() { const p = $("#cloudPanel"); if (p) { p.outerHTML = panelHTML(); bindPanel(); } }
  function open() {
    if (status === "conflict" && conflict) return askWhich(conflict);
    window.UI.openModal(`<div class="cloud-modal"><h2>☁ Cloud save</h2>${panelHTML()}</div>`, "narrow"); bindPanel();
  }

  document.addEventListener("click", e => {
    const t = e.target;
    if (t.closest("#btnCloud") || t.closest("#openCloud")) { open(); return; }
    if (t.closest("#clKeepCloud")) return resolve(true);
    if (t.closest("#clKeepLocal")) return resolve(false);
    if (t.closest("#clResolve")) return conflict && askWhich(conflict);
    if (t.closest("#clSync")) { pull(); return; }
    if (t.closest("#clOut")) { signOut(); return; }
    if (t.closest("#clCode")) { makeCode(); return; }
    if (t.closest("#clNewCode")) { newCodeAccount(); return; }
    if (t.closest("#clUseCode")) { const v = ($("#clCodeIn") || {}).value || ""; if (v.trim()) signInCode(v); else panelError("Type or paste your account code first."); return; }
    if (t.closest("#clCopy")) { const v = $("#clCodeText").textContent; (navigator.clipboard ? navigator.clipboard.writeText(v) : Promise.reject()).then(() => window.UI.toast("✓", "Account code copied")).catch(() => window.UI.toast("!", "Select the code and copy it manually")); }
  });
  document.addEventListener("keydown", e => { if (e.key === "Enter" && e.target.id === "clCodeIn") $("#clUseCode").click(); });

  /* ---------- start ---------- */
  paintPill();
  if (enabled && st.token) {
    call("/me").then(({ status: c, data }) => { if (c === 200) { st.user = data.user; persist(); } }).catch(() => {});
    pull();
  }

  return { enabled, open, panelHTML, bindPanel, get status() { return status; }, get signedIn() { return !!st.token; }, sync: pull };
})();
