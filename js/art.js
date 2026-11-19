/* =========================================================
   LUMEN BEASTS — illustration engine
   - 001–010 are hand-composed vector illustrations.
   - Others are built from body plans ("forms") + element scenes,
     seeded by creature ID so each one is unique and stable.
   - A creature with `img` set uses that image file instead.
   Every illustration is a standalone SVG turned into a data URI.
   ========================================================= */
(function () {
  const E = window.CONFIG.elements;

  /* ---------- helpers ---------- */
  const sid = cr => typeof cr.id === "number" ? cr.id : [...String(cr.id)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) % 99991, 7) + 500;
  function rng(seed) {
    let a = seed * 2654435761 >>> 0;
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      let t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hexToHsl(h) {
    h = h.replace("#", ""); const r = parseInt(h.substr(0, 2), 16) / 255, g = parseInt(h.substr(2, 2), 16) / 255, b = parseInt(h.substr(4, 2), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b); let H = 0, S = 0; const L = (mx + mn) / 2;
    if (mx !== mn) { const d = mx - mn; S = L > .5 ? d / (2 - mx - mn) : d / (mx + mn);
      H = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; H *= 60; }
    return [H, S * 100, L * 100];
  }
  function hsl(h, s, l) { return `hsl(${((h % 360) + 360) % 360},${Math.max(0, Math.min(100, s))}%,${Math.max(0, Math.min(100, l))}%)`; }
  function shift(hex, dh, ds, dl) { const [h, s, l] = hexToHsl(hex); return hsl(h + dh, s + ds, l + dl); }
  const f = n => Math.round(n * 10) / 10;

  function eye(x, y, r, o = {}) {
    const iris = o.iris || "#2a1a3a";
    if (o.glow) {
      return `<g filter="url(#glow)"><ellipse cx="${x}" cy="${y}" rx="${r}" ry="${f(r * (o.slit ? .7 : 1))}" fill="${o.glow}"/><ellipse cx="${x}" cy="${y}" rx="${f(r * .28)}" ry="${f(r * .75)}" fill="#1a0d22" opacity="${o.slit ? .9 : 0}"/><circle cx="${f(x - r * .3)}" cy="${f(y - r * .35)}" r="${f(r * .25)}" fill="#fff"/></g>`;
    }
    const sleepy = o.sleepy ? `<path d="M${f(x - r - 1)} ${y} A${r + 1} ${r + 1} 0 0 1 ${f(x + r + 1)} ${y} Z" fill="${o.lid || "#000"}" opacity=".9"/>` : "";
    return `<g><circle cx="${x}" cy="${y}" r="${r}" fill="#fff" stroke="${o.line || "#1a1020"}" stroke-width="1.6"/>` +
      `<circle cx="${f(x + r * .1)}" cy="${f(y + r * .1)}" r="${f(r * .72)}" fill="${iris}"/>` +
      (o.slitPupil ? `<ellipse cx="${f(x + r * .12)}" cy="${f(y + r * .1)}" rx="${f(r * .17)}" ry="${f(r * .58)}" fill="#0b0710"/>` : `<circle cx="${f(x + r * .15)}" cy="${f(y + r * .15)}" r="${f(r * .38)}" fill="#0b0710"/>`) +
      `<circle cx="${f(x - r * .25)}" cy="${f(y - r * .3)}" r="${f(r * .3)}" fill="#fff"/>` +
      `<circle cx="${f(x + r * .35)}" cy="${f(y + r * .35)}" r="${f(r * .13)}" fill="#fff"/>${sleepy}</g>`;
  }

  // Element glyph centered at 0,0 (about 20 units tall)
  const GLYPH = {
    fire: c => `<path d="M0 -14 C7 -6 10 0 7 6 C5 11 -5 11 -7 6 C-10 0 -4 -4 0 -14Z" fill="${c.main}"/><path d="M0 -4 C3 0 4 3 3 5 C2 8 -2 8 -3 5 C-4 3 -2 0 0 -4Z" fill="${c.light}"/>`,
    water: c => `<path d="M0 -12 C6 -4 8 1 8 5 A8 8 0 0 1 -8 5 C-8 1 -6 -4 0 -12Z" fill="${c.main}"/><ellipse cx="-3" cy="3" rx="2" ry="3" fill="${c.light}"/>`,
    nature: c => `<path d="M0 -12 C9 -7 9 7 0 12 C-9 7 -9 -7 0 -12Z" fill="${c.main}"/><path d="M0 -10 V11" stroke="${c.dark}" stroke-width="1.4"/>`,
    electric: c => `<path d="M3 -13 L-7 2 L0 2 L-4 13 L8 -3 L1 -3 L5 -13Z" fill="${c.main}" stroke="${c.dark}" stroke-width="1" stroke-linejoin="round"/>`,
    shadow: c => `<path d="M2 12 C-10 6 6 -2 -4 -13 C10 -7 10 5 2 12Z" fill="${c.main}"/><circle cx="1" cy="3" r="2" fill="${c.light}"/>`,
    celestial: c => `<path d="M0 -12 L3 -3 L12 0 L3 3 L0 12 L-3 3 L-12 0 L-3 -3Z" fill="${c.main}"/><circle r="2.2" fill="#fff"/>`,
    ice: c => `<path d="M0 -13 L6 -3 L3 12 L-3 12 L-6 -3Z" fill="${c.light}" stroke="${c.main}" stroke-width="1.4"/><path d="M0 -13 V12 M-6 -3 L0 0 L6 -3" stroke="${c.main}" stroke-width="1" fill="none"/>`,
    earth: c => `<path d="M-10 8 L-8 -4 L-1 -10 L8 -4 L10 8Z" fill="${c.main}" stroke="${c.dark}" stroke-width="1.2"/><path d="M-1 -10 L0 8 M-8 -4 L0 0 L8 -4" stroke="${c.dark}" stroke-width=".9" fill="none" opacity=".6"/>`,
    wind: c => `<path d="M-10 -3 H4 C9 -3 9 -10 4 -10 M-10 3 H8 C14 3 14 11 8 11 M-6 -8 H-2" stroke="${c.main}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
    arcane: c => `<circle r="9" fill="none" stroke="${c.main}" stroke-width="1.8"/><path d="M0 -6 L5 0 L0 6 L-5 0Z" fill="${c.main}"/><circle r="12" fill="none" stroke="${c.main}" stroke-width=".8" stroke-dasharray="2 3"/>`
  };
  function glyph(el, x, y, s, rot = 0, op = 1) {
    return `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)}) scale(${f(s)})" opacity="${op}">${GLYPH[el](E[el])}</g>`;
  }

  /* ---------- shared defs ---------- */
  function defs(p) {
    return `<defs>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.bg1}"/><stop offset="1" stop-color="${p.bg2}"/></linearGradient>
<radialGradient id="body" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="${p.bodyLight}"/><stop offset=".55" stop-color="${p.body}"/><stop offset="1" stop-color="${p.bodyDark}"/></radialGradient>
<linearGradient id="bodyLin" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p.bodyLight}"/><stop offset="1" stop-color="${p.body}"/></linearGradient>
<radialGradient id="belly" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="${p.belly}"/><stop offset="1" stop-color="${p.belly}" stop-opacity=".55"/></radialGradient>
<radialGradient id="aura" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${p.light}" stop-opacity=".75"/><stop offset=".5" stop-color="${p.main}" stop-opacity=".25"/><stop offset="1" stop-color="${p.main}" stop-opacity="0"/></radialGradient>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="7"/></filter>
<filter id="soft"><feGaussianBlur stdDeviation="1.2"/></filter>
</defs>`;
  }

  /* ---------- element scenes (200 x 160) ---------- */
  function scene(el, p, r) {
    const pts = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join("");
    let s = `<rect width="200" height="160" fill="url(#sky)"/>`;
    switch (el) {
      case "fire":
        s += `<circle cx="150" cy="40" r="40" fill="#ffb347" opacity=".25" filter="url(#blur)"/>
<path d="M0 120 L40 70 L58 82 L80 50 L96 58 L110 46 L130 80 L160 66 L200 108 V160 H0Z" fill="#2a0a05" opacity=".85"/>
<path d="M80 50 L88 62 L96 58 L104 66 L110 46" fill="none" stroke="#ff7a2a" stroke-width="2" opacity=".8"/>
<path d="M0 136 C50 126 150 128 200 134 V160 H0Z" fill="#1a0603"/>
<path d="M20 150 C60 140 90 152 140 144" stroke="#ff6a1a" stroke-width="2" fill="none" opacity=".6"/>` +
          pts(16, () => `<circle cx="${f(r() * 200)}" cy="${f(r() * 130)}" r="${f(.6 + r() * 1.6)}" fill="${r() > .5 ? "#ffcf6a" : "#ff7a3a"}" opacity="${f(.5 + r() * .5)}"/>`);
        break;
      case "water":
        s += `<path d="M0 0 L60 0 L20 160 L0 160Z M90 0 L120 0 L80 160 L60 160Z" fill="#fff" opacity=".05"/>
<path d="M0 128 C30 120 60 134 100 126 C140 118 170 132 200 124 V160 H0Z" fill="${p.dark}" opacity=".7"/>
<path d="M0 142 C40 134 80 148 120 140 C150 134 180 144 200 138 V160 H0Z" fill="#021426" opacity=".8"/>
<path d="M14 160 C10 140 22 130 16 112 M30 160 C34 146 24 136 32 122 M178 160 C172 142 186 132 180 116" stroke="#2f9a7a" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>` +
          pts(12, () => { const x = r() * 200, y = r() * 140, rr = 1.5 + r() * 4; return `<circle cx="${f(x)}" cy="${f(y)}" r="${f(rr)}" fill="none" stroke="#bff3ff" stroke-width=".8" opacity=".55"/>`; });
        break;
      case "nature":
        s += `<circle cx="40" cy="26" r="30" fill="#fff6b0" opacity=".35" filter="url(#blur)"/>
<path d="M40 20 L10 160 M40 20 L70 160" stroke="#fffbd0" stroke-width="10" opacity=".06"/>
<ellipse cx="40" cy="140" rx="90" ry="40" fill="#1f5a2a"/><ellipse cx="170" cy="146" rx="90" ry="36" fill="#174a22"/>
<path d="M0 146 C60 136 140 140 200 146 V160 H0Z" fill="#0f3519"/>` +
          pts(18, () => { const x = r() * 200; return `<path d="M${f(x)} 160 Q${f(x + 2)} ${f(148 - r() * 8)} ${f(x + 5)} ${f(142 - r() * 10)}" stroke="#4caf50" stroke-width="1.6" fill="none"/>`; }) +
          pts(6, () => glyph("nature", r() * 200, r() * 90, .35 + r() * .3, r() * 360, .5));
        break;
      case "electric":
        s += pts(3, i => `<g opacity=".9"><ellipse cx="${30 + i * 70}" cy="${18 + i % 2 * 8}" rx="40" ry="16" fill="#2c2850"/><ellipse cx="${50 + i * 70}" cy="${12 + i % 2 * 8}" rx="28" ry="14" fill="#38336a"/></g>`) +
          `<path d="M150 20 L138 56 L148 56 L132 96" stroke="#fff6a8" stroke-width="2.4" fill="none" opacity=".75" filter="url(#glow)"/>
<path d="M0 138 C60 130 140 132 200 138 V160 H0Z" fill="#14112a"/>` +
          pts(14, () => { const x = r() * 200, y = 30 + r() * 100; return `<path d="M${f(x)} ${f(y)} l-3 9" stroke="#9fa6ff" stroke-width=".8" opacity=".4"/>`; });
        break;
      case "shadow":
        s += pts(20, () => `<circle cx="${f(r() * 200)}" cy="${f(r() * 90)}" r="${f(.4 + r() * .9)}" fill="#e6d6ff" opacity="${f(.3 + r() * .6)}"/>`) +
          `<circle cx="158" cy="38" r="22" fill="#e9dcff" opacity=".9"/><circle cx="168" cy="32" r="20" fill="${p.bg1}"/>
<path d="M0 130 C40 118 80 128 120 120 C160 112 180 124 200 120 V160 H0Z" fill="#05020c"/>
<path d="M20 130 L22 96 M22 106 L12 98 M22 112 L32 102 M180 124 L178 92 M178 102 L188 94" stroke="#05020c" stroke-width="3" fill="none"/>
<ellipse cx="100" cy="132" rx="110" ry="10" fill="${p.light}" opacity=".12" filter="url(#blur)"/>`;
        break;
      case "celestial":
        s += `<ellipse cx="50" cy="50" rx="60" ry="30" fill="#7a5cff" opacity=".35" filter="url(#blur)"/><ellipse cx="160" cy="90" rx="50" ry="26" fill="#ff8ad8" opacity=".25" filter="url(#blur)"/>` +
          pts(34, () => `<circle cx="${f(r() * 200)}" cy="${f(r() * 160)}" r="${f(.3 + r() * 1.1)}" fill="#fff" opacity="${f(.4 + r() * .6)}"/>`) +
          `<circle cx="168" cy="30" r="9" fill="#ffd27a" opacity=".85"/><ellipse cx="168" cy="30" rx="17" ry="4" fill="none" stroke="#ffe9b8" stroke-width="1.2" opacity=".8" transform="rotate(-18 168 30)"/>
<ellipse cx="100" cy="150" rx="120" ry="18" fill="#fff4d6" opacity=".12"/>`;
        break;
      case "ice":
        s += `<path d="M0 40 C40 20 80 50 120 30 C150 16 180 34 200 24" stroke="#8affd6" stroke-width="10" fill="none" opacity=".25" filter="url(#soft)"/>
<path d="M0 120 L30 70 L50 92 L78 54 L104 96 L130 66 L160 100 L182 76 L200 96 V160 H0Z" fill="#cfefff" opacity=".55"/>
<path d="M30 70 L38 82 L44 78 L50 92 M78 54 L86 70 L94 66 M130 66 L138 80" stroke="#fff" stroke-width="2" fill="none" opacity=".8"/>
<path d="M0 136 C60 128 140 130 200 136 V160 H0Z" fill="#e9f8ff"/>` +
          pts(20, () => `<circle cx="${f(r() * 200)}" cy="${f(r() * 140)}" r="${f(.6 + r() * 1.4)}" fill="#fff" opacity="${f(.5 + r() * .5)}"/>`);
        break;
      case "earth":
        s += `<circle cx="160" cy="40" r="26" fill="#ffcf8a" opacity=".35" filter="url(#blur)"/>
<path d="M0 104 L18 104 L22 72 L58 72 L62 104 L120 104 L126 84 L160 84 L166 104 L200 104 V160 H0Z" fill="#4a2a12" opacity=".8"/>
<path d="M0 134 C60 126 140 128 200 134 V160 H0Z" fill="#2a170a"/>` +
          pts(7, () => glyph("earth", r() * 200, 138 + r() * 18, .4 + r() * .4, r() * 40 - 20, .9));
        break;
      case "wind":
        s += pts(4, () => { const x = r() * 200, y = 14 + r() * 70; return `<g fill="#fff" opacity=".55"><ellipse cx="${f(x)}" cy="${f(y)}" rx="24" ry="9"/><ellipse cx="${f(x + 12)}" cy="${f(y - 6)}" rx="14" ry="9"/></g>`; }) +
          pts(5, () => { const y = 20 + r() * 110, x = r() * 120; return `<path d="M${f(x)} ${f(y)} C${f(x + 30)} ${f(y - 6)} ${f(x + 50)} ${f(y + 6)} ${f(x + 80)} ${f(y)} c8 -2 8 -10 2 -10" stroke="#effff8" stroke-width="1.4" fill="none" opacity=".5"/>`; }) +
          `<path d="M0 140 C60 132 140 134 200 140 V160 H0Z" fill="#164a4a" opacity=".8"/>`;
        break;
      case "arcane":
        s += pts(22, () => `<circle cx="${f(r() * 200)}" cy="${f(r() * 160)}" r="${f(.3 + r() * 1)}" fill="#ffd1f2" opacity="${f(.3 + r() * .6)}"/>`) +
          `<ellipse cx="100" cy="140" rx="80" ry="14" fill="none" stroke="#ff9be3" stroke-width="1.6" opacity=".7" filter="url(#glow)"/>
<ellipse cx="100" cy="140" rx="64" ry="10" fill="none" stroke="#ffd1f2" stroke-width=".8" stroke-dasharray="3 4" opacity=".7"/>` +
          pts(5, () => glyph("arcane", 10 + r() * 180, 10 + r() * 80, .45 + r() * .3, r() * 90, .45));
        break;
    }
    return s;
  }

  function aura(rarity, p) {
    if (rarity === "common" || rarity === "uncommon") return "";
    let s = `<ellipse cx="100" cy="92" rx="${rarity === "rare" ? 62 : 78}" ry="${rarity === "rare" ? 54 : 66}" fill="url(#aura)"/>`;
    if (rarity !== "rare") {
      s += `<g opacity="${rarity === "mythic" ? .5 : .3}" transform="translate(100 90)">` +
        Array.from({ length: 12 }, (_, i) => `<path d="M0 0 L${f(Math.cos(i * .5236 - .08) * 140)} ${f(Math.sin(i * .5236 - .08) * 140)} L${f(Math.cos(i * .5236 + .08) * 140)} ${f(Math.sin(i * .5236 + .08) * 140)}Z" fill="${p.light}"/>`).join("") + `</g>`;
    }
    return s;
  }
  const shadowE = (cx = 100, cy = 142, rx = 42) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="6" fill="#000" opacity=".32"/>`;

  /* ---------- procedural body plans ---------- */
  const FORMS = {
    blob(p, r, el, F) {
      const h = F.has("tallblob") ? 66 : 50 + r() * 16, top = 140 - h * 1.6;
      let hat = glyph(el, 100, f(top - 4), .9, 0) + glyph(el, f(top > 64 ? 72 : 66), f(top + 18), .45, -30, .9);
      if (F.has("mushroom")) hat = `<path d="M46 ${f(top + 26)} C46 ${f(top - 26)} 154 ${f(top - 26)} 154 ${f(top + 26)} C130 ${f(top + 34)} 70 ${f(top + 34)} 46 ${f(top + 26)}Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2.6"/>` + [[70, 8], [100, -6], [128, 8], [86, 18], [116, 18]].map(([x, d]) => `<circle cx="${x}" cy="${f(top + d)}" r="5" fill="#fff" opacity=".8"/>`).join("");
      if (F.has("sprout")) hat = `<path d="M100 ${f(top + 4)} V${f(top - 16)}" stroke="#3a7a2a" stroke-width="4"/><path d="M100 ${f(top - 14)} C86 ${f(top - 34)} 70 ${f(top - 22)} 74 ${f(top - 12)} C84 ${f(top - 8)} 94 ${f(top - 10)} 100 ${f(top - 14)}Z M100 ${f(top - 14)} C114 ${f(top - 36)} 132 ${f(top - 24)} 126 ${f(top - 12)} C116 ${f(top - 6)} 106 ${f(top - 10)} 100 ${f(top - 14)}Z" fill="#7ad86a" stroke="#1a4a12" stroke-width="2"/>`;
      if (F.has("drips")) hat += [[70, 120], [128, 116], [96, 134]].map(([x, y]) => `<path d="M${x} ${y} q4 10 0 14 q-4 -4 0 -14Z" fill="${p.light}" opacity=".8"/>`).join("") + `<g fill="#2a1410">${[[80, 74], [118, 80], [92, 66]].map(([x, y]) => `<circle cx="${x}" cy="${f(Math.max(y, top + 14))}" r="3"/>`).join("")}</g>`;
      if (F.has("crescent")) return shadowE(100, 144, 34) + `<circle cx="100" cy="88" r="52" fill="url(#aura)"/><mask id="cm"><rect width="200" height="160" fill="#000"/><circle cx="96" cy="88" r="46" fill="#fff"/><circle cx="124" cy="74" r="40" fill="#000"/></mask>` +
        `<circle cx="96" cy="88" r="46" fill="url(#body)" mask="url(#cm)"/><path d="M114 45.6 A46 46 0 1 0 138.2 102" fill="none" stroke="${p.line}" stroke-width="2.6"/>` +
        eye(68, 96, 7, { iris: p.iris, line: p.line, sleepy: true, lid: p.body }) + eye(86, 116, 6, { iris: p.iris, line: p.line, sleepy: true, lid: p.body }) + `<path d="M66 116 Q72 122 78 120" stroke="${p.line}" stroke-width="2" fill="none"/><ellipse cx="62" cy="108" rx="4" ry="2.6" fill="#ff7aa0" opacity=".5"/>` + glyph("celestial", 150, 50, .5, 0) + glyph("celestial", 160, 120, .4, 0) + glyph("celestial", 40, 40, .35, 0);
      if (F.has("ball")) return shadowE(100, 144, 30) + Array.from({ length: 10 }, (_, i) => { const a = i / 10 * Math.PI * 2; return `<path d="M${f(100 + Math.cos(a) * 40)} ${f(96 + Math.sin(a) * 40)} l${f(Math.cos(a) * 12)} ${f(Math.sin(a) * 12)}" stroke="${p.light}" stroke-width="3" stroke-linecap="round" filter="url(#glow)"/>`; }).join("") +
        `<circle cx="100" cy="96" r="38" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/><ellipse cx="86" cy="80" rx="10" ry="6" fill="#fff" opacity=".5"/>` + eye(88, 96, 8.5, { iris: p.iris, line: p.line }) + eye(112, 96, 8.5, { iris: p.iris, line: p.line }) + `<path d="M90 112 Q100 122 110 112Z" fill="${p.line}"/>` + glyph(el, 100, 54, .8, 0);
      if (F.has("book")) {
        return shadowE() + `<path d="M50 70 L100 80 L150 70 L150 132 L100 142 L50 132Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2.6" stroke-linejoin="round"/><path d="M56 74 L100 84 L144 74 L144 128 L100 138 L56 128Z" fill="#fff8e8" stroke="${p.line}" stroke-width="1.4"/><path d="M100 84 V138" stroke="${p.line}" stroke-width="2"/>` +
          `<path d="M62 92 H92 M62 100 H88 M110 92 H138 M112 100 H136" stroke="${p.main}" stroke-width="1.6" opacity=".7"/>` + eye(78, 112, 7, { iris: p.iris, line: p.line }) + eye(122, 112, 7, { iris: p.iris, line: p.line }) +
          `<path d="M88 126 L94 122 L100 128 L106 122 L112 126" stroke="${p.line}" stroke-width="2" fill="none"/>` + glyph(el, 100, 60, .8, 0) + glyph("arcane", 160, 60, .5, 0, .8);
      }
      if (F.has("chest")) {
        return shadowE(100, 142, 50) + `<rect x="50" y="92" width="100" height="48" rx="6" fill="${p.horn}" stroke="${p.line}" stroke-width="2.6"/><path d="M50 92 C50 52 150 52 150 92Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2.6" transform="rotate(-14 50 92)"/>` +
          `<path d="M52 92 L148 92 L148 100 L52 100Z" fill="#2a0a1a"/><path d="M56 92 l6 8 l6 -8 l6 8 l6 -8 l6 8 l6 -8 l6 8 l6 -8 l6 8 l6 -8 l6 8 l6 -8 l6 8 l6 -8 l6 8" fill="#fff" stroke="${p.line}" stroke-width="1"/>` +
          `<path d="M50 112 H150 M100 100 V140" stroke="#ffc94a" stroke-width="5" opacity=".9"/><rect x="92" y="106" width="16" height="14" rx="3" fill="#ffc94a" stroke="${p.line}" stroke-width="1.6"/>` +
          eye(76, 70, 6, { glow: "#ffe27a", slit: true }) + eye(104, 64, 6, { glow: "#ffe27a", slit: true }) + `<circle cx="60" cy="90" r="4" fill="#ffc94a"/><circle cx="140" cy="88" r="4" fill="#ffd1f2"/>`;
      }
      const grin = F.has("grin") ? `<path d="M68 112 Q100 140 132 112 Q100 124 68 112Z" fill="#fff" stroke="${p.line}" stroke-width="2"/><path d="M76 116 l4 4 M86 119 v5 M96 121 v5 M106 121 v5 M116 119 v5 M124 116 l-4 4" stroke="${p.line}" stroke-width="1.2"/>`
        : `<path d="M92 114 Q100 ${r() > .5 ? 122 : 118} 108 114" stroke="${p.line}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
      return shadowE() +
        `<ellipse cx="82" cy="137" rx="11" ry="6" fill="${p.bodyDark}" stroke="${p.line}" stroke-width="2"/><ellipse cx="118" cy="137" rx="11" ry="6" fill="${p.bodyDark}" stroke="${p.line}" stroke-width="2"/>` +
        (F.has("fluffy") ? `<path d="M58 128 C40 124 40 104 54 100 C46 82 64 70 76 76 C78 58 100 54 108 66 C120 54 140 64 136 80 C152 82 160 100 148 110 C160 122 148 140 132 136 C124 146 108 146 100 140 C90 146 70 144 66 136 C62 136 60 132 58 128Z" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>`
          : F.has("lumpy") ? `<path d="M58 120 C50 100 62 84 72 86 C72 70 92 62 102 74 C112 62 134 70 132 90 C148 92 150 116 140 126 C142 140 120 144 108 138 C96 146 74 144 70 134 C60 134 56 128 58 120Z" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/><ellipse cx="118" cy="104" rx="6" ry="4" fill="none" stroke="${p.bodyDark}" stroke-width="1.4"/><ellipse cx="118" cy="104" rx="10" ry="7" fill="none" stroke="${p.bodyDark}" stroke-width="1.2" opacity=".6"/>`
          : F.has("wide") ? `<path d="M30 132 C30 100 60 78 100 78 C140 78 170 100 170 132 C170 142 140 144 100 144 C60 144 30 142 30 132Z" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>`
          : `<path d="M56 114 C54 ${f(top + 30)} 78 ${f(top)} 100 ${f(top)} C122 ${f(top)} 146 ${f(top + 30)} 144 114 C144 134 124 141 100 141 C76 141 56 134 56 114Z" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>`) +
        (r() > .4 ? `<ellipse cx="100" cy="122" rx="26" ry="14" fill="url(#belly)"/>` : "") +
        (r() > .5 ? `<path d="M58 110 C46 106 44 96 50 92" stroke="${p.line}" stroke-width="2.4" fill="${p.body}"/><path d="M142 110 C154 106 156 96 150 92" stroke="${p.line}" stroke-width="2.4" fill="${p.body}"/>` : "") +
        pattern(p, r, 100, 96, 34) + hat +
        (F.has("grin") ? eye(84, 96, 8, { glow: "#ffe27a" }) + eye(116, 96, 8, { glow: "#ffe27a" }) : eye(86, 100, 9, { iris: p.iris, line: p.line, sleepy: F.has("sleepy"), lid: p.bodyDark }) + eye(114, 100, 9, { iris: p.iris, line: p.line, sleepy: F.has("sleepy"), lid: p.bodyDark })) +
        grin + `<ellipse cx="76" cy="112" rx="5" ry="3" fill="#ff7aa0" opacity=".5"/><ellipse cx="124" cy="112" rx="5" ry="3" fill="#ff7aa0" opacity=".5"/>`;
    },
    quad(p, r, el, F) {
      const L = `stroke="${p.line}" stroke-width="2.2"`;
      const B = ["cat", "bear", "hoof", "rodent", "long", "rabbit", "reptile", "heavy"].find(k => F.has(k)) || "dog";
      const b = {
        dog: { cx: 112, cy: 106, rx: 38, ry: 23, lw: 14, hx: 76, hy: 84, hr: 25, tail: "up" },
        cat: { cx: 116, cy: 108, rx: 34, ry: 16, lw: 9, hx: 80, hy: 80, hr: 21, tail: "curl" },
        bear: { cx: 112, cy: 108, rx: 42, ry: 28, lw: 19, hx: 70, hy: 86, hr: 28, tail: "stub" },
        hoof: { cx: 118, cy: 94, rx: 34, ry: 16, lw: 8, hx: 70, hy: 52, hr: 18, tail: "tuft", neck: true },
        rodent: { cx: 118, cy: 120, rx: 30, ry: 17, lw: 9, hx: 84, hy: 106, hr: 22, tail: "thin" },
        long: { cx: 114, cy: 116, rx: 52, ry: 13, lw: 9, hx: 60, hy: 104, hr: 17, tail: "fluffy" },
        rabbit: { cx: 114, cy: 112, rx: 28, ry: 27, lw: 0, hx: 92, hy: 78, hr: 23, tail: "cotton" },
        reptile: { cx: 120, cy: 120, rx: 46, ry: 13, lw: 10, hx: 64, hy: 114, hr: 15, tail: "taper" },
        heavy: { cx: 116, cy: 104, rx: 46, ry: 30, lw: 19, hx: 68, hy: 98, hr: 27, tail: "stub" }
      }[B];
      const { cx, cy, rx, ry, lw, hx, hy, hr } = b;
      const tx = cx + rx - 4, ty = cy - 4;
      // ---- tail
      let tail = "";
      const stroke2 = (d, w) => `<path d="${d}" stroke="${p.line}" stroke-width="${w + 4.5}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${p.body}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
      if (b.tail === "up") { const d = `M${tx} ${ty} C${tx + 24} ${ty - 4} ${tx + 32} ${ty - 24} ${tx + 24} ${ty - 42}`; tail = stroke2(d, 7.5) + glyph(el, tx + 24, ty - 46, .7, 10); }
      if (b.tail === "curl") { const d = `M${tx} ${ty} C${tx + 30} ${ty - 6} ${tx + 14} ${ty - 44} ${tx + 34} ${ty - 54} C${tx + 44} ${ty - 58} ${tx + 48} ${ty - 48} ${tx + 40} ${ty - 44}`; tail = stroke2(d, 6) + glyph(el, tx + 40, ty - 62, .6, 0); }
      if (b.tail === "stub") tail = `<circle cx="${tx + 4}" cy="${ty - 2}" r="8" fill="${p.body}" ${L}/>`;
      if (b.tail === "tuft") tail = stroke2(`M${tx} ${ty} C${tx + 10} ${ty + 4} ${tx + 12} ${ty + 16} ${tx + 10} ${ty + 30}`, 5) + `<path d="M${tx + 4} ${ty + 26} q6 16 12 0 q-6 -4 -12 0Z" fill="${p.horn}" ${L}/>`;
      if (b.tail === "thin") tail = `<path d="M${tx} ${ty + 4} C${tx + 30} ${ty + 14} ${tx + 44} ${ty - 22} ${tx + 58} ${ty - 12}" stroke="${p.line}" stroke-width="4" fill="none" stroke-linecap="round"/>` + glyph(el, tx + 60, ty - 16, .45, 0);
      if (b.tail === "fluffy") tail = stroke2(`M${tx} ${ty} C${tx + 26} ${ty - 2} ${tx + 34} ${ty - 22} ${tx + 26} ${ty - 40}`, 15) + glyph(el, tx + 26, ty - 46, .7, 0);
      if (b.tail === "cotton") tail = `<circle cx="${tx + 4}" cy="${cy + 12}" r="10" fill="#fff" ${L}/>`;
      if (b.tail === "taper") tail = `<path d="M${tx - 8} ${cy - 10} L194 ${cy + 16} L${tx - 8} ${cy + 10}Z" fill="${p.body}" ${L} stroke-linejoin="round"/>`;
      // ---- legs
      const legTop = cy + ry * .35, legH = 142 - legTop;
      const leg = (x, dark, hoof) => `<rect x="${f(x - lw / 2)}" y="${f(legTop)}" width="${lw}" height="${f(legH)}" rx="${f(Math.min(6, lw / 2))}" fill="${dark ? p.bodyDark : p.body}" ${L}/>` + (hoof ? `<rect x="${f(x - lw / 2)}" y="136" width="${lw}" height="6" rx="1.5" fill="${p.line}"/>` : "");
      let backLegs = "", frontLegs = "";
      if (B === "reptile") {
        const rl = (x, a, dark) => `<rect x="${x - 5}" y="${cy}" width="10" height="22" rx="5" fill="${dark ? p.bodyDark : p.body}" ${L} transform="rotate(${a} ${x} ${cy})"/>`;
        backLegs = rl(cx + 22, -25, 1) + rl(cx - 26, -25, 1); frontLegs = rl(cx + 30, 25) + rl(cx - 18, 25);
      } else if (B === "rabbit") {
        frontLegs = `<ellipse cx="${cx + 10}" cy="137" rx="18" ry="6" fill="${p.body}" ${L}/><ellipse cx="${cx - 16}" cy="138" rx="7" ry="5" fill="${p.body}" ${L}/><ellipse cx="${cx - 4}" cy="139" rx="7" ry="5" fill="${p.body}" ${L}/>`;
      } else {
        const hf = B === "hoof";
        backLegs = leg(cx + rx * .45, 1, hf) + leg(cx + rx * .72, 1, hf);
        frontLegs = leg(cx - rx * .62, 0, hf) + leg(cx - rx * .3, 0, hf);
      }
      // ---- body extras
      let back = "", bodyTop = "";
      if (F.has("wings")) back += `<path d="${`M${cx - 4} ${cy - 10} C${cx} ${cy - 44} ${cx + 24} ${cy - 64} ${cx + 52} ${cy - 70} C${cx + 44} ${cy - 50} ${cx + 48} ${cy - 42} ${cx + 40} ${cy - 34} C${cx + 34} ${cy - 24} ${cx + 16} ${cy - 14} ${cx + 4} ${cy - 8}Z`}" fill="${p.light}" ${L} opacity=".95"/>`;
      if (F.has("spikes")) bodyTop += Array.from({ length: 6 }, (_, i) => { const x = cx - rx * .55 + i * rx * .22, y = cy - ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2)) + 3; return `<path d="M${f(x - 5)} ${f(y + 4)} L${f(x)} ${f(y - 13)} L${f(x + 5)} ${f(y + 4)}Z" fill="${p.horn}" stroke="${p.line}" stroke-width="1.6" stroke-linejoin="round"/>`; }).join("");
      if (F.has("shell")) bodyTop += `<path d="M${cx - rx * .8} ${cy + 4} C${cx - rx * .8} ${cy - ry * 1.9} ${cx + rx * .85} ${cy - ry * 1.9} ${cx + rx * .85} ${cy + 4}Z" fill="${p.horn}" ${L}/><path d="M${cx - rx * .45} ${cy + 2} L${cx - rx * .3} ${cy - ry * .9} M${cx} ${cy + 2} V${cy - ry * 1.3} M${cx + rx * .45} ${cy + 2} L${cx + rx * .3} ${cy - ry * .9}" stroke="${p.line}" stroke-width="1.6" opacity=".6"/>` +
        (F.has("mountain") ? `<path d="M${cx - 22} ${cy - ry * 1.1} L${cx} ${cy - ry * 2.6} L${cx + 12} ${cy - ry * 1.9} L${cx + 20} ${cy - ry * 2.2} L${cx + 32} ${cy - ry * 1.1}Z" fill="#8a8a7a" ${L}/><path d="M${cx - 6} ${cy - ry * 2.2} L${cx} ${cy - ry * 2.6} L${cx + 6} ${cy - ry * 2.25}Z" fill="#fff"/>` : "");
      const neck = b.neck ? stroke2(`M${cx - rx * .55} ${cy - 2} C${cx - rx * .7} ${cy - 20} ${hx + 8} ${hy + 30} ${hx + 6} ${hy + 8}`, 17) : "";
      // ---- head (drawn in the original 76,84 / r25 frame, then moved + scaled)
      let ears;
      const earsDefault = { cat: "pointy", dog: "pointy", bear: "round", hoof: "leaf", rodent: "big", long: "round", rabbit: "long", reptile: "none", heavy: "none" }[B];
      const earT = F.has("longears") ? "long" : F.has("roundears") ? (B === "rodent" ? "big" : "round") : F.has("noears") ? "none" : F.has("tufts") ? "pointy" : earsDefault;
      if (earT === "long") ears = `<path d="M60 66 C46 30 54 10 62 12 C70 16 72 44 70 64Z M80 60 C80 22 92 8 98 14 C104 22 96 48 90 64Z" fill="${p.body}" ${L}/><path d="M61 58 C55 32 58 22 62 22 C66 26 67 44 66 58Z M84 56 C86 30 92 22 94 24 C96 32 92 46 88 58Z" fill="#ffb8c8" opacity=".7"/>`;
      else if (earT === "round") ears = `<circle cx="58" cy="64" r="10" fill="${p.body}" ${L}/><circle cx="94" cy="62" r="10" fill="${p.body}" ${L}/><circle cx="58" cy="64" r="5" fill="${p.bodyDark}"/><circle cx="94" cy="62" r="5" fill="${p.bodyDark}"/>`;
      else if (earT === "big") ears = `<circle cx="56" cy="62" r="15" fill="${p.body}" ${L}/><circle cx="96" cy="60" r="15" fill="${p.body}" ${L}/><circle cx="56" cy="62" r="9" fill="#ffb8c8" opacity=".75"/><circle cx="96" cy="60" r="9" fill="#ffb8c8" opacity=".75"/>`;
      else if (earT === "leaf") ears = `<path d="M60 72 C44 62 42 52 48 48 C56 50 62 60 64 70Z M92 70 C108 60 112 50 106 46 C98 48 92 58 88 68Z" fill="${p.body}" ${L}/>`;
      else if (earT === "pointy") ears = `<path d="M62 70 L58 ${F.has("tufts") || B === "cat" ? 36 : 44} L78 62Z M84 62 L${F.has("tufts") || B === "cat" ? "100 32" : "96 40"} L98 70Z" fill="${p.body}" ${L} stroke-linejoin="round"/><path d="M64 66 L62 ${B === "cat" ? 46 : 52} L73 61Z M88 62 L${B === "cat" ? "97 42" : "94 48"} L95 66Z" fill="#ffb8c8" opacity=".6"/>` + (F.has("tufts") ? `<path d="M58 36 l-2 -9 M100 32 l4 -8" stroke="${p.line}" stroke-width="2.6" stroke-linecap="round"/>` : "");
      else ears = "";
      let mane = "";
      if (F.has("mane")) mane = B === "hoof" ? `<path d="M88 62 C100 50 104 70 112 64 C116 78 110 88 104 96 C112 104 104 112 98 116" stroke="${p.horn}" stroke-width="9" fill="none" stroke-linecap="round"/>`
        : `<g transform="translate(76 84)">` + Array.from({ length: 12 }, (_, i) => { const a = i / 12 * Math.PI * 2; return `<path d="M${f(Math.cos(a) * 18)} ${f(Math.sin(a) * 18)} L${f(Math.cos(a + .22) * 42)} ${f(Math.sin(a + .22) * 42)} L${f(Math.cos(a + .48) * 18)} ${f(Math.sin(a + .48) * 18)}Z" fill="${i % 2 ? p.main : p.light}" stroke="${p.line}" stroke-width="1.6"/>`; }).join("") + `</g>`;
      let front = "";
      if (F.has("ramhorns")) front += `<path d="M64 64 C44 54 38 80 52 86 C62 88 64 76 56 74" stroke="${p.horn}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M90 60 C110 48 118 74 104 80 C96 82 94 72 100 70" stroke="${p.horn}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      if (F.has("antlers")) front += `<g stroke="${p.horn}" stroke-width="4" fill="none" stroke-linecap="round"><path d="M66 62 C60 44 50 34 40 30 M58 46 L46 46 M54 38 L58 26"/><path d="M88 58 C96 40 108 32 120 28 M98 42 L110 44 M104 36 L100 24"/></g>` + glyph(el, 40, 28, .5, 0) + glyph(el, 120, 26, .5, 0);
      if (F.has("horns")) front += `<path d="M66 62 C58 40 62 24 68 16 C68 32 74 46 76 62Z M86 60 C92 40 100 28 108 22 C104 36 100 50 94 64Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2"/>`;
      if (F.has("unihorn")) front += `<path d="M70 62 L80 22 L84 62Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2" stroke-linejoin="round"/>`;
      if (F.has("hexhorns")) front += [[-40, 60], [-22, 66], [-6, 72], [10, 80], [26, 86], [42, 92]].map(([a, x]) => `<path d="M${x - 3} 64 L${f(x + Math.sin(a * Math.PI / 180) * 26)} ${f(64 - Math.cos(a * Math.PI / 180) * 26)} L${x + 3} 64Z" fill="${p.horn}" stroke="${p.line}" stroke-width="1.6"/>`).join("");
      if (F.has("nosehorn")) front += `<path d="M42 84 L30 52 L54 80Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2" stroke-linejoin="round"/><path d="M58 70 L56 58 L64 68Z" fill="${p.horn}" stroke="${p.line}" stroke-width="1.6"/>`;
      if (F.has("trunk")) front += `<path d="M50 96 C40 110 44 126 36 138 C32 142 26 140 28 134" stroke="${p.line}" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M50 96 C40 110 44 126 36 138 C32 142 26 140 28 134" stroke="${p.body}" stroke-width="8.5" fill="none" stroke-linecap="round"/>`;
      const whiskers = `<path d="M52 98 l-16 -3 M52 101 l-16 3 M70 98 l14 -4 M70 101 l14 3" stroke="${p.line}" stroke-width="1.2" opacity=".7"/>`;
      let snout;
      if (F.has("longsnout")) snout = `<path d="M64 86 L20 90 C14 92 14 102 20 102 L64 102Z" fill="url(#belly)" stroke="${p.line}" stroke-width="2"/><path d="M24 100 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4" stroke="#fff" stroke-width="1.6" fill="none"/><ellipse cx="22" cy="92" rx="3" ry="2" fill="${p.line}"/>`;
      else if (F.has("pigsnout")) snout = `<ellipse cx="54" cy="94" rx="13" ry="10" fill="${p.bodyDark}" stroke="${p.line}" stroke-width="2"/><ellipse cx="50" cy="94" rx="2.2" ry="3.2" fill="${p.line}"/><ellipse cx="58" cy="94" rx="2.2" ry="3.2" fill="${p.line}"/>`;
      else if (F.has("trunk")) snout = "";
      else if (B === "cat") snout = `<path d="M57 92 L65 92 L61 97Z" fill="#ff8aa8" stroke="${p.line}" stroke-width="1.2"/><path d="M61 97 Q57 102 53 99 M61 97 Q65 102 69 99" stroke="${p.line}" stroke-width="1.6" fill="none"/>` + whiskers;
      else if (B === "rodent" || B === "rabbit" || B === "long") snout = `<ellipse cx="61" cy="95" rx="9" ry="7" fill="url(#belly)" stroke="${p.line}" stroke-width="1.6"/><ellipse cx="61" cy="91" rx="3.4" ry="2.6" fill="#ff7aa0"/><path d="M58 101 h6 v5 h-6Z" fill="#fff" stroke="${p.line}" stroke-width="1"/>` + whiskers;
      else if (B === "hoof") snout = `<ellipse cx="52" cy="96" rx="20" ry="11" fill="url(#belly)" stroke="${p.line}" stroke-width="2" transform="rotate(18 52 96)"/><ellipse cx="40" cy="96" rx="2.4" ry="1.8" fill="${p.line}"/><path d="M42 104 Q48 108 54 106" stroke="${p.line}" stroke-width="1.6" fill="none"/>`;
      else snout = `<ellipse cx="60" cy="94" rx="14" ry="10" fill="url(#belly)" stroke="${p.line}" stroke-width="2"/><ellipse cx="49" cy="90" rx="4.5" ry="3.5" fill="${p.line}"/><path d="M52 100 Q58 104 64 100" stroke="${p.line}" stroke-width="1.8" fill="none"/>`;
      const tusks = F.has("tusks") ? `<path d="M52 100 C38 106 34 90 40 80 C42 92 48 96 58 96Z M66 102 C56 112 48 102 50 94 C54 100 60 100 70 98Z" fill="#fffbe8" stroke="${p.line}" stroke-width="1.6"/>` : "";
      const eyeO = { iris: p.iris, line: p.line, slitPupil: B === "cat" || B === "reptile" };
      const eyes = B === "reptile" ? eye(70, 76, 6.5, eyeO) + eye(86, 74, 6.5, eyeO) : eye(66, 80, B === "rodent" || B === "rabbit" ? 8 : 7, eyeO) + eye(86, 78, B === "rodent" || B === "rabbit" ? 8.5 : 7.5, eyeO);
      const brow = B === "heavy" || F.has("bulky") ? `<path d="M58 70 L74 74 M80 72 L96 68" stroke="${p.line}" stroke-width="3" stroke-linecap="round"/>` : "";
      const headShape = B === "reptile" ? `<ellipse cx="76" cy="86" rx="26" ry="20" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>`
        : B === "hoof" ? `<ellipse cx="76" cy="82" rx="23" ry="26" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>`
        : `<circle cx="76" cy="84" r="25" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>`;
      if (F.has("hat")) front += `<ellipse cx="76" cy="62" rx="30" ry="6" fill="#1e1238" stroke="${p.line}" stroke-width="2"/><path d="M62 60 C64 40 72 26 84 18 C86 28 96 30 104 32 C94 32 92 44 92 60Z" fill="#2a1a4a" stroke="${p.line}" stroke-width="2"/><path d="M63 55 C72 57 84 57 92 55 L92 60 C84 62 72 62 62 60Z" fill="${p.main}"/>`;
      const headInner = `${mane}${ears}${headShape}${snout}${tusks}${front}${eyes}${brow}<ellipse cx="94" cy="92" rx="5" ry="3" fill="#ff7aa0" opacity="${B === "reptile" || B === "heavy" ? 0 : .45}"/>`;
      const headAt = (x, y, sc) => `<g transform="translate(${f(x)} ${f(y)}) scale(${f(sc)}) translate(-76 -84)">${headInner}</g>`;
      const head = (F.has("heads3") ? headAt(hx + 26, hy - 12, hr / 25 * .8) + headAt(hx + 8, hy - 26, hr / 25 * .8) : "") + headAt(hx, hy, hr / 25);
      if (F.has("ninetails")) tail = Array.from({ length: 7 }, (_, i) => { const a = -1.5 + i * .32, ex = tx + Math.cos(a) * 52 + 8, ey = ty + Math.sin(a) * 46; return `<path d="M${tx} ${ty} Q${f(tx + Math.cos(a) * 22 + 14)} ${f(ty + Math.sin(a) * 30 + 6)} ${f(ex)} ${f(ey)}" stroke="${p.line}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M${tx} ${ty} Q${f(tx + Math.cos(a) * 22 + 14)} ${f(ty + Math.sin(a) * 30 + 6)} ${f(ex)} ${f(ey)}" stroke="${p.body}" stroke-width="8" fill="none" stroke-linecap="round"/><circle cx="${f(ex)}" cy="${f(ey)}" r="5" fill="${p.light}" filter="url(#glow)"/>`; }).join("");
      const stripes = r() > .5 && !F.has("shell") ? Array.from({ length: 3 }, (_, i) => `<path d="M${f(cx - rx * .1 + i * 10)} ${f(cy - ry * .9)} q4 ${f(ry * .5)} 0 ${f(ry)}" stroke="${p.bodyDark}" stroke-width="3" fill="none" opacity=".45" stroke-linecap="round"/>`).join("") : pattern(p, r, cx, cy - 2, rx * .6);
      return shadowE(cx - 4, 142, rx + 10) + tail + back + backLegs +
        `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>` +
        (B === "reptile" ? "" : `<ellipse cx="${cx - 4}" cy="${f(cy + ry * .5)}" rx="${f(rx * .6)}" ry="${f(Math.max(4, ry * .35))}" fill="url(#belly)"/>`) + stripes + bodyTop +
        frontLegs + neck + head +
        (F.has("spikes") || F.has("shell") || F.has("wings") ? "" : glyph(el, cx - 4, cy - ry - 2, .5, -10, .9));
    },
    serpent(p, r, el, F) {
      const V = ["worm", "eel", "sky", "coil", "zigzag", "leviathan"].find(k => F.has(k)) || "s";
      const tube = (d, w, extra = "") => `<path d="${d}" stroke="${p.line}" stroke-width="${w + 6}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="url(#bodyLin)" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="${p.belly}" stroke-width="${f(w * .3)}" fill="none" stroke-linecap="round" stroke-dasharray="5 6" opacity=".65"/>${extra}`;
      const ridge = (d, w, dy) => `<path d="${d}" transform="translate(0 ${dy})" stroke="${p.horn}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="2 5"/>`;
      const head = (hx, hy, s, o = {}) => {
        let h = `<g transform="translate(${hx} ${hy}) scale(${s})">`;
        if (o.hood) h += `<ellipse cx="0" cy="4" rx="30" ry="34" fill="${p.horn}" stroke="${p.line}" stroke-width="2.4"/><path d="M-14 -10 Q0 4 14 -10 M-18 10 Q0 24 18 10" stroke="${p.bodyDark}" stroke-width="3" fill="none"/>`;
        if (o.crest !== false && !o.hood) h += `<path d="M-16 -12 L-10 -30 L-2 -16 L4 -32 L10 -14 L18 -26 L18 -6Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2" stroke-linejoin="round"/>`;
        if (o.horns) h += `<path d="M-12 -12 C-20 -30 -14 -42 -6 -46 C-8 -32 -4 -22 -2 -14Z M12 -12 C20 -30 14 -42 6 -46 C8 -32 4 -22 2 -14Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2"/>`;
        if (o.fins) h += `<path d="M-22 -2 L-40 -14 L-34 6Z M22 -2 L40 -14 L34 6Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2" stroke-linejoin="round"/>`;
        h += `<ellipse cx="0" cy="0" rx="${o.rx || 24}" ry="${o.ry || 18}" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/><ellipse cx="0" cy="8" rx="15" ry="7" fill="url(#belly)"/>`;
        if (o.mouth) h += `<circle cx="0" cy="6" r="11" fill="#2a0a0a" stroke="${p.line}" stroke-width="2"/>` + Array.from({ length: 8 }, (_, i) => { const a = i / 8 * Math.PI * 2; return `<path d="M${f(Math.cos(a) * 11)} ${f(6 + Math.sin(a) * 11)} L${f(Math.cos(a) * 5)} ${f(6 + Math.sin(a) * 5)}" stroke="#fff" stroke-width="2.6" stroke-linecap="round"/>`; }).join("") + eye(-9, -9, 4, { iris: p.iris, line: p.line }) + eye(9, -9, 4, { iris: p.iris, line: p.line });
        else h += (o.glow ? eye(-9, -3, 5.5, { glow: p.light, slit: true }) + eye(9, -3, 5.5, { glow: p.light, slit: true }) : eye(-9, -3, 6.5, { iris: p.iris, line: p.line, slitPupil: true }) + eye(9, -3, 6.5, { iris: p.iris, line: p.line, slitPupil: true })) +
          `<path d="M-6 8 Q0 12 6 8" stroke="${p.line}" stroke-width="1.8" fill="none"/>` + (o.tongue ? `<path d="M0 11 L0 20 M0 20 l-3 4 M0 20 l3 4" stroke="#ff4a6a" stroke-width="1.6" fill="none"/>` : "");
        if (o.whiskers) h += `<path d="M-14 6 C-34 4 -42 20 -54 12 M14 6 C34 4 42 20 54 12" stroke="${p.light}" stroke-width="2" fill="none"/>`;
        return h + `</g>`;
      };
      if (V === "worm") {
        const d = "M154 146 C154 84 114 52 70 72";
        return `<ellipse cx="154" cy="142" rx="24" ry="7" fill="#1a0e06"/>` + shadowE(100, 144, 60) + tube(d, 30) +
          [0.2, 0.35, 0.5, 0.65, 0.8].map(t => { const x = 154 - t * 84, y = 146 - Math.sin(t * Math.PI * .9) * 80; return `<path d="M${f(x - 12)} ${f(y - 8)} l24 16" stroke="${p.line}" stroke-width="1.6" opacity=".45"/>`; }).join("") +
          head(66, 74, 1.1, { crest: false, mouth: true, rx: 25, ry: 23 }) + `<path d="M130 146 q12 -14 26 -4 q14 -10 26 4Z" fill="#5a3a1a" opacity=".9"/>` + glyph(el, 120, 60, .6, 0);
      }
      if (V === "eel") {
        const d = "M186 98 C166 78 146 118 120 102 C96 86 84 110 64 98";
        return shadowE(118, 144, 64) + ridge(d, 14, -10) + tube(d, 20) + `<path d="M180 92 L198 78 L194 104Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2"/>` + head(56, 94, 1, { crest: false, fins: true }) + glyph(el, 120, 70, .6, 0);
      }
      if (V === "sky") {
        const d = "M196 66 C176 34 156 104 130 84 C106 64 92 104 76 76";
        return ridge(d, 12, -8) + tube(d, 14) + `<path d="M150 98 l-6 12 M156 96 l2 12 M108 88 l-6 12 M114 90 l2 12" stroke="${p.line}" stroke-width="3" stroke-linecap="round"/>` +
          head(66, 66, .95, { horns: true, whiskers: true, crest: false }) + `<path d="M190 60 q10 -14 6 -24 q-8 8 -14 6Z" fill="${p.light}" stroke="${p.line}" stroke-width="1.6"/>` + glyph(el, 196, 40, .5, 0) + glyph(el, 30, 120, .5, 0, .7);
      }
      if (V === "coil") {
        return shadowE(108, 144, 54) + tube("M64 134 C64 122 152 122 152 134 C152 146 64 146 64 134", 16) + tube("M74 122 C74 110 142 110 142 122 C142 132 74 132 74 122", 15) +
          tube("M86 112 C86 104 108 100 104 90 C100 80 86 76 92 62", 15) + head(92, 56, 1, { hood: F.has("hood"), tongue: true }) +
          (F.has("crown") ? `<path d="M80 40 L84 26 L92 36 L100 22 L108 36 L116 26 L120 40Z" fill="#ffc94a" stroke="${p.line}" stroke-width="2" stroke-linejoin="round"/><circle cx="100" cy="34" r="2.6" fill="#ff4a8a"/><path d="M80 52 h10 a4 4 0 0 1 8 0 h4 a4 4 0 0 1 8 0 h10" stroke="${p.line}" stroke-width="1.6" fill="rgba(80,40,120,.5)"/>` : "") +
          (F.has("runes") ? `<ellipse cx="108" cy="104" rx="64" ry="14" fill="none" stroke="${p.light}" stroke-width="1.6" stroke-dasharray="4 6" opacity=".8"/>` + glyph("arcane", 44, 104, .5, 0) + glyph("arcane", 172, 104, .5, 0) : "") + glyph(el, 150, 70, .6, 0);
      }
      if (V === "zigzag") {
        const d = "M26 140 L66 112 L56 98 L104 78 L94 62 L134 48";
        return shadowE(80, 144, 50) + `<g filter="url(#glow)">${tube(d, 16)}</g>` + head(146, 44, .95, { glow: true }) + glyph(el, 40, 70, .7, 0) + glyph(el, 170, 110, .6, 20);
      }
      if (V === "leviathan") {
        const humps = [[118, 126, 22], [160, 128, 16], [190, 130, 10]].map(([x, y, s]) => tube(`M${x - s} ${y + 8} C${x - s} ${y - s} ${x + s} ${y - s} ${x + s} ${y + 8}`, s * .9)).join("");
        return humps + tube("M66 140 C60 110 66 82 78 64", 26) + `<path d="M74 96 l-14 -6 l4 12Z M76 116 l-14 -4 l6 10Z" fill="${p.horn}" stroke="${p.line}" stroke-width="1.6"/>` +
          head(82, 54, 1.3, { fins: true, whiskers: true, crest: true }) +
          `<path d="M0 134 C30 126 60 140 100 132 C140 124 170 138 200 130 V160 H0Z" fill="${p.dark}" opacity=".75"/><path d="M0 134 C30 126 60 140 100 132 C140 124 170 138 200 130" stroke="${p.light}" stroke-width="1.6" fill="none" opacity=".7"/>`;
      }
      // default S-curve (optionally three heads / leafy vines)
      const d = r() > .5 ? "M168 140 C190 118 160 96 128 110 C96 124 70 116 78 86" : "M30 140 C10 120 50 96 90 116 C126 132 140 112 120 86";
      const hx = d[1] === "1" ? 78 : 120, hy = 74;
      let s = shadowE(100, 144, 64) + tube(d, 23);
      if (F.has("leaves")) s += [[40, 128], [70, 112], [104, 120], [130, 108]].map(([x, y], i) => glyph("nature", x, y, .6, i * 60)).join("");
      s += head(hx, hy, 1, { whiskers: F.has("whiskers"), tongue: true });
      if (F.has("heads3")) s += [[hx + 44, hy + 6], [hx + 26, hy - 26]].map(([x, y]) => tube(`M${x} ${y + 14} C${x} ${y + 30} ${x - 10} ${y + 40} ${x - 14} ${y + 50}`, 9) + head(x, y, .6, { glow: true })).join("");
      return s + glyph(el, d[1] === "1" ? 168 : 30, 138, .7, 0);
    },
    bird(p, r, el, F) {
      const V = ["raptor", "chick", "bat", "phoenix", "gull", "swallow", "raven"].find(k => F.has(k)) || "song";
      const L = `stroke="${p.line}" stroke-width="2.4" stroke-linejoin="round"`;
      const big = V === "raptor" || V === "phoenix";
      // wings
      let wingsBack = "", wingsFront = "";
      if (V === "bat") {
        const w = side => `<path d="M100 96 L${100 + side * 30} 50 L${100 + side * 56} 44 L${100 + side * 88} 58 C${100 + side * 78} 66 ${100 + side * 76} 78 ${100 + side * 82} 88 C${100 + side * 70} 84 ${100 + side * 62} 90 ${100 + side * 62} 100 C${100 + side * 52} 94 ${100 + side * 44} 98 ${100 + side * 40} 108 C${100 + side * 30} 100 ${100 + side * 20} 104 ${100 + side * 14} 112Z" fill="url(#bodyLin)" ${L}/><path d="M${100 + side * 30} 50 L${100 + side * 40} 108 M${100 + side * 56} 44 L${100 + side * 62} 100 M${100 + side * 88} 58 L${100 + side * 82} 88" stroke="${p.line}" stroke-width="1.2" opacity=".5"/>`;
        wingsBack = w(-1) + w(1);
      } else if (V === "gull") {
        wingsBack = `<path d="M96 96 C70 80 40 78 4 86 C30 92 56 100 90 108Z" fill="url(#bodyLin)" ${L}/><path d="M104 96 C130 80 160 78 196 86 C170 92 144 100 110 108Z" fill="url(#bodyLin)" ${L}/><path d="M4 86 L22 90 M196 86 L178 90" stroke="${p.line}" stroke-width="4"/>`;
      } else if (V === "chick") {
        wingsFront = `<ellipse cx="72" cy="112" rx="10" ry="6" transform="rotate(-30 72 112)" fill="${p.bodyDark}" ${L}/><ellipse cx="128" cy="112" rx="10" ry="6" transform="rotate(30 128 112)" fill="${p.bodyDark}" ${L}/>`;
      } else if (F.has("folded") || V === "raven" || V === "swallow") {
        wingsFront = `<path d="M102 92 C130 88 146 104 152 128 C134 126 116 118 104 110Z" fill="url(#bodyLin)" ${L}/><path d="M110 100 Q130 104 142 122 M108 106 Q124 110 134 124" stroke="${p.line}" stroke-width="1.2" fill="none" opacity=".5"/>`;
      } else {
        const span = big ? 1.15 : 1;
        const w = side => `<path d="M${100 + side * 8} 92 C${100 + side * 30 * span} 56 ${100 + side * 60 * span} 38 ${100 + side * 88 * span} 32 C${100 + side * 80 * span} 50 ${100 + side * 84 * span} 56 ${100 + side * 76 * span} 64 C${100 + side * 82 * span} 70 ${100 + side * 74 * span} 76 ${100 + side * 66 * span} 78 C${100 + side * 68 * span} 86 ${100 + side * 56 * span} 90 ${100 + side * 48 * span} 92 C${100 + side * 40} 100 ${100 + side * 24} 106 ${100 + side * 10} 108Z" fill="url(#bodyLin)" ${L}/><path d="M${100 + side * 20} 96 L${100 + side * 80 * span} 38 M${100 + side * 22} 100 L${100 + side * 72 * span} 70 M${100 + side * 18} 104 L${100 + side * 56 * span} 90" stroke="${p.line}" stroke-width="1.2" opacity=".45"/>`;
        wingsBack = w(-1) + w(1);
      }
      // tail
      let tail = `<path d="M112 116 L150 132 L140 120 L158 120 L120 106Z" fill="${p.bodyDark}" ${L}/>`;
      if (V === "swallow") tail = `<path d="M112 114 L170 150 L148 124 L186 128 L118 104Z" fill="${p.bodyDark}" ${L}/><path d="M118 112 C150 128 176 136 200 140" stroke="${p.light}" stroke-width="7" fill="none" stroke-linecap="round" opacity=".75" filter="url(#glow)"/>`;
      if (V === "phoenix") tail = [0, 1, 2, 3, 4].map(i => `<path d="M110 116 C${140 + i * 8} ${128 + i * 4} ${160 + i * 6} ${150 - i * 14} ${190 - i * 4} ${150 - i * 22}" stroke="${i % 2 ? p.light : p.main}" stroke-width="${6 - i * .6}" fill="none" stroke-linecap="round"/>`).join("") + glyph(el, 190, 150, .6, 0) + glyph(el, 178, 64, .6, 0);
      if (V === "raven") tail = `<path d="M110 116 L160 144 L150 128 L166 128 L118 106Z" fill="${p.bodyDark}" ${L}/>`;
      if (V === "chick" || V === "bat") tail = "";
      // body + head
      const bodyR = V === "chick" ? 34 : V === "raven" || V === "gull" ? 24 : 30;
      const body = V === "raven" ? `<ellipse cx="102" cy="106" rx="26" ry="30" transform="rotate(20 102 106)" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>` : `<ellipse cx="100" cy="${V === "chick" ? 108 : 106}" rx="${bodyR}" ry="${V === "chick" ? 32 : 28}" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>`;
      const headY = V === "chick" ? 78 : 74;
      const headR = V === "chick" ? 0 : V === "bat" ? 22 : 21;
      let beak = "", top = "", eyes;
      if (V === "bat") {
        beak = `<path d="M90 86 l3 6 l3 -6 M104 86 l3 6 l3 -6" fill="#fff" stroke="${p.line}" stroke-width="1"/>`;
        top = `<path d="M80 62 L72 34 L92 54Z M108 54 L124 32 L120 62Z" fill="${p.body}" ${L}/>`;
        eyes = eye(90, 72, 6.5, { iris: p.iris, line: p.line }) + eye(110, 72, 6.5, { iris: p.iris, line: p.line });
      } else {
        beak = V === "raptor" || V === "raven" ? `<path d="M80 72 C66 70 58 78 62 88 C64 82 70 80 80 84Z" fill="#ffc94a" ${L}/>` : V === "chick" ? `<path d="M94 92 L100 100 L106 92Z" fill="#ffb03a" ${L}/>` : V === "gull" ? `<path d="M78 76 L54 80 L78 86Z" fill="#ffc94a" ${L}/><circle cx="60" cy="81" r="1.6" fill="#e8463a"/>` : `<path d="M78 76 L60 82 L78 86Z" fill="#ffc94a" ${L}/>`;
        if (V === "raptor") top = `<path d="M82 64 L96 70 M100 68 L112 62" stroke="${p.line}" stroke-width="3.2" stroke-linecap="round"/>`;
        if (F.has("crest") || V === "phoenix") top += `<path d="M96 54 C92 36 104 26 116 24 C108 34 110 42 112 50 C118 42 126 40 134 42 C124 46 116 54 108 60Z" fill="${p.light}" stroke="${p.line}" stroke-width="2"/>`;
        if (V === "chick") top = `<path d="M100 76 C96 64 104 60 108 66 C110 58 118 60 114 70" stroke="${p.line}" stroke-width="2" fill="${p.bodyLight}"/>`;
        eyes = V === "chick" ? eye(88, 92, 8, { iris: p.iris, line: p.line }) + eye(112, 92, 8, { iris: p.iris, line: p.line }) : V === "raptor" ? eye(88, 72, 5.5, { glow: p.light }) + eye(103, 71, 5.5, { glow: p.light }) : V === "raven" ? eye(90, 70, 5, { glow: "#ffd27a", slit: true }) : eye(88, 70, 6.5, { iris: p.iris, line: p.line }) + eye(103, 69, 6.5, { iris: p.iris, line: p.line });
      }
      const feet = V === "bat" ? `<path d="M94 132 l-3 8 M106 132 l3 8" stroke="${p.line}" stroke-width="2.4"/>` : V === "raptor" ? `<path d="M90 130 l-4 10 m4 -10 l0 11 m0 -11 l4 10 M110 130 l-4 10 m4 -10 l0 11 m0 -11 l4 10" stroke="#ffb03a" stroke-width="2.6" stroke-linecap="round"/>` : `<path d="M92 132 v8 m-4 0 h8 M106 132 v8 m-4 0 h8" stroke="#e8a33a" stroke-width="2.4" stroke-linecap="round"/>`;
      const headShape = headR ? `<circle cx="${V === "bat" ? 100 : 94}" cy="${headY}" r="${headR}" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>` : "";
      return shadowE(100, 142, 34) + tail + wingsBack + (V === "bat" ? top : "") + body +
        `<ellipse cx="96" cy="114" rx="${V === "chick" ? 22 : 17}" ry="${V === "chick" ? 20 : 15}" fill="url(#belly)"/>` + wingsFront + headShape + beak + eyes + (V !== "bat" ? top : "") + feet +
        (V === "song" || V === "gull" ? glyph(el, 94, 48, .7, 0) : "");
    },
    dragon(p, r, el, F) {
      const L = `stroke="${p.line}" stroke-width="2.4" stroke-linejoin="round"`;
      const D = ["lung", "chibi", "drake", "wyvern", "feathered"].find(k => F.has(k));
      const tubeD = (d, w) => `<path d="${d}" stroke="${p.line}" stroke-width="${w + 5}" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" stroke="url(#bodyLin)" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
      const claw = (x, y, a) => `<g transform="translate(${x} ${y}) rotate(${a})"><path d="M0 0 L0 14" stroke="${p.line}" stroke-width="8" stroke-linecap="round"/><path d="M0 0 L0 14" stroke="${p.body}" stroke-width="4.5" stroke-linecap="round"/><path d="M-4 15 l-2 5 M0 16 l0 5 M4 15 l2 5" stroke="#fff" stroke-width="1.8" stroke-linecap="round"/></g>`;
      if (D === "lung") {
        const d = "M194 128 C172 70 136 146 106 102 C82 66 66 118 62 78";
        return `<g fill="#fff" opacity=".35">${[[40, 120], [150, 60], [170, 140]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="26" ry="8"/>`).join("")}</g>` +
          `<path d="${d}" transform="translate(0 -9)" stroke="${p.horn}" stroke-width="10" fill="none" stroke-linecap="round" stroke-dasharray="3 5"/>` + tubeD(d, 17) +
          `<path d="${d}" stroke="${p.belly}" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="4 4" opacity=".8"/>` +
          claw(150, 112, 10) + claw(124, 120, -10) + claw(92, 94, 20) + claw(72, 104, -20) +
          `<path d="M188 120 q12 -6 10 -20 q-6 6 -14 6Z" fill="${p.light}" stroke="${p.line}" stroke-width="1.6"/>` +
          `<g transform="translate(58 62)"><path d="M-8 -12 C-16 -30 -10 -40 -2 -44 M-2 -32 L-12 -34 M8 -12 C14 -30 22 -36 30 -36 M18 -28 L22 -38" stroke="${p.horn}" stroke-width="4" fill="none" stroke-linecap="round"/>` +
          `<path d="M14 -6 C24 -4 30 4 28 14 C22 10 18 8 12 8Z" fill="${p.horn}" stroke="${p.line}" stroke-width="1.6"/>` +
          `<path d="M-24 4 C-22 -10 -8 -16 6 -14 C18 -12 22 0 18 10 C14 18 0 20 -10 16 L-30 14 C-36 12 -34 4 -24 4Z" fill="url(#body)" stroke="${p.line}" stroke-width="2.4"/>` +
          `<path d="M-30 10 C-46 8 -54 22 -66 16 M-28 14 C-40 20 -44 34 -56 34" stroke="${p.light}" stroke-width="2" fill="none"/>` +
          eye(0, -2, 5, { glow: p.light, slit: true }) + `<path d="M-32 12 l4 3 l4 -3" fill="#fff" stroke="${p.line}" stroke-width=".8"/></g>` +
          glyph(el, 30, 40, .7, 0) + glyph(el, 176, 30, .6, 0);
      }
      if (D === "chibi") {
        return shadowE(100, 146, 36) + `<path d="M64 120 L70 106 L78 116 L86 102 L94 114 L102 100 L110 114 L118 102 L126 116 L134 106 L138 120 C138 146 64 146 64 120Z" fill="#fffaf0" stroke="${p.line}" stroke-width="2.2" stroke-linejoin="round"/>` +
          `<path d="M120 112 C140 116 148 104 144 96 C152 98 154 106 150 112" stroke="${p.line}" stroke-width="8" fill="none" stroke-linecap="round"/><path d="M120 112 C140 116 148 104 144 96" stroke="${p.body}" stroke-width="4.5" fill="none" stroke-linecap="round"/>` +
          `<path d="M76 92 L50 70 L56 86 L44 90 L62 100Z M124 92 L150 70 L144 86 L156 90 L138 100Z" fill="${p.light}" stroke="${p.line}" stroke-width="2.2" stroke-linejoin="round"/>` +
          `<ellipse cx="100" cy="108" rx="24" ry="20" fill="url(#body)" stroke="${p.line}" stroke-width="2.4"/><ellipse cx="100" cy="114" rx="14" ry="12" fill="url(#belly)"/>` +
          `<path d="M80 50 L74 30 L90 44Z M120 50 L126 30 L110 44Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2" stroke-linejoin="round"/>` +
          `<circle cx="100" cy="66" r="28" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/><ellipse cx="100" cy="80" rx="16" ry="10" fill="url(#belly)"/>` +
          eye(88, 64, 8.5, { iris: p.iris, line: p.line }) + eye(112, 64, 8.5, { iris: p.iris, line: p.line }) +
          `<circle cx="94" cy="78" r="1.6" fill="${p.line}"/><circle cx="106" cy="78" r="1.6" fill="${p.line}"/><path d="M93 84 Q100 90 107 84" stroke="${p.line}" stroke-width="2" fill="none"/><path d="M96 86 l2 3 l2 -3" fill="#fff"/>` +
          `<ellipse cx="78" cy="76" rx="5" ry="3" fill="#ff7aa0" opacity=".55"/><ellipse cx="122" cy="76" rx="5" ry="3" fill="#ff7aa0" opacity=".55"/>` +
          `<g filter="url(#glow)" opacity=".9">${glyph(el, 128, 86, .5, 30)}</g>` + `<path d="M150 30 l-6 10 M160 40 l-10 2" stroke="${p.light}" stroke-width="2" stroke-linecap="round"/>`;
      }
      if (D === "drake") {
        const moss = F.has("moss");
        return shadowE(108, 146, 70) +
          `<path d="M150 112 C174 116 190 124 198 140 L156 126Z" fill="url(#bodyLin)" stroke="${p.line}" stroke-width="2.4" stroke-linejoin="round"/>` +
          `<rect x="128" y="112" width="18" height="30" rx="7" fill="${p.bodyDark}" stroke="${p.line}" stroke-width="2.2"/><rect x="72" y="114" width="18" height="28" rx="7" fill="${p.bodyDark}" stroke="${p.line}" stroke-width="2.2"/>` +
          `<ellipse cx="112" cy="108" rx="50" ry="25" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/><path d="M80 122 C100 128 126 128 146 120" stroke="${p.belly}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".8"/>` +
          (moss ? `<path d="M70 92 C86 74 140 72 158 94 C140 88 90 88 70 92Z" fill="#5ccf6a" stroke="${p.line}" stroke-width="2"/>` + [[84, 84, "#ff9ac8"], [100, 78, "#fff6a8"], [118, 78, "#ff9ac8"], [136, 82, "#fff"], [110, 82, "#c4f59a"]].map(([x, y, c]) => `<circle cx="${x}" cy="${y}" r="3.4" fill="${c}" stroke="${p.line}" stroke-width=".8"/><path d="M${x} ${y + 3} v6" stroke="#2c6b34" stroke-width="1.4"/>`).join("") + `<path d="M126 74 V60" stroke="#6a4a22" stroke-width="3"/><circle cx="126" cy="56" r="8" fill="#3fa84a" stroke="${p.line}" stroke-width="1.6"/>`
            : Array.from({ length: 6 }, (_, i) => { const x = 80 + i * 13; return `<path d="M${x - 6} ${88 + Math.abs(i - 2.5) * 2} L${x} ${72 + Math.abs(i - 2.5) * 3} L${x + 6} ${88 + Math.abs(i - 2.5) * 2}Z" fill="${p.horn}" stroke="${p.line}" stroke-width="1.6" stroke-linejoin="round"/>`; }).join("")) +
          `<rect x="140" y="114" width="18" height="28" rx="7" fill="${p.body}" stroke="${p.line}" stroke-width="2.2"/><rect x="84" y="116" width="18" height="27" rx="7" fill="${p.body}" stroke="${p.line}" stroke-width="2.2"/>` +
          `<path d="M42 84 C40 72 58 64 74 70 C78 64 86 62 88 68 C96 74 96 92 86 100 L50 104 C38 104 34 94 42 84Z" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>` +
          `<path d="M70 70 C66 56 74 48 82 46 C78 54 80 62 82 68Z M80 68 C82 56 92 50 100 52 C92 58 90 64 88 72Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2"/>` +
          `<path d="M38 96 L86 98" stroke="${p.line}" stroke-width="1.8"/><path d="M44 96 l3 4 l3 -4 M56 97 l3 4 l3 -4" fill="#fff" stroke="${p.line}" stroke-width=".8"/><circle cx="42" cy="86" r="2" fill="${p.line}"/>` +
          (moss ? eye(70, 82, 5.5, { iris: p.iris, line: p.line, sleepy: true, lid: p.body }) : eye(70, 82, 5.5, { glow: p.light, slit: true })) + glyph(el, 170, 140, .5, 0, .8);
      }
      if (D === "wyvern") {
        return shadowE(110, 146, 50) +
          `<path d="M124 120 C150 132 176 134 192 120 C182 140 156 146 126 134Z" fill="url(#bodyLin)" stroke="${p.line}" stroke-width="2.4"/>` +
          `<path d="M96 80 L44 20 L46 52 L18 50 L40 74 L14 84 L46 96 L36 116 L80 104Z" fill="url(#bodyLin)" stroke="${p.line}" stroke-width="2.4" stroke-linejoin="round" opacity=".95"/><path d="M96 80 L46 52 M92 88 L40 74 M88 96 L46 96 M84 102 L36 116" stroke="${p.line}" stroke-width="1.2" opacity=".45"/>` +
          `<path d="M124 80 L176 20 L174 52 L200 54 L180 76 L200 88 L170 96 L178 116 L136 104Z" fill="url(#bodyLin)" stroke="${p.line}" stroke-width="2.4" stroke-linejoin="round"/><path d="M124 80 L174 52 M128 88 L180 76 M132 96 L170 96 M136 102 L178 116" stroke="${p.line}" stroke-width="1.2" opacity=".45"/>` +
          `<path d="M44 20 l-6 -6 M176 20 l6 -6" stroke="${p.horn}" stroke-width="3" stroke-linecap="round"/>` +
          `<path d="M96 132 L90 142 M124 132 L130 142" stroke="${p.line}" stroke-width="9" stroke-linecap="round"/><path d="M96 132 L90 142 M124 132 L130 142" stroke="${p.bodyDark}" stroke-width="5" stroke-linecap="round"/>` +
          `<ellipse cx="110" cy="110" rx="24" ry="28" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/><path d="M98 96 h24 M96 106 h28 M98 116 h24 M100 126 h20" stroke="${p.belly}" stroke-width="3" stroke-linecap="round"/>` +
          `<path d="M108 86 C104 70 100 58 92 46" stroke="${p.line}" stroke-width="17" fill="none" stroke-linecap="round"/><path d="M108 86 C104 70 100 58 92 46" stroke="${p.body}" stroke-width="12" fill="none" stroke-linecap="round"/>` +
          `<path d="M86 30 L80 8 L94 24Z M98 28 L106 6 L106 30Z" fill="${p.horn}" stroke="${p.line}" stroke-width="1.8" stroke-linejoin="round"/>` +
          `<path d="M78 36 C82 24 104 24 106 36 C108 44 100 48 92 48 L66 50 C60 50 58 42 64 40Z" fill="url(#body)" stroke="${p.line}" stroke-width="2.4"/><path d="M64 46 L92 54 L66 56Z" fill="#2a0a1a" stroke="${p.line}" stroke-width="1.6"/>` +
          eye(92, 36, 4.6, { glow: p.light, slit: true }) +
          `<g filter="url(#glow)" opacity=".9"><path d="M64 50 C44 54 30 66 10 66 C28 74 46 66 62 56Z" fill="${p.light}"/></g>` + Array.from({ length: 6 }, () => glyph(el, 10 + r() * 50, 56 + r() * 20, .3, r() * 90, .9)).join("");
      }
      if (D === "feathered") {
        const fw = s => Array.from({ length: 6 }, (_, i) => { const a = -0.3 - i * .22; return `<path d="M${100 + s * 10} 88 Q${f(100 + s * (40 + i * 6))} ${f(88 + Math.sin(a) * 60)} ${f(100 + s * (64 + i * 10) * Math.cos(a * .4))} ${f(92 + Math.sin(a) * (70 - i * 4))} Q${f(100 + s * (44 + i * 4))} ${f(96 + Math.sin(a) * 40)} ${100 + s * 12} 98Z" fill="${i % 2 ? p.light : p.main}" stroke="${p.line}" stroke-width="1.6" stroke-linejoin="round"/>`; }).reverse().join("");
        return fw(-1) + fw(1) +
          [0, 1, 2, 3].map(i => `<path d="M118 112 C${146 + i * 6} ${118 + i * 6} ${170 + i * 4} ${130 + i * 6} ${192} ${120 + i * 10}" stroke="${i % 2 ? p.light : p.main}" stroke-width="${7 - i}" fill="none" stroke-linecap="round"/>`).join("") +
          `<path d="M82 98 C84 82 118 80 124 98 C128 114 116 126 100 126 C86 126 78 114 82 98Z" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/><path d="M90 104 q10 6 20 0 M90 112 q10 6 20 0" stroke="${p.belly}" stroke-width="2.6" fill="none"/>` +
          claw(90, 122, 10) + claw(110, 122, -10) +
          `<path d="M94 88 C88 74 86 62 92 50" stroke="${p.line}" stroke-width="16" fill="none" stroke-linecap="round"/><path d="M94 88 C88 74 86 62 92 50" stroke="${p.body}" stroke-width="11" fill="none" stroke-linecap="round"/>` +
          `<path d="M96 34 C98 18 110 10 120 10 C114 18 114 24 116 30 C122 22 132 20 138 24 C128 28 120 36 112 44Z" fill="${p.light}" stroke="${p.line}" stroke-width="1.8"/>` +
          `<path d="M84 44 C88 32 110 32 112 44 C114 52 106 56 98 56 L74 58 C68 58 66 50 72 48Z" fill="url(#body)" stroke="${p.line}" stroke-width="2.4"/>` + eye(98, 44, 5, { glow: p.light }) +
          `<path d="M72 54 L84 56" stroke="${p.line}" stroke-width="1.6"/>` + glyph(el, 40, 130, .6, 0, .8) + glyph(el, 160, 40, .6, 0, .8);
      }

      if (F.has("front")) {
        const w = s => `<path d="M${100 + s * 14} 84 L${100 + s * 40} 30 L${100 + s * 64} 20 L${100 + s * 96} 36 C${100 + s * 84} 48 ${100 + s * 84} 60 ${100 + s * 92} 72 C${100 + s * 78} 68 ${100 + s * 70} 76 ${100 + s * 70} 88 C${100 + s * 58} 82 ${100 + s * 48} 88 ${100 + s * 44} 100 C${100 + s * 34} 94 ${100 + s * 24} 98 ${100 + s * 18} 106Z" fill="url(#bodyLin)" ${L}/><path d="M${100 + s * 40} 30 L${100 + s * 44} 100 M${100 + s * 64} 20 L${100 + s * 70} 88 M${100 + s * 96} 36 L${100 + s * 92} 72" stroke="${p.line}" stroke-width="1.2" opacity=".5"/>`;
        return shadowE(100, 146, 50) + w(-1) + w(1) + `<path d="M118 130 C150 140 170 126 168 110 C166 100 178 96 184 104" stroke="${p.line}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M118 130 C150 140 170 126 168 110 C166 100 178 96 184 104" stroke="${p.body}" stroke-width="7" fill="none" stroke-linecap="round"/>` +
          `<path d="M78 98 C80 80 120 80 122 98 C126 122 116 138 100 140 C84 138 74 122 78 98Z" fill="url(#body)" ${L}/><path d="M88 104 H112 M86 114 H114 M90 124 H110" stroke="${p.belly}" stroke-width="3" stroke-linecap="round" opacity=".8"/>` +
          `<rect x="82" y="128" width="12" height="14" rx="5" fill="${p.body}" ${L}/><rect x="106" y="128" width="12" height="14" rx="5" fill="${p.body}" ${L}/>` +
          `<path d="M92 92 L100 70 L108 92Z" fill="url(#body)" ${L}/><path d="M86 44 C76 26 80 12 88 6 C88 20 92 30 94 40Z M114 44 C124 26 120 12 112 6 C112 20 108 30 106 40Z" fill="${p.horn}" ${L}/>` +
          `<path d="M82 52 C82 36 118 36 118 52 C118 64 110 74 100 78 C90 74 82 64 82 52Z" fill="url(#body)" ${L}/>` + eye(91, 52, 5, { glow: p.light, slit: true }) + eye(109, 52, 5, { glow: p.light, slit: true }) +
          `<path d="M95 68 L100 72 L105 68" stroke="${p.line}" stroke-width="1.6" fill="none"/><path d="M92 72 l2 5 l2 -5 M104 72 l2 5 l2 -5" fill="#fff" stroke="${p.line}" stroke-width=".8"/>` +
          `<g filter="url(#glow)">${glyph(el, 40, 118, .9, 0)}${glyph(el, 162, 40, .7, 0)}${glyph(el, 30, 30, .6, 0)}</g>`;
      }
      if (F.has("perched")) {
        return `<path d="M30 150 A70 70 0 0 0 170 150 A58 58 0 0 1 30 150Z" fill="#e9dcff" opacity=".85" filter="url(#glow)"/>` +
          `<path d="M130 132 C164 136 182 118 176 98 C172 86 184 80 190 88" stroke="${p.line}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M130 132 C164 136 182 118 176 98 C172 86 184 80 190 88" stroke="${p.body}" stroke-width="7" fill="none" stroke-linecap="round"/>` +
          `<path d="M84 140 C70 112 78 80 100 70 C124 62 142 90 138 118 C136 132 128 140 118 142Z" fill="url(#body)" ${L}/>` +
          `<path d="M120 70 C150 56 168 66 172 96 C162 92 156 100 158 112 C148 106 140 112 140 124 C130 114 124 96 120 70Z" fill="${p.bodyDark}" ${L}/><path d="M126 78 L164 84 M130 92 L156 104 M134 106 L146 118" stroke="${p.light}" stroke-width="1.2" opacity=".5"/>` +
          `<path d="M96 76 C86 62 82 50 86 38" stroke="${p.line}" stroke-width="20" fill="none" stroke-linecap="round"/><path d="M96 76 C86 62 82 50 86 38" stroke="${p.body}" stroke-width="15" fill="none" stroke-linecap="round"/>` +
          `<path d="M82 26 C76 12 82 4 90 0 C88 10 90 18 92 24Z M94 24 C98 10 106 6 114 6 C108 14 104 22 100 30Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2"/>` +
          `<path d="M76 32 C82 20 104 20 106 32 C108 42 98 48 86 50 L62 52 C54 52 52 44 58 40Z" fill="url(#body)" ${L}/>` + eye(88, 36, 5.5, { glow: "#ffe27a", slit: true }) + `<circle cx="62" cy="44" r="1.8" fill="${p.line}"/>` +
          `<path d="M90 140 l-4 6 M98 140 l0 7 M106 140 l4 6" stroke="${p.line}" stroke-width="2.6" stroke-linecap="round"/>` + glyph(el, 50, 90, .7, 0, .9) + glyph(el, 40, 60, .5, 0, .7);
      }
      return shadowE(104, 144, 56) +
        `<path d="M98 92 L24 30 L32 62 L8 66 L40 90 L22 106 L84 104Z" fill="${p.bodyDark}" stroke="${p.line}" stroke-width="2.4" stroke-linejoin="round" opacity=".95"/>` +
        `<path d="M98 92 L32 62 M96 96 L40 90 M94 100 L22 106" stroke="${p.light}" stroke-width="1" opacity=".5"/>` +
        `<path d="M134 120 C164 130 180 118 178 100 C176 90 186 86 190 92" stroke="${p.line}" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M134 120 C164 130 180 118 178 100 C176 90 186 86 190 92" stroke="${p.body}" stroke-width="8" fill="none" stroke-linecap="round"/>` +
        glyph(el, 190, 88, .7, 30) +
        `<path d="M106 92 L176 22 L170 58 L196 60 L164 88 L184 102 L124 106Z" fill="url(#bodyLin)" stroke="${p.line}" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<path d="M108 94 L170 58 M112 98 L164 88 M116 102 L184 102" stroke="${p.line}" stroke-width="1.2" opacity=".45"/>` +
        `<ellipse cx="112" cy="116" rx="32" ry="22" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>` +
        `<path d="M94 106 h28 M92 114 h34 M94 122 h30" stroke="${p.belly}" stroke-width="3" stroke-linecap="round" opacity=".7"/>` +
        `<rect x="90" y="124" width="14" height="18" rx="6" fill="${p.body}" stroke="${p.line}" stroke-width="2.2"/><rect x="118" y="124" width="14" height="18" rx="6" fill="${p.body}" stroke="${p.line}" stroke-width="2.2"/>` +
        `<path d="M98 104 C88 92 84 80 84 66" stroke="${p.line}" stroke-width="20" fill="none" stroke-linecap="round"/><path d="M98 104 C88 92 84 80 84 66" stroke="${p.body}" stroke-width="15" fill="none" stroke-linecap="round"/>` +
        `<path d="M78 52 C74 34 86 22 96 18 C90 32 92 42 92 52Z M92 52 C96 36 110 30 120 30 C110 40 106 48 102 58Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2"/>` +
        `<path d="M72 58 C80 46 102 46 104 60 C106 70 96 76 84 78 L60 80 C52 80 50 72 56 68 Z" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>` +
        `<path d="M58 76 L66 80 L60 84" fill="#fff" stroke="${p.line}" stroke-width="1"/>` + eye(86, 62, 6, { glow: p.light, slit: true }) +
        `<circle cx="60" cy="70" r="1.8" fill="${p.line}"/>` + `<g filter="url(#glow)" opacity=".9"><path d="M54 74 C40 70 30 78 20 74 C30 84 40 80 52 82Z" fill="${p.light}"/></g>` + glyph(el, 150, 140, .5, 0, .8);
    },
    golem(p, r, el, F) {
      if (F.has("orb")) return shadowE(100, 146, 30) + `<ellipse cx="100" cy="88" rx="62" ry="16" fill="none" stroke="${p.light}" stroke-width="2" opacity=".7" transform="rotate(-12 100 88)"/>` +
        `<circle cx="100" cy="88" r="36" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/><ellipse cx="88" cy="74" rx="12" ry="7" fill="#fff" opacity=".4"/>` +
        eye(100, 90, 13, { iris: p.iris, line: p.line }) + [[40, 70], [160, 104], [62, 116]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${p.horn}" stroke="${p.line}" stroke-width="1.8"/>`).join("");
      if (F.has("round")) return shadowE(100, 144, 36) + `<rect x="80" y="124" width="14" height="16" rx="6" fill="${p.bodyDark}" stroke="${p.line}" stroke-width="2"/><rect x="106" y="124" width="14" height="16" rx="6" fill="${p.bodyDark}" stroke="${p.line}" stroke-width="2"/>` +
        `<path d="M62 104 C60 76 80 64 102 64 C126 64 142 80 138 106 C136 126 118 134 100 134 C78 134 64 124 62 104Z" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/><path d="M78 80 L86 90 M120 84 L114 96" stroke="${p.line}" stroke-width="1.6" opacity=".5"/>` +
        eye(88, 98, 7.5, { iris: p.iris, line: p.line }) + eye(112, 98, 7.5, { iris: p.iris, line: p.line }) + `<path d="M94 112 Q100 116 106 112" stroke="${p.line}" stroke-width="2" fill="none"/>` + glyph(el, 100, 62, .7, 0);
      const L = `stroke="${p.line}" stroke-width="2.4" stroke-linejoin="round"`;
      if (F.has("mummy")) return shadowE(100, 144, 36) + `<rect x="80" y="122" width="16" height="20" rx="6" fill="#e8dcc0" ${L}/><rect x="104" y="122" width="16" height="20" rx="6" fill="#e8dcc0" ${L}/>` +
        `<path d="M64 104 C62 74 80 58 100 58 C120 58 138 74 136 104 C136 124 120 132 100 132 C80 132 64 124 64 104Z" fill="#efe4c8" ${L}/>` +
        [64, 74, 84, 94, 104, 114, 124].map((y, i) => `<path d="M${66 + (i % 2) * 2} ${y} C90 ${y + 6} 112 ${y - 4} ${134 - (i % 2) * 2} ${y + 3}" stroke="#c8b890" stroke-width="2" fill="none"/>`).join("") +
        `<path d="M66 92 C52 96 46 104 50 112 M134 92 C148 96 154 104 150 112" stroke="#efe4c8" stroke-width="10" stroke-linecap="round"/><path d="M134 100 C150 110 156 126 164 136" stroke="#efe4c8" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M78 80 C86 74 104 74 122 80 L122 92 C104 86 86 86 78 92Z" fill="#2a1a0a"/>` + eye(108, 85, 5, { glow: p.light }) + `<circle cx="90" cy="85" r="2" fill="${p.light}" opacity=".5"/>` + glyph(el, 100, 54, .6, 0);
      if (F.has("bull")) return shadowE(100, 144, 50) + `<rect x="76" y="116" width="20" height="26" rx="6" fill="${p.bodyDark}" ${L}/><rect x="104" y="116" width="20" height="26" rx="6" fill="${p.bodyDark}" ${L}/><path d="M76 138 h20 M104 138 h20" stroke="${p.line}" stroke-width="5"/>` +
        `<path d="M48 76 C36 96 34 118 42 128 L58 126 C58 110 62 98 68 88Z M152 76 C164 96 166 118 158 128 L142 126 C142 110 138 98 132 88Z" fill="url(#body)" ${L}/><circle cx="50" cy="128" r="9" fill="url(#body)" ${L}/><circle cx="150" cy="128" r="9" fill="url(#body)" ${L}/>` +
        `<path d="M58 76 C58 60 80 54 100 54 C120 54 142 60 142 76 L134 118 C120 124 80 124 66 118Z" fill="url(#body)" ${L}/><path d="M84 78 C92 86 108 86 116 78 M80 96 Q100 104 120 96" stroke="${p.line}" stroke-width="1.6" fill="none" opacity=".5"/>` +
        `<path d="M76 40 C56 38 46 26 48 14 C56 24 66 28 80 30Z M124 40 C144 38 154 26 152 14 C144 24 134 28 120 30Z" fill="#fffbe8" ${L}/>` +
        `<path d="M74 34 C70 24 82 20 88 26 M126 34 C130 24 118 20 112 26" fill="url(#body)" ${L}/>` +
        `<path d="M78 34 C78 22 122 22 122 34 L120 58 C116 70 84 70 80 58Z" fill="url(#body)" ${L}/><ellipse cx="100" cy="60" rx="15" ry="10" fill="url(#belly)" ${L}/><circle cx="95" cy="60" r="2.2" fill="${p.line}"/><circle cx="105" cy="60" r="2.2" fill="${p.line}"/>` +
        `<path d="M94 66 A6 6 0 0 0 106 66" stroke="#ffc94a" stroke-width="2.6" fill="none"/>` + eye(90, 44, 4.5, { glow: "#ff6a3d" }) + eye(110, 44, 4.5, { glow: "#ff6a3d" }) + `<path d="M84 38 L96 42 M116 38 L104 42" stroke="${p.line}" stroke-width="3" stroke-linecap="round"/>`;
      if (F.has("werewolf")) return shadowE(100, 144, 50) + `<path d="M80 142 L84 118 L96 120 L94 142Z M106 142 L104 120 L116 118 L122 142Z" fill="${p.bodyDark}" ${L}/>` +
        `<path d="M62 84 C44 100 38 122 40 136 M138 84 C156 100 162 122 160 136" stroke="${p.line}" stroke-width="15" fill="none" stroke-linecap="round"/><path d="M62 84 C44 100 38 122 40 136 M138 84 C156 100 162 122 160 136" stroke="${p.body}" stroke-width="10" fill="none" stroke-linecap="round"/>` +
        `<path d="M34 136 l-2 8 M40 138 l0 8 M46 136 l2 8 M154 136 l-2 8 M160 138 l0 8 M166 136 l2 8" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>` +
        `<path d="M66 76 C70 60 90 56 100 56 C114 56 132 62 136 78 C142 98 132 122 100 124 C70 122 58 98 66 76Z" fill="url(#body)" ${L}/>` +
        `<path d="M82 74 L76 66 L86 70 L84 60 L94 68 M118 74 L124 66 L114 70 L116 60 L106 68" stroke="${p.line}" stroke-width="2" fill="none"/><ellipse cx="100" cy="98" rx="18" ry="20" fill="url(#belly)"/>` +
        `<path d="M80 40 L76 14 L92 32Z M120 40 L124 14 L108 32Z" fill="url(#body)" ${L}/>` +
        `<path d="M78 46 C78 30 122 30 122 46 C122 58 116 64 112 66 L108 78 C104 84 96 84 92 78 L88 66 C84 64 78 58 78 46Z" fill="url(#body)" ${L}/><ellipse cx="100" cy="70" rx="9" ry="7" fill="url(#belly)"/><ellipse cx="100" cy="66" rx="4" ry="3" fill="${p.line}"/>` +
        `<path d="M93 76 l2 5 l2 -5 M103 76 l2 5 l2 -5" fill="#fff" stroke="${p.line}" stroke-width=".8"/>` + eye(90, 50, 5, { glow: "#ffd23b", slit: true }) + eye(110, 50, 5, { glow: "#ffd23b", slit: true }) + `<path d="M82 42 L96 46 M118 42 L104 46" stroke="${p.line}" stroke-width="3" stroke-linecap="round"/>`;
      if (F.has("tree")) {
        return shadowE(100, 146, 60) + `<path d="M70 146 C76 132 80 128 82 118 M130 146 C124 132 120 128 118 118 M100 146 V124" stroke="#6a4a22" stroke-width="9" stroke-linecap="round"/>` +
          `<path d="M76 124 C70 96 74 68 84 52 L116 52 C126 68 130 96 124 124Z" fill="#8a6234" ${L}/><path d="M86 60 C84 80 88 100 86 118 M100 56 V120 M114 60 C116 80 112 100 114 118" stroke="#5a3a1a" stroke-width="1.8" fill="none" opacity=".7"/>` +
          `<path d="M78 76 C60 70 48 56 42 40 M48 52 L36 50 M122 76 C140 70 152 56 158 40 M152 52 L164 50" stroke="#6a4a22" stroke-width="7" fill="none" stroke-linecap="round"/>` +
          `<g stroke="${p.line}" stroke-width="2">` + [[100, 30, 28], [70, 40, 20], [130, 40, 20], [44, 34, 14], [156, 34, 14], [100, 10, 16]].map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${p.light}"/>`).join("") + `</g>` +
          [[84, 26], [116, 30], [100, 14], [62, 40]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#ff9ac8"/>`).join("") +
          `<ellipse cx="92" cy="84" rx="6" ry="4" fill="#2a1a0a"/><ellipse cx="110" cy="84" rx="6" ry="4" fill="#2a1a0a"/>` + eye(92, 84, 3, { glow: "#c4f59a" }) + eye(110, 84, 3, { glow: "#c4f59a" }) + `<path d="M92 100 Q101 106 110 100" stroke="#2a1a0a" stroke-width="2.4" fill="none"/>`;
      }
      if (F.has("mushroom")) {
        return shadowE(100, 144, 50) + `<path d="M70 140 C64 110 70 84 80 70 L120 70 C130 84 136 110 130 140Z" fill="#f4e8d0" ${L}/><path d="M64 128 C52 124 48 112 54 106 M136 128 C148 124 152 112 146 106" stroke="${p.line}" stroke-width="2.4" fill="#f4e8d0"/>` +
          `<path d="M30 74 C30 20 170 20 170 74 C140 84 60 84 30 74Z" fill="${p.horn}" ${L}/>` + [[60, 52, 7], [100, 36, 9], [138, 52, 7], [82, 64, 5], [120, 64, 5], [44, 66, 4]].map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="#fff" opacity=".85"/>`).join("") +
          `<path d="M80 74 v6 M92 76 v8 M108 76 v8 M120 74 v6" stroke="${p.line}" stroke-width="1.2" opacity=".5"/>` +
          eye(88, 102, 7, { iris: p.iris, line: p.line, sleepy: true, lid: "#e4d4b4" }) + eye(112, 102, 7, { iris: p.iris, line: p.line, sleepy: true, lid: "#e4d4b4" }) + `<ellipse cx="100" cy="120" rx="6" ry="4" fill="${p.line}"/>` +
          `<g fill="${p.light}" opacity=".7">${[[40, 100], [160, 96], [150, 120], [52, 124]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3"/>`).join("")}</g>`;
      }
      if (F.has("crystal")) {
        return shadowE(100, 146, 56) + `<path d="M78 142 L74 118 L92 116 L96 142Z M104 142 L108 116 L126 118 L122 142Z" fill="${p.bodyDark}" ${L}/>` +
          `<path d="M60 78 L40 92 L36 128 L54 124 L62 98Z M140 78 L160 92 L164 128 L146 124 L138 98Z" fill="url(#bodyLin)" ${L}/>` +
          `<path d="M100 54 L140 74 L134 118 L100 128 L66 118 L60 74Z" fill="url(#body)" ${L}/><path d="M100 54 L100 128 M60 74 L100 92 L140 74 M66 118 L100 92 L134 118" stroke="#fff" stroke-width="1.2" opacity=".55" fill="none"/>` +
          `<path d="M88 52 L100 18 L112 52 L100 60Z" fill="url(#body)" ${L}/><path d="M74 60 L70 34 L84 54Z M126 60 L130 34 L116 54Z" fill="${p.light}" ${L}/>` +
          eye(94, 44, 3.4, { glow: p.light }) + eye(106, 44, 3.4, { glow: p.light }) + `<path d="M100 84 L108 94 L100 104 L92 94Z" fill="#fff" filter="url(#glow)"/>` + glyph(el, 40, 64, .7, -20) + glyph(el, 162, 60, .7, 20);
      }
      if (F.has("nebula")) {
        return `<g filter="url(#soft)" opacity=".9"><path d="M54 120 C34 100 46 64 72 60 C78 34 124 30 132 58 C162 60 170 100 148 122 C150 140 120 148 100 138 C80 150 50 140 54 120Z" fill="url(#body)"/></g>` +
          `<path d="M54 120 C34 100 46 64 72 60 C78 34 124 30 132 58 C162 60 170 100 148 122 C150 140 120 148 100 138 C80 150 50 140 54 120Z" fill="none" stroke="${p.light}" stroke-width="1.6" opacity=".7"/>` +
          Array.from({ length: 14 }, () => `<circle cx="${f(60 + r() * 84)}" cy="${f(56 + r() * 76)}" r="${f(.6 + r() * 1.6)}" fill="#fff"/>`).join("") +
          `<circle cx="100" cy="102" r="14" fill="#1b1840" stroke="${p.light}" stroke-width="1.4"/><circle cx="100" cy="102" r="6" fill="#ffd27a" filter="url(#glow)"/>` +
          eye(88, 70, 5, { glow: "#fff4d6" }) + eye(112, 70, 5, { glow: "#fff4d6" }) + `<path d="M40 96 C24 90 20 74 30 66 M160 96 C176 90 180 74 170 66" stroke="${p.light}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>`;
      }
      const fur = F.has("furry");
      const body = fur ? "#eef6ff" : "url(#body)";
      let chest = `<path d="M100 82 L110 94 L100 108 L90 94Z" fill="${p.light}" stroke="${p.line}" stroke-width="1.8" filter="url(#glow)"/>`;
      if (F.has("clock")) chest = `<circle cx="100" cy="94" r="16" fill="${p.light}" stroke="${p.line}" stroke-width="2.2"/><path d="M100 94 V82 M100 94 L110 98" stroke="${p.line}" stroke-width="2.4" stroke-linecap="round"/>` + Array.from({ length: 12 }, (_, i) => `<circle cx="${f(100 + Math.cos(i * .5236) * 13)}" cy="${f(94 + Math.sin(i * .5236) * 13)}" r=".9" fill="${p.line}"/>`).join("");
      const bolts = F.has("bolts") ? `<g filter="url(#glow)" stroke="#fff6a8" stroke-width="2.2" fill="none"><path d="M70 78 L80 90 L72 96 L84 110"/><path d="M130 76 L120 90 L128 98 L116 112"/></g><path d="M86 38 L80 16 M114 38 L120 16" stroke="${p.line}" stroke-width="3"/><circle cx="80" cy="14" r="4" fill="#fff6a8" filter="url(#glow)"/><circle cx="120" cy="14" r="4" fill="#fff6a8" filter="url(#glow)"/>` : "";
      const crystals = F.has("crystals") ? [[56, 66, -20], [66, 60, -5], [140, 64, 20], [132, 58, 5]].map(([x, y, a]) => `<path d="M${x - 4} ${y + 6} L${x} ${y - 16} L${x + 4} ${y + 6}Z" fill="${p.light}" stroke="${p.line}" stroke-width="1.4" transform="rotate(${a} ${x} ${y})"/>`).join("") : "";
      return shadowE(100, 144, 56) +
        `<rect x="74" y="116" width="22" height="26" rx="${fur ? 10 : 6}" fill="${fur ? "#d8e8f4" : p.bodyDark}" stroke="${p.line}" stroke-width="2.4"/><rect x="104" y="116" width="22" height="26" rx="${fur ? 10 : 6}" fill="${fur ? "#d8e8f4" : p.bodyDark}" stroke="${p.line}" stroke-width="2.4"/>` +
        `<rect x="40" y="72" width="24" height="${fur ? 60 : 54}" rx="11" fill="${body}" stroke="${p.line}" stroke-width="2.4"/><rect x="136" y="72" width="24" height="${fur ? 60 : 54}" rx="11" fill="${body}" stroke="${p.line}" stroke-width="2.4"/>` +
        `<rect x="62" y="64" width="76" height="60" rx="${fur ? 28 : 16}" fill="${body}" stroke="${p.line}" stroke-width="2.6"/>` +
        (fur ? `<path d="M70 72 l6 6 M80 70 l6 6 M118 70 l6 6 M126 74 l6 6 M44 90 l6 4 M144 90 l6 4" stroke="#b8cfe0" stroke-width="2" stroke-linecap="round"/><ellipse cx="100" cy="98" rx="20" ry="18" fill="${p.main}" opacity=".5"/>` : chest) + bolts +
        `<rect x="82" y="38" width="36" height="30" rx="${fur ? 15 : 9}" fill="${body}" stroke="${p.line}" stroke-width="2.6"/>` +
        (fur ? eye(93, 52, 4.5, { iris: p.iris, line: p.line }) + eye(108, 52, 4.5, { iris: p.iris, line: p.line }) + `<path d="M92 62 Q100 66 108 62" stroke="${p.line}" stroke-width="2" fill="none"/><path d="M94 62 l2 4 l2 -4 M104 62 l2 4 l2 -4" fill="#fff" stroke="${p.line}" stroke-width=".8"/>`
             : eye(93, 52, 4.2, { glow: p.light }) + eye(108, 52, 4.2, { glow: p.light })) + crystals + (fur || bolts ? "" : glyph(el, 52, 68, .8, -20) + glyph(el, 148, 66, .8, 20));
    },
    sprite(p, r, el, F) {
      const L = `stroke="${p.line}" stroke-width="2.4" stroke-linejoin="round"`;
      const face = (x, y, s = 1) => eye(x - 7 * s, y, 5.5 * s, { iris: p.iris, line: p.line }) + eye(x + 7 * s, y, 5.5 * s, { iris: p.iris, line: p.line }) + `<path d="M${x - 4} ${y + 9 * s} Q${x} ${y + 12 * s} ${x + 4} ${y + 9 * s}" stroke="${p.line}" stroke-width="1.6" fill="none"/>`;
      const sparkles = n => Array.from({ length: n }, () => glyph("celestial", 40 + r() * 120, 30 + r() * 100, .2 + r() * .2, 0, .8)).join("");
      if (F.has("candle")) return shadowE(100, 144, 26) + `<circle cx="100" cy="60" r="40" fill="url(#aura)"/>` +
        `<path d="M78 82 L122 82 L120 140 L80 140Z" fill="#fff1d6" ${L}/><path d="M78 82 C84 92 88 86 92 96 C96 86 102 94 106 86 C112 96 116 86 122 82" fill="#fff1d6" ${L}/><path d="M84 90 C82 104 86 112 84 120" stroke="#e8d0a8" stroke-width="3" fill="none"/>` +
        `<path d="M100 82 V72" stroke="${p.line}" stroke-width="2"/><g filter="url(#glow)" transform="translate(100 52) scale(2.2)">${GLYPH.fire(E.fire)}</g>` + face(100, 106) + sparkles(3);
      if (F.has("star")) return shadowE(100, 146, 22) + `<circle cx="100" cy="90" r="48" fill="url(#aura)"/><path d="M100 40 L114 76 L152 78 L122 100 L132 136 L100 116 L68 136 L78 100 L48 78 L86 76Z" fill="url(#body)" ${L}/>` + face(100, 90, 1.1) + `<ellipse cx="84" cy="98" rx="5" ry="3" fill="#ff7aa0" opacity=".5"/><ellipse cx="116" cy="98" rx="5" ry="3" fill="#ff7aa0" opacity=".5"/>` + sparkles(6);
      if (F.has("tornado")) return shadowE(100, 146, 20) + `<path d="M56 46 C80 38 120 38 144 46 C134 70 116 96 106 124 C104 134 102 140 100 146 C98 140 96 134 94 124 C84 96 66 70 56 46Z" fill="url(#body)" ${L} opacity=".95"/>` +
        [[58, 54, 142], [68, 74, 132], [80, 96, 120], [90, 118, 110]].map(([a, y, b]) => `<path d="M${a} ${y} C${a + 20} ${y + 8} ${b - 20} ${y - 4} ${b} ${y + 3}" stroke="${p.light}" stroke-width="2.4" fill="none"/>`).join("") + face(100, 60) +
        `<path d="M40 70 c-8 -6 -6 -16 4 -16 M160 80 c8 -6 6 -16 -4 -16" stroke="${p.light}" stroke-width="2.4" fill="none"/>` + glyph(el, 40, 110, .6, 0) + glyph(el, 164, 116, .5, 0);
      if (F.has("rune")) return `<circle cx="100" cy="86" r="52" fill="url(#aura)"/><circle cx="100" cy="86" r="40" fill="none" stroke="${p.light}" stroke-width="2" stroke-dasharray="4 5" opacity=".8"/>` + shadowE(100, 146, 24) +
        `<path d="M100 40 L134 86 L100 132 L66 86Z" fill="url(#body)" ${L}/><path d="M100 54 V118 M80 86 H120 M88 66 L112 106 M112 66 L88 106" stroke="${p.light}" stroke-width="2.6" opacity=".85"/>` + face(100, 84) + glyph("arcane", 52, 50, .5, 0) + glyph("arcane", 150, 120, .5, 0);
      if (F.has("dancer")) return shadowE(100, 146, 24) + `<circle cx="100" cy="80" r="48" fill="url(#aura)"/>` +
        `<path d="M92 112 L88 144 M108 112 L116 142" stroke="${p.line}" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M100 84 L136 118 L120 112 L112 124 L100 112 L88 124 L80 112 L64 118Z" fill="${p.light}" ${L}/><path d="M100 80 C108 88 108 104 100 112 C92 104 92 88 100 80Z" fill="url(#body)" ${L}/>` +
        `<path d="M94 88 C78 76 66 60 60 48 M106 88 C120 80 134 68 142 56" stroke="${p.line}" stroke-width="3" fill="none" stroke-linecap="round"/>` + glyph(el, 60, 46, .6, 0) + glyph(el, 142, 54, .6, 0) +
        `<circle cx="100" cy="66" r="15" fill="url(#body)" ${L}/><path d="M86 60 L92 42 L98 56 L104 38 L108 56 L116 44 L114 62" fill="${p.light}" ${L}/>` + face(100, 68, .85) + sparkles(5);
      return `<circle cx="100" cy="92" r="46" fill="url(#aura)"/>` + shadowE(100, 146, 22) +
        `<g opacity=".7" stroke="${p.light}" stroke-width="1.2"><ellipse cx="72" cy="80" rx="26" ry="12" transform="rotate(-25 72 80)" fill="${p.light}" fill-opacity=".35"/><ellipse cx="128" cy="80" rx="26" ry="12" transform="rotate(25 128 80)" fill="${p.light}" fill-opacity=".35"/><ellipse cx="78" cy="104" rx="18" ry="8" transform="rotate(25 78 104)" fill="${p.light}" fill-opacity=".3"/><ellipse cx="122" cy="104" rx="18" ry="8" transform="rotate(-25 122 104)" fill="${p.light}" fill-opacity=".3"/></g>` +
        `<path d="M100 84 C118 96 116 124 100 138 C84 124 82 96 100 84Z" fill="url(#body)" stroke="${p.line}" stroke-width="2.4"/>` +
        `<path d="M90 98 L78 110 M110 98 L122 110" stroke="${p.line}" stroke-width="2.6" stroke-linecap="round"/>` + glyph(el, 100, 50, 1.3, 0) +
        `<circle cx="100" cy="72" r="18" fill="url(#body)" stroke="${p.line}" stroke-width="2.4"/>` + face(100, 72) +
        (F.has("cloak") ? `<path d="M100 46 C76 50 72 80 70 140 C84 132 92 142 100 134 C108 142 116 132 130 140 C128 80 124 50 100 46Z" fill="#1a0d2e" stroke="${p.line}" stroke-width="2.2" opacity=".95"/><ellipse cx="100" cy="76" rx="14" ry="16" fill="#05020c"/>` + eye(94, 76, 3.6, { glow: p.light }) + eye(106, 76, 3.6, { glow: p.light }) : "") +
        (F.has("rays") ? `<g transform="translate(100 72)" opacity=".85">` + Array.from({ length: 12 }, (_, i) => `<path d="M0 -22 L3 -36 L-3 -36Z" fill="#ffe27a" transform="rotate(${i * 30})"/>`).join("") + `</g>` : "") + sparkles(5);
    },
    fish(p, r, el, F) {
      if (F.has("eelfish")) {
        const d = "M190 110 C170 90 150 126 126 108 C104 92 90 114 70 100";
        return shadowE(120, 144, 64) + `<path d="${d}" stroke="${p.line}" stroke-width="24" fill="none" stroke-linecap="round"/><path d="${d}" stroke="url(#bodyLin)" stroke-width="18" fill="none" stroke-linecap="round"/>` +
          [[150, 106], [128, 106], [106, 100], [176, 100]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.2" fill="${p.light}" filter="url(#glow)"/>`).join("") +
          `<ellipse cx="62" cy="96" rx="22" ry="16" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/><path d="M58 82 L66 66 L72 82Z" fill="${p.horn}" stroke="${p.line}" stroke-width="1.8"/>` +
          eye(56, 92, 7.5, { iris: p.iris, line: p.line }) + eye(72, 91, 6.5, { iris: p.iris, line: p.line }) + `<path d="M50 104 Q56 100 62 104" stroke="${p.line}" stroke-width="1.8" fill="none"/>` +
          `<g filter="url(#glow)">${glyph(el, 40, 70, .6, -10)}${glyph(el, 96, 70, .5, 10)}</g>`;
      }
      if (F.has("crystalfin")) return shadowE(100, 144, 44) + `<path d="M138 100 L176 70 L162 100 L176 130Z" fill="${p.light}" stroke="${p.line}" stroke-width="2.2" stroke-linejoin="round"/>` +
        `<path d="M86 74 L100 40 L110 72 L122 50 L128 78Z M96 124 L104 146 L114 124Z" fill="${p.light}" stroke="${p.line}" stroke-width="2" stroke-linejoin="round"/>` +
        `<path d="M58 100 L84 72 L130 74 L144 100 L130 126 L84 128Z" fill="url(#body)" stroke="${p.line}" stroke-width="2.6" stroke-linejoin="round"/><path d="M84 72 L100 100 L84 128 M130 74 L114 100 L130 126 M100 100 H144" stroke="#fff" stroke-width="1.2" opacity=".5"/>` +
        eye(82, 96, 9, { iris: p.iris, line: p.line }) + `<path d="M62 106 L70 104" stroke="${p.line}" stroke-width="2"/>`;
      const puffy = F.has("puffy");
      return shadowE(100, 144, 40) +
        `<path d="M138 100 L174 74 L166 100 L174 126Z" fill="${p.bodyDark}" stroke="${p.line}" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<path d="M86 76 C96 52 122 54 130 78Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2.2"/>` +
        `<ellipse cx="102" cy="100" rx="${puffy ? 38 : 42}" ry="${puffy ? 36 : 29}" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>` +
        `<path d="M76 112 C90 126 118 128 134 112 C118 118 92 118 76 112Z" fill="url(#belly)"/>` +
        Array.from({ length: 6 }, (_, i) => `<path d="M${104 + (i % 3) * 10} ${90 + Math.floor(i / 3) * 12} q5 5 0 10" stroke="${p.line}" stroke-width="1.2" fill="none" opacity=".4"/>`).join("") +
        `<path d="M100 108 L118 122 L104 120Z" fill="${p.horn}" stroke="${p.line}" stroke-width="1.8"/>` +
        eye(80, 94, 10, { iris: p.iris, line: p.line }) +
        `<path d="M62 106 Q68 110 72 106" stroke="${p.line}" stroke-width="2" fill="none"/>` +
        glyph(el, 108, 52, .7, 0) + glyph(el, 160, 100, .5, 90, .8) +
        (F.has("tusk") ? `<path d="M64 92 L14 70 L64 98Z" fill="#fffbe8" stroke="${p.line}" stroke-width="1.6"/><path d="M54 90 l-4 4 M44 85 l-4 4 M34 81 l-3 4" stroke="${p.line}" stroke-width="1"/>` : "") +
        (F.has("angler") ? `<path d="M96 74 C90 50 70 40 54 46" stroke="${p.line}" stroke-width="2.6" fill="none"/><circle cx="52" cy="48" r="7" fill="${p.light}" filter="url(#glow)"/><circle cx="52" cy="48" r="3" fill="#fff"/><path d="M60 102 l4 6 l4 -6 l4 6 l4 -6" fill="#fff" stroke="${p.line}" stroke-width="1"/>` : "") +
        (F.has("puffy") ? Array.from({ length: 8 }, (_, i) => { const a = -1.2 + i * .34; return `<path d="M${f(102 + Math.cos(a) * 40)} ${f(100 + Math.sin(a) * 27)} l${f(Math.cos(a) * 8)} ${f(Math.sin(a) * 8)}" stroke="${p.line}" stroke-width="2.2" stroke-linecap="round"/>`; }).join("") : "");
    },
    witch(p, r, el, F) {
      const L = `stroke="${p.line}" stroke-width="2.4" stroke-linejoin="round"`;
      const hag = F.has("hag"), skin = hag ? "#b8d88a" : "#ffe2cc";
      const hat = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="32" ry="7" fill="#1e1238" ${L}/><path d="M-16 -2 C-14 -24 -6 -40 6 -50 C10 -40 22 -38 30 -34 C18 -34 14 -24 16 -2Z" fill="#2a1a4a" ${L}/><path d="M-15 -8 C-6 -6 8 -6 15 -8 L16 -2 C6 0 -6 0 -16 -2Z" fill="${p.main}"/>${glyph(el, 0, -18, .45, 0)}</g>`;
      let s = shadowE(100, 144, 40);
      if (hag) s += `<path d="M140 60 C150 40 136 30 146 14" stroke="#c4f59a" stroke-width="3" fill="none" opacity=".5" filter="url(#soft)"/><path d="M60 64 C52 46 66 36 56 20" stroke="#c4f59a" stroke-width="3" fill="none" opacity=".5" filter="url(#soft)"/>`;
      else s += `<path d="M40 132 L160 70" stroke="#7a4a22" stroke-width="5" stroke-linecap="round"/><path d="M150 76 L178 54 L186 66 L180 74 L188 82 L162 84Z" fill="#d8a84a" ${L}/>`;
      s += `<path d="M100 78 C82 84 72 112 66 140 L134 140 C128 112 118 84 100 78Z" fill="url(#body)" ${L}/><path d="M74 128 Q100 120 126 128" stroke="${p.light}" stroke-width="2" fill="none" opacity=".7"/>` +
        `<path d="M84 96 C74 104 70 112 72 118" stroke="${p.line}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M84 96 C74 104 70 112 72 118" stroke="${p.body}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
        `<path d="M116 96 C126 102 132 100 136 94" stroke="${p.line}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M116 96 C126 102 132 100 136 94" stroke="${p.body}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
        `<circle cx="72" cy="119" r="4" fill="${skin}" ${L}/><circle cx="137" cy="93" r="4" fill="${skin}" ${L}/>` +
        `<path d="M84 64 C78 80 80 96 74 104 M116 64 C122 80 120 96 126 104" stroke="${p.horn}" stroke-width="7" fill="none" stroke-linecap="round"/>` +
        `<circle cx="100" cy="68" r="17" fill="${skin}" ${L}/>` +
        (hag ? `<path d="M100 68 L90 80 L100 76Z" fill="${skin}" ${L}/>` + eye(93, 64, 4.5, { glow: "#d6ff6a" }) + eye(108, 64, 4.5, { glow: "#d6ff6a" }) + `<path d="M93 80 Q100 76 108 80" stroke="${p.line}" stroke-width="1.8" fill="none"/>`
             : eye(93, 67, 5.5, { iris: p.iris, line: p.line }) + eye(107, 67, 5.5, { iris: p.iris, line: p.line }) + `<path d="M96 76 Q100 79 104 76" stroke="${p.line}" stroke-width="1.6" fill="none"/><ellipse cx="88" cy="73" rx="3.5" ry="2" fill="#ff7aa0" opacity=".55"/><ellipse cx="112" cy="73" rx="3.5" ry="2" fill="#ff7aa0" opacity=".55"/>`) +
        hat(100, 54, 1) + `<path d="M137 93 L150 70" stroke="#7a4a22" stroke-width="3" stroke-linecap="round"/><circle cx="151" cy="68" r="4" fill="${p.light}" filter="url(#glow)"/>`;
      if (hag) s += `<path d="M70 118 C66 150 134 150 130 118Z" fill="#2a2a34" ${L}/><ellipse cx="100" cy="118" rx="32" ry="8" fill="#5aff7a" stroke="${p.line}" stroke-width="2.4" filter="url(#glow)"/>` +
        [[88, 114, 4], [104, 112, 5], [114, 116, 3], [96, 106, 2.5]].map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="#b8ffc4" stroke="#1a6a2a" stroke-width="1"/>`).join("") + `<path d="M74 140 h-6 M126 140 h6" stroke="${p.line}" stroke-width="3"/>`;
      else s += Array.from({ length: 5 }, () => glyph("celestial", 40 + r() * 120, 30 + r() * 80, .25, 0, .8)).join("");
      return s;
    },
    ghost(p, r, el, F) {
      const L = `stroke="${p.line}" stroke-width="2.2" stroke-linejoin="round"`;
      const sheet = `<linearGradient id="gh" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="${p.light}"/><stop offset="1" stop-color="${p.light}" stop-opacity=".25"/></linearGradient>`;
      if (F.has("knight")) return `<defs>${sheet}</defs><ellipse cx="100" cy="146" rx="30" ry="5" fill="${p.light}" opacity=".3" filter="url(#soft)"/>` +
        `<path d="M70 96 C64 120 80 136 90 150 C96 138 104 138 110 150 C120 136 136 120 130 96Z" fill="url(#gh)" opacity=".75"/>` +
        `<path d="M140 40 L146 124" stroke="${p.light}" stroke-width="5" stroke-linecap="round" filter="url(#glow)"/><path d="M134 110 H158" stroke="#8a8a9a" stroke-width="5" stroke-linecap="round"/>` +
        `<path d="M66 84 C66 70 80 64 100 64 C120 64 134 70 134 84 L130 104 L70 104Z" fill="#8a94a8" ${L}/><path d="M58 80 C58 70 70 66 78 72 L76 92 C66 92 58 88 58 80Z M142 80 C142 70 130 66 122 72 L124 92 C134 92 142 88 142 80Z" fill="#a8b2c4" ${L}/>` +
        `<path d="M78 40 C78 20 122 20 122 40 L122 62 C122 70 78 70 78 62Z" fill="#a8b2c4" ${L}/><path d="M80 44 H120 V52 H80Z" fill="#05020c"/>` + eye(92, 48, 3.4, { glow: p.light }) + eye(108, 48, 3.4, { glow: p.light }) +
        `<path d="M100 20 C104 10 112 6 118 8 C114 12 112 16 112 22" fill="${p.horn}" ${L}/><path d="M100 70 V104 M84 76 L84 100 M116 76 L116 100" stroke="#6a748a" stroke-width="1.6"/>`;
      const banshee = F.has("banshee"), bog = F.has("bog");
      let s = `<defs>${sheet}</defs><ellipse cx="100" cy="146" rx="28" ry="5" fill="#000" opacity=".25"/>`;
      if (banshee) s += `<path d="M78 56 C50 60 34 90 20 100 C40 98 50 86 58 80 C48 100 40 118 26 128 C50 122 64 100 72 90 M122 56 C150 60 166 90 180 100 C160 98 150 86 142 80 C152 100 160 118 174 128 C150 122 136 100 128 90" stroke="${p.horn}" stroke-width="6" fill="none" stroke-linecap="round" opacity=".9"/>`;
      s += `<path d="M64 84 C64 46 136 46 136 84 L138 130 C130 124 124 140 116 132 C110 142 102 130 96 138 C88 128 82 140 76 130 C70 136 66 126 62 130Z" fill="url(#gh)" ${L} opacity=".95"/>`;
      if (bog) s += `<path d="M70 70 C76 90 72 108 78 120 M128 66 C124 84 130 100 124 116" stroke="#3a7a3a" stroke-width="4" fill="none" stroke-linecap="round"/>` + [[80, 136], [112, 140], [128, 132]].map(([x, y]) => `<path d="M${x} ${y} q3 8 0 12 q-3 -4 0 -12Z" fill="${p.light}" opacity=".8"/>`).join("");
      s += `<path d="M66 100 C54 98 50 88 56 84 M134 100 C146 98 150 88 144 84" stroke="${p.line}" stroke-width="2.2" fill="#fff"/>`;
      s += banshee ? eye(88, 78, 6, { glow: p.light }) + eye(112, 78, 6, { glow: p.light }) + `<ellipse cx="100" cy="98" rx="7" ry="10" fill="#1a0d2e"/>` + `<path d="M50 70 q-10 -4 -14 4 M150 70 q10 -4 14 4" stroke="${p.light}" stroke-width="2" fill="none"/>`
        : `<ellipse cx="88" cy="80" rx="6" ry="8" fill="#1a1020"/><ellipse cx="112" cy="80" rx="6" ry="8" fill="#1a1020"/><circle cx="86" cy="77" r="2" fill="#fff"/><circle cx="110" cy="77" r="2" fill="#fff"/><path d="M94 94 Q100 100 106 94" stroke="#1a1020" stroke-width="2.2" fill="none"/><ellipse cx="80" cy="90" rx="5" ry="3" fill="#ff9ab8" opacity=".6"/><ellipse cx="120" cy="90" rx="5" ry="3" fill="#ff9ab8" opacity=".6"/>`;
      return s + glyph(el, 150, 50, .6, 0, .8) + glyph(el, 46, 46, .5, 0, .7);
    },
    siren(p, r, el, F) {
      const L = `stroke="${p.line}" stroke-width="2.4" stroke-linejoin="round"`;
      return `<path d="M30 146 C40 118 70 110 100 112 C130 110 160 120 170 146Z" fill="#3a4a5a" ${L}/><path d="M50 130 l10 -6 M120 124 l14 4" stroke="#5a6a7a" stroke-width="2"/>` +
        `<path d="M96 108 C120 112 140 118 150 132 C154 138 162 134 168 124 C168 136 164 146 154 146 C162 152 158 158 150 152 C140 144 120 132 96 124Z" fill="url(#bodyLin)" ${L}/>` +
        Array.from({ length: 6 }, (_, i) => `<path d="M${104 + i * 8} ${116 + i * 2} q4 4 8 0" stroke="${p.line}" stroke-width="1" fill="none" opacity=".5"/>`).join("") +
        `<path d="M86 56 C70 70 66 100 72 118 C80 110 82 90 84 80Z M110 56 C126 70 132 100 124 116 C118 108 116 90 114 80Z" fill="${p.horn}" ${L}/>` +
        `<path d="M86 84 C84 100 88 112 96 118 L108 118 C114 110 116 98 112 84Z" fill="#ffe2cc" ${L}/><path d="M86 88 C92 94 106 94 112 88 L112 98 C106 102 92 102 86 98Z" fill="${p.body}" ${L}/>` +
        `<path d="M88 92 C78 96 72 104 70 112" stroke="#ffe2cc" stroke-width="6" stroke-linecap="round"/><path d="M110 92 C120 88 126 80 128 72" stroke="#ffe2cc" stroke-width="6" stroke-linecap="round"/>` +
        `<path d="M126 70 C132 60 144 62 146 70 C140 72 134 74 128 76Z" fill="#ffd1e0" ${L}/>` +
        `<circle cx="98" cy="64" r="16" fill="#ffe2cc" ${L}/><path d="M82 62 C82 44 114 44 114 62 C110 54 100 52 92 56 C88 58 84 60 82 62Z" fill="${p.horn}" ${L}/>` +
        eye(92, 66, 4.6, { iris: p.iris, line: p.line }) + eye(105, 66, 4.6, { iris: p.iris, line: p.line }) + `<ellipse cx="98.5" cy="74" rx="2.6" ry="2" fill="#c8506a"/>` +
        `<g fill="${p.light}" filter="url(#glow)"><path d="M140 40 v14 a4 3 0 1 1 -2 -3 v-11 l10 -3 v3Z"/><path d="M160 60 v12 a4 3 0 1 1 -2 -3 v-9Z"/><path d="M48 50 v12 a4 3 0 1 1 -2 -3 v-9Z"/></g>`;
    },
    kraken(p, r, el, F) {
      const L = `stroke="${p.line}" stroke-width="2.4" stroke-linejoin="round"`;
      const tent = (d, w) => `<path d="${d}" stroke="${p.line}" stroke-width="${w + 5}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="url(#bodyLin)" stroke-width="${w}" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${p.belly}" stroke-width="${w * .35}" fill="none" stroke-linecap="round" stroke-dasharray="1.5 6" opacity=".9"/>`;
      return tent("M44 140 C30 110 20 80 34 60 C42 50 52 56 46 66", 11) + tent("M156 140 C172 112 182 84 168 62 C160 52 150 58 156 68", 11) +
        tent("M70 140 C60 120 52 104 58 92", 9) + tent("M130 140 C142 122 150 104 142 92", 9) +
        `<g transform="translate(150 58) rotate(-18)"><path d="M-14 0 L14 0 L10 8 L-10 8Z" fill="#5a3a1a" ${L}/><path d="M0 0 V-22" stroke="${p.line}" stroke-width="2"/><path d="M0 -22 L14 -6 L0 -6Z" fill="#fff4dd" ${L}/></g>` +
        `<path d="M58 120 C50 70 74 34 100 34 C126 34 150 70 142 120Z" fill="url(#body)" ${L}/><ellipse cx="86" cy="54" rx="10" ry="6" fill="#fff" opacity=".35"/>` +
        [[74, 74], [124, 70], [100, 50], [90, 100], [116, 104]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="${p.bodyDark}" opacity=".6"/>`).join("") +
        eye(84, 92, 10, { iris: "#ffcf5a", line: p.line, slitPupil: true }) + eye(116, 92, 10, { iris: "#ffcf5a", line: p.line, slitPupil: true }) + `<path d="M78 78 L92 84 M122 78 L108 84" stroke="${p.line}" stroke-width="3" stroke-linecap="round"/>` +
        `<path d="M0 128 C30 120 60 136 100 128 C140 120 170 134 200 126 V160 H0Z" fill="${p.dark}" opacity=".85"/><path d="M0 128 C30 120 60 136 100 128 C140 120 170 134 200 126" stroke="${p.light}" stroke-width="2" fill="none" opacity=".8"/>` +
        `<path d="M40 134 q8 -6 16 0 M150 132 q8 -6 16 0 M90 140 q8 -6 16 0" stroke="#fff" stroke-width="1.6" fill="none" opacity=".6"/>`;
    },
    bug(p, r, el, F) {
      const L = `stroke="${p.line}" stroke-width="2.4" stroke-linejoin="round"`;
      const face = (x, y, s = 1) => eye(x - 7 * s, y, 6 * s, { iris: p.iris, line: p.line }) + eye(x + 7 * s, y, 6 * s, { iris: p.iris, line: p.line }) + `<path d="M${x - 4} ${y + 9 * s} Q${x} ${y + 12 * s} ${x + 4} ${y + 9 * s}" stroke="${p.line}" stroke-width="1.6" fill="none"/>`;
      const antennae = (x, y) => `<path d="M${x - 6} ${y - 12} C${x - 12} ${y - 28} ${x - 22} ${y - 32} ${x - 28} ${y - 30} M${x + 6} ${y - 12} C${x + 12} ${y - 28} ${x + 22} ${y - 32} ${x + 28} ${y - 30}" stroke="${p.line}" stroke-width="2" fill="none"/>` + glyph(el, x - 28, y - 30, .4, 0) + glyph(el, x + 28, y - 30, .4, 0);
      if (F.has("butterfly")) {
        const w = s => `<path d="M${100 + s * 4} 86 C${100 + s * 30} 40 ${100 + s * 80} 34 ${100 + s * 78} 70 C${100 + s * 76} 92 ${100 + s * 40} 96 ${100 + s * 6} 94Z" fill="url(#bodyLin)" ${L}/><path d="M${100 + s * 4} 98 C${100 + s * 30} 100 ${100 + s * 64} 112 ${100 + s * 52} 136 C${100 + s * 40} 148 ${100 + s * 12} 124 ${100 + s * 4} 104Z" fill="${p.light}" ${L}/>` +
          `<circle cx="${100 + s * 48}" cy="68" r="11" fill="${p.horn}" opacity=".85"/><circle cx="${100 + s * 48}" cy="68" r="5" fill="#fff" opacity=".8"/>`;
        return shadowE(100, 146, 34) + w(-1) + w(1) + `<ellipse cx="100" cy="104" rx="7" ry="26" fill="${p.bodyDark}" ${L}/>` + `<circle cx="100" cy="74" r="12" fill="url(#body)" ${L}/>` + face(100, 74, .7) + antennae(100, 70);
      }
      if (F.has("beetle")) {
        const crystals = F.has("crystals") ? [[78, 82, -30], [92, 72, -10], [108, 70, 10], [122, 80, 30]].map(([x, y, a]) => `<path d="M${x - 5} ${y + 6} L${x} ${y - 18} L${x + 5} ${y + 6}Z" fill="#fff" stroke="${p.line}" stroke-width="1.4" transform="rotate(${a} ${x} ${y})" opacity=".95"/>`).join("") : "";
        return shadowE(100, 146, 50) + `<g stroke="${p.line}" stroke-width="3.4" stroke-linecap="round" fill="none"><path d="M66 112 L46 104 L36 120 M64 124 L42 130 L38 144 M136 112 L154 104 L164 120 M136 124 L158 130 L162 144"/></g>` +
          `<ellipse cx="100" cy="132" rx="16" ry="10" fill="${p.bodyDark}" ${L}/><path d="M58 112 C58 72 142 72 142 112 C142 132 122 140 100 140 C78 140 58 132 58 112Z" fill="url(#body)" ${L}/><path d="M100 78 V140" stroke="${p.line}" stroke-width="2"/>` +
          `<ellipse cx="80" cy="98" rx="8" ry="5" fill="#fff" opacity=".4"/>` + crystals + (F.has("glowspots") ? [[80, 116], [120, 116], [86, 102], [114, 102]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="${p.light}" filter="url(#glow)"/>`).join("") : "") +
          `<path d="M76 140 C76 154 124 154 124 140Z" fill="${p.bodyDark}" ${L} transform="translate(0 -2)"/>` + `<ellipse cx="100" cy="146" rx="20" ry="10" fill="${p.bodyDark}" ${L}/>` + face(100, 144, .65) + antennae(100, 140).replace(/y/g, "y");
      }
      if (F.has("spider")) {
        const legs = [-1, 1].map(s => [[-40, 20], [-22, 32], [0, 36], [22, 30]].map(([a, len], i) => `<path d="M${100 + s * 14} ${98 + i * 6} C${100 + s * (30 + i * 4)} ${70 + i * 14} ${100 + s * (44 + i * 6)} ${70 + i * 16} ${100 + s * (52 + i * 4)} ${120 + i * 6}" stroke="${p.line}" stroke-width="3.4" fill="none" stroke-linecap="round"/>`).join("")).join("");
        return `<path d="M100 0 V60" stroke="#e6d6ff" stroke-width="1" opacity=".7"/><g stroke="#e6d6ff" stroke-width=".8" fill="none" opacity=".35"><path d="M20 10 L100 60 L180 10 M0 60 H200 M20 110 L100 60 L180 110"/><circle cx="100" cy="60" r="30"/><circle cx="100" cy="60" r="60"/></g>` +
          shadowE(100, 146, 50) + legs + `<ellipse cx="100" cy="118" rx="26" ry="22" fill="url(#body)" ${L}/><path d="M92 108 L100 120 L108 108 M92 126 L100 116 L108 126" stroke="${p.light}" stroke-width="2.4" fill="none"/>` +
          `<circle cx="100" cy="90" r="16" fill="url(#body)" ${L}/>` + eye(93, 86, 4, { glow: p.light }) + eye(107, 86, 4, { glow: p.light }) + eye(88, 94, 2.4, { glow: p.light }) + eye(112, 94, 2.4, { glow: p.light }) + `<path d="M96 100 l-2 6 M104 100 l2 6" stroke="${p.line}" stroke-width="2.4" stroke-linecap="round"/>`;
      }
      if (F.has("crab")) {
        const claw = s => `<path d="M${100 + s * 34} 112 C${100 + s * 50} 104 ${100 + s * 56} 90 ${100 + s * 56} 80" stroke="${p.line}" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M${100 + s * 34} 112 C${100 + s * 50} 104 ${100 + s * 56} 90 ${100 + s * 56} 80" stroke="${p.body}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
          `<path d="M${100 + s * 48} 80 C${100 + s * 44} 60 ${100 + s * 70} 54 ${100 + s * 74} 70 L${100 + s * 62} 72 L${100 + s * 70} 82 C${100 + s * 66} 90 ${100 + s * 52} 90 ${100 + s * 48} 80Z" fill="url(#body)" ${L}/>`;
        return shadowE(100, 146, 56) + `<g stroke="${p.line}" stroke-width="3" stroke-linecap="round" fill="none"><path d="M76 124 L58 138 M80 128 L68 144 M124 124 L142 138 M120 128 L132 144"/></g>` + claw(-1) + claw(1) +
          `<path d="M80 108 C80 80 124 74 132 98 C138 116 128 128 104 128 C86 128 80 120 80 108Z" fill="${p.horn}" ${L}/><path d="M86 96 C100 74 120 80 126 96" stroke="${p.line}" stroke-width="1.6" fill="none" opacity=".6"/>` +
          `<ellipse cx="94" cy="122" rx="24" ry="14" fill="url(#body)" ${L}/>` + `<path d="M84 110 V96 M100 110 V96" stroke="${p.line}" stroke-width="2.2"/>` + eye(84, 92, 5.5, { iris: p.iris, line: p.line }) + eye(100, 92, 5.5, { iris: p.iris, line: p.line }) + `<path d="M88 124 Q94 128 100 124" stroke="${p.line}" stroke-width="1.8" fill="none"/>`;
      }
      if (F.has("dragonfly")) {
        return shadowE(110, 146, 50) + `<g opacity=".8" stroke="${p.line}" stroke-width="1.4"><ellipse cx="108" cy="70" rx="46" ry="10" transform="rotate(-14 108 70)" fill="${p.light}" fill-opacity=".55"/><ellipse cx="112" cy="84" rx="40" ry="9" transform="rotate(6 112 84)" fill="${p.light}" fill-opacity=".55"/><ellipse cx="60" cy="66" rx="30" ry="8" transform="rotate(14 60 66)" fill="${p.light}" fill-opacity=".55"/></g>` +
          `<path d="M84 84 C120 90 150 96 186 100" stroke="${p.line}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M84 84 C120 90 150 96 186 100" stroke="${p.body}" stroke-width="6" fill="none" stroke-linecap="round" stroke-dasharray="7 2"/>` +
          `<ellipse cx="80" cy="84" rx="13" ry="10" fill="url(#body)" ${L}/><circle cx="62" cy="80" r="13" fill="url(#body)" ${L}/>` + eye(56, 78, 6.5, { iris: p.iris, line: p.line }) + eye(68, 76, 6.5, { iris: p.iris, line: p.line }) +
          `<path d="M76 92 l-6 20 M84 94 l2 20 M90 92 l8 18" stroke="${p.line}" stroke-width="2.2" stroke-linecap="round"/><path d="M110 90 L104 130" stroke="#fff" stroke-width="1" opacity=".6"/>` + glyph(el, 186, 100, .5, 0);
      }
      const wing = r();
      const wings = wing > .66 ? `<g opacity=".75"><ellipse cx="110" cy="72" rx="34" ry="10" transform="rotate(-20 110 72)" fill="${p.light}" stroke="${p.line}" stroke-width="1.4"/><ellipse cx="116" cy="84" rx="30" ry="8" transform="rotate(-5 116 84)" fill="${p.light}" stroke="${p.line}" stroke-width="1.4"/></g>`
        : wing > .33 ? `<path d="M104 92 C96 50 140 40 150 66 C156 82 130 96 104 96Z M106 100 C120 110 146 110 140 128 C130 138 110 120 104 104Z" fill="url(#bodyLin)" stroke="${p.line}" stroke-width="2.2"/>${glyph(el, 132, 70, .7, 0)}` : "";
      return shadowE(104, 142, 46) +
        `<g stroke="${p.line}" stroke-width="3" stroke-linecap="round" fill="none"><path d="M88 110 L74 136 M100 114 L96 140 M116 116 L124 140 M128 114 L144 136"/></g>` + wings +
        `<ellipse cx="120" cy="108" rx="28" ry="19" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>` +
        (wing <= .33 ? `<path d="M120 90 V126" stroke="${p.line}" stroke-width="1.8"/>` + glyph(el, 120, 106, .8, 0, .9) : `<path d="M108 100 q12 6 24 0 M106 110 q14 6 28 0" stroke="${p.line}" stroke-width="1.4" fill="none" opacity=".5"/>`) +
        `<circle cx="92" cy="104" r="14" fill="url(#body)" stroke="${p.line}" stroke-width="2.4"/>` +
        `<path d="M70 82 C64 64 54 58 46 60 M80 80 C80 62 88 54 96 52" stroke="${p.line}" stroke-width="2" fill="none"/>` + glyph(el, 46, 60, .4, 0) + glyph(el, 96, 52, .4, 0) +
        `<circle cx="74" cy="94" r="16" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>` +
        eye(68, 92, 6, { iris: p.iris, line: p.line }) + eye(82, 90, 6, { iris: p.iris, line: p.line }) +
        `<path d="M66 102 Q72 106 78 102" stroke="${p.line}" stroke-width="1.6" fill="none"/>` +
        (F.has("pincers") ? `<path d="M64 108 C44 116 36 104 40 96 C44 102 50 102 54 98 C50 94 52 88 58 88 C62 96 66 102 68 104Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2"/>` : "") +
        (F.has("spider") ? `<g stroke="${p.line}" stroke-width="2.6" stroke-linecap="round" fill="none"><path d="M100 100 C110 80 130 74 144 82 M104 104 C124 92 146 96 156 108 M86 98 C80 78 64 70 52 76"/></g><path d="M60 40 V80" stroke="#d6b8ff" stroke-width="1" opacity=".6"/>` : "") +
        (F.has("blades") ? `<path d="M66 104 C52 86 46 70 50 56 C56 72 64 86 74 100Z M80 108 C74 90 76 74 84 62 C86 78 88 92 88 106Z" fill="${p.light}" stroke="${p.line}" stroke-width="1.8"/>` : "");
    },
    jelly(p, r, el, F) {
      const L = `stroke="${p.line}" stroke-width="2.6"`;
      if (F.has("drop")) return shadowE(100, 144, 26) + `<path d="M100 40 C122 72 134 92 134 108 A34 34 0 0 1 66 108 C66 92 78 72 100 40Z" fill="url(#body)" ${L}/><ellipse cx="86" cy="92" rx="6" ry="12" fill="#fff" opacity=".45"/>` +
        eye(90, 112, 6, { iris: p.iris, line: p.line, sleepy: true, lid: p.body }) + eye(110, 112, 6, { iris: p.iris, line: p.line, sleepy: true, lid: p.body }) + `<path d="M95 124 Q100 127 105 124" stroke="${p.line}" stroke-width="1.6" fill="none"/>` +
        `<path d="M54 60 l0 0" /><g fill="${p.light}" opacity=".7"><circle cx="50" cy="60" r="3"/><circle cx="150" cy="80" r="4"/><circle cx="140" cy="44" r="2.5"/></g>`;
      if (F.has("squid")) return `<circle cx="100" cy="80" r="50" fill="url(#aura)"/>` + Array.from({ length: 6 }, (_, i) => { const x = 76 + i * 10; return `<path d="M${x} 108 C${x - 14 + i * 4} 126 ${x - 10 + i * 6} 140 ${x - 20 + i * 8} 150" stroke="${p.body}" stroke-width="7" fill="none" stroke-linecap="round"/>`; }).join("") +
        `<path d="M84 118 C60 140 46 140 34 150 M116 118 C140 140 154 140 166 150" stroke="${p.bodyDark}" stroke-width="5" fill="none" stroke-linecap="round"/>` +
        `<path d="M100 18 C124 40 128 80 124 112 L76 112 C72 80 76 40 100 18Z" fill="url(#body)" ${L}/><path d="M100 18 L84 40 L116 40Z" fill="${p.horn}" ${L}/>` +
        [[90, 60], [110, 70], [98, 84]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="${p.light}" filter="url(#glow)"/>`).join("") +
        eye(88, 100, 7.5, { iris: p.iris, line: p.line, slitPupil: true }) + eye(112, 100, 7.5, { iris: p.iris, line: p.line, slitPupil: true });
      if (F.has("cyclone")) return shadowE(100, 146, 18) + `<path d="M40 34 C60 26 140 26 160 34 C150 60 130 86 112 120 C108 132 104 140 100 146 C96 140 92 132 88 120 C70 86 50 60 40 34Z" fill="url(#body)" ${L} opacity=".9"/>` +
        [[44, 46, 156], [56, 66, 144], [70, 88, 130], [84, 110, 116]].map(([a, y, b]) => `<path d="M${a} ${y} C${a + 30} ${y + 10} ${b - 30} ${y - 4} ${b} ${y + 4}" stroke="${p.light}" stroke-width="2.6" fill="none" opacity=".85"/>`).join("") +
        `<circle cx="100" cy="58" r="16" fill="#fff" stroke="${p.line}" stroke-width="2.4"/><circle cx="100" cy="58" r="9" fill="${p.iris}"/><circle cx="100" cy="58" r="4.5" fill="#0b0710"/><circle cx="96" cy="54" r="3" fill="#fff"/>` +
        glyph(el, 30, 90, .7, 0) + glyph(el, 170, 100, .6, 0);
      if (F.has("void")) return `<circle cx="100" cy="88" r="56" fill="${p.light}" opacity=".18" filter="url(#blur)"/>` + Array.from({ length: 9 }, (_, i) => { const a = i / 9 * Math.PI * 2; return `<path d="M${f(100 + Math.cos(a) * 30)} ${f(88 + Math.sin(a) * 30)} C${f(100 + Math.cos(a + .4) * 50)} ${f(88 + Math.sin(a + .4) * 50)} ${f(100 + Math.cos(a - .3) * 60)} ${f(88 + Math.sin(a - .3) * 60)} ${f(100 + Math.cos(a + .2) * 70)} ${f(88 + Math.sin(a + .2) * 70)}" stroke="${p.main}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`; }).join("") +
        `<circle cx="100" cy="88" r="34" fill="#05020c" stroke="${p.light}" stroke-width="2"/>` + Array.from({ length: 8 }, () => `<circle cx="${f(84 + r() * 32)}" cy="${f(72 + r() * 32)}" r="${f(.6 + r())}" fill="#fff"/>`).join("") +
        eye(88, 86, 6, { glow: p.light }) + eye(112, 86, 6, { glow: p.light }) + `<path d="M86 104 Q100 96 114 104" stroke="${p.light}" stroke-width="2" fill="none"/>`;
      const t = Array.from({ length: 5 }, (_, i) => { const x = 72 + i * 14; return `<path d="M${x} 102 C${x - 6} 116 ${x + 6} 124 ${x} 136 C${x - 4} 142 ${x + 2} 146 ${x} 152" stroke="${p.bodyLight}" stroke-width="${i % 2 ? 4 : 5.5}" fill="none" stroke-linecap="round" opacity=".85"/>`; }).join("");
      return `<circle cx="100" cy="86" r="50" fill="url(#aura)"/>` + t + (F.has("halo") ? `<ellipse cx="100" cy="46" rx="30" ry="7" fill="none" stroke="#fff4b0" stroke-width="3.5" filter="url(#glow)"/>` : "") +
        `<path d="M58 100 C58 54 142 54 142 100 C132 108 122 98 112 106 C102 98 92 108 82 100 C74 108 66 100 58 100Z" fill="url(#body)" stroke="${p.line}" stroke-width="2.6" opacity=".95"/>` +
        `<ellipse cx="88" cy="70" rx="12" ry="7" fill="#fff" opacity=".35"/>` + eye(88, 86, 7, { iris: p.iris, line: p.line }) + eye(112, 86, 7, { iris: p.iris, line: p.line }) +
        `<path d="M95 96 Q100 99 105 96" stroke="${p.line}" stroke-width="1.6" fill="none"/>` + (F.has("halo") ? "" : glyph(el, 100, 54, .8, 0));
    },
  };
  function pattern(p, r, cx, cy, rad) {
    const k = r();
    if (k < .4) return "";
    if (k < .75) return Array.from({ length: 4 }, () => `<circle cx="${f(cx + (r() - .5) * rad * 1.4)}" cy="${f(cy + (r() - .5) * rad * .8)}" r="${f(2 + r() * 3)}" fill="${p.bodyLight}" opacity=".6"/>`).join("");
    return Array.from({ length: 3 }, (_, i) => `<path d="M${f(cx - rad * .3 + i * 10)} ${f(cy - rad * .5)} q4 ${f(rad * .4)} 0 ${f(rad * .8)}" stroke="${p.bodyDark}" stroke-width="3" fill="none" opacity=".5" stroke-linecap="round"/>`).join("");
  }

  /* ---------- hand-composed founders 001–010 ---------- */
  const HAND = {
    1: () => `
<defs><radialGradient id="fur" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffc27a"/><stop offset=".6" stop-color="#ff7d32"/><stop offset="1" stop-color="#c8441a"/></radialGradient>
<linearGradient id="flame" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff4a1a"/><stop offset=".5" stop-color="#ff9a2a"/><stop offset="1" stop-color="#ffe27a"/></linearGradient></defs>
${shadowE(104, 142, 48)}
<g filter="url(#glow)"><path d="M132 118 C176 112 182 70 160 40 C164 66 150 72 148 84 C140 66 150 54 142 40 C120 66 124 94 128 112Z" fill="url(#flame)" stroke="#8a2408" stroke-width="2"/>
<path d="M136 112 C160 106 162 82 154 66 C152 82 144 86 142 94 C136 84 140 76 138 70 C128 86 130 100 136 112Z" fill="#ffe27a"/></g>
<ellipse cx="128" cy="130" rx="10" ry="13" fill="#e0662a" stroke="#6e1a08" stroke-width="2.2"/>
<ellipse cx="112" cy="114" rx="34" ry="24" fill="url(#fur)" stroke="#6e1a08" stroke-width="2.6"/>
<rect x="86" y="116" width="13" height="24" rx="6" fill="#ff7d32" stroke="#6e1a08" stroke-width="2.2"/><rect x="102" y="118" width="13" height="22" rx="6" fill="#ff7d32" stroke="#6e1a08" stroke-width="2.2"/>
<ellipse cx="92" cy="139" rx="7" ry="4" fill="#fff0d6" stroke="#6e1a08" stroke-width="1.6"/><ellipse cx="108" cy="139" rx="7" ry="4" fill="#fff0d6" stroke="#6e1a08" stroke-width="1.6"/>
<path d="M84 98 C90 124 108 124 112 102 C102 110 92 108 84 98Z" fill="#fff0d6"/>
<path d="M56 74 L50 38 L78 60Z" fill="url(#fur)" stroke="#6e1a08" stroke-width="2.4" stroke-linejoin="round"/><path d="M59 68 L56 47 L72 60Z" fill="#8a2408"/>
<path d="M84 58 L104 32 L104 68Z" fill="url(#fur)" stroke="#6e1a08" stroke-width="2.4" stroke-linejoin="round"/><path d="M89 58 L101 41 L101 63Z" fill="#8a2408"/>
${glyph("fire", 50, 36, .5, -15)}${glyph("fire", 104, 30, .5, 15)}
<circle cx="80" cy="86" r="27" fill="url(#fur)" stroke="#6e1a08" stroke-width="2.6"/>
<ellipse cx="64" cy="98" rx="18" ry="12" fill="#fff0d6" stroke="#6e1a08" stroke-width="2"/>
<ellipse cx="50" cy="94" rx="5.5" ry="4.2" fill="#3a1206"/><circle cx="48.5" cy="92.5" r="1.4" fill="#fff"/>
<path d="M54 102 Q60 108 68 103" stroke="#6e1a08" stroke-width="2" fill="none" stroke-linecap="round"/>
${eye(70, 80, 7, { iris: "#d9741a", line: "#4a1206" })}${eye(90, 78, 7.5, { iris: "#d9741a", line: "#4a1206" })}
<ellipse cx="98" cy="94" rx="6" ry="3.5" fill="#ff4a6a" opacity=".5"/>
<g transform="translate(80 64) scale(.7)">${GLYPH.fire(E.fire)}</g>`,

    2: () => `
<defs><radialGradient id="bub" cx=".5" cy=".5" r=".5"><stop offset=".7" stop-color="#bff3ff" stop-opacity=".05"/><stop offset=".95" stop-color="#bff3ff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity=".8"/></radialGradient>
<radialGradient id="axo" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#d8f8ff"/><stop offset=".6" stop-color="#7fd8ff"/><stop offset="1" stop-color="#3a9ad8"/></radialGradient></defs>
${shadowE(100, 148, 34)}
<path d="M118 102 C140 108 152 94 160 82 C152 104 138 118 116 116Z" fill="url(#axo)" stroke="#1a4a7a" stroke-width="2.2"/>
<ellipse cx="104" cy="106" rx="26" ry="15" fill="url(#axo)" stroke="#1a4a7a" stroke-width="2.4"/>
<ellipse cx="90" cy="120" rx="5" ry="4" fill="#7fd8ff" stroke="#1a4a7a" stroke-width="1.8"/><ellipse cx="118" cy="119" rx="5" ry="4" fill="#7fd8ff" stroke="#1a4a7a" stroke-width="1.8"/>
<circle cx="110" cy="100" r="2.5" fill="#3a9ad8" opacity=".6"/><circle cx="120" cy="106" r="2" fill="#3a9ad8" opacity=".6"/>
<g fill="#ff7aa8" stroke="#a02a5a" stroke-width="1.6">
<ellipse cx="54" cy="74" rx="11" ry="4.5" transform="rotate(25 54 74)"/><ellipse cx="50" cy="86" rx="12" ry="4.5"/><ellipse cx="54" cy="98" rx="11" ry="4.5" transform="rotate(-25 54 98)"/>
<ellipse cx="114" cy="74" rx="11" ry="4.5" transform="rotate(-25 114 74)"/><ellipse cx="118" cy="86" rx="12" ry="4.5"/><ellipse cx="114" cy="98" rx="11" ry="4.5" transform="rotate(25 114 98)"/></g>
<ellipse cx="84" cy="86" rx="28" ry="21" fill="url(#axo)" stroke="#1a4a7a" stroke-width="2.6"/>
<circle cx="74" cy="83" r="4.6" fill="#0b1830"/><circle cx="72.6" cy="81.5" r="1.6" fill="#fff"/><circle cx="94" cy="83" r="4.6" fill="#0b1830"/><circle cx="92.6" cy="81.5" r="1.6" fill="#fff"/>
<path d="M72 93 Q84 102 96 93" stroke="#1a4a7a" stroke-width="2.2" fill="none" stroke-linecap="round"/>
<ellipse cx="66" cy="92" rx="5" ry="3" fill="#ff7aa8" opacity=".6"/><ellipse cx="102" cy="92" rx="5" ry="3" fill="#ff7aa8" opacity=".6"/>
<circle cx="100" cy="90" r="60" fill="url(#bub)" stroke="#e6fbff" stroke-width="1.6" stroke-opacity=".7"/>
<path d="M60 58 A52 52 0 0 1 96 36" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>
<circle cx="140" cy="44" r="5" fill="none" stroke="#e6fbff" stroke-width="1.2" opacity=".7"/><circle cx="152" cy="30" r="3" fill="none" stroke="#e6fbff" stroke-width="1" opacity=".7"/>`,

    3: () => `
<defs><radialGradient id="shell" cx=".4" cy=".2" r=".9"><stop offset="0" stop-color="#9ee06a"/><stop offset=".6" stop-color="#4a9a3a"/><stop offset="1" stop-color="#245a22"/></radialGradient></defs>
${shadowE(98, 142, 56)}
<ellipse cx="66" cy="132" rx="9" ry="8" fill="#b7d77a" stroke="#2a4a14" stroke-width="2"/><ellipse cx="132" cy="132" rx="9" ry="8" fill="#b7d77a" stroke="#2a4a14" stroke-width="2"/>
<path d="M146 120 L162 128 L146 128Z" fill="#b7d77a" stroke="#2a4a14" stroke-width="2"/>
<path d="M54 122 C54 76 144 76 144 122Z" fill="url(#shell)" stroke="#1a3a12" stroke-width="2.6"/>
<path d="M50 120 H148 C148 130 50 130 50 120Z" fill="#8a6a3a" stroke="#3a2a12" stroke-width="2.2"/>
<path d="M76 92 L90 100 L88 118 M120 92 L108 100 L110 118 M90 100 H108" stroke="#245a22" stroke-width="1.8" fill="none" opacity=".7"/>
<g fill="#b8ef7a"><circle cx="70" cy="96" r="7"/><circle cx="78" cy="90" r="6"/><circle cx="126" cy="96" r="7"/><circle cx="118" cy="88" r="5"/><circle cx="96" cy="84" r="6"/></g>
<path d="M104 86 C104 70 108 60 110 46" stroke="#6a4a22" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M107 66 L118 60" stroke="#6a4a22" stroke-width="3" stroke-linecap="round"/>
<g stroke="#1a4a12" stroke-width="1.8"><circle cx="110" cy="38" r="15" fill="#5ccf6a"/><circle cx="98" cy="46" r="10" fill="#4ab85a"/><circle cx="122" cy="46" r="10" fill="#4ab85a"/><circle cx="120" cy="60" r="7" fill="#5ccf6a"/></g>
<circle cx="106" cy="32" r="4" fill="#c4f59a" opacity=".8"/>
<rect x="74" y="80" width="4" height="10" fill="#fff4dd" stroke="#4a2a12" stroke-width="1"/><path d="M68 82 C68 72 84 72 84 82Z" fill="#e8463a" stroke="#4a1a12" stroke-width="1.6"/><circle cx="73" cy="77" r="1.6" fill="#fff"/><circle cx="79" cy="79" r="1.2" fill="#fff"/>
<rect x="133" y="92" width="3" height="8" fill="#fff4dd"/><path d="M129 94 C129 86 140 86 140 94Z" fill="#ffb347" stroke="#4a2a12" stroke-width="1.4"/>
<path d="M58 112 C40 112 30 104 32 94 C34 84 54 84 58 96" fill="#b7d77a" stroke="#2a4a14" stroke-width="2.4"/>
${eye(42, 96, 6, { iris: "#3a6a1a", line: "#1a2a0a" })}
<path d="M34 104 Q40 108 46 104" stroke="#2a4a14" stroke-width="1.8" fill="none"/><ellipse cx="50" cy="102" rx="4" ry="2.4" fill="#ff7aa0" opacity=".5"/>
<g fill="#ffd1f2"><circle cx="90" cy="80" r="2.4"/><circle cx="132" cy="84" r="2"/></g>`,

    4: () => `
<defs><radialGradient id="wing" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#fff6a8"/><stop offset=".7" stop-color="#ffd23b"/><stop offset="1" stop-color="#c98a00"/></radialGradient>
<linearGradient id="fuzz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe0"/><stop offset="1" stop-color="#e8b84a"/></linearGradient></defs>
${shadowE(100, 146, 30)}
<g stroke="#5a3a00" stroke-width="2.4" stroke-linejoin="round">
<path d="M96 80 C68 36 24 40 26 70 C28 94 66 98 96 88Z" fill="url(#wing)"/><path d="M104 80 C132 36 176 40 174 70 C172 94 134 98 104 88Z" fill="url(#wing)"/>
<path d="M96 92 C72 100 50 122 64 136 C80 144 94 118 98 96Z" fill="url(#wing)"/><path d="M104 92 C128 100 150 122 136 136 C120 144 106 118 102 96Z" fill="url(#wing)"/></g>
<g fill="none" stroke="#7a5200" stroke-width="1.2" opacity=".6"><path d="M92 82 C74 66 50 58 34 62 M92 86 C70 82 50 84 36 80"/><path d="M108 82 C126 66 150 58 166 62 M108 86 C130 82 150 84 164 80"/></g>
<g filter="url(#glow)"><circle cx="56" cy="66" r="12" fill="#3d3300" opacity=".85"/><circle cx="144" cy="66" r="12" fill="#3d3300" opacity=".85"/>
<g transform="translate(56 66) scale(.7)">${GLYPH.electric(E.electric)}</g><g transform="translate(144 66) scale(.7)">${GLYPH.electric(E.electric)}</g></g>
<circle cx="74" cy="122" r="5" fill="#3d3300" opacity=".7"/><circle cx="126" cy="122" r="5" fill="#3d3300" opacity=".7"/>
<ellipse cx="100" cy="100" rx="11" ry="30" fill="url(#fuzz)" stroke="#5a3a00" stroke-width="2.4"/>
<path d="M90 98 H110 M90 108 H110 M92 118 H108" stroke="#7a5200" stroke-width="3" stroke-linecap="round" opacity=".6"/>
<path d="M95 56 C90 40 82 32 72 28 M105 56 C110 40 118 32 128 28" stroke="#5a3a00" stroke-width="2.2" fill="none"/>
<path d="M90 44 l-6 -2 M86 38 l-6 -1 M81 33 l-5 0 M110 44 l6 -2 M114 38 l6 -1 M119 33 l5 0" stroke="#5a3a00" stroke-width="1.6"/>
<g fill="#fffbe0" stroke="#5a3a00" stroke-width="1.6"><circle cx="88" cy="72" r="6"/><circle cx="112" cy="72" r="6"/><circle cx="100" cy="76" r="7"/></g>
<circle cx="100" cy="64" r="13" fill="url(#fuzz)" stroke="#5a3a00" stroke-width="2.4"/>
<circle cx="94" cy="64" r="4.8" fill="#1a1400"/><circle cx="92.6" cy="62.4" r="1.8" fill="#fff"/><circle cx="106" cy="64" r="4.8" fill="#1a1400"/><circle cx="104.6" cy="62.4" r="1.8" fill="#fff"/>
<path d="M97 71 Q100 73 103 71" stroke="#5a3a00" stroke-width="1.4" fill="none"/>
${glyph("electric", 30, 110, .5, 20, .9)}${glyph("electric", 170, 104, .45, -20, .9)}${glyph("electric", 160, 30, .35, 10, .8)}`,

    5: () => `
<defs><radialGradient id="owl" cx=".4" cy=".25" r=".9"><stop offset="0" stop-color="#6a70d8"/><stop offset=".6" stop-color="#3a3f9a"/><stop offset="1" stop-color="#1b1d5a"/></radialGradient></defs>
<g stroke="#ffe9b8" stroke-width=".8" opacity=".55"><path d="M20 30 L40 18 L58 34 L48 50"/><path d="M150 50 L170 34 L186 46"/></g>
<g fill="#fff">${[[20, 30], [40, 18], [58, 34], [48, 50], [150, 50], [170, 34], [186, 46]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.6"/>`).join("")}</g>
<path d="M14 140 C60 132 130 136 190 128" stroke="#3a2416" stroke-width="9" fill="none" stroke-linecap="round"/>
<path d="M160 130 C168 118 178 118 184 120 C176 126 170 130 160 130Z" fill="#4a8a5a"/>
<path d="M62 78 C44 102 50 126 70 134 C72 112 72 94 62 78Z M138 78 C156 102 150 126 130 134 C128 112 128 94 138 78Z" fill="#2a2d7a" stroke="#0d0f3a" stroke-width="2.4"/>
<path d="M100 44 C136 44 146 90 140 112 C134 136 66 136 60 112 C54 90 64 44 100 44Z" fill="url(#owl)" stroke="#0d0f3a" stroke-width="2.6"/>
<path d="M76 96 C78 130 122 130 124 96 C114 104 86 104 76 96Z" fill="#b8c0ff" opacity=".85"/>
<path d="M84 108 q4 4 8 0 q4 4 8 0 q4 4 8 0 M88 118 q4 4 8 0 q4 4 8 0" stroke="#5a5fc4" stroke-width="1.4" fill="none"/>
<path d="M66 56 L70 32 L84 48Z M134 56 L130 32 L116 48Z" fill="#3a3f9a" stroke="#0d0f3a" stroke-width="2.2" stroke-linejoin="round"/>
<circle cx="84" cy="78" r="18" fill="#5a5fc4"/><circle cx="116" cy="78" r="18" fill="#5a5fc4"/>
<g filter="url(#glow)"><circle cx="84" cy="78" r="11.5" fill="#ffd166" stroke="#0d0f3a" stroke-width="1.6"/><circle cx="116" cy="78" r="11.5" fill="#ffd166" stroke="#0d0f3a" stroke-width="1.6"/></g>
<circle cx="85" cy="79" r="5.5" fill="#0b0720"/><circle cx="117" cy="79" r="5.5" fill="#0b0720"/><circle cx="81" cy="74" r="2.6" fill="#fff"/><circle cx="113" cy="74" r="2.6" fill="#fff"/>
<path d="M95 88 L105 88 L100 98Z" fill="#ffc94a" stroke="#5a3a00" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M92 52 A10 10 0 1 0 108 58 A8 8 0 1 1 92 52Z" fill="#ffe9b8" filter="url(#glow)"/>
${glyph("celestial", 70, 112, .3, 0)}${glyph("celestial", 130, 106, .25, 0)}${glyph("celestial", 120, 52, .25, 0)}
<path d="M86 132 l-4 8 M92 132 v9 M98 132 l3 8 M106 132 l-3 8 M112 132 v9 M118 132 l4 8" stroke="#ffc94a" stroke-width="2.6" stroke-linecap="round"/>`,

    6: () => `
<defs><linearGradient id="wolf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f4fcff"/><stop offset=".6" stop-color="#bfe6f8"/><stop offset="1" stop-color="#7ab4dc"/></linearGradient>
<linearGradient id="ice" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#5ed0ff"/></linearGradient></defs>
${shadowE(110, 142, 52)}
<path d="M136 130 C172 128 180 96 162 76 C164 102 150 112 132 116Z" fill="url(#wolf)" stroke="#1d4a6a" stroke-width="2.4"/>
<path d="M86 74 C122 70 148 100 144 134 L82 136 C76 116 74 90 86 74Z" fill="url(#wolf)" stroke="#1d4a6a" stroke-width="2.6"/>
<g fill="url(#ice)" stroke="#2a7ab0" stroke-width="1.6" stroke-linejoin="round" opacity=".95">
<path d="M112 78 L120 52 L126 80Z"/><path d="M124 86 L138 66 L136 92Z"/><path d="M134 98 L152 86 L144 104Z"/><path d="M100 76 L104 56 L110 76Z"/></g>
<rect x="82" y="102" width="15" height="34" rx="7" fill="url(#wolf)" stroke="#1d4a6a" stroke-width="2.2"/><rect x="100" y="104" width="15" height="32" rx="7" fill="url(#wolf)" stroke="#1d4a6a" stroke-width="2.2"/>
<path d="M82 136 h16 M100 136 h16" stroke="#1d4a6a" stroke-width="2"/>
<path d="M64 50 L64 22 L82 44Z" fill="url(#wolf)" stroke="#1d4a6a" stroke-width="2.2" stroke-linejoin="round"/><path d="M68 44 L68 30 L77 42Z" fill="#7ac8ee"/>
<path d="M88 44 L102 20 L106 54Z" fill="url(#wolf)" stroke="#1d4a6a" stroke-width="2.2" stroke-linejoin="round"/><path d="M92 44 L100 30 L102 48Z" fill="#7ac8ee"/>
<path d="M60 50 C74 38 100 40 108 58 C112 70 106 84 94 90 L72 94 C64 94 44 90 38 82 C36 76 44 72 54 70 C52 62 54 56 60 50Z" fill="url(#wolf)" stroke="#1d4a6a" stroke-width="2.6" stroke-linejoin="round"/>
<path d="M44 82 C52 86 64 88 74 86" stroke="#1d4a6a" stroke-width="1.8" fill="none"/>
<path d="M56 86 L60 96 L64 87Z" fill="#fff" stroke="#1d4a6a" stroke-width="1.2"/>
<ellipse cx="40" cy="77" rx="5" ry="4" fill="#12324a"/>
<g fill="url(#ice)" stroke="#2a7ab0" stroke-width="1.4" stroke-linejoin="round"><path d="M92 88 L86 106 L100 94Z"/><path d="M100 84 L104 104 L110 88Z"/><path d="M80 92 L76 108 L88 96Z"/></g>
${eye(74, 62, 5.5, { glow: "#5ef0ff", slit: true })}${eye(91, 60, 5.5, { glow: "#5ef0ff", slit: true })}
<path d="M66 54 L80 58 M86 54 L98 54" stroke="#1d4a6a" stroke-width="2" stroke-linecap="round"/>
${glyph("ice", 172, 36, .5, 20, .8)}${glyph("ice", 24, 44, .4, -15, .8)}`,

    7: () => `
<defs><radialGradient id="lglow" cx=".5" cy=".55" r=".55"><stop offset="0" stop-color="#f2e6ff"/><stop offset=".5" stop-color="#b98cff" stop-opacity=".8"/><stop offset="1" stop-color="#5a2aa0" stop-opacity=".35"/></radialGradient>
<linearGradient id="ghost" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d6b8ff" stop-opacity=".9"/><stop offset="1" stop-color="#9a5cf0" stop-opacity="0"/></linearGradient></defs>
<circle cx="100" cy="74" r="56" fill="#b98cff" opacity=".22" filter="url(#blur)"/>
<path d="M100 0 V24" stroke="#4a3a5a" stroke-width="2.4"/><g fill="none" stroke="#5a4a6a" stroke-width="2"><ellipse cx="100" cy="8" rx="3" ry="5"/><ellipse cx="100" cy="18" rx="3" ry="5"/></g>
<path d="M88 34 C88 22 112 22 112 34" stroke="#3a2a4a" stroke-width="3.2" fill="none"/>
<path d="M76 46 L124 46 L118 34 L82 34Z" fill="#3a2a4a" stroke="#120818" stroke-width="2"/>
<path d="M84 98 C80 120 96 116 90 138 C104 126 108 134 118 120 C112 112 120 106 116 98Z" fill="url(#ghost)"/>
<path d="M78 46 L122 46 L128 98 L72 98Z" fill="url(#lglow)" stroke="#120818" stroke-width="2.4"/>
<path d="M100 46 V98 M86 46 L82 98 M114 46 L118 98" stroke="#3a2a4a" stroke-width="2.2" opacity=".7"/>
<path d="M100 54 C114 66 118 78 112 88 C108 94 92 94 88 88 C82 78 88 68 100 54Z" fill="#9a5cf0" opacity=".85" filter="url(#glow)"/>
<path d="M100 66 C107 72 109 80 106 86 C104 89 96 89 94 86 C91 80 94 74 100 66Z" fill="#f2e6ff"/>
<ellipse cx="96" cy="80" rx="2.4" ry="3.4" fill="#2a0f4d"/><ellipse cx="104" cy="80" rx="2.4" ry="3.4" fill="#2a0f4d"/>
<path d="M97 85 Q100 87 103 85" stroke="#2a0f4d" stroke-width="1.2" fill="none"/>
<path d="M68 98 H132 L126 108 H74Z" fill="#3a2a4a" stroke="#120818" stroke-width="2"/>
${glyph("shadow", 50, 70, .6, -20, .8)}${glyph("shadow", 152, 92, .55, 20, .8)}${glyph("shadow", 140, 40, .4, 10, .6)}`,

    8: () => `
<defs><radialGradient id="stone" cx=".4" cy=".25" r=".9"><stop offset="0" stop-color="#c9b9a6"/><stop offset=".55" stop-color="#8a7866"/><stop offset="1" stop-color="#4a3a2a"/></radialGradient>
<linearGradient id="amber" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe09a"/><stop offset="1" stop-color="#ff8a1a"/></linearGradient></defs>
${shadowE(100, 146, 74)}
<path d="M70 120 C64 140 72 146 88 144 L92 122Z M130 120 C136 140 128 146 112 144 L108 122Z" fill="url(#stone)" stroke="#2a1d12" stroke-width="2.4"/>
<path d="M50 78 C30 96 24 124 30 136 L54 138 C56 122 62 106 68 94Z" fill="url(#stone)" stroke="#2a1d12" stroke-width="2.6"/>
<path d="M150 78 C170 96 176 124 170 136 L146 138 C144 122 138 106 132 94Z" fill="url(#stone)" stroke="#2a1d12" stroke-width="2.6"/>
<ellipse cx="40" cy="138" rx="18" ry="11" fill="url(#stone)" stroke="#2a1d12" stroke-width="2.4"/><ellipse cx="160" cy="138" rx="18" ry="11" fill="url(#stone)" stroke="#2a1d12" stroke-width="2.4"/>
<path d="M44 92 C40 60 70 42 100 42 C130 42 160 60 156 92 C150 120 130 130 100 130 C70 130 50 120 44 92Z" fill="url(#stone)" stroke="#2a1d12" stroke-width="2.8"/>
<g fill="#6aa84a" opacity=".85"><ellipse cx="62" cy="62" rx="12" ry="5" transform="rotate(-30 62 62)"/><ellipse cx="140" cy="60" rx="11" ry="4.5" transform="rotate(30 140 60)"/></g>
<g filter="url(#glow)" stroke="#ffb347" stroke-width="2.2" fill="none" stroke-linecap="round"><path d="M74 78 L84 92 L78 108"/><path d="M128 76 L118 90 L124 112"/><path d="M40 108 L50 116"/><path d="M160 104 L150 118"/></g>
<g fill="url(#amber)" stroke="#8a4a00" stroke-width="1.6" stroke-linejoin="round" filter="url(#glow)">
<path d="M56 60 L60 38 L68 58Z"/><path d="M66 54 L74 34 L78 56Z"/><path d="M134 56 L142 36 L146 60Z"/><path d="M124 52 L128 32 L134 54Z"/></g>
<path d="M100 84 L112 94 L108 110 L92 110 L88 94Z" fill="url(#amber)" stroke="#8a4a00" stroke-width="2" filter="url(#glow)"/>
<path d="M82 50 C82 32 118 32 118 50 C118 68 82 68 82 50Z" fill="url(#stone)" stroke="#2a1d12" stroke-width="2.6"/>
<path d="M80 46 C90 40 110 40 120 46" stroke="#2a1d12" stroke-width="4" fill="none" stroke-linecap="round"/>
${eye(92, 52, 4, { glow: "#ffcf5a" })}${eye(108, 52, 4, { glow: "#ffcf5a" })}
<path d="M94 60 H106" stroke="#2a1d12" stroke-width="2" stroke-linecap="round"/>`,

    9: () => `
<defs><linearGradient id="ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2fff4"/><stop offset=".5" stop-color="#7fe0c2"/><stop offset="1" stop-color="#2f9a8a"/></linearGradient></defs>
<g stroke="#effff8" stroke-width="2" fill="none" opacity=".6" stroke-linecap="round">
<path d="M18 74 C40 90 30 110 60 116"/><path d="M182 74 C160 90 170 110 140 116"/><path d="M60 128 C80 136 120 136 140 128"/></g>
<g transform="rotate(-8 100 90)">
<path d="M100 112 C104 126 118 138 134 150" stroke="#1c5a55" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M100 112 C104 126 118 138 134 150" stroke="#7fe0c2" stroke-width="2.6" fill="none" stroke-linecap="round"/>
<path d="M100 68 C120 70 152 56 186 66 C164 80 142 96 122 104 C114 114 86 114 78 104 C58 96 36 80 14 66 C48 56 80 70 100 68Z" fill="url(#ray)" stroke="#1c5a55" stroke-width="2.6" stroke-linejoin="round"/>
<path d="M100 76 C116 78 140 72 164 70 M100 76 C84 78 60 72 36 70" stroke="#1c5a55" stroke-width="1.2" fill="none" opacity=".4"/>
<g fill="#e2fff4" opacity=".7"><circle cx="140" cy="80" r="4"/><circle cx="156" cy="74" r="3"/><circle cx="60" cy="80" r="4"/><circle cx="44" cy="74" r="3"/></g>
<path d="M88 70 C82 60 86 54 92 56 M112 70 C118 60 114 54 108 56" stroke="#1c5a55" stroke-width="2.4" fill="#7fe0c2"/>
${eye(90, 82, 5.5, { iris: "#1c5a55", line: "#0d2a28" })}${eye(110, 82, 5.5, { iris: "#1c5a55", line: "#0d2a28" })}
<path d="M94 94 Q100 98 106 94" stroke="#1c5a55" stroke-width="1.8" fill="none"/>
<ellipse cx="82" cy="90" rx="4" ry="2.4" fill="#ff9ab0" opacity=".5"/><ellipse cx="118" cy="90" rx="4" ry="2.4" fill="#ff9ab0" opacity=".5"/></g>
${glyph("wind", 34, 40, .7, 0, .7)}${glyph("wind", 168, 126, .6, 0, .7)}`,

    10: () => `
<defs><linearGradient id="cry" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffe0f6"/><stop offset=".5" stop-color="#ff6fd0"/><stop offset="1" stop-color="#6a2ad0"/></linearGradient>
<linearGradient id="wingc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd1f2" stop-opacity=".95"/><stop offset="1" stop-color="#8a5cff" stop-opacity=".75"/></linearGradient>
<radialGradient id="core" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#ffd1f2"/><stop offset="1" stop-color="#ff6fd0"/></radialGradient></defs>
<circle cx="100" cy="74" r="50" fill="none" stroke="#ffc94a" stroke-width="2" opacity=".7" filter="url(#glow)"/>
<circle cx="100" cy="74" r="56" fill="none" stroke="#ffe7a8" stroke-width=".8" stroke-dasharray="2 5" opacity=".8"/>
<g stroke="#3d1470" stroke-width="2.2" stroke-linejoin="round">
<path d="M90 86 L16 20 L30 58 L4 64 L36 86 L14 104 L80 104Z" fill="url(#wingc)"/><path d="M110 86 L184 20 L170 58 L196 64 L164 86 L186 104 L120 104Z" fill="url(#wingc)"/></g>
<g stroke="#fff" stroke-width="1" opacity=".6"><path d="M88 90 L30 58 M86 96 L36 86 M84 100 L14 104"/><path d="M112 90 L170 58 M114 96 L164 86 M116 100 L186 104"/></g>
<path d="M116 124 C150 136 172 130 170 112 C168 100 180 98 186 106" stroke="#3d1470" stroke-width="13" fill="none" stroke-linecap="round"/><path d="M116 124 C150 136 172 130 170 112 C168 100 180 98 186 106" stroke="url(#cry)" stroke-width="8" fill="none" stroke-linecap="round"/>
<g fill="#ffd1f2" stroke="#3d1470" stroke-width="1.4"><path d="M140 128 L144 118 L148 130Z"/><path d="M160 124 L166 114 L168 126Z"/><path d="M186 106 L194 96 L192 110Z"/></g>
<path d="M76 98 C78 80 122 80 124 98 C128 122 118 138 100 140 C82 138 72 122 76 98Z" fill="url(#cry)" stroke="#3d1470" stroke-width="2.6"/>
<path d="M88 104 H112 M86 114 H114 M90 124 H110" stroke="#ffc94a" stroke-width="2.4" stroke-linecap="round" opacity=".85"/>
<rect x="82" y="128" width="12" height="14" rx="5" fill="url(#cry)" stroke="#3d1470" stroke-width="2"/><rect x="106" y="128" width="12" height="14" rx="5" fill="url(#cry)" stroke="#3d1470" stroke-width="2"/>
<path d="M100 96 L92 74 L100 60 L108 74Z" fill="url(#cry)" stroke="#3d1470" stroke-width="2.2"/>
<g fill="#ffe0f6" stroke="#3d1470" stroke-width="1.8" stroke-linejoin="round"><path d="M88 40 L70 8 L92 30Z"/><path d="M112 40 L130 8 L108 30Z"/></g>
<g fill="#ffc94a" stroke="#6a4a00" stroke-width="1.2" filter="url(#glow)"><path d="M94 28 L97 14 L100 28Z"/><path d="M100 26 L103 8 L106 26Z"/><path d="M106 28 L109 16 L112 30Z" transform="translate(-6 0)"/></g>
<path d="M84 46 C84 30 116 30 116 46 C116 58 110 66 100 72 C90 66 84 58 84 46Z" fill="url(#cry)" stroke="#3d1470" stroke-width="2.6"/>
${eye(92, 48, 4.6, { glow: "#ffe27a", slit: true })}${eye(108, 48, 4.6, { glow: "#ffe27a", slit: true })}
<path d="M96 62 L100 66 L104 62" stroke="#3d1470" stroke-width="1.6" fill="none"/>
<g filter="url(#glow)"><path d="M100 98 L106 108 L100 122 L94 108Z" fill="url(#core)"/></g>
<g fill="url(#cry)" stroke="#ffd1f2" stroke-width=".8" filter="url(#glow)"><path d="M30 130 L34 118 L38 130 L34 138Z"/><path d="M168 30 L171 22 L174 30 L171 36Z"/><path d="M40 30 L43 22 L46 30 L43 36Z"/></g>
${glyph("celestial", 60, 128, .35, 0)}${glyph("celestial", 150, 46, .3, 0)}`
  };

  /* ---------- people (Allies) and items ---------- */
  function person(cr, p) {
    const k = cr.look, line = "#2a1a2a", L = `stroke="${line}" stroke-width="2.2" stroke-linejoin="round"`;
    const skin = k.skin, hc = k.hairC, oc = k.outfit;
    const dark = shift(oc.length === 7 ? oc : "#444444", 0, 0, -14);
    let back = "", front = "", hat = "", tool = "", extra = "";
    // hair behind the head
    if (k.hair === "long" || k.hair === "veil") back += `<path d="M78 66 C74 96 76 116 84 126 L116 126 C124 116 126 96 122 66Z" fill="${hc}" ${L}/>`;
    if (k.hair === "braid") back += `<path d="M114 74 C124 88 122 104 128 118" stroke="${line}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M114 74 C124 88 122 104 128 118" stroke="${hc}" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="6 2"/><circle cx="128" cy="120" r="3" fill="${p.light}" ${L}/>`;
    if (k.hair === "ponytail") back += `<path d="M110 58 C130 56 136 74 130 92 C126 80 120 70 110 66Z" fill="${hc}" ${L}/>`;
    if (k.hair === "bun") back += `<circle cx="100" cy="46" r="10" fill="${hc}" ${L}/>`;
    if (k.cape) back += `<path d="M80 96 C70 112 66 130 64 144 L136 144 C134 130 130 112 120 96Z" fill="#8a1a2a" ${L}/>`;
    // body
    const body = `<path d="M82 96 C78 112 76 128 74 142 L126 142 C124 128 122 112 118 96 C112 92 88 92 82 96Z" fill="${oc}" ${L}/>` +
      `<path d="M92 96 L100 106 L108 96" fill="none" stroke="${shift(oc, 0, 0, 20)}" stroke-width="3"/><path d="M76 126 H124" stroke="${dark}" stroke-width="4" opacity=".6"/>` +
      `<path d="M84 100 C76 108 74 116 76 122" stroke="${line}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M84 100 C76 108 74 116 76 122" stroke="${oc}" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="76" cy="123" r="4.5" fill="${skin}" ${L}/>` +
      `<path d="M116 100 C124 106 128 110 132 110" stroke="${line}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M116 100 C124 106 128 110 132 110" stroke="${oc}" stroke-width="7" fill="none" stroke-linecap="round"/>` +
      `<path d="M88 142 v4 M112 142 v4" stroke="${line}" stroke-width="6" stroke-linecap="round"/>`;
    // tools held at ~ (133,110)
    const T = {
      bow: `<path d="M140 76 C156 96 156 124 140 144" stroke="#7a4a22" stroke-width="3.4" fill="none"/><path d="M140 76 L140 144" stroke="#eee" stroke-width="1"/>`,
      spyglass: `<path d="M128 112 L156 90" stroke="${line}" stroke-width="9" stroke-linecap="round"/><path d="M128 112 L156 90" stroke="#d8a84a" stroke-width="6" stroke-linecap="round"/><path d="M148 96 l6 -5" stroke="#8a5a1a" stroke-width="7"/>`,
      hammer: `<path d="M134 114 L150 80" stroke="#7a4a22" stroke-width="4" stroke-linecap="round"/><rect x="140" y="70" width="22" height="12" rx="2" fill="#8a8a9a" ${L} transform="rotate(25 151 76)"/>`,
      rod: `<path d="M134 114 L146 64" stroke="#8a8a9a" stroke-width="3.4" stroke-linecap="round"/><path d="M146 62 l-5 8 l6 0 l-5 9" stroke="#fff6a8" stroke-width="2" fill="none" filter="url(#glow)"/>`,
      lantern: `<path d="M134 112 L140 96" stroke="${line}" stroke-width="2"/><rect x="132" y="96" width="16" height="20" rx="4" fill="#3a2a4a" ${L}/><circle cx="140" cy="106" r="5" fill="#d6b8ff" filter="url(#glow)"/>`,
      staff: `<path d="M134 140 L134 66" stroke="#c9b8ff" stroke-width="3.4" stroke-linecap="round"/><circle cx="134" cy="62" r="6" fill="#fff4d6" filter="url(#glow)"/>${glyph("celestial", 134, 62, .5, 0)}`,
      staffheal: `<path d="M134 140 L134 66" stroke="#d8c8a0" stroke-width="3.4" stroke-linecap="round"/><path d="M134 54 v18 M125 63 h18" stroke="#5fd08a" stroke-width="5" stroke-linecap="round" filter="url(#glow)"/>`,
      pick: `<path d="M134 114 L146 78" stroke="#7a4a22" stroke-width="3.4" stroke-linecap="round"/><path d="M136 76 C144 70 152 72 158 78" stroke="#bfe6f8" stroke-width="4" fill="none" stroke-linecap="round"/>`,
      pickaxe: `<path d="M134 114 L148 78" stroke="#7a4a22" stroke-width="3.6" stroke-linecap="round"/><path d="M134 80 C142 70 156 70 164 80" stroke="#8a8a9a" stroke-width="5" fill="none" stroke-linecap="round"/>`,
      kite: `<path d="M134 110 C150 96 152 70 160 50" stroke="#eee" stroke-width="1"/><path d="M160 30 L172 48 L160 70 L148 48Z" fill="#ff6a3d" ${L}/><path d="M160 30 V70 M148 48 H172" stroke="${line}" stroke-width="1"/>`,
      book: `<path d="M126 104 L146 98 L148 118 L128 124Z" fill="#6a2a8a" ${L}/>${glyph("arcane", 137, 111, .35, 0)}`,
      sword: `<path d="M134 112 L152 70" stroke="#e0e6f0" stroke-width="4" stroke-linecap="round"/><path d="M128 106 L140 112" stroke="#d8a84a" stroke-width="4" stroke-linecap="round"/>`
    };
    tool = T[k.tool] || "";
    // head and face
    const head = `<circle cx="100" cy="70" r="20" fill="${skin}" ${L}/>` +
      eye(93, 72, 5, { iris: p.main === "#ffd93b" ? "#5a7a2a" : shift(p.main, 0, 0, -20), line }) + eye(107, 72, 5, { iris: p.main === "#ffd93b" ? "#5a7a2a" : shift(p.main, 0, 0, -20), line }) +
      `<path d="M96 81 Q100 84 104 81" stroke="${line}" stroke-width="1.6" fill="none"/><ellipse cx="88" cy="78" rx="3.2" ry="2" fill="#ff8aa0" opacity=".5"/><ellipse cx="112" cy="78" rx="3.2" ry="2" fill="#ff8aa0" opacity=".5"/>` +
      (k.beard ? `<path d="M84 76 C86 94 114 94 116 76 C110 84 90 84 84 76Z" fill="${hc}" ${L}/>` : "") +
      (k.glasses ? `<circle cx="93" cy="72" r="6.5" fill="none" stroke="${line}" stroke-width="1.6"/><circle cx="107" cy="72" r="6.5" fill="none" stroke="${line}" stroke-width="1.6"/><path d="M99.5 72 h1" stroke="${line}" stroke-width="1.6"/>` : "");
    // hair in front
    const F = {
      braid: `<path d="M80 66 C80 50 120 48 120 66 C112 58 96 58 80 66Z" fill="${hc}" ${L}/>`,
      short: `<path d="M80 68 C78 48 122 46 120 68 C116 60 108 56 100 60 C92 56 84 60 80 68Z" fill="${hc}" ${L}/>`,
      spiky: `<path d="M80 66 L78 52 L86 56 L88 44 L96 52 L100 40 L106 52 L114 44 L114 56 L122 52 L120 66 C110 58 90 58 80 66Z" fill="${hc}" ${L}/>`,
      long: `<path d="M80 72 C76 50 124 48 120 72 C114 58 104 56 98 60 C92 56 84 60 80 72Z" fill="${hc}" ${L}/>`,
      bun: `<path d="M80 66 C80 48 120 48 120 66 C110 60 90 60 80 66Z" fill="${hc}" ${L}/>`,
      ponytail: `<path d="M80 68 C78 50 120 48 120 66 C112 58 92 58 80 68Z" fill="${hc}" ${L}/>`,
      windswept: `<path d="M80 68 C78 50 108 44 126 54 C120 54 118 58 122 62 C112 58 92 58 80 68Z" fill="${hc}" ${L}/>`,
      bald: "", veil: ""
    };
    front = F[k.hair] || "";
    const H = {
      hood: `<path d="M76 74 C72 46 128 46 124 74 C118 58 82 58 76 74Z" fill="${dark}" ${L}/>`,
      captain: `<path d="M78 56 C80 40 120 40 122 56Z" fill="#f4f4f4" ${L}/><path d="M74 56 H126 C126 62 74 62 74 56Z" fill="#1d2f53" ${L}/><circle cx="100" cy="48" r="4" fill="#d8a84a"/>`,
      goggles: `<path d="M80 62 H120" stroke="#5a3a1a" stroke-width="4"/><circle cx="91" cy="60" r="6" fill="#bff3ff" ${L}/><circle cx="109" cy="60" r="6" fill="#bff3ff" ${L}/>`,
      cowl: `<path d="M74 78 C70 44 130 44 126 78 C120 60 80 60 74 78Z" fill="#1a0d2e" ${L}/>`,
      circlet: `<path d="M82 58 Q100 52 118 58" stroke="#ffd27a" stroke-width="3" fill="none"/>${glyph("celestial", 100, 54, .35, 0)}`,
      furhat: `<path d="M78 60 C78 40 122 40 122 60Z" fill="#2a6aa0" ${L}/><path d="M76 60 C76 54 124 54 124 60 C124 66 76 66 76 60Z" fill="#f4f4f4" ${L}/><circle cx="100" cy="38" r="6" fill="#f4f4f4" ${L}/>`,
      minerhelm: `<path d="M78 60 C78 40 122 40 122 60Z" fill="#e8b84a" ${L}/><path d="M74 60 H126" stroke="${line}" stroke-width="3"/><circle cx="100" cy="50" r="5" fill="#fff6a8" filter="url(#glow)"/>`,
      aviator: `<path d="M78 64 C76 44 124 44 122 64 C116 56 84 56 78 64Z" fill="#7a4a22" ${L}/><circle cx="90" cy="56" r="5" fill="#bff3ff" ${L}/><circle cx="110" cy="56" r="5" fill="#bff3ff" ${L}/><path d="M118 62 C130 64 136 72 134 82" stroke="#fff" stroke-width="3" fill="none"/>`,
      wizard: `<ellipse cx="100" cy="56" rx="28" ry="6" fill="#2a0f4a" ${L}/><path d="M86 54 C88 36 96 22 108 14 C108 26 112 40 114 54Z" fill="#4a1a7a" ${L}/>${glyph("arcane", 102, 40, .35, 0)}`,
      veil: `<path d="M76 92 C70 60 78 46 100 46 C122 46 130 60 124 92 C118 72 112 60 100 60 C88 60 82 72 76 92Z" fill="${hc}" ${L}/>`,
      beret: `<path d="M78 58 C76 44 120 40 124 54 C118 60 90 62 78 58Z" fill="#8a1a2a" ${L}/><circle cx="104" cy="44" r="2.5" fill="#d8a84a"/>`
    };
    hat = H[k.hat] || "";
    return `<ellipse cx="100" cy="146" rx="32" ry="5" fill="#000" opacity=".3"/>` + back + body + tool + head + front + hat + extra;
  }
  function itemArt(cr, p) {
    const k = cr.look, c = k.color, L = `stroke="#3a2410" stroke-width="2.4" stroke-linejoin="round"`, line = "#3a2410";
    const glass = `<radialGradient id="liq" cx=".35" cy=".35" r=".8"><stop offset="0" stop-color="${shift(c, 0, 0, 25)}"/><stop offset=".6" stop-color="${c}"/><stop offset="1" stop-color="${shift(c, 0, 0, -22)}"/></radialGradient>`;
    const shine = (x, y) => `<ellipse cx="${x}" cy="${y}" rx="5" ry="10" fill="#fff" opacity=".55" transform="rotate(20 ${x} ${y})"/>`;
    const cork = (y) => `<rect x="92" y="${y}" width="16" height="12" rx="3" fill="#b8865a" ${L}/>`;
    const S = {
      round: `<path d="M94 52 L106 52 L106 66 C124 72 132 88 128 104 C124 124 76 124 72 104 C68 88 76 72 94 66Z" fill="url(#liq)" ${L}/>` + cork(42) + shine(86, 88),
      tall: `<path d="M94 44 L106 44 L106 60 C114 64 118 70 118 80 L118 122 C118 128 82 128 82 122 L82 80 C82 70 86 64 94 60Z" fill="url(#liq)" ${L}/>` + cork(34) + shine(90, 90),
      square: `<path d="M94 50 L106 50 L106 62 L120 70 L120 120 L80 120 L80 70 L94 62Z" fill="url(#liq)" ${L}/>` + cork(40) + `<path d="M86 80 H114" stroke="#fff" stroke-width="2" opacity=".5"/>`,
      flask: `<path d="M94 48 L106 48 L106 70 L126 114 C128 120 72 120 74 114 L94 70Z" fill="url(#liq)" ${L}/>` + cork(38) + `<path d="M84 104 L116 104" stroke="#fff" stroke-width="2" opacity=".5"/>` + glyph("ice", 100, 96, .6, 0),
      bomb: `<circle cx="100" cy="94" r="28" fill="#2a2a34" ${L}/><rect x="92" y="62" width="16" height="8" rx="2" fill="#5a5a6a" ${L}/><path d="M100 62 C100 50 112 48 114 40" stroke="#7a4a22" stroke-width="3" fill="none"/><g filter="url(#glow)">${glyph("fire", 116, 34, .8, 0)}</g>` + shine(88, 84),
      charm: `<path d="M100 40 L124 70 L114 118 L86 118 L76 70Z" fill="url(#liq)" ${L} opacity=".9"/><g transform="translate(100 84)">${[0, 90, 180, 270].map(a => `<ellipse cx="0" cy="-9" rx="7" ry="9" fill="#5fd08a" stroke="#1a5a2a" stroke-width="1.6" transform="rotate(${a})"/>`).join("")}<circle r="3" fill="#fff6a8"/></g><path d="M100 118 V132" stroke="${line}" stroke-width="2"/>`,
      jar: `<rect x="76" y="62" width="48" height="58" rx="10" fill="url(#liq)" ${L}/><rect x="72" y="52" width="56" height="14" rx="4" fill="#8a6a4a" ${L}/>` + [[88, 82], [104, 92], [96, 104], [112, 78]].map(([x, y]) => `<rect x="${x}" y="${y}" width="6" height="6" fill="#fff" opacity=".8" transform="rotate(45 ${x + 3} ${y + 3})"/>`).join(""),
      pouch: `<path d="M80 74 C70 92 72 118 100 122 C128 118 130 92 120 74Z" fill="url(#liq)" ${L}/><path d="M84 74 C92 66 108 66 116 74" stroke="${line}" stroke-width="3" fill="none"/><path d="M84 68 C80 50 92 40 100 50 C106 36 124 42 118 56 C128 56 128 70 116 70" fill="#d6c4f4" opacity=".75" stroke="${line}" stroke-width="1.6"/>`,
      crystal: `<path d="M100 36 L122 64 L114 124 L86 124 L78 64Z" fill="url(#liq)" ${L}/><path d="M100 36 V124 M78 64 L100 76 L122 64" stroke="#fff" stroke-width="1.4" opacity=".6" fill="none"/><g filter="url(#glow)">${glyph("electric", 100, 90, .9, 0)}</g>`,
      feather: `<path d="M100 130 C80 104 82 60 112 34 C122 62 120 104 100 130Z" fill="url(#liq)" ${L}/><path d="M100 130 C102 100 106 70 112 36" stroke="${line}" stroke-width="2" fill="none"/>` + [50, 64, 78, 92, 106].map(y => `<path d="M${108 - (y - 50) * .1} ${y} l-14 6 M${108 - (y - 50) * .1} ${y} l10 8" stroke="${line}" stroke-width="1.2" opacity=".5"/>`).join("") + `<g filter="url(#glow)" opacity=".8">${glyph("fire", 118, 40, .6, 20)}</g>`,
      moon: `<path d="M94 46 L106 46 L106 58 C126 64 134 84 128 102 C122 124 78 124 72 102 C66 84 74 64 94 58Z" fill="url(#liq)" ${L}/>` + cork(36) + `<path d="M104 78 A12 12 0 1 0 110 100 A9 9 0 1 1 104 78Z" fill="#fff4d6" filter="url(#glow)"/>`
    };
    return `<defs>${glass}</defs><circle cx="100" cy="86" r="52" fill="${c}" opacity=".25" filter="url(#blur)"/><ellipse cx="100" cy="134" rx="40" ry="6" fill="#3a2410" opacity=".3"/>` + (S[k.shape] || S.round) +
      Array.from({ length: 6 }, (_, i) => glyph("celestial", 40 + (i * 37) % 120, 30 + (i * 53) % 100, .22, 0, .8)).join("");
  }
  function parchment() {
    return `<radialGradient id="parch" cx=".5" cy=".45" r=".75"><stop offset="0" stop-color="#fbf1d8"/><stop offset=".7" stop-color="#e8d2a2"/><stop offset="1" stop-color="#b8945a"/></radialGradient>
<rect width="200" height="160" fill="url(#parch)"/><circle cx="100" cy="86" r="58" fill="none" stroke="#a07a3a" stroke-width="1.2" opacity=".55"/><circle cx="100" cy="86" r="66" fill="none" stroke="#a07a3a" stroke-width=".8" stroke-dasharray="3 5" opacity=".55"/>
<path d="M10 10 h24 M10 10 v24 M190 10 h-24 M190 10 v24 M10 150 h24 M10 150 v-24 M190 150 h-24 M190 150 v-24" stroke="#8a6a3a" stroke-width="2" opacity=".6"/>`;
  }
  function townScene(p, r) {
    return `<linearGradient id="town" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3a7a"/><stop offset="1" stop-color="#e8a06a"/></linearGradient><rect width="200" height="160" fill="url(#town)"/>` +
      `<path d="M0 116 L20 116 L20 92 L34 80 L48 92 L48 116 L62 116 L62 100 L80 100 L80 116 L130 116 L130 86 L146 72 L162 86 L162 116 L200 116 V160 H0Z" fill="#2a1f3a" opacity=".85"/>` +
      [[28, 100], [140, 96], [152, 100], [70, 106]].map(([x, y]) => `<rect x="${x}" y="${y}" width="5" height="6" fill="#ffd27a"/>`).join("") + `<path d="M0 136 C60 128 140 130 200 136 V160 H0Z" fill="#1a1428"/>`;
  }
  /* ---------- assembly ---------- */
  function palette(cr) {
    const el = E[cr.element] || { main: "#c9a0ff", light: "#f0e6ff", dark: "#3a2a6a", bg1: "#1a1440", bg2: "#4a3a8a" }, r = rng(sid(cr) * 7 + 3);
    const dh = cr.kind || (typeof cr.id === "number" && cr.id <= 10) ? 0 : (r() - .5) * 36, dl = cr.kind ? 0 : (r() - .5) * 10;
    return {
      ...el,
      body: shift(el.main, dh, 0, dl), bodyLight: shift(el.light, dh, 0, 0), bodyDark: shift(el.main, dh, 0, dl - 22),
      belly: shift(el.light, dh * .5, -10, 6), line: shift(el.dark, dh, -10, -12),
      horn: shift(el.light, dh + 30, -20, -6), iris: shift(el.main, dh + 180, 0, -18)
    };
  }
  const cache = new Map();
  function inner(cr, p) {
    if (cr.kind === "ally") return person(cr, p);
    if (cr.kind === "item") return itemArt(cr, p);
    const r = rng(sid(cr)), F = new Set(cr.feat || []);
    if (HAND[cr.id]) return HAND[cr.id](p);
    const sc = { common: .84, uncommon: .92, rare: 1, epic: 1.05, mythic: 1.08 }[cr.rarity];
    return `<g transform="translate(100 144) scale(${sc}) translate(-100 -144)">${(FORMS[cr.form] || FORMS.blob)(p, r, cr.element, F)}</g>`;
  }
  function svg(cr) {
    const p = palette(cr);
    const bg = cr.kind === "item" ? parchment() : cr.kind === "ally" && !cr.element ? townScene(p) : scene(cr.element, p, rng(sid(cr) * 13));
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160">${defs(p)}${bg}${cr.kind ? "" : aura(cr.rarity, p)}${inner(cr, p)}</svg>`;
  }
  /* ---------- full-art "illustration" compositions for Rare+ (200 x 280) ---------- */
  const SKY = {
    fire: (p, r) => `<circle cx="150" cy="40" r="46" fill="#ffb347" opacity=".35" filter="url(#blur)"/><circle cx="150" cy="40" r="20" fill="#ffd27a" opacity=".55"/>` +
      Array.from({ length: 4 }, (_, i) => `<ellipse cx="${30 + i * 50}" cy="${18 + (i % 2) * 14}" rx="40" ry="12" fill="#2a0a05" opacity=".55"/>`).join("") +
      Array.from({ length: 40 }, () => `<circle cx="${f(r() * 200)}" cy="${f(r() * 200)}" r="${f(.5 + r() * 1.6)}" fill="${r() > .5 ? "#ffcf6a" : "#ff7a3a"}" opacity="${f(.4 + r() * .6)}"/>`).join(""),
    water: (p, r) => `<path d="M0 22 C30 14 60 28 100 20 C140 12 170 26 200 18" stroke="#bff3ff" stroke-width="2" fill="none" opacity=".6"/>` +
      [20, 70, 120, 160].map(x => `<path d="M${x} 0 L${x + 30} 0 L${x - 10} 220 L${x - 30} 220Z" fill="#e6fbff" opacity=".07"/>`).join("") +
      Array.from({ length: 5 }, () => { const x = 20 + r() * 160, y = 30 + r() * 40; return `<path d="M${f(x)} ${f(y)} q8 -5 16 0 q-8 5 -16 0Z M${f(x + 16)} ${f(y)} l5 -4 v8Z" fill="#021426" opacity=".5"/>`; }).join("") +
      Array.from({ length: 24 }, () => `<circle cx="${f(r() * 200)}" cy="${f(r() * 220)}" r="${f(1 + r() * 4)}" fill="none" stroke="#bff3ff" stroke-width=".8" opacity=".5"/>`).join(""),
    nature: (p, r) => `<path d="M0 0 H200 V20 C180 34 170 18 150 30 C130 42 120 22 100 34 C80 44 70 24 50 32 C30 40 20 22 0 30Z" fill="#123d1c"/>` +
      Array.from({ length: 7 }, (_, i) => { const x = 14 + i * 30; const len = 30 + r() * 50; return `<path d="M${x} 20 C${x - 6} ${20 + len * .4} ${x + 6} ${20 + len * .7} ${x} ${20 + len}" stroke="#2f7a3a" stroke-width="2" fill="none"/>` + glyph("nature", x, 20 + len, .45, r() * 60 - 30); }).join("") +
      `<path d="M150 0 L80 220 L120 220 L170 0Z" fill="#fffbd0" opacity=".08"/>` + Array.from({ length: 14 }, () => `<circle cx="${f(r() * 200)}" cy="${f(40 + r() * 160)}" r="1.4" fill="#f4ff9a" opacity=".9" filter="url(#glow)"/>`).join(""),
    electric: (p, r) => Array.from({ length: 5 }, (_, i) => `<g><ellipse cx="${i * 48}" cy="${16 + (i % 2) * 10}" rx="46" ry="20" fill="#1c1838"/><ellipse cx="${i * 48 + 20}" cy="${8 + (i % 2) * 10}" rx="30" ry="16" fill="#2c2850"/></g>`).join("") +
      `<g filter="url(#glow)" stroke="#fff6a8" fill="none" stroke-linejoin="round"><path d="M40 20 L30 60 L44 62 L26 110" stroke-width="2.6"/><path d="M30 60 L14 80" stroke-width="1.4"/><path d="M168 24 L176 54 L164 56 L178 92" stroke-width="2"/></g>` +
      Array.from({ length: 30 }, () => { const x = r() * 200, y = 30 + r() * 180; return `<path d="M${f(x)} ${f(y)} l-3 9" stroke="#9fa6ff" stroke-width=".8" opacity=".45"/>`; }).join(""),
    shadow: (p, r) => Array.from({ length: 40 }, () => `<circle cx="${f(r() * 200)}" cy="${f(r() * 140)}" r="${f(.4 + r() * 1)}" fill="#e6d6ff" opacity="${f(.3 + r() * .7)}"/>`).join("") +
      `<circle cx="132" cy="56" r="48" fill="#e9dcff" opacity=".18" filter="url(#blur)"/><circle cx="132" cy="56" r="36" fill="#efe6ff" opacity=".92"/><circle cx="120" cy="48" r="6" fill="#d6c4f4"/><circle cx="144" cy="66" r="4" fill="#d6c4f4"/><circle cx="138" cy="44" r="3" fill="#d6c4f4"/>` +
      Array.from({ length: 6 }, () => { const x = 20 + r() * 170, y = 20 + r() * 90, s = .6 + r() * .7; return `<path transform="translate(${f(x)} ${f(y)}) scale(${f(s)})" d="M0 0 C-4 -4 -10 -4 -14 0 C-10 -1 -6 1 -4 4 C-2 2 2 2 4 4 C6 1 10 -1 14 0 C10 -4 4 -4 0 0Z" fill="#05020c"/>`; }).join(""),
    celestial: (p, r) => `<g transform="translate(100 60)" opacity=".8">` + Array.from({ length: 3 }, (_, i) => `<path d="M0 0 C${30 + i * 20} -${10 + i * 6} ${60 + i * 20} ${20 + i * 10} ${40 + i * 30} ${50 + i * 10}" stroke="${i % 2 ? "#ff8ad8" : "#9a7cff"}" stroke-width="${10 - i * 2}" fill="none" opacity=".35" filter="url(#soft)" transform="rotate(${i * 120})"/>`).join("") + `<circle r="8" fill="#fff4d6" filter="url(#glow)"/></g>` +
      Array.from({ length: 70 }, () => `<circle cx="${f(r() * 200)}" cy="${f(r() * 230)}" r="${f(.3 + r() * 1.2)}" fill="#fff" opacity="${f(.4 + r() * .6)}"/>`).join("") +
      `<path d="M10 30 L150 120" stroke="#fff" stroke-width="1.4" opacity=".55" stroke-linecap="round"/><circle cx="150" cy="120" r="3" fill="#fff" filter="url(#glow)"/>`,
    ice: (p, r) => [0, 1, 2].map(i => `<path d="M${-20 + i * 30} 0 C${20 + i * 40} ${40 + i * 10} ${80 + i * 30} 10 ${120 + i * 30} ${50 + i * 10} C${150 + i * 20} ${70 + i * 10} 190 40 220 ${60 + i * 6}" stroke="${["#8affd6", "#7ec8ff", "#c08aff"][i]}" stroke-width="${16 - i * 3}" fill="none" opacity=".28" filter="url(#soft)"/>`).join("") +
      Array.from({ length: 50 }, () => `<circle cx="${f(r() * 200)}" cy="${f(r() * 230)}" r="${f(.6 + r() * 1.6)}" fill="#fff" opacity="${f(.5 + r() * .5)}"/>`).join("") + glyph("ice", 30, 40, .8, 15, .7) + glyph("ice", 172, 30, .6, -10, .6),
    earth: (p, r) => `<path d="M0 0 H50 C40 30 46 70 30 110 L0 120Z M200 0 H156 C164 34 156 70 172 104 L200 112Z" fill="#2a170a"/><path d="M0 0 C60 30 140 30 200 0" stroke="#2a170a" stroke-width="14" fill="none"/>` +
      [[24, 60], [176, 70], [36, 96], [168, 40]].map(([x, y]) => `<path d="M${x - 4} ${y + 6} L${x} ${y - 10} L${x + 4} ${y + 6}Z" fill="#ffcf8a" filter="url(#glow)" opacity=".9"/>`).join("") +
      Array.from({ length: 24 }, () => `<circle cx="${f(r() * 200)}" cy="${f(30 + r() * 180)}" r="${f(.5 + r())}" fill="#ffe0b0" opacity=".5"/>`).join(""),
    wind: (p, r) => Array.from({ length: 6 }, () => { const x = r() * 200, y = 10 + r() * 90; return `<g fill="#fff" opacity=".6"><ellipse cx="${f(x)}" cy="${f(y)}" rx="30" ry="10"/><ellipse cx="${f(x + 14)}" cy="${f(y - 7)}" rx="16" ry="10"/></g>`; }).join("") +
      Array.from({ length: 8 }, () => { const y = 20 + r() * 190, x = r() * 120; return `<path d="M${f(x)} ${f(y)} C${f(x + 30)} ${f(y - 8)} ${f(x + 60)} ${f(y + 8)} ${f(x + 90)} ${f(y)} c8 -2 8 -12 0 -10" stroke="#effff8" stroke-width="1.4" fill="none" opacity=".55"/>`; }).join("") +
      Array.from({ length: 7 }, (_, i) => `<path d="M${130 + i * 8} ${30 + (i % 3) * 6} q3 -3 6 0 q3 -3 6 0" stroke="#164a4a" stroke-width="1.4" fill="none"/>`).join(""),
    arcane: (p, r) => `<circle cx="100" cy="70" r="56" fill="none" stroke="#ff9be3" stroke-width="1.4" opacity=".55"/><circle cx="100" cy="70" r="46" fill="none" stroke="#ffd1f2" stroke-width=".8" stroke-dasharray="3 5" opacity=".7"/>` +
      Array.from({ length: 8 }, (_, i) => glyph("arcane", 100 + Math.cos(i * .785) * 56, 70 + Math.sin(i * .785) * 56, .35, 0, .8)).join("") +
      `<path d="M10 40 L44 40 L36 54 L18 54Z M150 26 L190 26 L180 42 L160 42Z" fill="#2a0f4a"/><path d="M14 40 l4 -10 l6 10 M156 26 l6 -12 l6 12" fill="#4a1a7a"/>` +
      Array.from({ length: 30 }, () => `<circle cx="${f(r() * 200)}" cy="${f(r() * 230)}" r="${f(.3 + r())}" fill="#ffd1f2" opacity="${f(.3 + r() * .7)}"/>`).join("")
  };
  const FORE = {
    fire: p => `<path d="M0 214 C40 206 80 222 120 212 C150 204 180 216 200 210 V280 H0Z" fill="#1a0603"/><path d="M10 240 C50 228 90 246 140 236 C170 230 190 238 200 236" stroke="#ff6a1a" stroke-width="2.4" fill="none" opacity=".7" filter="url(#glow)"/>`,
    water: p => `<path d="M0 212 C40 204 80 220 120 210 C150 204 180 214 200 208 V280 H0Z" fill="#021426"/><path d="M0 226 C40 218 80 234 120 224 C150 218 180 228 200 222" stroke="#2a8aba" stroke-width="1.4" fill="none" opacity=".7"/><path d="M14 280 C10 250 24 238 16 214 M186 280 C190 252 176 240 184 218" stroke="#2f9a7a" stroke-width="5" fill="none" stroke-linecap="round"/>`,
    nature: p => `<path d="M0 210 C60 200 140 204 200 210 V280 H0Z" fill="#0d2e16"/>` + Array.from({ length: 26 }, (_, i) => { const x = i * 8; return `<path d="M${x} 280 Q${x + 2} 236 ${x + 6} ${214 - (i * 7 % 13)}" stroke="#3f9a4a" stroke-width="1.8" fill="none"/>`; }).join(""),
    electric: p => `<path d="M0 212 C60 204 140 206 200 212 V280 H0Z" fill="#110e24"/><path d="M0 228 H200" stroke="#fff6a8" stroke-width=".8" opacity=".25"/>`,
    shadow: p => `<path d="M0 210 C40 198 80 208 120 200 C160 192 180 204 200 200 V280 H0Z" fill="#05020c"/><ellipse cx="100" cy="214" rx="120" ry="12" fill="${p.light}" opacity=".12" filter="url(#blur)"/>`,
    celestial: p => `<ellipse cx="100" cy="222" rx="130" ry="26" fill="#fff4d6" opacity=".14"/><path d="M0 220 C60 212 140 214 200 220 V280 H0Z" fill="#120f33" opacity=".85"/>`,
    ice: p => `<path d="M0 210 C60 202 140 204 200 210 V280 H0Z" fill="#e9f8ff"/><path d="M0 230 C50 222 120 238 200 228" stroke="#bfe6f8" stroke-width="3" fill="none"/>`,
    earth: p => `<path d="M0 210 C60 202 140 204 200 210 V280 H0Z" fill="#2a170a"/>` + [[20, 226], [60, 240], [150, 232], [184, 248], [100, 252]].map(([x, y]) => glyph("earth", x, y, .7, 0, .9)).join(""),
    wind: p => `<path d="M0 214 C60 206 140 208 200 214 V280 H0Z" fill="#164a4a"/>` + Array.from({ length: 20 }, (_, i) => `<path d="M${i * 10} 280 Q${i * 10 + 8} 240 ${i * 10 + 14} 220" stroke="#5fb0a0" stroke-width="1.4" fill="none" opacity=".8"/>`).join(""),
    arcane: p => `<path d="M0 214 C60 206 140 208 200 214 V280 H0Z" fill="#14072a"/><ellipse cx="100" cy="218" rx="86" ry="14" fill="none" stroke="#ff9be3" stroke-width="1.6" opacity=".7" filter="url(#glow)"/>`
  };
  function tallSvg(cr) {
    const p = palette(cr), R = rng(sid(cr) * 31 + 7), el = cr.element;
    let sc = scene(el, p, rng(sid(cr) * 13)).replace('<rect width="200" height="160" fill="url(#sky)"/>', "");
    if (el === "shadow") sc = sc.replace(/<circle cx="158" cy="38" r="22"[^>]*\/><circle cx="168" cy="32" r="20"[^>]*\/>/, "");
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 280">${defs(p)}<defs>
<linearGradient id="tsky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p.bg1}"/><stop offset=".6" stop-color="${p.bg2}"/><stop offset="1" stop-color="${p.bg1}"/></linearGradient>
<radialGradient id="vig" cx=".5" cy=".42" r=".78"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>
<linearGradient id="rays" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".22"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/></linearGradient>
<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="${cr.id}"/><feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .09 0"/></filter></defs>
<rect width="200" height="280" fill="url(#tsky)"/>${SKY[el](p, R)}
<g transform="translate(-10 22) scale(1.1)">${sc}</g>
<g transform="translate(0 -16)">${FORE[el](p)}</g><rect y="262" width="200" height="18" fill="#000" opacity=".35"/>
<path d="M0 0 L90 0 L200 170 L200 230Z" fill="url(#rays)"/>
<g transform="translate(-10 22) scale(1.1)">${aura(cr.rarity, p)}${inner(cr, p)}</g>
<rect width="200" height="280" fill="url(#vig)"/><rect width="200" height="280" filter="url(#grain)"/></svg>`;
  }
  const tallCache = new Map();
  function tallUri(cr) {
    if (cr.tallImg) return cr.tallImg;
    if (!tallCache.has(cr.id)) tallCache.set(cr.id, "data:image/svg+xml;charset=utf-8," + encodeURIComponent(tallSvg(cr)));
    return tallCache.get(cr.id);
  }
  // Undiscovered creatures: dark silhouette with a faint elemental rim light
  function silhouette(cr) {
    const p = palette(cr), e = E[cr.element];
    const [h] = hexToHsl(e.main);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160">${defs(p)}
<radialGradient id="sbg" cx=".5" cy=".55" r=".7"><stop offset="0" stop-color="${hsl(h, 45, 22)}"/><stop offset="1" stop-color="#07081a"/></radialGradient>
<filter id="sil" x="-20%" y="-20%" width="140%" height="140%"><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .55 0" result="a"/><feMorphology in="a" operator="dilate" radius="1.4" result="m"/><feGaussianBlur in="m" stdDeviation="2.4" result="rim"/><feFlood flood-color="${e.light}" result="c"/><feComposite in="c" in2="rim" operator="in" result="rimc"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 .04  0 0 0 0 .045  0 0 0 0 .12  0 0 0 1 0" result="dark"/><feMerge><feMergeNode in="rimc"/><feMergeNode in="dark"/></feMerge></filter>
<rect width="200" height="160" fill="url(#sbg)"/><g filter="url(#sil)">${inner(cr, p)}</g>
<text x="100" y="152" text-anchor="middle" font-family="Georgia,serif" font-size="11" font-weight="700" fill="${e.light}" opacity=".35" letter-spacing="4">UNDISCOVERED</text></svg>`;
  }
  const silCache = new Map();
  function silUri(cr) {
    if (!silCache.has(cr.id)) silCache.set(cr.id, "data:image/svg+xml;charset=utf-8," + encodeURIComponent(silhouette(cr)));
    return silCache.get(cr.id);
  }
  function uri(cr) {
    if (cr.img) return cr.img;
    if (!cache.has(cr.id)) cache.set(cr.id, "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg(cr)));
    return cache.get(cr.id);
  }
  function icon(el, size = 18) {
    return `<svg class="el-icon" width="${size}" height="${size}" viewBox="-14 -14 28 28" aria-hidden="true">${GLYPH[el](E[el])}</svg>`;
  }
  window.Art = { svg, uri, silUri, silhouette, tallSvg, tallUri, icon };
})();
