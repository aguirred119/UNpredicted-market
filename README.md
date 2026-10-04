# TONATI LAB

AI Sports Intelligence. Improved in the existing `aguirred119/UNpredicted-market` repository without replacing the static/Vercel architecture.

## Working product

- Responsive sports dashboard, requested league filters, local dates/search and persistent local watchlists.
- Server-only The Odds API events integration (`/api/games`), cached up to one hour. Starts inactive if no key exists; no demo/current-data substitution.
- Existing league-specific cached bookmaker moneyline integration (`/api/odds`). Implied probabilities are visibly separate from model forecasts.
- Real NBA and NFL historical research, separate chronological evaluations, reproducible simulations and downloadable model evidence. Experimental daily publication/grading runs through GitHub Actions; checks can skip every game. Historical backtests never populate the public live record.
- Installable home-screen web app at `/app.html`, branded PNG icons, standalone phone navigation and a connection-only offline fallback. Sports pages, APIs and prediction data are never cached by the service worker. No app-store release or push alerts yet.
- Pick of the Day preparation at `/editor.html`; publication uses the authenticated GitHub workflow, not an anonymous browser endpoint.
- Git-versioned public forecast ledger, pregame timestamps, hash chain, separate resolution/correction entries, Brier and threshold-accuracy reporting for model forecasts, separate editorial results, complete loss retention.
- Free recovery planner and original recovery resources under Resources; prior notebook/watchlist storage keys preserved.
- Pro founding price **$2.99/month** with a planned **14-day free trial**. Trial converts to $2.99/month unless canceled. Billing and trial enrollment inactive. Versioned plan catalog supports retaining founding price assignments while new subscribers use a future price version. See `docs/SUBSCRIPTIONS.md`.

## Run and verify

Node 22+, no third-party runtime dependencies.

```sh
npm test
npm run build
npm run dev
```

Vercel serves `public` and the functions in `api/`. `vercel.json` retains the existing build/deployment configuration and security headers. `/__preview/mobile` is a local-only layout harness; it is not part of the deployed output.

## Sports data activation

In the existing Vercel project add sensitive server-only `ODDS_API_KEY`, then redeploy. The owner must create the account and accept the provider's terms; no paid plan is activated by this release. Do not paste a key in chat, code, repository issues or client-side variables. Existing keys are reused if already configured. `ODDS_CACHE_SECONDS` defaults to 86400, minimum 1800. Schedules have a separate one-hour cache and use the documented events endpoint that does not count against usage credits.

Bookmaker odds and schedules are cached snapshots; they are not live scores or independent AI estimates. Requests are constrained to known leagues and fixed upstream paths. Account quota monitoring remains necessary. Provider terms reviewed on October 2, 2026 permit commercial analytical UI use and model training while prohibiting raw-data resale. The site exposes a bounded UI integration, not a bulk reseller feed. See `docs/DATA_SOURCES.md`.

## Pick of the Day

1. Open `/editor.html` and prepare the editorial record with exact event/team names, selection, start time, settlement rule, rationale, input time and a public-safe source/permission reference.
2. Copy its JSON into GitHub Actions → Publish TONATI LAB record → Run workflow → action `publish`, branch `main`.
3. The trusted publisher stamps `publishedAt`, validates pregame timing, appends the forecast to `data/ledger.jsonl`, tests and commits it. Vercel deploys the commit.
4. Append results using action `resolve`; a correction must reference `correctsEntryId`. Never modify original records to remove losses.

Workflow-generated commits may not trigger other Actions via `GITHUB_TOKEN`; the publication job itself tests/builds before pushing. Vercel's Git integration must be verified for the first actual publication. Existing editorial publications remain in the append-only ledger.

## Model publication and grading pipeline

`node scripts/generate.mjs /private/path/batch.json` trains the existing model on authorized historical CSV data and computes actual forecasts. Input: `trainingCSVPath`, `synthetic:false`, `dataUseAuthorized:true`, two `featureDefinitions`, `dataSource`, public-safe `dataPermissionReference`, optional `trials`/`seed`, and `games` with event metadata, features, input timestamps and settlement definition. All batch records validate before append. Store input datasets outside this public repository. This generic upload/batch pipeline remains operator supplied. The separately implemented NBA and NFL daily jobs use their documented licensed sources; see `docs/DATA_SOURCES.md`.

`node scripts/ledger.mjs publish record.json` stamps and archives a reviewed individual forecast. Model submissions must reproduce their probability and simulations from included model evidence; synthetic public model records are rejected. Mathematical consistency does not certify the data truth or accuracy.

`ODDS_API_KEY=... node scripts/grade.mjs` is a server/CI operation. Completed scores grade matching US-sport match-winner selections including overtime, and append results. Score calls with `daysFrom=3` consume two provider credits per league; no unattended calls are configured. Soccer, events older than the provider window, canceled/postponed games and ambiguous settlement remain pending until manually reviewed. Secrets should be injected from the host, never typed into a shared shell history.

`node scripts/ledger.mjs check BASE_SHA` rejects modification/removal of archived lines. Quality CI runs tests, build and history-prefix checks. Repository administrators can override history/checks, so this is not a tamper-proof or independently audited record. Branch protection and independent publication anchoring are future options requiring review.

## Still required for an operational paid product

- Continued provider quota/permission review and permissioned deeper pregame features.
- Prospective validation of the experimental NBA/NFL models and trained pipelines for additional leagues.
- Deeper licensed injury/lineup/team statistics and soccer settlement adapters.
- Accounts, secure subscription checkout/webhooks, entitlements and self-service cancellation.
- Private operator support contact and final legal/payment-provider review.
- User approval before real billing, any paid provider upgrade or domain purchase.

No domain purchase, paid API activation, real billing or acceptance of provider terms is included.

### Free soccer team statistics

`stats.html` and dedicated matchup pages show source-derived team form for Premier League, La Liga, Serie A, Bundesliga and Ligue 1. Up to 10 same-season domestic league games, explicit draws and goal averages, public-domain attribution, match dates and source delay labels. No soccer model forecasts are claimed. Run `node scripts/soccer-context.mjs` to refresh; GitHub Actions retrieves the public source daily and preserves old dates on errors. Event matching uses only the existing zero-credit schedule endpoint, with no automated odds/score quota usage. See `docs/DATA_SOURCES.md` for provenance and limits.

### Soccer three-outcome research

`/soccer-research.html` publishes five separately fitted multinomial logistic models with 2023–24 training and untouched later-season 2024–25 tests. Home win, draw and away win have separate probabilities and calibration. Missing outcomes, thin-history exclusions, fixed parameters and source hashes are disclosed. This is retrospective research only; no current soccer forecasts, market edges, simulations or profit claims. Rebuild with `node scripts/soccer-research.mjs` using only free public historical files. Daily statistics now distinguish unchanged results from successful source checks.

### Exact-event daily publication checks

NBA/NFL daily feeds now use schema version 2 and retain a timestamped check for every source candidate and every unique provider-scheduled event in the upcoming 72-hour window. Schedule-only games receive an explicit blocked reason; no missing statistical inputs are synthesized. Ambiguous provider or source identities cannot publish. Checks distinguish new publications, existing archived forecasts and withheld forecasts. Game cards and matchup pages match these checks by league, event ID, teams and start time; checks older than 36 hours, future timestamps and mismatched events are not presented as current. This is a dated pipeline status, not a live score, a probability or a substitute for the immutable publication record. No extra API, paid odds/score request or billing service was added.
