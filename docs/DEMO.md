# SDS EZY demo

A read-only demo register for a made-up business, **Tallowood Joinery & Maintenance Pty Ltd** (a small joinery, workshop
and building maintenance company). Everything is fictional: the company, its address (`Sampleton NSW 2999`), phone numbers
(`(02) 5550 0100`, `1800 555 01xx`), e-mail addresses (`example.invalid`), the suppliers and brands (Marlow, Kestrel,
Stickfast, Brightboard, Ironwood, Fernhill, Wattlebird, Quillon, Harbourlight, Tidewater, Bluegum) and the safety data sheets.
Every generated PDF carries the banner **FICTIONAL DEMONSTRATION DOCUMENT - NOT A REAL SAFETY DATA SHEET** at the top of every
page. The CAS numbers are the real, public numbers of the generic substances named (acetone 67-64-1, ethanol 64-17-5, and so on).

## Demo logins

| Role | Email | Password |
|---|---|---|
| Admin | `demo-admin@example.invalid` | `demo-Ezy-2026` |
| User | `demo-user@example.invalid` | `demo-Ezy-2026` |

This password is public on purpose and exists **only** for the demo. Never reuse it for anything real. Demo logins skip the
emailed code. In the demo Worker (`DEMO_MODE=1`) every write is blocked for both roles, so uploads are blocked too.

## What is in it (for `--today 2026-10-19`; the counts stay the same for any date)

* **66 chemicals**: 50 hazardous, 15 not hazardous, 1 with no decision yet (the two-stroke fuel mix, which is **not classified**: `ghs_classification` is NULL).
* **GHS classification** (Safe Work Australia poster table, `public/lib/ghs-ref.mjs`) on every chemical, stored as JSON in `ghs_classification`; `decision`, `signal_word` and `pictograms`
  are the effective values from `effective()`. Non-hazardous products are `[]`. Examples: lacquer thinners = Flam. Liq. 2, Asp. Tox. 1, Skin Irrit. 2, Eye Irrit. 2A, STOT SE 3, Repr. 2, STOT RE 2;
  battery acid = Skin Corr. 1A + Met. Corr. 1; cement = Skin Irrit. 2, Eye Dam. 1, Skin Sens. 1, STOT SE 3; spray paints = Aerosol 1.
