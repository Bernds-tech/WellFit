# WellFit Mobile One-Screen AR Shell

- Decision date: 2026-08-26
- Owner: Bernd / WellFit product owner
- Status: ACCEPTED TARGET UX; runtime NOT IMPLEMENTED
- Cross-repository contract: `WF-CONTRACT-MOBILE-SHELL-001`
- Task: `WFG-MOBILE-UX-001`

## Product intent

The WellFit mobile game is a window into the real world, not a conventional dashboard application. Its only persistent primary screen is the live camera/AR world. The Buddy and context-relevant game objects are composed into that world.

A user can play the game on the phone without using a PC. The PC remains the place for deeper configuration and administration that is not required during play.

## Persistent screen

The root mobile surface is a full-screen live camera/AR view.

Only two permanent navigation controls are allowed above the world:

- small WellFit logo in the upper-left safe area;
- three-line menu control in the upper-right safe area.

There is no permanent bottom navigation, tile dashboard, large header, or always-visible statistics panel. Contextual prompts may appear only when the current interaction requires them.

## Menu and feature surfaces

Opening the menu overlays the live AR world. It must not recreate the root scene, reset the Buddy, discard the current mission context, or intentionally restart the AR session.

Initial menu information architecture:

1. Buddy
   - feed;
   - care;
   - view current Buddy state.
2. Missions
   - daily missions;
   - weekly missions;
   - adventures;
   - challenges.
3. Arenas.
4. Mayor and checkpoints.
5. Settings
   - only the small set of settings required while playing;
   - the exact mobile settings list is a later owner decision.

Inventory or further game destinations may be added only through a reviewed change request. Closing a panel returns to the same live world state.

## Navigation state contract

```text
AR_WORLD_ACTIVE
  -> MENU_OVERLAY
  -> FEATURE_PANEL
  -> MENU_OVERLAY or AR_WORLD_ACTIVE
```

Back behavior must be deterministic:

- from a feature panel: return to the menu overlay;
- from the menu overlay: close it and return to the AR world;
- from the AR world: use a reviewed exit/background flow rather than silently losing state.

OS backgrounding, permission loss, unsupported-device paths, or tracking failure may pause/recover the AR session; normal menu navigation may not be treated as such a failure.

## Repository responsibilities

| Concern | Authority |
|---|---|
| Visual composition, spacing, icons, typography, panel appearance and responsive safe areas | `Bernds-tech/WellFit` |
| General mobile shell, routing/state, authentication, mission/arena/mayor/settings data and server integration | `Bernds-tech/WellFit-now` |
| Buddy behavior, presentation/animation, Buddy-specific AR/camera composition and AR-session continuity signals | `Bernds-tech/WellFit-Buddy` |
| Mission completion, rewards/economy, anti-cheat and authoritative state | `Bernds-tech/WellFit-now` server |

The phone is the complete gameplay client. This does not move authoritative mission, reward, economy, identity or anti-cheat decisions into the client.

## First implementation slice

The first accepted implementation must prove:

1. full-screen camera/AR root;
2. safe-area logo and menu control;
3. menu overlay open/close without intentional AR scene reset;
4. placeholder destinations for Buddy, Missions, Arenas, Mayor and Settings;
5. deterministic back behavior;
6. permission denial and app-background recovery path;
7. no reward or mission-completion authority in the client.

A placeholder Buddy may be used until the Buddy runtime passes its separate Unity compile/build/device gates.

## Privacy and safety constraints

- Do not persist camera frames by default.
- Do not store precise location traces or device identifiers in project memory.
- Camera/location/motion permissions must be purpose-bound and fail safely.
- Walking gameplay must later include a reviewed safety interaction, but no permanent warning panel may clutter the normal AR world.

## Explicitly deferred decisions

These are intentionally not invented in this contract:

- final panel graphics and animation;
- exact set of mobile settings;
- portrait/landscape policy;
- offline behavior;
- inventory placement;
- notification behavior;
- final Buddy model and care mechanics.

They require their own visual/technical acceptance and do not block recording the one-screen architecture.
