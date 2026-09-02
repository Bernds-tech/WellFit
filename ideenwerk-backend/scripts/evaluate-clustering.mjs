import fs from 'node:fs/promises';
import { extractSemanticFeatures } from '../src/lib/semantic-provider.js';
import { decideClusterRelation } from '../src/lib/cluster-decision.js';

function grams(text, n=3) {
  const s = `  ${String(text||'').toLowerCase().replace(/\s+/g,' ').trim()}  `;
  const out = new Set();
  for (let i=0;i<=s.length-n;i++) out.add(s.slice(i,i+n));
  return out;
}
function dice(a,b) {
  const A=grams(a),B=grams(b);
  if (!A.size && !B.size) return 1;
  let inter=0; for (const x of A) if (B.has(x)) inter++;
  return (2*inter)/(A.size+B.size||1);
}

const path = new URL('../evaluation/cluster-goldset.json', import.meta.url);
const data = JSON.parse(await fs.readFile(path,'utf8'));
const rows=[];
for (const pair of data.pairs) {
  const [a,b] = await Promise.all([
    extractSemanticFeatures({ original_text:pair.a, problem:pair.a, proposal:pair.a }),
    extractSemanticFeatures({ original_text:pair.b, problem:pair.b, proposal:pair.b })
  ]);
  const problemSimilarity=dice(a.problem_signature,b.problem_signature);
  const solutionSimilarity=dice(a.solution_signature,b.solution_signature);
  const decision=decideClusterRelation({problemSimilarity,solutionSimilarity,sameLevel:true,sameRegionScope:true});
  rows.push({
    id:pair.id,
    expected:pair.expected,
    predicted:decision.relation,
    problem_similarity:Number(problemSimilarity.toFixed(4)),
    solution_similarity:Number(solutionSimilarity.toFixed(4)),
    provider_a:a.provider,
    provider_b:b.provider,
    ok:pair.expected===decision.relation
  });
}

const total=rows.length;
const correct=rows.filter(x=>x.ok).length;
const falseMerge=rows.filter(x=>x.predicted==='same_problem_same_solution' && x.expected!=='same_problem_same_solution').length;
const variantLoss=rows.filter(x=>x.expected==='same_problem_different_solution' && x.predicted==='same_problem_same_solution').length;
const falseSplit=rows.filter(x=>x.expected==='same_problem_same_solution' && x.predicted==='separate').length;
const byLabel=Object.fromEntries(data.labels.map(label=>{
  const subset=rows.filter(x=>x.expected===label);
  return [label,{total:subset.length,correct:subset.filter(x=>x.ok).length}];
}));

const result={
  goldset_version:data.version,
  semantic_provider:process.env.SEMANTIC_PROVIDER||'fallback',
  total,
  correct,
  accuracy:Number((correct/Math.max(total,1)).toFixed(4)),
  false_merge:falseMerge,
  variant_loss:variantLoss,
  false_split:falseSplit,
  by_label:byLabel,
  rows
};
console.log(JSON.stringify(result,null,2));

if (String(process.env.EVAL_STRICT||'false').toLowerCase()==='true' && (falseMerge>0 || variantLoss>0)) {
  process.exitCode=1;
}
