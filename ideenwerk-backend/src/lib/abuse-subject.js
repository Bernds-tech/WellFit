import { createHmac } from 'node:crypto';

export function createAbuseSubjectHash({ ip = '', userAgent = '' } = {}, secret) {
  const key = String(secret || '');
  if (key.length < 32) {
    const err = new Error('ABUSE_HASH_SECRET must contain at least 32 characters');
    err.code = 'ABUSE_HASH_SECRET_TOO_SHORT';
    throw err;
  }
  const normalizedIp = String(ip || '').trim();
  const normalizedUa = String(userAgent || '').normalize('NFKC').trim().slice(0,256);
  return createHmac('sha256', key)
    .update(normalizedIp, 'utf8')
    .update('\n', 'utf8')
    .update(normalizedUa, 'utf8')
    .digest('hex');
}

export function distributedRatePolicy(method, route) {
  const m = String(method || '').toUpperCase();
  const r = String(route || '');
  if (m === 'POST' && r === '/api/ideenwerk/v1/submissions') return { key:'submission', limit:20, windowSeconds:60 };
  if (m === 'POST' && r === '/api/ideenwerk/v1/moderation/report') return { key:'moderation_report', limit:30, windowSeconds:60 };
  if (m === 'POST' && r === '/api/ideenwerk/v1/privacy/requests/:publicId') return { key:'privacy_request', limit:30, windowSeconds:60 };
  if (m === 'GET' && r === '/api/ideenwerk/v1/privacy/export/:publicId') return { key:'privacy_export', limit:60, windowSeconds:60 };
  if (m === 'GET' && r === '/api/ideenwerk/v1/status/:publicId') return { key:'private_status', limit:120, windowSeconds:60 };
  return null;
}
