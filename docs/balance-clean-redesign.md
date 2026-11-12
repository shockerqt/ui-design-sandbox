# Balance · Clean redesign (light and dark)

UDS-018. `/m/balance-clean-redesign` publishes the clean Balance proposal drafted on
2026-11-12 that BAL-058..062 implement: neutral paper, ink and three macro colours.
It replaces the Organic gradients as the target direction; the earlier studies stay
available for comparison.

## Views

- **Móvil**: three 390 × 844 phones. The first one navigates (diary → + → add →
  save; Resumen in the tab bar). The other two pin the add-food and summary screens
  side by side.
  - Diary: compact header, week strip (logged days marked, future days quiet, empty
    days show an empty state), day totals with macro bars, meals grouped by hour.
  - Add food: search, Recientes / Frecuentes / Mis alimentos, multi-add with a
    quantity stepper and portion/grams per selected food, and a live footer total.
  - Summary: 7 / 30 / 90 day ranges with calories against the goal, weight trend
    and average macros.
- **Web**: sidebar with sections and month calendar, command bar, day table with
  totals, day summary and the week chart.

The **Tema oscuro** switch (Base UI Switch) swaps only the `--b-*` tokens on the
root; the markup has no hardcoded colours.

## Tokens

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--b-ground` | `#F7F7F5` | `#101113` | Screen background |
| `--b-surface` | `#FFFFFF` | `#1A1C20` | Cards, bars, inputs |
| `--b-ink` | `#16181D` | `#ECEDEA` | Text, primary buttons, selected day, calorie bar |
| `--b-on-ink` | `#FFFFFF` | `#101113` | Text and icons on ink |
| `--b-ink-2` | `#5A606B` | `#A3A8B1` | Secondary text |
| `--b-line` | `#E4E5E1` | `#2A2D33` | Card borders |
| `--b-line-strong` | `#D5D7D2` | `#5A606B` | Control borders |
| `--b-track` | `#ECEDE9` | `#2A2D33` | Progress tracks, row dividers, logged day |
| `--b-protein` | `#2F5BEA` | `#7DA0FF` | Protein bar, weight line |
| `--b-carbs` | `#B97A00` | `#E3AC3A` | Carbohydrate bar |
| `--b-fat` | `#C2336B` | `#F27AA6` | Fat bar |
| `--b-bar` | `#8A8F99` | `#6E747F` | Past days in charts |
| `--b-bar-empty` | `#D5D7D2` | `#3A3E46` | Days without records |
| `--b-goal` | `#9CA1AA` | `#8A8F99` | Dashed goal line |
| `--b-link` / `--b-focus` | `#2F5BEA` | `#8FB0FF` | Links and focus ring |

Measured contrast in dark against `--b-surface`: ink 14.5:1, ink-2 7.1:1,
protein 6.8:1, carbs 8.3:1, fat 6.6:1, chart bars 3.6:1, link 8.0:1. Light keeps
the values of the original proposal (ink-2 6.3:1, carbs 3.6:1, bars 3.3:1).
In dark the macro colours are lighter rather than inverted, so a macro keeps the
same hue in both themes. Macro colour is always paired with its name and value.

Fonts: Bricolage Grotesque for display numbers and titles, Inter for UI.
