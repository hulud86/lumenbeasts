/* =========================================================
   LUMEN BEASTS — game logic (no DOM code here)
   Save data, daily pack timer, pack generation, achievements.
   ========================================================= */
window.Game = (function () {
  const C = window.CONFIG, ALL = window.CREATURES;
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
  function fresh() {
    return { v: 1, created: Date.now(), owned: {}, firstSeen: {}, recent: [], packsOpened: 0, dailyClaims: 0, lastDaily: 0,
      bonusPacks: C.welcomePacks, dust: 0, pulled: {}, achievements: {}, lastSeen: Date.now(), sound: true };
  }
  let S = null, storageOK = true, tampered = false;
  function load() {
    try {
      const raw = localStorage.getItem(C.saveKey);
      if (raw) {
        const { data, sig } = JSON.parse(raw);
        S = Object.assign(fresh(), data);
        tampered = sig !== hash(JSON.stringify(data) + SALT);
      } else S = fresh();
    } catch (e) { storageOK = false; S = fresh(); }
    return S;
  }
  function save() {
    S.lastSeen = Math.max(S.lastSeen || 0, Date.now());
    try { localStorage.setItem(C.saveKey, JSON.stringify({ data: S, sig: hash(JSON.stringify(S) + SALT) })); }
    catch (e) { storageOK = false; }
  }

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
        const rarity = slot.rarity === "special" ? rollRarity(C.pack.specialWeights) : slot.rarity;
        let pool = pools[rarity];
        if (C.pack.noDuplicatesWithinPack) { const left = pool.filter(c => !used.has(c.id)); if (left.length) pool = left; }
        const cr = pick(pool); used.add(cr.id);
        cards.push({ creature: cr, special: slot.rarity === "special" });
      }
    }
    return cards;
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
      c.isNew = !S.owned[id];
      S.owned[id] = (S.owned[id] || 0) + 1;
      c.count = S.owned[id];
      if (c.isNew) { S.firstSeen[id] = now; S.recent.unshift(id); }
      else { c.dust = C.dustPerDuplicate[c.creature.rarity] || 0; dust += c.dust; }
      S.pulled[c.creature.rarity] = (S.pulled[c.creature.rarity] || 0) + 1;
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
    { id: "copies-5", name: "Best Friends", desc: "Own 5 copies of one creature.", icon: "heart", goal: 5, prog: () => Math.max(0, ...Object.values(S.owned)), reward: { dust: 40 } }
  ];
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
      S = Object.assign(fresh(), data); tampered = sig !== hash(JSON.stringify(data) + SALT); save(); return true;
    } catch (e) { return false; }
  }
  function reset() { S = fresh(); save(); }
  function grantTestPack() { S.bonusPacks++; save(); }

  /* ---------- odds simulation (used by tools/simulate.js and the console) ---------- */
  function simulate(n = 100000) {
    const counts = Object.fromEntries(RARITIES.map(r => [r, 0])), special = Object.fromEntries(RARITIES.map(r => [r, 0]));
    for (let i = 0; i < n; i++) for (const c of generatePack()) { counts[c.creature.rarity]++; if (c.special) special[c.creature.rarity]++; }
    return { packs: n, perPack: Object.fromEntries(RARITIES.map(r => [r, counts[r] / n])), specialSlot: Object.fromEntries(RARITIES.map(r => [r, special[r] / n])) };
  }

  load();
  return {
    get state() { return S; }, get storageOK() { return storageOK; }, get tampered() { return tampered; },
    ALL, byId, pools, ACH, achStatus, claim, claimable,
    dailyReady, msUntilDaily, packsAvailable, clockRolledBack, openPack, buyPackWithDust,
    discovered, totalCards, completion, ownedOf, exportCode, importCode, reset, grantTestPack, save, simulate, generatePack
  };
})();
