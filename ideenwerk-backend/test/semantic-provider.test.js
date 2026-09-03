import test from 'node:test';
import assert from 'node:assert/strict';
import { extractSemanticFeatures } from '../src/lib/semantic-provider.js';

test('fallback separates first sentence as problem and remaining text as solution', async () => {
  const oldProvider = process.env.SEMANTIC_PROVIDER;
  process.env.SEMANTIC_PROVIDER = 'fallback';
  try {
    const result = await extractSemanticFeatures({
      original_text: 'Pflege zuhause ist für Familien schwierig. Mehr mobile Pflegedienste sollen finanziert werden.'
    });
    assert.equal(result.model_version, 'fallback-v2-sentence-split');
    assert.equal(result.problem_signature, 'pflege zuhause ist für familien schwierig');
    assert.equal(result.solution_signature, 'mehr mobile pflegedienste sollen finanziert werden');
    assert.equal(result.raw.sentence_split, true);
  } finally {
    if (oldProvider === undefined) delete process.env.SEMANTIC_PROVIDER;
    else process.env.SEMANTIC_PROVIDER = oldProvider;
  }
});

test('single-sentence fallback remains conservative and uses the full text for both signatures', async () => {
  const oldProvider = process.env.SEMANTIC_PROVIDER;
  process.env.SEMANTIC_PROVIDER = 'fallback';
  try {
    const result = await extractSemanticFeatures({
      original_text: 'Förderprogramme sollen regelmäßig auf Wirkung geprüft werden.'
    });
    assert.equal(result.problem_signature, result.solution_signature);
    assert.equal(result.raw.sentence_split, false);
  } finally {
    if (oldProvider === undefined) delete process.env.SEMANTIC_PROVIDER;
    else process.env.SEMANTIC_PROVIDER = oldProvider;
  }
});
