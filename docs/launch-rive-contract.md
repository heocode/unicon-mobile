# Launch Rive Runtime Contract

This document specifies the boundary between application startup and the Rive
launch asset. Critical invariants are also summarized in `AGENTS.md`; changes to
this contract require coordinated updates to the Rive export and React Native
integration.

## Asset and external contract

The launch animation is exported from Rive Editor and stored at:

```text
assets/rive/launch.riv
```

It exposes exactly these names:

```text
State Machine: LaunchAnimation
View Model:    LaunchAnimation

Data Binding input:
- start

Data Binding output:
- complete
```

Do not edit, synthesize, or binary-patch the `.riv` file. The user owns changes
and exports from Rive Editor. A renamed or missing State Machine, View Model, or
trigger is an asset contract failure and must not be normalized with
asset-specific JavaScript workarounds.

## Asset behavior

The state machine begins in an explicit hidden pose. Firing `start` plays the
launch animation once and emits `complete` only after the final visible pose has
been reached.

Conceptually:

```text
HiddenPose
→ start
→ LaunchAnimation
→ VisiblePose + complete
```

Internal state names, timelines, easing, and duration are owned by the Rive
asset and are not part of the React Native contract. The launch animation must
not depend on a pointer event or another user interaction to begin or finish.

## Runtime sequence

[`LaunchGate`](../src/features/launch/components/LaunchGate.tsx) mounts the
application underneath an opaque launch overlay.
[`LaunchAnimation`](../src/features/launch/components/LaunchAnimation.tsx)
loads the local Rive file, creates the named View Model Instance, binds it to the
named State Machine, and waits for native view readiness through `useRive()` and
`awaitViewReady()`.

The successful startup sequence is:

```text
mount LaunchGate and start watchdog
→ load Rive file and View Model Instance
→ bind the native Rive view
→ await native view readiness
→ call play()
→ hide the native splash
→ fire start
→ call playIfNeeded()
→ receive complete
→ fade and unmount the launch overlay
```

`play()` explicitly starts the native render loop before the trigger is fired.
This is required because relying on `playIfNeeded()` alone allowed playback to
remain dormant until the first screen interaction on a real device.

The native splash is intentionally a background-only handoff surface. It must
not compete visually with the Rive launch animation or conceal its first frames.

## Completion and failure

`complete` is the only successful Rive completion signal. Duplicate completion
after startup has finished is ignored.

Binding, file, native view, or playback errors fail open: the native splash and
launch overlay are removed so the application remains usable. Reduced Motion
also skips the decorative launch animation and reveals the application directly.

The launch gate owns a 5-second end-to-end watchdog. It starts when the gate
mounts and covers file loading, View Model binding, native readiness, playback,
and waiting for `complete`.

The watchdog is a failure escape hatch, not a successful animation completion
signal:

```text
5 seconds without completion
→ hide native splash
→ remove launch overlay without a fade
→ reveal the application
```

The watchdog is cleared after successful completion, controlled failure,
Reduced Motion handling, and unmount. Startup completion is guarded so racing
callbacks cannot finish the gate more than once.

## Contract change checklist

When intentionally changing this boundary:

1. Update the Rive export and React Native constants together.
2. Preserve the explicit hidden initial pose and one-shot playback.
3. Preserve automatic playback without user interaction.
4. Preserve event-driven successful completion through `complete`.
5. Keep the watchdog as failure-only behavior.
6. Run repository-defined non-native checks.
7. Ask the user to verify cold launch, automatic playback, and the handoff to
   Welcoming on both Apple and Android runtimes.
8. Update this document and the critical summary in `AGENTS.md`.
