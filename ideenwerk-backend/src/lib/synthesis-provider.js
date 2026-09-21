const FORBIDDEN_KEYS=new Set(['rank','score','recommended','recommendation','winner','preferred','accept','reject','decision']);
const PREFERENCE_RE=/(\bbeste\b|\bbest option\b|\bempfohlen\b|\bvorzuziehen\b|\bgewinner\b|\branking\b)/i;
const EFFECT_RE=/(€|\bEUR\b|%|\bprozent\b|\bmio\.?\b|\bmrd\.?\b|\bmillion(?:en)?\b|\bmilliard(?:en)?\b)/i;

function clean(value,max=2000){return String(value??'').normalize('NFKC').replace(/\s+/g,' ').trim().slice(0,max)}
function arr(value,max=12){return Array.isArray(value)?value.slice(0,max):[]}

function validateSourceRef(ref,allowed){
  if(!ref||typeof ref!=='object')throw new Error('AI_SYNTHESIS_SOURCE_REF_INVALID');
  const kind=clean(ref.kind,40),refId=clean(ref.ref_id,120);
  if(!kind||!refId)throw new Error('AI_SYNTHESIS_SOURCE_REF_INVALID');
  if(!allowed.has(`${kind}:${refId}`))throw new Error(`AI_SYNTHESIS_SOURCE_REF_NOT_CURRENT:${refId}`);
  return {kind,ref_id:refId};
}

export function validateSynthesisPayload(data,context={}){
  if(!data||typeof data!=='object')throw new Error('AI_SYNTHESIS_PROVIDER_INVALID');
  const variants=arr(data.variants,5);
  if(variants.length<2||variants.length>5)throw new Error('AI_SYNTHESIS_VARIANT_COUNT_INVALID');
  const allowed=new Set(['citizen_problem:CITIZEN-PROBLEM']);
  for(const id of arr(context.impact_map_refs,50).map(String))allowed.add(`impact_map:${id}`);
  for(const id of arr(context.expert_input_refs,50).map(String))allowed.add(`expert_input:${id}`);
  for(const id of arr(context.impact_review_refs,50).map(String))allowed.add(`impact_review:${id}`);
  const normalized=variants.map((raw,index)=>{
    if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new Error('AI_SYNTHESIS_VARIANT_SCHEMA_INVALID');
    for(const key of Object.keys(raw))if(FORBIDDEN_KEYS.has(key.toLowerCase()))throw new Error('AI_SYNTHESIS_POLITICAL_RANKING_FORBIDDEN');
    const variant={
      variant_id:clean(raw.variant_id||`V${index+1}`,40),
      title:clean(raw.title,160),
      summary:clean(raw.summary,1600),
      mechanism:clean(raw.mechanism,1200),
      tradeoffs:arr(raw.tradeoffs,12).map(x=>clean(x,500)).filter(Boolean),
      uncertainties:arr(raw.uncertainties,12).map(x=>clean(x,500)).filter(Boolean),
      source_refs:arr(raw.source_refs,30).map(x=>validateSourceRef(x,allowed))
    };
    if(!variant.title||!variant.summary||!variant.mechanism||!variant.source_refs.length)throw new Error('AI_SYNTHESIS_VARIANT_SCHEMA_INVALID');
    const prose=[variant.title,variant.summary,variant.mechanism,...variant.tradeoffs,...variant.uncertainties].join(' ');
    if(PREFERENCE_RE.test(prose))throw new Error('AI_SYNTHESIS_POLITICAL_PREFERENCE_FORBIDDEN');
    if(EFFECT_RE.test(prose))throw new Error('AI_SYNTHESIS_NUMERIC_EFFECT_TEXT_FORBIDDEN');
    return variant;
  });
  return {
    available:true,
    provider:'http_json',
    model_version:clean(data.model_version||'external-v1',120),
    uncertainty_summary:clean(data.uncertainty_summary,1200),
    variants:normalized
  };
}

async function callJsonEndpoint(endpoint,apiKey,context){
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),Number(process.env.SYNTHESIS_TIMEOUT_MS||20000));
  try{
    const res=await fetch(endpoint,{
      method:'POST',
      headers:{'content-type':'application/json',...(apiKey?{authorization:`Bearer ${apiKey}`}:{})},
      body:JSON.stringify({
        task:'werk_ideenwerk_synthesis',
        schema_version:'2026-09-21-v2',
        constraints:{
          multiple_variants:true,
          no_ranking:true,
          no_recommendation:true,
          no_accept_reject:true,
          no_new_numeric_effects:true,
          source_refs_must_be_current:true,
          impact_feedback_is_hypothesis_only:true
        },
        input:context,
        output_schema:{
          model_version:'string',
          uncertainty_summary:'string',
          variants:'array 2..5 of {variant_id,title,summary,mechanism,tradeoffs[],uncertainties[],source_refs[{kind,ref_id}]}'
        }
      }),
      signal:controller.signal
    });
    if(!res.ok)throw new Error(`Synthesis provider HTTP ${res.status}`);
    return validateSynthesisPayload(await res.json(),context);
  }finally{clearTimeout(timeout)}
}

export async function synthesizeVariants(context){
  const provider=String(process.env.SYNTHESIS_PROVIDER||'disabled').toLowerCase();
  if(provider!=='http_json')return {available:false,provider:'disabled',reason:'SYNTHESIS_PROVIDER_DISABLED',variants:[]};
  const endpoint=process.env.SYNTHESIS_ENDPOINT||process.env.SEMANTIC_ENDPOINT;
  if(!endpoint)throw new Error('SYNTHESIS_ENDPOINT required for SYNTHESIS_PROVIDER=http_json');
  return callJsonEndpoint(endpoint,process.env.SYNTHESIS_API_KEY||process.env.SEMANTIC_API_KEY||'',context);
}
