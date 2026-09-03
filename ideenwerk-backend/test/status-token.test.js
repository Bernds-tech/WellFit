import test from 'node:test';
import assert from 'node:assert/strict';
import { createStatusToken, hashStatusToken, createPublicId, createEventId } from '../src/lib/status-token.js';

test('status tokens are random-looking and only compared through SHA-256 hashes', () => {
  const a = createStatusToken();
  const b = createStatusToken();
  assert.notEqual(a, b);
  assert.ok(a.length >= 40);
  assert.match(hashStatusToken(a), /^[a-f0-9]{64}$/);
  assert.equal(hashStatusToken(a), hashStatusToken(a));
  assert.notEqual(hashStatusToken(a), hashStatusToken(b));
  assert.notEqual(hashStatusToken(a), a);
});

test('public and audit identifiers use separate non-secret prefixes', () => {
  assert.match(createPublicId(), /^IDEA-[A-F0-9]{16}$/);
  assert.match(createEventId(), /^EVT-[A-F0-9]{20}$/);
});
