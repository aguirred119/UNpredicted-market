# Matchup pages

`matchup.html?league=NBA&event=PROVIDER_ID` resolves identity from the current cached schedule or a saved publication. `&record=FORECAST_ID` selects an immutable publication; an unknown ID fails closed. Teams and start time are never accepted from URL input. Saved identity survives removal or changes in the schedule. Losing publications and grading corrections stay in the public ledger.

NBA/NFL research jobs include descriptive form for their upcoming 72-hour window. Summaries use same-season regular-season results, at least 48 hours before event start, up to 20 NBA / 8 NFL games, with five recent results and explicit attribution, source snapshot timestamps and license links. These are descriptive statistics, not predictions. Exact unique teams/start match required; other leagues have honest unavailable states. Source outages preserve visibly dated snapshots. No injuries, confirmed lineups or live scores.

Published model inputs remain frozen in the ledger; the latest form snapshot is separate. Research eligibility is not publication. Market prices load only on explicit request through the existing cached server-side endpoint. NFL model/market subtraction remains disabled because tie settlement differs. Editorial run lines are never compared to moneyline prices. No billing or new provider subscriptions.

Verification: `npm test`, `npm run build`, ledger-prefix check, GitHub Actions and Vercel deployment, desktop publication and phone review plus actual NBA/NFL schedule navigation. `matchup-review.html` renders the actual first saved publication at 390px and is noindex. Physical device checks remain useful for clipboard and installation behavior.

Soccer context added: five major European domestic leagues use OpenFootball CC0 results, with date-only provenance, conservative availability lag, exact explicit team aliases, unique local fixture dates and visibly delayed results. Frozen forecasts remain separate. `/stats.html` exposes a searchable/selectable team profile, alphabetical window summaries and matched event links. Other league models are not implied.
