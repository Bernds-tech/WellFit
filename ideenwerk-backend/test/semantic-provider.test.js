import test from 'node:test';
import assert from 'node:assert/strict';
import { extractSemanticFeatures } from '../src/lib/semantic-provider.js';

function snapshotEnv(keys) {
  return Object.fromEntries(keys.map(k => [k, process.env[k]]));
}
function restoreEnv(snapshot) {
  for (const [k,v] of Object.entries(snapshot)) {
    if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
}

test('fallback separates first sentence as problem and remaining text as solution', async () => {
  const env = snapshotEnv(['SEMANTIC_PROVIDER']);
  process.env.SEMANTIC_PROVIDER = 'fallback';
  try {
    const result = await extractSemanticFeatures({
      original_text: 'Pflege zuhause ist für Familien schwierig. Mehr mobile Pflegedienste sollen finanziert werden.'
    });
    assert.equal(result.model_version, 'fallback-v2-sentence-split');
    assert.equal(result.problem_signature, 'pflege zuhause ist für familien schwierig');
    assert.equal(result.solution_signature, 'mehr mobile pflegedienste sollen finanziert werden');
    assert.equal(result.raw.sentence_split, true);
  } finally { restoreEnv(env); }
});

test('single-sentence fallback remains conservative and uses the full text for both signatures', async () => {
  const env = snapshotEnv(['SEMANTIC_PROVIDER']);
  process.env.SEMANTIC_PROVIDER = 'fallback';
  try {
    const result = await extractSemanticFeatures({
      original_text: 'Förderprogramme sollen regelmäßig auf Wirkung geprüft werden.'
    });
    assert.equal(result.problem_signature, result.solution_signature);
    assert.equal(result.raw.sentence_split, false);
  } finally { restoreEnv(env); }
});

test('external semantic provider failure falls back safely when fail-open is enabled', async () => {
  const env = snapshotEnv(['SEMANTIC_PROVIDER','SEMANTIC_ENDPOINT','SEMANTIC_FAIL_OPEN','SEMANTIC_TIMEOUT_MS']);
  Object.assign(process.env, {
    SEMANTIC_PROVIDER: 'http_json',
    SEMANTIC_ENDPOINT: 'http://127.0.0.1:1/unreachable',
    SEMANTIC_FAIL_OPEN: 'true',
    SEMANTIC_TIMEOUT_MS: '100'
  });
  try {
    const result = await extractSemanticFeatures({ original_text: 'Ein Bürgerbeitrag mit zwei Sätzen. Die Lösung soll später semantisch geprüft werden.' });
    assert.equal(result.provider, 'deterministic_fallback');
    assert.equal(result.model_version, 'fallback-v2-sentence-split');
    assert.equal(result.raw.mode, 'fallback-after-provider-error');
  } finally { restoreEnv(env); }
});

test('external semantic provider failure is surfaced when fail-open is disabled', async () => {
  const env = snapshotEnv(['SEMANTIC_PROVIDER','SEMANTIC_ENDPOINT','SEMANTIC_FAIL_OPEN','SEMANTIC_TIMEOUT_MS']);
  Object.assign(process.env, {
    SEMANTIC_PROVIDER: 'http_json',
    SEMANTIC_ENDPOINT: 'http://127.0.0.1:1/unreachable',
    SEMANTIC_FAIL_OPEN: 'false',
    SEMANTIC_TIMEOUT_MS: '100'
  });
  try {
    await assert.rejects(
      () => extractSemanticFeatures({ original_text: 'Dieser Test muss den Providerfehler sichtbar machen.' }),
      /fetch failed|Semantic provider|ECONNREFUSED|abort/i
    );
  } finally { restoreEnv(env); }
});
