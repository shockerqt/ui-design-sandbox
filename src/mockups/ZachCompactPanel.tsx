import { useMemo, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Popover } from '@base-ui/react/popover';
import { Switch } from '@base-ui/react/switch';
import { Tabs } from '@base-ui/react/tabs';
import { Tooltip } from '@base-ui/react/tooltip';
import { ZachCat, type Mood } from './ZachControlPanel';
import './ZachCompactPanel.css';

type TaskStatus = 'active' | 'queued' | 'blocked' | 'merge' | 'done';
type StageState = 'done' | 'running' | 'failed' | 'pending';

interface CompactTask {
  id: string;
  repo: string;
  weight: 'XS' | 'S' | 'M' | 'L';
  status: TaskStatus;
  title: string;
  stageLabel: string;
  stages: [StageState, StageState, StageState, StageState];
  model: string;
  age: string;
  branch: string;
}

interface PendingDecision {
  id: string;
  seq: number;
  kind: 'plan_approval' | 'merge_approval' | 'blocked_triage';
  taskId: string;
  weight: 'S' | 'M' | 'L';
  question: string;
}

interface MergeItem {
  taskId: string;
  repo: string;
  phase: string;
  sha: string;
}

interface FeedEvent {
  seq: number;
  time: string;
  type: string;
  tone: 'ok' | 'info' | 'warn' | 'err';
  taskId: string;
  detail: string;
}

const INITIAL_TASKS: CompactTask[] = [
  { id: 'ZACH-058', repo: 'zach', weight: 'S', status: 'active', title: 'Sort Zach web pending decisions and tasks with newest first', stageLabel: 'impl', stages: ['done', 'done', 'running', 'pending'], model: 'sol-med', age: '1m', branch: 'task/ZACH-058-sort-zach-web' },
  { id: 'BAL-053', repo: 'balance', weight: 'M', status: 'active', title: 'Project meal days lazily instead of converting whole history', stageLabel: 'plan', stages: ['running', 'pending', 'pending', 'pending'], model: 'sol-hi', age: '3m', branch: 'task/BAL-053-lazy-meal-days' },
  { id: 'UDS-028', repo: 'ui-design-sandbox', weight: 'M', status: 'active', title: 'Create compact high-density Zach Control Panel mockup', stageLabel: 'impl', stages: ['done', 'done', 'running', 'pending'], model: 'argon-hi', age: '4m', branch: 'task/UDS-028-zach-compact' },
  { id: 'GOV-069', repo: 'governance', weight: 'L', status: 'active', title: 'Verify Codex subagent bootstrap from the workspace root', stageLabel: 'pr-review', stages: ['done', 'done', 'done', 'running'], model: 'hydro-hi', age: '9m', branch: 'task/GOV-069-codex-bootstrap' },
  { id: 'BAL-055', repo: 'balance', weight: 'L', status: 'merge', title: 'Store meal logs in per-month shards with safe migration', stageLabel: 'ci-wait', stages: ['done', 'done', 'done', 'done'], model: 'hydro-hi', age: '14m', branch: 'task/BAL-055-month-shards' },
  { id: 'ZACH-065', repo: 'zach', weight: 'S', status: 'merge', title: 'Allow Expand target_files decision and test-file tolerance', stageLabel: 'rebasing', stages: ['done', 'done', 'done', 'done'], model: 'sol-med', age: '18m', branch: 'task/ZACH-065-expand-target' },
  { id: 'ZACH-066', repo: 'zach', weight: 'S', status: 'queued', title: 'Capture failing command stdout/stderr in run_checks', stageLabel: 'ready', stages: ['pending', 'pending', 'pending', 'pending'], model: '—', age: '22m', branch: 'task/ZACH-066-run-checks' },
  { id: 'ZACH-067', repo: 'zach', weight: 'S', status: 'queued', title: 'Enable Gemini fallback model and retry option on pr-review', stageLabel: 'ready', stages: ['pending', 'pending', 'pending', 'pending'], model: '—', age: '25m', branch: 'task/ZACH-067-fallback-model' },
  { id: 'GOV-077', repo: 'governance', weight: 'S', status: 'queued', title: 'Align Claude governance subagent tool lists with exposed tools', stageLabel: 'ready', stages: ['pending', 'pending', 'pending', 'pending'], model: '—', age: '31m', branch: 'task/GOV-077-claude-tools' },
  { id: 'BAL-062', repo: 'balance', weight: 'M', status: 'queued', title: 'Redesign the web dashboard diary with compact daily summary', stageLabel: 'ready', stages: ['pending', 'pending', 'pending', 'pending'], model: '—', age: '42m', branch: 'task/BAL-062-web-diary' },
  { id: 'INF-024', repo: 'infrastructure', weight: 'L', status: 'blocked', title: 'Mock /proc in test-zach-web.py and streamline Zach release', stageLabel: 'pr-review', stages: ['done', 'done', 'done', 'failed'], model: 'hydro-hi', age: '51m', branch: 'task/INF-024-test-zach-web' },
  { id: 'ZACH-075', repo: 'zach', weight: 'M', status: 'queued', title: 'Add ClaudeCode ModelFamily driver and Anthropic proxy allowlist', stageLabel: 'ready', stages: ['pending', 'pending', 'pending', 'pending'], model: '—', age: '1h', branch: 'task/ZACH-075-claude-driver' },
  { id: 'BAL-079', repo: 'balance', weight: 'M', status: 'blocked', title: 'Preserve concurrent MCP food-log corrections safely', stageLabel: 'impl', stages: ['done', 'done', 'failed', 'pending'], model: 'sol-hi', age: '1h', branch: 'task/BAL-079-mcp-concurrent' },
  { id: 'ZACH-057', repo: 'zach', weight: 'M', status: 'done', title: 'Switch default router models to hydrogen and add router.json', stageLabel: 'merged', stages: ['done', 'done', 'done', 'done'], model: 'hydro-hi', age: '2h', branch: 'task/ZACH-057-router-json' },
];

