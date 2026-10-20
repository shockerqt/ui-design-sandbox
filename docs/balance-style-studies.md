# Balance · Style comparator

UDS-012. `/m/balance-style-studies` compares Material, Instrumental, Editorial and
Orgánico on one mounted prototype. Orgánico opens by default. Use the external
Dirección visual controls and dark/light buttons; current records, page, forms,
selection and analysis filters persist. Reload/reset retains the established
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
The header moves forest -> blue gray -> plum in dark mode, and sage -> mint ->
lilac in light mode. The + uses a related mint/lilac gradient in dark mode and
a forest/teal/plum gradient in light mode. Repeated food rows, text fields,
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

Review all four directions in dark/light at 375/390px, with long fixture names,
three-digit macros, selection, registration and analysis. Check mode-switch
state continuity, portal classes, header/list proportions, gradient-stop
contrast, keyboard focus and zoom. Actual evidence belongs in the UDS-012 run.
Native TalkBack, device font scaling, IME/insets and Compose implementation
remain future native review, as documented in the earlier studies.
