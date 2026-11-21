# Lumen Beasts

A free-to-play fantasy creature collecting card game that runs entirely in the browser. Open a free Shard Pack every day and collect 120 original creatures across ten elemental isles.

- **Play locally:** double-click `index.html`. No install or server needed.
- **Design bible:** see [`DESIGN.md`](DESIGN.md).

## Put it online with GitHub Pages (free)

1. Sign in to GitHub and create a **new public repository** named `lumenbeasts` (don't add a README).
2. On the new repo's page, click **"uploading an existing file"**. Drag in **everything inside this folder** (`index.html`, `css/`, `js/`, `tools/`, `assets/`, `.nojekyll`, `README.md`, `DESIGN.md`). `index.html` must sit at the top level, not inside another folder. Click **Commit changes**.
3. Go to **Settings → Pages**. Under *Build and deployment*, set **Source: Deploy from a branch**, **Branch: `main`**, folder **`/ (root)`**, and **Save**.
4. After about a minute, your game is live at **`https://<your-username>.github.io/lumenbeasts/`**. The URL also appears at the top of the Pages settings screen.

To update the game later, upload the changed files the same way. GitHub Pages republishes automatically.

### Use your own domain (optional)

1. Register the domain (e.g. `lumenbeasts.com`) at any registrar.
2. In the repo: **Settings → Pages → Custom domain** → enter `lumenbeasts.com` → **Save**. GitHub adds a `CNAME` file for you.
3. At your registrar's DNS settings, add:
   - Four **A** records for `@` pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - A **CNAME** record for `www` pointing to `<your-username>.github.io`
4. Once DNS updates (minutes to a few hours), tick **Enforce HTTPS** on the Pages screen.

## Before launch

- Set `devTools: false` in `js/config.js`. This removes the "grant test pack" button from Settings.
- Optionally rename the game with `gameName` in `js/config.js`.

## Tuning the game

Everything adjustable is in **`js/config.js`**: pack slots, bonus-slot odds, daily cooldown, welcome packs, Dust per duplicate, and Dust cost of a bonus pack. Check the odds after a change:

```
node tools/simulate.js 200000
```

(or use Settings → Testing tools → "Run odds test" in the browser).

## Adding creatures or real artwork

- **New creature:** add a `c("Name", "element", "rarity", atk, def, "form", "Personality", "Ability", "Ability text", "Description")` line in `js/creatures.js`. It gets the next ID and a generated illustration.
- **Painted artwork:** save the image as `assets/art/011.webp` (200×160 aspect, e.g. 800×640), then add `{ img: "assets/art/011.webp" }` as the last argument for that creature. The game uses the file instead of the generated art.

## Save data

Progress is always stored in the browser's local storage. Players who sign in (Google or an account code) also get **cloud saves** that follow them between devices. The API lives in `worker/` (Cloudflare Worker + D1) and deploys automatically. One-time setup: see **CLOUD-SETUP.md**. Until it's set up, the cloud button stays hidden and everything works offline as before. Players can also make a manual backup code in **Settings**.
