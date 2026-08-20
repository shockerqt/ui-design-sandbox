# Balance Terminal Interaction Spec

Status: implemented UX specification for `balance-vim-log` on `feat/balance-interaction-spec-v2`.

Balance is a modal, keyboard-first food log inspired by Vim rather than a literal text editor. Vim conventions are reused when they improve speed and composition; food-log semantics win when they do not.

## Core model

- The selected day is the main buffer.
- Food rows are the real cursor targets.
- Hour headers are derived presentation, not stored entities.
- NORMAL represents locally committed state.
- INSERT / EDIT modes are temporary drafts.
- `Enter` confirms a draft locally; `Esc` cancels it.
- Remote sync is automatic and reflected in the right side of the statusline. `:w` is intentionally not implemented.

## Visual language

- Dark full-page terminal/editor surface with blue primary accent.
- Ambient blue mesh reacts directionally to keyboard navigation and accumulates energy under repeated input.
- NORMAL shows only the `>` cursor. The current row does not receive a selection surface.
- VISUAL uses an explicit blue selection surface so cursor position and selection cannot be confused.
- Hour headers use a subtle ghost background without a left border.
- Each food row displays its exact timestamp in addition to the derived hour-group header.
- Month minimap stays a fixed compact 7×6 grid; selected day is filled, today is outlined, outside-month days remain faint.

## Grammar

The interaction model is compositional:

```text
[count] motion
operator [count] motion
[count] operator [count] motion
operator [i|a] text-object
visual + operator
```

Counts before and after an operator multiply, matching Vim-style composition:

```text
5x        delete 5 foods

d2j       delete current through two j motions
           affects 3 foods because the range is inclusive

2d3j      equivalent range to d6j
```

Numeric prefixes are contextual rather than universal:

```text
5j        count
5G        1-based item index
3p        paste count
13a       13:00 time literal
1330a     13:30 time literal
```

## Navigation

```text
j / k          next / previous food
[count]j/k     move N foods
h / l          previous / next day
H / L          previous / next week
[count]h/l     move N days
[count]H/L     move N weeks
gg             first food
G              last food
[n]G           food N, 1-based
gt             today
[ / ]          previous / next hour block
[count][/]     move N hour blocks
```

`[` and `]` land on the first food of the destination hour block and are also valid operator motions.

## VISUAL and text objects

Selection is contiguous.

```text
Space / v      enter or leave VISUAL
V              select current hour block
viw / vib      select current hour block
vaw / vab      aliases for now
Esc            cancel / NORMAL
```

`w` and `b` are aliases for the Balance hour-block object. `inner` and `around` are intentionally equivalent while headers remain derived presentation.

## Register model

There is one unnamed register containing domain snapshots, not live row/entity references. Register entries do not contain row IDs.

Every paste creates new row IDs. This keeps repeated paste deterministic and avoids identity-dependent cut behavior.

Operations that write the register:

```text
yank      yy, y{motion}, yiw, VISUAL+y
delete    x, dd, D, d{motion}, diw, VISUAL+d
visual p  displaced selection becomes the new register
```

The register does not need a `copy` versus `cut` behavioral mode. Source metadata may exist only for feedback.

### Normal paste

```text
p              insert register after cursor
P              insert register before cursor
[count]p/P     paste N copies
```

NORMAL paste reads but does not consume or modify the register.

### Visual paste

```text
VISUAL + p/P
```

replaces the selected range with the current register, and the displaced selection becomes the new register. `p` and `P` intentionally have the same meaning when a range already exists.

## Delete / yank operators

NORMAL `d` and `y` are pending operators, not immediate actions. Pending grammar is visible in the statusline, for example `d_`, `di_`, `d2_`.

```text
x              quick-delete current food
[count]x       quick-delete N foods

dd             delete current food
D              delete current food through end of current hour block

diw/dib        delete current hour block
daw/dab        aliases for now

yy             yank current food
yiw/yib        yank current hour block
yaw/yab        aliases for now

dj / d2j       delete through motion, inclusive
yj / y2j       yank through motion, inclusive
dG / dgg       delete to end / start of day
d] / d[        delete through block motion

VISUAL+d       delete selection
VISUAL+y       yank selection
```

All destructive operations write the removed food snapshots to the unnamed register, including `x`.

## Moving foods

```text
> / <          move current food or VISUAL selection down / up one position
[count]>/<     move N positions
```

A VISUAL selection moves as one contiguous unit and remains selected after the move.

