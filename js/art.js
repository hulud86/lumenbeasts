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
      `<circle cx="${f(x + r * .15)}" cy="${f(y + r * .15)}" r="${f(r * .38)}" fill="#0b0710"/>` +
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
        `<path d="M56 114 C54 ${f(top + 30)} 78 ${f(top)} 100 ${f(top)} C122 ${f(top)} 146 ${f(top + 30)} 144 114 C144 134 124 141 100 141 C76 141 56 134 56 114Z" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>` +
        (r() > .4 ? `<ellipse cx="100" cy="122" rx="26" ry="14" fill="url(#belly)"/>` : "") +
        (r() > .5 ? `<path d="M58 110 C46 106 44 96 50 92" stroke="${p.line}" stroke-width="2.4" fill="${p.body}"/><path d="M142 110 C154 106 156 96 150 92" stroke="${p.line}" stroke-width="2.4" fill="${p.body}"/>` : "") +
        pattern(p, r, 100, 96, 34) + hat +
        (F.has("grin") ? eye(84, 96, 8, { glow: "#ffe27a" }) + eye(116, 96, 8, { glow: "#ffe27a" }) : eye(86, 100, 9, { iris: p.iris, line: p.line, sleepy: F.has("sleepy"), lid: p.bodyDark }) + eye(114, 100, 9, { iris: p.iris, line: p.line, sleepy: F.has("sleepy"), lid: p.bodyDark })) +
        grin + `<ellipse cx="76" cy="112" rx="5" ry="3" fill="#ff7aa0" opacity=".5"/><ellipse cx="124" cy="112" rx="5" ry="3" fill="#ff7aa0" opacity=".5"/>`;
    },
    quad(p, r, el, F) {
      const tailUp = F.has("tailDown") ? false : r() > .35;
      const L = `stroke="${p.line}" stroke-width="2.2"`;
      let ears;
      if (F.has("longears")) ears = `<path d="M58 66 C46 30 54 14 62 16 C70 20 70 44 70 64Z M80 60 C80 24 92 12 98 18 C104 26 96 48 90 64Z" fill="${p.body}" ${L}/><path d="M60 58 C54 34 58 24 62 24 C66 28 66 44 66 58Z M84 56 C86 32 92 24 94 26 C96 34 92 46 88 58Z" fill="#ffb8c8" opacity=".7"/>`;
      else if (F.has("roundears")) ears = `<circle cx="60" cy="64" r="10" fill="${p.body}" ${L}/><circle cx="92" cy="60" r="10" fill="${p.body}" ${L}/><circle cx="60" cy="64" r="5" fill="${p.bodyDark}"/><circle cx="92" cy="60" r="5" fill="${p.bodyDark}"/>`;
      else if (F.has("noears")) ears = "";
      else ears = `<path d="M62 70 L58 ${F.has("tufts") ? 36 : 44} L78 62Z M84 62 L${F.has("tufts") ? "100 32" : "96 40"} L98 70Z" fill="${p.body}" ${L} stroke-linejoin="round"/>` + (F.has("tufts") ? `<path d="M58 36 l-2 -8 M100 32 l4 -7" stroke="${p.line}" stroke-width="2.4" stroke-linecap="round"/>` : "");
      let back = "", front = "", bodyTop = "";
      if (F.has("mane")) back += `<g transform="translate(78 82)">` + Array.from({ length: 11 }, (_, i) => { const a = i / 11 * Math.PI * 2; return `<path d="M${f(Math.cos(a) * 18)} ${f(Math.sin(a) * 18)} L${f(Math.cos(a + .2) * 40)} ${f(Math.sin(a + .2) * 40)} L${f(Math.cos(a + .45) * 18)} ${f(Math.sin(a + .45) * 18)}Z" fill="${i % 2 ? p.main : p.light}" stroke="${p.line}" stroke-width="1.6"/>`; }).join("") + `</g>`;
      if (F.has("wings")) back += `<path d="M112 92 C116 60 140 40 168 34 C160 54 164 62 156 70 C150 80 132 90 120 96Z" fill="${p.light}" stroke="${p.line}" stroke-width="2.2" opacity=".95"/><path d="M120 90 L160 46 M124 94 L156 70" stroke="${p.line}" stroke-width="1" opacity=".5"/>`;
      if (F.has("spikes")) bodyTop += Array.from({ length: 6 }, (_, i) => { const x = 90 + i * 10, y = 86 - Math.sin(i / 5 * Math.PI) * 4; return `<path d="M${x - 5} ${y + 4} L${x} ${y - 14} L${x + 5} ${y + 4}Z" fill="${p.horn}" stroke="${p.line}" stroke-width="1.6" stroke-linejoin="round"/>`; }).join("");
      if (F.has("shell")) bodyTop += `<path d="M80 108 C80 70 146 68 148 108Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2.4"/><path d="M92 106 L98 84 M112 106 V78 M132 106 L126 84" stroke="${p.line}" stroke-width="1.6" opacity=".6"/>` + (F.has("mountain") ? `<path d="M92 84 L112 46 L124 66 L132 58 L144 90Z" fill="#8a8a7a" stroke="${p.line}" stroke-width="2"/><path d="M106 58 L112 46 L118 56Z" fill="#fff"/>` : "");
      if (F.has("ramhorns")) front += `<path d="M62 66 C44 56 40 80 52 84 C60 86 62 76 56 74" stroke="${p.horn}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M90 62 C108 50 116 74 104 80 C96 82 94 72 100 70" stroke="${p.horn}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
      if (F.has("antlers")) front += `<g stroke="${p.horn}" stroke-width="4" fill="none" stroke-linecap="round"><path d="M66 62 C60 44 50 34 40 30 M58 46 L46 46 M54 38 L58 26"/><path d="M88 58 C96 40 108 32 120 28 M98 42 L110 44 M104 36 L100 24"/></g>` + glyph(el, 40, 28, .5, 0) + glyph(el, 120, 26, .5, 0);
      if (F.has("horns") || (!F.size && r() > .6)) front += `<path d="M70 62 C64 44 72 34 80 30 C76 42 80 52 80 62Z M88 62 C90 44 102 38 110 38 C102 46 100 56 96 66Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2"/>`;
      if (F.has("unihorn")) front += `<path d="M70 62 L80 22 L84 62Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2" stroke-linejoin="round"/>`;
      if (F.has("hexhorns")) front += [[-26, 66], [-12, 72], [0, 76], [12, 84], [24, 90], [36, 94]].map(([a, x]) => `<path d="M${x - 3} 64 L${f(x + Math.sin(a * Math.PI / 180) * 24)} ${f(64 - Math.cos(a * Math.PI / 180) * 24)} L${x + 3} 64Z" fill="${p.horn}" stroke="${p.line}" stroke-width="1.6"/>`).join("");
      if (F.has("nosehorn")) front += `<path d="M44 86 L36 60 L54 82Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2" stroke-linejoin="round"/>`;
      const snout = F.has("longsnout") ? `<path d="M64 86 L22 90 C16 92 16 102 22 102 L64 102Z" fill="url(#belly)" stroke="${p.line}" stroke-width="2"/><path d="M26 100 l4 -4 l4 4 l4 -4 l4 4 l4 -4 l4 4" stroke="#fff" stroke-width="1.6" fill="none"/><ellipse cx="24" cy="92" rx="3" ry="2" fill="${p.line}"/>`
        : F.has("pigsnout") ? `<ellipse cx="54" cy="94" rx="12" ry="10" fill="${p.bodyDark}" stroke="${p.line}" stroke-width="2"/><ellipse cx="50" cy="94" rx="2" ry="3" fill="${p.line}"/><ellipse cx="58" cy="94" rx="2" ry="3" fill="${p.line}"/>`
        : `<ellipse cx="60" cy="94" rx="14" ry="10" fill="url(#belly)" stroke="${p.line}" stroke-width="2"/><ellipse cx="49" cy="90" rx="4.5" ry="3.5" fill="${p.line}"/><path d="M52 100 Q58 104 64 100" stroke="${p.line}" stroke-width="1.8" fill="none"/>`;
      const tusks = F.has("tusks") ? `<path d="M56 100 C46 104 42 92 46 84 C48 94 52 96 60 96Z M66 102 C58 110 52 102 52 96 C56 100 60 100 68 98Z" fill="#fffbe8" stroke="${p.line}" stroke-width="1.6"/>` : "";
      const bodyRx = F.has("long") ? 46 : 38, bodyRy = F.has("bulky") ? 28 : 23;
      return shadowE(108, 142, 50) +
        `<path d="M140 104 C${tailUp ? "164 100 172 80 164 62" : "164 110 176 118 178 132"}" stroke="${p.line}" stroke-width="${F.has("fluffytail") ? 18 : 12}" fill="none" stroke-linecap="round"/><path d="M140 104 C${tailUp ? "164 100 172 80 164 62" : "164 110 176 118 178 132"}" stroke="${p.body}" stroke-width="${F.has("fluffytail") ? 13 : 7.5}" fill="none" stroke-linecap="round"/>` +
        glyph(el, tailUp ? 164 : 178, tailUp ? 58 : 134, .7, tailUp ? 10 : 100) + back +
        `<rect x="122" y="110" width="14" height="30" rx="6" fill="${p.bodyDark}" ${L}/><rect x="134" y="112" width="13" height="28" rx="6" fill="${p.bodyDark}" ${L}/>` +
        `<ellipse cx="112" cy="106" rx="${bodyRx}" ry="${bodyRy}" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>` +
        `<ellipse cx="108" cy="118" rx="24" ry="8" fill="url(#belly)"/>` + pattern(p, r, 116, 100, 26) + bodyTop +
        `<rect x="82" y="112" width="14" height="30" rx="6" fill="${p.body}" ${L}/><rect x="98" y="114" width="13" height="28" rx="6" fill="${p.body}" ${L}/>` +
        ears + `<circle cx="76" cy="84" r="${F.has("bighead") ? 28 : 25}" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>` +
        snout + tusks + front +
        eye(68, 80, 7, { iris: p.iris, line: p.line }) + eye(86, 78, 7.5, { iris: p.iris, line: p.line }) +
        `<ellipse cx="94" cy="92" rx="5" ry="3" fill="#ff7aa0" opacity=".45"/>` +
        (F.has("spikes") || F.has("shell") ? "" : glyph(el, 106, 84, .55, -10, .95) + glyph(el, 124, 86, .5, 10, .9));
    },
    serpent(p, r, el, F) {
      const d = r() > .5 ? "M168 140 C190 118 160 96 128 110 C96 124 70 116 78 86" : "M30 140 C10 120 50 96 90 116 C126 132 140 112 120 86";
      const hx = d[1] === "1" ? 78 : 120, hy = 74;
      return shadowE(100, 144, 64) +
        `<path d="${d}" stroke="${p.line}" stroke-width="29" fill="none" stroke-linecap="round"/><path d="${d}" stroke="url(#bodyLin)" stroke-width="23" fill="none" stroke-linecap="round"/>` +
        `<path d="${d}" stroke="${p.belly}" stroke-width="7" fill="none" stroke-linecap="round" stroke-dasharray="6 5" opacity=".7"/>` +
        `<path d="M${hx - 16} ${hy - 12} L${hx - 10} ${hy - 30} L${hx - 2} ${hy - 16} L${hx + 4} ${hy - 32} L${hx + 10} ${hy - 14} L${hx + 18} ${hy - 26} L${hx + 18} ${hy - 6}Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2" stroke-linejoin="round"/>` +
        `<ellipse cx="${hx}" cy="${hy}" rx="24" ry="18" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>` +
        `<ellipse cx="${hx}" cy="${hy + 8}" rx="15" ry="7" fill="url(#belly)"/>` +
        eye(hx - 9, hy - 3, 6.5, { iris: p.iris, line: p.line }) + eye(hx + 9, hy - 3, 6.5, { iris: p.iris, line: p.line }) +
        `<path d="M${hx - 6} ${hy + 8} Q${hx} ${hy + 12} ${hx + 6} ${hy + 8}" stroke="${p.line}" stroke-width="1.8" fill="none"/>` +
        glyph(el, d[1] === "1" ? 168 : 30, 138, .7, 0) + glyph(el, 104, 116, .5, 20, .8) +
        (F.has("heads3") ? [[hx + 44, hy + 6], [hx + 26, hy - 26]].map(([x, y]) => `<path d="M${x} ${y + 14} C${x} ${y + 30} ${x - 10} ${y + 40} ${x - 14} ${y + 50}" stroke="${p.line}" stroke-width="14" fill="none" stroke-linecap="round"/><path d="M${x} ${y + 14} C${x} ${y + 30} ${x - 10} ${y + 40} ${x - 14} ${y + 50}" stroke="${p.body}" stroke-width="9" fill="none" stroke-linecap="round"/><ellipse cx="${x}" cy="${y}" rx="15" ry="12" fill="url(#body)" stroke="${p.line}" stroke-width="2.2"/>` + eye(x - 5, y - 2, 4, { glow: p.light, slit: true }) + eye(x + 5, y - 2, 4, { glow: p.light, slit: true })).join("") : "") +
        (F.has("whiskers") ? `<path d="M${hx - 12} ${hy + 6} C${hx - 30} ${hy + 4} ${hx - 40} ${hy + 18} ${hx - 50} ${hy + 10} M${hx + 12} ${hy + 6} C${hx + 30} ${hy + 4} ${hx + 40} ${hy + 18} ${hx + 50} ${hy + 10}" stroke="${p.light}" stroke-width="2" fill="none"/>` : "");
    },
    bird(p, r, el, F) {
      const spread = F.has("folded") ? false : F.has("spread") ? true : r() > .45;
      const wingR = spread ? "M108 92 C130 60 160 44 184 40 C176 64 166 70 176 76 C160 84 150 84 158 94 C140 100 124 104 110 108Z" : "M102 92 C130 88 146 104 148 124 C132 124 116 118 104 110Z";
      const wingL = spread ? "M92 92 C70 60 40 44 16 40 C24 64 34 70 24 76 C40 84 50 84 42 94 C60 100 76 104 90 108Z" : "";
      return shadowE(100, 142, 34) +
        `<path d="M112 116 L150 132 L140 120 L158 120 L120 106Z" fill="${p.bodyDark}" stroke="${p.line}" stroke-width="2" stroke-linejoin="round"/>` +
        (wingL ? `<path d="${wingL}" fill="url(#bodyLin)" stroke="${p.line}" stroke-width="2.4" stroke-linejoin="round"/>` : "") +
        `<ellipse cx="100" cy="106" rx="30" ry="28" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>` +
        `<ellipse cx="96" cy="114" rx="18" ry="16" fill="url(#belly)"/>` +
        `<path d="${wingR}" fill="url(#bodyLin)" stroke="${p.line}" stroke-width="2.4" stroke-linejoin="round"/>` +
        (spread ? `<path d="M120 94 L170 52 M122 100 L166 78 M118 104 L152 94" stroke="${p.line}" stroke-width="1.2" opacity=".5"/>` : `<path d="M110 100 Q130 104 140 120 M108 106 Q124 110 132 122" stroke="${p.line}" stroke-width="1.2" fill="none" opacity=".5"/>`) +
        `<circle cx="94" cy="74" r="21" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>` +
        `<path d="M78 76 L60 82 L78 86Z" fill="#ffc94a" stroke="${p.line}" stroke-width="2" stroke-linejoin="round"/>` +
        eye(88, 70, 6.5, { iris: p.iris, line: p.line }) + eye(103, 69, 6.5, { iris: p.iris, line: p.line }) +
        `<path d="M92 132 v8 m-4 0 h8 M106 132 v8 m-4 0 h8" stroke="#e8a33a" stroke-width="2.4" stroke-linecap="round"/>` +
        (F.has("bat") ? `<path d="M80 60 L76 40 L90 54Z M100 54 L110 36 L108 58Z" fill="${p.body}" stroke="${p.line}" stroke-width="2"/>` : F.has("crest") ? `<path d="M96 54 C92 36 104 26 116 24 C108 34 110 42 112 50 C118 42 126 40 134 42 C124 46 116 54 108 60Z" fill="${p.light}" stroke="${p.line}" stroke-width="2"/>` : glyph(el, 94, 48, .8, 0) + glyph(el, 84, 50, .5, -30, .8)) +
        (F.has("lion") ? `<path d="M98 120 L106 132 L120 126Z" fill="${p.horn}"/>` : "") +
        (F.has("trail") ? `<path d="M126 116 C150 126 170 140 196 150" stroke="${p.light}" stroke-width="8" fill="none" stroke-linecap="round" opacity=".7" filter="url(#glow)"/>` : "");
    },
    dragon(p, r, el, F) {
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
        `<path d="M58 76 L66 80 L60 84" fill="#fff" stroke="${p.line}" stroke-width="1"/>` +
        eye(86, 62, 6, { glow: p.light, slit: true }) +
        `<circle cx="60" cy="70" r="1.8" fill="${p.line}"/>` +
        glyph(el, 64, 92, .7, -20, .9) + glyph(el, 150, 140, .5, 0, .8);
    },
    golem(p, r, el, F) {
      if (F.has("orb")) return shadowE(100, 146, 30) + `<ellipse cx="100" cy="88" rx="62" ry="16" fill="none" stroke="${p.light}" stroke-width="2" opacity=".7" transform="rotate(-12 100 88)"/>` +
        `<circle cx="100" cy="88" r="36" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/><ellipse cx="88" cy="74" rx="12" ry="7" fill="#fff" opacity=".4"/>` +
        eye(100, 90, 13, { iris: p.iris, line: p.line }) + [[40, 70], [160, 104], [62, 116]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="7" fill="${p.horn}" stroke="${p.line}" stroke-width="1.8"/>`).join("");
      if (F.has("round")) return shadowE(100, 144, 36) + `<rect x="80" y="124" width="14" height="16" rx="6" fill="${p.bodyDark}" stroke="${p.line}" stroke-width="2"/><rect x="106" y="124" width="14" height="16" rx="6" fill="${p.bodyDark}" stroke="${p.line}" stroke-width="2"/>` +
        `<path d="M62 104 C60 76 80 64 102 64 C126 64 142 80 138 106 C136 126 118 134 100 134 C78 134 64 124 62 104Z" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/><path d="M78 80 L86 90 M120 84 L114 96" stroke="${p.line}" stroke-width="1.6" opacity=".5"/>` +
        eye(88, 98, 7.5, { iris: p.iris, line: p.line }) + eye(112, 98, 7.5, { iris: p.iris, line: p.line }) + `<path d="M94 112 Q100 116 106 112" stroke="${p.line}" stroke-width="2" fill="none"/>` + glyph(el, 100, 62, .7, 0);
      const fur = F.has("furry");
      const body = fur ? "#eef6ff" : "url(#body)";
      let head = `<rect x="82" y="38" width="36" height="30" rx="${fur ? 15 : 9}" fill="${body}" stroke="${p.line}" stroke-width="2.6"/>`;
      let top = glyph(el, 100, 34, .6, 0, .9);
      if (F.has("mushroom")) top = `<path d="M62 44 C62 10 138 10 138 44 C120 50 80 50 62 44Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2.4"/>` + [[78, 30], [100, 22], [120, 32], [92, 38]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="#fff" opacity=".85"/>`).join("");
      if (F.has("tree")) top = `<path d="M100 40 V20" stroke="#6a4a22" stroke-width="6"/><g stroke="${p.line}" stroke-width="2">` + [[100, 12, 20], [80, 22, 15], [120, 22, 15], [70, 36, 10], [130, 36, 10]].map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${p.light}"/>`).join("") + `</g>`;
      let chest = `<path d="M100 82 L110 94 L100 108 L90 94Z" fill="${p.light}" stroke="${p.line}" stroke-width="1.8" filter="url(#glow)"/>`;
      if (F.has("clock")) chest = `<circle cx="100" cy="94" r="16" fill="${p.light}" stroke="${p.line}" stroke-width="2.2"/><path d="M100 94 V82 M100 94 L110 98" stroke="${p.line}" stroke-width="2.4" stroke-linecap="round"/>` + Array.from({ length: 12 }, (_, i) => `<circle cx="${f(100 + Math.cos(i * .5236) * 13)}" cy="${f(94 + Math.sin(i * .5236) * 13)}" r=".9" fill="${p.line}"/>`).join("");
      if (F.has("nebula")) chest = `<circle cx="100" cy="94" r="18" fill="#1b1840" stroke="${p.line}" stroke-width="2"/>` + Array.from({ length: 7 }, () => `<circle cx="${f(100 + (r() - .5) * 26)}" cy="${f(94 + (r() - .5) * 26)}" r="${f(.8 + r() * 1.6)}" fill="#fff"/>`).join("") + `<circle cx="100" cy="94" r="5" fill="#ffd27a" filter="url(#glow)"/>`;
      const crystals = F.has("crystals") ? [[56, 66, -20], [66, 60, -5], [140, 64, 20], [132, 58, 5], [76, 70, -10]].map(([x, y, a]) => `<path d="M${x - 4} ${y + 6} L${x} ${y - 16} L${x + 4} ${y + 6}Z" fill="${p.light}" stroke="${p.line}" stroke-width="1.4" transform="rotate(${a} ${x} ${y})" opacity=".95"/>`).join("") : glyph(el, 52, 68, .8, -20) + glyph(el, 148, 66, .8, 20);
      const sx = F.has("tall") ? 1 : 1.0;
      return shadowE(100, 144, 56) +
        `<rect x="74" y="116" width="22" height="26" rx="${fur ? 10 : 6}" fill="${fur ? "#d8e8f4" : p.bodyDark}" stroke="${p.line}" stroke-width="2.4"/><rect x="104" y="116" width="22" height="26" rx="${fur ? 10 : 6}" fill="${fur ? "#d8e8f4" : p.bodyDark}" stroke="${p.line}" stroke-width="2.4"/>` +
        `<rect x="40" y="72" width="24" height="${fur ? 60 : 54}" rx="11" fill="${body}" stroke="${p.line}" stroke-width="2.4"/><rect x="136" y="72" width="24" height="${fur ? 60 : 54}" rx="11" fill="${body}" stroke="${p.line}" stroke-width="2.4"/>` +
        `<rect x="62" y="64" width="76" height="60" rx="${fur ? 28 : 16}" fill="${body}" stroke="${p.line}" stroke-width="2.6"/>` +
        (fur ? `<path d="M70 72 l6 6 M80 70 l6 6 M118 70 l6 6 M126 74 l6 6 M44 90 l6 4 M144 90 l6 4" stroke="#b8cfe0" stroke-width="2" stroke-linecap="round"/><ellipse cx="100" cy="98" rx="20" ry="18" fill="${p.main}" opacity=".5"/>` : `<path d="M72 80 L80 92 L76 104 M126 78 L118 90 L124 108" stroke="${p.line}" stroke-width="1.6" fill="none" opacity=".6"/>` + chest) +
        top + head +
        (fur ? eye(93, 52, 4.5, { iris: p.iris, line: p.line }) + eye(108, 52, 4.5, { iris: p.iris, line: p.line }) + `<path d="M92 62 Q100 66 108 62" stroke="${p.line}" stroke-width="2" fill="none"/><path d="M94 62 l2 4 l2 -4 M104 62 l2 4 l2 -4" fill="#fff" stroke="${p.line}" stroke-width=".8"/>`
             : eye(93, 52, 4.2, { glow: p.light }) + eye(108, 52, 4.2, { glow: p.light })) + crystals;
    },
    sprite(p, r, el, F) {
      return `<circle cx="100" cy="92" r="46" fill="url(#aura)"/>` + shadowE(100, 146, 22) +
        `<g opacity=".7" stroke="${p.light}" stroke-width="1.2"><ellipse cx="72" cy="80" rx="26" ry="12" transform="rotate(-25 72 80)" fill="${p.light}" fill-opacity=".35"/><ellipse cx="128" cy="80" rx="26" ry="12" transform="rotate(25 128 80)" fill="${p.light}" fill-opacity=".35"/><ellipse cx="78" cy="104" rx="18" ry="8" transform="rotate(25 78 104)" fill="${p.light}" fill-opacity=".3"/><ellipse cx="122" cy="104" rx="18" ry="8" transform="rotate(-25 122 104)" fill="${p.light}" fill-opacity=".3"/></g>` +
        `<path d="M100 84 C118 96 116 124 100 138 C84 124 82 96 100 84Z" fill="url(#body)" stroke="${p.line}" stroke-width="2.4"/>` +
        `<path d="M90 98 L78 110 M110 98 L122 110" stroke="${p.line}" stroke-width="2.6" stroke-linecap="round"/>` +
        glyph(el, 100, 50, 1.3, 0) +
        `<circle cx="100" cy="72" r="18" fill="url(#body)" stroke="${p.line}" stroke-width="2.4"/>` +
        eye(93, 72, 5.5, { iris: p.iris, line: p.line }) + eye(107, 72, 5.5, { iris: p.iris, line: p.line }) +
        `<path d="M96 81 Q100 84 104 81" stroke="${p.line}" stroke-width="1.6" fill="none"/>` +
        (F.has("cloak") ? `<path d="M100 46 C76 50 72 80 70 140 C84 132 92 142 100 134 C108 142 116 132 130 140 C128 80 124 50 100 46Z" fill="#1a0d2e" stroke="${p.line}" stroke-width="2.2" opacity=".95"/><ellipse cx="100" cy="76" rx="14" ry="16" fill="#05020c"/>` + eye(94, 76, 3.6, { glow: p.light }) + eye(106, 76, 3.6, { glow: p.light }) : "") +
        (F.has("rays") ? `<g transform="translate(100 72)" opacity=".85">` + Array.from({ length: 10 }, (_, i) => `<path d="M0 -22 L3 -34 L-3 -34Z" fill="#ffe27a" transform="rotate(${i * 36})"/>`).join("") + `</g>` : "") +
        Array.from({ length: 5 }, () => glyph("celestial", 50 + r() * 100, 40 + r() * 90, .25 + r() * .2, 0, .8)).join("");
    },
    fish(p, r, el, F) {
      return shadowE(100, 144, 40) +
        `<path d="M138 100 L174 74 L166 100 L174 126Z" fill="${p.bodyDark}" stroke="${p.line}" stroke-width="2.4" stroke-linejoin="round"/>` +
        `<path d="M86 76 C96 52 122 54 130 78Z" fill="${p.horn}" stroke="${p.line}" stroke-width="2.2"/>` +
        `<ellipse cx="102" cy="100" rx="42" ry="29" fill="url(#body)" stroke="${p.line}" stroke-width="2.6"/>` +
        `<path d="M76 112 C90 126 118 128 134 112 C118 118 92 118 76 112Z" fill="url(#belly)"/>` +
        Array.from({ length: 6 }, (_, i) => `<path d="M${104 + (i % 3) * 10} ${90 + Math.floor(i / 3) * 12} q5 5 0 10" stroke="${p.line}" stroke-width="1.2" fill="none" opacity=".4"/>`).join("") +
        `<path d="M100 108 L118 122 L104 120Z" fill="${p.horn}" stroke="${p.line}" stroke-width="1.8"/>` +
        eye(80, 94, 10, { iris: p.iris, line: p.line }) +
        `<path d="M62 106 Q68 110 72 106" stroke="${p.line}" stroke-width="2" fill="none"/>` +
        glyph(el, 108, 52, .7, 0) + glyph(el, 160, 100, .5, 90, .8) +
        (F.has("tusk") ? `<path d="M64 92 L14 70 L64 98Z" fill="#fffbe8" stroke="${p.line}" stroke-width="1.6"/><path d="M54 90 l-4 4 M44 85 l-4 4 M34 81 l-3 4" stroke="${p.line}" stroke-width="1"/>` : "") +
        (F.has("puffy") ? Array.from({ length: 8 }, (_, i) => { const a = -1.2 + i * .34; return `<path d="M${f(102 + Math.cos(a) * 40)} ${f(100 + Math.sin(a) * 27)} l${f(Math.cos(a) * 8)} ${f(Math.sin(a) * 8)}" stroke="${p.line}" stroke-width="2.2" stroke-linecap="round"/>`; }).join("") : "");
    },
    bug(p, r, el, F) {
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
      const t = Array.from({ length: 5 }, (_, i) => { const x = 72 + i * 14; return `<path d="M${x} 102 C${x - 6} 116 ${x + 6} 124 ${x} 136 C${x - 4} 142 ${x + 2} 146 ${x} 152" stroke="${p.bodyLight}" stroke-width="${i % 2 ? 4 : 5.5}" fill="none" stroke-linecap="round" opacity=".85"/>`; }).join("");
      return `<circle cx="100" cy="86" r="50" fill="url(#aura)"/>` + t +
        `<path d="M58 100 C58 54 142 54 142 100 C132 108 122 98 112 106 C102 98 92 108 82 100 C74 108 66 100 58 100Z" fill="url(#body)" stroke="${p.line}" stroke-width="2.6" opacity=".95"/>` +
        `<ellipse cx="88" cy="70" rx="12" ry="7" fill="#fff" opacity=".35"/>` +
        pattern(p, r, 100, 80, 30) +
        eye(88, 86, 7, { iris: p.iris, line: p.line }) + eye(112, 86, 7, { iris: p.iris, line: p.line }) +
        `<path d="M95 96 Q100 99 105 96" stroke="${p.line}" stroke-width="1.6" fill="none"/>` +
        glyph(el, 100, 54, .8, 0);
    }
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

  /* ---------- assembly ---------- */
  function palette(cr) {
    const el = E[cr.element], r = rng(cr.id * 7 + 3);
    const dh = cr.id <= 10 ? 0 : (r() - .5) * 36, dl = (r() - .5) * 10;
    return {
      ...el,
      body: shift(el.main, dh, 0, dl), bodyLight: shift(el.light, dh, 0, 0), bodyDark: shift(el.main, dh, 0, dl - 22),
      belly: shift(el.light, dh * .5, -10, 6), line: shift(el.dark, dh, -10, -12),
      horn: shift(el.light, dh + 30, -20, -6), iris: shift(el.main, dh + 180, 0, -18)
    };
  }
  const cache = new Map();
  function inner(cr, p) {
    const r = rng(cr.id), F = new Set(cr.feat || []);
    if (HAND[cr.id]) return HAND[cr.id](p);
    const sc = { common: .84, uncommon: .92, rare: 1, epic: 1.05, mythic: 1.08 }[cr.rarity];
    return `<g transform="translate(100 144) scale(${sc}) translate(-100 -144)">${(FORMS[cr.form] || FORMS.blob)(p, r, cr.element, F)}</g>`;
  }
  function svg(cr) {
    const p = palette(cr);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 160">${defs(p)}${scene(cr.element, p, rng(cr.id * 13))}${aura(cr.rarity, p)}${inner(cr, p)}</svg>`;
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
  window.Art = { svg, uri, silUri, silhouette, icon };
})();
