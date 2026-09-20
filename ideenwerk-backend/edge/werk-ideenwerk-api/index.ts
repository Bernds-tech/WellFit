import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const secretKeysRaw = Deno.env.get('SUPABASE_SECRET_KEYS');
const legacyServiceRole = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
const SECRET_KEY = secretKeysRaw ? JSON.parse(secretKeysRaw)['default'] : legacyServiceRole;
if (!SUPABASE_URL || !SECRET_KEY) throw new Error('Supabase server credentials unavailable');

const supabase = createClient(SUPABASE_URL, SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
});

const ALLOWED_ORIGINS = new Set(['https://raw.githack.com']);
const encoder = new TextEncoder();

function corsHeaders(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.has(origin) ? origin : '';
  return {
    'access-control-allow-origin': allow,
    'access-control-allow-methods': 'GET,POST,OPTIONS',
    'access-control-allow-headers': 'authorization,content-type,idempotency-key',
    'access-control-max-age': '600',
    'cache-control': 'no-store',
    'pragma': 'no-cache',
    'content-type': 'application/json; charset=utf-8'
  };
}

function json(data: unknown, status=200, origin: string | null = null) {
  return new Response(JSON.stringify(data), { status, headers: corsHeaders(origin) });
}

function bytesToHex(bytes: Uint8Array) {
  return Array.from(bytes, b => b.toString(16).padStart(2,'0')).join('');
}

function randomHex(bytes: number) {
  return bytesToHex(crypto.getRandomValues(new Uint8Array(bytes))).toUpperCase();
}

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary=''; for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

async function sha256Hex(value: string) {
  return bytesToHex(new Uint8Array(await crypto.subtle.digest('SHA-256', encoder.encode(value))));
}

async function abuseSubjectHash(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || 'unknown').split(',')[0].trim();
  const ua = req.headers.get('user-agent') || '';
  const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(String(SECRET_KEY)), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', keyMaterial, encoder.encode(`ideenwerk-abuse-v1\n${ip}\n${ua}`));
  return bytesToHex(new Uint8Array(sig));
}

async function takeRateLimit(req: Request, routeKey: string, limit: number, seconds: number) {
  const subject = await abuseSubjectHash(req);
  const { data, error } = await supabase.rpc('ideenwerk_take_rate_limit', {
    p_subject_hash: subject,
    p_route_key: routeKey,
    p_limit: limit,
    p_window_seconds: seconds
  });
  if (error) throw error;
  return data === true;
}

function routePath(url: string) {
  const path = new URL(url).pathname;
  const marker = '/werk-ideenwerk-api';
  const pos = path.indexOf(marker);
  return pos >= 0 ? (path.slice(pos + marker.length) || '/') : path;
}

function laneSuggestion(topic: string | null, title: string | null, reviewStatus: string | null) {
  const text = `${topic || ''} ${title || ''}`.toLowerCase();
  const deepMarkers = ['verfassung','grundrecht','wahlrecht','volksabstimmung','staatsvertrag','eu-recht','menschenrecht'];
  if (deepMarkers.some(marker => text.includes(marker))) {
    return { process_lane_suggestion:'DEEP', process_lane_reason:'System-, Grundrechts- oder Verfassungsbezug erkannt.' };
  }
  if (reviewStatus === 'implemented_elsewhere' || reviewStatus === 'not_pursued') {
    return { process_lane_suggestion:'FAST', process_lane_reason:'Referenz-/Abschlusspfad ohne neue Vollprüfung.' };
  }
  return { process_lane_suggestion:'STANDARD', process_lane_reason:'Reguläre Fach-, Wirkungs- und Bürgerprüfung.' };
}

