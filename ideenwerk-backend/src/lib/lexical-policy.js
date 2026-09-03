const ELIGIBLE_CANDIDATE_STATUSES = new Set([
  'structured',
  'cluster_review',
  'clustered',
  'precheck',
  'theme_room',
  'impact_review',
  'reform_candidate',
  'reform_register',
  'decision_path',
  'implemented_elsewhere'
]);

function key(value) {
  return String(value ?? '').normalize('NFKC').trim().toLowerCase();
}

export function lexicalAutoClusterDecision({ current = {}, candidate = {}, similarity = 0, threshold = 0.90 }) {
  const sim = Number(similarity || 0);
  const min = Number(threshold || 0.90);
  if (sim < min) return { allowed: false, reason: 'below_similarity_threshold' };
  if (!ELIGIBLE_CANDIDATE_STATUSES.has(String(candidate.current_status || ''))) {
    return { allowed: false, reason: 'candidate_status_not_safe' };
  }
  if (key(current.region) !== key(candidate.region)) {
    return { allowed: false, reason: 'region_scope_differs' };
  }
  if (key(current.topic) !== key(candidate.topic)) {
    return { allowed: false, reason: 'topic_differs' };
  }
  return { allowed: true, reason: 'exact_scope_and_high_lexical_similarity' };
}

export function lexicalCandidateStatuses() {
  return [...ELIGIBLE_CANDIDATE_STATUSES];
}
