# WellFit Session Handoff

Update this at the end of substantial work or whenever pausing at a non-obvious state.

## Current handoff
- Updated: 2026-08-29 Europe/Vienna
- Active focus: `WFG-AVATAR-PUPPET-001` is technically implemented but not visually verified on the actual public ChatGPT Site. The public `wellfit-bewegt` Landingpage still shows no head movement because its Sites source has not yet been loaded/edited.
- Start here: `OPEN_LOOPS.md` WF-LOOP-005, `STARTED_WORK.md` WFG-AVATAR-PUPPET-001, `CROSS_REPO_LOCKS.md`, WFG-CR-007 and CTR-WFG-006.
- Exact completed result: WellFit-now exact Puppet head `f2b2bdb89655bea3398687a35540704b091672d7` passed Build #1198, Container Build #183, DB #175 and Project Memory checks; normal PR #390 merged to WellFit-now main as `d374e4db4777406d93a8aad72adc10ab47db216f`.
- Implemented behavior in the reusable renderer: separate head/body layers from transparent mascot PNGs, per-asset crop/pivots, stronger/faster head tracking, delayed torso lean, CTA-center priority, click nod, idle breathing/head micro-motion, reduced-motion/coarse-pointer fallback and explicit Landing-Hero Luma calibration.
- Public-Site boundary: GitHub merge does not modify `wellfit-bewegt.bernd-guggenberger.chatgpt.site`. OpenAI Sites requires the existing Site to be opened via Sites/Edit or its original Site chat so the Site is referenced in the composer before it can be edited.
- First unproven step: load that exact Site reference, port the merged Puppet renderer/pivots into the Site source, review the generated preview for head seams/ghosting/crop/stacking and pointer/CTA behavior, then deliberately publish to the existing public URL.
- Cross-repo implementation lock: `XLOCK-WF-AVATAR-PUPPET-20260828` released after the technical merge; WF-LOOP-005 remains OPEN for the Site-specific visual work.
- Existing separate work remains open: WFG-VIS-001 canonical visual-baseline reconciliation and the owner-approved one-screen mobile AR target under WFG-MOBILE-UX-001 / WF-CONTRACT-MOBILE-SHELL-001.
- Governance blocker: GitHub `main` is not remotely protected; continue branch+PR discipline until the owner resumes the deferred ruleset action.
- Falsification question: if the exact Site preview still shows no independent head movement or shows seams/ghosting/wrong crops after the port, the per-asset Puppet configuration must be tuned before publication.

Future handoffs must record updated time, active IDs, exact last verified result, first unproven step, blockers/open loops, failed-attempt references, evidence/PR/commit references and any user input still required.

## WERK branch continuation — 2026-09-06 UTC
This branch hosts the separately requested WERK reform project. Read `project-memory/WERK_LABOUR_HANDOFF.md` and `werk-data/project-status.json`; do not follow the unrelated WellFit avatar next action. WERK-LAB-002 is published and VERIFIED at `00bed9975f07435920fd02414a071467532f73a6`: all 13 triggered workflows succeeded, including labour source reconciliation and negative tests. The previous publication blocker is resolved by the owner's continuation response to the concrete approval request. See `WERK_LABOUR_CI_RECEIPT.json` for exact run evidence. Next substantive work: same-period occupation × qualification × region supply, then time/care/net-gain/mobility and qualification-effect evidence. Upper Austria vacancy stock and LAB-SOURCE-001 remain open. No Sites deployment or reform-effect claim follows from this CI result.

### Previous WERK continuation: WERK-LAB-003
2026-09-06: complete August regional stocks and 3072 occupation/state stock pairs are published and VERIFIED at ece6767e5a4d4362f43c07a0ae7033b509de585a. All 13 triggered CI workflows succeeded, including the two new source imports and 21 negative cases. Read WERK_LABOUR_HANDOFF.md and WERK_LABOUR_003_CI_RECEIPT.json first. Next: joint detail qualification and feasible working conditions; missing table sides remain unknown and Q2 shortage signals stay separate.

### Previous WERK continuation: WERK-LAB-004
2026-09-06: regional education (189 rows) and vacancy working time/type (67 rows) are published and VERIFIED at bc7152d31dc598738bd0f12a02e3bebc830f974d. All 13 workflows passed, including the new four-slice source reconciliation and 33 negative cases. July 869 is officially XX Ungeklärt and stays unallocated; August XX is 952. LAB-F is partial: demand time is observed, feasible supply hours/care remain open. Read WERK_LABOUR_HANDOFF.md and WERK_LABOUR_004_CI_RECEIPT.json first. Joint occupation/qualification/time cells remain unavailable; no synthetic cross join or fiscal effect. No Sites deployment. Next: obtain jointly observed detail qualification and feasible working conditions.

### Latest WERK continuation: WERK-LAB-005
2026-09-06: working-time wishes/availability (48 rows), parttime reasons (39), childcare opening categories (20 region/age rows) and three slack controls are published and VERIFIED at 5dbe5eedd1c3347e44cdce68ffb2725f78562fca. All 13 workflows succeeded, including three-source ODS reconciliation and 45 negative cases. 87 uninterpretable metric cells remain null; 56 uncertain estimates keep flags; hidden ODS precision is unused. Read WERK_LABOUR_HANDOFF.md and WERK_LABOUR_005_CI_RECEIPT.json first. Periods/populations remain separate and no free places, feasible hours or fiscal effect is inferred. The shared artifact is linked to fields 3, 5 and 7. Next: jointly observed qualification and concrete working-time/care/transport/net-gain conditions. No Sites deployment.

### Latest WERK owner direction: WERK-CALC-001
2026-09-06: Owner asked to calculate everything. Start with WERK_CALCULATIONS_HANDOFF.md and WERK_GESAMTRECHNUNG.md. Consolidated conditional calculation is VERIFIED at d876d9f91c1edadd505edff018e7377500dab0b3; Fiscal, Registry and Frontend CI succeeded. See WERK_CALCULATIONS_CI_RECEIPT.json. Fifteen reform dossiers are inventoried, but verified funding remains zero. LAB-005 evidence persists; no Sites deployment.
