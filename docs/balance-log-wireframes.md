# Balance log wireframes

Review route: `/m/balance-log-wireframes`.

This iteration explores the anatomy agreed with the user before visual styling.
It uses 22 synthetic food records grouped into six hours: five groups of four
foods and one group of peanuts/raisins. It does not read Balance data or reuse
its theme, targets or food imagery. The sample calorie target is illustrative.

## Review states

- **Día plegado:** six time groups, counts and energy subtotals.
- **Detalle:** the 13:00 and 18:00 groups expanded, showing the same sample data.
- **Selección:** those groups expanded with three food records selected and
  cancel/move/delete actions. Group check controls select or deselect all foods.

Changing the review preset restores its original example data. A separate reset
control does the same. The empty-day and daily-weight toggles expose conditional
layout states. Date controls show empty neighboring example days and return to
the populated reference day, 2026-10-09.

## Food-row anatomy

Each food uses a fixed neutral image symbol and two content lines:

1. Name and calories.
2. Quantity, exact time and protein/carbohydrate/fat amounts in grams.

Names and quantities may ellipsize at phone widths; the full values remain in
the accessible label and edit dialog. Exact time and macro values remain visible.
This is a deliberate prototype tradeoff to review, not a production typography
decision. No manual meal naming or food categorization is introduced.

Tap a food to edit its time/quantity; nutrition snapshots are preserved. Hold
for 550 ms to select, or use the explicit selection control. Moving/deleting and
adding a sample food affect only this instance in memory; reset reloads samples.
The bottom app-navigation labels are contextual references, not additional
implemented screens. Weight is a layout-only example. No network calls or
real-data persistence are implemented.

## Worktree review

Follow the root INSTRUCTIONS.md preview section and the INF-013 owning runbook.
Prepare the two-hour `vite` plan for UDS-010 and this route. Public activation
requires explicit approval of the exact plan; the wireframe iteration itself
does not merge main or publish a permanent Sandbox release.