This mockup treats manual move as explicit row order. Time-editing commands separately re-sort by timestamp. The production model should decide whether row order exists independently or whether timestamps are the sole canonical ordering source.

## Adding food

```text
o / a          picker below current food, same timestamp
O              picker above current food, same timestamp
A              picker at current wall-clock time on selected day
7a / 7A        07:00
13a / 13A      13:00
730a           07:30
1330a          13:30
```

When a numeric prefix exists for `a/A`, it is a time literal rather than a count and insertion is chronological.

Invalid times do not execute and produce concise status feedback.

## Replace food

```text
r
```

opens the food picker and replaces the current food while preserving its timestamp and quantity/unit when the new food supports that unit. The row identity is retained for replacement itself.

## Food picker

The search input retains DOM focus while result selection changes.

```text
Tab / Shift+Tab    next / previous result
Alt+j / Alt+k      next / previous result
↑ / ↓              next / previous result
Enter              choose
Esc                cancel and restore terminal focus
```

## Quantity editing

```text
e / click qty      edit current quantity inline
Tab                cycle next valid unit
Shift+Tab          cycle previous valid unit
Enter              confirm quantity + unit
Esc                cancel
```

`Tab` changes unit state without moving focus. The numeric value is converted to preserve the same physical amount while cycling units.

Only compatible units participate, for example:

```text
Whey       g → scoop → serving
Olive oil  g → ml → tbsp → serving
Eggs       u → g → serving
```

Calories and macros recalculate when the draft is confirmed.

## Time editing

Lowercase `t` is time; `gt` owns today.

```text
t / click time    edit current timestamp
VISUAL+t          edit all selected timestamps
Enter             confirm
Esc               cancel
```

Compact absolute grammar:

```text
7       07:00
13      13:00
730     07:30
1430    14:30
```

Absolute assignment gives every selected food exactly the supplied time:

```text
VISUAL
t 1430
→ every selected timestamp becomes 14:30
```

Relative expressions apply the same delta independently and therefore preserve offsets:

```text
t +30
t -15
t +1h
t -2h
```

Time mutations re-sort rows chronologically after commit.

## Time normalization

`=` is the normalization operator.

```text
=iw / =ib / =aw / =ab
VISUAL + =
```

Every target gets the exact timestamp of the food under the cursor.

```text
13:18  Whey
13:24  Bread   ← cursor
13:31  Avocado

=iw

13:24  Whey
13:24  Bread
13:24  Avocado
```

## Search

```text
/              search foods in current day
n              next match
N              previous match
Esc            cancel search entry
```

Search wraps around the current day's food rows.

## History and repeat

```text
u / [count]u       undo one / N mutations
U / [count]U       redo one / N mutations
Ctrl+r             redo alias in NORMAL/VISUAL
Ctrl+Shift+r       remains available for browser hard reload
.                  repeat last semantic edit when compatible
```

`U` is the official Balance redo shortcut; `Ctrl+r` exists as a Vim muscle-memory alias and is intercepted deliberately.

`.` stores/replays semantic edits rather than literal keystrokes. Current repeatable operations include movement, time assignment/shift, normalization, compatible quantity changes, and food replacement.

## Focus management

- Terminal owns a programmatic focus target with no persistent browser outline.
- Inline inputs are used only while editing.
- `Enter`/`Esc` from picker or editors restore focus to the terminal.
- NORMAL cursor is rendered by Balance itself rather than native focus styling.
- VISUAL selection has a separate explicit surface.

## Statusline and sync

The statusline has three responsibilities:

1. current mode;
2. pending grammar / operation feedback;
3. sync state on the right.

Examples:

```text
NORMAL    d_                                  synced
NORMAL    di_                                 synced
EDIT QTY  [30_] scoop                        synced
EDIT TIME 1430_                              synced
NORMAL    3 timestamps → 13:24             syncing…
NORMAL    3 timestamps → 13:24                synced
```

The mockup currently simulates a fast `syncing… → synced` transition after local mutations. Production should replace this with real local-first sync state and may later add `offline · N pending` / `sync error` states.

Do not add `:w` unless real sync behavior demonstrates a need for manual flush.

## Help / executable specification

`?` opens the canonical shortcut reference embedded in the mockup. `src/mockups/balanceVimShortcutSpec.ts` is the structured source of shortcut truth and carries `active / partial / planned` implementation states.

This document records rationale and semantics; the structured shortcut spec drives the in-app cheatsheet.
