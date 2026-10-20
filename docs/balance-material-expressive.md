# Balance · Material Expressive, study 02

UDS-012. `/m/balance-material-expressive` is a second visual direction over the
accepted shared flows. `/m/balance-android-material` and the neutral wireframe
remain independent reference routes. Comparison links start separate prototype
instances; changing dark/light within an instance preserves its data and filters.

## UI contract and expression budget

The primary task remains recording daily intake and occasional measurements.
The navigation order, central registration entry, date rules, example values,
selection behavior and registration forms remain shared. No new domain layer.

| Intensity | Applied to | Purpose |
| --- | --- | --- |
| Quiet | Food rows, macros, repeated hour groups | Preserve scan speed and compact data |
| Clear | Day heading, nutrient labels, selected filters | Make hierarchy and state recognizable |
| Expressive | Register action, connected controls, dialog entry/exit | Reinforce primary action and continuity |

Nutrition context uses explicit energy and nutrient labels, stable tabular
numbers and three compact meters based on the existing totals/targets. The
meters saturate at the target and do not represent completion; precise consumed
and target values remain visible and accessible. The accepted neutral date ring
and amber excess retain their meaning. No congratulatory or adverse health
interpretation is added to exceeding a sample target.

Hour groups use implicit containment; expanded foods share a disclosure surface.
Charts lose repeated surrounding cards while retaining their actual example
series. Shapes distinguish the registration control, selected connected controls
and grouped surfaces. There are no decorative polygons, fake loading states,
continuous animation, glass effects or gradient surfaces.

Dark/light color roles inherit study 01 for a controlled comparison. Study 02
raises field-outline contrast using `#7c8b9b` dark / `#68798d` light. Roboto serves
headings and body, with tabular numerical content. Main controls remain at least
48 CSS px where layout permits; seven-column calendars retain the baseline
width constraint documented in study 01.

## Implementation boundary

This is React 19 / Base UI 1.7, using scoped CSS and semantic HTML. The installed
`material-design-3` skill (gdlbo/material-skill snapshot
6ab265267c0a5512c43e2d1c27abd6bc2d5de785) and `frontend-design` guided the review.
Skill heuristics are review aids; they are not additional official Material rules.

Base UI owns keyboard behavior, focus trapping/restoration and disclosure/modal
presence. CSS uses documented `data-starting-style`, `data-ending-style` and
`--accordion-panel-height`. Transitions are interruptible and short, with a
shared easing. `prefers-reduced-motion: reduce` removes transition/animation on
both canvas and portaled popup. This CSS approximation does not claim native
Material spring physics or native Compose components.

For Compose, use public Material theme/component APIs and their motion schemes
available in the selected dependency version. Validate expressive API stability
at implementation time; no Compose dependency, beta opt-in or app migration is
part of this web study. See the [study 01 mapping](balance-android-material.md).

## Verification and remaining native review

Build into `/tmp/uds012-expressive-dist` for local browser checks while an older
approved preview still serves canonical `dist`. Rebuilding canonical `dist`
requires stopping its owned lease first and starting an approved replacement.

Review the exact route at compact/wide widths, both themes, selection, food
registration, keyboard focus, interrupted disclosure, reduced motion and 200%
zoom. Validate foreground/background pairs and meaningful field outlines.
Actual runs and evidence are recorded in the UDS-012 execution run.

Android physical touch, TalkBack, native font scaling, IME/insets, system back,
performance on-device and wallpaper-derived dynamic colors remain native review.
This study does not simulate a network or add unreachable loading/offline states.

References: [Material Expressive](https://m3.material.io/get-started),
[Compose Material 3](https://developer.android.com/develop/ui/compose/designsystems/material3),
[Base UI accordion](https://base-ui.com/react/components/accordion),
[Base UI dialog](https://base-ui.com/react/components/dialog).
