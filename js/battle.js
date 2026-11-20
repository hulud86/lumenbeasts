/* =========================================================
   LUMEN BEASTS — battles
   Engine (rules, damage, abilities, items, allies, AI) and the
   Battle tab UI (isle map, team prep, fight screen, results).
   ========================================================= */
window.Battle = (function () {
  const C = window.CONFIG, ALL = window.CREATURES, SUP = window.SUPPORT;
  const byId = Object.fromEntries(ALL.map(c => [c.id, c]));

  /* ---------------- rules ---------------- */
  const STRONG = {
    fire: ["nature", "ice"], ice: ["wind", "nature"], nature: ["water", "earth"], water: ["fire", "earth"],
    earth: ["electric", "fire"], electric: ["water", "wind"], wind: ["electric", "shadow"],
    shadow: ["celestial", "arcane"], celestial: ["shadow", "arcane"], arcane: ["celestial", "ice"]
  };
  const elMult = (a, d) => !a || !d ? 1 : STRONG[a].includes(d) ? 1.5 : STRONG[d].includes(a) ? 0.67 : 1;
  const HP_BONUS = { common: 0, uncommon: 10, rare: 22, epic: 38, mythic: 55 };
  const ABILITY_CD = 3;
  const rnd = () => Math.random();

  function makeFighter(cr, mult = 1, ally = null, lv = 1) {
    let atkP = 0, defP = 0, hpP = 0;
    if (ally && (!ally.passive.el || ally.passive.el === cr.element)) { atkP = ally.passive.atk || 0; defP = ally.passive.def || 0; hpP = ally.passive.hp || 0; }
    const maxHp = Math.round((62 + cr.def * 1.05 + HP_BONUS[cr.rarity]) * mult * (1 + hpP / 100));
    return { cr, lv, name: cr.name, el: cr.element, maxHp, hp: maxHp, atk: cr.atk * mult * (1 + atkP / 100), def: cr.def * mult * (1 + defP / 100),
      atkMul: 1, defMul: 1, cd: 0, burn: 0, weak: 0, shield: 0, dodge: false, crit: false, skip: null, fainted: false };
  }

  // returns {dmg, mult, crit, missed}
  function hit(A, D, power, o = {}) {
    if (D.dodge) { D.dodge = false; return { dmg: 0, missed: true, mult: 1 }; }
    const m = o.flat ? elMult(o.el, D.el) : elMult(A.el, D.el);
    const crit = (o.flat ? false : A.crit) || (!o.flat && rnd() < .06);
    if (!o.flat) A.crit = false;
    let dmg;
    if (o.flat) dmg = power * m;
    else {
      const atk = A.atk * A.atkMul * (A.weak > 0 ? .75 : 1) * power;
      const def = o.pierce ? 0 : D.def * D.defMul;
      dmg = atk * (100 / (100 + def)) * .85 * m * (0.9 + rnd() * .2) * (crit ? 1.5 : 1) + 2;
    }
    if (D.shield > 0) { dmg *= .5; D.shield--; }
    dmg = Math.max(1, Math.round(dmg));
    D.hp = Math.max(0, D.hp - dmg); if (D.hp === 0) D.fainted = true;
    return { dmg, mult: m, crit, missed: false };
  }
  const heal = (F, pct) => { const before = F.hp; F.hp = Math.min(F.maxHp, F.hp + Math.round(F.maxHp * pct / 100)); return F.hp - before; };

  // Ability effects. Each returns a list of events for the UI.
  function useAbility(A, D) {
    const fx = A.cr.ability.fx, ev = [{ t: "ability", who: A, name: A.cr.ability.name }];
    const strike = (pw, o) => { const r = hit(A, D, pw, o); ev.push({ t: "hit", from: A, to: D, ...r }); return r; };
    switch (fx) {
      case "power": strike(1.8); break;
      case "burn": { const r = strike(1); if (!r.missed && !D.fainted) { D.burn = 3; ev.push({ t: "status", to: D, text: "Burned!" }); } break; }
      case "buff": A.atkMul = Math.min(2.2, A.atkMul * 1.3); ev.push({ t: "status", to: A, text: "Attack up!" }); break;
      case "heal": ev.push({ t: "heal", to: A, amount: heal(A, 35) }); break;
      case "shield": A.shield = 2; ev.push({ t: "status", to: A, text: "Shielded!" }); break;
      case "drain": { const r = strike(1); if (r.dmg) ev.push({ t: "heal", to: A, amount: heal(A, r.dmg / A.maxHp * 50) }); break; }
      case "weaken": { const r = strike(.9); if (!r.missed && !D.fainted) { D.weak = 3; ev.push({ t: "status", to: D, text: "Attack down!" }); } break; }
      case "stun": { const r = strike(1); if (!r.missed && !D.fainted && rnd() < .5) { D.skip = "stunned"; ev.push({ t: "status", to: D, text: "Stunned!" }); } break; }
      case "freeze": { const r = strike(1); if (!r.missed && !D.fainted && rnd() < .5) { D.skip = "frozen"; ev.push({ t: "status", to: D, text: "Frozen!" }); } break; }
      case "double": { strike(.75); if (!D.fainted) strike(.75); break; }
      case "dodge": { strike(1); A.dodge = true; ev.push({ t: "status", to: A, text: "Evasive!" }); break; }
      case "pierce": strike(1.1, { pierce: true }); break;
      default: strike(1.3);
    }
    A.cd = ABILITY_CD;
    return ev;
  }
  function attack(A, D) { const r = hit(A, D, 1); return [{ t: "attack", who: A }, { t: "hit", from: A, to: D, ...r }]; }

  function useItem(item, side, foe, targetIdx) {
    const A = side.team[side.active], ev = [{ t: "item", name: item.name, who: A }];
    switch (item.fx) {
      case "heal": ev.push({ t: "heal", to: A, amount: heal(A, item.value) }); break;
      case "fullheal": A.burn = 0; A.weak = 0; A.skip = null; ev.push({ t: "heal", to: A, amount: heal(A, 100) }); break;
      case "cleanse": A.burn = 0; A.weak = 0; A.skip = null; ev.push({ t: "heal", to: A, amount: heal(A, item.value) }, { t: "status", to: A, text: "Cured!" }); break;
      case "damage": { const D = foe.team[foe.active]; const r = hit(A, D, item.value, { flat: true, el: item.element }); ev.push({ t: "hit", from: A, to: D, ...r }); break; }
      case "freeze": { const D = foe.team[foe.active]; const r = hit(A, D, item.value, { flat: true, el: item.element }); ev.push({ t: "hit", from: A, to: D, ...r }); if (!r.missed && !D.fainted && rnd() < .5) { D.skip = "frozen"; ev.push({ t: "status", to: D, text: "Frozen!" }); } break; }
      case "crit": A.crit = true; ev.push({ t: "status", to: A, text: "Lucky!" }); break;
      case "dodge": A.dodge = true; ev.push({ t: "status", to: A, text: "Hidden in smoke!" }); break;
      case "recharge": A.cd = 0; ev.push({ t: "status", to: A, text: "Ability ready!" }); break;
      case "def": A.defMul *= 1 + item.value / 100; ev.push({ t: "status", to: A, text: "Defense up!" }); break;
      case "atk": A.atkMul = Math.min(2.4, A.atkMul * (1 + item.value / 100)); ev.push({ t: "status", to: A, text: "Attack up!" }); break;
      case "revive": { const T = side.team[targetIdx]; T.fainted = false; T.hp = Math.round(T.maxHp * item.value / 100); T.burn = 0; T.skip = null; ev.push({ t: "revive", to: T }); break; }
    }
    return ev;
  }
  function useCommand(ally, side) {
    const A = side.team[side.active], c = ally.command, ev = [{ t: "command", name: c.name, ally }];
    switch (c.fx) {
      case "heal": if (c.value >= 50) { A.burn = 0; A.weak = 0; A.skip = null; } ev.push({ t: "heal", to: A, amount: heal(A, c.value) }); break;
      case "shield": A.shield = c.value || 2; ev.push({ t: "status", to: A, text: "Shielded!" }); break;
      case "recharge": A.cd = 0; ev.push({ t: "status", to: A, text: "Ability ready!" }); break;
      case "dodge": A.dodge = true; ev.push({ t: "status", to: A, text: "Evasive!" }); break;
      case "crit": A.crit = true; ev.push({ t: "status", to: A, text: "Critical next!" }); break;
      case "rally": A.atkMul = Math.min(2.4, A.atkMul * (1 + c.value / 100)); A.defMul *= 1 + c.value / 100; ev.push({ t: "status", to: A, text: "Rallied!" }); break;
    }
    return ev;
  }
  function endRound(sides) {
    const ev = [];
    for (const s of sides) {
      const F = s.team[s.active]; if (!F || F.fainted) continue;
      if (F.burn > 0) { const d = Math.max(1, Math.round(F.maxHp * .07)); F.hp = Math.max(0, F.hp - d); F.burn--; if (F.hp === 0) F.fainted = true; ev.push({ t: "burn", to: F, dmg: d }); }
      if (F.weak > 0) F.weak--;
      if (F.cd > 0) F.cd--;
    }
    return ev;
  }
  // Enemy AI chooses an action
  function aiChoose(side, foe, st) {
    const A = side.team[side.active], D = foe.team[foe.active], fx = A.cr.ability.fx;
    if (side.items.length && A.hp / A.maxHp < .35 && !st.enemyItemUsed) return { type: "item" };
    if (A.cd === 0) {
      if (fx === "heal") { if (A.hp / A.maxHp < .55) return { type: "ability" }; }
      else if (["shield", "dodge", "buff"].includes(fx)) { if (rnd() < .5) return { type: "ability" }; }
      else if (rnd() < .75) return { type: "ability" };
    }
    // swap out of a bad matchup sometimes
    if (elMult(D.el, A.el) > 1 && rnd() < .25) { const alt = side.team.findIndex((f, i) => i !== side.active && !f.fainted && elMult(D.el, f.el) <= 1); if (alt >= 0) return { type: "swap", to: alt }; }
    return { type: "attack" };
  }

  /* ---------------- story mode ---------------- */
  const ISLES = [
    { el: "nature", leader: "A01", guardian: 37, names: ["Sprout-keeper Fen", "Wanderer Juno", "Herbalist Moss", "Beekeeper Hale", "Thorn Warden Isa"] },
    { el: "water", leader: "A02", guardian: 28, names: ["Deckhand Ollie", "Pearl Diver Nami", "Net Mender Cal", "Tide Reader Suri", "Harbor Guard Bram"] },
    { el: "fire", leader: "A03", guardian: 19, names: ["Ash Scout Ren", "Coal Runner Tess", "Bellows Boy Kip", "Ember Dancer Lia", "Forge Guard Holt"] },
    { el: "wind", leader: "A09", guardian: 120, names: ["Kite Kid Bo", "Cloud Herder Ila", "Glider Pilot Rafe", "Wind Caller Yara", "Sky Ranger Teo"] },
    { el: "earth", leader: "A08", guardian: 8, names: ["Tunnel Rat Dex", "Geode Hunter Pia", "Quarry Hand Gus", "Fossil Seeker Rhea", "Deep Delver Brom"] },
    { el: "electric", leader: "A04", guardian: 46, names: ["Wire Tinker Max", "Storm Watcher Vel", "Spark Courier Zed", "Coil Smith Nova", "Thunder Monk Arlo"] },
    { el: "ice", leader: "A07", guardian: 119, names: ["Snow Scout Lumi", "Ice Fisher Odd", "Sled Driver Kaia", "Frost Sculptor Eir", "Glacier Guard Rune"] },
    { el: "shadow", leader: "A05", guardian: 73, names: ["Lamplighter Wren", "Grave Sitter Mort", "Mask Maker Vesper", "Night Courier Silas", "Crypt Keeper Hollis"] },
    { el: "celestial", leader: "A06", guardian: 55, names: ["Star Counter Ada", "Comet Chaser Sol", "Moon Weaver Lyra", "Sun Priest Orin", "Astral Knight Celeste"] },
    { el: "arcane", leader: "A10", guardian: 10, names: ["Rune Scribe Ivo", "Glyph Weaver Nell", "Potion Taster Bix", "Mirror Mage Sera", "Archmage Talon"] }
  ];
  // Each isle: 5 trainers, then the Isle Leader, then the Isle Guardian.
  const STAGES = 7, LEADER = 5, BOSS = 6;
  const SUFFIX = ["0", "1", "t2", "t3", "t4", "L", "G"]; // keys stay compatible with older 4-stage saves
  const keyOf = (isle, stage) => `${ISLES[isle].el}-${SUFFIX[stage]}`;
  function seeded(seed) { let a = seed * 9301 + 49297; return () => { a = (a * 9301 + 49297) % 233280; return a / 233280; }; }
  function stageInfo(isle, stage) {
    const I = ISLES[isle], d = isle * STAGES + stage, r = seeded(isle * 31 + stage * 7 + 3);
    const boss = stage === BOSS, leaderStage = stage === LEADER;
    const mult = +((1.02 + isle * 0.01) * (1 + Math.min(stage, LEADER) * 0.055)).toFixed(3); // ramps up within each isle
    const maxRar = isle < 1 ? ["common", "uncommon", "uncommon"] : isle < 4 ? ["common", "uncommon", "uncommon", "rare"] : isle < 7 ? ["uncommon", "uncommon", "rare", "epic"] : ["uncommon", "rare", "rare", "epic"];
    const pick = (pred) => { const pool = ALL.filter(pred); return pool[Math.floor(r() * pool.length)]; };
    const size = boss ? (isle < 5 ? 2 : 3) : stage === 0 ? 2 : 3, team = [];
    const bump = boss || leaderStage ? .7 : stage >= 2 ? .35 : 0;
    const used = new Set([I.guardian]);
    for (let i = 0; i < size; i++) {
      const rar = maxRar[Math.min(maxRar.length - 1, Math.floor(r() * maxRar.length + bump))];
      let c = pick(x => x.rarity === rar && !used.has(x.id) && (r() < .7 ? x.element === I.el : true)) || pick(x => x.rarity === rar && !used.has(x.id));
      used.add(c.id); team.push(c.id);
    }
    if (boss) team.push(I.guardian);
    const leader = SUP.byId[I.leader];
    const name = stage < LEADER ? I.names[stage] : leaderStage ? `${leader.role} ${leader.name}` : `${byId[I.guardian].name}${byId[I.guardian].title ? ", " + byId[I.guardian].title : ""}`;
    return { key: keyOf(isle, stage), isle, stage, d, mult: boss ? +(mult * (isle < 5 ? .84 : .8)).toFixed(3) : mult, team, name, ally: stage >= LEADER ? I.leader : null,
      items: d >= 14 ? ["I01"] : [], boss, leaderStage,
      reward: { dust: 12 + Math.round(d * 2.4) + (boss ? 100 : leaderStage ? 30 : 0), packs: boss ? 2 : leaderStage ? 1 : 0 } };
  }
  const isleOpen = (S, isle) => isle === 0 || !!S.battle.cleared[keyOf(isle - 1, BOSS)];
  const stageOpen = (S, isle, stage) => isleOpen(S, isle) && (stage === 0 || !!S.battle.cleared[keyOf(isle, stage - 1)]);

  function newBattle(info, playerTeamIds, allyId, itemIds, levels) {
    const lvOf = id => (levels && levels[id]) || 1, lvMult = id => 1 + C.leveling.perLevel * (lvOf(id) - 1);
    const ally = allyId ? SUP.byId[allyId] : null, eAlly = info.ally ? SUP.byId[info.ally] : null;
    return {
      info, round: 1, over: null, enemyItemUsed: false, commandUsed: false,
      p: { team: playerTeamIds.map(id => makeFighter(byId[id], lvMult(id), ally, lvOf(id))), active: 0, ally, items: itemIds.map(id => SUP.byId[id]), used: {} },
      e: { team: info.team.map(id => makeFighter(byId[id], info.mult, eAlly)), active: 0, ally: eAlly, items: info.items.map(id => SUP.byId[id]) }
    };
  }

  // Quick automated battle for balance testing: player always attacks/uses ability
  function autoBattle(info, teamIds) {
    const B = newBattle(info, teamIds, null, []);
    for (let turn = 0; turn < 200; turn++) {
      const P = B.p.team[B.p.active], E = B.e.team[B.e.active];
      if (P.skip) P.skip = null; else (P.cd === 0 ? useAbility(P, E) : attack(P, E));
      if (E.fainted) { const n = B.e.team.findIndex(f => !f.fainted); if (n < 0) return true; B.e.active = n; continue; }
      if (E.skip) E.skip = null; else { const a = aiChoose(B.e, B.p, B); if (a.type === "ability") useAbility(E, P); else attack(E, P); }
      endRound([B.p, B.e]);
      if (B.p.team[B.p.active].fainted) { const n = B.p.team.findIndex(f => !f.fainted); if (n < 0) return false; B.p.active = n; }
      if (B.e.team[B.e.active].fainted) { const n = B.e.team.findIndex(f => !f.fainted); if (n < 0) return true; B.e.active = n; }
    }
    return false;
  }

  return { STRONG, elMult, ISLES, STAGES, LEADER, BOSS, stageInfo, isleOpen, stageOpen, keyOf, newBattle, makeFighter, hit, attack, useAbility, useItem, useCommand, endRound, aiChoose, autoBattle };
})();

