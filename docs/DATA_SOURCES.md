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
