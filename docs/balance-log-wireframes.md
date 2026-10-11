# Balance log wireframes

Review route: `/m/balance-log-wireframes`.

This iteration explores the anatomy agreed with the user before visual styling.
It uses 22 synthetic food records grouped into six hours: five groups of four
foods and one group of peanuts/raisins. It does not read Balance data or reuse
its theme, targets or food imagery. The sample calorie target is illustrative.

## Review states

- **Día plegado:** six time groups, counts, energy and P/C/G subtotals.
- **Detalle:** the 13:00 and 18:00 groups expanded, showing the same sample data.
- **Selección:** those groups expanded with three food records selected and
  cancel/move/delete actions. Group check controls select or deselect all foods.

Changing the review preset restores its original example data. A separate reset
control does the same. The empty-day toggle exposes the selected day's empty
layout. Date controls show partial example intake on October 5, 7 and 8,
initially empty days on October 6, 10 and 11, and the populated reference day,
2026-10-09. Adding, moving, editing and deleting operate within the selected
day; navigating preserves each day's in-memory changes.

## Date strip and compact totals

The continuous ring around the day number represents recorded calories divided
by the illustrative 2,200 kcal target. There is no extra recording dot or plus
character. An empty day has only the muted track. The outer lap fills up to
100%; intake beyond that starts a concentric inner lap representing the next
100%. Visual laps saturate at 200%, while the selected-day summary and accessible
labels retain the uncapped percentage and exact amounts. Accessible day labels
also include food-record counts. A full ring does not declare the day completely
logged or assess dietary quality.

The daily summary uses two compact lines: calorie total/target and percentage,
then P/C/G/F amounts (fiber is retained). The previous large progress bar and
four-column macro cards are removed. Daily weight is excluded from the feed and summary.
Collapsed and expanded group headings show two lines: hour/count/calorie
subtotal, then a compact right-aligned P/C/G line. The entire heading area is
the expansion button; its chevron is a decorative cue inside that same button.
The separate rightmost plus has a divided, at-least-44×44px touch area, fills the
heading height and does not toggle expansion. Selection adds a separate 44px
group checkbox. Food-row anatomy keeps its two lines.

## Food-row anatomy

Each food uses a fixed neutral image symbol and two content lines:

1. Name and calories.
2. Quantity, exact time and an inline protein/carbohydrate/fat summary in grams.

Macro values stay together with subtle dot separators and tabular numerals;
short fixed-width value fields accommodate three digits without spreading the
labels across the card. Group macros align below the energy subtotal. Food
macros take their intrinsic compact width, with portion text yielding first
when space is tight. The illustrative rice
portion contains 107g carbs to exercise three-digit values in expanded and
selection states. Numeric values remain explicit; no category color system is
introduced in this grayscale iteration.

Names and quantities may ellipsize at phone widths; the full values remain in
the accessible label and edit dialog. Exact time and macro values remain visible.
This is a deliberate prototype tradeoff to review, not a production typography
decision. No manual meal naming or food categorization is introduced.

Tap a food to edit its time/quantity; nutrition snapshots are preserved. Hold
for 550 ms to select, or use the explicit selection control. Moving/deleting and
adding a sample food affect only this instance in memory; reset reloads samples.
The bottom app-navigation labels are contextual references, not additional
implemented screens. No network calls or real-data persistence are implemented.

## Central registration action

The bottom navigation contains a central 44px plus button. It opens a bottom
sheet with Alimento and Peso actions for the selected day. Alimento continues
to the existing example search and recording flow; Peso opens a kg input and
stores one example value per day in memory, prefilled when reopened. Resetting
the example clears these weights as well as food edits. Weight is not added to
the food feed, summary or calorie ring.

The previous separate registration row is removed. Selection actions replace
the bottom navigation while selecting rather than stacking above it. Per-group
plus buttons keep their direct, hour-specific food-registration shortcut.

## Worktree review

Follow the root INSTRUCTIONS.md preview section and the INF-013 owning runbook.
Prepare the two-hour `vite` plan for UDS-010 and this route. Public activation
requires explicit approval of the exact plan; the wireframe iteration itself
does not merge main or publish a permanent Sandbox release.
