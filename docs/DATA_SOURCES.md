# Sports data decision — October 2, 2026

## Implemented provider: The Odds API

Official docs: https://the-odds-api.com/liveapi/guides/v4/
Official terms: https://the-odds-api.com/terms-and-conditions.html (updated August 31, 2026)

The existing integration supports NBA, NFL, MLB, NHL, WNBA, Premier League, La Liga, Serie A, Bundesliga, Ligue 1, MLS, Liga MX and UEFA Champions League through fixed provider sport keys. Season/coverage may vary. Events endpoint returns IDs, team names and commence time and does not count against quota. Odds are bookmaker-derived, not AI predictions. Scores endpoint can support US-sport grading; requesting three days of completed games costs two credits per league. Historical odds require a paid plan; none is activated.

The terms permit storing data, displaying it in commercial apps/dashboards, derived analytics and model training. They prohibit repackaging it as a standalone data product/raw feed. The product must remain an analytics application. Verify the specific account agreement before launching paid analysis. No terms were accepted for the user.

Schedule: cached up to one hour. Odds: default 24-hour snapshots. Display provider retrieval and quote update timestamps. Never label these live scores. A provider outage yields a real empty/error state, not invented games. Fictional demos require deliberate selection.

## Deferred sources

Football-data.org has a documented soccer API, attribution requirements, tier-dependent access and commercial terms requiring review. Do not assume its free marketing language authorizes the final subscription product. Official terms: https://www.football-data.org/terms-conditions; API policies: https://docs.football-data.org/general/v4/policies.html.

Injury reports, lineups, historical pregame ratings and box-score statistics require a permissioned sports-statistics provider or licensed dataset. Do not scrape undocumented ESPN endpoints, logos, paywalled data or restricted exchange data as a production substitute. No new provider or paid API is activated.

## Provenance contract

Production forecasts must define their event/outcome, publication/start/input times, source and permission reference, model/version/features and reproducible simulation evidence. Store source data separately under its license; publish only permissioned derivative evidence. Data permission references in the public archive must not contain credentials or confidential agreements.

## Implemented historical NBA research

SportsDataverse's `espn_nba_schedules` CSV release, produced by hoopR, supplies regular-season schedules/results. The producing repository publishes CC BY 4.0: https://github.com/sportsdataverse/hoopR-nba-data/blob/main/LICENSE.md. Attribution and transformation notices appear on the public research page. No terms were accepted or paid account activated. A repository license is not independent verification of every upstream right; reassess rights before expanding redistribution or monetizing this feed.

`node scripts/nba-research.mjs` downloads four completed seasons and the upcoming season, filters to the 30 NBA franchises and non-neutral regular-season games, hashes each file, and writes derivative evidence only. No raw source files or highlights are committed. GitHub's daily workflow refreshes the research report; source failure leaves the deployed prior report intact, visibly dated. Experimental NBA publication and grading run daily through `scripts/nba-daily.mjs`. The job uses no API key or paid provider.

Two features: home-minus-away trailing point margin and win fraction, with 20-game windows, 10-game minimums, current-season-only histories, and 48-hour information lag. Training uses the first three seasons; the last completed season is a frozen-coefficient chronological holdout. Later holdout games may use earlier holdout outcomes as pregame history. Scaling and fitting use training rows only. Source revisions and missing final publication times mean this is retrospective, not a point-in-time prospective test. Quality/freshness/range gates exist in `lib/nba.js` for eventual live publication. No held-out results enter the public forecast ledger.

The daily CLI downloads and validates licensed NBA results, grades exact previously published NBA model events, and publishes eligible future home-team win probabilities. Grading works even when the schedule provider is unavailable. Forecasts require at least 10 current-season games per team, fresh history, in-range features, a positive historical Brier improvement, a schedule retrieved within two hours, exact team/start matching and 30 minutes of publication lead time. The source is deliberately delayed; this is not a live score feed. Simulations are fixed-probability Bernoulli draws, not possessions or score simulations.

Daily GitHub automation shares the existing publication concurrency group, checks the append-only prefix, runs tests/build and commits the report, ledger and heartbeat. Failures produce a dated status rather than invented forecasts. A source/validation failure leaves prior analysis visible and prevents new publication. Unmatched, postponed and revised events require manual result review; earlier resolutions are never silently overwritten. Scores for MLB and other leagues remain outside this NBA job. Billing is unchanged and no paid API is used.


## NFL research and experimental daily forecasts