/* =========================================================
   Battle tab UI
   ========================================================= */
window.BattleUI = (function () {
  const B = window.Battle, C = window.CONFIG, SUP = window.SUPPORT, ALL = window.CREATURES;
  const byId = Object.fromEntries(ALL.map(c => [c.id, c]));
  const U = () => window.UI, G = () => window.Game, Art = () => window.Art;
  const esc = s => String(s).replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const EL = C.elements, RAR = C.rarities;
  const ui = { screen: "map", isle: 0, stage: 0, prep: null, fight: null, busy: false, result: null, prepFilter: "all" };

  const stagesArr = () => Array.from({ length: B.STAGES }, (_, i) => i);
  const icon = (el, s = 16) => el ? Art().icon(el, s) : "✦";
  const mPhrase = m => m > 1 ? "Strong matchup!" : m < 1 ? "Weak matchup…" : "";

  /* ---------- not enough creatures ---------- */
  const TEAM_MIN = 3;
  const ownedCount = () => Object.keys(G().state.owned).length;
  const canBattle = () => ownedCount() >= TEAM_MIN;
  function needNotice() {
    if (canBattle()) return "";
    const n = ownedCount(), left = TEAM_MIN - n, packs = G().packsAvailable();
    return `<div class="need-team panel" role="status"><div class="need-ico">⚔</div><div class="need-body"><b>You can't battle yet</b><span>You need at least ${TEAM_MIN} different creatures to form a team. You have ${n}, so ${left === 1 ? "1 more" : left + " more"} to go. Open Shard Packs to find them.</span></div><a class="btn btn-gold btn-sm" href="#packs">${packs ? `Open packs (${packs} ready)` : "Go to packs"}</a></div>`;
  }

  /* ---------- winning tips ---------- */
  const counters = el => Object.keys(B.STRONG).filter(k => B.STRONG[k].includes(el));   // elements that beat el
  const beatenBy = el => B.STRONG[el];                                                  // elements el beats
  const elList = els => els.map(x => `${icon(x, 14)} ${EL[x].label}`).join(" and ");
  function levelable() { const S = G().state; return Object.keys(S.owned).map(Number).filter(id => G().canLevel(id)); }
  function bestCounters(isle, n = 3) {
    const S = G().state, el = B.ISLES[isle].el, good = counters(el);
    return Object.keys(S.owned).map(Number).map(id => byId[id]).filter(c => good.includes(c.element))
      .sort((a, b) => score(b, { isle }) - score(a, { isle })).slice(0, n);
  }
  function goodAllies(isle) {
    const S = G().state, good = counters(B.ISLES[isle].el);
    return SUP.allies.filter(a => S.support[a.id] && (!a.passive.el || good.includes(a.passive.el)));
  }
  function isleTipsHTML(isle) {
    const el = B.ISLES[isle].el, picks = bestCounters(isle), lv = levelable(), allies = goodAllies(isle);
    const tip = (ico, title, body) => `<div class="tip"><span class="tip-ico">${ico}</span><div><b>${title}</b><span>${body}</span></div></div>`;
    const pickBody = picks.length
      ? `Your best counters: ${picks.map(c => `<span class="tip-mon" style="--rc:${RAR[c.rarity].color}"><img src="${Art().uri(c)}" alt="">${esc(c.name)}</span>`).join(" ")}`
      : `You don't own any yet. Look for ${elList(counters(el))} creatures in packs.`;
    return `<details class="tips panel" ${G().state.battle.wins < 6 ? "open" : ""}><summary>💡 Tips for winning here</summary><div class="tip-grid">
${tip("⚔", `Bring ${elList(counters(el))} creatures`, `They deal 1.5× damage to ${EL[el].label} enemies. Avoid ${elList(beatenBy(el))} creatures, which take extra damage here. ${pickBody}`)}
${tip("⬆", lv.length ? `${lv.length} creature${lv.length > 1 ? "s" : ""} can level up now` : "Level up your best creatures", lv.length ? `Each level adds 6% Attack and Defense. <a href="#collection">Open your collection</a> and tap a creature to level it.` : `Each level adds 6% Attack and Defense. Duplicate cards plus Shard Dust pay for it, so replay cleared battles for Dust.`)}
${tip("🤝", "Pick an Ally that fits your team", allies.length ? `Good choices here: ${allies.map(a => `<b>${esc(a.name)}</b> (${esc(passiveText(a))})`).join(", ")}. Allies only boost creatures of their element, unless they boost all creatures.` : `Allies only boost creatures of their own element, unless they boost all creatures. Match your Ally to your team.`)}
${tip("✨", "Save Abilities and Items for big moments", `Abilities recharge for 3 turns, so open with one and swap out of bad matchups. Use a Healing Draught before a creature faints, not after.`)}
</div></details>`;
  }
  function lossTipsHTML(R) {
    const out = [], el = B.ISLES[R.isle].el, team = R.team.map(id => byId[id]);
    const weak = team.filter(c => B.elMult(el, c.element) > 1), strong = team.filter(c => B.elMult(c.element, el) > 1);
    if (weak.length) out.push(`<b>${weak.map(c => esc(c.name)).join(", ")}</b> ${weak.length > 1 ? "were" : "was"} weak against ${EL[el].label}. Try ${elList(counters(el))} creatures instead.`);
    else if (!strong.length) out.push(`None of your team had an advantage. ${elList(counters(el))} creatures deal 1.5× damage here.`);
    const better = bestCounters(R.isle).filter(c => !R.team.includes(c.id));
    if (better.length) out.push(`You own ${better.map(c => `<b>${esc(c.name)}</b>`).join(", ")}, which ${better.length > 1 ? "counter" : "counters"} this isle.`);
    const lv = levelable();
    if (lv.length) out.push(`${lv.length} of your creatures can level up right now. <a href="#collection">Level them up</a> for +6% Attack and Defense per level.`);
    else out.push(`Replay battles you've already won to earn Shard Dust, then level up your favorites.`);
    if (!R.ally) out.push(`You went in without an Ally. Even a small boost helps.`);
    return `<div class="tips panel loss-tips"><h3>💡 How to win next time</h3><ul>${out.map(x => `<li>${x}</li>`).join("")}</ul></div>`;
  }

  /* ---------- map ---------- */
  function mapHTML() {
    const S = G().state;
    const tiles = B.ISLES.map((I, i) => {
      const open = B.isleOpen(S, i), done = stagesArr().filter(st => S.battle.cleared[B.keyOf(i, st)]).length, g = byId[I.guardian], e = EL[I.el];
      return `<button class="isle ${open ? "" : "locked"} ${done === B.STAGES ? "done" : ""}" data-b-isle="${i}" style="--el:${e.main};--el-dark:${e.dark}" ${open ? "" : "disabled"}>
<span class="isle-art"><img src="${Art().uri(g)}" alt="" class="${open ? "" : "sil"}"></span>
<span class="isle-body"><span class="isle-no">Isle ${i + 1}</span><span class="isle-name">${icon(I.el, 16)} ${esc(e.isle)}</span>
<span class="isle-prog">${stagesArr().map(st => `<i class="${S.battle.cleared[B.keyOf(i, st)] ? "on" : ""}"></i>`).join("")}<b>${open ? (done === B.STAGES ? "Conquered" : `${done}/${B.STAGES} cleared`) : "Locked"}</b></span></span></button>`;
    }).join("");
    return `<h1 class="h-display">Battle</h1><p class="sub">Journey across the ten isles of Vael. Beat each isle's trainers and leader, then challenge its guardian. Wins earn Shard Dust and packs.</p>
${needNotice()}<div class="battle-stats panel"><span><b>${S.battle.wins}</b> wins</span><span><b>${Object.keys(S.battle.cleared).filter(k => k.endsWith("-G")).length}</b>/10 guardians</span><button class="btn btn-ghost btn-sm" data-b-help>How battles work</button></div>
<div class="isle-grid">${tiles}</div>`;
  }
  function isleHTML() {
    const S = G().state, I = B.ISLES[ui.isle], e = EL[I.el];
    const rows = stagesArr().map(st => {
      const info = B.stageInfo(ui.isle, st), open = B.stageOpen(S, ui.isle, st), cleared = !!S.battle.cleared[info.key];
      const leader = info.ally ? SUP.byId[info.ally] : null;
      return `<div class="stage panel ${open ? "" : "locked"} ${info.boss ? "boss" : ""}" style="--el:${e.main}">
<div class="stage-face">${info.boss ? `<img src="${Art().uri(byId[I.guardian])}" alt="">` : leader ? `<img src="${Art().uri(leader)}" alt="">` : `<span class="stage-num">${st + 1}</span>`}</div>
<div class="stage-body"><div class="stage-kind">${info.boss ? "Isle Guardian" : info.leaderStage ? "Isle Leader" : "Trainer"}</div><h3>${esc(info.name)}</h3>
<div class="stage-team">${info.team.map(id => { const c = byId[id], seen = !!S.owned[id]; return `<span class="mini-mon" title="${seen ? esc(c.name) : "Unknown"}" style="--rc:${RAR[c.rarity].color}"><img src="${seen ? Art().uri(c) : Art().silUri(c)}" alt=""></span>`; }).join("")}<span class="stage-lvl">Power ×${info.mult.toFixed(2)}</span></div>
<div class="stage-reward">${cleared ? "✓ Cleared · replay for a little Shard Dust" : `First win: ${info.reward.dust} Shard Dust${info.reward.packs ? ` + ${info.reward.packs} pack${info.reward.packs > 1 ? "s" : ""}` : ""}`}</div></div>
<button class="btn ${open && canBattle() ? "btn-gold" : "btn-ghost"} btn-sm" data-b-stage="${st}" ${open && canBattle() ? "" : "disabled"} ${open && !canBattle() ? 'title="You need at least 3 creatures to battle"' : ""}>${open ? (cleared ? "Replay" : "Battle") : "Locked"}</button></div>`;
    }).join("");
    return `<button class="btn btn-ghost btn-sm" data-b-back="map">← All isles</button>${needNotice()}
<h1 class="h-display" style="margin-top:12px">${icon(I.el, 26)} ${esc(e.isle)}</h1><p class="sub">${e.label} creatures are strong against ${B.STRONG[I.el].map(x => EL[x].label).join(" and ")}, and weak to ${Object.keys(B.STRONG).filter(k => B.STRONG[k].includes(I.el)).map(x => EL[x].label).join(" and ")}. Bring creatures that beat ${e.label}.</p>
${isleTipsHTML(ui.isle)}<div class="stage-list">${rows}</div>`;
  }

  /* ---------- prep ---------- */
  function startPrep(stage) {
    const S = G().state, info = B.stageInfo(ui.isle, stage);
    const saved = S.battle.team || {};
    const ownedIds = Object.keys(S.owned).map(Number);
    let team = (saved.team || []).filter(id => S.owned[id]).slice(0, 3);
    if (team.length < 3) team = autoPick(info, ownedIds);
    const allies = SUP.allies.filter(a => S.support[a.id]).map(a => a.id);
    const items = SUP.items.filter(a => S.support[a.id]).map(a => a.id);
    ui.prep = { info, team, ally: allies.includes(saved.ally) ? saved.ally : allies[0] || null, items: (saved.items || []).filter(i => items.includes(i)).slice(0, 2) };
    if (!ui.prep.items.length) ui.prep.items = items.slice(0, 2);
    ui.screen = "prep"; ui.stage = stage;
  }
  function score(c, info) { const foeEl = B.ISLES[info.isle].el; return (c.atk + c.def) * G().levelMult(c.id) * (B.elMult(c.element, foeEl) > 1 ? 1.35 : B.elMult(foeEl, c.element) > 1 ? .8 : 1) + ({ common: 0, uncommon: 10, rare: 22, epic: 38, mythic: 55 })[c.rarity]; }
  function autoPick(info, ids) { return ids.map(id => byId[id]).sort((a, b) => score(b, info) - score(a, info)).slice(0, 3).map(c => c.id); }
  function prepHTML() {
    const S = G().state, P = ui.prep, info = P.info, foeEl = B.ISLES[info.isle].el;
    const owned = Object.keys(S.owned).map(Number).map(id => byId[id]).filter(c => ui.prepFilter === "all" || c.element === ui.prepFilter).sort((a, b) => score(b, info) - score(a, info));
    const slot = i => { const id = P.team[i]; if (!id) return `<div class="tslot empty">Pick a creature</div>`; const c = byId[id], m = B.elMult(c.element, foeEl);
      return `<button class="tslot" data-b-unpick="${id}" style="--rc:${RAR[c.rarity].color}"><img src="${Art().uri(c)}" alt=""><span class="tslot-n">${esc(c.name)}${G().levelOf(c.id) > 1 ? ` · Lv${G().levelOf(c.id)}` : ""}</span><span class="tslot-m ${m > 1 ? "good" : m < 1 ? "bad" : ""}">${icon(c.element, 13)} ${m > 1 ? "Strong" : m < 1 ? "Weak" : "Even"}</span></button>`; };
    const allyOpts = SUP.allies.filter(a => S.support[a.id]);
    const itemOpts = SUP.items.filter(a => S.support[a.id]);
    return `<button class="btn btn-ghost btn-sm" data-b-back="isle">← Back</button>
<h1 class="h-display" style="margin-top:12px">Prepare for battle</h1><p class="sub">Opponent: <b>${esc(info.name)}</b> · ${info.team.length} creatures · mostly ${EL[foeEl].label}. Pick 3 creatures, 1 Ally and up to 2 Items.</p>${needNotice()}
<div class="prep-grid">
 <div class="panel prep-team"><h3>Your team</h3><div class="tslots">${[0, 1, 2].map(slot).join("")}</div>
  <h3>Ally</h3><div class="sup-pick">${allyOpts.map(a => `<button class="sup-opt ${P.ally === a.id ? "on" : ""}" data-b-ally="${a.id}" title="${esc(a.command.text)}"><img src="${Art().uri(a)}" alt=""><span><b>${esc(a.name)}</b><small>${esc(passiveText(a))}</small></span></button>`).join("") || `<p class="locked-note">No Allies yet. Find them in packs.</p>`}</div>
  <h3>Items <small>(up to 2, never used up)</small></h3><div class="sup-pick">${itemOpts.map(x => `<button class="sup-opt ${P.items.includes(x.id) ? "on" : ""}" data-b-item="${x.id}" title="${esc(x.text)}"><img src="${Art().uri(x)}" alt=""><span><b>${esc(x.name)}</b><small>${esc(x.text)}</small></span></button>`).join("") || `<p class="locked-note">No Items yet.</p>`}</div>
  <div class="row-btns" style="margin-top:14px"><button class="btn btn-gold" data-b-go ${P.team.length === 3 ? "" : "disabled"}>Start battle</button><button class="btn btn-ghost btn-sm" data-b-auto>Auto-pick team</button></div>
 </div>
 <div class="panel prep-roster"><h3>Your creatures <small>sorted by strength against ${EL[foeEl].label}</small></h3>
  <div class="chips">${["all", ...Object.keys(EL)].map(k => `<button class="chip ${ui.prepFilter === k ? "on" : ""}" data-b-filter="${k}" style="--cc:${k === "all" ? "#7ef0ff" : EL[k].main}">${k === "all" ? "All" : icon(k, 13) + " " + EL[k].label}</button>`).join("")}</div>
  <div class="roster">${owned.map(c => { const m = B.elMult(c.element, foeEl), on = P.team.includes(c.id);
    return `<button class="rmon ${on ? "on" : ""}" data-b-pick="${c.id}" style="--rc:${RAR[c.rarity].color}"><img src="${Art().uri(c)}" alt=""><span class="rn">${esc(c.name)}${G().levelOf(c.id) > 1 ? ` <em class="lvtag">Lv${G().levelOf(c.id)}</em>` : ""}</span><span class="rs">⚔${Math.round(c.atk * G().levelMult(c.id))} 🛡${Math.round(c.def * G().levelMult(c.id))}</span>${m !== 1 ? `<span class="rm ${m > 1 ? "good" : "bad"}">${m > 1 ? "▲" : "▼"}</span>` : ""}</button>`; }).join("") || `<p class="locked-note">Open some packs first.</p>`}</div>
 </div>
</div>`;
  }
  const passiveText = a => { const p = a.passive, parts = []; if (p.atk) parts.push(`+${p.atk}% ATK`); if (p.def) parts.push(`+${p.def}% DEF`); if (p.hp) parts.push(`+${p.hp}% HP`); return `${p.el ? EL[p.el].label : "All"} creatures ${parts.join(", ")}`; };

  /* ---------- fight ---------- */
  function fighterHTML(F, side) {
    const pct = F.hp / F.maxHp * 100;
    const st = [F.burn ? `<span class="st burn">🔥 Burn</span>` : "", F.skip ? `<span class="st skip">${F.skip === "frozen" ? "❄ Frozen" : "⚡ Stunned"}</span>` : "", F.weak ? `<span class="st weak">▼ ATK</span>` : "", F.shield ? `<span class="st shield">🛡 ×${F.shield}</span>` : "", F.dodge ? `<span class="st dodge">💨 Evasive</span>` : "", F.atkMul > 1.01 ? `<span class="st up">▲ ATK</span>` : "", F.crit ? `<span class="st up">✦ Crit</span>` : ""].join("");
    return `<div class="fighter ${side}" id="f-${side}" style="--el:${EL[F.el].main};--rc:${RAR[F.cr.rarity].color}">
<div class="f-art"><img src="${Art().uri(F.cr)}" alt="${esc(F.name)}"></div>
<div class="f-info"><div class="f-name">${icon(F.el, 16)} ${esc(F.name)}${F.lv > 1 ? `<span class="f-lv">Lv ${F.lv}</span>` : ""}<span class="f-rar">${RAR[F.cr.rarity].label}</span></div>
<div class="hpbar"><i style="width:${pct}%;background:${pct > 50 ? "linear-gradient(90deg,#5fd08a,#9ff0b0)" : pct > 22 ? "linear-gradient(90deg,#ffc94a,#ffe08a)" : "linear-gradient(90deg,#ff5a5a,#ff9a8a)"}"></i></div>
<div class="f-hp">${F.hp} / ${F.maxHp} HP</div><div class="f-status">${st}</div></div></div>`;
  }
  function benchHTML(side, isPlayer) {
    return `<div class="bench">${side.team.map((f, i) => `<span class="bdot ${f.fainted ? "out" : ""} ${i === side.active ? "cur" : ""}" title="${esc(f.name)}"><img src="${Art().uri(f.cr)}" alt=""></span>`).join("")}</div>`;
  }
  function fightHTML() {
    const F = ui.fight, P = F.p.team[F.p.active], E = F.e.team[F.e.active];
    const ab = P.cr.ability, ready = P.cd === 0;
    const needSwap = P.fainted && !F.over;
    const eMult = B.elMult(P.el, E.el);
    return `<div class="arena">
<div class="arena-top"><div class="trainer"><span class="t-kind">${F.info.boss ? "Guardian" : F.info.leaderStage ? "Isle Leader" : "Trainer"}</span><b>${esc(F.info.name)}</b>${F.e.ally ? ` <small>with ${esc(F.e.ally.name)}</small>` : ""}</div>${benchHTML(F.e)}</div>
<div class="field" style="--pel:${EL[P.el].main};--eel:${EL[E.el].main}">
 ${fighterHTML(E, "enemy")}
 <div class="matchup ${eMult > 1 ? "good" : eMult < 1 ? "bad" : ""}">${icon(P.el, 14)} vs ${icon(E.el, 14)} ${mPhrase(eMult) || "Even matchup"}</div>
 ${fighterHTML(P, "player")}
</div>
<div class="arena-bottom">${benchHTML(F.p)}<span class="round">Round ${F.round}</span></div>
<div class="log" id="blog">${(F.log || []).slice(-4).map(l => `<div>${l}</div>`).join("")}</div>
${F.over ? "" : needSwap ? `<div class="actions"><div class="act-title">${esc(P.name)} fainted! Choose your next creature:</div>${F.p.team.map((f, i) => f.fainted ? "" : `<button class="btn btn-gold btn-sm" data-b-swapto="${i}">${icon(f.el, 14)} ${esc(f.name)} (${f.hp} HP)</button>`).join("")}</div>`
  : `<div class="actions ${ui.busy ? "busy" : ""}">
 <button class="act act-attack" data-b-act="attack"><b>Attack</b><small>Basic strike</small></button>
 <button class="act act-ability" data-b-act="ability" ${ready ? "" : "disabled"}><b>${esc(ab.name)}</b><small>${ready ? esc(ab.text) : `Recharging: ${P.cd} turn${P.cd > 1 ? "s" : ""}`}</small></button>
 ${F.p.items.map(it => `<button class="act act-item" data-b-useitem="${it.id}" ${F.p.used[it.id] ? "disabled" : ""}><img src="${Art().uri(it)}" alt=""><b>${esc(it.name)}</b><small>${F.p.used[it.id] ? "Used this battle" : esc(it.text)}</small></button>`).join("")}
 ${F.p.ally ? `<button class="act act-cmd" data-b-cmd ${F.commandUsed ? "disabled" : ""}><img src="${Art().uri(F.p.ally)}" alt=""><b>${esc(F.p.ally.command.name)}</b><small>${F.commandUsed ? "Used this battle" : esc(F.p.ally.command.text)}</small></button>` : ""}
 <button class="act act-swap" data-b-act="swapmenu" ${F.p.team.filter((f, i) => !f.fainted && i !== F.p.active).length ? "" : "disabled"}><b>Swap</b><small>Switch creatures (uses your turn)</small></button>
 <button class="act act-flee" data-b-flee><b>Retreat</b><small>Leave the battle</small></button>
</div>`}
${F.swapMenu ? `<div class="swapmenu panel"><b>Swap to:</b> ${F.p.team.map((f, i) => f.fainted || i === F.p.active ? "" : `<button class="btn btn-ghost btn-sm" data-b-swapto="${i}">${icon(f.el, 14)} ${esc(f.name)} (${f.hp}/${f.maxHp})</button>`).join("")} <button class="btn btn-ghost btn-sm" data-b-act="cancel">Cancel</button></div>` : ""}
${F.reviveMenu ? `<div class="swapmenu panel"><b>Revive:</b> ${F.p.team.map((f, i) => f.fainted ? `<button class="btn btn-gold btn-sm" data-b-revive="${i}">${esc(f.name)}</button>` : "").join("")} <button class="btn btn-ghost btn-sm" data-b-act="cancel">Cancel</button></div>` : ""}
</div>`;
  }
  function resultHTML() {
    const R = ui.result;
    return `<div class="result panel ${R.won ? "win" : "lose"}"><div class="result-title">${R.won ? "Victory!" : "Defeated"}</div>
<p>${R.won ? `You beat <b>${esc(R.name)}</b>.` : `<b>${esc(R.name)}</b> won this time. Try different creatures. Element matchups make a big difference.`}</p>
${R.won ? `<div class="summary-stats">${R.dust ? `<div class="rchip" style="--rc:#ffc94a"><div class="t">Shard Dust</div><div class="v">+${R.dust}</div></div>` : ""}${R.packs ? `<div class="rchip" style="--rc:#ff6fd0"><div class="t">Bonus packs</div><div class="v">+${R.packs}</div></div>` : ""}${R.first ? `<div class="rchip" style="--rc:#5fd08a"><div class="t">First clear</div><div class="v">✓</div></div>` : ""}</div>` : ""}
${R.newAch && R.newAch.length ? `<div class="notice" style="background:rgba(255,201,74,.1);border-color:rgba(255,201,74,.4);color:#ffe7a8">🏆 Unlocked: ${R.newAch.map(esc).join(", ")}. <a href="#achievements">Claim rewards</a></div>` : ""}
${R.won ? "" : lossTipsHTML(R)}<div class="summary-actions"><button class="btn btn-gold" data-b-back="isle">Continue</button><button class="btn btn-ghost" data-b-retry>${R.won ? "Battle again" : "Try again"}</button></div></div>`;
  }

  function view() {
    if (ui.screen === "isle") return isleHTML();
    if (ui.screen === "prep") return prepHTML();
    if (ui.screen === "fight") return fightHTML();
    if (ui.screen === "result") return resultHTML();
    return mapHTML();
  }
  const rerender = () => U().render(true);
  function drawFight() { const v = document.getElementById("view"); if (v) { v.innerHTML = fightHTML(); } }

  /* ---------- fight flow ---------- */
  function log(txt) { ui.fight.log = ui.fight.log || []; ui.fight.log.push(txt); }
  function floatNum(side, text, cls) {
    const el = document.querySelector(`#f-${side} .f-art`); if (!el) return;
    const n = document.createElement("div"); n.className = "dmgnum " + (cls || ""); n.textContent = text; el.appendChild(n); setTimeout(() => n.remove(), 1100);
  }
  const sideOf = F => ui.fight.p.team.includes(F) ? "player" : "enemy";
  async function play(events) {
    for (const ev of events) {
      const side = ev.to ? sideOf(ev.to) : ev.who ? sideOf(ev.who) : null;
      if (ev.t === "attack" || ev.t === "ability") {
        log(ev.t === "ability" ? `<b>${esc(ev.who.name)}</b> used <b>${esc(ev.name)}</b>!` : `<b>${esc(ev.who.name)}</b> attacks!`);
        drawFight(); const el = document.getElementById("f-" + sideOf(ev.who)); if (el) el.classList.add(ev.t === "ability" ? "casting" : "lunge");
        U().Sfx.play(ev.t === "ability" ? "rare" : "flip"); await sleep(380);
      } else if (ev.t === "item" || ev.t === "command") {
        log(ev.t === "item" ? `You used <b>${esc(ev.name)}</b>!` : `<b>${esc(ev.ally.name)}</b>: <b>${esc(ev.name)}</b>!`);
        drawFight(); U().Sfx.play("claim"); await sleep(420);
      } else if (ev.t === "hit") {
        const s = sideOf(ev.to);
        if (ev.missed) { log(`${esc(ev.to.name)} dodged it!`); drawFight(); floatNum(s, "Miss", "miss"); await sleep(500); continue; }
        log(`${esc(ev.to.name)} took <b>${ev.dmg}</b> damage${ev.crit ? " (critical!)" : ""}${ev.mult > 1 ? ". Strong matchup!" : ev.mult < 1 ? ". Weak matchup…" : "."}`);
        drawFight(); const el = document.getElementById("f-" + s); if (el) el.classList.add("hit");
        floatNum(s, "-" + ev.dmg, ev.crit || ev.mult > 1 ? "big" : "");
        if (ev.to.fainted) { await sleep(450); log(`<b>${esc(ev.to.name)}</b> fainted!`); drawFight(); const e2 = document.getElementById("f-" + s); if (e2) e2.classList.add("faint"); }
        await sleep(560);
      } else if (ev.t === "heal") { log(`${esc(ev.to.name)} recovered <b>${ev.amount}</b> HP.`); drawFight(); floatNum(side, "+" + ev.amount, "heal"); await sleep(520); }
      else if (ev.t === "status") { log(`${esc(ev.to.name)}: ${esc(ev.text)}`); drawFight(); floatNum(side, ev.text, "status"); await sleep(480); }
      else if (ev.t === "burn") { log(`${esc(ev.to.name)} is hurt by its burn (${ev.dmg}).`); drawFight(); floatNum(side, "-" + ev.dmg, "burn"); await sleep(450); }
      else if (ev.t === "revive") { log(`<b>${esc(ev.to.name)}</b> was revived!`); drawFight(); await sleep(450); }
      else if (ev.t === "text") { log(ev.text); drawFight(); await sleep(450); }
    }
  }
  function nextAlive(side) { return side.team.findIndex(f => !f.fainted); }
  async function afterPlayerAction(skipEnemy) {
    const F = ui.fight;
    // enemy fainted?
    if (F.e.team[F.e.active].fainted) {
      const n = nextAlive(F.e);
      if (n < 0) return finish(true);
      F.e.active = n; await play([{ t: "text", text: `${esc(F.info.name)} sends out <b>${esc(F.e.team[n].name)}</b>!` }]);
    } else if (!skipEnemy) {
      await enemyTurn();
      if (F.over) return;
    }
    const tick = B.endRound([F.p, F.e]); if (tick.length) await play(tick);
    if (F.e.team[F.e.active].fainted) { const n = nextAlive(F.e); if (n < 0) return finish(true); F.e.active = n; await play([{ t: "text", text: `${esc(F.info.name)} sends out <b>${esc(F.e.team[n].name)}</b>!` }]); }
    if (F.p.team[F.p.active].fainted && nextAlive(F.p) < 0) return finish(false);
    F.round++; ui.busy = false; drawFight();
  }
  async function enemyTurn() {
    const F = ui.fight, E = F.e.team[F.e.active], P = F.p.team[F.p.active];
    if (E.fainted || P.fainted) return;
    if (E.skip) { await play([{ t: "text", text: `${esc(E.name)} is ${E.skip} and can't move!` }]); E.skip = null; return; }
    const a = B.aiChoose(F.e, F.p, F);
    let ev;
    if (a.type === "ability") ev = B.useAbility(E, P);
    else if (a.type === "item") { F.enemyItemUsed = true; ev = B.useItem(F.e.items[0], F.e, F.p); ev[0].name = `${F.info.name.split(",")[0]} used ${F.e.items[0].name}`; ev[0] = { t: "text", text: `<b>${esc(F.info.name.split(",")[0])}</b> used <b>${esc(F.e.items[0].name)}</b>!` }; }
    else if (a.type === "swap") { F.e.active = a.to; ev = [{ t: "text", text: `${esc(F.info.name.split(",")[0])} swaps to <b>${esc(F.e.team[a.to].name)}</b>!` }]; }
    else ev = B.attack(E, P);
    await play(ev);
    if (P.fainted && nextAlive(F.p) < 0) finish(false);
  }
  function finish(won) {
    const F = ui.fight, S = G().state, info = F.info;
    F.over = won ? "won" : "lost";
    const before = G().unlockedIds();
    const first = won && !S.battle.cleared[info.key];
    let dust = 0, packs = 0;
    if (won) {
      S.battle.wins++;
      if (first) { S.battle.cleared[info.key] = Date.now(); dust = info.reward.dust; packs = info.reward.packs; }
      else dust = 5 + Math.round(info.d * 1.5);
      S.dust += dust; S.bonusPacks += packs;
    } else S.battle.losses++;
    G().save();
    const newAch = G().unlockedIds().filter(id => !before.includes(id)).map(id => G().ACH.find(a => a.id === id).name);
    ui.result = { won, name: info.name, dust, packs, first, newAch, isle: info.isle, team: F.p.team.map(f => f.cr.id), ally: F.p.ally ? F.p.ally.id : null };
    ui.busy = false;
    setTimeout(() => {
      if (won) { U().flash("rgba(255,201,74,.6)"); U().banner("Victory!", "#ffc94a"); U().Sfx.play("mythic"); }
      ui.screen = "result"; rerender();
    }, 700);
  }

  async function act(kind, arg) {
    const F = ui.fight; if (!F || F.over || ui.busy) return;
    const P = F.p.team[F.p.active], E = F.e.team[F.e.active];
    if (kind === "swapmenu") { F.swapMenu = true; drawFight(); return; }
    if (kind === "cancel") { F.swapMenu = false; F.reviveMenu = null; F.freeSwap = false; drawFight(); return; }
    ui.busy = true; F.swapMenu = false;
    // forced swap after faint (free action)
    if (kind === "swapto" && P.fainted) { F.p.active = arg; await play([{ t: "text", text: `Go, <b>${esc(F.p.team[arg].name)}</b>!` }]); ui.busy = false; drawFight(); return; }
    if (P.skip) { await play([{ t: "text", text: `${esc(P.name)} is ${P.skip} and can't move!` }]); P.skip = null; return afterPlayerAction(false); }
    let ev = [], skipEnemy = false;
    if (kind === "attack") ev = B.attack(P, E);
    else if (kind === "ability") ev = B.useAbility(P, E);
    else if (kind === "swapto") { F.p.active = arg; ev = [{ t: "text", text: `Come back, ${esc(P.name)}! Go, <b>${esc(F.p.team[arg].name)}</b>!` }]; }
    else if (kind === "item") {
      const it = SUP.byId[arg];
      if (it.fx === "revive") { if (!F.p.team.some(f => f.fainted)) { ui.busy = false; U().toast("!", "No fainted creature to revive"); return; } if (arg2 === null) { F.reviveMenu = true; ui.busy = false; drawFight(); return; } }
      F.p.used[arg] = true; ev = B.useItem(it, F.p, F.e, revTarget);
    } else if (kind === "cmd") {
      F.commandUsed = true;
      if (F.p.ally.command.fx === "freeswap") {
        const alt = F.p.team.findIndex((f, i) => !f.fainted && i !== F.p.active);
        if (alt >= 0) { F.swapMenu = true; F.freeSwap = true; await play([{ t: "command", name: F.p.ally.command.name, ally: F.p.ally }]); ui.busy = false; drawFight(); return; }
        ev = [{ t: "text", text: "No creature to swap to." }];
      } else ev = B.useCommand(F.p.ally, F.p);
    }
    await play(ev);
    if (kind === "swapto" && F.freeSwap) { F.freeSwap = false; ui.busy = false; drawFight(); return; }
    afterPlayerAction(skipEnemy);
  }
  let arg2 = null, revTarget = null;

  /* ---------- events ---------- */
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-b-isle],[data-b-back],[data-b-stage],[data-b-pick],[data-b-unpick],[data-b-ally],[data-b-item],[data-b-go],[data-b-auto],[data-b-filter],[data-b-act],[data-b-useitem],[data-b-cmd],[data-b-swapto],[data-b-revive],[data-b-retry],[data-b-flee],[data-b-help]");
    if (!t) return;
    const d = t.dataset, S = G().state;
    if (d.bIsle !== undefined) { ui.isle = +d.bIsle; ui.screen = "isle"; rerender(); return; }
    if (d.bBack !== undefined) { ui.screen = d.bBack; ui.fight = null; rerender(); return; }
    if (d.bStage !== undefined) { if (!canBattle()) { rerender(); return; } startPrep(+d.bStage); rerender(); return; }
    if (d.bPick !== undefined) { const id = +d.bPick, P = ui.prep; if (P.team.includes(id)) P.team = P.team.filter(x => x !== id); else if (P.team.length < 3) P.team.push(id); else { P.team[2] = id; } rerender(); return; }
    if (d.bUnpick !== undefined) { ui.prep.team = ui.prep.team.filter(x => x !== +d.bUnpick); rerender(); return; }
    if (d.bAlly !== undefined) { ui.prep.ally = ui.prep.ally === d.bAlly ? null : d.bAlly; rerender(); return; }
    if (d.bItem !== undefined) { const P = ui.prep; if (P.items.includes(d.bItem)) P.items = P.items.filter(x => x !== d.bItem); else { P.items.push(d.bItem); if (P.items.length > 2) P.items.shift(); } rerender(); return; }
    if (d.bFilter !== undefined) { ui.prepFilter = d.bFilter; rerender(); return; }
    if (d.bAuto !== undefined) { ui.prep.team = autoPick(ui.prep.info, Object.keys(S.owned).map(Number)); rerender(); return; }
    if (d.bGo !== undefined) {
      const P = ui.prep; if (P.team.length !== 3) return;
      S.battle.team = { team: P.team, ally: P.ally, items: P.items }; G().save();
      ui.fight = B.newBattle(P.info, P.team, P.ally, P.items, S.levels); ui.fight.log = [`${esc(P.info.name)} wants to battle!`];
      ui.screen = "fight"; ui.busy = false; rerender(); return;
    }
    if (d.bRetry !== undefined) { startPrep(ui.stage); rerender(); return; }
    if (d.bFlee !== undefined) { ui.fight = null; ui.screen = "isle"; rerender(); return; }
    if (d.bHelp !== undefined) { U().openModal(helpHTML(), "narrow"); return; }
    if (d.bAct !== undefined) { act(d.bAct); return; }
    if (d.bUseitem !== undefined) { arg2 = null; revTarget = null; const it = SUP.byId[d.bUseitem]; if (it.fx === "revive") { if (!ui.fight.p.team.some(f => f.fainted)) { U().toast("!", "No fainted creature to revive"); return; } ui.fight.reviveMenu = d.bUseitem; drawFight(); return; } act("item", d.bUseitem); return; }
    if (d.bRevive !== undefined) { const itemId = ui.fight.reviveMenu; ui.fight.reviveMenu = null; arg2 = 1; revTarget = +d.bRevive; act("item", itemId); return; }
    if (d.bCmd !== undefined) { act("cmd"); return; }
    if (d.bSwapto !== undefined) { act("swapto", +d.bSwapto); return; }
  });
  function helpHTML() {
    return `<div class="settings"><h2>How battles work</h2>
<section><h3>Your team</h3><p>Bring 3 creatures, 1 Ally and up to 2 Items. Allies give a passive boost all battle and a one-time Command. Each Item can be used once per battle, and you never lose it.</p></section>
<section><h3>Each turn</h3><p><b>Attack</b> for a basic strike, or use your creature's <b>Ability</b>, its signature move, which then recharges for ${3} turns. You can also use an Item, your Ally's Command, or swap creatures. Swapping uses your turn, unless it's a forced swap after a creature faints.</p></section>
<section><h3>Element matchups</h3><p>Strong matchups deal 1.5× damage and weak ones deal 0.67×.</p><div class="match-table">${Object.entries(B.STRONG).map(([k, v]) => `<div>${Art().icon(k, 14)} <b>${EL[k].label}</b> beats ${v.map(x => Art().icon(x, 14) + " " + EL[x].label).join(", ")}</div>`).join("")}</div></section>
<section><h3>Status effects</h3><p>🔥 Burn: loses HP each turn · ❄ Frozen / ⚡ Stunned: skips a turn · ▼ ATK: deals less damage · 🛡 Shield: halves the next hits · 💨 Evasive: dodges the next attack.</p></section>
<section><h3>Tips for winning</h3><ul class="help-tips">
<li><b>Counter the isle.</b> Each isle is mostly one element. Check the matchup chart and bring creatures that beat it.</li>
<li><b>Level up.</b> Duplicate cards plus Shard Dust raise a creature's level, adding 6% Attack and Defense each time (up to Lv 10).</li>
<li><b>Farm Shard Dust.</b> Replaying battles you've won pays a little Dust, and duplicate pulls give more.</li>
<li><b>Match your Ally.</b> Most Allies only boost their own element. Sister Sefa and Commander Rowan boost everyone.</li>
<li><b>Swap smartly.</b> If your creature is weak to the enemy, swap to one that resists it.</li>
<li><b>Time your Items.</b> Heal before a creature faints, and save Ember Bombs and Frost Flasks for tough enemies.</li></ul></section>
<section><h3>Rewards</h3><p>Your first win against each opponent earns Shard Dust. Isle leaders also give a pack, and guardians give 2 packs. Replays earn a little Dust. Losing costs nothing.</p></section></div>`;
  }
  return { view, ui, reset: () => { if (ui.screen === "fight" && ui.fight && !ui.fight.over) return; } };
})();
