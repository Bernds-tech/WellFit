# Reconciliation Note — 2026-08-19

A Project Memory documentation commit (`MEMORY_VERSION_HISTORY.md`) was unintentionally written directly to `main` while GitHub branch protection is still not remotely enforced.

- Scope: documentation only; no product/runtime/provider change.
- Root cause: connector write omitted an explicit feature branch and `main` currently accepts direct writes.
- Corrective action: all remaining V4–V7 completion work uses feature branch + PR + CI.
- Prevention: branch-protection owner action remains open; repository policy forbids routine direct-main writes even before remote enforcement exists.
- No rollback required because the committed content is intended and correct; this note preserves the governance deviation instead of hiding it.
