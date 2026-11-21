/* =========================================================
   LUMEN BEASTS — game logic (no DOM code here)
   Save data, daily pack timer, pack generation, achievements.
   ========================================================= */
window.Game = (function () {
  const C = window.CONFIG, ALL = window.CREATURES, SUP = window.SUPPORT;
  const byId = Object.fromEntries(ALL.map(c => [c.id, c]));
  const RARITIES = Object.keys(C.rarities);
  const pools = Object.fromEntries(RARITIES.map(r => [r, ALL.filter(c => c.rarity === r)]));
  const HOUR = 3600 * 1000;
  const SALT = "lumenbeasts-moon-" + C.saveKey;

  /* ---------- randomness (crypto when available) ---------- */
  function rand() {
    if (window.crypto && crypto.getRandomValues) { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] / 4294967296; }
    return Math.random();
  }
  const pick = arr => arr[Math.floor(rand() * arr.length)];
  function rollRarity(weights) {
    const entries = Object.entries(weights).filter(([, w]) => w > 0);
    const total = entries.reduce((s, [, w]) => s + w, 0);
    let x = rand() * total;
    for (const [r, w] of entries) { if ((x -= w) < 0) return r; }
    return entries[entries.length - 1][0];
  }

  /* ---------- save / load ---------- */
  function hash(str) { let h = 2166136261; for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }
  function starterKit() { return Object.fromEntries((C.starterSupport || []).map(id => [id, 1])); }
  function fresh() {
    return { v: 1, created: Date.now(), owned: {}, firstSeen: {}, recent: [], packsOpened: 0, dailyClaims: 0, lastDaily: 0,
      bonusPacks: C.welcomePacks, dust: 0, pulled: {}, holo: {}, levels: {}, support: starterKit(), battle: { cleared: {}, wins: 0, losses: 0, team: null }, achievements: {}, lastSeen: Date.now(), sound: true };
  }
  let S = null, storageOK = true, tampered = false;
  const saveListeners = [];
  // Bring any older save up to date (used when loading from this browser, a backup code or the cloud)
  function migrate(data) {
    const s = Object.assign(fresh(), data);
    if (!data.support) s.support = starterKit();      // older saves get the starter kit
    if (!data.levels) s.levels = {};
    if (!data.battle) s.battle = { cleared: {}, wins: 0, losses: 0, team: null };
    // v2 story: 7 stages per isle. Old leader (-2) and guardian (-3) wins carry over.
    if (s.battle && s.battle.cleared) for (const k of Object.keys(s.battle.cleared)) {
      const m = k.match(/^(.*)-(2|3)$/); if (m) { s.battle.cleared[`${m[1]}-${m[2] === "2" ? "L" : "G"}`] = s.battle.cleared[k]; delete s.battle.cleared[k]; }
    }
    return s;
  }
  function load() {
    try {
      const raw = localStorage.getItem(C.saveKey);
      if (raw) {
        const { data, sig } = JSON.parse(raw);
        S = migrate(data);
        tampered = sig !== hash(JSON.stringify(data) + SALT);
      } else S = fresh();
    } catch (e) { storageOK = false; S = fresh(); }
    return S;
  }
  function save() {
    S.lastSeen = Math.max(S.lastSeen || 0, Date.now());
    try { localStorage.setItem(C.saveKey, JSON.stringify({ data: S, sig: hash(JSON.stringify(S) + SALT) })); }
    catch (e) { storageOK = false; }
    for (const fn of saveListeners) try { fn(); } catch (e) { console.error(e); }
  }
  const onSave = fn => saveListeners.push(fn);

  /* ---------- daily pack ---------- */
  const cooldown = () => C.dailyCooldownHours * HOUR;
  // If the device clock jumps backwards, hold the daily pack until real time catches up
  const clockRolledBack = () => Date.now() < (S.lastSeen || 0) - 5 * 60 * 1000;
  const dailyReady = () => !clockRolledBack() && Date.now() - S.lastDaily >= cooldown();
  const msUntilDaily = () => Math.max(0, (S.lastDaily + cooldown()) - Date.now(), clockRolledBack() ? S.lastSeen - Date.now() : 0);
  const packsAvailable = () => (dailyReady() ? 1 : 0) + S.bonusPacks;

  /* ---------- packs ---------- */
  function generatePack() {
    const cards = [], used = new Set();
    for (const slot of C.pack.slots) {
      for (let i = 0; i < slot.count; i++) {
        if (slot.rarity === "support") { cards.push({ creature: rollSupport(), support: true }); continue; }
        const rarity = slot.rarity === "special" ? rollRarity(C.pack.specialWeights) : slot.rarity;
        let pool = pools[rarity];
        if (C.pack.noDuplicatesWithinPack) { const left = pool.filter(c => !used.has(c.id)); if (left.length) pool = left; }
        const cr = pick(pool); used.add(cr.id);
        cards.push({ creature: cr, special: slot.rarity === "special" });
      }
    }
    return cards;
  }
  function rollSupport() {
    const pool = rand() < C.pack.supportAllyChance ? SUP.allies : SUP.items;
    const order = ["epic", "rare", "uncommon", "common"];
    let r = rollRarity(C.pack.supportWeights);
    for (let i = order.indexOf(r); i < order.length; i++) { const p = pool.filter(x => x.rarity === order[i]); if (p.length) return pick(p); }
    return pick(pool);
  }
  function openPack() {
    if (packsAvailable() <= 0) return null;
    const source = dailyReady() ? "daily" : "bonus";
    if (source === "daily") { S.lastDaily = Date.now(); S.dailyClaims++; } else S.bonusPacks--;
    const before = unlockedIds();
    const cards = generatePack();
    let dust = 0;
    const now = Date.now();
    for (const c of cards) {
      const id = c.creature.id;
      if (c.support) {
        c.isNew = !S.support[id]; S.support[id] = (S.support[id] || 0) + 1; c.count = S.support[id];
        if (!c.isNew) { c.dust = C.dustPerDuplicate[c.creature.rarity] || 0; dust += c.dust; }
        continue;
      }
      c.isNew = !S.owned[id];
      S.owned[id] = (S.owned[id] || 0) + 1;
      c.count = S.owned[id];
      if (c.isNew) { S.firstSeen[id] = now; S.recent.unshift(id); }
      else { c.dust = C.dustPerDuplicate[c.creature.rarity] || 0; dust += c.dust; }
      S.pulled[c.creature.rarity] = (S.pulled[c.creature.rarity] || 0) + 1;
      c.holo = rand() < (C.holoChance || 0);
      if (c.holo) { c.newHolo = !S.holo[id]; S.holo[id] = (S.holo[id] || 0) + 1; }
    }
    S.recent = S.recent.slice(0, 24);
    S.dust += dust;
    S.packsOpened++;
    const newAch = unlockedIds().filter(id => !before.includes(id));
    save();
    return { cards, dust, source, newAchievements: newAch.map(id => ACH.find(a => a.id === id)) };
  }
  function buyPackWithDust() {
    if (S.dust < C.dustPackCost) return false;
    S.dust -= C.dustPackCost; S.bonusPacks++; save(); return true;
  }

  /* ---------- collection helpers ---------- */
  const discovered = () => Object.keys(S.owned).length;
  /* ---------- leveling ---------- */
  const LV = C.leveling;
  const levelOf = id => (S.levels && S.levels[id]) || 1;
  const levelMult = id => 1 + LV.perLevel * (levelOf(id) - 1);
  function levelCost(id) {
    const L = levelOf(id); if (L >= LV.maxLevel) return null;
    return { copies: Math.ceil(L / 2), dust: L * LV.dustPerLevel[byId[id].rarity] };
  }
  function canLevel(id) { const c = levelCost(id); return !!c && (S.owned[id] || 0) - 1 >= c.copies && S.dust >= c.dust; }
  function levelUp(id) {
    if (!canLevel(id)) return false;
    const c = levelCost(id);
    S.owned[id] -= c.copies; S.dust -= c.dust; S.levels[id] = levelOf(id) + 1; save(); return S.levels[id];
  }
  const levelsGained = () => Object.values(S.levels || {}).reduce((a, l) => a + l - 1, 0);
  const holoCount = () => Object.keys(S.holo || {}).length;
  const totalCards = () => Object.values(S.owned).reduce((a, b) => a + b, 0);
  const completion = () => discovered() / ALL.length;
  const ownedOf = filter => ALL.filter(c => filter(c) && S.owned[c.id]).length;

  /* ---------- achievements ---------- */
  const elements = Object.keys(C.elements);
  const ACH = [
    { id: "first-pack", name: "Shardfall Begins", desc: "Open your first Shard Pack.", icon: "pack", goal: 1, prog: () => S.packsOpened, reward: { packs: 1 } },
    { id: "disc-10", name: "Budding Collector", desc: "Discover 10 creatures.", icon: "book", goal: 10, prog: discovered, reward: { packs: 1 } },
    { id: "disc-25", name: "Field Researcher", desc: "Discover 25 creatures.", icon: "book", goal: 25, prog: discovered, reward: { packs: 1 } },
    { id: "disc-50", name: "Halfway to Legend", desc: "Discover 50 creatures.", icon: "book", goal: 50, prog: discovered, reward: { packs: 2 } },
    { id: "disc-75", name: "Master Cataloguer", desc: "Discover 75 creatures.", icon: "book", goal: 75, prog: discovered, reward: { packs: 2 } },
    { id: "disc-100", name: "Keeper of the Shard", desc: `Discover all ${ALL.length} creatures.`, icon: "crown", goal: ALL.length, prog: discovered, reward: { packs: 5, dust: 500 } },
    { id: "rare-1", name: "A Rare Glimmer", desc: "Discover a Rare creature.", icon: "gem", goal: 1, prog: () => ownedOf(c => c.rarity === "rare"), reward: { dust: 30 } },
    { id: "epic-1", name: "Epic Encounter", desc: "Discover an Epic creature.", icon: "gem", goal: 1, prog: () => ownedOf(c => c.rarity === "epic"), reward: { dust: 60 } },
    { id: "mythic-1", name: "Touched by Myth", desc: "Discover a Mythic creature.", icon: "crown", goal: 1, prog: () => ownedOf(c => c.rarity === "mythic"), reward: { packs: 2 } },
    { id: "mythic-all", name: "Pantheon", desc: `Discover all ${pools.mythic.length} Mythic creatures.`, icon: "crown", goal: pools.mythic.length, prog: () => ownedOf(c => c.rarity === "mythic"), reward: { packs: 5 } },
    { id: "all-elements", name: "Isle Hopper", desc: "Own a creature of every element.", icon: "compass", goal: elements.length, prog: () => elements.filter(e => ownedOf(c => c.element === e) > 0).length, reward: { packs: 1 } },
    { id: "element-master", name: "Elemental Master", desc: "Complete every creature of one element.", icon: "star", goal: 1, prog: () => elements.filter(e => ownedOf(c => c.element === e) === ALL.filter(c => c.element === e).length).length, reward: { packs: 2 } },
    { id: "packs-10", name: "Pack Rat", desc: "Open 10 Shard Packs.", icon: "pack", goal: 10, prog: () => S.packsOpened, reward: { dust: 50 } },
    { id: "packs-50", name: "Shard Hoarder", desc: "Open 50 Shard Packs.", icon: "pack", goal: 50, prog: () => S.packsOpened, reward: { packs: 3 } },
    { id: "daily-7", name: "Moonlit Devotion", desc: "Claim 7 daily packs.", icon: "moon", goal: 7, prog: () => S.dailyClaims, reward: { packs: 2 } },
    { id: "holo-1", name: "Prismatic!", desc: "Pull your first Holo card.", icon: "gem", goal: 1, prog: holoCount, reward: { packs: 1 } },
    { id: "holo-10", name: "Rainbow Collector", desc: "Own 10 different Holo cards.", icon: "star", goal: 10, prog: holoCount, reward: { packs: 2, dust: 100 } },
    { id: "first-win", name: "First Victory", desc: "Win your first battle.", icon: "star", goal: 1, prog: () => S.battle.wins, reward: { packs: 1 } },
    { id: "guardian-1", name: "Isle Champion", desc: "Defeat an isle's guardian.", icon: "crown", goal: 1, prog: () => guardiansBeaten(), reward: { packs: 2 } },
    { id: "guardian-all", name: "Conqueror of Vael", desc: "Defeat all 10 isle guardians.", icon: "crown", goal: 10, prog: () => guardiansBeaten(), reward: { packs: 5, dust: 500 } },
    { id: "allies-6", name: "Fellowship", desc: "Recruit 6 different Allies.", icon: "heart", goal: 6, prog: () => SUP.allies.filter(x => S.support[x.id]).length, reward: { packs: 1 } },
    { id: "items-all", name: "Fully Stocked", desc: "Own every Item card.", icon: "pack", goal: SUP.items.length, prog: () => SUP.items.filter(x => S.support[x.id]).length, reward: { packs: 2 } },
    { id: "level-5", name: "Trained Up", desc: "Raise a creature to level 5.", icon: "star", goal: 5, prog: () => Math.max(1, ...Object.values(S.levels || {})), reward: { packs: 1 } },
    { id: "level-10", name: "Peak Form", desc: "Raise a creature to the max level, 10.", icon: "crown", goal: 10, prog: () => Math.max(1, ...Object.values(S.levels || {})), reward: { packs: 3 } },
    { id: "levels-25", name: "Devoted Trainer", desc: "Gain 25 levels across your creatures.", icon: "heart", goal: 25, prog: levelsGained, reward: { dust: 200 } },
    { id: "copies-5", name: "Best Friends", desc: "Own 5 copies of one creature.", icon: "heart", goal: 5, prog: () => Math.max(0, ...Object.values(S.owned)), reward: { dust: 40 } }
  ];
  const guardiansBeaten = () => Object.keys(S.battle.cleared).filter(k => k.endsWith("-G")).length;
  const achStatus = a => { const p = Math.min(a.goal, a.prog()); return { p, done: p >= a.goal, claimed: !!S.achievements[a.id] }; };
  const unlockedIds = () => ACH.filter(a => achStatus(a).done).map(a => a.id);
  const claimable = () => ACH.filter(a => { const s = achStatus(a); return s.done && !s.claimed; }).length;
  function claim(id) {
    const a = ACH.find(x => x.id === id); if (!a) return null;
    const s = achStatus(a); if (!s.done || s.claimed) return null;
    S.achievements[id] = Date.now();
    S.bonusPacks += a.reward.packs || 0; S.dust += a.reward.dust || 0;
    save(); return a.reward;
  }

  /* ---------- export / import / reset ---------- */
  function exportCode() { const data = JSON.stringify(S); return btoa(unescape(encodeURIComponent(JSON.stringify({ data: S, sig: hash(data + SALT) })))); }
  function importCode(code) {
    try { const { data, sig } = JSON.parse(decodeURIComponent(escape(atob(code.trim()))));
      if (!data || typeof data.owned !== "object") return false;
      S = migrate(data); tampered = sig !== hash(JSON.stringify(data) + SALT); save(); return true;
    } catch (e) { return false; }
  }
  // Quick facts about a save code, for "which save do you want to keep?" choices
  function summarize(code) {
    try {
      const d = code === undefined ? S : JSON.parse(decodeURIComponent(escape(atob(code.trim())))).data;
      const cards = Object.values(d.owned || {}).reduce((a, b) => a + b, 0);
      return { species: Object.keys(d.owned || {}).length, cards, packs: d.packsOpened || 0, wins: (d.battle && d.battle.wins) || 0,
        dust: d.dust || 0, lastPlayed: d.lastSeen || d.created || 0, fresh: !d.packsOpened && !Object.keys(d.owned || {}).length };
    } catch (e) { return null; }
  }
  function reset() { S = fresh(); save(); }
  function grantTestPack() { S.bonusPacks++; save(); }

  /* ---------- odds simulation (used by tools/simulate.js and the console) ---------- */
  function simulate(n = 100000) {
    const counts = Object.fromEntries(RARITIES.map(r => [r, 0])), special = Object.fromEntries(RARITIES.map(r => [r, 0]));
    for (let i = 0; i < n; i++) for (const c of generatePack()) { if (c.support) continue; counts[c.creature.rarity]++; if (c.special) special[c.creature.rarity]++; }
    return { packs: n, perPack: Object.fromEntries(RARITIES.map(r => [r, counts[r] / n])), specialSlot: Object.fromEntries(RARITIES.map(r => [r, special[r] / n])) };
  }

  load();
  return {
    get state() { return S; }, get storageOK() { return storageOK; }, get tampered() { return tampered; },
    ALL, byId, pools, SUP, unlockedIds, ACH_IDS: () => ACH.map(a => a.id), ACH, achStatus, claim, claimable,
    dailyReady, msUntilDaily, packsAvailable, clockRolledBack, openPack, buyPackWithDust,
    discovered, holoCount, totalCards, levelOf, levelMult, levelCost, canLevel, levelUp, completion, ownedOf, exportCode, importCode, summarize, onSave, reset, grantTestPack, save, simulate, generatePack
  };
})();
