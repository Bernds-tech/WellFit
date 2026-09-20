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
const decoder = new TextDecoder();
const PRIVACY_REQUEST_TYPES = new Set(['export','correction','deletion','restriction','cluster_appeal']);
const CLUSTER_CURSOR_VERSION = 1;

type ClusterFilters = {
  topic: string | null;
  region: string | null;
  status: string | null;
};

type ClusterCursor = ClusterFilters & {
  v: number;
  updated_at: string;
  cluster_id: string;
};

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

function bearerToken(req: Request) {
  const auth = req.headers.get('authorization') || '';
  return auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
}

async function statusTokenHash(req: Request) {
  const token = bearerToken(req);
  return token ? await sha256Hex(token) : null;
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

function encodeClusterCursor(cursor: ClusterCursor) {
  const bytes = encoder.encode(JSON.stringify(cursor));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

function decodeClusterCursor(value: string, filters: ClusterFilters): ClusterCursor | null {
  try {
    if (!value || value.length > 1000 || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
    const normalized = value.replace(/-/g,'+').replace(/_/g,'/');
    const padded = normalized + '='.repeat((4 - normalized.length % 4) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, char => char.charCodeAt(0));
    const parsed = JSON.parse(decoder.decode(bytes));
    if (!parsed || parsed.v !== CLUSTER_CURSOR_VERSION) return null;
    if (!/^CLU-[A-F0-9]{16}$/.test(parsed.cluster_id || '')) return null;
    if (!parsed.updated_at || !Number.isFinite(Date.parse(parsed.updated_at))) return null;
    for (const key of ['topic','region','status'] as const) {
      if (parsed[key] !== null && (typeof parsed[key] !== 'string' || parsed[key].length > 120)) return null;
      if (parsed[key] !== filters[key]) return null;
    }
    return {
      v: CLUSTER_CURSOR_VERSION,
      updated_at: new Date(parsed.updated_at).toISOString(),
      cluster_id: parsed.cluster_id,
      topic: parsed.topic,
      region: parsed.region,
      status: parsed.status
    };
  } catch {
    return null;
  }
}

function clusterFilterValue(url: URL, name: 'topic' | 'region' | 'status') {
  if (!url.searchParams.has(name)) return { value: null, valid: true };
  const value = String(url.searchParams.get(name) || '').trim();
  return { value: value || null, valid: value.length > 0 && value.length <= 120 };
}

async function privateClarifications(publicId: string, tokenHash: string) {
  const { data, error } = await supabase.rpc('ideenwerk_list_clarifications', { p_public_id: publicId, p_token_hash: tokenHash });
  if (error) throw error;
  return Array.isArray(data?.clarifications) ? data.clarifications : [];
}

async function publicClusterList(limit: number, filters: ClusterFilters, cursor: ClusterCursor | null) {
  let query = supabase
    .from('clusters')
    .select('id,cluster_id,title,topic,region_scope,review_status,created_at,updated_at')
    .neq('review_status','quarantine')
    .neq('review_status','removed');

  if (filters.topic) query = query.eq('topic', filters.topic);
  if (filters.region) query = query.eq('region_scope', filters.region);
  if (filters.status) query = query.eq('review_status', filters.status);
  if (cursor) {
    query = query.or(`updated_at.lt.${cursor.updated_at},and(updated_at.eq.${cursor.updated_at},cluster_id.lt.${cursor.cluster_id})`);
  }

  const { data: clusters, error } = await query
    .order('updated_at',{ascending:false})
    .order('cluster_id',{ascending:false})
    .limit(limit + 1);
  if (error) throw error;

  const rows = clusters || [];
  const page = rows.slice(0, limit);
  const ids = page.map((c:any)=>c.id);
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

  const publicClusters = page.map((c:any)=>({
    cluster_id:c.cluster_id,title:c.title,topic:c.topic,region_scope:c.region_scope,
    review_status:c.review_status,submission_count:memberCounts.get(c.id)||0,
    variant_count:variantCounts.get(c.id)||0,updated_at:c.updated_at,
    ...laneSuggestion(c.topic,c.title,c.review_status)
  }));
  const last = rows.length > limit ? page[page.length - 1] : null;
  const nextCursor = last ? encodeClusterCursor({
    v: CLUSTER_CURSOR_VERSION,
    updated_at: new Date(last.updated_at).toISOString(),
    cluster_id: last.cluster_id,
    topic: filters.topic,
    region: filters.region,
    status: filters.status
  }) : null;

  return { clusters: publicClusters, next_cursor: nextCursor };
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

    const clarificationMatch = path.match(/^\/status\/(IDEA-[A-F0-9]{16})\/clarification$/);
    if (req.method === 'POST' && clarificationMatch) {
      if (!(await takeRateLimit(req,'edge_clarification',20,60))) return json({code:'RATE_LIMITED'},429,origin);
      const tokenHash = await statusTokenHash(req);
      if (!tokenHash) return json({code:'STATUS_TOKEN_REQUIRED'},401,origin);
      let body: any;
      try { body = await req.json(); } catch { return json({code:'INVALID_JSON'},400,origin); }
      const text = typeof body?.text === 'string' ? body.text.trim() : '';
      const idempotencyKey = (req.headers.get('idempotency-key') || '').trim() || null;
      if (text.length < 5 || text.length > 3000 || (idempotencyKey && idempotencyKey.length>200)) {
        return json({code:'INVALID_CLARIFICATION',message:'Klarstellung ist unvollständig oder ungültig.'},400,origin);
      }
      const { data, error } = await supabase.rpc('ideenwerk_submit_clarification', {
        p_public_id: clarificationMatch[1],
        p_token_hash: tokenHash,
        p_response_text: text,
        p_idempotency_key: idempotencyKey
      });
      if (error) throw error;
      if (!data) return json({code:'STATUS_ACCESS_DENIED'},403,origin);
      if (data.accepted === false) {
        const code = data.code || 'CLARIFICATION_REJECTED';
        const status = code === 'CLARIFICATION_PII_DETECTED' || code === 'INVALID_CLARIFICATION' || code === 'INVALID_IDEMPOTENCY_KEY' ? 400 : 409;
        return json({code,current_status:data.current_status||null,message:code==='CLARIFICATION_PII_DETECTED'?'Bitte entferne E-Mail-Adressen oder Telefonnummern aus der Klarstellung.':'Die Klarstellung kann im aktuellen Verfahrenszustand nicht übernommen werden.'},status,origin);
      }
      return json({...data,note:'Der Originaltext bleibt unverändert. Die private Klarstellung wurde in die bestehende Strukturierungs- und Prüfstrecke übernommen.'},data.replayed?200:201,origin);
    }

    const statusMatch = path.match(/^\/status\/(IDEA-[A-F0-9]{16})$/);
    if (req.method === 'GET' && statusMatch) {
      if (!(await takeRateLimit(req,'edge_status',60,60))) return json({code:'RATE_LIMITED'},429,origin);
      const tokenHash = await statusTokenHash(req);
      if (!tokenHash) return json({code:'STATUS_TOKEN_REQUIRED'},401,origin);
      const { data, error } = await supabase.rpc('ideenwerk_get_private_status', { p_public_id: statusMatch[1], p_token_hash: tokenHash });
      if (error) throw error;
      if (!data) return json({code:'STATUS_ACCESS_DENIED'},403,origin);
      const clarifications = await privateClarifications(statusMatch[1],tokenHash);
      return json({...data,clarifications},200,origin);
    }

    const privacyExportMatch = path.match(/^\/privacy\/export\/(IDEA-[A-F0-9]{16})$/);
    if (req.method === 'GET' && privacyExportMatch) {
      if (!(await takeRateLimit(req,'edge_privacy_export',30,60))) return json({code:'RATE_LIMITED'},429,origin);
      const tokenHash = await statusTokenHash(req);
      if (!tokenHash) return json({code:'STATUS_TOKEN_REQUIRED'},401,origin);
      const { data, error } = await supabase.rpc('ideenwerk_get_privacy_export', { p_public_id: privacyExportMatch[1], p_token_hash: tokenHash });
      if (error) throw error;
      if (!data) return json({code:'STATUS_ACCESS_DENIED'},403,origin);
      const clarifications = await privateClarifications(privacyExportMatch[1],tokenHash);
      return json({...data,citizen_clarifications:clarifications},200,origin);
    }

    const privacyRequestsMatch = path.match(/^\/privacy\/requests\/(IDEA-[A-F0-9]{16})$/);
    if (req.method === 'GET' && privacyRequestsMatch) {
      if (!(await takeRateLimit(req,'edge_privacy_list',30,60))) return json({code:'RATE_LIMITED'},429,origin);
      const tokenHash = await statusTokenHash(req);
      if (!tokenHash) return json({code:'STATUS_TOKEN_REQUIRED'},401,origin);
      const { data, error } = await supabase.rpc('ideenwerk_list_privacy_requests', { p_public_id: privacyRequestsMatch[1], p_token_hash: tokenHash });
      if (error) throw error;
      if (!data) return json({code:'STATUS_ACCESS_DENIED'},403,origin);
      return json(data,200,origin);
    }

    if (req.method === 'POST' && privacyRequestsMatch) {
      if (!(await takeRateLimit(req,'edge_privacy_request',20,60))) return json({code:'RATE_LIMITED'},429,origin);
      const tokenHash = await statusTokenHash(req);
      if (!tokenHash) return json({code:'STATUS_TOKEN_REQUIRED'},401,origin);
      let body: any;
      try { body = await req.json(); } catch { return json({code:'INVALID_JSON'},400,origin); }
      const requestType = typeof body?.request_type === 'string' ? body.request_type.trim() : '';
      const details = typeof body?.details === 'string' ? body.details.trim() : null;
      if (!PRIVACY_REQUEST_TYPES.has(requestType) || (details && details.length > 3000)) {
        return json({code:'INVALID_PRIVACY_REQUEST',message:'Datenschutzanfrage ist ungültig.'},400,origin);
      }
      const { data, error } = await supabase.rpc('ideenwerk_create_privacy_request', {
        p_public_id: privacyRequestsMatch[1],
        p_token_hash: tokenHash,
        p_request_type: requestType,
        p_details: details
      });
      if (error) throw error;
      if (!data) return json({code:'STATUS_ACCESS_DENIED'},403,origin);
      return json({
        ...data,
        note: requestType === 'deletion'
          ? 'Der Löschwunsch wurde als prüfbarer Vorgang erfasst. Es erfolgt keine automatische irreversible Löschung.'
          : 'Die Datenschutzanfrage wurde erfasst und bleibt über den privaten Status nachvollziehbar.'
      },data.replayed?200:201,origin);
    }

    if (req.method === 'GET' && path === '/clusters') {
      if (!(await takeRateLimit(req,'edge_clusters',120,60))) return json({code:'RATE_LIMITED'},429,origin);
      const url = new URL(req.url);
      const allowed = new Set(['limit','topic','region','status','cursor']);
      for (const key of url.searchParams.keys()) {
        if (!allowed.has(key)) return json({code:'INVALID_CLUSTER_QUERY',message:`Unbekannter Query-Parameter: ${key}`},400,origin);
      }
      const limitRaw = url.searchParams.get('limit');
      const limitNumber = limitRaw === null ? 12 : Number(limitRaw);
      if (!Number.isInteger(limitNumber) || limitNumber < 1 || limitNumber > 50) {
        return json({code:'INVALID_CLUSTER_QUERY',message:'limit muss eine ganze Zahl zwischen 1 und 50 sein.'},400,origin);
      }
      const topic = clusterFilterValue(url,'topic');
      const region = clusterFilterValue(url,'region');
      const status = clusterFilterValue(url,'status');
      if (!topic.valid || !region.valid || !status.valid || ['quarantine','removed'].includes(status.value || '')) {
        return json({code:'INVALID_CLUSTER_QUERY',message:'Cluster-Filter sind ungültig oder nicht öffentlich.'},400,origin);
      }
      const filters: ClusterFilters = { topic: topic.value, region: region.value, status: status.value };
      const cursorRaw = url.searchParams.get('cursor');
      const cursor = cursorRaw ? decodeClusterCursor(cursorRaw, filters) : null;
      if (cursorRaw && !cursor) return json({code:'INVALID_CURSOR',message:'Cursor ist ungültig oder passt nicht zu den Filtern.'},400,origin);
      return json(await publicClusterList(limitNumber, filters, cursor),200,origin);
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