const INITIAL_DECISIONS: PendingDecision[] = [
  { id: 'dec-904', seq: 904, kind: 'merge_approval', taskId: 'BAL-055', weight: 'L', question: 'CI green on SHA 8a4f2c1. Approve merge to main and run shard dry-run?' },
  { id: 'dec-903', seq: 903, kind: 'plan_approval', taskId: 'BAL-053', weight: 'M', question: 'Plan reviewed (APPROVED). Proceed to impl on lazy day projection?' },
  { id: 'dec-901', seq: 901, kind: 'blocked_triage', taskId: 'INF-024', weight: 'L', question: 'pr-review failed on /proc mock assertion. Retry with fallback model?' },
];

const MERGE_QUEUE: MergeItem[] = [
  { taskId: 'BAL-055', repo: 'balance', phase: 'awaiting_human_merge', sha: '8a4f2c1' },
  { taskId: 'ZACH-065', repo: 'zach', phase: 'rebasing_on_main', sha: '3d91e0b' },
];

const INITIAL_EVENTS: FeedEvent[] = [
  { seq: 2590, time: '23:25:55', type: 'STAGE_STARTED', tone: 'info', taskId: 'UDS-028', detail: 'impl started (session/antigravity)' },
  { seq: 2589, time: '23:25:12', type: 'STAGE_COMPLETED', tone: 'ok', taskId: 'UDS-028', detail: 'plan-review APPROVED' },
  { seq: 2588, time: '23:24:40', type: 'DECISION_REQUIRED', tone: 'warn', taskId: 'BAL-055', detail: 'merge_approval #904 queued' },
  { seq: 2587, time: '23:24:03', type: 'STAGE_STARTED', tone: 'info', taskId: 'ZACH-058', detail: 'impl started (gpt-6.2-sol medium)' },
  { seq: 2586, time: '23:23:18', type: 'DECISION_REQUIRED', tone: 'warn', taskId: 'BAL-053', detail: 'plan_approval #903 queued' },
  { seq: 2585, time: '23:22:49', type: 'STAGE_COMPLETED', tone: 'ok', taskId: 'BAL-053', detail: 'plan-review APPROVED (hydro-med)' },
  { seq: 2584, time: '23:21:30', type: 'CI_PASSED', tone: 'ok', taskId: 'BAL-055', detail: 'exact-SHA 8a4f2c1 green (42s)' },
  { seq: 2583, time: '23:20:55', type: 'MERGE_CHECKPOINT', tone: 'info', taskId: 'ZACH-065', detail: 'rebasing on origin/main' },
  { seq: 2582, time: '23:19:41', type: 'STAGE_FAILED', tone: 'err', taskId: 'INF-024', detail: 'pr-review: /proc/stat mock mismatch' },
  { seq: 2581, time: '23:19:05', type: 'DECISION_REQUIRED', tone: 'warn', taskId: 'INF-024', detail: 'blocked_triage #901 queued' },
  { seq: 2580, time: '23:18:22', type: 'STAGE_STARTED', tone: 'info', taskId: 'GOV-069', detail: 'pr-review started (hydro-hi)' },
  { seq: 2579, time: '23:17:44', type: 'STAGE_COMPLETED', tone: 'ok', taskId: 'GOV-069', detail: 'impl committed 7c12a09' },
  { seq: 2578, time: '23:16:10', type: 'TASK_READY', tone: 'info', taskId: 'ZACH-058', detail: 'Context Pack validated (weight=S)' },
  { seq: 2577, time: '23:15:32', type: 'TASK_READY', tone: 'info', taskId: 'UDS-028', detail: 'Context Pack validated (weight=M)' },
  { seq: 2576, time: '23:14:15', type: 'STAGE_FAILED', tone: 'err', taskId: 'BAL-079', detail: 'impl: cargo/vitest timeout (120s)' },
  { seq: 2575, time: '23:12:50', type: 'HEARTBEAT', tone: 'ok', taskId: 'DAEMON', detail: 'sse=connected workers=3 queue=6' },
  { seq: 2574, time: '23:10:02', type: 'MERGE_COMPLETED', tone: 'ok', taskId: 'ZACH-057', detail: 'merged PR #125 -> main' },
  { seq: 2573, time: '23:08:19', type: 'CI_PASSED', tone: 'ok', taskId: 'ZACH-057', detail: 'cargo test + clippy green' },
];

