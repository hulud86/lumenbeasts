// Run with:  node tools/simulate.js 200000
// Opens N simulated packs and prints the observed rarity rates.
global.window = { crypto: require("crypto").webcrypto };
global.localStorage = { getItem: () => null, setItem: () => {} };
require("../js/config.js"); require("../js/creatures.js"); require("../js/game.js");
const n = +process.argv[2] || 100000;
const r = window.Game.simulate(n);
const w = window.CONFIG.pack.specialWeights, wt = Object.values(w).reduce((a, b) => a + b, 0);
console.log(`Simulated ${n.toLocaleString()} packs\n\nBonus slot      observed   target`);
for (const k in r.specialSlot) console.log(`  ${k.padEnd(12)} ${(r.specialSlot[k] * 100).toFixed(2).padStart(7)}%  ${(w[k] / wt * 100).toFixed(2).padStart(6)}%`);
console.log(`\nAverage cards per pack`);
for (const k in r.perPack) console.log(`  ${k.padEnd(12)} ${r.perPack[k].toFixed(3)}`);
// duplicate-within-pack check
let dupPacks = 0;
for (let i = 0; i < 20000; i++) { const ids = window.Game.generatePack().map(c => c.creature.id); if (new Set(ids).size !== ids.length) dupPacks++; }
console.log(`\nPacks with a repeated creature (of 20,000): ${dupPacks}`);
