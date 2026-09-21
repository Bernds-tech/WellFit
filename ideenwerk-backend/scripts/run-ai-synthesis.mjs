import pg from 'pg';
import {synthesizeVariants} from '../src/lib/synthesis-provider.js';

const {Client}=pg;
const connectionString=process.env.DATABASE_URL;
const publicId=process.env.SYNTHESIS_PUBLIC_ID||process.argv[2];
if(!connectionString)throw new Error('DATABASE_URL is required');
if(!publicId)throw new Error('SYNTHESIS_PUBLIC_ID or public ID argument is required');
const client=new Client({connectionString});
await client.connect();
try{
  const q=await client.query(`
    SELECT s.id,s.public_id,s.original_text,s.topic,s.region,s.updated_at,
           p.problem,p.proposal,p.goal,p.open_questions,
           public.ideenwerk_ai_synthesis_source_snapshot(s.id) AS snapshot,
           public.ideenwerk_current_impact_bridge(s.id) AS impact,
           public.ideenwerk_expert_input_citizen_view(s.id) AS expert_inputs,
           public.ideenwerk_ai_feedback_context(s.id) AS impact_feedback
      FROM submissions s
      LEFT JOIN structured_proposals p ON p.submission_id=s.id
     WHERE s.public_id=$1
     LIMIT 1
  `,[publicId]);
  if(!q.rowCount)throw new Error('AI_SYNTHESIS_SUBMISSION_NOT_FOUND');
  const row=q.rows[0],snapshot=row.snapshot;
  if(!snapshot?.eligible)throw new Error(`AI_SYNTHESIS_PREREQUISITES_NOT_CURRENT:${snapshot?.ineligible_reason||'unknown'}`);
  const impactRefs=Array.isArray(snapshot?.impact_bridge?.mapping_refs)?snapshot.impact_bridge.mapping_refs:[];
  const expertRefs=Array.isArray(snapshot?.expert_input_refs)?snapshot.expert_input_refs:[];
  const reviewRefs=Array.isArray(snapshot?.impact_feedback?.review_refs)?snapshot.impact_feedback.review_refs:[];
  const context={
    citizen_problem:{
      ref_id:'CITIZEN-PROBLEM',
      original_text:row.original_text,
      problem:row.problem,
      proposal:row.proposal,
      goal:row.goal,
      topic:row.topic,
      region:row.region,
      open_questions:row.open_questions||[]
    },
    impact_bridge:row.impact,
    expert_inputs:row.expert_inputs||[],
    impact_feedback:row.impact_feedback?.state==='current'?(row.impact_feedback.items||[]):[],
    impact_map_refs:impactRefs,
    expert_input_refs:expertRefs,
    impact_review_refs:reviewRefs,
    source_snapshot_hash:snapshot.snapshot_hash,
    boundary:'Generate multiple traceable variants only; never rank, recommend, accept/reject, invent numeric fiscal effects, or treat impact-review hypotheses as causal facts.'
  };
  const result=await synthesizeVariants(context);
  if(!result.available)throw new Error(result.reason||'AI_SYNTHESIS_PROVIDER_UNAVAILABLE');
  const idempotency=process.env.SYNTHESIS_IDEMPOTENCY_KEY||`ai-synth:${publicId}:${snapshot.snapshot_hash}:${result.provider}:${result.model_version}`;
  const saved=await client.query(
    `SELECT public.ideenwerk_record_ai_synthesis($1,$2,$3,$4::jsonb,$5,$6,$7) AS result`,
    [publicId,result.provider,result.model_version,JSON.stringify(result.variants),result.uncertainty_summary||null,snapshot.snapshot_hash,idempotency]
  );
  console.log(JSON.stringify({public_id:publicId,...saved.rows[0].result,model_provider:result.provider,model_version:result.model_version,variant_count:result.variants.length,impact_feedback_refs:reviewRefs.length},null,2));
}finally{await client.end()}
