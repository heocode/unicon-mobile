# Unicon Mobile Development Guide

Read this file and `README.md` before changing the repository. Read the linked
architecture documents when working in their area:

- [`docs/mobile-architecture.md`](docs/mobile-architecture.md)
- [`docs/welcoming-rive-contract.md`](docs/welcoming-rive-contract.md)
- [`docs/launch-rive-contract.md`](docs/launch-rive-contract.md)

This file defines long-lived repository rules. Use `package.json`, the lockfile,
application configuration, typed source configuration, and architecture docs as
the sources of truth for details that naturally change over time.

## Working with the user

- Communicate in Russian unless the user switches languages.
- Lead with the concrete outcome, problem, or recommendation. Keep progress
  updates concise and evidence-based.
- The user prefers iterative visual tuning on real devices. Figma is the initial
  source of truth, but user-approved screenshots and later feedback may supersede
  initial values.
- Do not independently redesign, "improve," or reinterpret the UI. Explain
  visual deviations and wait for approval when they change design intent.
- When the user asks to discuss, analyze, or plan before coding, do not edit
  files until they explicitly authorize implementation.
- Distinguish frontend defects from asset/runtime defects. Do not conceal a Rive
  asset problem behind a per-file frontend workaround without discussing it.
- Preserve unrelated user changes. Never reset, overwrite, or delete their work
  merely to simplify a task.
- Do not commit, amend, push, create remotes, or change Git history unless the
  user explicitly requests that action.

## Repository boundaries

- Make mobile changes only inside `unicon-mobile` unless the user explicitly
  expands the scope.
- The sibling `unicon-backend` repository is read-only without explicit user
  permission. It may be inspected for API contracts, DTOs, errors, sessions,
  enums, and architecture.
- Never connect to, migrate, seed, or mutate backend infrastructure as part of
  ordinary mobile work.
- Never commit credentials, signing certificates, provisioning profiles,
  private keys, `.env` values, raw tokens, or machine-specific SDK paths.

## Product terminology

Welcoming and Onboarding are different flows:

- **Welcoming** is the pre-authentication introduction. It presents product
  capabilities and collects no user data.
- **Onboarding** is a post-authentication flow that collects user information
  and prepares the profile.

Use `welcoming` consistently for the pre-authentication flow in paths,
components, types, configuration, documentation, and comments. Never use
`onboarding` as its synonym.

Do not implement a new product area merely to provide a placeholder destination.
Respect the scope explicitly requested by the user for the current task.

## Sources of truth and dependencies

- `package.json` and the lockfile are the source of truth for installed package
  versions. Do not duplicate version snapshots in agent guidance.
- Before upgrading framework or native runtime dependencies, verify official
  compatibility documentation for the installed ecosystem and explain why the
  upgrade is necessary.
- Use exact versioned Expo documentation appropriate to the installed SDK.
- Do not use preview or prerelease NativeWind versions without explicit approval
  and a concrete compatibility reason.
- Do not add a library when the platform or an existing dependency already
  provides an appropriate solution.
- Use Expo-compatible installation commands for native Expo dependencies and
  tell the user when a development-client rebuild will be required.
- Never run breaking bulk upgrades such as `npm audit fix --force` without an
  explicit, separately reviewed request.
- Do not install machine-wide tools or SDK components without a demonstrated
  need and explicit approval.

## Architecture and organization

- Keep Expo Router routes thin. Route files select feature screens; business,
  presentation, and runtime logic belong outside `app/`.
- Keep presentation, typed configuration, native/runtime integration, and
  orchestration as separate responsibilities.
- Avoid giant screen components and premature abstractions for features that do
  not yet require them.
- Keep feature-owned types and configuration near the feature. Shared design
  tokens belong in the theme layer.
- Treat generated native directories and build output as generated artifacts.
  Durable native configuration belongs in Expo configuration or documented
  config plugins unless the repository intentionally changes strategy.
- Inspect and explain the impact before regenerating native projects; clean
  prebuild operations can erase manual native changes.
- Do not edit Pods, Gradle caches, DerivedData, generated code, or build output.

See [`docs/mobile-architecture.md`](docs/mobile-architecture.md) for detailed
layering, responsive layout, styling, accessibility, and native-project rules.

## Styling and responsive design

- Use NativeWind for static presentation styles.
- Use regular React Native styles for calculated dimensions, safe-area values,
  native shadows, animated styles, and genuinely dynamic values.
- Keep semantic colors and typography in shared design tokens. Do not scatter
  raw color values through JSX or duplicate token definitions.
- Treat Figma dimensions as an initial reference target, not as the only
  supported viewport. Do not uniformly scale an entire design frame.
- Responsive adaptation across supported iPhone and Android dimensions is
  mandatory. Preserve visual intent with bounded values and explicit safe-area
  handling.
- Rive uses `Fit.Contain`; React Native controls the viewport while internal
  composition belongs to the Rive artboard.
- Ask for device screenshots when visual calibration cannot be verified from
  static inspection.

## Welcoming interaction invariants

