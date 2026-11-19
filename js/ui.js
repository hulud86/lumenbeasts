/* =========================================================
   LUMEN BEASTS — interface
   Hash routes: #home #packs #collection #encyclopedia #achievements
   ========================================================= */
(function () {
  const C = window.CONFIG, G = window.Game, Art = window.Art;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const pad = n => String(n).padStart(3, "0");
  const RAR = C.rarities, EL = C.elements;
  const view = $("#view");

  document.title = `${C.gameName} — ${C.tagline}`;
  $("#logoWord").textContent = C.gameName;

  /* ---------- icons ---------- */
  const I = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M3 11 12 4l9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/></svg>',
    packs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M5 6h14M5 18h14M12 9l2 3-2 3-2-3Z"/></svg>',
    collection: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="3" y="5" width="11" height="15" rx="2"/><path d="M17 4.5l3.5 1.2-4 13.4"/><path d="M14 3.5l3 .8"/></svg>',
    encyclopedia: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5Z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3"/><path d="M9 8h7M9 11.5h5"/></svg>',
    achievements: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/></svg>',
    sword: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14.5 2H22v7.5L11.8 19.7l1.4 1.4-1.4 1.4-2.8-2.8-3.5 3.5-2.1-2.1 3.5-3.5L4.1 14.8l1.4-1.4 1.4 1.4Z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2 4 5v6c0 5.5 3.4 9.7 8 11 4.6-1.3 8-5.5 8-11V5Z"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H20v15H5.5A1.5 1.5 0 0 0 4 19.5Z"/><path d="M4 19.5A1.5 1.5 0 0 0 5.5 21H20v-3"/></svg>',
    gem: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M6 3h12l4 6-10 12L2 9Z"/><path d="M2 9h20M9 3l3 18 3-18"/></svg>',
    crown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="m3 7 5 4 4-7 4 7 5-4-2 12H5Z"/></svg>',
    compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5Z"/></svg>',
    star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="m12 3 2.7 5.8 6.3.7-4.7 4.3 1.3 6.2L12 17l-5.6 3 1.3-6.2L3 9.5l6.3-.7Z"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/></svg>',
    heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M12 20s-7-4.4-9-9a4.8 4.8 0 0 1 9-3 4.8 4.8 0 0 1 9 3c-2 4.6-9 9-9 9Z"/></svg>',
    pack: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M12 9l2 3-2 3-2-3Z"/></svg>',
    shard: '<svg viewBox="0 0 32 32"><path d="M16 2 L25 13 L19 30 L13 30 L7 13Z" fill="#ffd27a" stroke="#7ef0ff" stroke-width="1.5"/><path d="M16 2 L16 30 M7 13 L16 17 L25 13" stroke="#fff" stroke-width=".8" opacity=".7" fill="none"/></svg>'
  };
  const NAV = [["home", "Home"], ["packs", "Open Packs"], ["collection", "My Collection"], ["encyclopedia", "Encyclopedia"], ["achievements", "Achievements"]];
  const SHORT = { home: "Home", packs: "Packs", collection: "Collection", encyclopedia: "Encyclopedia", achievements: "Awards" };

  /* ---------- sound (tiny WebAudio synth, no files) ---------- */
  const Sfx = (() => {
    let ctx;
    function tone(freq, t0, dur, type = "sine", vol = .08) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.value = freq; g.gain.setValueAtTime(0, ctx.currentTime + t0);
      g.gain.linearRampToValueAtTime(vol, ctx.currentTime + t0 + .01); g.gain.exponentialRampToValueAtTime(.0001, ctx.currentTime + t0 + dur);
      o.connect(g).connect(ctx.destination); o.start(ctx.currentTime + t0); o.stop(ctx.currentTime + t0 + dur + .05);
    }
    const SETS = {
      flip: [[660, 0, .08, "triangle", .05]], tear: [[180, 0, .25, "sawtooth", .04], [360, .05, .2, "triangle", .05]],
      rare: [[660, 0, .3], [880, .08, .3], [1320, .16, .4]],
      epic: [[523, 0, .4, "triangle"], [784, .1, .4, "triangle"], [1046, .2, .5, "triangle"], [1568, .3, .6]],
      mythic: [[392, 0, .6, "triangle", .1], [523, .12, .6, "triangle"], [784, .24, .6, "triangle"], [1046, .36, .8], [1568, .5, 1], [2093, .64, 1.2, "sine", .05]],
      claim: [[784, 0, .15], [1175, .08, .3]]
    };
    return { play(name) {
      if (!G.state.sound) return;
      try { ctx = ctx || new (window.AudioContext || window.webkitAudioContext)(); if (ctx.state === "suspended") ctx.resume(); (SETS[name] || []).forEach(a => tone(...a)); } catch (e) {}
    } };
  })();

  /* ---------- card markup ---------- */
  function cardStyle(cr) { const e = EL[cr.element]; return `--el:${e.main};--el-dark:${e.dark}`; }
  function gems(r) { return `<span class="gems">${"<i></i>".repeat(RAR[r].gems)}</span>`; }
  function cardHTML(cr, o = {}) {
    const known = o.known !== false;
    if (!known) {
      return `<div class="card mystery" data-id="${cr.id}" style="${cardStyle(cr)}" title="Undiscovered">
<div class="card-body"><div class="card-frame">
<div class="card-head"><span class="card-name">???</span><span class="card-el">${Art.icon(cr.element)}</span></div>
<div class="card-art"><img src="${Art.silUri(cr)}" alt="Undiscovered creature silhouette" loading="lazy"><span class="card-no">#${pad(cr.id)}</span></div>
<div class="card-type"><span class="species">${EL[cr.element].label} · Unknown</span>${gems(cr.rarity)}</div>
<div class="card-text"><span class="q">?</span></div>
<div class="card-foot"><span class="stat-chip stat-atk">${I.sword}??</span><span class="set-code">${esc(C.setName)} · ${pad(cr.id)}/${G.ALL.length}</span><span class="stat-chip stat-def">${I.shield}??</span></div>
</div></div></div>`;
    }
    const full = ["rare", "epic", "mythic"].includes(cr.rarity);
    return `<div class="card r-${cr.rarity}${full ? " full-art" : ""}${o.holo ? " holo" : ""}${o.tilt ? " tilt" : ""}" data-id="${cr.id}" style="${cardStyle(cr)}">
<div class="card-body"><div class="card-frame">
<div class="card-head"><span class="card-name">${esc(cr.name)}</span><span class="card-el" title="${EL[cr.element].label}">${Art.icon(cr.element)}</span></div>
<div class="card-art"><img src="${full ? Art.tallUri(cr) : Art.uri(cr)}" alt="${esc(cr.name)}" loading="lazy" draggable="false"><span class="card-no">#${pad(cr.id)}</span></div>
<div class="card-type"><span class="species">${cr.title ? `<span class="mythic-title">${esc(cr.title)}</span>` : full ? `<span class="illus-tag">✦ ${RAR[cr.rarity].label} Illustration</span>` : `${EL[cr.element].label} · ${esc(cr.species || RAR[cr.rarity].label)}`}</span>${gems(cr.rarity)}</div>
<div class="card-text"><div class="card-ab"><b>${esc(cr.ability.name)}</b> — ${esc(cr.ability.text)}</div><p class="card-flavor">${esc(cr.desc)}</p></div>
<div class="card-foot"><span class="stat-chip stat-atk" title="Attack">${I.sword}${cr.atk}</span><span class="set-code">${full ? "<b>★</b> " : ""}${esc(C.setName)} · ${pad(cr.id)}/${G.ALL.length}</span><span class="stat-chip stat-def" title="Defense">${I.shield}${cr.def}</span></div>
</div><div class="card-shine"></div><div class="card-holo"></div><div class="card-spark"></div>${o.holo ? `<div class="card-foil"></div><span class="holo-tag">✦ HOLO</span>` : ""}</div>
${o.count > 1 ? `<span class="card-badge badge-count">×${o.count}</span>` : ""}${o.holoCount ? `<span class="card-badge badge-holo">✦ Holo${o.holoCount > 1 ? " ×" + o.holoCount : ""}</span>` : ""}${o.isNew ? `<span class="card-badge badge-new">NEW</span>` : ""}
</div>`;
  }
  const backHTML = () => `<div class="card-back"><div class="card-back-in">${I.shard}<span class="bw">${esc(C.gameName.toUpperCase())}</span></div></div>`;
  function packHTML(label) {
    const hero = G.byId[10];
    return `<div class="pack" id="thePack"><div class="pack-glow"></div><div class="pack-foil">
<div class="pack-crimp top"></div><div class="pack-art"><img src="${Art.uri(hero)}" alt=""></div>
<div class="pack-title">${esc(C.gameName)}</div><div class="pack-sub">${esc(C.setName)} · 10 cards</div>
${label ? `<div class="pack-count">${esc(label)}</div>` : ""}<div class="pack-crimp bot"></div></div></div>`;
  }

  /* ---------- chrome: nav, top bar, timers ---------- */
  function navHTML() {
    const n = G.claimable();
    return NAV.map(([k, label]) => `<a class="navlink" href="#${k}" data-route="${k}">${I[k]}<span class="lbl lbl-full">${label}</span><span class="lbl lbl-short">${SHORT[k]}</span>${k === "achievements" && n ? `<span class="badge-dot">${n}</span>` : ""}${k === "packs" && G.packsAvailable() ? `<span class="badge-dot">${G.packsAvailable()}</span>` : ""}</a>`).join("");
  }
  function refreshChrome() {
    $("#mainnav").innerHTML = navHTML();
    $("#tabbar").innerHTML = navHTML();
    $$(".navlink").forEach(a => a.classList.toggle("active", a.dataset.route === current));
    const n = G.packsAvailable();
    $("#pillPackCount").textContent = n;
    $("#pillPacks").classList.toggle("ready", n > 0);
    $("#pillDust").textContent = G.state.dust.toLocaleString();
  }
  function fmt(ms) { const s = Math.ceil(ms / 1000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}`; }
  let wasReady = G.dailyReady();
  setInterval(() => {
    $$("[data-countdown]").forEach(el => el.textContent = fmt(G.msUntilDaily()));
    const r = G.dailyReady();
    if (r !== wasReady) { wasReady = r; refreshChrome(); if (r) { toast("✦", "Your free daily pack is ready!"); if (current === "home" || (current === "packs" && !session)) render(); } }
  }, 1000);

  /* ---------- toasts, modal, fx ---------- */
  function toast(icon, text, sub) {
    const t = document.createElement("div"); t.className = "toast";
    t.innerHTML = `<span class="ti">${icon}</span><div>${esc(text)}${sub ? `<small>${esc(sub)}</small>` : ""}</div>`;
    $("#toasts").appendChild(t); setTimeout(() => { t.style.transition = "opacity .4s"; t.style.opacity = 0; setTimeout(() => t.remove(), 400); }, 3200);
  }
  function openModal(html, cls = "") {
    $("#modalBody").innerHTML = html; const box = $(".modal-box"); box.className = "modal-box " + cls;
    $("#modal").hidden = false; document.body.style.overflow = "hidden";
  }
  function closeModal() { $("#modal").hidden = true; document.body.style.overflow = ""; }
  $("#modal").addEventListener("click", e => { if (e.target.closest("[data-close]")) closeModal(); });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

  function flash(color) { const d = document.createElement("div"); d.className = "flash"; d.style.background = `radial-gradient(circle at 50% 45%, ${color}, transparent 70%)`; $("#fx").appendChild(d); setTimeout(() => d.remove(), 800); }
  function particles(x, y, colors, n = 36) {
    for (let i = 0; i < n; i++) {
      const p = document.createElement("div"); p.className = "particle";
      const a = Math.random() * Math.PI * 2, d = 80 + Math.random() * 220;
      p.style.cssText = `left:${x}px;top:${y}px;background:${colors[i % colors.length]};--dx:${Math.cos(a) * d}px;--dy:${Math.sin(a) * d}px;box-shadow:0 0 8px ${colors[i % colors.length]}`;
      $("#fx").appendChild(p); setTimeout(() => p.remove(), 1200);
    }
  }
  function banner(text, color) {
    const b = document.createElement("div"); b.className = "rarity-banner"; b.textContent = text;
    b.style.cssText = `color:${color};text-shadow:0 0 24px ${color},0 4px 0 rgba(0,0,0,.4)`; $("#fx").appendChild(b); setTimeout(() => b.remove(), 1700);
  }

  // Holographic tilt for cards marked .tilt (and all cards on hover-capable screens)
  document.addEventListener("pointermove", e => {
    const card = e.target.closest(".card:not(.mystery)"); if (!card) return;
    const body = card.querySelector(".card-body"); const r = card.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    const k = card.classList.contains("tilt") ? 16 : 8;
    body.style.setProperty("--ry", `${(px - .5) * k}deg`); body.style.setProperty("--rx", `${(.5 - py) * k}deg`);
    body.style.setProperty("--mx", `${px * 100}%`); body.style.setProperty("--my", `${py * 100}%`); body.style.setProperty("--hue", `${px * 120}deg`);
  });
  document.addEventListener("pointerout", e => {
    const card = e.target.closest(".card"); if (!card || card.contains(e.relatedTarget)) return;
    const body = card.querySelector(".card-body"); if (body) { body.style.setProperty("--rx", "0deg"); body.style.setProperty("--ry", "0deg"); }
  });

  /* ---------- inspector ---------- */
  function detailHTML(cr) {
    const owned = G.state.owned[cr.id] || 0;
    const e = EL[cr.element], r = RAR[cr.rarity];
    if (!owned) return `<div class="detail"><div class="tags"><span class="tag">#${pad(cr.id)}</span><span class="tag">${Art.icon(cr.element, 14)} ${e.label}</span><span class="tag rar" style="--rc:${r.color}">${r.label}</span></div>
<h2>Undiscovered</h2><p class="locked-note">This creature hasn't appeared in your packs yet. It lives on ${esc(e.isle)}. Keep opening Shard Packs to reveal it.</p></div>`;
    const first = G.state.firstSeen[cr.id];
    const meter = (v, c) => `<div class="meter"><i style="width:${v}%;background:${c}"></i></div>`;
    return `<div class="detail">
<h2>${esc(cr.name)}</h2>${cr.title ? `<div class="title">${esc(cr.title)}</div>` : ""}
<div class="tags"><span class="tag">#${pad(cr.id)}</span><span class="tag">${Art.icon(cr.element, 14)} ${e.label}</span><span class="tag rar" style="--rc:${r.color}">${r.label}</span><span class="tag">Owned ×${owned}</span>${(G.state.holo || {})[cr.id] ? `<span class="tag" style="color:#b8f6ff">✦ Holo ×${G.state.holo[cr.id]}</span>` : ""}</div>
<p class="desc">${esc(cr.desc)}</p>
<div class="statgrid">
<div class="statbox"><div class="k">Attack</div><div class="v">${cr.atk}</div>${meter(cr.atk, "linear-gradient(90deg,#ff7a5c,#c8301a)")}</div>
<div class="statbox"><div class="k">Defense</div><div class="v">${cr.def}</div>${meter(cr.def, "linear-gradient(90deg,#5cb8ff,#1a5ac8)")}</div>
<div class="statbox"><div class="k">Ability</div><div class="v" style="font-size:15px">${esc(cr.ability.name)}</div><div style="font-size:13px;color:var(--muted);font-weight:700">${esc(cr.ability.text)}</div></div>
<div class="statbox"><div class="k">Personality</div><div class="v" style="font-size:15px">${esc(cr.trait)}</div><div style="font-size:13px;color:var(--muted);font-weight:700">Size: ${esc(cr.size)} · Home: ${esc(e.isle)}</div></div>
</div>
${cr.lore ? `<div class="lore">${esc(cr.lore)}</div>` : ""}
${first ? `<p class="locked-note" style="margin-top:12px;font-size:13px">First discovered ${new Date(first).toLocaleDateString()}</p>` : ""}
</div>`;
  }
  function inspect(id, holoView) {
    const cr = G.byId[id], owned = !!G.state.owned[id], hc = (G.state.holo || {})[id] || 0;
    const showHolo = holoView === undefined ? hc > 0 : holoView;
    const toggle = hc ? `<div class="row-btns" style="justify-content:center;margin-top:12px"><button class="btn btn-sm ${showHolo ? "btn-ghost" : "btn-gold"}" data-view="${id}:std">Standard</button><button class="btn btn-sm ${showHolo ? "btn-gold" : "btn-ghost"}" data-view="${id}:holo">✦ Holo ×${hc}</button></div>` : "";
    openModal(`<div class="dex-detail inspect" style="padding:0;background:none;border:0"><div>${cardHTML(cr, { known: owned, tilt: true, holo: showHolo && hc > 0 })}${toggle}</div>${detailHTML(cr)}</div>`);
  }

  /* ---------- views ---------- */
  let current = "home", session = null;
  const filters = { q: "", el: "all", rar: "all", sort: "id", missing: false, holo: false };
  const dexState = { q: "", el: "all", sel: 1 };

  function viewHome() {
    const S = G.state, d = G.discovered(), tot = G.ALL.length, pct = Math.round(d / tot * 100);
    const ready = G.dailyReady(), packs = G.packsAvailable();
    const recent = S.recent.slice(0, 6).map(id => G.byId[id]);
    const nextAch = G.ACH.map(a => ({ a, s: G.achStatus(a) })).filter(x => !x.s.claimed).sort((x, y) => (y.s.done - x.s.done) || (y.s.p / y.a.goal - x.s.p / x.a.goal)).slice(0, 3);
    const elRows = Object.entries(EL).map(([k, e]) => { const have = G.ownedOf(c => c.element === k), all = G.ALL.filter(c => c.element === k).length;
      return `<div class="bar-row"><span>${Art.icon(k, 20)}</span><span>${e.label}</span><div class="bar"><i style="width:${have / all * 100}%;--c1:${e.main};--c2:${e.light}"></i></div><span class="n">${have}/${all}</span></div>`; }).join("");
    const rarRows = Object.entries(RAR).map(([k, r]) => `<div class="rchip" style="--rc:${r.color}"><div class="t">${r.label}</div><div class="v">${G.ownedOf(c => c.rarity === k)}<small> / ${G.pools[k].length}</small></div></div>`).join("");
    return `
${G.tampered ? `<div class="notice">This save was edited outside the game. Everything still works, but progress may not be accurate.</div>` : ""}
${!G.storageOK ? `<div class="notice">Your browser is blocking local storage (private mode?), so progress won't be saved after you close this tab.</div>` : ""}
<section class="hero panel">
  <div>
    <div class="kicker">${d ? "Welcome back, Collector" : "Welcome to " + esc(C.gameName)}</div>
    <h1 class="h-display">${ready ? "Your daily Shard Pack is ready" : packs ? `You have ${packs} pack${packs > 1 ? "s" : ""} waiting` : "The moon is recharging"}</h1>
    <p>${d ? `When the moon Lumen shattered, every shard that fell awoke a beast of light: the Lumen Beasts. You've found <b>${d}</b> of ${tot}.` : `When the moon Lumen shattered, every shard that fell awoke a beast of light: the Lumen Beasts. Open your welcome packs to start your collection.`}</p>
    <div class="hero-actions">
      <a class="btn btn-gold" href="#packs" ${packs ? "" : 'aria-disabled="true"'}>${packs ? "Open a Shard Pack" : "View packs"}</a>
      <span class="timer">${ready ? "Free pack: <b>Ready</b>" : `Next free pack in <b data-countdown>${fmt(G.msUntilDaily())}</b>`}</span>
    </div>
  </div>
  <div class="hero-pack"><a href="#packs" aria-label="Open packs">${packHTML(packs ? `${packs} READY` : "")}</a></div>
</section>
<div class="stats">
  <div class="stat panel stat-ring"><div class="ring" style="--p:${pct}" data-label="${pct}%"></div><div><div class="k">Collection</div><div class="v">${d}<small> / ${tot}</small></div></div></div>
  <div class="stat panel"><div class="k">Cards owned</div><div class="v">${G.totalCards()}</div></div>
  <div class="stat panel"><div class="k">Packs opened</div><div class="v">${S.packsOpened}</div></div>
  <div class="stat panel"><div class="k">Holo cards</div><div class="v">${G.holoCount()}</div></div>
  <div class="stat panel"><div class="k">Shard Dust</div><div class="v">${S.dust}</div></div>
  <div class="stat panel"><div class="k">Awards</div><div class="v">${Object.keys(S.achievements).length}<small> / ${G.ACH.length}</small></div></div>
</div>
<h2 class="h-section">Recent discoveries <small>${recent.length ? "" : "nothing yet"}</small></h2>
${recent.length ? `<div class="grid small">${recent.map(cr => cardHTML(cr, { count: S.owned[cr.id], holo: !!(S.holo || {})[cr.id] })).join("")}</div>` : `<div class="panel empty">Your newest creatures will appear here after you open a pack.</div>`}
<div class="two-col">
  <div><h2 class="h-section">By element</h2><div class="panel bars">${elRows}</div></div>
  <div><h2 class="h-section">By rarity</h2><div class="panel rarity-row">${rarRows}</div>
    <h2 class="h-section">Next awards</h2><div class="ach-grid" style="grid-template-columns:1fr">${nextAch.map(x => achHTML(x.a)).join("")}</div></div>
</div>`;
  }

  function viewPacks() {
    if (session) return revealHTML();
    const packs = G.packsAvailable(), S = G.state, canBuy = S.dust >= C.dustPackCost;
    const w = C.pack.specialWeights, wt = Object.values(w).reduce((a, b) => a + b, 0);
    return `<div class="pack-stage">
<div><h1 class="h-display">Open Shard Packs</h1><p class="sub" style="margin:0">Each pack holds 6 Common, 3 Uncommon and 1 bonus card that could be anything up to Mythic.</p></div>
${packHTML(packs ? `${packs} PACK${packs > 1 ? "S" : ""} READY` : "NO PACKS")}
${packs ? `<button class="btn btn-gold" id="btnOpen">Tear it open</button><div class="hint">Or tap the pack</div>`
          : `<div class="timer">Next free pack in <b data-countdown>${fmt(G.msUntilDaily())}</b></div>`}
<div class="pack-tools">
  <button class="btn btn-ghost btn-sm" id="btnBuy" ${canBuy ? "" : "disabled"}><span class="dust-ico"></span> Trade ${C.dustPackCost} Shard Dust for a pack</button>
  <button class="btn btn-ghost btn-sm" id="btnOdds">Pack odds</button>
</div>
<p class="sub" style="max-width:520px">${G.dailyReady() ? "Your free daily pack opens first." : "You get one free pack every " + C.dailyCooldownHours + " hours."} Duplicates turn into Shard Dust (you have ${S.dust}).</p>
</div>`;
  }
  function oddsHTML() {
    const w = C.pack.specialWeights, wt = Object.values(w).reduce((a, b) => a + b, 0);
    return `<div class="settings"><h2>Pack odds</h2><p>Every pack holds 10 cards: ${C.pack.slots.map(s => `${s.count} ${s.rarity === "special" ? "bonus" : RAR[s.rarity].label}`).join(", ")}. The bonus card rolls on these chances:</p>
<div class="summary-stats">${Object.entries(w).map(([k, v]) => `<div class="rchip" style="--rc:${RAR[k].color}"><div class="t">${RAR[k].label}</div><div class="v">${(v / wt * 100).toFixed(v / wt < .1 ? 1 : 0)}%</div></div>`).join("")}</div>
<p>Any card can also come out as a <b>Holo</b> version (${Math.round((C.holoChance || 0) * 100)}% chance per card, about ${Math.round((1 - Math.pow(1 - (C.holoChance || 0), 10)) * 100)}% of packs have at least one). Holos are tracked separately in your collection.</p><p>No creature appears twice in the same pack. Duplicate copies across packs give Shard Dust: ${Object.entries(C.dustPerDuplicate).map(([k, v]) => `${RAR[k].label} ${v}`).join(" · ")}.</p></div>`;
  }

  function revealHTML() {
    const s = session, allOpen = s.opened.size === s.cards.length;
    return `<div class="reveal-wrap">
<div style="text-align:center"><h1 class="h-display">${allOpen ? "Pack opened!" : "Tap each card to reveal it"}</h1><p class="sub" style="margin:0">${s.opened.size} / ${s.cards.length} revealed</p></div>
<div class="reveal-bar">${allOpen ? `<button class="btn btn-gold" id="btnSummary">See results</button>` : `<button class="btn btn-gold" id="btnRevealAll">Reveal all</button>`}</div>
<div class="reveal-grid">${s.cards.map((c, i) => {
      const r = c.creature.rarity, open = s.opened.has(i);
      return `<div class="flip ${open ? "open" : ""} r-${r} ${["rare", "epic", "mythic"].includes(r) ? "tease-" + r : ""}${c.holo ? " tease-holo" : ""}" data-i="${i}" style="--i:${i}"><div class="flip-in">${cardHTML(c.creature, { isNew: c.isNew && open, holo: c.holo })}${backHTML()}</div></div>`;
    }).join("")}</div></div>`;
  }

  function sortList(list) {
    const S = G.state, f = filters.sort;
    const cmp = { id: (a, b) => a.id - b.id, name: (a, b) => a.name.localeCompare(b.name), rarity: (a, b) => RAR[b.rarity].order - RAR[a.rarity].order || a.id - b.id,
      atk: (a, b) => b.atk - a.atk, def: (a, b) => b.def - a.def, count: (a, b) => (S.owned[b.id] || 0) - (S.owned[a.id] || 0) || a.id - b.id,
      newest: (a, b) => (S.firstSeen[b.id] || 0) - (S.firstSeen[a.id] || 0) }[f];
    return list.sort(cmp);
  }
  function chipsHTML(state, key) {
    return `<div class="chips"><button class="chip ${state[key] === "all" ? "on" : ""}" data-${key}="all">All elements</button>${Object.entries(EL).map(([k, e]) => `<button class="chip ${state[key] === k ? "on" : ""}" data-${key}="${k}" style="--cc:${e.main}">${Art.icon(k, 14)} ${e.label}</button>`).join("")}</div>`;
  }
  function collectionList() {
    const S = G.state, q = filters.q.trim().toLowerCase();
    return sortList(G.ALL.filter(c => (!filters.holo || (S.holo || {})[c.id]) && (filters.missing || S.owned[c.id]) && (filters.el === "all" || c.element === filters.el) && (filters.rar === "all" || c.rarity === filters.rar)
      && (!q || (S.owned[c.id] && (c.name.toLowerCase().includes(q) || c.ability.name.toLowerCase().includes(q))) || String(c.id) === q.replace("#", ""))));
  }
  function collectionGrid() {
    const list = collectionList(), S = G.state;
    return `<p class="result-line">${list.length} card${list.length === 1 ? "" : "s"} shown · ${G.discovered()} of ${G.ALL.length} discovered (${Math.round(G.completion() * 100)}%) · ${G.totalCards()} total copies · ${G.holoCount()} holo</p>` +
      (list.length ? `<div class="grid">${list.map(c => cardHTML(c, { known: !!S.owned[c.id], count: S.owned[c.id], holo: !!(S.holo || {})[c.id], holoCount: (S.holo || {})[c.id] })).join("")}</div>`
        : `<div class="panel empty">${G.discovered() ? "No cards match these filters." : 'Your binder is empty. <a href="#packs">Open your first pack</a>.'}</div>`);
  }
  function viewCollection() {
    return `<h1 class="h-display">My Collection</h1><p class="sub">Every creature you've pulled, with how many copies you own. Tap a card to inspect it.</p>
<div class="toolbar panel">
<input class="search" id="fq" type="search" placeholder="Search by name, ability or #number" value="${esc(filters.q)}" aria-label="Search">
<select class="select" id="frar" aria-label="Rarity"><option value="all">All rarities</option>${Object.entries(RAR).map(([k, r]) => `<option value="${k}" ${filters.rar === k ? "selected" : ""}>${r.label}</option>`).join("")}</select>
<select class="select" id="fsort" aria-label="Sort">${[["id", "Number"], ["name", "Name"], ["rarity", "Rarity"], ["atk", "Attack"], ["def", "Defense"], ["count", "Copies owned"], ["newest", "Newest"]].map(([k, l]) => `<option value="${k}" ${filters.sort === k ? "selected" : ""}>Sort: ${l}</option>`).join("")}</select>
<label class="toggle"><input type="checkbox" id="fmiss" ${filters.missing ? "checked" : ""}> Show missing</label>
<label class="toggle"><input type="checkbox" id="fholo" ${filters.holo ? "checked" : ""}> Holo only</label>
${chipsHTML(filters, "el")}
</div><div id="collGrid">${collectionGrid()}</div>`;
  }

  function dexListHTML() {
    const S = G.state, q = dexState.q.trim().toLowerCase();
    const list = G.ALL.filter(c => (dexState.el === "all" || c.element === dexState.el) && (!q || String(c.id) === q.replace("#", "") || (S.owned[c.id] && c.name.toLowerCase().includes(q))));
    return list.map(c => { const k = !!S.owned[c.id];
      return `<button class="dex-row ${k ? "" : "unknown"} ${dexState.sel === c.id ? "sel" : ""}" data-dex="${c.id}" style="--rc:${k ? RAR[c.rarity].color : "#3a4068"}">
<span class="dex-thumb"><img src="${k ? Art.uri(c) : Art.silUri(c)}" alt="" loading="lazy"></span>
<span><span class="nm">${k ? esc(c.name) : "???"}</span><span class="meta">${Art.icon(c.element, 13)} ${EL[c.element].label} · <span style="color:${RAR[c.rarity].color}">${RAR[c.rarity].label}</span></span></span>
<span class="no">#${pad(c.id)}</span></button>`; }).join("") || `<div class="empty">No entries match.</div>`;
  }
  function dexDetailHTML() { const cr = G.byId[dexState.sel]; return `<div class="dex-detail panel">${cardHTML(cr, { known: !!G.state.owned[cr.id], tilt: true })}${detailHTML(cr)}</div>`; }
  function viewEncyclopedia() {
    return `<h1 class="h-display">Encyclopedia</h1><p class="sub">All ${G.ALL.length} creatures of Set 1 · ${esc(C.setName)}. You've recorded ${G.discovered()}. Undiscovered entries stay hidden until you pull them.</p>
<div class="toolbar panel"><input class="search" id="dq" type="search" placeholder="Search discovered names or #number" value="${esc(dexState.q)}" aria-label="Search encyclopedia">${chipsHTML(dexState, "dexel")}</div>
<div class="dex"><div class="dex-list panel" id="dexList">${dexListHTML()}</div><div class="dex-detail-wrap" id="dexDetail">${dexDetailHTML()}</div></div>`;
  }

  function achHTML(a) {
    const s = G.achStatus(a), rw = [a.reward.packs ? `${a.reward.packs} bonus pack${a.reward.packs > 1 ? "s" : ""}` : "", a.reward.dust ? `${a.reward.dust} Shard Dust` : ""].filter(Boolean).join(" + ");
    return `<div class="ach panel ${s.done ? "done" : ""} ${s.claimed ? "claimed" : ""}"><div class="ach-ico">${I[a.icon] || I.star}</div><div>
<h3>${esc(a.name)}</h3><p>${esc(a.desc)}</p>
<div class="prog"><div class="bar"><i style="width:${s.p / a.goal * 100}%;--c1:#ffc94a;--c2:#ff9a3d"></i></div>${s.p}/${a.goal}</div>
<div class="rw">Reward: ${rw}</div>
${s.done && !s.claimed ? `<button class="btn btn-gold btn-sm claim" data-claim="${a.id}">Claim reward</button>` : s.claimed ? `<div class="rw" style="color:var(--muted);margin-top:6px">✓ Claimed</div>` : ""}
</div></div>`;
  }
  function viewAchievements() {
    const done = G.ACH.filter(a => G.achStatus(a).done).length;
    return `<h1 class="h-display">Achievements</h1><p class="sub">Milestones for discovering creatures. Rewards are bonus packs and Shard Dust.</p>
<div class="ach-summary panel"><div class="ring" style="--p:${done / G.ACH.length * 100}" data-label="${done}/${G.ACH.length}"></div><div><b style="font-size:18px">${done} of ${G.ACH.length} unlocked</b><div style="color:var(--muted);font-weight:700">${G.claimable() ? `${G.claimable()} reward${G.claimable() > 1 ? "s" : ""} ready to claim` : "Keep collecting to unlock more."}</div></div>
${G.claimable() > 1 ? `<button class="btn btn-gold btn-sm" id="claimAll" style="margin-left:auto">Claim all</button>` : ""}</div>
<div class="ach-grid">${G.ACH.map(achHTML).join("")}</div>`;
  }

  /* ---------- render & routing ---------- */
  const VIEWS = { home: viewHome, packs: viewPacks, collection: viewCollection, encyclopedia: viewEncyclopedia, achievements: viewAchievements };
  function render() {
    view.innerHTML = VIEWS[current]();
    view.classList.remove("view-enter"); void view.offsetWidth; view.classList.add("view-enter");
    refreshChrome();
  }
  function route() {
    const h = location.hash.replace("#", "");
    const next = VIEWS[h] ? h : "home";
    if (next !== current) window.scrollTo(0, 0);
    current = next; render();
  }
  window.addEventListener("hashchange", route);
  $("#pillPacks").addEventListener("click", () => { location.hash = "packs"; });

  /* ---------- pack interactions ---------- */
  function startOpen() {
    const pack = $("#thePack"); if (!pack || pack.classList.contains("shake")) return;
    const result = G.openPack(); if (!result) return;
    Sfx.play("tear"); pack.classList.add("shake");
    setTimeout(() => { pack.classList.remove("shake"); pack.classList.add("burst"); flash("rgba(255,233,160,.8)"); }, 560);
    setTimeout(() => { session = { ...result, opened: new Set() }; render(); refreshChrome(); }, 1050);
  }
  function revealCard(i, quiet) {
    const s = session; if (!s || s.opened.has(i)) return;
    s.opened.add(i);
    const el = $(`.flip[data-i="${i}"]`); if (!el) return;
    el.classList.add("open");
    const c = s.cards[i], r = c.creature.rarity;
    if (c.isNew) { const card = el.querySelector(".card"); card.insertAdjacentHTML("beforeend", `<span class="card-badge badge-new">NEW</span>`); }
    const rect = el.getBoundingClientRect(), cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
    if (r === "mythic") { setTimeout(() => { flash("rgba(255,201,74,.9)"); particles(cx, cy, ["#ffc94a", "#ff6fd0", "#7ef0ff", "#fff"], 70); banner("Mythic!", "#ffc94a"); Sfx.play("mythic"); }, 250); }
    else if (r === "epic") { setTimeout(() => { flash("rgba(180,108,255,.7)"); particles(cx, cy, ["#b46cff", "#ffd1f2", "#fff"], 46); banner("Epic!", "#d6a8ff"); Sfx.play("epic"); }, 250); }
    else if (r === "rare") { setTimeout(() => { particles(cx, cy, ["#4aa8ff", "#bff3ff"], 24); Sfx.play("rare"); }, 250); }
    else if (!quiet && !c.holo) Sfx.play("flip");
    if (c.holo) setTimeout(() => { particles(cx, cy, ["#ff6fd0", "#ffd93b", "#5fffc8", "#4aa8ff", "#b46cff", "#fff"], 40); if (r !== "mythic" && r !== "epic") { banner("Holo!", "#fff"); flash("rgba(190,220,255,.55)"); Sfx.play("rare"); } }, 300);
    updateRevealHeader();
  }
  function updateRevealHeader() {
    const s = session, all = s.opened.size === s.cards.length;
    const h = $(".reveal-wrap h1"), sub = $(".reveal-wrap .sub"), bar = $(".reveal-bar");
    if (h) h.textContent = all ? "Pack opened!" : "Tap each card to reveal it";
    if (sub) sub.textContent = `${s.opened.size} / ${s.cards.length} revealed`;
    if (all && bar && !$("#btnSummary")) bar.innerHTML = `<button class="btn btn-gold" id="btnSummary">See results</button>`;
  }
  function revealAll() {
    const s = session; let k = 0;
    s.cards.forEach((c, i) => { if (!s.opened.has(i)) { setTimeout(() => revealCard(i, true), k * 140); k++; } });
    if (k) Sfx.play("flip");
  }
  function showSummary() {
    const s = session, news = s.cards.filter(c => c.isNew), dups = s.cards.filter(c => !c.isNew);
    const best = [...s.cards].sort((a, b) => RAR[b.creature.rarity].order - RAR[a.creature.rarity].order)[0];
    const rows = [...s.cards].sort((a, b) => (b.isNew - a.isNew) || RAR[b.creature.rarity].order - RAR[a.creature.rarity].order).map(c => {
      const cr = c.creature, r = RAR[cr.rarity];
      return `<div class="sum-row" data-inspect="${cr.id}" style="--rc:${r.color}"><span class="dex-thumb"><img src="${Art.uri(cr)}" alt=""></span><span><div class="nm">${esc(cr.name)}</div><div class="rr">${r.label}</div></span>${c.holo ? `<span class="tagholo">✦ HOLO</span>` : ""}${c.isNew ? `<span class="tagnew">NEW</span>` : `<span class="tagdup">×${c.count} · +${c.dust}</span>`}</div>`;
    }).join("");
    const more = G.packsAvailable();
    openModal(`<div class="summary-head"><h2>Pack results</h2><p class="sub" style="margin:4px 0 0">Best pull: <b style="color:${RAR[best.creature.rarity].color}">${esc(best.creature.name)}</b> (${RAR[best.creature.rarity].label})</p></div>
<div class="summary-stats">
<div class="rchip" style="--rc:#ff6fd0"><div class="t">New discoveries</div><div class="v">${news.length}</div></div>
<div class="rchip" style="--rc:#7ef0ff"><div class="t">Duplicates</div><div class="v">${dups.length}</div></div>
<div class="rchip" style="--rc:#ffc94a"><div class="t">Dust earned</div><div class="v">+${s.dust}</div></div>
<div class="rchip" style="--rc:#b8f6ff"><div class="t">Holos</div><div class="v">${s.cards.filter(c => c.holo).length}</div></div>
<div class="rchip" style="--rc:#5fd08a"><div class="t">Collection</div><div class="v">${G.discovered()}<small>/${G.ALL.length}</small></div></div></div>
${s.newAchievements.length ? `<div class="notice" style="background:rgba(255,201,74,.1);border-color:rgba(255,201,74,.4);color:#ffe7a8">🏆 Unlocked: ${s.newAchievements.map(a => esc(a.name)).join(", ")}. <a href="#achievements" data-close>Claim your rewards</a></div>` : ""}
<div class="summary-list">${rows}</div>
<div class="summary-actions">${more ? `<button class="btn btn-gold" id="sumAgain">Open another (${more})</button>` : ""}<a class="btn btn-ghost" href="#collection" data-close id="sumColl">View collection</a><button class="btn btn-ghost" data-close id="sumDone">Done</button></div>`);
    session.summarized = true;
  }
  function endSession() { session = null; }

  /* ---------- settings ---------- */
  function openSettings() {
    openModal(`<div class="settings"><h2>Settings</h2>
<section><h3>Sound</h3><label class="toggle"><input type="checkbox" id="setSound" ${G.state.sound ? "checked" : ""}> Play sound effects</label></section>
<section><h3>Back up or move your collection</h3><p>Your collection is saved in this browser only. Copy this code to back it up, or paste it on another device to continue there.</p>
<textarea id="saveCode" readonly>${G.exportCode()}</textarea><div class="row-btns" style="margin-top:8px"><button class="btn btn-ghost btn-sm" id="copyCode">Copy code</button></div>
<p style="margin-top:12px">Restore from a code:</p><textarea id="importCode" placeholder="Paste a save code here"></textarea><div class="row-btns" style="margin-top:8px"><button class="btn btn-ghost btn-sm" id="doImport">Restore</button></div></section>
<section><h3>How saving works</h3><p>This version keeps everything in your browser's local storage. That keeps it free and simple, but it means: clearing browser data erases progress, collections don't sync between devices automatically, and a determined player could edit their save or change their clock. Cloud accounts would fix these later.</p></section>
${C.devTools ? `<section><h3>Testing tools</h3><p>For development only. Turn off with <code>devTools: false</code> in js/config.js before launch.</p><div class="row-btns"><button class="btn btn-ghost btn-sm" id="devPack">Grant a test pack</button><button class="btn btn-ghost btn-sm" id="devOdds">Run odds test (20,000 packs)</button></div><pre id="devOut" style="font-size:12px;color:var(--muted);white-space:pre-wrap"></pre></section>` : ""}
<section><h3>Start over</h3><p>Erase this browser's collection and begin again with welcome packs.</p><button class="btn btn-ghost btn-sm" id="doReset" style="color:#ff9ab0">Reset collection</button><span id="resetConfirm"></span></section>
</div>`, "narrow");
  }
  $("#btnSettings").addEventListener("click", openSettings);

  /* ---------- event delegation ---------- */
  document.addEventListener("click", e => {
    const t = e.target;
    if (t.closest("#btnOpen") || (t.closest("#thePack") && current === "packs")) { startOpen(); return; }
    const flip = t.closest(".flip");
    if (flip && session) { const i = +flip.dataset.i; if (!session.opened.has(i)) revealCard(i); else inspect(session.cards[i].creature.id); return; }
    if (t.closest("#btnRevealAll")) { revealAll(); return; }
    if (t.closest("#btnSummary")) { showSummary(); return; }
    if (t.closest("#sumAgain")) { closeModal(); endSession(); render(); setTimeout(startOpen, 250); return; }
    if (t.closest("#sumColl") || t.closest("#sumDone") || (t.closest("[data-close]") && session && session.summarized)) { endSession(); if (current === "packs") render(); refreshChrome(); }
    if (t.closest("#btnBuy")) { if (G.buyPackWithDust()) { Sfx.play("claim"); toast("✦", "Bonus pack added", `-${C.dustPackCost} Shard Dust`); render(); } return; }
    if (t.closest("#btnOdds")) { openModal(oddsHTML(), "narrow"); return; }
    const claimBtn = t.closest("[data-claim]");
    if (claimBtn) { const r = G.claim(claimBtn.dataset.claim); if (r) { Sfx.play("claim"); const rc = claimBtn.getBoundingClientRect(); particles(rc.left + rc.width / 2, rc.top, ["#ffc94a", "#fff"], 24); toast("🏆", "Reward claimed", [r.packs ? `+${r.packs} pack${r.packs > 1 ? "s" : ""}` : "", r.dust ? `+${r.dust} dust` : ""].filter(Boolean).join(" · ")); render(); } return; }
    if (t.closest("#claimAll")) { G.ACH.forEach(a => G.claim(a.id)); Sfx.play("claim"); toast("🏆", "All rewards claimed"); render(); return; }
    const ins = t.closest("[data-inspect]"); if (ins) { inspect(+ins.dataset.inspect); return; }
    const vw = t.closest("[data-view]"); if (vw) { const [vid, mode] = vw.dataset.view.split(":"); inspect(+vid, mode === "holo"); return; }
    const dx = t.closest("[data-dex]");
    if (dx) { dexState.sel = +dx.dataset.dex; if (window.matchMedia("(max-width: 900px)").matches) inspect(dexState.sel); else { $("#dexDetail").innerHTML = dexDetailHTML(); $$(".dex-row").forEach(r => r.classList.toggle("sel", +r.dataset.dex === dexState.sel)); } return; }
    const chip = t.closest("[data-el]"); if (chip) { filters.el = chip.dataset.el; render(); return; }
    const dchip = t.closest("[data-dexel]"); if (dchip) { dexState.el = dchip.dataset.dexel; render(); return; }
    const card = t.closest(".card"); if (card && !t.closest(".modal") && !t.closest(".dex-detail")) { inspect(+card.dataset.id); return; }
    // settings
    if (t.closest("#copyCode")) { const ta = $("#saveCode"); ta.select(); (navigator.clipboard ? navigator.clipboard.writeText(ta.value) : Promise.reject()).then(() => toast("✓", "Save code copied")).catch(() => { try { document.execCommand("copy"); toast("✓", "Save code copied"); } catch (er) { toast("!", "Select the code and copy it manually"); } }); return; }
    if (t.closest("#doImport")) { if (G.importCode($("#importCode").value)) { closeModal(); toast("✓", "Collection restored"); session = null; render(); } else toast("!", "That code didn't work", "Check you copied all of it"); return; }
    if (t.closest("#doReset")) { $("#resetConfirm").innerHTML = ` <button class="btn btn-ghost btn-sm" id="doReset2" style="color:#ff6a8a;border-color:#ff6a8a">Yes, erase everything</button>`; return; }
    if (t.closest("#doReset2")) { G.reset(); session = null; closeModal(); toast("✓", "Collection reset", `${C.welcomePacks} welcome packs added`); render(); return; }
    if (t.closest("#devPack")) { G.grantTestPack(); refreshChrome(); toast("✦", "Test pack granted"); if (current === "packs" && !session) render(); return; }
    if (t.closest("#devOdds")) { const r = G.simulate(20000); $("#devOut").textContent = "Bonus slot (target " + JSON.stringify(C.pack.specialWeights) + "):\n" + Object.entries(r.specialSlot).map(([k, v]) => `  ${k.padEnd(9)} ${(v * 100).toFixed(2)}%`).join("\n") + "\nAverage cards per pack:\n" + Object.entries(r.perPack).map(([k, v]) => `  ${k.padEnd(9)} ${v.toFixed(3)}`).join("\n"); return; }
  });
  document.addEventListener("change", e => {
    const id = e.target.id;
    if (id === "setSound") { G.state.sound = e.target.checked; G.save(); }
    if (id === "frar") { filters.rar = e.target.value; $("#collGrid").innerHTML = collectionGrid(); }
    if (id === "fsort") { filters.sort = e.target.value; $("#collGrid").innerHTML = collectionGrid(); }
    if (id === "fmiss") { filters.missing = e.target.checked; $("#collGrid").innerHTML = collectionGrid(); }
    if (id === "fholo") { filters.holo = e.target.checked; $("#collGrid").innerHTML = collectionGrid(); }
  });
  document.addEventListener("input", e => {
    if (e.target.id === "fq") { filters.q = e.target.value; $("#collGrid").innerHTML = collectionGrid(); }
    if (e.target.id === "dq") { dexState.q = e.target.value; $("#dexList").innerHTML = dexListHTML(); }
  });
  document.addEventListener("keydown", e => { if ((e.key === "Enter" || e.key === " ") && e.target.closest && e.target.closest(".card,.flip") && !e.target.closest("input,textarea,button")) { e.preventDefault(); e.target.click(); } });

  // Persist "last seen" occasionally so clock-rollback detection works
  setInterval(() => G.save(), 60000);
  route();
})();
