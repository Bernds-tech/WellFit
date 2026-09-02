import test from 'node:test';
import assert from 'node:assert/strict';
import { routeIdea, publicSignals } from '../src/lib/triage.js';

test('PII/abuse risks go to quarantine before popularity signals', () => {
  assert.equal(routeIdea({ piiRisk: true, highAttention: true }), 'quarantine');
  assert.equal(routeIdea({ abuseRisk: true, qualitySignal: true }), 'quarantine');
});

test('low-attention quality idea gets special review path', () => {
  assert.equal(routeIdea({ qualitySignal: true, lowAttention: true }), 'high_quality_low_attention');
});

test('high attention does not equal political acceptance', () => {
  assert.equal(routeIdea({ highAttention: true }), 'high_attention');
});

test('public signals stay separate and clamp negative values', () => {
  assert.deepEqual(publicSignals({ unique_submissions: 10, verified_support: 4, public_interest: -5 }), {
    unique_submissions: 10,
    verified_support: 4,
    public_interest: 0,
    geographic_spread: 0,
    recurrence: 0
  });
});