- Native horizontal paging owns the swipe interaction. Do not add a carousel
  dependency while the native paged list satisfies the requirements.
- Only slide copy moves horizontally. The illustration viewport, pagination,
  and primary action remain fixed.
- The swipe surface should cover the screen while preserving the primary
  action's press interaction.
- Pagination reflects the committed page index.
- Welcoming copy and asset mapping live in typed configuration rather than being
  distributed across presentation components.
- Do not block swiping during a Rive transition unless a verified runtime issue
  requires it.

## Rive contract and adapter invariants

Every Welcoming illustration exposes this external contract:

```text
State Machine: WelcomingIllustration
View Model:    WelcomingIllustration

Inputs:  show, hide
Outputs: enterComplete, exitComplete
```

- React Native must not know internal timeline names, animation durations,
  reverse settings, or whether an asset uses a separate exit timeline.
- Do not edit `.riv` binaries, generate replacement assets, or silently add
  asset-specific contract exceptions. Report exact contract mismatches to the
  user, who owns Rive Editor changes and exports.
- Wait for `useRive()` and native `awaitViewReady()` readiness before
  interaction.
- After firing `show` or `hide`, immediately call the current Rive view's
  `playIfNeeded()`.
- Resolve `show()` only from `enterComplete` and `hide()` only from
  `exitComplete`. Animation duration and JavaScript timeouts are never successful
  completion signals.
- Reject pending work on unmount, replacement, binding error, or runtime error.
  Ignore duplicate completion when no matching operation is pending.
- Read native views and trigger functions through current refs after readiness;
  do not retain a pre-readiness render closure.
- Hidden and visible poses must be explicit inside the state machine. Do not
  rely on a platform retaining the last rendered frame after a blank state.

Detailed asset mapping, state-machine expectations, adapter lifecycle, and
failure semantics are documented in
[`docs/welcoming-rive-contract.md`](docs/welcoming-rive-contract.md).

## Rive orchestration invariants

- Keep exactly one active transition runner.
- Track the latest desired page rather than accumulating a FIFO transition
  queue.
- Complete the current hide/replace/show sequence serially, then converge toward
  the latest desired index.
- Never run conflicting `show()` and `hide()` operations concurrently.
- Initial mount waits for the initial adapter and calls `show()` directly; it
  must not perform an unnecessary initial hide.
- Use generation or operation identity to prevent stale asynchronous work from
  mutating or completing a newer transition.

The complete sequence and rapid-swipe behavior are specified in
[`docs/welcoming-rive-contract.md`](docs/welcoming-rive-contract.md).

## Launch animation invariants

The launch asset exposes this external contract:

```text
State Machine: LaunchAnimation
View Model:    LaunchAnimation

Input:  start
Output: complete
```

- Wait for native Rive view readiness, explicitly start playback, then hide the
  native splash and fire `start` without waiting for user interaction.
- Treat `complete` as the only successful Rive completion signal.
- Keep the 5-second end-to-end watchdog as a failure escape hatch only. On
  timeout or runtime failure, remove the splash and overlay so startup fails
  open; never report the timeout as successful animation completion.
- Clear the watchdog after completion, failure, Reduced Motion handling, and
  unmount, and guard startup completion against racing callbacks.
- Do not edit or patch `assets/rive/launch.riv`; coordinate contract changes
  with a new user-owned Rive Editor export.

The complete startup sequence and failure semantics are documented in
[`docs/launch-rive-contract.md`](docs/launch-rive-contract.md).

## Accessibility and reduced motion

- Give actionable controls appropriate labels, roles, values, and hints.
- Keep decorative Rive content and pagination visuals out of the screen-reader
  tree while exposing page position through the carousel control.
- Respect the system Reduce Motion preference.
- Do not invent timeline seeking, duration assumptions, or timeout-based
  shortcuts for reduced motion. If an immediate final pose requires a new Rive
  contract capability, document and request it explicitly.

## Native build policy

Never start a native build or install or launch an application on the user's
behalf. This includes `expo run:ios`, `expo run:android`, `xcodebuild`, Gradle
build/install tasks, and IDE Run actions.

When work reaches native verification, stop and give the user the exact command
and manual checks. Ask them to return logs or screenshots. Do not run the build
even when it is the final verification step.

Non-native validation is allowed when relevant. A TypeScript check, Expo Doctor,
Metro bundle, or Expo export must never be described as a successful native
build or native runtime test. Only results returned from the user's device or
emulator establish native runtime behavior.

## Validation and handoff

- Before handoff, run the relevant repository-defined non-native checks and
  `git diff --check` when documentation or source files changed.
- Select checks according to the changed surface; do not run unrelated,
  destructive, or native-build commands merely to increase coverage.
- Report precisely which checks ran, which passed or failed, and which were not
  run.
- Never claim that type checking, JS bundling, export, static inspection, or
  simulator-independent tooling verified native runtime behavior.
- State whether the user needs a new development build or only a Metro reload,
  and provide exact manual verification steps.
- Summarize changed files, behavior, known limitations, and any remaining asset
  or device-specific validation.
