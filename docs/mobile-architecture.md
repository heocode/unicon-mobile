# Unicon Mobile Architecture

This document describes the mobile application's architectural boundaries and
the rationale behind its current UI foundation. `AGENTS.md` remains authoritative
for repository rules and invariants. `package.json`, the lockfile, and application
configuration remain authoritative for versions and native settings.

## Application layers

Expo Router is the navigation boundary. Route files should remain small and
delegate rendering to feature screens. A feature owns its presentation,
configuration, types, platform adapters, and state coordination.

The intended dependency direction is:

```text
route
→ feature screen
→ presentation components and feature hooks
→ typed feature configuration
→ platform/runtime adapters
```

Presentation components should not know native runtime implementation details.
Runtime adapters should not own page layout or product copy. Cross-component
sequencing belongs in an orchestration hook or controller rather than in the
screen or Rive view component.

Shared visual values belong in the theme layer. A value should become a shared
token when it has semantic meaning across components, not merely because two
current values happen to match.

## Navigation boundaries

Welcoming, Authentication, Onboarding, and the Main App are distinct product
flows. Their routes and feature code should remain independently evolvable.

Welcoming is pre-authentication and collects no user information. Onboarding is
post-authentication and prepares the user's profile. Route names and feature
paths must preserve that distinction.

Do not create speculative route trees or empty feature screens before their
product stage begins. Introduce the minimum routing boundary needed by the
implemented flow while keeping room for future route groups.

## Styling and design tokens

NativeWind is the default for static presentation styles such as flex layout,
typography classes, fixed spacing, colors, borders, and radii.

Regular React Native styles are preferred for:

- dimensions calculated from the current viewport;
- safe-area placement;
- platform-native shadows;
- animated values;
- values that cannot be known at build time;
- cases where forcing utility classes would reduce clarity or correctness.

Semantic theme values are defined once and consumed by both application code
and Tailwind configuration. Avoid putting raw color values directly into JSX.
Keep typography family names aligned with the fonts loaded by the root layout.

Figma is the initial UI reference. It defines the first implementation's visual
intent, not an immutable layout specification. Later user-approved device
feedback may refine the values. Agents must not make aesthetic changes without
discussion.

## Responsive layout

Reference frames describe target composition rather than a coordinate system to
scale wholesale. Responsive layout should use:

- current window dimensions;
- explicit safe-area insets;
- bounded minimum and maximum values;
- stable control regions;
- content-specific constraints.

The layout must support compact, regular, and large iPhone dimensions and common
Android aspect ratios. Preserve the design's proportions while preventing
controls from entering unsafe or clipped areas.

Absolute overlays and safe-area padding must not be mixed without understanding
their coordinate systems. For a fixed bottom action, use an explicit bottom
position based on the greater of the device inset and the design margin.

Rive illustrations render with `Fit.Contain`. React Native sizes and positions
the viewport. Artboard dimensions, internal whitespace, optical alignment, and
the relative placement of animated elements are responsibilities of the Rive
asset.

## Welcoming composition

The screen uses one native horizontally paged list as its gesture and copy
layer. The list covers the screen so a swipe can begin outside the text itself.
The primary action overlays the list and retains its own press interaction.

The visual stack is conceptually:

```text
screen
├── full-screen paged copy layer
├── fixed Rive illustration viewport
├── fixed pagination
└── fixed primary action
```

The page index is committed only after native paging settles. Pagination follows
that committed index. The illustration does not track the user's finger; its
transition begins after a new page has been committed.

The typed Welcoming configuration is the source of truth for slide copy, order,
indexes, accessibility descriptions, and asset mapping. Presentation components
must consume that configuration rather than repeat those values.

## Accessibility

Actionable controls expose the appropriate roles, labels, hints, values, and
adjustment actions. Decorative visuals should not produce duplicate screen-reader
output.

The carousel communicates the current page as an adjustable value. Pagination
dots remain visual only. Rive illustrations are decorative unless a future
product requirement gives them essential semantic content.

System Reduce Motion is treated as an input to presentation and orchestration.
Decorative animation should be omitted or replaced by a deterministic supported
pose. The application must not emulate unsupported Rive behavior through timing
assumptions or arbitrary seeking.

## Native projects

Native directories are generated by Expo prebuild and are ignored unless the
repository explicitly adopts committed native projects in the future.

Durable native configuration belongs in application configuration or focused
config plugins. Machine-specific settings such as Android SDK paths remain local
and ignored. Signing material and provisioning profiles must never enter Git.

Regenerating a native directory can erase manual native edits. Before a clean
prebuild, inspect whether the directory contains intentional changes and explain
the impact to the user. Never edit dependencies under Pods, build caches, or
generated output to create a lasting fix.

Because the application uses native modules, runtime testing uses development
builds rather than Expo Go. Agents provide commands and stop before native build
execution; the user performs device and emulator verification.

## Evolution rules

When introducing a new feature:

1. Keep its routing boundary thin.
2. Place feature-specific behavior under its own feature directory.
3. Define external service and runtime contracts at a boundary.
4. Keep public configuration typed.
5. Add shared abstractions only after multiple real consumers justify them.
6. Update this document when an architectural decision changes.

Do not turn current folder names, temporary product scope, or installed package
versions into permanent architectural rules.
