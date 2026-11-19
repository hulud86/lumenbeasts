# Lumen Beasts: Design Bible (v0.1)

*Formerly "Mythic Monsters." **lumenbeasts.com** was open to register on 18 Nov 2026 (checked through Wix). The game name is set in one place: `gameName` in `js/config.js`.*

**What the name means:** *lumen* is Latin for "light." In the story, Lumen is the moon that shattered, and every creature woke from one of its glowing shards. Lumen Beasts are the beasts of light, the beasts of Lumen.

---

## 1. Game concept and visual direction

**The pitch:** Long ago the moon **Lumen** shattered. Its shards fell across the ten elemental isles of the world **Vael**, and each shard woke a creature. Those creatures are the **Lumen Beasts**. Players are *Collectors* who open **Shard Packs** to find and catalogue all of them.

**The core loop (v1):**
1. Claim one free Shard Pack every 24 hours. New players get 3 welcome packs.
2. Tear the pack open and flip the 10 cards. Rare, Epic and Mythic cards glow through their backs before you flip them.
3. New creatures go into the Collection and the Encyclopedia. Duplicates turn into **Shard Dust**.
4. Achievements pay out bonus packs and Dust, and 120 Dust buys a bonus pack.
5. Come back tomorrow.

**Visual direction: "night-sky premium."** The setting is a deep midnight-indigo sky with drifting aurora and faint stars. The cards are the brightest thing on screen, like gems on velvet. The UI is quiet glass panels. All the color comes from creature art, element hues and rarity frames. Each card has three layers:
- **Frame:** a metallic border whose material shows the rarity.
- **Window:** an illustrated scene from the creature's home isle.
- **Text:** a glass panel with the ability, flavor text and stats.

**Art style for creatures:** bold, clean outlines, soft radial shading, big expressive eyes on the cute creatures, glowing slit eyes on the dangerous ones, and an elemental "accent" motif (flames, droplets, leaves, bolts, wisps, stars, crystals, rocks, swirls, runes) somewhere on every body. Founders #001–#010 set the target style.

## 2. Color palette and branding

| Role | Color | Hex |
|---|---|---|
| Ink (background) | Midnight | `#0B0D1F` |
| Panel | Indigo glass | `#171A42` at 72% |
| Primary accent | Shard Gold | `#FFC94A` → `#FF9A3D` |
| Secondary accent | Moon Cyan | `#7EF0FF` |
| Tertiary | Arcane Rose | `#FF6FD0` |
| Text / muted | | `#EEF1FF` / `#9AA3D6` |

**Rarity colors:** Common `#B9C3CF` (silver) · Uncommon `#5FD08A` (emerald) · Rare `#4AA8FF` (sapphire) · Epic `#B46CFF` (amethyst) · Mythic `#FFC94A` (gold, shifting to rainbow).

**Element colors:** Fire `#FF6A3D` · Water `#27B6EF` · Nature `#5CCF6A` · Electric `#FFD93B` · Shadow `#9A5CF0` · Celestial `#FFD27A` · Ice `#8FE3FF` · Earth `#D39A5C` · Wind `#7FE0C2` · Arcane `#FF6FD0`.

**Typography:** *Cinzel* (engraved, mythic) for the logo, card names and headings. *Nunito* (rounded, friendly, very readable at small sizes) for UI and card text. Both are free Google Fonts.

**Logo:** a faceted gold moon-shard with a cyan glow, then the wordmark LUMEN BEASTS in Cinzel Black with a gold gradient.

## 3. Card design

Every card is 5:7 (the real trading-card ratio) and built from one HTML/CSS component. All of its measurements scale with card width, so a thumbnail, a pack reveal and the inspector all look identical.

```
┌────────────────────────────┐  ← rarity frame (metal)
│ [Name            ] (elem) │  ← nameplate + element badge
│ ┌────────────────────────┐ │
│ │#001                    │ │  ← illustration window
│ │      illustration      │ │     (rarity-colored inner border)
│ └────────────────────────┘ │
│ Fire · Hearth Pup     ◆◆◇  │  ← type line + rarity gems (1–5)
│ ┌────────────────────────┐ │
│ │ Kindle — ability text  │ │  ← glass text box
│ │ italic flavor text…    │ │
│ └────────────────────────┘ │
│ ⚔28   SHARDFALL·001/100 🛡20│  ← Attack · set & collector number · Defense
└────────────────────────────┘
```

**Rarity treatments (each tier adds to the one below):**

