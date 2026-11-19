/* =========================================================
   LUMEN BEASTS — game configuration
   Everything a designer might want to tune lives here.
   ========================================================= */
window.CONFIG = {
  gameName: "Lumen Beasts",
  tagline: "Collect the beasts of the shattered moon",
  setName: "Shardfall",          // name of the first card set
  saveKey: "lumenbeasts.save.v1",

  // Pack composition: fixed slots, then "special" slots rolled on specialWeights
  pack: {
    slots: [
      { rarity: "common", count: 6 },
      { rarity: "uncommon", count: 3 },
      { rarity: "special", count: 1 }
    ],
    // Probability for the special slot (any numbers — they're normalized)
    specialWeights: { common: 60, uncommon: 25, rare: 10, epic: 4, mythic: 1 },
    noDuplicatesWithinPack: true
  },

  dailyCooldownHours: 24,
  devTools: true,                // shows "grant test pack" in Settings — set false before launch
  welcomePacks: 3,               // bonus packs granted on a brand-new save

  // Shard Dust earned for each duplicate copy, and the price of a bonus pack
  dustPerDuplicate: { common: 2, uncommon: 5, rare: 15, epic: 40, mythic: 150 },
  dustPackCost: 120,

  rarities: {
    common:   { label: "Common",   order: 1, color: "#b9c3cf", gems: 1 },
    uncommon: { label: "Uncommon", order: 2, color: "#5fd08a", gems: 2 },
    rare:     { label: "Rare",     order: 3, color: "#4aa8ff", gems: 3 },
    epic:     { label: "Epic",     order: 4, color: "#b46cff", gems: 4 },
    mythic:   { label: "Mythic",   order: 5, color: "#ffc94a", gems: 5 }
  },

  elements: {
    fire:      { label: "Fire",      isle: "Kaelspire",      main: "#ff6a3d", light: "#ffc070", dark: "#6e1a08", bg1: "#3a0e08", bg2: "#8a2a10" },
    water:     { label: "Water",     isle: "The Tidemere",   main: "#27b6ef", light: "#a6ecff", dark: "#06315c", bg1: "#031a33", bg2: "#0a5c8a" },
    nature:    { label: "Nature",    isle: "Verdant Hollow", main: "#5ccf6a", light: "#c4f59a", dark: "#14502a", bg1: "#0b2614", bg2: "#2c6b34" },
    electric:  { label: "Electric",  isle: "Stormcrown",     main: "#ffd93b", light: "#fff6a8", dark: "#7a5200", bg1: "#1d1a30", bg2: "#4a4270" },
    shadow:    { label: "Shadow",    isle: "Duskveil",       main: "#9a5cf0", light: "#d6b8ff", dark: "#2a0f4d", bg1: "#0c0618", bg2: "#2b1450" },
    celestial: { label: "Celestial", isle: "The Halo Reach", main: "#ffd27a", light: "#fff4d6", dark: "#6a4a9a", bg1: "#120f33", bg2: "#3c2f7a" },
    ice:       { label: "Ice",       isle: "Rimeholt",       main: "#8fe3ff", light: "#eefcff", dark: "#1d5a80", bg1: "#0b2a44", bg2: "#5a9cc4" },
    earth:     { label: "Earth",     isle: "Grauldeep",      main: "#d39a5c", light: "#f3d3a3", dark: "#4d2c12", bg1: "#24150a", bg2: "#7a4d24" },
    wind:      { label: "Wind",      isle: "Zephyr Steppes", main: "#7fe0c2", light: "#e2fff4", dark: "#1c5a55", bg1: "#0f3340", bg2: "#5fb0b4" },
    arcane:    { label: "Arcane",    isle: "The Glyphspire", main: "#ff6fd0", light: "#ffd1f2", dark: "#3d1470", bg1: "#14072a", bg2: "#4a1a7a" }
  }
};