* **Visible overrides and flags** (one each): Marlow Mineral Turpentine has a pictogram override adding GHS09 (environment; the table never derives it); Ironwood Hydraulic Oil 46 has a decision override
  (classification `[]`, derives not hazardous, overridden to hazardous because it is used hot); Tidewater Drain Unblocker Gel has a `check:true` entry
  (Skin Corr. 1B is the AI's reading, its sheet prints "Skin Corr. 1" with no letter) plus a `classification_flags` message and `sds.unverified = ["classification"]`.
  The concrete sealer tin has no SDS and an admin-entered classification (`src: "admin"`).
* **51 SDS rows / PDFs**: 50 current + 1 old version. Section 2 of each sheet states the classification in the usual abbreviations with H-codes ("Flam. Liq. 2 (H225)"), the signal word, and pictogram names and codes as text (no images).
  Their sheets are checked by `verifyClassification` in the tests: nothing removed and no flags, apart from the one deliberately flagged sheet.
* **Shared SDS**: Brightboard plaster sheet shared by 10 products, Stickfast Grip Max adhesive sheet by 4 pack sizes
  (cartridges and a pail), Kestrel acrylic paints by 3, Kestrel oil stain by 2.
* **SDS version history**: Marlow Methylated Spirits, v1 (replaced) and v2 (current); the chemical page shows the history and an older assessment.
* **Review status**: 5 past the five-year review date (overdue), 4 due within 90 days, 55 in date, 1 SDS with no issue date (unknown), 1 chemical with no SDS.
* **Risk levels** (current assessment): 25 not significant, 33 significant but controlled, 4 significant and not controlled, 4 uncertain (1 chemical has a blank assessment, 1 has no SDS).
* **Storage**: 75 locations in L and kg, nine of them with a named spill compound. Totals are by GHS class and category (Schedule 11 items), not by ADG class.
* Each PDF is 11 to 13 KB, has 16 numbered sections, and uses standard fonts with real text, so it can be read by the AI reading step too.

### Expected site totals (asserted in `tests/demo-data.test.mjs` with `computeSiteTotals`)

| Item | Total | Placard | Manifest | Status |
|---|---|---|---|---|
| 1 Flammable gases | 250 L | 200 | 5000 | **OVER placard** (2 x 45 kg LPG heater cylinders 210 L + acetylene 40 L) |
| 9 Flammable liquids, any mix of items 6 to 8 | 1074.6 L | 1000 | 10000 | **OVER placard through the mix only**: item 6 = 45 L (limit 50), item 7 = 64 L (limit 250), item 8 = 965.6 L (limit 1000), none over on its own (a 1000 L diesel fuel cube holds 800 L) |
| 8 Flammable liquids cat 3 | 965.6 L | 1000 | 10000 | under; includes the 20 L of category 4 decking oil that shares the "Paint store bund" spill compound with the stains and varnish (counted as category 3) |
| 10 Flammable liquids cat 4 | 10 L | 10000 | 100000 | the second decking-oil tin, kept in its own location |
| 4 Gases under pressure (other) | 100 L | 1000 | 10000 | under |
| 38 Skin corrosion 1B | 40.7 | 250 | 2500 | under; other items (5, 25, 28, 37, 40, 41) are all well under |

* **No item is over its manifest quantity.** Those quantities start at 2500 L or more for anything the site holds, which a small joinery cannot realistically reach without breaking the rest of the story.
* **Unit mismatch**: the 9 kg LPG cylinder in the van is recorded in kg; item 1 is in litres, so it is not counted and appears as an issue.
* **Other issues expected**: 5 x "acute toxicity category 4 has no item for liquids and solids", 1 x "no classification" (the two-stroke mix, 5 L), and 6 products that count towards more than one item.

Issue dates are computed from the build date (`--today`), so the overdue/due-soon counts do not drift as time passes.

## Build and load locally

```bash
node scripts/make-demo.mjs --today 2026-10-19      # writes demo-out/demo.sql, demo-out/pdfs/sds/*.pdf, demo-out/summary.json
node scripts/seed-demo-local.mjs                    # builds if needed, then loads LOCAL D1 + LOCAL R2 only
node scripts/seed-demo-local.mjs --persist-to ./.wrangler/state --dry-run   # print the wrangler commands without running them
```

`demo-out/` is git-ignored (it has its own `.gitignore`); only the generator (`scripts/make-demo.mjs`, `scripts/demo/`) is committed.
`seed-demo-local.mjs` refuses `--remote`, passes `--local --persist-to <dir>` to every wrangler call and reads nothing from
`wrangler.toml` (wrangler resolves the `DB` binding itself). It applies `schema.sql`, runs `demo.sql`, then uploads each PDF to the
local `sds-ezy-files` bucket under the same key stored in the `sds.r2_key` column. `demo.sql` begins by clearing the register
tables (users, sds, chemicals, locations, assessments), so only ever load it into a throwaway or demo database.

Then start the Worker on the same state: `npx wrangler dev --persist-to ./.wrangler/state`.

Suggested npm scripts for `package.json`:

```json
"demo:build": "node scripts/make-demo.mjs",
"demo:seed:local": "node scripts/seed-demo-local.mjs",
"answer-key": "node scripts/answer-key.mjs",
"answer-key:selftest": "node scripts/answer-key.mjs --self-test"
```

## Putting the demo on its own Worker (documented only; nothing here has been run)

The demo must be a **separate Worker with its own D1 database and R2 bucket**, never your real one. Do these steps yourself,
deliberately, when you are ready:

1. Make a second config, for example `wrangler.demo.toml` (not committed), copied from `wrangler.template.toml`, with a different
   `name = "sds-ezy-demo"`, its own `d1_databases` entry (`database_name = "sds-ezy-demo-db"`), its own `r2_buckets` entry
   (`bucket_name = "sds-ezy-demo-files"`), and these vars:

   ```toml
   [vars]
   DEMO_MODE = "1"
   DEMO_ADMIN_EMAIL = "demo-admin@example.invalid"
   DEMO_USER_EMAIL = "demo-user@example.invalid"
   ```

   Set a fresh `SESSION_SECRET` for it (`wrangler secret put SESSION_SECRET -c wrangler.demo.toml`). Do not give the demo Worker any AI key,
   `RESEND_API_KEY` or `SETUP_KEY` from your real deployment.
2. Create the resources: `wrangler d1 create sds-ezy-demo-db` and `wrangler r2 bucket create sds-ezy-demo-files`, and paste the new
   database id into `wrangler.demo.toml`.
3. Build the data fresh for the day you deploy: `node scripts/make-demo.mjs`.
4. Load the schema and data into the demo database (this is a remote command, run by you, against the demo database only):

   ```bash
   wrangler d1 execute DB --remote -c wrangler.demo.toml --file=./schema.sql
   wrangler d1 execute DB --remote -c wrangler.demo.toml --file=./demo-out/demo.sql
   ```

5. Upload the PDFs to the demo bucket, one per `sds.r2_key` (keys look like `sds/7-692d1df48391.pdf`):

   ```bash
   for f in demo-out/pdfs/sds/*.pdf; do
     wrangler r2 object put "sds-ezy-demo-files/sds/$(basename "$f")" --file "$f" --content-type application/pdf --remote -c wrangler.demo.toml
   done
   ```

6. Deploy: `wrangler deploy -c wrangler.demo.toml`. The login screen then lists the two demo logins and every write returns the read-only message.

To refresh the dates later, rebuild with a new `--today` and re-run step 4 (the SQL clears and reloads the register tables) and step 5.

## Answer-key harness (real files, kept out of git)

`scripts/answer-key.mjs` checks the app's AI reading against your own completed work. Put these in the git-ignored `seed-local/` folder:

* a Word file of the completed hazard assessments (`.docx`, the 54 assessments)
* the Excel register (`M.E.C. SDS Register.xlsx`)
* the real SDS PDFs (Liquid Nails Heavy Duty, Gyprock plaster-based cements and adhesives, Chemset 101 Plus)

```bash
node scripts/answer-key.mjs                                   # uses src/ai.js runExtraction with env from .dev.vars
node scripts/answer-key.mjs --provider claude --model <name>  # pick a provider (claude | openai | gemini | workers_ai)
node scripts/answer-key.mjs --provider openai-compatible --base-url http://localhost:11434/v1 --api-key-env LOCAL_KEY --model <name>
node scripts/answer-key.mjs --extractor ./my-reader.mjs       # any module: default export async ({text, fileName, provider, model, env}) => object
node scripts/answer-key.mjs --self-test                       # runs against invented stand-in files, no AI, no real data
```

It extracts text from each PDF (pdfjs legacy build), reads each SDS with the app's reader, parses the `.docx` (checkbox glyphs `☒ ☐`, `[x]`,
Word content-control checkboxes and symbol-font boxes, table or plain "Label: value" layouts), matches each assessment to its SDS (an assessment
product name is found in the sheet text, which is how ten plaster products map to one sheet), and prints a table of how many assessments agree on
product, supplier, form, routes of entry, controls, PPE, risk level, UN number, class, packing group and Hazchem. A second line compares the register.

Privacy: the console shows only field names, counts and SDS file names. "Assessed by" names, phone numbers and e-mails are never extracted.
Reports go to `seed-local/answer-key-report.json` (and, with `--detail`, scrubbed values to `seed-local/answer-key-detail.json`). Reader results are
cached in `seed-local/answer-key-cache/` (`--no-cache` to skip). With the files absent it prints what to add and exits 0.

## Tests

`npm test` runs `tests/demo-data.test.mjs` (loads the generated SQL into an in-memory SQLite via `node:sqlite` after `schema.sql`; needs Node 22.5 or newer, otherwise it
skips with a message) and `tests/demo-answer-key.test.mjs` (parsers against synthetic stand-ins, privacy checks, and the `--remote` refusal).