| Rarity | Frame | Extras |
|---|---|---|
| Common | Brushed silver | None |
| Uncommon | Emerald metal | 2 gems |
| Rare | Sapphire metal + blue glow | Foil light sweep; glowing aura behind the creature |
| Epic | Amethyst + purple glow | Holographic rainbow layer that follows your pointer; light rays in the art |
| Mythic | Animated rainbow-gold border that rotates | **Full-art layout:** the art fills the card and text floats on glass; strongest holo; sparkle layer; a title line ("the Shard Sovereign") |

**Built so these can be added later:** alternate art (point a creature at a different image), special foil editions (a new CSS class that reuses the holo layer), and new sets (the set name and collector numbers come from config).

**Card back:** gold frame, indigo starburst, glowing moon-shard emblem, LUMEN BEASTS wordmark.

## 4. Interface structure

Five sections, reachable from the top nav on desktop and a thumb-friendly bottom tab bar on mobile:

1. **Home:** a hero panel (daily-pack status, a live countdown and a floating pack), stat tiles (completion ring, cards owned, packs opened, Dust, awards), recent discoveries, progress bars by element and by rarity, and the next three awards.
2. **Open Packs:** the foil pack (tap or "Tear it open"). It shakes, bursts, then deals 10 face-down cards. Tap to flip each one, or use **Reveal all**. Rare and better cards glow and pulse through their backs. Epic and Mythic pulls trigger a screen flash, particles, a banner and a chime. A results screen lists new cards, duplicates, Dust earned and newly unlocked achievements. "Trade Dust for a pack" and a published "Pack odds" panel sit under the pack.
3. **My Collection:** a card grid with search (name, ability or #number), element chips, a rarity filter, 7 sort orders, a ×N copies badge, and a "Show missing" toggle that mixes in silhouettes.
4. **Encyclopedia:** a numbered entry list next to a detail panel with the big card, attack and defense meters, ability, personality, size, home isle, lore and first-discovered date. Undiscovered entries show a silhouette with an elemental rim light and only their element and rarity, which keeps the hunt going. On mobile, tapping an entry opens it full-screen.
5. **Achievements:** 16 milestones with progress bars and **Claim** buttons. Badge counts appear on the nav when rewards are waiting.

The header always shows packs ready, Dust, and Settings (sound, back up or move your save, reset, and testing tools).

## 5. The first 10 creatures (the Founders, hand-illustrated)

| # | Name | Element | Rarity | ATK / DEF | Ability | Description |
|---|---|---|---|---|---|---|
| 001 | **Emberpup** | Fire | Common | 28 / 20 | *Kindle:* an ally gets +5 Attack next turn | A fox pup whose tail is a living campfire. It follows travelers home and curls up in hearths. |
| 002 | **Bubblot** | Water | Common | 16 / 30 | *Bubble Ward:* blocks the next 10 damage | An axolotl living inside a floating bubble it blew as a baby, drifting over the reefs and smiling at everything. |
| 003 | **Mossnook** | Nature | Common | 14 / 36 | *Overgrow:* heals 8 Defense each turn | A tiny tortoise carrying a whole garden: moss, mushrooms and one very proud sapling. |
| 004 | **Voltmoth** | Electric | Uncommon | 44 / 30 | *Static Dust:* 30% chance to stun | A moth drawn to lightning instead of lamplight. Its wings store static from storms. |
| 005 | **Lunowl** | Celestial | Rare | 52 / 58 | *Moonlit Gaze:* sees and dodges the next move | A starry owl with a crescent on its brow that spends its nights redrawing constellations. |
| 006 | **Rimefang** | Ice | Rare | 64 / 50 | *Frostbite Fang:* heavy bite + freeze | A frost wolf with a mane of living ice crystals. Its howl freezes waterfalls mid-air. |
| 007 | **Murkwick** | Shadow | Common | 24 / 18 | *Lure Light:* foe −6 Attack | A ghostly wisp in an old lantern that lures travelers off the path, then guides them home. |
| 008 | **Cragmaul** | Earth | Epic | 82 / 88 | *Fault Line:* damages every foe | A mountain-ape golem of granite and amber. Ancient light pulses through its cracks. |
| 009 | **Driftray** | Wind | Uncommon | 38 / 42 | *Tailwind:* allies act first | A manta ray that swims through the sky, leaving ribbons of breeze behind it. |
| 010 | **Aurelith**, *the Shard Sovereign* | Arcane | **Mythic** | 99 / 94 | *Shardstorm:* massive damage that ignores Defense | A crystal dragon born from the moon's heart. Every creature carries a sliver of its light. |

Each Founder also has a species name, a size, a personality and a lore line in `js/creatures.js`.

## 6. The 100-creature roster structure

**Ten elements × ten creatures**, one home isle per element:

| Element | Isle | Mythic |
|---|---|---|
| Fire | Kaelspire | Pyrrhavex, the Ember Crown |
| Water | The Tidemere | Thalassor, the Deep Tide |
| Nature | Verdant Hollow | — |
| Electric | Stormcrown | Kaelzar, the Storm Throne |
| Shadow | Duskveil | Nocthyrr, the Eclipse |
| Celestial | The Halo Reach | Astraelis, the Star Phoenix |
| Ice | Rimeholt | — |
| Earth | Grauldeep | — |
| Wind | Zephyr Steppes | — |
| Arcane | The Glyphspire | Aurelith, the Shard Sovereign |

**Rarity distribution (100 total):** 40 Common · 25 Uncommon · 18 Rare · 11 Epic · 6 Mythic. Every element has 4 Commons. Elements without a Mythic get an extra Uncommon or Epic instead.

**Stat bands** (ATK and DEF are each 0–100, with total power rising by tier): Common 14–36 · Uncommon 30–58 · Rare 48–74 · Epic 68–88 · Mythic 86–99.

**Creature families** keep the set from feeling repetitive. Each element mixes:
- **Small and cute:** pups, kits, blobs, sprites, bugs (mostly Common).
- **Companions:** beasts, birds, fish, serpents (Uncommon).
- **Rare beasts:** stags, falcons, wolves, golems.
- **Epic titans:** lions, hydras, tree-giants, mammoths, wraiths.
- **Mythic dragons and legends.**

The illustration engine has 10 body plans (blob, quadruped, serpent, bird, dragon, golem, sprite, fish, bug, jelly) plus about 40 feature parts (manes, antlers, ram horns, tusks, shells, mushroom caps, a spellbook, a mimic chest, a clock-face, nebula cores, cloaks…).

All 100 are written and playable in v0.1: names, stats, abilities, personalities and descriptions.

## 7. Technical plan

**Stack:** plain HTML, CSS and JavaScript. No framework, no build step, no server, no paid services.

| File | Job |
|---|---|
| `index.html` | Page shell |
| `css/style.css` | All visuals: the card system, rarity effects, layout, animation |
| `js/config.js` | **Every tunable number:** name, pack slots, drop rates, cooldown, Dust values, welcome packs, rarity and element colors |
| `js/creatures.js` | The roster. Add a creature with one line |
| `js/art.js` | Illustration engine: hand-drawn Founders + procedural creatures + silhouettes |
| `js/game.js` | Rules: saving, daily timer, pack generation, achievements (no UI code) |
| `js/ui.js` | Screens, routing (`#home`, `#packs`…), animations, sound |
| `tools/simulate.js` | Odds test: `node tools/simulate.js 200000` |

**Randomness:** the browser's cryptographic random generator. Packs never repeat a creature. Measured over 200,000 simulated packs, the bonus slot matched the 60/25/10/4/1 targets within 0.2 points.

**Saving:** `localStorage`, with a signature that detects hand-edited saves and shows a notice. If the device clock is set backwards, the daily pack is held until real time catches up. Settings has an export/import code so players can move devices by hand.

**Honest limits of browser-only storage:**
- Clearing browser data or using private mode erases progress.
- No automatic sync across devices; the export code is the workaround.
- Anyone comfortable with developer tools can edit their save or skip the timer. The signature catches casual edits but isn't real security. Real protection needs a server, which only matters once trading or leaderboards exist.

**Hosting:** GitHub Pages (free, HTTPS, custom domain support). Wix is the weaker fit here. It's built around its page editor rather than hand-written game code, and connecting your own domain or removing Wix ads needs a paid Wix plan. GitHub Pages serves these files exactly as written, for free.

**Future path (each step reuses this code):**
1. **Painted art:** drop `assets/art/011.webp` and set `img` on that creature. The engine uses it automatically.
2. **Accounts + cloud saves + sync:** add Supabase or Firebase (both have free tiers). `game.js` load/save is the only code that changes. Packs would then be rolled on the server so they can't be faked.
3. **Trading, battles, events:** abilities and ATK/DEF are already on every card. Events can be a second pack type in config with different weights.
4. **New sets:** a second `creatures` file plus a set picker.
