// Balance check: simulates players with collections of different sizes
// fighting every story stage. Run: node tools/balance.js
global.window = { crypto: require("crypto").webcrypto };
global.localStorage = { getItem: () => null, setItem: () => {} };
global.document = { addEventListener() {} };
for (const f of ["config", "creatures", "support", "art", "game", "battle"]) require(`../js/${f}.js`);
const { Battle: B, Game: G, CREATURES: ALL } = window;
const byId = Object.fromEntries(ALL.map(c => [c.id, c]));
function collection(packs) { const own = new Set(); for (let i = 0; i < packs; i++) for (const c of G.generatePack()) if (!c.support) own.add(c.creature.id); return [...own]; }
function best(ids, isle) { const el = B.ISLES[isle].el; return ids.map(id => byId[id]).sort((a, b) => { const s = c => (c.atk + c.def) * (B.elMult(c.element, el) > 1 ? 1.35 : B.elMult(el, c.element) > 1 ? .8 : 1) + ({ common: 0, uncommon: 10, rare: 22, epic: 38, mythic: 55 })[c.rarity]; return s(b) - s(a); }).slice(0, 3).map(c => c.id); }
const levels = [3, 15, 40, 90];
console.log("Win rate (%) by packs opened → isle (stages 1-7: T T T T T Leader Guardian)");
for (const packs of levels) {
  const rows = [];
  for (let isle = 0; isle < 10; isle++) {
    const st = [];
    for (let stage = 0; stage < B.STAGES; stage++) {
      let w = 0; const N = 24;
      for (let k = 0; k < N; k++) { const ids = collection(packs); if (B.autoBattle(B.stageInfo(isle, stage), best(ids, isle))) w++; }
      st.push(String(Math.round(w / 24 * 100)).padStart(3));
    }
    rows.push(`isle ${String(isle + 1).padStart(2)}: ${st.join(" ")}`);
  }
  console.log(`\n${packs} packs:\n` + rows.join("\n"));
}
