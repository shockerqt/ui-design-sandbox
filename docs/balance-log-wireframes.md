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

The weekday dot means the day has at least one record. The ring around the day
number represents recorded calories divided by the illustrative 2,200 kcal
target. An empty day has a dashed outline. The ring stops at 100%; a plus sign
indicates intake above the target, and the selected day's totals show the
uncapped percentage and exact amounts. Accessible day labels include record
count, calorie amounts and percentage. A recording indicator does not declare
the day completely logged, and a full ring is not an assessment of dietary quality.

The daily summary uses two compact lines: calorie total/target and percentage,
then P/C/G/F amounts (fiber is retained). The previous large progress bar and
four-column macro cards are removed. Daily weight is removed from this tab.
Collapsed and expanded group headings show two lines: hour/calorie subtotal,
then food count/P/C/G amounts. Food-row anatomy remains unchanged.

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
implemented screens. No network calls or real-data persistence are implemented.

## Worktree review

Follow the root INSTRUCTIONS.md preview section and the INF-013 owning runbook.
Prepare the two-hour `vite` plan for UDS-010 and this route. Public activation
requires explicit approval of the exact plan; the wireframe iteration itself
does not merge main or publish a permanent Sandbox release.
