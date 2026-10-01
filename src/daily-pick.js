// Operator-controlled content. No public pick has been selected yet.
// Editor selection does not imply that AI generated or validated it.
export const selectedPick = null;
export function currentPick(pick, now=Date.now()) {
 if(!pick)return null;
 const publication=Date.parse(pick.publishedAt),start=Date.parse(pick.eventStart);
 if(!Number.isFinite(publication)||!Number.isFinite(start)||publication>now||publication>=start||now>=start)return null;
 if(['league','event','selection','rationale'].some(k=>typeof pick[k]!=='string'||!pick[k].trim()))return null;
 return pick;
}