async function publicClusterList(limit: number) {
  const { data: clusters, error } = await supabase
    .from('clusters')
    .select('id,cluster_id,title,topic,region_scope,review_status,created_at,updated_at')
    .order('updated_at',{ascending:false})
    .limit(Math.min(50, Math.max(limit, 1)));
  if (error) throw error;
  const visible = (clusters || []).filter((c:any) => !['quarantine','removed'].includes(c.review_status));
  const ids = visible.map((c:any)=>c.id);
  const memberCounts = new Map<string,number>();
  const variantCounts = new Map<string,number>();
  if (ids.length) {
    const [{data:members,error:me},{data:variants,error:ve}] = await Promise.all([
      supabase.from('cluster_members').select('cluster_id').in('cluster_id',ids),
      supabase.from('cluster_variants').select('cluster_id').in('cluster_id',ids)
    ]);
    if (me) throw me; if (ve) throw ve;
    for (const m of members || []) memberCounts.set(m.cluster_id,(memberCounts.get(m.cluster_id)||0)+1);
    for (const v of variants || []) variantCounts.set(v.cluster_id,(variantCounts.get(v.cluster_id)||0)+1);
  }
  return visible.map((c:any)=>({
    cluster_id:c.cluster_id,title:c.title,topic:c.topic,region_scope:c.region_scope,
    review_status:c.review_status,submission_count:memberCounts.get(c.id)||0,
    variant_count:variantCounts.get(c.id)||0,updated_at:c.updated_at,
    ...laneSuggestion(c.topic,c.title,c.review_status)
  }));
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') {
    if (origin && !ALLOWED_ORIGINS.has(origin)) return json({code:'CORS_ORIGIN_DENIED'},403,origin);
    return new Response(null,{status:204,headers:corsHeaders(origin)});
  }
  if (origin && !ALLOWED_ORIGINS.has(origin)) return json({code:'CORS_ORIGIN_DENIED'},403,origin);

  try {
    const path = routePath(req.url);

    if (req.method === 'GET' && path === '/health') {
      const { data, error } = await supabase.from('ideenwerk_runtime_meta').select('value').eq('key','schema_contract').maybeSingle();
      if (error) throw error;
      return json({ok:true,service:'werk-ideenwerk-api',schema_contract:data?.value || null,mode:'staging'},200,origin);
    }

    if (req.method === 'POST' && path === '/submissions') {
      if (!(await takeRateLimit(req,'edge_submission',20,60))) return json({code:'RATE_LIMITED',message:'Zu viele Einreichungen. Bitte später erneut versuchen.'},429,origin);
      let body: any;
      try { body = await req.json(); } catch { return json({code:'INVALID_JSON'},400,origin); }
      const text = typeof body?.text === 'string' ? body.text.trim() : '';
      const region = typeof body?.region === 'string' ? body.region.trim() : null;
      const topic = typeof body?.topic === 'string' ? body.topic.trim() : null;
      if (text.length < 20 || text.length > 5000 || (region && region.length>120) || (topic && topic.length>120)) {
        return json({code:'INVALID_SUBMISSION',message:'Einreichung ist unvollständig oder ungültig.'},400,origin);
      }
      const publicId = `IDEA-${randomHex(8)}`;
      const statusToken = randomToken();
      const tokenHash = await sha256Hex(statusToken);
      const idempotencyKey = (req.headers.get('idempotency-key') || '').trim() || null;
      if (idempotencyKey && idempotencyKey.length > 200) return json({code:'INVALID_IDEMPOTENCY_KEY'},400,origin);

      const { data, error } = await supabase.rpc('ideenwerk_create_submission', {
        p_public_id: publicId,
        p_token_hash: tokenHash,
        p_original_text: text,
        p_region: region,
        p_topic: topic,
        p_consent_public_anonymous: body?.consent_public_anonymous === true,
        p_idempotency_key: idempotencyKey
      });
      if (error) throw error;
      if (data?.replayed) {
        return json({public_id:data.public_id,status:data.status,replayed:true,status_token_once:null,note:'Idempotente Wiederholung erkannt; ein bereits ausgegebener Status-Token wird nicht erneut ausgegeben.'},200,origin);
      }
      return json({public_id:data.public_id,status:data.status,replayed:false,status_token_once:statusToken,status_url:`/status/${data.public_id}`,note:'Status-Token sicher speichern. Er wird serverseitig nur gehasht gespeichert.'},201,origin);
    }

    const statusMatch = path.match(/^\/status\/(IDEA-[A-F0-9]{16})$/);
    if (req.method === 'GET' && statusMatch) {
      if (!(await takeRateLimit(req,'edge_status',60,60))) return json({code:'RATE_LIMITED'},429,origin);
      const auth = req.headers.get('authorization') || '';
      const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
      if (!token) return json({code:'STATUS_TOKEN_REQUIRED'},401,origin);
      const tokenHash = await sha256Hex(token);
      const { data, error } = await supabase.rpc('ideenwerk_get_private_status', { p_public_id: statusMatch[1], p_token_hash: tokenHash });
      if (error) throw error;
      if (!data) return json({code:'STATUS_ACCESS_DENIED'},403,origin);
      return json(data,200,origin);
    }

    if (req.method === 'GET' && path === '/clusters') {
      if (!(await takeRateLimit(req,'edge_clusters',120,60))) return json({code:'RATE_LIMITED'},429,origin);
      const url = new URL(req.url);
      const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit') || 12) || 12));
      return json({clusters:await publicClusterList(limit)},200,origin);
    }

    const clusterMatch = path.match(/^\/clusters\/(CLU-[A-F0-9]{16})$/);
    if (req.method === 'GET' && clusterMatch) {
      if (!(await takeRateLimit(req,'edge_cluster_detail',120,60))) return json({code:'RATE_LIMITED'},429,origin);
      const {data:cluster,error} = await supabase.from('clusters')
        .select('id,cluster_id,title,topic,region_scope,review_status,created_at,updated_at')
        .eq('cluster_id',clusterMatch[1]).maybeSingle();
      if (error) throw error;
      if (!cluster || ['quarantine','removed'].includes(cluster.review_status)) return json({code:'NOT_FOUND'},404,origin);
      const [{data:variants,error:ve},{count:submissionCount,error:ce}] = await Promise.all([
        supabase.from('cluster_variants').select('variant_id,title,summary,review_status,created_at,updated_at').eq('cluster_id',cluster.id).order('created_at',{ascending:true}),
        supabase.from('cluster_members').select('submission_id',{count:'exact',head:true}).eq('cluster_id',cluster.id)
      ]);
      if (ve) throw ve; if (ce) throw ce;
      return json({
        cluster:{cluster_id:cluster.cluster_id,title:cluster.title,topic:cluster.topic,region_scope:cluster.region_scope,review_status:cluster.review_status,submission_count:submissionCount||0,updated_at:cluster.updated_at,...laneSuggestion(cluster.topic,cluster.title,cluster.review_status)},
        variants:variants||[]
      },200,origin);
    }

    if (req.method === 'GET' && path === '/transparency/metrics') {
      if (!(await takeRateLimit(req,'edge_metrics',120,60))) return json({code:'RATE_LIMITED'},429,origin);
      const [s,c,v,t,r] = await Promise.all([
        supabase.from('submissions').select('id',{count:'exact',head:true}),
        supabase.from('clusters').select('id',{count:'exact',head:true}),
        supabase.from('cluster_variants').select('id',{count:'exact',head:true}),
        supabase.from('review_tasks').select('id',{count:'exact',head:true}).in('status',['open','assigned']),
        supabase.rpc('ideenwerk_public_review_depth_metrics')
      ]);
      for (const x of [s,c,v,t,r]) if (x.error) throw x.error;
      return json({
        submissions_total:s.count||0,
        problem_clusters_total:c.count||0,
        variants_total:v.count||0,
        open_review_tasks:t.count||0,
        review_depth:r.data||null,
        mode:'staging'
      },200,origin);
    }

    return json({code:'NOT_FOUND'},404,origin);
  } catch (error) {
    console.error('[werk-ideenwerk-api]', String((error as any)?.message || error));
    return json({code:'INTERNAL_ERROR',message:'Interner Fehler.'},500,origin);
  }
});
