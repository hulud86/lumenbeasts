/* =========================================================
   LUMEN BEASTS — creature roster (Set 1: Shardfall, 120 creatures)
   To add a creature: append a line with c(...). IDs are assigned
   in order. "form" picks the illustration body plan for creatures
   without hand-drawn art (see art.js). Set `img` to a file path
   (e.g. "assets/art/011.webp") to use painted artwork instead.
   ========================================================= */
(function () {
  const list = [];
  // c(name, element, rarity, atk, def, form, personality, ability, abilityText, description, extra)
  function c(name, el, rar, atk, def, form, trait, ability, abilityText, desc, extra) {
    list.push(Object.assign({
      id: list.length + 1, name, element: el, rarity: rar, atk, def, form, trait,
      ability: { name: ability, text: abilityText || "" }, desc
    }, extra || {}));
  }

  /* ---------- 001–010: the Founders (hand-illustrated) ---------- */
  c("Emberpup", "fire", "common", 28, 20, "hand", "Eager",
    "Kindle", "Warms an ally, raising its Attack by 5 next turn.",
    "A fox pup whose tail is a living campfire. It follows travelers home and curls up in hearths, where it can sleep for days.",
    { species: "Hearth Pup", size: "Small", lore: "Kaelspire villagers leave a coal on the doorstep for luck — it's usually an Emberpup's breakfast." });
  c("Bubblot", "water", "common", 16, 30, "hand", "Dreamy",
    "Bubble Ward", "Wraps itself in a bubble, blocking the next 10 damage.",
    "An axolotl that lives inside a floating bubble it blew as a baby. It drifts over the Tidemere reefs, smiling at everything.",
    { species: "Bubble Axolotl", size: "Tiny", lore: "If its bubble pops, a Bubblot just blows a new one and pretends nothing happened." });
  c("Mossnook", "nature", "common", 14, 36, "hand", "Patient",
    "Overgrow", "Heals 8 Defense at the start of each turn.",
    "A tiny tortoise carrying a whole garden on its shell — moss, mushrooms and one very proud sapling.",
    { species: "Garden Tortoise", size: "Small", lore: "The oldest Mossnooks carry trees tall enough for birds to nest in." });
  c("Voltmoth", "electric", "uncommon", 44, 30, "hand", "Restless",
    "Static Dust", "Scatters charged scales: 30% chance to stun the foe.",
    "A moth drawn to lightning instead of lamplight. Its wings store static from storms and glow in spiral patterns at night.",
    { species: "Stormwing Moth", size: "Small", lore: "On Stormcrown, a swarm of Voltmoths is the first sign a thunderstorm is coming." });
  c("Lunowl", "celestial", "rare", 52, 58, "hand", "Wise",
    "Moonlit Gaze", "Reveals the foe's next move and dodges it.",
    "A starry owl with a crescent moon on its brow. It sleeps through the day and spends the night redrawing constellations.",
    { species: "Moon Owl", size: "Medium", lore: "Astronomers on the Halo Reach claim three new stars were Lunowl doodles." });
  c("Rimefang", "ice", "rare", 64, 50, "hand", "Loyal",
    "Frostbite Fang", "Bites for heavy damage and freezes the foe for one turn.",
    "A frost wolf with a mane of living ice crystals. Its howl drops the temperature so fast that waterfalls freeze mid-air.",
    { species: "Glacier Wolf", size: "Large", lore: "A Rimefang that chooses a companion will follow them for life, even off the snowy isle." });
  c("Murkwick", "shadow", "common", 24, 18, "hand", "Mischievous",
    "Lure Light", "Distracts the foe, lowering its Attack by 6.",
    "A ghostly wisp that lives inside an old lantern. It lures travelers off the path, then guides them safely home — it just likes company.",
    { species: "Lantern Wisp", size: "Tiny", lore: "Never blow out a Murkwick's lantern. It finds that rude." });
  c("Cragmaul", "earth", "epic", 82, 88, "hand", "Stoic",
    "Fault Line", "Smashes the ground, damaging every foe at once.",
    "A mountain-ape golem of granite and amber. Ancient light pulses through the cracks in its body every time it breathes.",
    { species: "Mountain Golem", size: "Huge", lore: "Grauldeep miners say every cave was once a Cragmaul's footprint." });
  c("Driftray", "wind", "uncommon", 38, 42, "hand", "Free-spirited",
    "Tailwind", "Speeds up all allies so they act first next turn.",
    "A manta ray that swims through the sky instead of the sea, leaving ribbons of breeze behind it.",
    { species: "Sky Manta", size: "Medium", lore: "Kite festivals on the Zephyr Steppes are timed to the Driftray migration." });
  c("Aurelith", "arcane", "mythic", 99, 94, "hand", "Sovereign",
    "Shardstorm", "Calls down the moon's shards: massive Arcane damage, ignoring Defense.",
    "The Shard Sovereign: a crystal dragon born from the heart of the shattered moon. Every Lumen Beast carries a sliver of its light.",
    { species: "Shard Sovereign", size: "Colossal", lore: "When the moon broke, Aurelith caught its heart and became it.", title: "the Shard Sovereign" });

  /* ---------- FIRE · Kaelspire ---------- */
  c("Cindersnout", "fire", "common", 22, 18, "quad", "Curious", "Ash Sniff", "", "A piglet with a coal-black snout that glows brighter whenever it smells something tasty.");
  c("Wickling", "fire", "common", 18, 14, "sprite", "Jittery", "Flicker", "", "A living candle flame that hides behind bigger creatures and flares up when startled.");
  c("Scorchbeetle", "fire", "common", 26, 30, "bug", "Stubborn", "Hot Shell", "", "Its lava-crusted shell is warm enough to cook breakfast on, which campers frequently do.");
  c("Blazehorn", "fire", "uncommon", 48, 38, "quad", "Proud", "Horn Charge", "", "A young ram whose spiral horns burn hotter the higher it climbs on the volcanic ridges.");
  c("Magmaw", "fire", "uncommon", 42, 52, "blob", "Hungry", "Molten Gulp", "", "A slow, smiling lump of magma that eats rocks and burps out obsidian marbles.");
  c("Solarax", "fire", "rare", 66, 52, "bird", "Fierce", "Sunflare Dive", "", "A falcon wreathed in solar fire that dives from the sky like a falling star.");
  c("Infernyx", "fire", "rare", 70, 48, "serpent", "Restless", "Coil of Cinders", "", "A volcano serpent that swims through lava rivers, leaving glowing trails in its wake.");
  c("Ignivore", "fire", "epic", 82, 70, "quad", "Relentless", "Wildfire Roar", "", "A great flame lion whose mane is a crown of living fire. Its roar can relight a dying forge.");
  c("Pyrrhavex", "fire", "mythic", 96, 88, "dragon", "Volcanic", "Eruption", "", "The ancient dragon sleeping beneath Mount Kael. Each time it wakes, a new island rises from the sea.", { title: "the Ember Crown" });

  /* ---------- WATER · The Tidemere ---------- */
  c("Splashkin", "water", "common", 20, 22, "fish", "Playful", "Splash", "", "A puffy little fish that sprays water at anyone who looks sad, convinced it helps.");
  c("Shellby", "water", "common", 16, 34, "bug", "Shy", "Shell Hide", "", "A hermit crab that collects lost bottles and lives in whichever one it likes best that week.");
  c("Driplet", "water", "common", 18, 20, "jelly", "Dreamy", "Dew Drift", "", "A raindrop that refused to land and now floats around harbors, humming to itself.");
  c("Tidalope", "water", "uncommon", 44, 40, "quad", "Graceful", "Riptide Leap", "", "A sea-antelope that gallops across wave crests without ever getting its hooves wet.");
  c("Coralisk", "water", "uncommon", 38, 54, "serpent", "Patient", "Reef Guard", "", "A coral eel that grows tiny reefs along its back where baby fish shelter.");
  c("Abyssquid", "water", "rare", 62, 58, "jelly", "Cunning", "Ink Veil", "", "A deep-sea squid whose ink glows with stolen starlight to confuse its prey.");
  c("Narwhalen", "water", "rare", 68, 55, "fish", "Noble", "Tidepierce", "", "A narwhal whose spiral tusk can split a wave clean in two.");
  c("Whirlhydra", "water", "epic", 80, 76, "serpent", "Furious", "Maelstrom", "", "A three-headed sea hydra that spins whirlpools to guard sunken treasure.");
  c("Thalassor", "water", "mythic", 92, 98, "serpent", "Ancient", "World Tide", "", "A leviathan so vast that sailors once mistook its back for an island and built a town on it.", { title: "the Deep Tide" });

  /* ---------- NATURE · Verdant Hollow ---------- */
  c("Sproutling", "nature", "common", 15, 20, "blob", "Cheerful", "Photosynth", "", "A seedling with legs that follows sunbeams across the meadow all day long.");
  c("Thistlehog", "nature", "common", 24, 28, "quad", "Grumpy", "Bramble Bristle", "", "A hedgehog covered in thistle spines that bloom purple when it's finally happy.");
  c("Petalfly", "nature", "common", 20, 14, "bug", "Gentle", "Pollen Puff", "", "A butterfly whose wings are living petals. It smells like spring rain.");
  c("Barkbear", "nature", "uncommon", 50, 52, "quad", "Protective", "Oakhide", "", "A bear cub with bark for fur who naps in hollow trees and wakes up covered in mushrooms.");
  c("Vinewyrm", "nature", "uncommon", 46, 40, "serpent", "Sly", "Strangle Vine", "", "A serpent of twisting vines that ties knots in travelers' bootlaces for fun.");
  c("Mushgrove", "nature", "uncommon", 34, 56, "golem", "Sleepy", "Spore Cloud", "", "A walking mushroom grove that puffs drowsy spores whenever it yawns.");
  c("Thornstag", "nature", "rare", 64, 58, "quad", "Majestic", "Antler Bloom", "", "A stag whose antlers are flowering branches. Songbirds nest in them all year round.");
  c("Mantidra", "nature", "rare", 70, 48, "bug", "Focused", "Leafblade", "", "A mantis with leaf-blade arms, so still that it is often mistaken for a fern.");
  c("Grovemother", "nature", "epic", 72, 88, "golem", "Wise", "Rootquake", "", "An ancient tree-giant that walks once a century to plant a new forest.");

  /* ---------- ELECTRIC · Stormcrown ---------- */
  c("Sparkit", "electric", "common", 24, 16, "quad", "Hyper", "Static Zip", "", "A kitten whose fur crackles with static. It lights every lantern in the house when it sneezes.");
  c("Joltpop", "electric", "common", 22, 18, "blob", "Bouncy", "Pop Shock", "", "A bouncing ball of charge that pops like a firecracker when hugged.");
  c("Ampant", "electric", "common", 18, 26, "bug", "Tireless", "Circuit March", "", "Colonies of these copper ants build glowing tunnels that light up underground towns.");
  c("Fizzlefish", "electric", "common", 26, 18, "fish", "Excitable", "Eel Zap", "", "A small eel that glows like a neon sign whenever it's nervous — so, always.");
  c("Boltusk", "electric", "uncommon", 52, 42, "quad", "Brash", "Thunder Tusk", "", "A boar whose tusks act as lightning rods. It charges toward storms, not away from them.");
  c("Voltaroc", "electric", "rare", 68, 50, "bird", "Wild", "Chain Lightning", "", "A giant thunderbird whose wingbeats rumble like distant thunder.");
  c("Arcwyrm", "electric", "rare", 66, 56, "serpent", "Erratic", "Arc Coil", "", "A serpent of crackling arcs that zigzags across the sky during summer storms.");
  c("Galvanox", "electric", "epic", 84, 68, "golem", "Unstoppable", "Overcharge", "", "A storm-golem of lightning-fused sand. Its heart is a captured thunderbolt.");
  c("Kaelzar", "electric", "mythic", 98, 86, "dragon", "Tempestuous", "Skyfall", "", "The storm dragon who wears thunderheads like a cloak. Lightning strikes only where it permits.", { title: "the Storm Throne" });

  /* ---------- CELESTIAL · The Halo Reach ---------- */
  c("Twinklet", "celestial", "common", 14, 18, "sprite", "Wishful", "Wish Glow", "", "A tiny star-sprite that grants very small wishes, like finding a lost sock.");
  c("Moonmote", "celestial", "common", 18, 22, "blob", "Calm", "Moonlit Hush", "", "A soft, round moonbeam that glows brighter in quiet places.");
  c("Cometail", "celestial", "common", 26, 16, "bird", "Swift", "Streak", "", "A swallow with a comet's tail that races the sunrise every morning.");
  c("Haloping", "celestial", "common", 20, 24, "jelly", "Serene", "Halo Pulse", "", "A jellyfish of light drifting in the high clouds, ringing faintly like a bell.");
  c("Astralynx", "celestial", "uncommon", 50, 42, "quad", "Mysterious", "Starstep", "", "A lynx with constellations in its fur. It vanishes between one blink and the next.");
  c("Seraphawk", "celestial", "uncommon", 46, 44, "bird", "Devoted", "Radiant Wing", "", "A golden hawk that guides lost travelers home, flying ahead with a lantern-bright tail.");
  c("Solenne", "celestial", "epic", 74, 80, "sprite", "Radiant", "Dawnbreak", "", "A sun-spirit of living light who brings the first dawn after the longest night.");
  c("Nebulith", "celestial", "epic", 78, 74, "golem", "Enigmatic", "Stardust Storm", "", "A drifting giant made of nebula dust, with newborn stars spinning inside its chest.");
  c("Astraelis", "celestial", "mythic", 94, 94, "bird", "Eternal", "Rebirth Nova", "", "A phoenix that burns out every thousand years and is reborn as a brand-new constellation.", { title: "the Star Phoenix" });

  /* ---------- ICE · Rimeholt ---------- */
  c("Frostbun", "ice", "common", 16, 22, "quad", "Sweet", "Snow Burrow", "", "A snow rabbit with icicle ears that leaves tiny snowflake footprints.");
  c("Icicub", "ice", "common", 24, 26, "quad", "Clumsy", "Belly Slide", "", "A polar bear cub that slides everywhere on its belly and never quite learns how to stop.");
  c("Snowpuff", "ice", "common", 14, 20, "blob", "Fluffy", "Flurry", "", "A floating ball of fresh snow that sneezes tiny blizzards.");
  c("Shiverfin", "ice", "common", 22, 20, "fish", "Shivery", "Cold Snap", "", "A fish that swims beneath frozen lakes, tapping messages on the underside of the ice.");
  c("Crystalback", "ice", "uncommon", 40, 58, "bug", "Stoic", "Crystal Armor", "", "A beetle that grows perfect ice crystals along its back, one for every winter it survives.");
  c("Glacielle", "ice", "uncommon", 44, 46, "sprite", "Elegant", "Diamond Dust", "", "An ice-dancer spirit that skates on frozen air, leaving glittering trails.");
  c("Rimewing", "ice", "uncommon", 48, 40, "bird", "Bold", "Hailstorm", "", "A frost-feathered gull that rides blizzards like ocean waves.");
  c("Yetimaw", "ice", "rare", 70, 62, "golem", "Gruff", "Avalanche Slam", "", "A mountain yeti who is secretly gentle, carrying lost climbers back to their camps.");
  c("Glaciorn", "ice", "epic", 78, 84, "quad", "Unyielding", "Permafrost", "", "A crystal mammoth whose footsteps freeze rivers solid from bank to bank.");

  /* ---------- SHADOW · Duskveil ---------- */
  c("Nibbat", "shadow", "common", 22, 16, "bird", "Nocturnal", "Echo Ping", "", "A palm-sized bat that steals buttons and arranges them in tidy rows.");
  c("Gloomshroom", "shadow", "common", 18, 28, "blob", "Moody", "Gloom Spores", "", "A purple mushroom that sulks in dark corners and glows when ignored too long.");
  c("Hexpider", "shadow", "common", 26, 20, "bug", "Scheming", "Hex Web", "", "A spider that weaves webs of shadow-silk strong enough to catch dreams.");
  c("Phantomane", "shadow", "uncommon", 52, 40, "quad", "Haunting", "Night Gallop", "", "A phantom horse whose mane is smoke. Its hoofbeats make no sound at all.");
  c("Grinlurk", "shadow", "uncommon", 48, 44, "blob", "Mischievous", "Lurking Grin", "", "Only its enormous grin is visible in the dark. It is, apparently, just being friendly.");
  c("Umbraven", "shadow", "rare", 66, 52, "bird", "Ominous", "Raven's Omen", "", "A raven of pure shadow said to appear the night before a great change.");
  c("Voidmaw", "shadow", "rare", 70, 58, "jelly", "Hungry", "Devour Light", "", "A floating void that slowly eats candlelight, leaving only cold silence behind.");
  c("Wraithveil", "shadow", "epic", 84, 72, "sprite", "Sorrowful", "Veil of Night", "", "A cloaked wraith that keeps the memories lost things leave behind.");
  c("Nocthyrr", "shadow", "mythic", 97, 90, "dragon", "Silent", "Total Eclipse", "", "The shadow dragon who swallowed the sun once, centuries ago, and still remembers the taste.", { title: "the Eclipse" });

  /* ---------- EARTH · Grauldeep ---------- */
  c("Pebblet", "earth", "common", 16, 30, "golem", "Steady", "Rock Roll", "", "A small round stone with stubby legs that loves being skipped across ponds.");
  c("Burrowmole", "earth", "common", 22, 24, "quad", "Busy", "Tunnel", "", "A mole with crystal-tipped claws that digs maps into the hillsides.");
  c("Geodillo", "earth", "common", 18, 34, "quad", "Shy", "Geode Curl", "", "An armadillo that curls into a ball, revealing a sparkling geode inside its shell.");
  c("Claybit", "earth", "common", 24, 22, "blob", "Adaptable", "Reshape", "", "A lump of living clay that copies the shape of whoever it's standing next to.");
  c("Quarrox", "earth", "uncommon", 50, 56, "quad", "Headstrong", "Boulder Bash", "", "A rhinoceros with a horn of raw granite. It settles arguments by headbutting cliffs.");
  c("Sandwyrm", "earth", "uncommon", 46, 44, "serpent", "Elusive", "Quicksand", "", "A desert worm that swims through dunes, surfacing only to sunbathe.");
  c("Ambercroc", "earth", "uncommon", 44, 54, "quad", "Patient", "Amber Trap", "", "A crocodile with amber scales, each holding a tiny ancient insect.");
  c("Terrashell", "earth", "rare", 56, 74, "quad", "Ancient", "Mountain Shell", "", "A giant tortoise carrying a small mountain — complete with goats — on its back.");
  c("Prismagon", "earth", "rare", 66, 62, "golem", "Glittering", "Prism Shard", "", "A golem of living crystal that splits sunlight into blinding rainbows.");

  /* ---------- WIND · Zephyr Steppes ---------- */
  c("Puffwing", "wind", "common", 14, 18, "bird", "Carefree", "Updraft", "", "A cloud-fluff chick that has never once landed on purpose.");
  c("Whirlit", "wind", "common", 20, 16, "sprite", "Dizzy", "Spin", "", "A tiny tornado spirit that spins until it falls over, then giggles.");
  c("Breezeling", "wind", "common", 18, 22, "quad", "Breezy", "Tailwind Dash", "", "A long ferret that rides gusts through the air like a ribbon.");
  c("Kitebug", "wind", "common", 22, 16, "bug", "Daring", "Glide", "", "A dragonfly with kite-shaped wings. Children fly it on strings, and it doesn't mind one bit.");
  c("Griffling", "wind", "uncommon", 50, 40, "bird", "Competitive", "Gale Force", "", "A griffin chick that races cloud ships for sport and usually wins.");
  c("Zephyrine", "wind", "uncommon", 44, 42, "serpent", "Graceful", "Zephyr Ribbon", "", "A silk-scaled sky serpent that dances above the steppes on festival days.");
  c("Skyhorn", "wind", "rare", 64, 56, "quad", "Untamed", "Sky Gallop", "", "A winged ibex that grazes on mountaintops high above the clouds.");
  c("Vortexa", "wind", "rare", 68, 52, "jelly", "Chaotic", "Vortex", "", "A living cyclone with a single calm eye that watches everything.");
  c("Stratoroc", "wind", "epic", 82, 72, "bird", "Majestic", "Jetstream", "", "A colossal roc whose wingspan shades whole villages as it passes overhead.");

  /* ---------- ARCANE · The Glyphspire ---------- */
  c("Runeling", "arcane", "common", 18, 22, "sprite", "Studious", "Glyph Spark", "", "A floating rune that changes its own shape every time it learns a new word.");
  c("Spellmite", "arcane", "common", 22, 18, "bug", "Curious", "Mana Nibble", "", "A beetle that eats leftover magic and glows the color of the last spell it ate.");
  c("Tomeling", "arcane", "common", 16, 26, "blob", "Bookish", "Page Flurry", "", "A living spellbook that bites anyone who dog-ears its pages.");
  c("Prismouse", "arcane", "common", 24, 16, "quad", "Quick", "Prism Dash", "", "A mouse of shifting rainbow light that slips in and out of mirrors.");
  c("Hexacorn", "arcane", "uncommon", 48, 46, "quad", "Enchanting", "Sixfold Hex", "", "A unicorn with six horns, each one holding a different spell.");
  c("Orbiton", "arcane", "uncommon", 40, 52, "golem", "Watchful", "Orbital Ward", "", "A floating crystal orb ringed by tiny moons that orbit faster when it's alert.");
  c("Mimicrest", "arcane", "uncommon", 46, 48, "blob", "Tricky", "Mimic", "", "A treasure chest with far too many teeth. It is extremely proud of its collection.");
  c("Manawyrm", "arcane", "rare", 70, 58, "serpent", "Enigmatic", "Mana Surge", "", "A serpent of pure spell-light whose scales are written in a forgotten language.");
  c("Chronolith", "arcane", "epic", 80, 80, "golem", "Timeless", "Time Fold", "", "A clockwork-crystal sentinel that guards a door to yesterday.");


  /* ---------- 101–120: Mythic Legends (myth & folklore creatures) ---------- */
  c("Hexling", "arcane", "common", 20, 18, "witch", "Eager", "Wobbly Hex", "", "An apprentice witch who has nearly mastered her broom. She has definitely not mastered landing.");
  c("Boolet", "shadow", "common", 14, 22, "ghost", "Bashful", "Peekaboo", "", "A tiny bedsheet ghost who haunts libraries and gets scared every time someone turns a page.");
  c("Grimalkyn", "shadow", "common", 24, 16, "quad", "Smug", "Familiar's Curse", "", "A witch's cat who wears her hat whenever she isn't looking, and casts better spells than she does.");
  c("Mawfin", "water", "common", 26, 18, "fish", "Hungry", "Lure Light", "", "A baby anglerfish whose glowing lure attracts snacks, sailors, and very confused fireflies.");
  c("Wrapscallion", "earth", "common", 18, 28, "golem", "Mischievous", "Unravel", "", "A pint-sized mummy from the buried tombs of Grauldeep. It leaves a trail of loose bandages everywhere it goes.");
  c("Cindrake", "fire", "common", 28, 20, "dragon", "Feisty", "Tiny Inferno", "", "A dragon hatchling no bigger than a cat. Its sneezes have burned down three haystacks and a very surprised scarecrow.");
  c("Tribark", "fire", "uncommon", 48, 40, "quad", "Loyal", "Triple Howl", "", "A three-headed hound pup who guards the gates of Mount Kael. Its three heads rarely agree on anything except dinner.");
  c("Banshriek", "wind", "uncommon", 46, 38, "ghost", "Mournful", "Wailing Gale", "", "A ghost whose cry rides the wind for miles. Sailors on the Zephyr Steppes plug their ears when the breeze starts to sing.");
  c("Ghastmire", "water", "uncommon", 40, 50, "ghost", "Gloomy", "Bog Grip", "", "A drowned spirit of the misty marshes, draped in pondweed. It only wants someone to help it find its lost boot.");
  c("Taurock", "earth", "uncommon", 54, 52, "golem", "Stubborn", "Labyrinth Charge", "", "A stone minotaur who guards a maze beneath Grauldeep and has never once gotten lost in it.");
  c("Basilix", "arcane", "uncommon", 50, 44, "serpent", "Regal", "Petrifying Gaze", "", "A crowned serpent whose stare turns things to stone. It wears tinted spectacles as a courtesy.");
  c("Kitsuna", "celestial", "rare", 64, 58, "quad", "Cunning", "Foxfire", "", "A nine-tailed fox spirit. Each tail holds a captured star, and it gains a new one every hundred years.");
  c("Sirensong", "water", "rare", 58, 62, "siren", "Enchanting", "Siren's Lullaby", "", "A siren who sings from the rocks of the Tidemere. Her songs calm storms, and occasionally sailors' tempers.");
  c("Bramblehag", "nature", "rare", 66, 56, "witch", "Cackling", "Cauldron Brew", "", "A swamp witch who brews potions in a cauldron older than the forest. Nobody knows what's in them, including her.");
  c("Lunarfang", "shadow", "rare", 72, 56, "golem", "Feral", "Moonrage", "", "A werewolf of Duskveil who transforms only under the full moon, and spends the other nights apologizing.");
  c("Mossdrake", "nature", "rare", 68, 60, "dragon", "Ancient", "Overgrowth Breath", "", "A sleepy forest dragon who hasn't moved in so long that a meadow grew across its wings.");
  c("Krakoth", "water", "epic", 86, 78, "kraken", "Ravenous", "Abyssal Grasp", "", "The kraken of the deep trenches. Ships that sail too far out sometimes return with suspicious tentacle-shaped dents.");
  c("Gravewarden", "earth", "epic", 80, 86, "ghost", "Vigilant", "Eternal Vigil", "", "The spectral armor of a knight who swore to guard the old kings' tombs and kept that oath long after death.");
  c("Hrimvald", "ice", "mythic", 95, 96, "dragon", "Wrathful", "Endless Winter", "", "The frost wyrm sleeping beneath Rimeholt's glaciers. When it wakes, winter lasts a hundred years.", { title: "the Frost Wyrm" });
  c("Aerovant", "wind", "mythic", 98, 88, "dragon", "Untamed", "Skybreaker Gale", "", "The great dragon of the open sky. It has never touched the ground, and the clouds part wherever it flies.", { title: "the Gale Dragon" });

  // Distinguishing features used by the illustration engine
  const FEATS = {
    Pyrrhavex: "",
    Hexling: "", Boolet: "", Grimalkyn: "cat hat", Mawfin: "angler", Wrapscallion: "mummy", Cindrake: "chibi", Tribark: "heads3",
    Banshriek: "banshee", Ghastmire: "bog", Taurock: "bull", Basilix: "coil crown runes", Kitsuna: "ninetails tufts", Sirensong: "", Bramblehag: "hag",
    Lunarfang: "werewolf", Mossdrake: "drake moss", Krakoth: "", Gravewarden: "knight", Hrimvald: "wyvern", Aerovant: "feathered",
    Petalfly: "butterfly",
    Shiverfin: "crystalfin",
    Fizzlefish: "eelfish",
    Moonmote: "crescent",
    Nocthyrr: "perched",
    Whirlit: "tornado",
    Twinklet: "star",
    Haloping: "halo",
    Driplet: "drop",
    Arcwyrm: "zigzag",
    Cindersnout: "heavy pigsnout roundears", Wickling: "candle", Scorchbeetle: "beetle glowspots", Blazehorn: "hoof ramhorns", Magmaw: "drips wide",
    Solarax: "raptor crest", Infernyx: "coil hood", Ignivore: "cat mane", Splashkin: "puffy", Shellby: "crab",
    Tidalope: "hoof horns", Coralisk: "eel", Abyssquid: "squid", Narwhalen: "tusk", Whirlhydra: "heads3", Thalassor: "leviathan",
    Sproutling: "sprout", Thistlehog: "rodent spikes roundears", Barkbear: "bear", Vinewyrm: "leaves", Mushgrove: "mushroom",
    Thornstag: "hoof antlers", Mantidra: "blades", Grovemother: "tree", Sparkit: "cat", Joltpop: "ball", Ampant: "",
    Boltusk: "heavy tusks", Voltaroc: "raptor crest", Galvanox: "bolts", Kaelzar: "lung", Cometail: "swallow",
    Astralynx: "cat tufts", Seraphawk: "raptor crest", Solenne: "rays", Nebulith: "nebula", Astraelis: "phoenix",
    Frostbun: "rabbit", Icicub: "bear", Snowpuff: "sleepy fluffy", Crystalback: "beetle crystals", Glacielle: "dancer",
    Rimewing: "gull", Yetimaw: "furry", Glaciorn: "heavy tusks trunk", Nibbat: "bat", Gloomshroom: "mushroom sleepy",
    Hexpider: "spider", Phantomane: "hoof mane", Grinlurk: "grin", Umbraven: "raven crest", Voidmaw: "void", Wraithveil: "cloak",
    Pebblet: "round", Burrowmole: "rodent longsnout noears", Geodillo: "rodent shell", Claybit: "lumpy", Quarrox: "heavy nosehorn",
    Sandwyrm: "worm", Ambercroc: "reptile longsnout spikes", Terrashell: "heavy shell mountain", Prismagon: "crystal",
    Puffwing: "chick", Breezeling: "long", Kitebug: "dragonfly", Griffling: "raptor", Zephyrine: "sky",
    Skyhorn: "hoof wings ramhorns", Vortexa: "cyclone", Stratoroc: "raptor crest", Prismouse: "rodent", Hexacorn: "hoof hexhorns",
    Orbiton: "orb", Mimicrest: "chest", Manawyrm: "coil runes", Chronolith: "clock crystals", Tomeling: "book", Runeling: "rune", Spellmite: "beetle glowspots"
  };

  // Fill defaults for the procedurally illustrated creatures
  const sizeBy = { common: "Small", uncommon: "Medium", rare: "Large", epic: "Huge", mythic: "Colossal" };
  for (const cr of list) {
    if (!cr.ability.text) cr.ability.text = "Signature move — full effect unlocks with battles.";
    cr.size = cr.size || sizeBy[cr.rarity];
    cr.power = cr.atk + cr.def;
    if (FEATS[cr.name]) cr.feat = FEATS[cr.name].split(/\s+/);
  }
  // Battle ability effects. Every creature gets a real effect and accurate card text.
  const FX_TEXT = {
    power: "Unleashes a massive strike for 1.8× damage.",
    burn: "Strikes and burns the foe for 3 turns.",
    buff: "Powers up: +30% Attack for the rest of the battle.",
    heal: "Restores 35% of its HP.",
    shield: "Raises a barrier that halves the next 2 hits.",
    drain: "Strikes and heals for half the damage dealt.",
    weaken: "Strikes and lowers the foe's Attack by 25% for 3 turns.",
    stun: "Strikes with a 50% chance to stun the foe for a turn.",
    freeze: "Strikes with a 50% chance to freeze the foe for a turn.",
    double: "Strikes twice in a flash (2 × 0.75 damage).",
    dodge: "Strikes, then dodges the next attack.",
    pierce: "Strikes straight through Defense, ignoring it."
  };
  const FX_BY_EL = {
    fire: ["burn", "buff", "power"], water: ["heal", "shield", "drain"], nature: ["heal", "weaken", "shield"],
    electric: ["stun", "double", "power"], shadow: ["drain", "weaken", "dodge"], celestial: ["heal", "pierce", "dodge"],
    ice: ["freeze", "shield", "power"], earth: ["shield", "buff", "power"], wind: ["double", "dodge", "power"], arcane: ["pierce", "weaken", "stun"]
  };
  const FOUNDER_FX = { 1: "buff", 2: "shield", 3: "heal", 4: "stun", 5: "dodge", 6: "freeze", 7: "weaken", 8: "power", 9: "double", 10: "pierce" };
  for (const cr of list) {
    const fx = FOUNDER_FX[cr.id] || (cr.rarity === "mythic" ? FX_BY_EL[cr.element][0] === "heal" ? "drain" : FX_BY_EL[cr.element][0] : FX_BY_EL[cr.element][(cr.id * 7) % 3]);
    cr.ability.fx = fx;
    cr.ability.text = FX_TEXT[fx];
  }
  window.FX_TEXT = FX_TEXT;
  window.CREATURES = list;
})();
