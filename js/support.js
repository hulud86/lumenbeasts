/* =========================================================
   LUMEN BEASTS — support cards: Allies (people) and Items
   Allies: bring 1 into battle. Passive boost + one Command.
   Items: bring up to 2. Each can be used once per battle
   and is never used up from your collection.
   ========================================================= */
(function () {
  // a(id, name, element, rarity, role, look, passive, command, description)
  //   passive: { el: element or null for all, atk, def, hp }  (percent boosts)
  //   command: { name, fx, text }   fx: heal | shield | recharge | dodge | crit | freeswap | rally | cleanse
  const allies = [], items = [];
  function a(id, name, el, rar, role, look, passive, command, desc) {
    allies.push({ id, kind: "ally", name, element: el, rarity: rar, role, look, passive, command, desc });
  }
  function it(id, name, el, rar, type, look, fx, value, text, desc) {
    items.push({ id, kind: "item", name, element: el, rarity: rar, type, look, fx, value, text, desc });
  }

  /* ---------------- Allies: the people of Vael ---------------- */
  a("A01", "Elowen", "nature", "common", "Grove Ranger", { hair: "braid", hairC: "#6b3e1e", skin: "#f1c6a0", outfit: "#3f8f4a", hat: "hood", tool: "bow" },
    { el: "nature", atk: 10 }, { name: "Herbal Kit", fx: "heal", value: 30, text: "Heal your active creature by 30% of its HP." },
    "Keeper of the Verdant Hollow trails. She knows every creature by its footprints.");
  a("A02", "Coralie", "water", "common", "Reef Captain", { hair: "short", hairC: "#1d3f73", skin: "#c98d63", outfit: "#2c8fc9", hat: "captain", tool: "spyglass" },
    { el: "water", atk: 10 }, { name: "Tidal Shield", fx: "shield", value: 2, text: "Your active creature halves the next 2 hits." },
    "Captain of the reef ship Saltwhistle, and the Tidemere's toughest training-ground leader.");
  a("A03", "Brann", "fire", "common", "Forge Smith", { hair: "bald", beard: true, hairC: "#b84a1a", skin: "#e2a77a", outfit: "#8a3a1a", hat: "goggles", tool: "hammer" },
    { el: "fire", atk: 10 }, { name: "Temper Steel", fx: "rally", value: 20, text: "Your active creature gains +20% Attack and Defense." },
    "Hammers creature armor at the foot of Mount Kael. His forge has never gone cold.");
  a("A04", "Pip", "electric", "common", "Storm Chaser", { hair: "spiky", hairC: "#f2c12e", skin: "#f6d2b4", outfit: "#4a4270", hat: "goggles", tool: "rod" },
    { el: "electric", atk: 10 }, { name: "Overclock", fx: "recharge", text: "Your active creature's ability is ready again." },
    "A kid inventor who chases thunderstorms with a homemade lightning rod.");
  a("A05", "Sable", "shadow", "uncommon", "Night Warden", { hair: "long", hairC: "#2a1a3a", skin: "#d8b39a", outfit: "#3c1a5b", hat: "cowl", tool: "lantern" },
    { el: "shadow", atk: 12, def: 5 }, { name: "Shadowstep", fx: "dodge", text: "Your active creature dodges the next attack." },
    "Patrols Duskveil after dark with a lantern that shows only what wants to be seen.");
  a("A06", "Astrid", "celestial", "uncommon", "Stargazer", { hair: "bun", hairC: "#e8e0ff", skin: "#f3d6c4", outfit: "#3c2f7a", hat: "circlet", tool: "staff" },
    { el: "celestial", atk: 12, def: 5 }, { name: "Foresight", fx: "crit", text: "Your next attack is a guaranteed critical hit." },
    "An astronomer who maps the shards still falling from the broken moon.");
  a("A07", "Torvi", "ice", "uncommon", "Glacier Guide", { hair: "short", hairC: "#f4f4f4", skin: "#e9c1a8", outfit: "#2a6aa0", hat: "furhat", tool: "pick" },
    { el: "ice", atk: 12, def: 5 }, { name: "Thick Furs", fx: "shield", value: 2, text: "Your active creature halves the next 2 hits." },
    "Leads expeditions across Rimeholt's glaciers and has never lost a traveler.");
  a("A08", "Mara", "earth", "uncommon", "Canyon Miner", { hair: "ponytail", hairC: "#3a2410", skin: "#a8724e", outfit: "#8b5e34", hat: "minerhelm", tool: "pickaxe" },
    { el: "earth", atk: 12, def: 5 }, { name: "Dig In", fx: "rally", value: 20, text: "Your active creature gains +20% Attack and Defense." },
    "Digs for moon shards deep in Grauldeep and talks to the rocks. Sometimes they answer.");
  a("A09", "Kestrel", "wind", "rare", "Sky Racer", { hair: "windswept", hairC: "#c84a3a", skin: "#f0c8a8", outfit: "#1c5a55", hat: "aviator", tool: "kite" },
    { el: "wind", atk: 15, def: 5 }, { name: "Tailwind Swap", fx: "freeswap", text: "Swap creatures without using your turn, then act." },
    "Three-time champion of the Zephyr Steppes kite races, and she flies the kite herself.");
  a("A10", "Quill", "arcane", "rare", "Archivist", { hair: "short", hairC: "#4a1a7a", skin: "#d9a98a", outfit: "#4a1a7a", hat: "wizard", tool: "book", glasses: true },
    { el: "arcane", atk: 15, def: 5 }, { name: "Recall Spell", fx: "recharge", text: "Your active creature's ability is ready again." },
    "Keeper of the Glyphspire library. He has read every book there twice, and one of them three times.");
  a("A11", "Sister Sefa", null, "rare", "Wandering Healer", { hair: "veil", hairC: "#f0e6d0", skin: "#8a5a3c", outfit: "#f0f0ff", hat: "veil", tool: "staffheal" },
    { el: null, hp: 15 }, { name: "Full Mend", fx: "heal", value: 50, text: "Heal your active creature by 50% and cure its status." },
    "Travels between the isles tending to hurt creatures. All of your creatures gain +15% HP.");
  a("A12", "Commander Rowan", null, "epic", "Isle Tactician", { hair: "short", hairC: "#4a4a4a", skin: "#c99272", outfit: "#2a2f5a", hat: "beret", tool: "sword", cape: true },
    { el: null, atk: 8, def: 8 }, { name: "Battle Plan", fx: "rally", value: 30, text: "Your active creature gains +30% Attack and Defense." },
    "Trained every champion on the ten isles. All of your creatures gain +8% Attack and Defense.");

  /* ---------------- Items ---------------- */
  it("I01", "Healing Draught", "nature", "common", "Potion", { shape: "round", color: "#ff5a7a" }, "heal", 30, "Restore 30% of your active creature's HP.", "Brewed from moonpetal and spring water. Tastes like strawberries, mostly.");
  it("I02", "Ember Bomb", "fire", "common", "Throwable", { shape: "bomb", color: "#ff6a3d" }, "damage", 28, "Deal 28 Fire damage to the enemy. Element matchups apply.", "Handle with oven mitts.");
  it("I03", "Frost Flask", "ice", "common", "Throwable", { shape: "flask", color: "#8fe3ff" }, "freeze", 18, "Deal 18 Ice damage with a 50% chance to freeze.", "Keep away from warm pockets.");
  it("I04", "Lucky Charm", "celestial", "common", "Charm", { shape: "charm", color: "#ffd27a" }, "crit", 0, "Your active creature's next attack is a critical hit.", "A four-leaf clover pressed inside a moon shard.");
  it("I05", "Cleansing Salts", "water", "common", "Remedy", { shape: "jar", color: "#bff3ff" }, "cleanse", 10, "Cure status effects and restore 10% HP.", "Harvested from the tide pools of the Tidemere.");
  it("I06", "Greater Draught", "nature", "uncommon", "Potion", { shape: "tall", color: "#ff2a6a" }, "heal", 60, "Restore 60% of your active creature's HP.", "Twice the moonpetal, twice the strawberries.");
  it("I07", "Smoke Veil", "shadow", "uncommon", "Throwable", { shape: "pouch", color: "#9a5cf0" }, "dodge", 0, "Your active creature dodges the next attack.", "One puff and you're gone.");
  it("I08", "Shard Battery", "electric", "uncommon", "Gear", { shape: "crystal", color: "#ffd93b" }, "recharge", 0, "Your active creature's ability is ready again.", "A moon shard humming with stored lightning.");
  it("I09", "Iron Tonic", "earth", "uncommon", "Potion", { shape: "square", color: "#c9a06a" }, "def", 30, "Your active creature gains +30% Defense for the rest of the battle.", "Contains real iron. Do not ask how.");
  it("I10", "Phoenix Feather", "fire", "rare", "Relic", { shape: "feather", color: "#ff9a3d" }, "revive", 50, "Revive a fainted creature with 50% HP (uses your turn).", "Still warm, centuries after it fell.");
  it("I11", "Fury Elixir", "fire", "rare", "Potion", { shape: "tall", color: "#ff3a2a" }, "atk", 35, "Your active creature gains +35% Attack for the rest of the battle.", "Bubbles even when it's cold.");
  it("I12", "Moonstone Elixir", "arcane", "epic", "Relic", { shape: "moon", color: "#ff6fd0" }, "fullheal", 100, "Fully heal your active creature and cure its status.", "Distilled from a sliver of Lumen itself.");

  for (const x of [...allies, ...items]) x.no = x.id;
  window.SUPPORT = { allies, items, all: [...allies, ...items], byId: Object.fromEntries([...allies, ...items].map(x => [x.id, x])) };
})();
