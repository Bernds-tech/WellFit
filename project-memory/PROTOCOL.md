# Project Memory Protocol v2

Operational memory for the WellFit visual/landing/UI repository.

## Mandatory preflight
1. Read `AGENTS.md`, `CURRENT_STATE.md`, `SESSION_HANDOFF.md`, `OPEN_LOOPS.md`, `TASK_LEDGER.md`, `DEPENDENCIES.md` and `DECISIONS.md`.
2. Search `FAILED_ATTEMPTS.md`, `DO_NOT_ASSUME.md` and `CHANGE_REQUESTS.md` for the intended area and prior attempts.
3. Read `PROJECT_REGISTRY.md` before work that may belong to WellFit-now or WellFit-Buddy.
4. Check current branch, git status, recent commits/PRs and any drift-prone preview/deploy/design state.
5. Search existing task/change/cross-project IDs before creating new work.
6. Do not repeat completed, rejected, superseded or failed approaches without new recorded evidence.

## New ideas
Every new owner idea first enters `CHANGE_REQUESTS.md` and is classified as `NEW`, `EXISTS_PARTIALLY`, `DUPLICATE`, `DEFERRED` or `REJECTED`. Cross-repository work uses `XPROJ-YYYY-NNN` plus local subtasks/dependencies.

## Status model
Use `TODO`, `IN_PROGRESS`, `BLOCKED`, `PARTIAL`, `IMPLEMENTED`, `IMPLEMENTED_NOT_VERIFIED`, `VERIFIED`, `ACCEPTED`, `PRODUCTION_CONFIRMED`, `REJECTED`, `SUPERSEDED`, `DEFERRED`, `DUPLICATE`. Historical `DONE` remains valid for v1 records only.

Implementation is not visual acceptance. Evidence belongs in `EVIDENCE.md` and may require build/preview, screenshot comparison and owner acceptance depending on the task.

## Open loops and dependencies
Every meaningful unfinished follow-up belongs in `OPEN_LOOPS.md`. `PARTIAL`, `BLOCKED` and `IMPLEMENTED_NOT_VERIFIED` tasks require an open-loop reference or explicit no-follow-up rationale. Check `DEPENDENCIES.md` before implementation and do not accept dependent work while a required dependency remains unresolved.

## Decision revalidation
New decisions should include `Class: PERMANENT|REVIEWABLE`; reviewable decisions require a `Review trigger:`. Triggered reviews become open loops until resolved.

## Mandatory postflight
Update task/current state, open loops, dependencies, evidence, decisions, failed attempts and change requests as applicable. Update `SESSION_HANDOFF.md` at substantial pauses. Revalidate facts from `DO_NOT_ASSUME.md` whenever relied upon.

## Stale control
Active `IN_PROGRESS`, `BLOCKED`, `PARTIAL`, `IMPLEMENTED_NOT_VERIFIED`, `OPEN` and `BLOCKED` loop records must carry `Updated: YYYY-MM-DD`. Items older than 14 days are stale and an automated workflow surfaces them.

Never store secrets, tokens, credentials or private user data here.
