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
danger `#FFA98C`, cache `#62C7BA` (`--z-cache`). Fonts: Space Grotesk, Inter, JetBrains Mono.

# Zach · Live telemetry map

UDS-021. `/m/zach-live-map` explores a live radial telemetry companion to the control panel.

## Visual references

- **Preferred visual style — [`alexeyw/lot-map`](https://github.com/alexeyw/lot-map)**:
  minimalist dark radial hub-and-spokes SVG map, usage-weighted worn spokes, fading
  trail over the last 5 stations visited, rotating active clock hands (static high-contrast
  indicators under `prefers-reduced-motion: reduce`), concurrency badges (`×N`),
  outbound/inbound pulses (`#62C7BA` via `--z-cache` for cache/memory hits), and
  persistent `#FFA98C` red fault dots until cleared or reset.
- **Multi-provider & deep telemetry concepts — [`Deemer15/command-mesh`](https://github.com/Deemer15/command-mesh)**:
  multi-provider bus strip (`Codex`, `AGY / Gemini`, `Zachd`) with clickable
  filtering, task/worker drill-down, station/worker telemetry breakdown, and event
  inspector.

## Scopes, presets & controls

- **Two map scopes**:
  - **Orchestration (`zachd`)**: `Governance`, `Planner`, `Files / Worktree`,
    `Shell / Checks`, `GitHub / CI`, `Reviewers`, `Merge Lane`, `You / Decisions`.
  - **Worker drill-down (`ZACH-009`, `INF-020`, `UDS-021`, `LUMI-007`)**: `Model`,
    `Memory / Cache`, `Files`, `Shell`, `Network`, `Agents`, `Skills`, `Hooks`.
- **5 scenario presets**: `Parallel Impl`, `Review Gate`, `CI Fault`,
  `Human Decision`, and `Idle`.
- **Simulation controls**: `Auto-stream` Base UI `Switch`, `Pause` / `Resume` button,
  `Step Event` button, `Reset` button, Base UI `Dialog` for the human decision gate
  (never auto-approves), Base UI `Accordion` for station/worker breakdown, and Base UI
  `Popover` event inspector.

## Metadata-only telemetry rules

All timeline events and popover inspector records are strictly **metadata-only**:
`seq`, `ts`, `taskId`, `provider`, `stationId`, `durationMs`, `tokensIn`,
`tokensCached`, `tokensOut`, `exitCode`, `shortSha`, and `status`. Raw prompts,
model outputs, file contents/diffs, and secrets are never included or rendered.
