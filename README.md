# Unicon Mobile

Mobile application for Unicon, a campus community product for verified college
students.

The application is built with Expo, React Native, TypeScript, and Expo Router.
Its current surface provides the application foundation and the pre-authentication
Welcoming flow. Authentication, registration, profile setup, and the main app are
intentionally deferred to later stages.

Welcoming and onboarding are separate concepts in this project. Welcoming is the
four-page introduction shown before authentication and does not collect user data.
Onboarding will be a future post-authentication flow that prepares the user's
profile.

## Technology

- Expo 57 and React Native 0.86
- React 19 and TypeScript 6
- Expo Router for file-based navigation
- NativeWind 4 with Tailwind CSS 3
- Rive React Native Runtime with Data Binding
- React Native Safe Area Context
- Expo development builds for native runtime testing

## Documentation

- [`AGENTS.md`](AGENTS.md) — long-lived repository rules and invariants
- [`docs/mobile-architecture.md`](docs/mobile-architecture.md) — application
  layering, responsive layout, styling, accessibility, and native-project policy
- [`docs/welcoming-rive-contract.md`](docs/welcoming-rive-contract.md) — Rive
  asset contract, adapter lifecycle, orchestration, and rapid-swipe behavior

Read `AGENTS.md` before changing the repository. Use `package.json`, the
lockfile, application configuration, and typed feature configuration as the
sources of truth for current versions and mappings.

## Current scope

The implemented Welcoming flow contains four states:

1. Unicon
2. Students Only
3. Stay Updated
4. Clubs

The text content moves through a native horizontal paged `FlatList`. The Rive
illustration, pagination, and Get Started button remain fixed. The swipe surface
covers the screen except where the button must retain its own press interaction.

Get Started is currently a safe placeholder. It does not navigate to an
authentication flow, and the mobile application does not call the backend yet.

## Local setup

### Prerequisites

- Node.js and npm
- Xcode and CocoaPods for iOS development
- An Apple development team for physical iPhone installation
- Android Studio with Android SDK 36 for Android development
- An iOS Simulator, Android Emulator, or supported physical device

Expo Go cannot run this project because Rive is a native module. Use an Expo
development build.

### 1. Install dependencies

```bash
npm install
```

### 2. Install an iOS development build

For an iOS Simulator:

```bash
npx expo run:ios
```

For a physical iPhone:

```bash
npx expo run:ios --device
```

The generated workspace is:

```text
ios/Unicon.xcworkspace
```

When signing must be configured manually, open that workspace in Xcode, select
the `Unicon` target, enable automatic signing, and choose the appropriate Apple
development team.

### 3. Install an Android development build

Start an emulator from Android Studio Device Manager, then run:

```bash
npx expo run:android
```

Gradle requires a valid local Android SDK path. The machine-local and ignored
`android/local.properties` file should contain a path such as:

```properties
sdk.dir=/Users/your-name/Library/Android/sdk
```

Do not commit `local.properties` because the SDK path is machine-specific.

### 4. Start Metro

After development builds are installed:

```bash
npm start
```

From the Metro terminal:

- press `i` to open the iOS Simulator;
- press `a` to open the Android Emulator;
- open Unicon manually on a physical iPhone.

A physical iPhone and the development Mac should be on the same local network.
Do not use `--localhost` when a physical device needs to reach Metro.

## Rive runtime contract

The four runtime assets are stored in `assets/rive`:

```text
unicon.riv
students.riv
notifications.riv
clubs.riv
```

Every asset exposes the same external contract:

```text
State Machine: WelcomingIllustration
View Model:    WelcomingIllustration

Inputs:
- show
- hide

Outputs:
- enterComplete
- exitComplete
```

The React Native layer does not know internal timeline names, animation
durations, or whether an exit uses reverse playback or a separate timeline.

The runtime integration follows these requirements:

- interaction waits for `useRive()` and native `awaitViewReady()` readiness;
- `playIfNeeded()` is called immediately after `show` or `hide` fires;
- `show()` resolves only after `enterComplete`;
- `hide()` resolves only after `exitComplete`;
- successful completion never depends on a JavaScript timeout;
- unmounts and runtime failures reject pending operations.

Hidden and visible poses must be explicitly represented by the Rive state
machine. Do not rely on a platform retaining the final rendered frame of a
timeline after entering an empty state.

## Animation orchestration

[`WelcomingIllustrationAdapter`](src/features/welcoming/animation/WelcomingIllustrationAdapter.tsx)
owns one Rive instance and translates its Data Binding contract into asynchronous
`show()` and `hide()` operations.

