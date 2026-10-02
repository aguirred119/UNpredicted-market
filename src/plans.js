// Display/catalog configuration only. No checkout, payment credentials or entitlements.
export const PLAN_CATALOG=Object.freeze({
 'pro-founding-v1':Object.freeze({id:'pro-founding-v1',product:'TONATI LAB Pro',currency:'USD',amountCents:299,interval:'month',trialDays:14,label:'Introductory / founding price',availableForNewSubscribers:false,billingEnabled:false,existingMemberPricePolicy:'retain-assigned-price-version-unless-lawfully-changed'}),
});
export const LAUNCH_PLAN_ID='pro-founding-v1';
// Store each subscription's immutable assigned plan version and provider price ID.
// A future launch plan changes NEW checkout sessions, not existing subscriptions.
export function planForSubscription(subscription){return PLAN_CATALOG[subscription?.planVersion]||null;}
export function launchPlan(){return PLAN_CATALOG[LAUNCH_PLAN_ID];}
