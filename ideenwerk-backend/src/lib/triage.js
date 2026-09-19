const BILLION_EUR = 1_000_000_000;

export function routeIdea(input) {
  const duplicate = Number(input.duplicateProbability || 0);
  const support = Number(input.supportCount || 0);
  const priority = Number(input.priority || 0);
  const qualitySignal = Number(input.qualitySignal || 0);

  if (input.abuseOrSpam === true) return { queue: 'quarantine', reason: 'spam_or_abuse' };
  if (input.piiUnclear === true) return { queue: 'quarantine', reason: 'pii_unclear' };
  if (input.needsClarification === true) return { queue: 'clarification', reason: 'clarification_needed' };
  if (input.rightsSensitive === true) return { queue: 'rights_sensitive', reason: 'rights_or_equality' };
  if (input.existingMeasure === true) return { queue: 'existing_measure_review', reason: 'current_measure_overlap' };
  if (duplicate >= 0.86) return { queue: 'fast_duplicate', reason: 'very_likely_duplicate' };
  if (support >= 200 || priority >= 85) return { queue: 'high_attention', reason: 'high_support_or_priority' };
  if (qualitySignal >= 75 && support < 30) return { queue: 'quality_low_attention', reason: 'good_signal_low_attention' };
  return { queue: 'standard_review', reason: 'default' };
}

/**
 * Assigns procedural review depth without deciding political merit.
 * Missing or uncertain risk signals deliberately default to STANDARD rather
 * than inferring sensitivity from citizen wording.
 */
export function reviewDepthForRoute(route, signals = {}) {
  if (route === 'quarantine' || route === 'clarification') return null;

  const annualFiscalEffect = Number(signals.annualFiscalEffectEur);
  const requiresDeepReview =
    route === 'rights_sensitive' ||
    signals.constitutionalSensitive === true ||
    signals.securitySensitive === true ||
    (Number.isFinite(annualFiscalEffect) && annualFiscalEffect >= BILLION_EUR);

  if (requiresDeepReview) return 'DEEP';
  if (route === 'fast_duplicate') return 'FAST';
  if (route === 'standard_review' && signals.smallReversible === true) return 'FAST';
  return 'STANDARD';
}
