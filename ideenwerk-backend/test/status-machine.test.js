import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransition, assertTransition } from '../src/lib/status-machine.js';

test('received can move to structured or privacy_hold', () => {
  assert.equal(canTransition('received', 'structured'), true);
  assert.equal(canTransition('received', 'privacy_hold'), true);
});

test('received cannot jump directly to reform_register', () => {
  assert.equal(canTransition('received', 'reform_register'), false);
  assert.throws(() => assertTransition('received', 'reform_register'), /Invalid IDEENWERK status transition/);
});

test('reform candidate can enter reform register', () => {
  assert.doesNotThrow(() => assertTransition('reform_candidate', 'reform_register'));
});
