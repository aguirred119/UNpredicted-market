# UNpredicted launch review

Prepared October 1, 2026. This is an engineering and review brief, not a legal opinion or certification. The free beta can be reviewed concretely; paid publication remains unavailable.

## Current product

A sports-first local browser research tool covering NBA, MLB, NFL, NHL, WNBA and major soccer competitions, also supporting other event categories. Planned Pro pricing is $4.99 per month. Pick of the Day is selected by the operator; any model analysis must be identified separately. No pick is currently published. User CSVs train logistic regression; manual probability assumptions are not AI outputs. Fictional examples and synthetic datasets are labeled. The operator has not published real picks or asserted real-world accuracy or profitability. User notebook results are editable and not audited.

## Claims supported by this release

- “Train a machine-learning model on your historical data.” The code trains logistic regression.
- “Run reproducible binary simulations.” The code executes 10,000 or 100,000 seeded Bernoulli trials.
- “Download the evidence behind your estimate.” The report includes inputs, source labels, model version and parameters, training-data hash, holdout metrics and simulation settings.

Do not advertise that UNpredicted currently provides validated AI sports picks, licensed live analytics, demonstrated profits, or an audited win rate. A simulation-count claim supports execution count only. It does not support forecast quality.

## Required review before selling prediction recommendations

1. A lawyer familiar with CFTC/commodity trading adviser rules, state gambling laws, consumer advertising and online subscriptions must classify the actual service and markets, decide whether registration or an exclusion/exemption applies, and identify geographic/age restrictions. Generalized advice or an “educational” label alone is not a legal determination. No personalized recommendations, trade execution or custody are implemented.
2. Secure written data-provider permission for collection, storage, model training, public redistribution and commercial use, including attribution/delay requirements. Kalshi's currently retrieved developer agreement restricts sharing API data without written authorization. Public API accessibility is not permission to redistribute.
3. Establish truthful, reproducible operator models. Define features and settlement outcomes; audit input timing, leakage and data provenance; validate on untouched out-of-time data; evaluate calibration, Brier score and model drift. Trading-profit claims require an execution-aware analysis with actual available prices, fees, spreads, liquidity and losing periods.
4. Before public publication, implement a server-managed append-only forecast ledger with authenticated operator roles, independent publication evidence, immutable original forecasts and separately appended resolution/correction records. Publish every eligible forecast under predefined inclusion rules, including losses. Browser hashes and local timestamps are insufficient.
5. Obtain payment-provider eligibility review for the specific product and advertising. Do not disguise prediction services as unrelated software. Stripe's prohibited/restricted business policy applies independently of whether the service is legal. No live products or recurring payments are created by this release.
6. Establish the operator's legal identity and a private support/privacy contact; obtain tailored terms, privacy notices, subscription consent, renewal, cancellation and refund procedures. Review data protection, retention and deletion, and any applicable geographic privacy rights.
7. Consider an appropriate entity structure and professional/cyber liability insurance with counsel and an insurance professional. Neither a company nor a disclaimer eliminates liability.

## Proposed advertising after validation and approval

“AI-assisted prediction research backed by statistical analysis and documented simulations. Explore estimated probabilities, model assumptions and a transparent prediction history.”

Use only after the actual production service supports every statement. Nearby disclosure: “Model estimates are uncertain and can be wrong. Simulated and historical results do not guarantee future performance or profits. Wagering and trading involve risk of loss.” Disclosures cannot cure a false headline.

## Next infrastructure

- Supabase project selection and cost review, authenticated user accounts, owner-scoped RLS, deletion/export controls and append-only server ledger.
- Validated licensed dataset and model pipeline appropriate to a defined market category.
- Authorized data feed and historical data rights.
- Approved subscription business, secure Checkout, verified webhook entitlement updates, billing portal, and clear customer cancellation controls.
- Durable scheduled alert jobs with opt-in consent and delivery preferences.

## Sources reviewed

- FTC substantiation policy: https://www.ftc.gov/legal-library/browse/ftc-policy-statement-regarding-advertising-substantiation
- FTC online advertising guidance: https://www.ftc.gov/system/files/documents/plain-language/bus28-advertising-and-marketing-internet-rules-road2018.pdf
- NFA CTA registration: https://www.nfa.futures.org/registration-membership/who-has-to-register/cta.html
- NFA advice/software exemption interpretation: https://www.nfa.futures.org/rulebooksql/rules.aspx?RuleiD=9055&Section=9
- Kalshi Developer Agreement: https://kalshi-public-docs.s3.amazonaws.com/Kalshi-Developer-Agreement.pdf
- Stripe restricted businesses: https://stripe.com/legal/restricted-businesses

Rules and agreements can change. Counsel should verify current sources and the final implementation.
