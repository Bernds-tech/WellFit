import test from 'node:test';
import assert from 'node:assert/strict';
import { lexicalAutoClusterDecision } from '../src/lib/lexical-policy.js';

const base = { region: 'Wien', topic: 'Verwaltung' };

test('high lexical similarity with same scope can auto-cluster', () => {
  const r = lexicalAutoClusterDecision({
    current: base,
    candidate: { ...base, current_status: 'precheck' },
    similarity: 0.96
  });
  assert.equal(r.allowed, true);
});

test('same text from another region does not auto-cluster', () => {
  const r = lexicalAutoClusterDecision({
    current: base,
    candidate: { region: 'Tirol', topic: 'Verwaltung', current_status: 'precheck' },
    similarity: 0.99
  });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'region_scope_differs');
});

test('same text with another topic does not auto-cluster', () => {
  const r = lexicalAutoClusterDecision({
    current: base,
    candidate: { region: 'Wien', topic: 'Gesundheit & Pflege', current_status: 'precheck' },
    similarity: 0.99
  });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'topic_differs');
});

test('unreviewed or held candidate cannot become lexical auto-cluster anchor', () => {
  for (const current_status of ['received','privacy_hold','quarantine','removed','clarification']) {
    const r = lexicalAutoClusterDecision({
      current: base,
      candidate: { ...base, current_status },
      similarity: 0.99
    });
    assert.equal(r.allowed, false, current_status);
    assert.equal(r.reason, 'candidate_status_not_safe');
  }
});

test('threshold remains mandatory', () => {
  const r = lexicalAutoClusterDecision({
    current: base,
    candidate: { ...base, current_status: 'precheck' },
    similarity: 0.89,
    threshold: 0.90
  });
  assert.equal(r.allowed, false);
  assert.equal(r.reason, 'below_similarity_threshold');
});
