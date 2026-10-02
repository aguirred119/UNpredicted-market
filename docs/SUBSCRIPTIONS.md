# TONATI LAB subscription architecture

Billing is inactive. Launch catalog: `pro-founding-v1`, USD 299 cents/month, 14-day free trial. Trial converts to $2.99/month unless canceled before the trial ends. No provider products, prices, customers or subscriptions have been created.

## Price versions

The public catalog lives in `src/plans.js`. A future price requires a new catalog version and a new provider recurring Price; never edit the existing price or bulk migrate subscriptions. A server-side checkout must select the allowed active acquisition plan. Client-supplied amounts, price IDs and entitlement claims are never trusted.

Persist `user_id`, `subscription_id`, `provider_price_id`, `plan_version`, `trial_start`, `trial_end`, `current_period_end`, `status`, `cancel_at_period_end`, `founding_member`, and the accepted terms/version. Each founding subscription retains its assigned plan and provider price. Changing the default plan for new checkouts must not change existing subscriptions. Resubscribing after cancellation, plan changes and future retention eligibility require an explicit customer-facing policy before enrollment. Do not promise a lifetime price now.

## Launch gates

- Tested authentication, hosted checkout, webhook signature verification and idempotent event handling.
- Server-issued entitlements from trusted billing state; cancellation and failed payments must update access correctly.
- Self-service cancellation available during trial and paid subscription, with confirmation and disclosed end-of-access behavior.
- Before consent, display: 14-day trial; exact trial-end date; $2.99/month renewal; whether payment details are required; first billing date; cancel-before-trial-end rule; private support contact; taxes if applicable; renewal and refund terms.
- Show trial conversion disclosure beside the enrollment action. Send trial reminders and payment/cancellation receipts with appropriate consent.
- Confirm business eligibility with the payment provider and review terms/privacy for the actual operator and geography.
- Test trial conversion, trial cancellation, paid cancellation, reactivation, dunning, refunds, webhook replay and price grandfathering in a sandbox.
- Do not enable real billing until these gates pass and the user explicitly approves activation.
