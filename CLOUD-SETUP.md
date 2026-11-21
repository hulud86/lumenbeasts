# Cloud saves — one-time setup

Players can sign in with **Google** (or an **account code** if they don't use Google) and their
collection saves online and follows them between devices. Until the steps below are done the
game works exactly as before and the cloud button stays hidden.

How it fits together:

- `worker/` is a small Cloudflare Worker (the API) with a D1 database for accounts and saves.
- `.github/workflows/deploy-api.yml` deploys it whenever `worker/` changes, creates the database
  on the first run, and writes the API address into `js/cloud-config.js` for you.
- `js/cloud.js` is the sign-in screen and automatic syncing in the game.

You only need to do three things: create a Cloudflare token, create a Google sign-in key, and
paste both into GitHub. About 15 minutes.

---

## 1. Cloudflare (free)

1. Sign up at **dash.cloudflare.com** (or log in).
2. In the left menu open **Workers & Pages**. If it asks you to pick a `workers.dev` subdomain,
   choose one (anything is fine, e.g. `hulud86`). The API will live at
   `lumenbeasts-api.<your-subdomain>.workers.dev`.
3. Copy your **Account ID**. It's shown under *Account details* on the Workers & Pages page,
   and it's also the long code in the address bar right after `dash.cloudflare.com/`.
4. Create an API token:
   - Click your profile icon (top right) → **My Profile** → **API Tokens** → **Create Token**.
   - Next to **Edit Cloudflare Workers**, click **Use template**.
   - Under *Permissions*, click **+ Add more** and add: **Account** · **D1** · **Edit**.
   - *Account Resources*: your account. *Zone Resources*: All zones (the template needs it).
   - **Continue to summary** → **Create Token** → copy the token. (It's only shown once.)

## 2. Google sign-in key (free)

1. Go to **console.cloud.google.com** and create a project called `Lumen Beasts`.
2. Open **APIs & Services → OAuth consent screen** (it may be called **Google Auth Platform**).
   Click **Get started** and fill in:
   - App name: `Lumen Beasts`, support email: your email.
   - Audience: **External**. Contact email: your email. Agree and **Create**.
3. Under **Audience**, click **Publish app** so anyone can sign in (not just test users).
   Lumen Beasts only asks for name and email, so Google doesn't need to review it.
4. Open **Clients** (or **Credentials**) → **Create client**:
   - Application type: **Web application**, name: `Lumen Beasts web`.
   - **Authorized JavaScript origins** → add `https://hulud86.github.io`
     (and `http://localhost:8000` if you test locally). Leave *redirect URIs* empty.
   - **Create**, then copy the **Client ID** (ends in `.apps.googleusercontent.com`).
     The client ID isn't secret; it's fine for it to be public.

## 3. Paste them into GitHub

In the **lumenbeasts** repo: **Settings → Secrets and variables → Actions**.

| Tab | Name | Value |
| --- | --- | --- |
| Secrets → New repository secret | `CLOUDFLARE_API_TOKEN` | the token from step 1.4 |
| Secrets → New repository secret | `CLOUDFLARE_ACCOUNT_ID` | the account ID from step 1.3 |
| Variables → New repository variable | `GOOGLE_CLIENT_ID` | the client ID from step 2.4 |

Then open the **Actions** tab → **Deploy cloud save API** → **Run workflow**.
When it finishes (about a minute) it commits the API address to `js/cloud-config.js`, GitHub
Pages republishes, and a cloud icon appears next to the settings gear in the game.

---

## When you buy lumenbeasts.com

- Google console → your web client → add `https://lumenbeasts.com` (and `https://www.lumenbeasts.com`)
  to **Authorized JavaScript origins**.
- The API already accepts requests from lumenbeasts.com (`ALLOWED_ORIGINS` in `worker/wrangler.toml`).
- Optional: give the API a nicer address. In Cloudflare open the `lumenbeasts-api` worker →
  **Settings → Domains & Routes → Add → Custom domain** → `api.lumenbeasts.com`. Then add a repo
  variable `API_URL` = `https://api.lumenbeasts.com` and re-run the workflow.

## Good to know

- **Cost:** Workers and D1 free plans comfortably cover a game this size.
- **What's stored:** each account's save, plus the Google name/email for Google sign-ins. Session
  tokens and account codes are stored only as hashes.
- **Two devices at once:** every save has a version number. If two devices change the collection
  between syncs, the player is asked which one to keep instead of one silently overwriting the other.
- **Cheating:** the game still runs in the browser, so a determined player could edit their own save.
  That's fine for a free game. Before selling packs, move pack opening onto the server (next step).
- **Testing the API locally:** `cd worker && npm ci && npx wrangler d1 migrations apply lumenbeasts --local && npx wrangler dev --local`,
  then `node test/run.mjs` (API flows) and `node test/google.mjs` (Google token checks).
