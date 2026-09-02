import test from 'node:test';
import assert from 'node:assert/strict';
import { decideClusterRelation } from '../src/lib/cluster-decision.js';

test('very similar problem and solution can become same-solution candidate', () => {
  const r = decideClusterRelation({ problemSimilarity: 0.97, solutionSimilarity: 0.95, sameLevel: true, sameRegionScope: true });
  assert.equal(r.relation, 'same_problem_same_solution');
  assert.equal(r.action, 'auto_cluster_candidate');
});

test('same problem but different solution is preserved as variant', () => {
  const r = decideClusterRelation({ problemSimilarity: 0.94, solutionSimilarity: 0.41, sameLevel: true, sameRegionScope: true });
  assert.equal(r.relation, 'same_problem_different_solution');
  assert.equal(r.humanReview, true);
});

test('medium overlap goes to human review', () => {
  const r = decideClusterRelation({ problemSimilarity: 0.82, solutionSimilarity: 0.66 });
  assert.equal(r.relation, 'possible_overlap');
  assert.equal(r.action, 'human_cluster_review');
});

test('low overlap stays separate', () => {
  const r = decideClusterRelation({ problemSimilarity: 0.33, solutionSimilarity: 0.28 });
  assert.equal(r.relation, 'separate');
  assert.equal(r.action, 'keep_separate');
});

test('different decision level blocks automatic same-solution candidate', () => {
  const r = decideClusterRelation({ problemSimilarity: 0.98, solutionSimilarity: 0.97, sameLevel: false, sameRegionScope: true });
  assert.notEqual(r.relation, 'same_problem_same_solution');
});
