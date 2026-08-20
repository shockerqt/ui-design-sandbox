# Balance Terminal Interaction Spec

Status: working UX specification for the `balance-vim-log` mockup.

This document records interaction decisions that should survive beyond the prototype. It intentionally distinguishes implemented behavior from planned behavior. The register model is still under discussion and must be resolved before this branch is merged to `main`.

## Product model

Balance behaves like a modal, keyboard-first food log rather than a literal text editor. Vim conventions are reused when they improve speed or composability, but domain semantics take priority over strict Vim compatibility.

The day is the main buffer. Food rows are the real cursor targets. Hour headers are derived presentation and are not independently selectable entities.

NORMAL represents locally committed state. INSERT and inline EDIT modes represent temporary operation drafts. `Enter` confirms the current operation; `Esc` cancels it.

## Visual language

- Full-page dark terminal/editor surface with blue as the primary accent.
- Hour group headers use a subtle ghost background without a left accent border.
- Cursor rows use a translucent blue surface plus an outline so they remain visually distinct from structural group headers.
- The page background is an ambient blue mesh.
- Keyboard navigation perturbs the mesh directionally. Repeated keys and numeric counts accumulate energy before decaying.
- `prefers-reduced-motion` disables reactive motion.
- The month minimap remains a compact fixed 7×6 grid of tiny cells. Outside-month days remain visible but faint; selected day is filled; today is outlined.

## Command grammar

The interaction model should move toward a parser rather than independent key callbacks.

Concepts:

- `Count`
- `Motion`
- `Operator`
- `TextObject`
- `TimeExpression`
- `Register`
- `Mode`
- `Selection`

Examples:

```text
5j        count + motion
5G        indexed jump
3>        count + move
2p        count + paste
13a       time literal + add
1330a     time literal + add

diw       operator + text object
yiw       operator + text object
=iw       normalization operator + text object

t 1430    absolute time expression
t +30     relative time expression
t -1h     relative time expression
```

The meaning of a numeric prefix depends on the command. For navigation and paste it is a count; for `a/A` it is a time literal; for `[n]G` it is a 1-based row index.

## Navigation

```text
j / k          next / previous food
[count]j/k     move N foods
h / l          previous / next day
H / L          previous / next week
[count]h/l     move N days
[count]H/L     move N weeks
gg             first food in current day
G              last food in current day
[n]G           food N, 1-based
gt             today
```

`gt` replaces the current prototype binding `t = today`. Lowercase `t` is reserved for time editing.

In VISUAL, motions such as `j`, `k`, `gg`, and `G` extend the selection from its anchor.

## Selection and hour-block text objects

Selection is contiguous, not checkbox-style.

```text
Space / v      enter or leave VISUAL
V              select current hour block
viw / vib      select current hour block
vaw / vab      select current hour block
Esc            cancel / NORMAL
```

`w` and `b` are aliases for the Balance hour-block object. `inner` and `around` currently have the same effect because group headers are derived presentation rather than stored entities.

## Operators

Target grammar:

```text
yy             yank current row
dd             cut current row
yiw/yib/...    yank hour block
diw/dib/...    cut hour block
y              yank current VISUAL selection
d              cut current VISUAL selection
x              delete current row/selection without replacing register
u              undo
```

NORMAL `d` and `y` should eventually behave as pending operators rather than immediately acting on the current row. The statusline should expose incomplete commands such as `d_` or `di_`.

Counts should eventually compose with text objects, for example `2diw` or `3yiw`.

## Register and paste

Desired shortcut surface:

```text
p              paste after
P              paste before
[count]p       repeated paste after
[count]P       repeated paste before
```

A key UX decision already identified: paste should not consume the register. Repeated `p` should remain possible.

However, the exact register model is intentionally unresolved before merge. Questions still to decide include:

- whether delete/cut and yank share the same unnamed register exactly like Vim;
- whether pasted rows always receive new IDs;
- whether the first paste after a delete should preserve identity as a move;
- how timestamps behave when pasted into another position/day;
- whether repeated pastes preserve original relative timestamps;
- whether a register stores domain snapshots or references to domain entities;
- whether named registers are useful or unnecessary for a food log.

Do not treat these identity semantics as final until this design review is complete.

## Moving foods

```text
>              move current row/selection down one position
<              move current row/selection up one position
[count]>       move down N positions
[count]<       move up N positions
```

A VISUAL selection moves as a unit.

Food ordering and timestamps must not contradict each other. Reordering therefore needs an explicit timestamp policy rather than merely changing array order.

## Adding food

```text
o / a          picker, insert below current row at the same time
O              picker, insert above current row at the same time
A              picker, use current wall-clock time on selected day
13a / 13A      add at 13:00
730a           add at 07:30
1330a          add at 13:30
```

