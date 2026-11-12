# Zach · Control panel

UDS-018. `/m/zach-control-panel` publishes the panel design drafted on 2026-11-12
that ZACH-030 implements. It is a design reference only: the real panel stays frozen
until the safety work tracked in shockerqt/zach#66 is done.

## Views

- **Escritorio**: header with daemon heartbeat, slots and provider quota; the
  mascot and the pending decision (approve or reject with an optional note; decisions
  never auto-approve); task cards with the stage track (done, failed, in progress,
  pending); queue; per-repo merge lane; recent events.
- **Teléfono**: the decision flow on a 390 × 844 phone, with pause/resume.
- **Estados de la mascota**: the seven moods and the daemon event that triggers each.

Interactions change shared demo state: approving moves INF-020 to impl, rejecting
sends it back to planning, retrying the merge of ZACH-009 moves its lane to
"esperando CI", pausing switches the mascot to its paused state. **Reiniciar demo**
restores the initial state.

## Mascot

| Mood | Trigger | Visual |
| --- | --- | --- |
| idle | Empty queue | Closed eyes, slow tail |
| hunting | `STAGE_STARTED` plan or impl | Wide pupils |
| review | `STAGE_STARTED` *-review | Monocle |
| decision | `DECISION_REQUIRED` | Open eyes, "!" badge |
| merged | `MERGE_COMPLETED` | Happy eyes, purr |
| error | `MERGE_FAILED`, `FAILED` | Narrow eyes, raised fur, fast tail |
| paused | Manual pause | Closed eyes, pause badge |

Motion only runs under `prefers-reduced-motion: no-preference`.

## Tokens

Dark only: ground `#121316`, surface `#1A1C20`, text `#ECEAE4` / `#C9CCD3` /
`#A3A6AD`, accent `#F0C94A` (text on accent `#17150C`), live `#7FB2FF`,
danger `#FFA98C`. Fonts: Space Grotesk, Inter, JetBrains Mono.
