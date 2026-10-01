# UNpredicted

Prediction research beta hosted on the existing Vercel project. The recovery calculator remains at `/recovery.html`; the original homepage calculator is preserved at `/calculator.html`.

## Implemented

- Responsive market explorer using visibly fictional demo markets by default.
- Local watchlists and a personal research notebook with user-entered outcomes and JSON exports.
- Two-feature logistic regression trained locally from CSV; chronological 80/20 holdout, training-only standardization, Brier score and constant-baseline comparison.
- Seeded Monte Carlo binary simulations with actual trial counts, evidence JSON, model parameters and SHA-256 integrity hashes.
- Educational guides, methodology, beta privacy and terms, and proposed Pro pricing (no charges).
- An optional authorized JSON feed endpoint, closed by default. No exchange APIs are queried.

## Development

Node 22+; no third-party runtime packages required.

```
npm test
npm run build
```

Vercel serves `public` and deploys the `api/markets.js` function. No API keys are required for the free beta.

## Authorized feed

Set all of `MARKET_FEED_AUTHORIZED=true`, `MARKET_FEED_PERMISSION_REFERENCE` (internal evidence reference) and `MARKET_FEED_URL` (HTTPS JSON endpoint). These switches attest to operator authorization; they cannot confer legal permission. The feed must be authorized for public redistribution and any commercial use. A configuration change requires review of the data agreement and privacy notice. Never use these switches to bypass a provider's restrictions.

Feed format:

```json
{"source":"Licensed source name","attribution":"Required attribution and delay information","markets":[{"id":"unique-id","question":"Defined event question","category":"Sports","ask":0.62}]}
```

Supported categories: Sports, Economics, Politics, Technology. Ask is a dollar price between 0 and 1, or null. The endpoint returns at most 100 records. It caches for 60 seconds; quotes may be stale. No authentication secrets should be embedded in a URL or client assets.

## Release boundaries

This beta is not an operational paid picks business. It has no validated operator model, public prediction history, licensed live feed, cloud accounts, alerts, subscriptions or automated trading. See `docs/LAUNCH_REVIEW.md` for requirements. Supabase and Stripe connections alone do not provision a database, authorize a business model, or establish legal compliance.
