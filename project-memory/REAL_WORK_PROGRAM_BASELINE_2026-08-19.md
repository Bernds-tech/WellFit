# WellFit Real Program Baseline — 2026-08-19

## Current physical architecture

Today the three-repository target model and the physical code layout are not the same:

- `Bernds-tech/WellFit-now` is the current primary physical product codebase. It contains the Next.js web/backend product, current landing/UI implementation, Firebase/Functions/database packages, mobile-web fallback and the Unity AR project under `native/unity/WellFitBuddyAR`.
- `Bernds-tech/WellFit` is the intended visual/landing/UI authority and the V9 program-memory master, but currently contains governance/memory rather than the migrated product UI runtime.
- `Bernds-tech/WellFit-Buddy` is the intended native/mobile/AR authority, but currently contains governance/memory rather than the migrated Unity project.

This is **ownership drift**, not missing work. Do not rebuild existing UI or Unity code merely because it is not yet in the intended repository.

## Real product capabilities already implemented in WellFit-now

- Public entry, registration/login/reset/help/legal routes.
- Dashboard, settings, missions, Buddy, points shop, leaderboard, analytics and mobile-web surfaces.
- Closed-Beta account hardening: age >=16, email verification, onboarding/account-status gating, HttpOnly sessions, revocation/logout-all-devices, device-session management and server-side protected-route/session checks.
- Server-authoritative mission flow: attempt -> evidence -> admin review -> completion -> internal ledger -> internal wallet.
- Internal non-monetary economy with ledger/wallet, Buddy care spend and audit protections; runtime terminology still uses WFXP in places and must not be silently equated with canonical WFP/XP semantics.
- Server-authoritative Buddy projections/actions and rules-based Buddy-KI fallback.
- Worldwide location-aware mission foundations with safety reviews and privacy-conscious proximity processing.
- Project Rail governance/control plane with planning gates, ownership reservations, dry-run dispatcher and completion-sync dry run.

## Real native/AR baseline

The Unity project currently under WellFit-now contains project structure, scripts, assets/configuration, documentation and tooling for the AR Buddy path. Existing planned/partial behavior includes placement, movement, anchors, navigation, native bridge commands and future animation/occlusion/surface behavior. Real-device Android ARCore acceptance remains open.

## Major unresolved program risks

1. Physical code ownership does not yet match the intended three-repository responsibility split.
2. No exact-version three-repo end-to-end mission/Buddy integration has been accepted.
3. Native real-device ARCore behavior is not accepted.
4. Visual/native migration decisions are intentionally unscheduled because the three repositories may later converge again.
5. Consent/privacy lifecycle remains incomplete beyond the strong session/auth improvements.
6. Legacy client-write compatibility for economy/Buddy/progress fields must be removed only after all consumers are migrated.
7. WFXP vs WFP/XP terminology/data-model semantics require an explicit owner-reviewed decision.
8. Remote Buddy-AI provider, paid pilot, partner redemption, Production operations and legal acceptance are not proven by repository CI.

## Current program execution principle

Continue real product work in the repository where the implementation physically exists unless a reviewed `WF-MIG-*` entry explicitly moves responsibility. Do not pause useful backend work merely because future ownership differs. Do not duplicate UI/native implementation in destination repos before migration is approved.
