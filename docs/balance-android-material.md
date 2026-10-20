# Balance · Android Material

Visual study 01, UDS-012. Open `/m/balance-android-material`; the accepted neutral
prototype remains at `/m/balance-log-wireframes`. The Android route uses the same
stateful component, synthetic fixtures, validation and recording flows. Its food
registration subroute remains under its own URL. Further studies can register a
wrapper with another appearance without forking the food/measurement domain.

Use the external review controls to switch dark/light, choose any of the four
views, or inspect folded/detail/selection/empty states. Changing appearance keeps
the current records and filters in memory. Reset/reload restores the examples.
The original link opens a separate prototype instance with its own sample state.

## Visual direction

Material 3 with Expressive-inspired grouped surfaces, rounded geometry and clear
interaction color. The accepted information architecture stays intact, including
the five equal navigation slots and center add action. This custom arrangement
needs native validation; it is not presented as a stock NavigationBar layout.
The compact two-line food rows are also a deliberate custom list composition.

Semantic roles (dark / light):

| Role | Dark | Light |
| --- | --- | --- |
| Background | `#101418` | `#f7f9fe` |
| Surface | `#181c20` | `#edf1f7` |
| Container | `#22272d` | `#e3e9f0` |
| On surface | `#e1e2e8` | `#191d23` |
| Primary | `#a2c9f8` | `#285d90` |
| On primary | `#063257` | `#ffffff` |
| Secondary container | `#304b66` | `#d2e5ff` |
| On secondary container | `#d2e5ff` | `#133a5c` |
| Overflow | `#efba73` | `#895000` |

Roboto serves display/body; nutrition uses tabular numerals. Titles use 22–29px,
body/list text 14px, supporting compact data 11–12px. Main controls target 48px;
calendar cells use available seven-column width, so a Compose implementation
must validate minimum interactive expansion and font scaling on-device. No fake
Android status bar is drawn. The gray calorie ring and amber excess retain their
accepted meaning; neither means that logging is complete.

## Compose correspondence

| Web study | Native implementation reference |
| --- | --- |
| Scoped dark/light roles | `MaterialTheme`, `darkColorScheme` / `lightColorScheme` |
| Page surfaces and scrolling content | `Scaffold`, `Surface`, `LazyColumn` |
| Date/page headers | `TopAppBar` plus custom date/week content |
| Tonal context and grouped hours | `FilledTonalButton` / `Card`, custom expandable list |
| Four destinations and center add | `NavigationBarItem` and `FloatingActionButton`, custom layout |
| Rounded view filters | `SingleChoiceSegmentedButtonRow` or tabs as appropriate |
| Library search and entry fields | `SearchBar`, `OutlinedTextField` |
| Preferences | `Switch` |
| Registration sheet and editing dialog | `ModalBottomSheet`, `AlertDialog` / `Dialog` |
| Month and date entry | `DatePicker` / `DatePickerDialog`; preserve domain date rules |

This is a React/Base UI visual prototype, not an Android binary or Compose
renderer. Pixel-to-dp correspondence is illustrative. Native ripple, system
back, IME/insets, TalkBack, large text, spring motion and physical touch remain
for native implementation review. Lucide icons are retained from the baseline;
replace with Material Symbols in the native app. Static brand colors preview
semantic roles; Android wallpaper-driven dynamic color is not simulated.

## Version reference

Checked 2026-10-20 against the official
[Compose Material3 release notes](https://developer.android.com/jetpack/androidx/releases/compose-material3):
**1.4.0 stable**, **1.5.0-beta01 beta**, updated 2026-10-07. Expressive APIs vary
by library version; select stable/beta explicitly during native implementation.
The study adds no Android dependencies and does not imply beta APIs are stable.
The [Material 3 in Compose guide](https://developer.android.com/develop/ui/compose/designsystems/material3)
describes theming roles, typography, shapes and dynamic color.
