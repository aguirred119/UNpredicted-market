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