[`useWelcomingOrchestrator`](src/features/welcoming/animation/useWelcomingOrchestrator.ts)
coordinates transitions between illustrations. It keeps one transition runner,
tracks the latest desired page, and never builds an unbounded FIFO queue.

For a committed page change, the sequence is:

```text
hide current illustration
→ wait for exitComplete
→ mount and await the desired illustration
→ show desired illustration
→ wait for enterComplete
```

If several pages are committed quickly, intermediate requests are coalesced and
the orchestrator converges on the latest desired index. Conflicting animations
are never started concurrently.

## Responsive layout and accessibility

The Figma 402×874 frame is the initial visual reference, not a fixed viewport.
Layout values use window dimensions, safe-area insets, and bounded responsive
sizes instead of scaling the complete design frame.

- Rive illustrations use `Fit.Contain` inside a fixed responsive viewport.
- The bottom button uses the larger of the device bottom inset and the design
  margin.
- Illustration, copy, pagination, and button placement remain stable while the
  carousel moves.
- Get Started exposes a button role, label, and hint.
- The carousel exposes an adjustable accessibility value and actions.
- Decorative pagination dots and Rive content are hidden from screen readers.

When Reduce Motion is enabled, decorative Rive animations are not mounted. The
page state still changes deterministically. Showing an instantaneous final Rive
pose would require a dedicated runtime input and is not emulated in JavaScript.

## Styling and theme

NativeWind handles static utility-based presentation styles. Dynamic dimensions,
safe-area placement, Rive sizing, and native shadows use regular React Native
styles where runtime values are more appropriate.

Semantic color and font tokens live in:

```text
src/theme/tokens.json
src/theme/tokens.ts
```

Tailwind consumes the same tokens through `tailwind.config.js`. Avoid scattering
raw color values through JSX or duplicating theme values between configuration
files.

## Project structure

```text
app/
├── _layout.tsx                 Root providers, fonts, and router stack
└── index.tsx                   Thin Welcoming route

assets/rive/                    Runtime illustration assets

src/
├── features/welcoming/
│   ├── animation/              Rive adapter and transition orchestration
│   ├── components/             Carousel, slide, illustration, dots, and button
│   ├── config/                 Typed content and asset mapping
│   ├── hooks/                  Responsive layout and reduced-motion preference
│   ├── screens/                Welcoming screen composition
│   └── types/                  Welcoming-specific types
└── theme/                      Semantic design tokens
```

The routing layer stays thin. Future top-level flows should remain separate:

```text
Welcoming
→ Authentication
→ Onboarding
→ Main App
```

Do not use `onboarding` as a synonym for the current Welcoming flow.

## Generated native projects

The `ios` and `android` directories are generated by Expo prebuild and excluded
from Git. Native configuration belongs in `app.json` or an Expo config plugin
unless a documented requirement makes a committed native project necessary.

Regenerating native projects may replace manual changes inside those directories.
Do not store application logic or irreplaceable configuration only in generated
native files.

## Validation

Run the TypeScript check before committing:

```bash
npm run typecheck
```

Check Expo dependency and configuration compatibility with:

```bash
npx expo-doctor
```

Native builds and runtime behavior must be verified manually on the intended
iOS and Android targets. Rive behavior should be checked on both platforms after
changing any `.riv` asset or runtime dependency.

## Useful commands

| Command                         | Purpose                                      |
| ------------------------------- | -------------------------------------------- |
| `npm start`                     | Start Metro for installed development builds |
| `npm run ios`                   | Build and run the iOS development client     |
| `npm run android`               | Build and run the Android development client |
| `npx expo run:ios --device`     | Install a development build on an iPhone     |
| `npm run typecheck`             | Check TypeScript without emitting files       |
| `npx expo-doctor`               | Validate Expo configuration and dependencies  |
| `adb devices`                   | List connected Android targets                |
| `adb reverse tcp:8081 tcp:8081` | Forward Metro to an Android device over USB   |

## Development notes

- Do not connect backend endpoints until the relevant frontend stage is
  explicitly started.
- Do not modify `unicon-backend` as part of mobile work without explicit scope.
- Do not add a carousel dependency while the native paged `FlatList` satisfies
  the interaction requirements.
- Keep Welcoming copy and Rive mappings in typed configuration rather than
  distributing them across components.
- Preserve the shared Rive State Machine and View Model contract across all four
  assets.
- Rebuild development clients after changing native dependencies or native Expo
  configuration. TypeScript, layout, and NativeWind changes normally require
  only a Metro reload.
