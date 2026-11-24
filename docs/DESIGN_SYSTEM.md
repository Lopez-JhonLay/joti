# Joti Design System

## Reference study

Reference: [ramfranco.vercel.app](https://ramfranco.vercel.app/), studied on 2026-11-24 through web search and direct HTML/stylesheet retrieval. No computer control was used. These observations describe source declarations; interaction and responsive behavior were inferred from classes, not visually verified in a browser.

| Area                | Source observations                                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Typography          | Inter sans-serif; bold, tightly tracked headings; muted supporting text; distinct small labels.                     |
| Spacing             | Four-pixel rhythm; generous vertical sections; 16/24/32-pixel responsive horizontal gutters.                        |
| Layout              | Centered, constrained content; single-column mobile sections expand into grids.                                     |
| Navigation          | Fixed, translucent header; desktop links become a menu trigger on smaller screens.                                  |
| Presentation        | Clear headline, supporting description, primary/secondary actions, then bordered feature/project cards.             |
| Imagery             | Framed product screenshots with 16:9 proportions; atmospheric glows and illustrative interface panels.              |
| Buttons/links       | Filled blue primary actions, outlined secondary actions, muted navigation links; hover/focus/disabled styles.       |
| Borders/components  | Thin low-contrast separators, rounded panels, pill labels, grouped statistics, accordion disclosures.               |
| Colors              | Dark navy background, lifted dark surfaces, near-white headings, gray copy, blue accent. Light defaults also exist. |
| Responsive behavior | Stacked full-width CTAs become rows; headings/gutters scale; desktop navigation hides below its breakpoint.         |

## Joti adaptation

Keep the hierarchy, breathing room, restrained accent, and framed surfaces. Use a calmer journal composition with original copy, practical contrast, and touch-friendly controls. The portfolio's logo, photos, screenshots, text, code panels, and branded decorations are not included. Inter comes independently from the open-source `@expo-google-fonts/inter` package, not the reference host. The selected original 2D notebook mascot, its nine action poses, and intended-use map are saved in `assets/mascot/joti-2d/`. These are static assets; screen integration and character animation remain future work.

### Token ownership

- `constants/design-tokens.js`: the shared palette, font families, spacing, radii, breakpoints, and container widths. Native navigation consumes this same palette.
- `tailwind.config.js`: exposes semantic color utilities, text sizes, and layout values. Its plugin generates the CSS palette variables from the shared tokens.
- `global.css`: Tailwind layers and reusable native-compatible component classes.
- `lib/theme.tsx`: applies palette variables with NativeWind `vars()`, resolves system/light/dark preference, and themes navigation. Preference is session-only and resets to System on reload.
- `babel.config.js`, `metro.config.js`, `nativewind-env.d.ts`: NativeWind 4 / Tailwind 3 compilation and typing. Metro uses a 16-point rem baseline.

### Color and border roles

| Role             | Light     | Dark      |
| ---------------- | --------- | --------- |
| Background       | `#F6F8FC` | `#0D1220` |
| Surface          | `#FFFFFF` | `#151D2E` |
| Elevated surface | `#EDF2FA` | `#1E2A40` |
| Foreground       | `#172033` | `#F1F5FC` |
| Muted text       | `#526078` | `#A9B7CE` |
| Border           | `#CBD5E5` | `#394963` |
| Primary          | `#245BD6` | `#A5C4FF` |
| On-primary       | `#FFFFFF` | `#122348` |

Use `bg-background`, `bg-surface`, `text-foreground`, `text-muted`, `text-link`, and `border-border`. Success, warning, danger, focus, and pressed-primary tokens are also available. Never convey status using color alone. Cards use a one-point border and 20-point radius; buttons use fully rounded pill corners, content-sized widths, 16-point horizontal padding, and a minimum 48-point touch target. Labels wrap and controls grow vertically at larger font sizes. Decorative surfaces must not be the only indication that an element is interactive.

The bottom tab bar is a rounded pill with 16-point side margins and at least 12 points below it, increased for the device's safe area. `PillTabBar` owns the clipped surface and border; its surrounding padding uses the page background, while the navigator's default painted rectangle is transparent. `PillTabButton` rounds and clips the actual inner pressable, since the navigator otherwise hardcodes a zero-radius active background. It stays in layout flow so content ends above the bar. Icons, labels, and colors are preserved; the selected tab uses the existing elevated-surface token. The bar hides while the keyboard is open.

### Typography and spacing

Inter 400/500/600/700 is bundled through Expo Font for Expo Go. `Typography` exposes caption (12/18), label (14/20), body (16/26), lead (18/28), title (24/32), heading (32/40), and display (40/48) font-size/line-height roles. Display and heading variants step down on narrow screens. Text retains platform font scaling and wraps; avoid fixed-height text containers.

Use the 4/8/12/16/20/24/32/40/48/64 spacing scale. `Container` centers content within 960 points with 20/24/32-point gutters. Reading copy is capped at 640 points. Breakpoints are 480, 768, and 1024 logical points; native flex layouts replace web-only CSS grids. `ActionRow` stacks below 480; `ResponsivePair` stacks below 768. Insets and scrollable content accommodate phone cutouts, navigation, and keyboards.

### App-wide motion principles

Joti should feel smooth, fluid, and responsive. Use animation wherever it appropriately clarifies an interaction, connects states, or provides feedback. Apply this principle to new features as they are implemented, using the existing theme, shapes, and visual hierarchy.

- Animate meaningful transitions: navigation selection, screen/modal entry and exit, expanding content, form-step changes, pressed states, and save/retry/success feedback. Keep reading and typing surfaces calm.
- Favor continuity: move shared indicators between positions and transition related content smoothly. When users interact again mid-animation, retarget from the current position instead of snapping or queuing old transitions.
- Keep feedback immediate. Start state changes promptly; never delay navigation, input, saving, or recovery until a decorative animation finishes. Motion must reflect the real operation's state.
- Use consistent, restrained easing. Start with 120–200 ms for small feedback and 200–350 ms for panel/state transitions; brief icon accents may run up to 420 ms. Use gently damped springs for spatial movement, with minimal overshoot.
- Prefer native-driver transforms and opacity where supported. Reuse shared components and existing animation tools; introduce layout animation only when it improves clarity and remains smooth on Android.
- Honor the OS reduced-motion preference, including live changes. Remove nonessential movement and update selection/state directly; retain readable labels and feedback. Keep decorative motion off until the preference is known.
- Avoid continuous decorative loops, excessive bouncing, and broad page animations on every render. Cancel animations and listeners on unmount, and replay interaction feedback only on genuine activation.

Review motion on the physical phone: rapid repeated taps, interrupted transitions, enlarged text, light/dark themes, and reduced motion. Automated tests should cover state/trigger regressions; phone review establishes visual smoothness.

### Icons and navigation motion

Use `AnimatedIcon` from `components/ui/animated-icon.tsx` and the shared `Button icon` prop. The icon style/motion reference is [Lucide Animated](https://lucide-animated.com/llms.txt); its DOM SVG and `motion/react` components are web-only. Joti uses the official [Lucide React Native](https://lucide.dev/guide/react-native) icon shapes with an original native-driver adaptation, rather than installing the web registry or reproducing every per-path animation exactly. Lucide's ISC license ships with the dependency; no upstream web component source is bundled.

The four tabs use House, History, Building2, and Settings with brief focus-triggered motion. The navigator keeps permanent active/inactive icon copies mounted, so `PillTabIcon` reads the actual selected route from the bar's context instead of using the navigator's fixed `focused` icon argument. Each real selection replays from the start, including returning quickly to a previously visited tab. Add Entry, appearance choices, preview entry/exit, and Close use matching icons that respond to press state. Only the eleven selected icon modules are imported. Rotations, small bounces, and pulses run once per interaction; nothing loops in the background. Native Animated uses the native driver and cancels unfinished motion on unmount. `hooks/use-reduced-motion.ts` reads the OS preference, listens for live changes, and keeps icons static until that preference is known. Icons inherit semantic theme colors and are decorative; button/tab text retains the accessible label.

The active navigation background is one rounded `PillTabIndicator`, spring-translated behind the buttons. It uses the measured bar width and equal tab slots, handles right-to-left layout and width changes, and retargets from its current position during quick switches. Individual tab backgrounds stay transparent. Reduced-motion mode updates the indicator immediately and disables icon motion while keeping navigation fully usable.

### Reusable primitives

Selected section headers (welcome and Home) opt into a subtle dotted grid using `PlaceholderScreen patterned`. `DotPattern` draws a native SVG tile with an elliptical fade; its color and density come from `pattern` palette tokens and `layout.dotGrid`. The decorative layer ignores touch and is hidden from accessibility. Other sections remain plain to keep reading areas quiet. The pattern is generated locally; no reference-site image is used.

| Primitive                      | Purpose                                                                                                                     |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| `Typography`                   | Consistent type roles; pass `accessibilityRole="header"` for headings.                                                      |
| `Container`, `Card`, `Divider` | Responsive content bounds, bordered surfaces, separators.                                                                   |
| `ActionRow`, `ResponsivePair`  | Wrapping actions and single/two-column compositions.                                                                        |
| `Button`                       | Primary, secondary, ghost variants; minimum 48-point target, growing height, busy/disabled semantics, pressed/focus states. |
| `TextLink`                     | Underlined internal Expo Router navigation, semantic link color, comfortable vertical padding.                              |
| `ThemePicker`                  | Explicit System, Light, Dark selection in Settings.                                                                         |

```tsx
<Card>
  <Typography variant="title">A moment worth keeping</Typography>
  <Typography className="text-muted">
    Make a little room for your progress.
  </Typography>
  <ActionRow>
    <Button title="Add Entry" onPress={openEntry} />
    <TextLink href="/history">Browse history</TextLink>
  </ActionRow>
</Card>
```

Future evidence images should use an owned/authorized image inside a rounded, bordered 16:9 frame, with useful accessibility labels. No image uploads, stock imagery, marketing animations, or new journal functionality are introduced in this task.

## Verification and phone review

Automated checks cover compiled native styles, theme selection, text contrast, disabled/busy actions, responsive containers, and navigation regression. Headless viewport checks do not establish Android visual fidelity, font metrics, or keyboard behavior.

On 2026-11-24 the user confirmed the current design looks fine after checking it in Expo Go and approved task 1.3 as complete. Automated responsive and motion checks supplement this acceptance; it does not claim exhaustive testing on every Android device or font-scale/keyboard configuration.

For future UI changes, run `npm start -- --clear` yourself and scan the QR code with Expo Go on the same Wi-Fi network. Inspect Home and Settings at normal and enlarged system font sizes; check Light, Dark, and System, tab/stack transitions, scrolling, and Add Entry return. No emulator or manual-preview server is started by the agent.
