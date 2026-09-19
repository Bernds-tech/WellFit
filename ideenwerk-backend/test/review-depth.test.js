import test from 'node:test';
import assert from 'node:assert/strict';
import { reviewDepthForRoute } from '../src/lib/triage.js';

test('clarification and quarantine do not receive substantive review depth', () => {
  assert.equal(reviewDepthForRoute('clarification'), null);
  assert.equal(reviewDepthForRoute('quarantine'), null);
});

test('explicit rights, constitutional and security signals require DEEP review', () => {
  assert.equal(reviewDepthForRoute('rights_sensitive'), 'DEEP');
  assert.equal(reviewDepthForRoute('standard_review', { constitutionalSensitive: true }), 'DEEP');
  assert.equal(reviewDepthForRoute('standard_review', { securitySensitive: true }), 'DEEP');
});

test('confirmed billion-euro annual fiscal magnitude requires DEEP review', () => {
  assert.equal(reviewDepthForRoute('standard_review', { annualFiscalEffectEur: 1_000_000_000 }), 'DEEP');
  assert.equal(reviewDepthForRoute('standard_review', { annualFiscalEffectEur: 999_999_999 }), 'STANDARD');
});

test('duplicates and explicitly small reversible work can use FAST review', () => {
  assert.equal(reviewDepthForRoute('fast_duplicate'), 'FAST');
  assert.equal(reviewDepthForRoute('standard_review', { smallReversible: true }), 'FAST');
});

test('general and unknown routes default conservatively to STANDARD', () => {
  assert.equal(reviewDepthForRoute('standard_review'), 'STANDARD');
  assert.equal(reviewDepthForRoute('high_attention'), 'STANDARD');
  assert.equal(reviewDepthForRoute('future_queue'), 'STANDARD');
});
