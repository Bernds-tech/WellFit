const DEFAULTS = Object.freeze({
  autoSameProblem: 0.92,
  autoSameSolution: 0.90,
  variantProblem: 0.88,
  variantSolutionMax: 0.72,
  reviewProblem: 0.78,
  reviewSolution: 0.60
});

export function decideClusterRelation(input, thresholds = DEFAULTS) {
  const problem = Number(input.problemSimilarity ?? 0);
  const solution = Number(input.solutionSimilarity ?? 0);
  const sameLevel = input.sameLevel !== false;
  const sameRegionScope = input.sameRegionScope !== false;

  if (problem >= thresholds.autoSameProblem && solution >= thresholds.autoSameSolution && sameLevel && sameRegionScope) {
    return {
      relation: 'same_problem_same_solution',
      action: 'auto_cluster_candidate',
      humanReview: false,
      confidenceBand: 'very_high',
      reason: 'Problem- und Lösungssignatur stimmen sehr stark überein; Ebene und Regionsbezug widersprechen nicht.'
    };
  }

  if (problem >= thresholds.variantProblem && solution <= thresholds.variantSolutionMax) {
    return {
      relation: 'same_problem_different_solution',
      action: 'preserve_variant_review',
      humanReview: true,
      confidenceBand: 'high_problem_low_solution',
      reason: 'Das Problem ist sehr ähnlich, die vorgeschlagene Lösung unterscheidet sich jedoch deutlich. Varianten dürfen nicht verschmolzen werden.'
    };
  }

  if (problem >= thresholds.reviewProblem || solution >= thresholds.reviewSolution) {
    return {
      relation: 'possible_overlap',
      action: 'human_cluster_review',
      humanReview: true,
      confidenceBand: 'medium',
      reason: 'Es gibt relevante Überschneidungen, aber nicht genug Evidenz für eine automatische Bündelung.'
    };
  }

  return {
    relation: 'separate',
    action: 'keep_separate',
    humanReview: false,
    confidenceBand: 'low',
    reason: 'Problem- und Lösungssignaturen sind nicht ähnlich genug für eine Bündelung.'
  };
}

export function defaultClusterThresholds() {
  return { ...DEFAULTS };
}
