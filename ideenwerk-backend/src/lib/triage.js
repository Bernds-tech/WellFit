export function routeIdea({ needsClarification=false, piiRisk=false, abuseRisk=false, rightsSensitive=false, existingMeasure=false, highAttention=false, qualitySignal=false, lowAttention=false }) {
  if (abuseRisk || piiRisk) return 'quarantine';
  if (existingMeasure) return 'fast_duplicate';
  if (needsClarification) return 'clarification';
  if (rightsSensitive) return 'rights_sensitive';
  if (qualitySignal && lowAttention) return 'high_quality_low_attention';
  if (highAttention) return 'high_attention';
  return 'standard_review';
}

export function publicSignals(input={}) {
  return {
    unique_submissions: Math.max(0, Number(input.unique_submissions || 0)),
    verified_support: Math.max(0, Number(input.verified_support || 0)),
    public_interest: Math.max(0, Number(input.public_interest || 0)),
    geographic_spread: Math.max(0, Number(input.geographic_spread || 0)),
    recurrence: Math.max(0, Number(input.recurrence || 0))
  };
}

// Absichtlich KEINE Funktion, die diese Signale zu einer politischen Gesamtnote summiert.
