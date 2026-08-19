# WellFit Failed Attempts / Do-Not-Repeat Log

## WFG-FAIL-001
- Date: 2026-08-19
- Status: DONE
- Area: Project execution discipline
- Attempt: Rely on chat/model memory alone for small design and implementation attempts.
- Result: Duplicate work can recur across long-running sessions.
- Cause: Conversational context is not a durable ledger.
- Decision: Mandatory repository preflight/postflight.
- Do not repeat: Start from repository state and project memory, not remembered conversation alone.

## WFG-FAIL-002
- Date: 2026-08-19
- Status: DONE
- Area: Repository boundaries
- Attempt: Allow graphical, backend and native AR work to blur into one stream.
- Result: Risk of duplicate components and mismatched product presentation.
- Cause: Scope ownership was not encoded operationally.
- Decision: Keep repository roles explicit and use accepted bridge tasks for cross-repo work.
- Do not repeat: Do not implement backend/native functionality in this visual repository by default.