NFL schedules/results: nflverse-data `schedules/games.csv` release, CC BY 4.0. Attribution: Lee Sharpe and nflverse contributors. License: https://github.com/nflverse/nflverse-data/blob/main/LICENSE.md. Source: https://github.com/nflverse/nflverse-data/releases/tag/schedules. Modified by TONATI LAB; no endorsement. Only aggregate game results, dates and team identity are used; raw releases and unused player, weather or bookmaker fields are not distributed.

Version 1 trains on 2018–2023 and holds out 2024–2025. Current-season last-eight form, at least four games per team, home stadium regular season only, 48-hour lag. Eastern kickoff timestamps are converted with America/New_York daylight-saving rules. Ties are non-wins for the modeled home outright-win event; no away complement or moneyline settlement claim.

Publication requires 300+ holdout games, Brier improvement >=0.005 over a training-set constant home-win baseline, history no older than 21 days, in-range features, an exact The Odds API event identity/time match, and at least 30 minutes before kickoff within a 72-hour window. New forecasts and later results append to the existing hash-linked ledger; prior losses remain. Daily GitHub Actions runs at 12:27 UTC, may be delayed, and uses the same publication concurrency group as NBA and editorial tools. Source and schedule failures remain visibly dated. No paid API or billing activation is included.

The backtest uses revised files rather than archived point-in-time snapshots. Model coefficients are frozen for the held-out evaluation, with rolling features using earlier results only. Minimum publication thresholds are experimental gates, not proof of future performance.

## Soccer descriptive statistics — October 3, 2026

OpenFootball `football.json` explicitly dedicates schema, data and scripts to the public domain (CC0): https://github.com/openfootball/football.json/blob/master/LICENSE.md and README. This source covers the Premier League, La Liga, Serie A, Bundesliga and Ligue 1. No account, API payment or terms acceptance. This does not supply trained soccer models or promise live results. MLS, Liga MX and UEFA Champions League remain schedule/optional market only.

The current initial snapshot has results through September 20, 2026; it is visibly delayed. Daily retrieval does not guarantee daily upstream updates. `scripts/soccer-context.mjs` records per-league success/failure, preserves old snapshots unchanged on source errors, and records source hashes. Only fixed public source URLs and the existing zero-credit schedule endpoint are called. The Odds API GET events endpoint explicitly does not consume usage credits: https://the-odds-api.com/liveapi/guides/v4/#get-events. No new automated odds/scores requests.

`lib/soccer.js` validates season, all expected teams, score integers/ranges, dates, duplicate fixtures and source completeness. Community match dates are treated with day precision: end-of-day UTC is used only as a conservative availability bound for European competition dates. No synthetic kickoff time is displayed. Only current-season domestic league results older than this bound plus 48 hours contribute to 10-game windows. Exact explicit aliases, unique competition-local dates, provider event identity and a schedule no older than 2 hours attach form to upcoming events within 14 days. This is descriptive context, not forecast publication/grading. Cup fixtures and unmatched events fail closed.

MLB free historical data from Retrosheet permits commercial reuse with its required notice, but currently extends through 2025: https://www.retrosheet.org/downloads/csvoverview.html. It must not be advertised as current 2026 form. No new MLB source is activated in this milestone. NHL source/package licenses need dataset-specific provenance review before further production use. Existing schedules for these leagues remain working.

### Soccer historical model research (October 3, 2026)

`node scripts/soccer-research.mjs` downloads only ten public-domain OpenFootball files: five leagues for 2023–24 training and 2024–25 testing. No API keys, paid AI calls, schedule, odds or score API requests are involved. It writes `data/soccer-research.json`; this report is intentionally not refreshed or tuned automatically. `--source-dir DIR` supports local reproducibility with files named `tonati-SEASON-CODE.json`. Input hashes, fitted coefficients, scales, ranges, metrics and calibration are public. Upstream revisions may prevent exact replay unless the original hashed bytes are retained.

La Liga and Serie A 2024–25 sources each omit ten final-round outcomes; these remain excluded rather than invented. The report discloses missing results and history exclusions. Historical features require five earlier same-season results per team, using up to ten. Earliest fixture-date cutoff is 00:00 UTC minus two hours, then minus 48 hours; completed result availability is conservatively end-of-day UTC. This date-only assumption does not prove historical publication availability. Fixed multinomial logistic regression predicts home/draw/away; no simulations or profitability tests. No current soccer model forecasts or ledger entries are created.

Daily descriptive refresh distinguishes successful retrieval from whether available results actually changed. Snapshot dates and result dates remain separate. Free-source freshness remains limited by community updates; no paid replacement or new provider terms were activated.
