# Welcoming Rive Runtime Contract

This document specifies the boundary between the Welcoming feature and its Rive
runtime assets. Critical invariants are also summarized in `AGENTS.md`; changes
to this contract require explicit coordination between the Rive assets and the
React Native adapter.

## Asset mapping

The typed mapping in
[`src/features/welcoming/config/welcomingSlides.ts`](../src/features/welcoming/config/welcomingSlides.ts)
is the source of truth for page order and asset imports. The current assets are:

```text
index 0 → assets/rive/unicon.riv
index 1 → assets/rive/students.riv
index 2 → assets/rive/notifications.riv
index 3 → assets/rive/clubs.riv
```

Do not copy, synthesize, binary-patch, or create alternate `.riv` files. The
user owns changes and exports from Rive Editor.

## Shared external contract

Every asset exposes the same names:

```text
State Machine: WelcomingIllustration
View Model:    WelcomingIllustration

Data Binding inputs:
- show
- hide

Data Binding outputs:
- enterComplete
- exitComplete
```

React Native sends only `show` and `hide` and waits for the corresponding
completion output. It does not inspect state names, timeline names, durations,
playback direction, or implementation-specific transitions.

Before changing adapter code to accommodate one asset, verify the exact exported
State Machine, View Model, and trigger names. A mismatch is an asset contract
failure and should be reported rather than normalized in JavaScript.

## Internal animation expectations

The shared contract intentionally permits different internal implementations:

- Unicon shows by playing its build forward and hides by playing the same build
  in reverse.
- Students shows by playing its build forward and hides by playing the same
  build in reverse.
- Notifications shows with its Enter timeline and hides with its separate Exit
  timeline. Enter must not be reversed for exit.
- Clubs shows by playing its build forward and hides by playing the same build
  in reverse.

Each state machine must begin in an explicit hidden pose and settle into an
explicit visible pose after show. An empty state must not rely on the renderer
retaining the final timeline frame. That assumption produced different behavior
between Apple and Android runtimes.

Conceptually, build/reverse assets follow:

```text
HiddenPose
→ BuildForward
→ VisiblePose + enterComplete
→ BuildReverse
→ HiddenPose + exitComplete
```

Notifications follows:

```text
HiddenPose
→ Enter
→ VisiblePose + enterComplete
→ Exit
→ HiddenPose + exitComplete
```

The names of these internal states are illustrative and are not part of the
React Native contract.

## Illustration adapter

One adapter owns one Rive file, native view, View Model Instance, and outstanding
operation. Its public boundary is:

```ts
type WelcomingIllustrationHandle = {
  show(): Promise<void>;
  hide(): Promise<void>;
};
```

### Readiness

The adapter loads the Rive file, creates the named View Model Instance, binds it
to `RiveView` through `dataBind`, and waits for the native view readiness exposed
by `useRive()` and `awaitViewReady()`.

An imperative handle may be registered before native readiness. Operations must
therefore read the latest native view and trigger functions from refs after
awaiting readiness. Capturing an undefined pre-readiness view in a render closure
causes a false `Rive view is not ready` failure.

### Operations

`show()` performs:

```text
await readiness
→ register pending show operation
→ fire data-bound show
→ call playIfNeeded()
→ await enterComplete
```

`hide()` performs:

```text
await readiness
→ register pending hide operation
→ fire data-bound hide
→ call playIfNeeded()
→ await exitComplete
```

`playIfNeeded()` is required because a Rive state machine may settle when no
animation or transition remains active. It wakes the native runtime after a Data
Binding trigger.

No animation duration or JavaScript timeout is a successful completion signal.
A diagnostic watchdog may reject a stuck operation, but must never resolve it.

### Completion and failure

- A completion output resolves only the matching pending operation.
- Duplicate output with no matching operation is ignored.
- Concurrent operations on one adapter are rejected.
- Binding and runtime errors enter a controlled failure state.
- Unmount or replacement rejects readiness and any pending operation.
- Stale callbacks must not complete a newer operation.

## Cross-illustration orchestrator

The orchestrator is independent from presentation and from Rive internals. It
receives committed target indexes and serializes adapter operations.

Its conceptual state is:

```text
mounted illustration index
settled illustration index
latest desired index
phase: idle | exiting | entering
generation token
one active runner
```

### Initial state

Initial mount does not perform a transition from another illustration:

```text
mount initial illustration
→ await adapter readiness
→ show
→ await enterComplete
→ mark settled
```

There is no initial hide.

### Page transition

After native paging commits a new index:

```text
set latest desired index
→ hide current illustration
→ await exitComplete
→ replace the mounted illustration with the latest desired asset
→ await its adapter readiness
→ show it
→ await enterComplete
→ mark it settled
→ compare it with the latest desired index
```

The illustration does not follow the user's finger. Rive transition work begins
only after the page index is committed.

### Rapid swipes

Requests do not form a FIFO queue. A new committed index replaces the previous
desired index while the current runner continues its serial operation. After
each complete transition, the runner compares against the latest desired value
and converges toward it.

This guarantees:

- at most one runner;
- no conflicting show/hide operations;
- no unbounded stale transition queue;
- eventual convergence on the latest committed page;
- no illustration from a stale intermediate request remaining visible.

Generation or operation identity protects against stale asynchronous work after
unmount, failure, preference changes, or replacement.

## Reduced motion

When the system Reduce Motion preference is active, full decorative transitions
are omitted and page state changes deterministically.

The adapter must not seek timelines, infer durations, or resolve operations from
timeouts to fabricate an instant transition. If product design requires a static
final illustration under Reduce Motion, the Rive contract should expose a
supported instant-pose capability or provide an approved static asset.

## Contract change checklist

When intentionally changing this boundary:

1. Update all affected `.riv` exports consistently.
2. Keep typed asset mapping accurate.
3. Update the adapter only for shared external-contract changes.
4. Preserve event-driven completion.
5. Run repository-defined non-native checks.
6. Ask the user to verify show, hide, settling, rapid swipes, and remounts on
   both Apple and Android runtimes.
7. Update this document and the critical summary in `AGENTS.md`.
