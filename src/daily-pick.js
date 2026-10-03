// Operator-controlled content. Published selections are read from the public archive.
// Editor selection does not imply that AI generated or validated it.
export const selectedPick = null;
export function currentPick(pick, now=Date.now()) {
 if(!pick)return null;
 const publication=Date.parse(pick.publishedAt),start=Date.parse(pick.eventStart);
 if(!Number.isFinite(publication)||!Number.isFinite(start)||publication>now||publication>=start||now>=start)return null;
 if(['league','event','selection','rationale'].some(k=>typeof pick[k]!=='string'||!pick[k].trim()))return null;
 return pick;
}

// Preserve the latest past selection without presenting it as a new pregame pick.
// Resolution order follows the append-only archive, including retained corrections.
export function editorialDisplay(archive, now=Date.now()) {
 const published=(archive?.predictions||[]).filter(p=>p.kind==='editorial'&&p.id&&
  Number.isFinite(Date.parse(p.publishedAt))&&Number.isFinite(Date.parse(p.eventStart))&&
  Date.parse(p.publishedAt)<=now&&Date.parse(p.publishedAt)<Date.parse(p.eventStart))
  .sort((a,b)=>Date.parse(b.publishedAt)-Date.parse(a.publishedAt));
 const upcoming=published.find(p=>currentPick(p,now));
 if(upcoming)return{pick:upcoming,status:'upcoming',resolution:null};
 const pick=published.find(p=>Date.parse(p.eventStart)<=now);
 if(!pick)return null;
 const resolution=(archive?.resolutions||[]).filter(r=>r.predictionId===pick.id&&
  ['win','loss','void'].includes(r.result)&&Number.isFinite(Date.parse(r.resolvedAt))&&
  Number.isFinite(Date.parse(r.recordedAt))&&Date.parse(r.resolvedAt)>=Date.parse(pick.eventStart)&&
  Date.parse(r.resolvedAt)<=Date.parse(r.recordedAt)&&Date.parse(r.recordedAt)<=now).at(-1)||null;
 return{pick,status:resolution?'settled':'pending',resolution};
}
