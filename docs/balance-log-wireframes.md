# Balance multiview wireframes

Review route: `/m/balance-log-wireframes`.

Food registration route: `/m/balance-log-wireframes/agregar-alimento`.

This iteration explores the anatomy agreed with the user before visual styling.
It uses 22 synthetic food records grouped into six hours: five groups of four
foods and one group of peanuts/raisins. It does not read Balance data or reuse
its theme, targets or food imagery. The sample calorie target is illustrative.
Four functional app destinations share the same in-memory state:
Alimentos, Mediciones, Resumen and Perfil. Five equal navigation slots put the
registration plus exactly in the center: Alimentos / Mediciones / + / Resumen / Perfil.

## Review states

- **Día plegado:** six time groups, counts, energy and P/C/G subtotals.
- **Detalle:** the 13:00 and 18:00 groups expanded, showing the same sample data.
- **Selección:** those groups expanded with three food records selected and
  cancel/move/delete actions. Group check controls select or deselect all foods.

Changing the review preset restores its original example data. A separate reset
control does the same while retaining the current app destination. The empty-day toggle exposes the selected day's empty
layout. Date controls show partial example intake on October 5, 7 and 8,
initially empty days on October 6, 10 and 11, and the populated reference day,
2026-10-09. Adding, moving, editing and deleting operate within the selected
day; navigating preserves each day's in-memory changes. The reference day is
2026-10-09, rather than the machine's current date. The food week follows the
selected date, including dates reached from a graph or measurement calendar.

## Date strip and compact totals

The continuous ring around the day number represents recorded calories divided
by the illustrative 2,200 kcal target. There is no extra recording dot or plus
character. An empty day has only the muted track. A single ring fills up to
100% in gray; above the calorie target, amber (#b66a12) progressively covers
the same perimeter. At 120% intake, the ring shows 20% amber and 80% gray.
At 200% or more it is fully amber. The overlay shares the main ring's radius,
center and stroke width, so there is one visible ring with no inner ring.
The expanded daily nutrition detail and accessible date labels retain the
uncapped percentage. Date labels retain exact amounts and food-record counts. A full ring does not declare the day completely logged or
assess dietary quality. Exact amounts remain available independently of color.

The daily summary is a single full-width button using two compact lines:
calorie total/target, then inline P/C/G consumed/target grams. It hides fiber and
percentage. Illustrative targets are 2,200 kcal, P 150g, C 265g and G 60g.
Tapping it opens the selected day's advanced nutrition sheet, including fiber
with an illustrative 30g target and the uncapped calorie percentage. Sugar,
saturated fat, sodium and cholesterol show “Sin datos” because the sample
records do not contain them; missing data is never presented as zero.
These values are layout fixtures, not personalized nutrition guidance. The previous large progress bar and
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
for 550 ms to select (Shift+Enter or Shift+Space with keyboard focus). The list
has no permanent food/group count or selection toolbar; count and actions appear
only during selection. Moving/deleting and
adding a sample food affect only this instance in memory; reset reloads samples.
The bottom navigation now opens actual food, measurement and summary views.
No network calls or real-data persistence are implemented.

## Measurement calendar and recording

Mediciones separates Peso from Medidas corporales. Both use a monthly calendar
with previous/next month arrows and a native month/year selector. The selected
filter determines the recording dots and legend; no progress or overdue state
is shown. Selecting a date shows that day's values and editing action. Calendar
navigation and filter switching retain the selected date; month navigation
selects the first day of the destination month.

Weight is one kg value per day, prefilled for editing. Body sessions contain
optional cm values for waist, hips, chest, neck, paired arms, thighs and calves.
Left and right inputs appear together. Changing the form date loads the values
for that date; saving upserts the day's session. Blank fields are absent, rather
than zero; clearing an existing field removes that value from that date. An
expandable latest-by-zone list includes each zone's own last measurement date.
This view has no trend charts or prescribed recording schedule.

Fixtures include frequent weights over 43 days, with explicit gaps, and body
sessions on September 1, September 27 and October 9. The most recent body
session only measures waist and neck, so other zones retain September dates.

## Separate statistics

Resumen has Alimentación / Cuerpo tabs and a shared 7/30/90-day period, including
an editable end date. Alimentación includes calorie bars and P/C/G curves;
Cuerpo includes weight and one selectable circumference chart. Paired zones
compare left/right lines. All figures derive from the same editable memory
records; missing days are not filled with zero. Nutrition curves break at
unrecorded dates; body curves connect actual measurements over elapsed time.
The chart labels and axes preserve units and dates. Grayscale line patterns
distinguish series for this diagramming iteration.

Tap a chart to inspect the nearest recorded date; arrow keys and a date selector
provide equivalent navigation. A link beneath each plot opens that date in
Alimentos or the appropriate Peso/Medidas calendar, where it can be edited.
Returning to Resumen preserves its area, period, end date and body metric.

## Central registration action

Perfil proposes account/name, current units and weight/body reminder preferences.
Name and checkbox changes are held in memory across navigation and reset with
the example. Reminder controls do not schedule or send notifications; units
remain the current kg/cm/kcal readout for this anatomy iteration.

The bottom navigation contains a central 44px plus button. It opens a bottom
sheet with Alimento, Peso and Medidas corporales actions for the selected day. Alimento opens
the normal food-registration route; Peso opens a kg input and
stores one example value per day in memory, prefilled when reopened. Body
measurements use the optional grouped form. Resetting the example restores the
synthetic weights/body sessions as well as food records. Weight is not added to
the food feed, summary or calorie ring.

The previous separate registration row is removed. Selection actions replace
the bottom navigation while selecting rather than stacking above it. Per-group
plus buttons keep their direct, hour-specific food-registration shortcut.

## Food registration route

Adding food is a full screen with a back button, date/hour fields and Bibliotecas /
Código QR tabs. It has no dialog backdrop or bottom navigation. The main plus's
Alimento action, group pluses and empty-day action all enter this route, carrying
the current day/hour in validated query parameters (`fecha`, `hora`, `modo`).
Direct links use the same screen; missing/invalid parameters fall back to the
reference date, 13:00 and Bibliotecas. Browser back returns to the previous view;
the in-screen back button falls back to the mockup root after direct entry.
Changing tabs/date/hour replaces the current history entry, avoiding extra back
steps. The shared mockup stays mounted, so existing in-memory edits survive.

Bibliotecas searches 22 synthetic foods across Mi biblioteca and Compartida,
supports accent-insensitive names, filtering, no-results feedback and selection.
The chosen food shows its fixed sample portion/nutrients and a confirmation
action. Saving appends exactly one example to the chosen day/hour and returns
to its food group. No external libraries or catalogues are accessed.

Código QR uses an explicit “Usar QR de ejemplo” action that selects a sample
yogurt through the same confirmation flow. It does not request camera access,
decode real QR codes or fetch remote products; this iteration reviews anatomy.
Only the exact Balance add-food subroute is enabled; other mockup subroutes
retain the not-found behavior. The route survives direct static SPA refreshes;
a full refresh still resets the prototype's memory-only example records.

## Worktree review

Follow the root INSTRUCTIONS.md preview section and the INF-013 owning runbook.
Prepare the two-hour `vite` plan for UDS-010 and this route. Public activation
requires explicit approval of the exact plan; the wireframe iteration itself
does not merge main or publish a permanent Sandbox release.
