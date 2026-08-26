# WellFit Decision Log

## WFG-DEC-001
- Date: 2026-08-19
- Status: DONE
- Decision: Repository project memory is the durable execution ledger; conversational memory is supplementary only.
- Reason: Prevent repeated design/implementation attempts.

## WFG-DEC-002
- Date: 2026-08-19
- Status: DONE
- Decision: New owner ideas are captured in `CHANGE_REQUESTS.md` before they alter active scope.
- Reason: Preserve focus without losing ideas.

## WFG-DEC-003
- Date: 2026-08-19
- Status: DONE
- Decision: WellFit owns visual/landing/UI work; technical web/backend belongs in WellFit-now and native AR/buddy/mobile belongs in WellFit-Buddy unless an accepted bridge task explicitly spans repositories.
- Reason: Prevent duplicate implementation and repository drift.


## WFG-DEC-004
- Date: 2026-08-26
- Status: ACCEPTED
- Decision: The WellFit phone game has one persistent full-screen camera/AR root. A small WellFit logo and opposite three-line menu are the only permanent navigation chrome. Buddy care, missions, arenas, mayor/checkpoints and essential settings open as overlays without intentionally resetting the AR session. Deeper configuration remains PC-first.
- Reason: Keep the real world and Buddy as the game, minimize mobile clutter and preserve clear repository/server authority boundaries.
- Evidence: owner decision captured by WFG-CR-005 and specified in `docs/product/MOBILE_ONE_SCREEN_AR_SHELL.md`.
