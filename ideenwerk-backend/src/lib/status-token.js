import { createHash, randomBytes } from 'node:crypto';

export function createStatusToken() {
  return randomBytes(32).toString('base64url');
}

export function hashStatusToken(token) {
  return createHash('sha256').update(String(token), 'utf8').digest('hex');
}

export function createPublicId() {
  return `IDEA-${randomBytes(8).toString('hex').toUpperCase()}`;
}

export function createEventId() {
  return `EVT-${randomBytes(10).toString('hex').toUpperCase()}`;
}
