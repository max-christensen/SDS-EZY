<p align="center">
  <img src="public/favicon.svg" alt="SDS EZY" width="96">
</p>

# SDS EZY

SDS EZY is a chemical register with a hazard risk assessment for each chemical. It makes a job nobody wants to do easy: someone uploads a safety data sheet (SDS), the app reads it, drafts the risk assessment and adds the lot to the register. It runs entirely on Cloudflare (a Worker for the code, D1 for the database, R2 for the PDFs), so there is no server to look after.

It is built for people who work out on other people's sites as well as in a workshop: products are mostly kept in vehicles and come out at the point of use, and that is when the SDS and the risk assessment need to be at hand. It works best on a phone.

It does one job: **the chemical register and the risk assessment for each chemical.** Work instructions, SOPs, JSEAs and SWMS are out of scope; they belong in a different product.

## Important: read this first

> The safety data sheet (SDS) information and risk assessments in this register are prepared from the supplier's safety data sheet. They are a guide and a starting point.
>
> Your business should review every assessment to make sure it is correct for your own workplace.
>
> It is always the worker's responsibility to do their own risk assessment, use the chemical the way the manufacturer intends, and be familiar with the SDS and the assessment before using it.
>
> Use this register together with your business's own SOPs, JSEAs and SWMS where they are required.
>
> If anything here is different from the supplier's current SDS, the supplier's current SDS is the authority.

The app shows this on the register, the chemical and assessment pages, every printed assessment, the manifest, every export and the first-run welcome. The wording lives in one file, [public/disclaimer.js](public/disclaimer.js), so it can be changed everywhere at once; this README carries a copy, so keep the two in step. **A lawyer should review the final wording before you rely on it.**

## What it does

- **Upload an SDS and you're done.** Pick the PDF. Your browser reads the text out of it (so the Worker spends no time parsing PDFs), you answer five quick questions the SDS can't answer (where and how it is used, whether it is sprayed, roughly how much is held, how long people are exposed, how well ventilated the area is), and an AI turns the lot into a chemical record, an SDS record and a drafted assessment. They go straight into the register. There is no approval step and no reviewer field.
- **Checked against the PDF.** Anything that has to be exact (UN number, packing group, Hazchem code, dangerous goods class, CAS numbers, dates, poison schedule, emergency phone) is checked against the text of the PDF. If it isn't in the text it is left blank and flagged "not found in the SDS text, check". The classification is checked the same way: a class whose hazard statement isn't in the SDS text is dropped and flagged, and a hazard statement in section 2 that the AI missed is added and flagged. ADG class, UN number and packing group stay as separate fields, because the SDS carries them. The risk level is **Uncertain** unless the SDS and the answers clearly support another level.
- **If the AI isn't set up, or fails, the upload still works.** The entry is created with the PDF attached and an empty draft assessment for the admin to complete by hand.
- **Review-due home screen.** SDS past or near their five-year review, chemicals with no SDS, chemicals with no decision.
- **Classified from the Safe Work Australia poster.** Each chemical's GHS hazard classes and categories are read from SDS section 2 and checked against the hazard statements (H-codes) in the SDS text. The pictograms, the signal word and the hazardous or not hazardous decision are **derived from that classification** using a table built from the poster, with the nine official GHS pictograms. An admin can override a derived pictogram or decision, and an override is always shown. A product carrying none of the classifications is non-hazardous.
- **Registers.** The full register, the hazardous chemicals register, and a manifest. The manifest totals stored quantities for each of the **43 placard and manifest items** in Schedule 11 of the WHS Regulations **per place** (never across the whole business), shows each total against the placard quantity and the manifest quantity, and flags clearly when a place goes over either one (and when it is near). Quantities are worked out by GHS hazard class and category, not by dangerous goods class.
- **A page for each chemical** with its SDS, its classification and the official GHS pictograms, the one-page assessment, the places it is kept with quantities (litres or kilograms), SDS version history, and a printable QR label for cabinets that opens the chemical's page after login.
- **One SDS, many products.** A sheet that covers ten products (or four pack sizes) is stored once and linked to each product. A newer SDS replaces the current one and the old one is kept as history.
- **Non-hazardous chemicals** that have been checked stay on the list with that decision recorded, and don't need a full assessment.
- **Places.** A place is a workshop or depot, a vehicle (with a registration number) or a site. A chemical is kept at one or more places, with an optional quantity. The admin creates, edits and archives places; archived places drop off the active lists but stay on record. Chemicals are not tracked moving between places. Each place has a "counts toward the placard and manifest totals" setting: on for workshops, depots and sites, **off for vehicles** (see the open point below).
- **Pick your place and go.** After signing in, a user picks where they are working (for example "Ute 2"). The app remembers it on that phone and shows that place's chemicals first, with the SDS and the assessment one tap away. Each place has a printable QR label that opens its chemical list after sign-in.
- **Job packs.** Anyone signed in can pick a place (or tick chemicals directly), enter the client or site name, a job reference and the date, and get one print-ready PDF built in the browser: a cover page (company details, client or site, date, the list of chemicals and anything that is missing), a register page, then each chemical's assessment followed by its SDS, with the disclaimer on the pages. They can also get a zip of the SDS PDFs. A chemical with no SDS or no assessment is listed on the cover and gets a placeholder page, never left out. Nothing is saved on the server, so it needs no write permission. Many PCBUs ask for these before work starts.
- **On the phone, with or without a signal.** The app can be installed to the home screen. "Save this place for offline" stores that place's chemical pages, assessments and SDS PDFs on the phone and shows when it was last updated, so they open with no signal. Offline is read-only; an upload needs a signal and says so. Signing out clears the saved data. See [docs/OFFLINE.md](docs/OFFLINE.md).
- **Take-it-with-me exports for sites with no internet** (built in the browser, both roles): an Excel file of the register and manifest; one print-ready PDF of the whole register, the manifest, and each assessment followed by its SDS; and a zip of all the SDS PDFs named by product.
- **One-time import** from a spreadsheet (admin).

