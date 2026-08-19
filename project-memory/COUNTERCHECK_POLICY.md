# Countercheck Policy

The second-pass verification must be independent from the implementation pass.

## Independent evidence
Use at least one different evidence source than the one used to claim success. Task text alone is never sufficient.

Examples: task text -> final diff + CI; build -> runtime/preview; UI change -> rendered preview/screenshot; PR description -> actual changed files and checks.

## Freshness
Final evidence must match the current reviewed commit, PR/branch and target preview/runtime where applicable. Older evidence is `STALE` and cannot close the task.

## Negative/regression check
Verify the most relevant failure path or previous regression as well as the success path.

## Triangulation
High-impact work requires at least two evidence classes before `ACCEPTED` or `PRODUCTION_CONFIRMED`.

## Separation
Execution receipts must record implementation evidence and countercheck evidence separately.

## Contradictions
Any disagreement between project memory, Git/PR, CI or runtime becomes `RECONCILIATION_REQUIRED` until resolved from current verified evidence.

## Completion gate
Completion requires current evidence, independent countercheck evidence, no unresolved reconciliation finding, no stale lock, no untracked started work/open loop and the required negative/regression check.