With an explicit numeric time prefix, `a` and `A` converge because the explicit time takes precedence.

Valid time literals:

```text
7       07:00
13      13:00
730     07:30
1330    13:30
```

Invalid times should not execute and should produce concise statusline feedback.

## Food picker navigation

The search input retains focus while result selection changes.

```text
Tab            next result
Shift+Tab      previous result
Alt+j          next result
Alt+k          previous result
↑ / ↓          alternate result navigation
Enter          select result
Esc            cancel and restore terminal focus
```

`Ctrl+n` and `Ctrl+p` are intentionally avoided because of browser conflicts.

## Focus management

The browser's persistent native focus styling should not leak into the terminal interaction model.

Requirements:

- preserve real keyboard accessibility;
- use a custom `:focus-visible` treatment rather than removing focus globally;
- restore focus to the terminal when INSERT/EDIT modes close;
- picker `Tab` handling must not move DOM focus away from the search input;
- click and keyboard entry into an editor must use the same implementation path.

## Quantity editing

```text
e              edit current quantity inline
click qty      enter same editor
Tab            cycle to next valid unit
Shift+Tab      cycle to previous valid unit
Enter          confirm quantity + unit
Esc            cancel draft
```

The quantity remains the active editable value while `Tab` changes unit state. `Tab` does not move focus to a separate unit field or open a dropdown.

Only units with a valid conversion for the food should participate in the cycle, for example:

```text
Whey:   g → scoop → serving
Oil:    g → ml → tbsp → serving
Eggs:   unit → g → serving
```

Macros and calories recalculate from the chosen amount/unit when the edit is confirmed.

## Time display and editing

Each food row should expose its exact timestamp rather than only displaying the derived hour-group header.

```text
13:00 · 3 items

> 13:21  Chicken
  13:22  Rice
  13:23  Olive oil
```

Time editing uses lowercase `t`:

```text
t              edit current timestamp
VISUAL + t     edit all selected timestamps
click time     enter same editor
Enter          confirm
Esc            cancel
```

The editor accepts the same compact time grammar used by add commands.

Absolute assignment:

```text
t 7            07:00
t 13           13:00
t 730          07:30
t 1430         14:30
```

When an absolute value is applied to multiple selected foods, every selected food receives exactly that time. Offsets are not preserved. This supports normalizing foods that were logged at slightly different moments.

Relative transformation:

```text
t +30          add 30 minutes to every selected timestamp
t -15          subtract 15 minutes
t +1h          add one hour
t -2h          subtract two hours
```

Relative expressions preserve differences between timestamps because the same delta is applied independently to each item.

## Timestamp normalization operator

`=` is the normalization operator.

```text
=iw / =ib      normalize current hour block
=aw / =ab      aliases for now
VISUAL + =     normalize arbitrary selection
```

Normalization sets every target timestamp to the exact timestamp of the food currently under the cursor.

Example:

```text
13:18  Whey
13:24  Bread   ← cursor
13:31  Avocado

=iw

13:24  Whey
13:24  Bread
13:24  Avocado
```

This is distinct from `t 1430` (explicit absolute assignment) and `t +30` (relative transformation).

## Persistence and sync

Do not implement manual `:w` yet.

Desired model:

```text
NORMAL              locally committed state
INSERT / EDIT        temporary operation draft
Enter                commit operation locally
Esc                  discard operation draft
```

After local commit, synchronization should happen automatically and quickly through the local-first sync architecture.

The right side of the statusline should expose remote sync state, for example:

```text
synced
syncing…
3 pending
offline · 3 pending
sync error
```

The statusline therefore answers "has this reached the remote side?", not "did the user remember to save?".

A manual `:w`/flush command should only be reconsidered if real sync behavior creates a need for it.

## Statusline

The statusline has three jobs:

1. expose the current mode;
2. expose pending command grammar / operation feedback;
3. expose sync state on the right.

Examples:

```text
NORMAL   d_                                      synced
NORMAL   di_                                     synced
EDIT QTY [30_] g                                synced
EDIT TIME 1430_                                 synced
NORMAL   3 timestamps → 13:24                 syncing…
NORMAL   3 timestamps → 13:24                    synced
```

## Header and day navigation

Day data changes immediately when navigating. The decorative date typing animation may be slower, but it must be cancelable and last-write-wins so rapid `h/l` input never queues stale animations.

The minimap exists for temporal orientation, not as primary navigation.

## Help / executable specification

`?` opens the canonical shortcut reference embedded in the mockup.

The shortcut data uses three implementation states:

```text
active
partial
planned
```

The structured shortcut specification and this document together are intended to become the interaction reference when implementing the production Balance UI.

## Open design review before merge

Register semantics are the next topic to resolve before this branch is merged to `main`.