## Who can do what

There are only two roles, and the Worker enforces them (the screens just match):

| | Admin | User |
|---|---|---|
| Search and read the register, open any SDS, read any assessment | yes | yes |
| Print and export | yes | yes |
| Pick my place, save a place for offline, build a job pack | yes | yes |
| Upload an SDS | yes | yes (limited, see below) |
| Edit or delete anything, including their own uploads | yes | no |
| Create, edit and archive places; link chemicals to places and set quantities | yes | no |
| Business details, branding, users, options, imports, settings, AI setup | yes | no |

Because a user can write (by uploading), the upload has guards: PDF only (checked by content, not just the name), a file size cap (15 MB by default), a limit per login per hour (10 by default), and a duplicate check, so uploading an SDS that already exists is offered as a newer version of it and never makes a second copy. The admin can change the size cap and hourly limit in **Settings**.

## Reference data and credits

The hazard classification table, the placard and manifest quantities (Items 1 to 43 of Schedule 11) and the pictogram descriptions come from material published by **[Safe Work Australia](https://www.safeworkaustralia.gov.au)**: the poster *Classification and labelling for workplace hazardous chemicals*, the table *Placard and manifest requirements under the model WHS Regulations*, and its *GHS pictograms for hazards* page. They are reproduced as reference data to help a business keep its register; the WHS Regulations, your regulator and the supplier's current SDS are the authority. [docs/REFERENCE.md](docs/REFERENCE.md) lists the sources and every place where the documents are unclear and we took the cautious reading rather than guess (a product in more than one item, kilograms against litres, spill compounds, and so on).

The nine GHS pictogram images in `public/pictograms/` are used unchanged. Their origin and usage terms are not recorded in the files: **check the terms of the site they came from before publishing** (see docs/REFERENCE.md).

### Open points to confirm with Safe Work Australia or your regulator

Two things in the app are **our understanding, not something the Safe Work Australia documents state**, and must be confirmed before you rely on them (they are recorded in [docs/REFERENCE.md](docs/REFERENCE.md)):

1. **Vehicles are not counted.** The app treats a vehicle as a place that does not count towards the placard and manifest totals, and says so on the vehicle's page and the manifest: "Products in transit fall under the transport rules and are not counted here." Whether that is right (for example when a vehicle is parked at a depot or a site) must be confirmed. An admin can switch counting on for a vehicle.
2. **Totals are per place.** Each place that counts is treated as its own workplace. That reading must also be confirmed.

## What you need

- A free [Cloudflare account](https://dash.cloudflare.com/sign-up).
- [Node.js](https://nodejs.org) 20 or newer, to run the setup commands.
- R2 may ask you to add a payment method before you switch it on, even though normal use stays inside the free allowance.
- For reading SDS PDFs with AI, one of: Cloudflare's own **Workers AI** (no setup, the default), or your own key for **Claude**, **OpenAI** or **Gemini**.

## Set it up

1. Get the code and install it:
   ```
   git clone <this repository's URL> sds-ezy
   cd sds-ezy
   npm install
   npx wrangler login
   ```
2. Copy the config template. `wrangler.toml` is git-ignored because it holds your own IDs:
   ```
   cp wrangler.template.toml wrangler.toml
   ```
3. Create the database and the file bucket. The names below are the ones the template already uses:
   ```
   npx wrangler d1 create sds-ezy-db
   ```
   This prints a `database_id`. Open your new `wrangler.toml` and replace `REPLACE_WITH_YOUR_DATABASE_ID` with it. (If Wrangler offers to add the binding to your config for you, say no; it's already there.)
   ```
   npx wrangler r2 bucket create sds-ezy-files
   ```
4. Deploy:
   ```
   npm run deploy
   ```
   This first loads the database tables from [schema.sql](schema.sql) into your D1 database (safe to repeat), then deploys the Worker. Wrangler prints your address, something like `https://sds-ezy.<your-subdomain>.workers.dev`.
5. **Optional: secrets** for extra protection, and your AI choice. See [Optional secrets](#optional-secrets) and [Choosing the AI](#choosing-the-ai). If you want a setup key, set it before you open the app for the first time.

## First run

1. Open your address. On the login screen click **First time setting this up? Create the admin account**.
2. Enter your name, email and a password (8 or more characters). If you set a `SETUP_KEY` secret, the form also asks for it. This only works once; after the first admin exists it is disabled.
3. You land on a short welcome page that shows the disclaimer, then on **Settings**: enter your company name, address, phone, email and ABN or other registration number, upload your logo and choose your colours. These show in the header, on the login screen and on printed pages.
4. In **Users**, add the people who will upload or look things up. Give them the role **User** (read-only plus upload) or **Admin**.
5. In **Places**, add your workshop or depot, your vehicles (with their registrations) and any regular sites. People then pick their place when they sign in.
6. Upload your first SDS from **Upload SDS**, or bring your existing register in with **Import**.

The in-app **Help** page explains each screen in plain language.

## Choosing the AI

In **Settings → AI** the admin picks who reads the safety data sheets:

- **Cloudflare Workers AI (the default).** Nothing to set up: it uses the `AI` binding in `wrangler.toml`. Workers AI is metered on Cloudflare's side, so check its [pricing and free allowance](https://developers.cloudflare.com/workers-ai/platform/pricing/).
- **Claude, OpenAI or Gemini**, with your own key. Choose the provider, optionally change the model, and add the key.

The AI key stays in the Worker and is never sent to a browser. The most careful way is to set it as a Worker secret, which wins over anything saved in the app:
```
npx wrangler secret put ANTHROPIC_API_KEY    # Claude
npx wrangler secret put OPENAI_API_KEY       # OpenAI
npx wrangler secret put GEMINI_API_KEY       # Gemini
```
Alternatively an admin can paste a key into Settings. It is then stored encrypted in your database (encrypted with a key derived from `SESSION_SECRET`, or from the generated session key if you haven't set one), and the screen only ever says that a key is set. Use the **Test** button to check the setup. Models change often; the model name is a setting, so you can update it without a redeploy.

The AI is asked for one fixed JSON structure, and the Worker validates it strictly. Whatever the AI says, it is a draft: always review it.

## Optional secrets

SDS EZY works with no secrets set. These add protection:

- **`SETUP_KEY`**: a one-time password you choose. When set, creating the first admin needs it, so nobody else can claim the admin account if they find your address first. Set it before you first open the app.
- **`SESSION_SECRET`**: a long random string that signs login sessions, for example from `openssl rand -hex 32`. When it isn't set, SDS EZY generates a random key on first use and stores it in your database; sessions are equally secure, but the key lives in the database.

```
npx wrangler secret put SETUP_KEY
npx wrangler secret put SESSION_SECRET
```
You can also set them in the Cloudflare dashboard under **Workers & Pages → sds-ezy → Settings → Variables and Secrets** (as secrets).

## Two-factor login (optional)

When a Resend API key is present, logging in is a two-step process: the person enters their password, then a 6-digit code is emailed to them. The code is valid for about 10 minutes and allows 5 wrong guesses. After the code, a session lasts 30 days. Without a key, password login alone is used.

1. Create a Resend account and an API key with sending access.
2. In Resend, **add and verify a domain** you control. Until a domain is verified, Resend only delivers to your own Resend account address, which is fine for a quick test but not for a team. **Every deployer needs their own Resend account and domain.**
3. In your `wrangler.toml`, change `MAIL_FROM` under `[vars]` to an address on that domain, for example `"Acme Chemicals <login@yourdomain.com>"`.
4. Store the key as a secret, then redeploy so `MAIL_FROM` takes effect:
   ```
   npx wrangler secret put RESEND_API_KEY
   npm run deploy
   ```

Admins can switch the code step off and on in **Settings**. **If the code email stops working and you are locked out**, remove the key so password login takes over, then fix your Resend setup: `npx wrangler secret delete RESEND_API_KEY`.

## Read-only demo (optional)

The same code can run as a public, read-only demo. Set the plain variable `DEMO_MODE` to `1`, and `DEMO_ADMIN_EMAIL` and `DEMO_USER_EMAIL` to two accounts; the login screen then offers one-click demo logins, and **every change is refused for everyone**, including the demo admin and the demo user (uploads too). A seeded demo for a made-up business (about 65 chemicals with generated, clearly fictional SDS PDFs, a few overdue for review, assessments at every risk level) is built by `npm run demo:build`. [docs/DEMO.md](docs/DEMO.md) explains how to load it into a **separate** demo database and bucket. Never point a demo at your real data.

## Running it locally

```
cp .dev.vars.example .dev.vars     # optional: it works with no secrets, so you can skip this
npm run db:init:local
npm run dev
```
The app is then at http://localhost:8787. Local data, including uploaded PDFs, is kept in the `.wrangler/` folder, which is git-ignored. To try it with the demo data: `npm run demo:build` then `npm run demo:seed:local`.

**Workers AI is not simulated locally.** With the `[ai]` block in `wrangler.toml`, `wrangler dev` sends AI calls to Cloudflare's real service (and may be charged). To stay fully local, remove the `[ai]` block from your local config; uploads then use the no-AI draft path, or you can point `OPENAI_BASE_URL` at a local stand-in. The `.dev.vars` file is git-ignored; never commit it.

The app installs a service worker (for the home-screen app and offline reading) that caches the app files. After editing files in `public/` while developing, unregister it in your browser's developer tools (Application, Service Workers) or the page may show old code. `npm run deploy` bumps the cached version automatically (`npm run predeploy`), so a new deploy replaces the old files on every phone.

Run the tests with `npm test` (Node 22.13 or newer, because some use Node's built-in SQLite). Some of them talk to a running local server and skip themselves, with a message, if there isn't one (each file says how to start it).

## Updating

```
npm run deploy
```
There is no downtime and no server to restart. If a newer version changes the database tables, its release notes will say what to run. To keep a backup of your data: `npx wrangler d1 export sds-ezy-db --remote --output=backup.sql` (the PDFs are in the `sds-ezy-files` bucket).

## Notes for contributors

- The architecture and API are described in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md); the AI reading in [docs/AI.md](docs/AI.md). The Worker is in [src/](src/), the front end in [public/](public/) (no build step), the browser libraries in [public/vendor/](public/vendor/) (refresh with `npm run vendor`; licences in `public/vendor/LICENSES.txt`).
- `schema.sql` runs on every deploy, so it must stay re-runnable: `CREATE ... IF NOT EXISTS` and `INSERT OR IGNORE`. It never alters a table that already exists, so changing an existing table needs a separate migration.
- **Keep D1 reads low.** Every column used in a `WHERE`, `JOIN` or `ORDER BY` has an index. The review list, the registers and search read only the `chemicals` table, which carries summary copies of the current SDS and assessment (kept in step by `refreshChemicalSummary`). Long lists (SDS history, assessment history, the other products on a shared SDS) load on demand. `node scripts/measure-rows.mjs` re-measures against a local server started with `--var DEBUG_ROWS:1`.
- Dates in the browser must be built from the local year, month and day, never from `toISOString()`, or users east of UTC see everything a day early.
- Role rules live in one table in [src/index.js](src/index.js). Add new write routes as admin-only; the only user-allowed writes are the two upload routes.
- Your own real example data (spreadsheets, assessment documents, real SDS PDFs) belongs in `seed-local/`, which is git-ignored because it can contain real names and phone numbers.
- `node scripts/answer-key.mjs` compares the AI reading with a set of completed assessments you supply in `seed-local/`, and reports how many fields match. It writes its reports only under `seed-local/`.

## Cost

At the size SDS EZY is built for (a workshop or a small business, up to a few hundred chemicals), the Cloudflare parts should fit inside the free plans: Workers, D1 and R2 each have a free allowance, and Cloudflare can change those limits whenever it likes. Workers AI has its own allowance and price; Claude, OpenAI and Gemini bill your own account per use. Reading one SDS is one AI call, so a normal register costs very little to build.

The D1 free limit that matters is rows read per day. Measured against a local database, as rows read per request (the sign-in figure is the second and later logins; the first also reads the settings):

| Request | Demo data (66 chemicals, 4 active places, full assessments) | Synthetic 600 chemicals (3 places, no assessments) |
|---|---|---|
| Sign in | 2 to 5 | 2 |
| Place picker (the list of places) | 6 | 4 |
| A place page: 15 chemicals / 62 chemicals | 33 / 127 | 43 (20 chemicals) |
| Job pack data: 17 chemicals / 30 chemicals | 513 / 887 | 137 (10) / 413 (30) |
| Review-due home screen | 16 | 353 |
| Register (all chemicals) | 67 | 1,101 |
| Hazardous register | 102 | 516 |
| Search | 67 | about 600 |
| A chemical page | 26 | 9 |
| Manifest (every place that counts, totalled for the 43 items) | 232 | 936 |
| Take-away export data (everything, once per export) | 2,487 | 6,185 |

A place page and a job pack read only the chemicals they name (by primary key), so they cost about the same however large the register is. A pack costs about 14 to 30 rows per chemical, because each one brings its SDS, its assessment and the assessment's controls. The place picker reads only the small places table, so it is cheap on every app start.

If a daily limit is ever reached, the app shows errors until the limits reset at midnight UTC, and it does not start charging. Check the current limits on each provider's pricing page, including Cloudflare's for [Workers](https://developers.cloudflare.com/workers/platform/pricing/), [D1](https://developers.cloudflare.com/d1/platform/pricing/) and [R2](https://developers.cloudflare.com/r2/pricing/).

## Licence

MIT. See [LICENSE](LICENSE). The browser libraries in `public/vendor/` keep their own licences, reproduced in `public/vendor/LICENSES.txt`.
