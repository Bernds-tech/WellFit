function normalizeText(value='') {
  return String(value)
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]+/gu,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function fallbackSignatures(proposal={}) {
  const raw = String(proposal.original_text || proposal.problem || proposal.proposal || '').trim();
  const sentences = raw.split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(Boolean);
  const problemRaw = sentences.length > 1 ? sentences[0] : (proposal.problem || raw);
  const solutionRaw = sentences.length > 1 ? sentences.slice(1).join(' ') : (proposal.proposal || raw);
  const problem = normalizeText(problemRaw);
  const solution = normalizeText(solutionRaw);
  return {
    provider: 'deterministic_fallback',
    model_version: 'fallback-v2-sentence-split',
    problem_signature: problem.slice(0,1200),
    solution_signature: solution.slice(0,1200),
    topic: proposal.topic || null,
    suggested_level: proposal.suggested_level || null,
    region_scope: proposal.region || null,
    open_questions: [],
    raw: { mode: 'fallback-no-semantic-provider', sentence_split: sentences.length > 1 }
  };
}

async function callJsonEndpoint(endpoint, apiKey, proposal) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(process.env.SEMANTIC_TIMEOUT_MS || 15000));
  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {})
      },
      body: JSON.stringify({
        task: 'werk_ideenwerk_structure',
        schema_version: '2026-09-02-v1',
        input: proposal,
        output_schema: {
          problem_signature: 'string <= 1200 chars',
          solution_signature: 'string <= 1200 chars',
          topic: 'string|null',
          suggested_level: 'string|null',
          region_scope: 'string|null',
          open_questions: 'array<string>'
        }
      }),
      signal: controller.signal
    });
    if (!res.ok) throw new Error(`Semantic provider HTTP ${res.status}`);
    const data = await res.json();
    if (!data || typeof data.problem_signature !== 'string' || typeof data.solution_signature !== 'string') {
      throw new Error('Semantic provider returned invalid structure');
    }
    return {
      provider: 'json_endpoint',
      model_version: String(data.model_version || 'external-v1'),
      problem_signature: normalizeText(data.problem_signature).slice(0,1200),
      solution_signature: normalizeText(data.solution_signature).slice(0,1200),
      topic: data.topic || proposal.topic || null,
      suggested_level: data.suggested_level || proposal.suggested_level || null,
      region_scope: data.region_scope || proposal.region || null,
      open_questions: Array.isArray(data.open_questions) ? data.open_questions.slice(0,20).map(String) : [],
      raw: data
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function extractSemanticFeatures(proposal) {
  const provider = String(process.env.SEMANTIC_PROVIDER || 'fallback').toLowerCase();
  if (provider === 'http_json') {
    const endpoint = process.env.SEMANTIC_ENDPOINT;
    if (!endpoint) throw new Error('SEMANTIC_ENDPOINT required for SEMANTIC_PROVIDER=http_json');
    try {
      return await callJsonEndpoint(endpoint, process.env.SEMANTIC_API_KEY || '', proposal);
    } catch (error) {
      if (String(process.env.SEMANTIC_FAIL_OPEN || 'true').toLowerCase() !== 'true') throw error;
      return { ...fallbackSignatures(proposal), raw: { mode: 'fallback-after-provider-error', error: String(error.message || error) } };
    }
  }
  return fallbackSignatures(proposal);
}