export function ZachCompactPanel() {
  const [tasks] = useState<CompactTask[]>(INITIAL_TASKS);
  const [decisions, setDecisions] = useState<PendingDecision[]>(INITIAL_DECISIONS);
  const [events, setEvents] = useState<FeedEvent[]>(INITIAL_EVENTS);
  const [ultraDense, setUltraDense] = useState(false);
  const [paused, setPaused] = useState(false);
  const [query, setQuery] = useState('');
  const [repoFilter, setRepoFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [eventFilter, setEventFilter] = useState<'ALL' | 'STAGE' | 'DECISION' | 'ERR'>('ALL');
  const [selectedTask, setSelectedTask] = useState<CompactTask | null>(null);
  const [noteDraft, setNoteDraft] = useState('');

  const counts = useMemo(() => ({
    all: tasks.length,
    active: tasks.filter((t) => t.status === 'active').length,
    queued: tasks.filter((t) => t.status === 'queued').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
    merge: tasks.filter((t) => t.status === 'merge').length,
  }), [tasks]);

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tasks.filter((t) => {
      if (activeTab !== 'all' && t.status !== activeTab) return false;
      if (repoFilter !== 'all' && t.repo !== repoFilter) return false;
      if (q && !`${t.id} ${t.repo} ${t.title} ${t.model}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [tasks, activeTab, repoFilter, query]);

  const filteredEvents = useMemo(() => {
    const q = query.trim().toLowerCase();
    return events.filter((e) => {
      if (eventFilter === 'STAGE' && !e.type.startsWith('STAGE_')) return false;
      if (eventFilter === 'DECISION' && !e.type.startsWith('DECISION_')) return false;
      if (eventFilter === 'ERR' && e.tone !== 'err') return false;
      if (q && !`${e.taskId} ${e.type} ${e.detail}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [events, eventFilter, query]);

  const mood: Mood = paused
    ? 'paused'
    : decisions.length > 0
      ? 'decision'
      : counts.blocked > 0
        ? 'error'
        : counts.active > 0
          ? 'hunting'
          : 'idle';

  function resolveDecision(d: PendingDecision, choice: 'APPROVE' | 'REJECT') {
    setDecisions((prev) => prev.filter((item) => item.id !== d.id));
    const now = new Date().toTimeString().slice(0, 8);
    setEvents((prev) => [
      {
        seq: prev[0].seq + 1,
        time: now,
        type: 'DECISION_RESOLVED',
        tone: choice === 'APPROVE' ? 'ok' : 'err',
        taskId: d.taskId,
        detail: `${choice} #${d.seq}${noteDraft.trim() ? ` (${noteDraft.trim()})` : ''}`,
      },
      ...prev,
    ]);
    setNoteDraft('');
  }

  return (
    <Tooltip.Provider delay={250}>
      <div className="zcp2-root" data-density={ultraDense ? 'ultra' : 'compact'}>
        {/* Top Command & Health Bar */}
        <header className="zcp2-topbar">
          <div className="zcp2-brand">
            <ZachCat mood={mood} size={24} />
            <span className="zcp2-title">Zach Console</span>
            <span className={`zcp2-pill ${paused ? '' : 'is-live'}`}>
              <span className="zcp2-dot" />
              {paused ? 'PAUSED' : 'SSE LIVE · 12s'}
            </span>
          </div>

          <div className="zcp2-kpis">
            {([
              ['active', 'Active', counts.active],
              ['queued', 'Queued', counts.queued],
              ['blocked', 'Blocked', counts.blocked],
              ['merge', 'Merge', counts.merge],
            ] as const).map(([key, label, num]) => (
              <button
                key={key}
                type="button"
                className="zcp2-kpi-btn"
                data-selected={activeTab === key}
                onClick={() => setActiveTab(activeTab === key ? 'all' : key)}
              >
                <span>{label}</span>
                <span className="zcp2-kpi-num">{num}</span>
              </button>
            ))}
          </div>

          <div className="zcp2-controls">
            <input
              type="search"
              className="zcp2-search zcp2-mono"
              placeholder="Filter task, repo, event..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="zcp2-select"
              aria-label="Filter repository"
              value={repoFilter}
              onChange={(e) => setRepoFilter(e.target.value)}
            >
              <option value="all">All repos</option>
              <option value="zach">zach</option>
              <option value="balance">balance</option>
              <option value="governance">governance</option>
              <option value="ui-design-sandbox">ui-design-sandbox</option>
              <option value="infrastructure">infrastructure</option>
            </select>
            <label className="zcp2-density">
              <span>Ultra-dense</span>
              <Switch.Root
                className="zcp2-switch"
                checked={ultraDense}
                onCheckedChange={setUltraDense}
              >
                <Switch.Thumb className="zcp2-switch-thumb" />
              </Switch.Root>
            </label>
            <button
              type="button"
              className="zcp2-btn"
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
          </div>
        </header>

        {/* Main 2-Pane Grid */}
        <div className="zcp2-grid">
          {/* Left Pane: Pending Decisions Strip + Dense Task Table */}
          <section className="zcp2-col" aria-label="Decisions and Tasks">
            <div className="zcp2-sec-head">
              <span className="zcp2-sec-title">
                Pending Decisions (Newest First)
                <span className="zcp2-count">{decisions.length}</span>
              </span>
              <span className="zcp2-mono" style={{ color: 'var(--z2-faint)', fontSize: 10 }}>
                inline actions · zero scroll
              </span>
            </div>

            {decisions.length > 0 ? (
              <div className="zcp2-decisions">
                {decisions.map((d) => (
                  <div key={d.id} className="zcp2-dec-row">
                    <span className="zcp2-dec-kind zcp2-mono">{d.kind}</span>
                    <span className="zcp2-mono" style={{ fontWeight: 700, fontSize: 11 }}>
                      {d.taskId}·{d.weight}
                    </span>
                    <span className="zcp2-dec-q" title={d.question}>
                      {d.question}
                    </span>
                    <div className="zcp2-dec-actions">
                      <button
                        type="button"
                        className="zcp2-btn zcp2-btn-ok"
                        onClick={() => resolveDecision(d, 'APPROVE')}
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        className="zcp2-btn zcp2-btn-err"
                        onClick={() => resolveDecision(d, 'REJECT')}
                      >
                        Reject
                      </button>
                      <Popover.Root>
                        <Popover.Trigger className="zcp2-btn">Note</Popover.Trigger>
                        <Popover.Portal>
                          <Popover.Positioner sideOffset={6} align="end">
                            <Popover.Popup className="zcp2-popover">
                              <div style={{ fontWeight: 600, fontSize: 11.5 }}>
                                Decision note · {d.taskId}
                              </div>
                              <input
                                type="text"
                                className="zcp2-popover-input"
                                placeholder="Optional rationale..."
                                value={noteDraft}
                                onChange={(e) => setNoteDraft(e.target.value)}
                              />
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                                <button
                                  type="button"
                                  className="zcp2-btn zcp2-btn-ok"
                                  onClick={() => resolveDecision(d, 'APPROVE')}
                                >
                                  Approve w/ note
                                </button>
                              </div>
                            </Popover.Popup>
                          </Popover.Positioner>
                        </Popover.Portal>
                      </Popover.Root>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '6px 10px', color: 'var(--z2-faint)', borderBottom: '1px solid var(--z2-border)', fontSize: 11 }}>
                No pending decisions.
              </div>
            )}

            <Tabs.Root
              className="zcp2-tabs-root"
              value={activeTab}
              onValueChange={(val) => setActiveTab(String(val))}
            >
              <Tabs.List className="zcp2-tabs-list">
                <Tabs.Tab className="zcp2-tab" value="all">All ({counts.all})</Tabs.Tab>
                <Tabs.Tab className="zcp2-tab" value="active">Active ({counts.active})</Tabs.Tab>
                <Tabs.Tab className="zcp2-tab" value="queued">Queued ({counts.queued})</Tabs.Tab>
                <Tabs.Tab className="zcp2-tab" value="blocked">Blocked ({counts.blocked})</Tabs.Tab>
                <Tabs.Tab className="zcp2-tab" value="merge">Merge ({counts.merge})</Tabs.Tab>
              </Tabs.List>

              <Tabs.Panel className="zcp2-tab-panel" value={activeTab}>
                <div className="zcp2-table-head">
                  <span>Task</span>
                  <span>Repo</span>
                  <span>W</span>
                  <span>Title</span>
                  <span>Stages</span>
                  <span style={{ textAlign: 'right' }}>Model</span>
                  <span style={{ textAlign: 'right' }}>Age</span>
                </div>
                {filteredTasks.map((t) => (
                  <div
                    key={t.id}
                    className="zcp2-task-row"
                    role="button"
                    tabIndex={0}
                    onClick={() => setSelectedTask(t)}
                    onKeyDown={(e) => e.key === 'Enter' && setSelectedTask(t)}
                  >
                    <span className="zcp2-task-id zcp2-mono">
                      <span className={`zcp2-status-dot is-${t.status}`} />
                      {t.id}
                    </span>
                    <span className="zcp2-repo zcp2-mono">{t.repo}</span>
                    <span className="zcp2-weight zcp2-mono">{t.weight}</span>
                    <Tooltip.Root>
                      <Tooltip.Trigger className="zcp2-task-title" style={{ textAlign: 'left', background: 'none', border: 'none', padding: 0, cursor: 'pointer', font: 'inherit' }}>
                        {t.title}
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Positioner sideOffset={6}>
                          <Tooltip.Popup className="zcp2-tooltip">
                            {t.title} · stage: {t.stageLabel}
                          </Tooltip.Popup>
                        </Tooltip.Positioner>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                    <span className="zcp2-pipeline" aria-label={`Stage ${t.stageLabel}`}>
                      {t.stages.map((st, idx) => (
                        <span key={idx} className={`zcp2-pip is-${st}`} />
                      ))}
                    </span>
                    <span className="zcp2-model zcp2-mono">{t.model}</span>
                    <span className="zcp2-age zcp2-mono">{t.age}</span>
                  </div>
                ))}
              </Tabs.Panel>
            </Tabs.Root>
          </section>

          {/* Right Pane: Merge Queue Strip + Dense Live Event Stream */}
          <aside className="zcp2-col" aria-label="Merge Queue and Live Events">
            <div className="zcp2-sec-head">
              <span className="zcp2-sec-title">
                Merge Queue Checkpoints
                <span className="zcp2-count">{MERGE_QUEUE.length}</span>
              </span>
            </div>
            <div className="zcp2-merge-list">
              {MERGE_QUEUE.map((m) => (
                <div key={m.taskId} className="zcp2-merge-row zcp2-mono">
                  <span style={{ fontWeight: 700 }}>{m.taskId}</span>
                  <span style={{ color: 'var(--z2-muted)' }}>{m.repo}</span>
                  <span style={{ color: 'var(--z2-purple)' }}>{m.phase}</span>
                  <span style={{ color: 'var(--z2-faint)' }}>{m.sha}</span>
                </div>
              ))}
            </div>

            <div className="zcp2-sec-head">
              <span className="zcp2-sec-title">
                Live Event Stream
                <span className="zcp2-count">{filteredEvents.length}/200</span>
              </span>
              <div className="zcp2-events-filters">
                {(['ALL', 'STAGE', 'DECISION', 'ERR'] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    className="zcp2-chip zcp2-mono"
                    data-selected={eventFilter === f}
                    onClick={() => setEventFilter(f)}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            <ol className="zcp2-events-feed zcp2-mono">
              {filteredEvents.map((ev) => (
                <li key={ev.seq} className="zcp2-ev-row">
                  <span className="zcp2-ev-time">{ev.time}</span>
                  <span className={`zcp2-ev-type is-${ev.tone}`}>{ev.type}</span>
                  <button
                    type="button"
                    className="zcp2-ev-task"
                    onClick={() => setQuery(ev.taskId === 'DAEMON' ? '' : ev.taskId)}
                  >
                    {ev.taskId}
                  </button>
                  <span className="zcp2-ev-detail" title={ev.detail}>
                    {ev.detail}
                  </span>
                </li>
              ))}
            </ol>
          </aside>
        </div>

        {/* Task Detail Dialog */}
        <Dialog.Root open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
          <Dialog.Portal>
            <Dialog.Backdrop className="zcp2-dialog-backdrop" />
            <Dialog.Popup className="zcp2-dialog-popup">
              {selectedTask && (
                <>
                  <div className="zcp2-dialog-head">
                    <div>
                      <div className="zcp2-mono" style={{ color: 'var(--z2-accent)', fontSize: 11 }}>
                        {selectedTask.id} · {selectedTask.repo} · Weight {selectedTask.weight}
                      </div>
                      <Dialog.Title style={{ fontSize: 15, fontWeight: 700, marginTop: 2 }}>
                        {selectedTask.title}
                      </Dialog.Title>
                    </div>
                    <Dialog.Close className="zcp2-btn">Close</Dialog.Close>
                  </div>
                  <Dialog.Description style={{ color: 'var(--z2-muted)', fontSize: 12 }}>
                    Stage actual: <strong style={{ color: 'var(--z2-fg)' }}>{selectedTask.stageLabel}</strong>
                  </Dialog.Description>
                  <div className="zcp2-dialog-meta zcp2-mono">
                    <div>Status: {selectedTask.status}</div>
                    <div>Model: {selectedTask.model}</div>
                    <div>Updated: {selectedTask.age} ago</div>
                    <div>Branch: {selectedTask.branch}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      type="button"
                      className="zcp2-btn"
                      onClick={() => {
                        setQuery(selectedTask.id);
                        setSelectedTask(null);
                      }}
                    >
                      Filter events by {selectedTask.id}
                    </button>
                  </div>
                </>
              )}
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </div>
    </Tooltip.Provider>
  );
}
