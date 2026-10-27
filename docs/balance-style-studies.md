# Balance · Style comparator

The Organic direction is accepted for the next Balance planning iteration.
See the [accepted design and native handoff](balance-design-handoff.md) for closed
visual decisions, future system-color preferences and Kotlin/Compose boundaries.

UDS-012. `/m/balance-style-studies` compares Material, Instrumental, Editorial and
Orgánico on one mounted prototype. Orgánico opens by default. Use the external
Dirección visual controls and dark/light buttons; current records, page, forms,
selection and analysis filters persist. Organic also offers the external
Paleta de color selector; Bosque remains the default. Reload/reset retains the established
synthetic-data behavior. Food registration stays under this route.

## Shared structure

All styles reuse the approved compact date/totals/week header and icon-only +,
shared food/measurement domain, four views and existing accessible dialogs.
The comparison changes semantic roles, type and shape, not information density.
The neutral wireframe and standalone Android/Expressive studies remain available.
No dependency changes, backend integration or native app migration.

| Direction | Type | Surface / primary, dark | Surface / primary, light | Shape |
| --- | --- | --- | --- | --- |
| Instrumental | Inter, restrained Plex Mono utility data | `#1c1e20` / `#87c9cf` | `#e9edf0` / `#1c656e` | Small corners, precise row separators |
| Editorial | Plex Sans, condensed Archivo headings | `#18263a` / `#b5cef3` | `#e5ebf3` / `#214c80` | Rules, rectangular selections, implicit lists |
| Orgánico | Inter body, Outfit headings | `#1c2b25` / `#c9e5ae` | `#e9eee3` / `#42633a` | Softer related shapes, opaque gradients |
| Material | Existing Roboto study | Existing role set | Existing role set | Existing compact Expressive geometry |

Frontend-design guided these original visual adaptations. The other directions
are not described as native Material implementations. References are partial
inspiration: [Linear](https://linear.app/now/behind-the-latest-design-refresh)
for restrained chrome, [Carbon](https://carbondesignsystem.com/components/data-table/usage/)
for alignment and typographic data structure, and
[Gentler Streak](https://gentlerstories.com/gentlerstreak) for a warmer health-app
character. Their products, layouts and branding are not reproduced.

## User-requested gradients

Orgánico uses static opaque gradients on the compact header and primary actions.
Bosque retains the original forest -> blue gray -> plum header in dark mode
and sage -> mint -> lilac in light mode. Its + keeps the original mint/lilac
dark-mode gradient and forest/teal/plum light-mode gradient. Additional palettes
change the entire semantic role set, including portaled dialogs, without changing
type, shapes or layout:

| Palette | Character | Dark surface / primary | Light surface / primary |
| --- | --- | --- | --- |
| Bosque | Sage, mint, plum; original | `#1c2b25` / `#c9e5ae` | `#e9eee3` / `#42633a` |
| Laguna | Teal, blue, mint | `#1a2e35` / `#a4dce0` | `#e0eeef` / `#146477` |
| Lavanda | Lilac, blue, rose | `#2a2438` / `#d7bff2` | `#f0e8f5` / `#76518a` |
| Durazno | Peach, coral, mauve | `#33262a` / `#f2bdad` | `#f6e7e2` / `#975155` |

Palette buttons have visible names, decorative gradient swatches, pressed states
and keyboard focus. They appear only for Organic and retain their selection when
visiting another style. They update appearance state without remounting the
prototype or resetting its records, drafts, selections or filters. Review controls
remain outside the phone, so its compact header and list proportions stay fixed.
Repeated food rows, text fields,
dialog content and navigation use solid role-based surfaces. Gradients neither
animate nor encode a numerical measurement.

Both themes define complete foreground/background role pairs. Verify text
against every gradient stop as well as the actual rendered background; do not
infer gradient contrast from the primary solid role alone. Keep visible focus,
full semantic labels, reduced motion and the existing native-button behaviors.

## Implementation and review boundaries

React 19 / Base UI, scoped CSS and Google Fonts. The comparator adds no native
Android dependency or simulated wallpaper color. Existing short disclosure/dialog
transitions remain interruptible and respect reduced-motion preferences.

Review all four directions and Organic palettes in dark/light at 375/390px, with long fixture names,
three-digit macros, selection, registration and analysis. Check mode-switch
state continuity, portal classes, header/list proportions, gradient-stop
contrast, keyboard focus and zoom. Actual evidence belongs in the UDS-012 run.
Native TalkBack, device font scaling, IME/insets and Compose implementation
remain future native review, as documented in the earlier studies.

## Current-screen review (UDS-017)

The same comparator now offers secondary screens and external state/layout
review controls. Organic remains the default and all four palettes retain both
themes. The current Android review excludes body circumference/reminder fixtures;
other historical studies retain their original scope. Library, account, access
and import screens use memory-only interaction examples. See the
[current screen inventory](balance-current-screen-inventory.md) for actual
entry points, coverage, diagramming decisions and remaining native/product work.
