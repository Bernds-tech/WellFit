# WERK labour continuation — WERK-LAB-002

## Canonical working surface
- Repository: Bernds-tech/WellFit; branch: `werk-v49-preview-host`.
- WERK lives on this existing branch; generic WellFit main memory describes a different product. Do not merge WERK work into WellFit main.
- Starting commit: `b64294d78fd73282b3ff8d4554e6925a4674ffa7`.
- Sites project `appgprj_6a8b65c41b3c819189e70b47fd5c5827`, version 53, is a separate older publication. No Sites source or deployment was changed in this task.
- User scope: continue existing labour/data work, preserve consolidated models, machine-check progress; no theoretical employment or fiscal effect.

## Implemented and locally verified
- GAP-LAB-01 now has LAB-A through LAB-I, artifact evidence, scope and explicit closure conditions. Four bounded baseline layers closed, LAB-E partial, LAB-F/I open. Parent gap and employment/fiscal booking remain blocked; null means unknown, not zero benefit.
- Imported all 452 published workbook rows for Q2 2026: 51 national rows, 401 state rows across nine states. These are selective shortage signals, not the full 511-occupation universe or a joint qualification/supply/matching dataset.
- Pinned original XLSX and SHA256; stdlib importer checks every source row, code, label, numerical value, flag and locator against canonical JSON. National/state rows and hierarchical 4-/6-digit occupation rows are nonadditive.
- Raw displayed AMS vacancy stocks are quarterly averages without the agency discount; indicator inputs have their own agency adjustment. No 0.9 multiplier was applied to all displayed vacancies.
- Vienna August immediate vacancies 12087, estimated unemployment rate 11.7%, year-on-year vacancies -10.8%; Upper Austria unemployment 39324. Nine AL stocks reconcile to national 311448; eight comparable vacancy-stock ratios. Upper Austria's vacancy stock remains null, not backfilled by subtraction.
- Six education groups now declare their 12 member rows, with all sums and ratios verified. July education residual 869 stays unallocated; July/August/Q2 universes remain separate.
- Registry (tenth required contract), workstate, documents, manifest, project/site status and analysis references are synchronized. Existing progress percentages were not increased.

## Evidence and checks
- Prior expanded labour CI confirmed: https://github.com/Bernds-tech/WellFit/actions/runs/33996097649 (2ce04bd98f601b590635c0095bcb1de5c0d98e31), successful.
- Prior workstate CI confirmed: https://github.com/Bernds-tech/WellFit/actions/runs/33996225256, successful.
- Local current evidence: labour contract; source XLSX reconciliation; ten fault-injection checks; policy-field contract; existing inline registry and frontend data/manifest/accounting contracts all passed.
- Negative evidence: missing finite operand, null count, wrong ratio, overlapping education members, mixed month, duplicate occupation, invented employment effect, falsely closed joint-matching gate, source value drift and locator drift all rejected in isolated copies.
- Local implementation commit: `869423f` (22 files). Remote branch remains `b64294d78fd73282b3ff8d4554e6925a4674ffa7`, confirmed after rejected push.
- Publication blocked: automatic approval review rejected `git push origin HEAD:werk-v49-preview-host` because continuing work was not treated as explicit authorization to publish data/scripts/project-memory to a public repository. Do not retry via API or another route without explicit owner approval.
- User input required: approval to publish this concrete WERK change set to the existing public branch. No credentials or personal microdata were added; published official aggregate source data and project records are included.
- Remote CI for this implementation: not run; inspect exact published implementation commit after authorized push before reporting green.
- Lock released after local verification; task is implemented with publication/remote verification pending.

## Open evidence / next action
- LAB-SOURCE-001: XLSX NÖ Elektroinstallation T2=2, PDF text extraction T2=0. Preserve XLSX values; PDF is not independent confirmation of this component. Resolve against graphical original/provider before using that T2 for a reform judgment.
- Add same-period occupation × detail qualification × region unemployed supply and vacancy detail. Published signal scores are not a substitute for missing headcounts.
- Extend working-time/care feasibility, household net gains, transport, task-related health fit, qualification cost and 6/12-month retention with a counterfactual. No causal AMS effect follows from exits into employment alone.
- Complete directly sourced Upper Austria August vacancy stock.
- Continue existing monthly source review; no additional automation created.

## Countercheck and recovery
- Risk: R2; bounded data/validator changes on existing WERK branch.
- Independent evidence: source workbook re-extraction and original official report versus typed inputs, existing cross-artifact contracts and negative-path execution.
- Strongest falsifier: a published row/period differs from the pinned source, a bogus effect is accepted, or a missing combination becomes zero. Import reconciliation and fault injection reject these cases.
- Recovery: revert this bounded commit; no databases, credentials, APIs or production deployment were changed.
