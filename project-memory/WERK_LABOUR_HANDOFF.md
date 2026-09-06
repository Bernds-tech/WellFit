# WERK labour continuation — WERK-LAB-003

## Current continuation — 2026-09-06
- WERK-LAB-003 is VERIFIED and published at `ece6767e5a4d4362f43c07a0ae7033b509de585a`. All 13 triggered workflows succeeded on this exact implementation commit, including both new source imports and 21 fault-injection cases. Run IDs and URLs: `WERK_LABOUR_003_CI_RECEIPT.json`.
- All 24 blob hashes and full tree match local implementation `5894c72`, preserved on `archive/werk-lab-003-local-5894c72`. The connected GitHub app performed the non-forced branch update. No publication approval is pending for this completed change set.
- Existing regional baseline now reconciles all nine AL and OS stocks directly to pinned `ams-eckdaten-2026-08.xlsx`: 311448 / 79769 nationally, OÖ vacancies 19678. Gender, youth, 50-plus, long-term unemployment and apprenticeship counts retain source cell locators and overlapping-population warnings.
- New `labour-occupation-supply-2026-08.json`: 3072 observed state/4-digit-occupation pairs; 1962 both observed, 1013 supply-only and 97 vacancy-only. Unknown sides remain null. Explicitly published zero remains zero.
- Source: 40818 AL occupational-wish rows / 10763 immediately available OS rows for 2026-08-31, all regional and national stocks reconciled with the separate official workbook. AL records include stock/entry/exit: only BESTAND is aggregated. Sex/nationality rows are aggregated, without additional filtering.
- Pinned gzip files contain original header + unmodified cp1252 source lines for the one month. Original whole-download hashes, byte sizes, contiguous original line ranges, monthly slice hashes, URLs and CC BY 4.0 attribution are in the canonical source manifest. Full historical 355MB/81MB downloads are reproducible scratch only, not repository artifacts.
- RGS coverage: AL 98 / OS 97. These are administrative offices, especially in Vienna with age/sector-specific responsibilities; no travel-time or workplace/residence match is inferred. Code-prefix mapping is backed by the current AMS district directory linked in the artifact.
- Local evidence: main labour contract; pinned Q2 source check; new regional XLSX and occupation CSV re-extractions; 21 fault-injection cases; policy-field contract; registry and frontend workflow run steps all passed.
- Registered all five labour validation scripts in the existing tenth LABOUR-DATA contract. Updated gap C, partial gap E, analysis, field 3, document dependencies, manifest and status. No progress percentage or employment/fiscal effect was raised.
- Next substantive evidence: jointly observed occupation × detail qualification × region for the same population/date; time/care/net gain/mobility/task fit/reskilling outcomes. Q2 shortage populations (at least apprenticeship) stay separate from August all-qualification stocks. Do not form a joint table by multiplying education and occupation marginals.
- Remaining older evidence issue: LAB-SOURCE-001 is still open. Upper Austria vacancy-stock gap is now resolved, superseding older handoff statements below.
- Recovery: revert the bounded LAB-003 commit; no database/runtime/Sites publication changed.

## Previous WERK-LAB-002 history (completed)

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

## Historical local evidence and initial publication blocker (superseded below)
- Prior expanded labour CI confirmed: https://github.com/Bernds-tech/WellFit/actions/runs/33996097649 (2ce04bd98f601b590635c0095bcb1de5c0d98e31), successful.
- Prior workstate CI confirmed: https://github.com/Bernds-tech/WellFit/actions/runs/33996225256, successful.
- Local current evidence: labour contract; source XLSX reconciliation; ten fault-injection checks; policy-field contract; existing inline registry and frontend data/manifest/accounting contracts all passed.
- Negative evidence: missing finite operand, null count, wrong ratio, overlapping education members, mixed month, duplicate occupation, invented employment effect, falsely closed joint-matching gate, source value drift and locator drift all rejected in isolated copies.
- Local implementation commit: `869423f` (22 files). Remote branch remains `b64294d78fd73282b3ff8d4554e6925a4674ffa7`, confirmed after rejected push.
- Publication blocked: automatic approval review rejected `git push origin HEAD:werk-v49-preview-host` because continuing work was not treated as explicit authorization to publish data/scripts/project-memory to a public repository. Do not retry via API or another route without explicit owner approval.
- User input required: approval to publish this concrete WERK change set to the existing public branch. No credentials or personal microdata were added; published official aggregate source data and project records are included.
- Remote CI for this implementation: not run; inspect exact published implementation commit after authorized push before reporting green.
- Lock released after local verification; task is implemented with publication/remote verification pending.

## Publication and remote verification — 2026-09-06
- Status: VERIFIED. The owner answered the concrete publication request with “Weiter”; no further publication approval is pending for this change set.
- Local Git fetch succeeded, but push failed because the local runtime had no GitHub write credentials. The connected GitHub app published the authorized contents via Git objects, without force-updating the branch.
- Remote implementation commit: `00bed9975f07435920fd02414a071467532f73a6`.
- Every one of the 22 blob hashes and full tree `c3acea59f5bca5000de467c7e73c01a0ca939c60` matches local `e2fbd0a`; original commits are preserved locally on `archive/werk-lab-002-local-e2fbd0a`.
- All 13 triggered workflows completed successfully on this exact implementation commit. Machine-readable run IDs, commit binding and URLs: `project-memory/WERK_LABOUR_CI_RECEIPT.json`.
- Labour run 34026218655 explicitly passed the contract, all 452 source-row reconciliations and fault-injection checks. Policy workstate 34026218610, contract registry 34026218632 and frontend 34026218612 also passed.
- This closes publication and CI verification of WERK-LAB-002. It does not close substantive matching gaps or establish employment/budget effects. The separately hosted Sites version was not deployed.
- Upper Austria's official August article was rechecked: it supplies vacancy growth, but no absolute vacancy stock. The null remains justified. The PDF text still differs for LAB-SOURCE-001; no graphical/provider resolution was obtained in this continuation.

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
