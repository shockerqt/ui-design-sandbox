import { useEffect, useMemo, useState, type KeyboardEvent, type ReactNode } from 'react';
import { Accordion } from '@base-ui/react/accordion';
import { Dialog } from '@base-ui/react/dialog';
import { Popover } from '@base-ui/react/popover';
import { Switch } from '@base-ui/react/switch';
import { Tabs } from '@base-ui/react/tabs';
import { Tooltip } from '@base-ui/react/tooltip';
import { ChevronDown, Pause, Play, RotateCcw, ShieldAlert, StepForward } from 'lucide-react';
import { ZachCat, type Mood } from './ZachControlPanel';
import './ZachLiveMap.css';

type PresetId = 'parallel-impl' | 'review-gate' | 'ci-fault' | 'human-decision' | 'idle';
type MapScope = 'orchestration' | 'worker';
type ProviderId = 'codex' | 'gemini' | 'zachd';
type WorkerId = 'ZACH-009' | 'INF-020' | 'UDS-021' | 'LUMI-007';
type EventDirection = 'outbound' | 'inbound';
type EventStatus = 'ok' | 'active' | 'cached' | 'fault' | 'gate';

interface StationDef {
  id: string;
  label: string;
  shortLabel: string;
  role: string;
  angleDeg: number;
  primaryProvider: ProviderId;
}

interface StationStats {
  usageCount: number;
  activeCount: number;
  avgDurationMs: number;
  cacheHitPct: number;
  lastSha: string;
  lastExitCode: number;
  unresolvedFault: boolean;
  providers: ProviderId[];
}

interface PulseSpec {
  id: string;
  stationId: string;
  direction: EventDirection;
  isCache: boolean;
  isFault: boolean;
  provider: ProviderId;
}

interface TelemetryEvent {
  seq: number;
  ts: string;
  taskId: WorkerId;
  provider: ProviderId;
  scope: MapScope;
  stationId: string;
  direction: EventDirection;
  durationMs: number;
  tokensIn: number;
  tokensCached: number;
  tokensOut: number;
  exitCode: number;
  shortSha: string;
  status: EventStatus;
}

interface WorkerDef {
  id: WorkerId;
  repo: string;
  weight: 'M' | 'L';
  stage: string;
  provider: ProviderId;
  model: string;
  worktreeSlug: string;
  contextPct: number;
  cachePct: number;
}

interface ProviderBusInfo {
  id: ProviderId;
  name: string;
  model: string;
  statusLabel: string;
  isDanger?: boolean;
  isIdle?: boolean;
  cacheRatioPct: number;
  eventCount: number;
}

interface SimState {
  preset: PresetId;
  scope: MapScope;
  selectedWorkerId: WorkerId;
  selectedStationId: string;
  providerFilter: ProviderId | 'all';
  autoStream: boolean;
  paused: boolean;
  decision: 'pending' | 'approved' | 'rejected';
  decisionNote: string;
  seqCounter: number;
  stepCursor: number;
  orchStats: Record<string, StationStats>;
  workerStats: Record<WorkerId, Record<string, StationStats>>;
  orchTrail: string[];
  workerTrails: Record<WorkerId, string[]>;
  orchPulses: PulseSpec[];
  workerPulses: Record<WorkerId, PulseSpec[]>;
  events: TelemetryEvent[];
}

const CX = 380;
const CY = 320;
const SPOKE_R = 200;
const INNER_ARC_R = 80;

const PRESETS: { id: PresetId; label: string; summary: string }[] = [
  { id: 'parallel-impl', label: 'Parallel Impl', summary: 'Two workers streaming parallel Codex + Gemini tool calls with high cache reuse.' },
  { id: 'review-gate', label: 'Review Gate', summary: 'Monocle review stage inspecting PR diffs, governance checks, and AC mappings.' },
  { id: 'ci-fault', label: 'CI Fault', summary: 'Unresolved CI failure on ZACH-009 marks GitHub / CI and Shell with a persistent fault dot.' },
  { id: 'human-decision', label: 'Human Decision', summary: 'INF-020 (Weight L) paused at human approval gate; decisions never auto-approve.' },
  { id: 'idle', label: 'Idle', summary: 'Empty active queue; daemon sleeping with zero active tool concurrency.' },
];

const WORKERS: WorkerDef[] = [
  { id: 'ZACH-009', repo: 'zach', weight: 'M', stage: 'impl / merge', provider: 'codex', model: 'gpt-6.1-sol', worktreeSlug: 'zach--ZACH-009-http-sse-gateway', contextPct: 68, cachePct: 74 },
  { id: 'INF-020', repo: 'infrastructure', weight: 'L', stage: 'human-gate', provider: 'zachd', model: 'plan-review-gate', worktreeSlug: 'infrastructure--INF-020-zach-proxy', contextPct: 44, cachePct: 62 },
  { id: 'UDS-021', repo: 'ui-design-sandbox', weight: 'M', stage: 'pr-review', provider: 'gemini', model: 'gemini-3.8-flash', worktreeSlug: 'ui-design-sandbox--UDS-021-zach-live-map', contextPct: 57, cachePct: 81 },
  { id: 'LUMI-007', repo: 'lumina', weight: 'M', stage: 'impl', provider: 'gemini', model: 'gemini-3.8-flash', worktreeSlug: 'lumina--LUMI-007-sync-ledger', contextPct: 61, cachePct: 77 },
];

const ORCH_STATIONS: StationDef[] = [
  { id: 'governance', label: 'Governance', shortLabel: 'Governance', role: 'Project v2 board, ownership & AC gates', angleDeg: -90, primaryProvider: 'zachd' },
  { id: 'planner', label: 'Planner', shortLabel: 'Planner', role: 'Plan spec, Context Pack & plan-review', angleDeg: -45, primaryProvider: 'gemini' },
  { id: 'files-worktree', label: 'Files / Worktree', shortLabel: 'Files / WT', role: 'Isolated git worktree reads & diffs', angleDeg: 0, primaryProvider: 'codex' },
  { id: 'shell-checks', label: 'Shell / Checks', shortLabel: 'Shell / Checks', role: 'Typecheck, build, test & lint runners', angleDeg: 45, primaryProvider: 'codex' },
  { id: 'github-ci', label: 'GitHub / CI', shortLabel: 'GitHub / CI', role: 'PR checks, workflow artifacts & SHA gates', angleDeg: 90, primaryProvider: 'zachd' },
  { id: 'reviewers', label: 'Reviewers', shortLabel: 'Reviewers', role: 'Subagent plan-reviewer & pr-reviewer', angleDeg: 135, primaryProvider: 'gemini' },
  { id: 'merge-lane', label: 'Merge Lane', shortLabel: 'Merge Lane', role: 'Per-repo merge serialization queue', angleDeg: 180, primaryProvider: 'zachd' },
  { id: 'you-decisions', label: 'You / Decisions', shortLabel: 'You / Gate', role: 'Mandatory human approval checkpoint', angleDeg: 225, primaryProvider: 'zachd' },
];

const WORKER_STATIONS: StationDef[] = [
  { id: 'model', label: 'Model', shortLabel: 'Model', role: 'Primary LLM turn inference & token budget', angleDeg: -90, primaryProvider: 'codex' },
  { id: 'memory-cache', label: 'Memory / Cache', shortLabel: 'Memory / Cache', role: 'Prompt prefix & context cache hits', angleDeg: -45, primaryProvider: 'gemini' },
  { id: 'files', label: 'Files', shortLabel: 'Files', role: 'Worktree file search, read & patch', angleDeg: 0, primaryProvider: 'codex' },
  { id: 'shell', label: 'Shell', shortLabel: 'Shell', role: 'Scoped command & build execution', angleDeg: 45, primaryProvider: 'codex' },
  { id: 'network', label: 'Network', shortLabel: 'Network', role: 'GitHub API, MCP & registry metadata', angleDeg: 90, primaryProvider: 'zachd' },
  { id: 'agents', label: 'Agents', shortLabel: 'Agents', role: 'Delegated subagent invocations', angleDeg: 135, primaryProvider: 'gemini' },
  { id: 'skills', label: 'Skills', shortLabel: 'Skills', role: 'Loaded governance & domain skill specs', angleDeg: 180, primaryProvider: 'gemini' },
  { id: 'hooks', label: 'Hooks', shortLabel: 'Hooks', role: 'Pre-commit / pre-push branch guards', angleDeg: 225, primaryProvider: 'zachd' },
];

const PROVIDER_META: Record<ProviderId, { name: string; model: string }> = {
  codex: { name: 'Codex', model: 'gpt-6.1-sol' },
  gemini: { name: 'AGY / Gemini', model: 'gemini-3.8-flash' },
  zachd: { name: 'Zachd', model: 'orchestrator-v2' },
};

const STATION_ICON_PATHS: Record<string, ReactNode> = {
  governance: (
    <>
      <path d="M12 3v18M5 8h14M6 8l-2 5h4l-2-5ZM18 8l-2 5h4l-2-5Z" />
      <path d="M8 21h8" />
    </>
  ),
  planner: (
    <>
      <circle cx="12" cy="12" r="8" />
      <path d="m14.8 9.2-1.8 4.6-4.6 1.8 1.8-4.6 4.6-1.8Z" />
    </>
  ),
  'files-worktree': (
    <>
      <circle cx="7" cy="6" r="2.2" />
      <circle cx="7" cy="18" r="2.2" />
      <circle cx="17" cy="10" r="2.2" />
      <path d="M7 8.2v7.6M9.2 17c4 0 7.8-1.8 7.8-4.8" />
    </>
  ),
  'shell-checks': (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
      <path d="m7.5 10 2.5 2-2.5 2M12.5 14h4" />
    </>
  ),
  'github-ci': (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.2 2.4 2.4 4.8-4.8" />
    </>
  ),
  reviewers: (
    <>
      <path d="M3 12s3.5-5.5 9-5.5S21 12 21 12s-3.5 5.5-9 5.5S3 12 3 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  'merge-lane': (
    <>
      <circle cx="7" cy="6" r="2" />
      <circle cx="7" cy="18" r="2" />
      <circle cx="17" cy="15" r="2" />
      <path d="M7 8v8M9 7.5c4.5 0 8 2 8 5.5" />
    </>
  ),
  'you-decisions': (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M6 19.5c0-3 2.7-4.8 6-4.8s6 1.8 6 4.8" />
    </>
  ),
  model: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3M6.2 6.2l2.1 2.1M15.7 15.7l2.1 2.1M17.8 6.2l-2.1 2.1M8.3 15.7l-2.1 2.1" />
    </>
  ),
  'memory-cache': (
    <>
      <ellipse cx="12" cy="6.5" rx="7" ry="2.6" />
      <path d="M5 6.5v5c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-5" />
      <path d="M5 11.5v5c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-5" />
    </>
  ),
  files: (
    <>
      <path d="M7 3.5h6.5L18 8v12.5H7z" />
      <path d="M13.5 3.5V8H18M9.5 12.5h5M9.5 15.8h4" />
    </>
  ),
  shell: (
    <>
      <path d="m6.5 8.5 4 3.5-4 3.5M12 15.5h5.5" />
    </>
  ),
  network: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <ellipse cx="12" cy="12" rx="3.8" ry="8.5" />
      <path d="M4 12h16" />
    </>
  ),
  agents: (
    <>
      <circle cx="8.5" cy="9" r="2.5" />
      <circle cx="16" cy="10" r="2" />
      <path d="M4.5 18c0-2.3 1.8-3.8 4-3.8s4 1.5 4 3.8M13.5 18c.2-1.8 1.5-3 3.2-3 1.4 0 2.6.9 2.8 2.4" />
    </>
  ),
  skills: (
    <>
      <path d="M5.5 5.5h5.5c1 0 1 .7 1 1.5v12c0-.8-.5-1.5-1.5-1.5H5.5z" />
      <path d="M18.5 5.5H13c-1 0-1 .7-1 1.5v12c0-.8.5-1.5 1.5-1.5h5z" />
    </>
  ),
  hooks: (
    <>
      <circle cx="12" cy="6.5" r="2.2" />
      <path d="M12 8.7v7.8a3.5 3.5 0 0 1-7 0v-1.2" />
      <path d="M12 16.5a3.5 3.5 0 0 0 7 0v-1.2" />
    </>
  ),
};

function StationIcon({ id }: { id: string }) {
  return (
    <svg
      aria-hidden="true"
      x={-10}
      y={-10}
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {STATION_ICON_PATHS[id]}
    </svg>
  );
}

function emptyStats(stations: StationDef[]): Record<string, StationStats> {
  const out: Record<string, StationStats> = {};
  for (const st of stations) {
    out[st.id] = {
      usageCount: 1,
      activeCount: 0,
      avgDurationMs: 140,
      cacheHitPct: 48,
      lastSha: '7089a6d',
      lastExitCode: 0,
      unresolvedFault: false,
      providers: [st.primaryProvider],
    };
  }
  return out;
}

function formatClockTime(offsetSec: number): string {
  const base = 22 * 3600 + 8 * 60 + 10 + offsetSec;
  const hh = String(Math.floor(base / 3600) % 24).padStart(2, '0');
  const mm = String(Math.floor((base % 3600) / 60)).padStart(2, '0');
  const ss = String(base % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

function buildPresetState(preset: PresetId, scope: MapScope = 'orchestration', workerId: WorkerId = 'ZACH-009'): SimState {
  const orchStats = emptyStats(ORCH_STATIONS);
  const workerStats: Record<WorkerId, Record<string, StationStats>> = {
    'ZACH-009': emptyStats(WORKER_STATIONS),
    'INF-020': emptyStats(WORKER_STATIONS),
    'UDS-021': emptyStats(WORKER_STATIONS),
    'LUMI-007': emptyStats(WORKER_STATIONS),
  };

  const applyOrch = (id: string, patch: Partial<StationStats>) => {
    orchStats[id] = { ...orchStats[id], ...patch };
  };
  const applyWorker = (w: WorkerId, id: string, patch: Partial<StationStats>) => {
    workerStats[w][id] = { ...workerStats[w][id], ...patch };
  };

  let orchTrail: string[] = ['governance', 'planner', 'files-worktree', 'shell-checks', 'reviewers'];
  let orchPulses: PulseSpec[] = [];
  let events: TelemetryEvent[] = [];

  if (preset === 'parallel-impl') {
    applyOrch('governance', { usageCount: 8, activeCount: 0, avgDurationMs: 92, cacheHitPct: 72, providers: ['zachd'] });
    applyOrch('planner', { usageCount: 14, activeCount: 1, avgDurationMs: 640, cacheHitPct: 81, providers: ['gemini', 'zachd'] });
    applyOrch('files-worktree', { usageCount: 22, activeCount: 2, avgDurationMs: 48, cacheHitPct: 76, providers: ['codex', 'gemini'] });
    applyOrch('shell-checks', { usageCount: 19, activeCount: 2, avgDurationMs: 1420, cacheHitPct: 68, providers: ['codex', 'gemini'] });
    applyOrch('github-ci', { usageCount: 11, activeCount: 1, avgDurationMs: 530, cacheHitPct: 54, providers: ['zachd'] });
    applyOrch('reviewers', { usageCount: 12, activeCount: 1, avgDurationMs: 890, cacheHitPct: 79, providers: ['gemini'] });
    applyOrch('merge-lane', { usageCount: 5, activeCount: 0, avgDurationMs: 180, cacheHitPct: 40, providers: ['zachd'] });
    applyOrch('you-decisions', { usageCount: 3, activeCount: 0, avgDurationMs: 0, cacheHitPct: 0, providers: ['zachd'] });

    for (const w of ['ZACH-009', 'LUMI-007', 'UDS-021', 'INF-020'] as WorkerId[]) {
      applyWorker(w, 'model', { usageCount: 18, activeCount: w === 'INF-020' ? 0 : 1, avgDurationMs: 1120, cacheHitPct: 74, providers: [w === 'ZACH-009' ? 'codex' : 'gemini'] });
      applyWorker(w, 'memory-cache', { usageCount: 21, activeCount: 1, avgDurationMs: 22, cacheHitPct: 86, providers: ['codex', 'gemini'] });
      applyWorker(w, 'files', { usageCount: 16, activeCount: 2, avgDurationMs: 38, cacheHitPct: 70, providers: ['codex', 'gemini'] });
      applyWorker(w, 'shell', { usageCount: 13, activeCount: 1, avgDurationMs: 1350, cacheHitPct: 60, providers: ['codex'] });
      applyWorker(w, 'hooks', { usageCount: 6, activeCount: 0, avgDurationMs: 84, cacheHitPct: 52, providers: ['zachd'] });
    }

    orchTrail = ['governance', 'planner', 'files-worktree', 'shell-checks', 'reviewers'];
    orchPulses = [
      { id: 'p1', stationId: 'files-worktree', direction: 'outbound', isCache: false, isFault: false, provider: 'codex' },
      { id: 'p2', stationId: 'planner', direction: 'inbound', isCache: true, isFault: false, provider: 'gemini' },
      { id: 'p3', stationId: 'shell-checks', direction: 'outbound', isCache: false, isFault: false, provider: 'gemini' },
    ];
    events = [
      { seq: 418, ts: '22:08:14', taskId: 'ZACH-009', provider: 'codex', scope: 'orchestration', stationId: 'files-worktree', direction: 'outbound', durationMs: 42, tokensIn: 18400, tokensCached: 13900, tokensOut: 620, exitCode: 0, shortSha: '7089a6d', status: 'active' },
      { seq: 417, ts: '22:08:11', taskId: 'LUMI-007', provider: 'gemini', scope: 'worker', stationId: 'memory-cache', direction: 'inbound', durationMs: 19, tokensIn: 24200, tokensCached: 20800, tokensOut: 0, exitCode: 0, shortSha: '3b12c9a', status: 'cached' },
      { seq: 416, ts: '22:08:07', taskId: 'LUMI-007', provider: 'gemini', scope: 'orchestration', stationId: 'shell-checks', direction: 'outbound', durationMs: 1410, tokensIn: 9400, tokensCached: 6200, tokensOut: 410, exitCode: 0, shortSha: '3b12c9a', status: 'ok' },
      { seq: 415, ts: '22:08:02', taskId: 'ZACH-009', provider: 'codex', scope: 'worker', stationId: 'shell', direction: 'inbound', durationMs: 1290, tokensIn: 12100, tokensCached: 8700, tokensOut: 380, exitCode: 0, shortSha: '7089a6d', status: 'ok' },
      { seq: 414, ts: '22:07:56', taskId: 'UDS-021', provider: 'gemini', scope: 'orchestration', stationId: 'reviewers', direction: 'inbound', durationMs: 860, tokensIn: 16800, tokensCached: 13100, tokensOut: 540, exitCode: 0, shortSha: '9f44e12', status: 'cached' },
    ];
  } else if (preset === 'review-gate') {
    applyOrch('governance', { usageCount: 12, activeCount: 1, avgDurationMs: 110, cacheHitPct: 70, providers: ['zachd'] });
    applyOrch('planner', { usageCount: 16, activeCount: 0, avgDurationMs: 520, cacheHitPct: 82, providers: ['gemini'] });
    applyOrch('reviewers', { usageCount: 23, activeCount: 2, avgDurationMs: 910, cacheHitPct: 85, providers: ['gemini'] });
    applyOrch('github-ci', { usageCount: 15, activeCount: 1, avgDurationMs: 470, cacheHitPct: 61, providers: ['zachd'] });
    applyOrch('files-worktree', { usageCount: 9, activeCount: 0, avgDurationMs: 45, cacheHitPct: 74, providers: ['gemini'] });

    applyWorker('UDS-021', 'model', { usageCount: 19, activeCount: 1, avgDurationMs: 880, cacheHitPct: 83, providers: ['gemini'] });
    applyWorker('UDS-021', 'memory-cache', { usageCount: 20, activeCount: 1, avgDurationMs: 18, cacheHitPct: 89, providers: ['gemini'] });
    applyWorker('UDS-021', 'agents', { usageCount: 14, activeCount: 2, avgDurationMs: 740, cacheHitPct: 78, providers: ['gemini'] });
    applyWorker('UDS-021', 'skills', { usageCount: 11, activeCount: 0, avgDurationMs: 31, cacheHitPct: 92, providers: ['gemini'] });

    orchTrail = ['planner', 'files-worktree', 'github-ci', 'reviewers', 'governance'];
    orchPulses = [
      { id: 'p1', stationId: 'reviewers', direction: 'outbound', isCache: false, isFault: false, provider: 'gemini' },
      { id: 'p2', stationId: 'reviewers', direction: 'inbound', isCache: true, isFault: false, provider: 'gemini' },
      { id: 'p3', stationId: 'github-ci', direction: 'inbound', isCache: false, isFault: false, provider: 'zachd' },
    ];
    events = [
      { seq: 512, ts: '22:08:14', taskId: 'UDS-021', provider: 'gemini', scope: 'orchestration', stationId: 'reviewers', direction: 'outbound', durationMs: 910, tokensIn: 28400, tokensCached: 24100, tokensOut: 780, exitCode: 0, shortSha: '9f44e12', status: 'active' },
      { seq: 511, ts: '22:08:09', taskId: 'UDS-021', provider: 'gemini', scope: 'worker', stationId: 'memory-cache', direction: 'inbound', durationMs: 16, tokensIn: 28400, tokensCached: 25300, tokensOut: 0, exitCode: 0, shortSha: '9f44e12', status: 'cached' },
      { seq: 510, ts: '22:08:01', taskId: 'UDS-021', provider: 'zachd', scope: 'orchestration', stationId: 'github-ci', direction: 'inbound', durationMs: 470, tokensIn: 4200, tokensCached: 2600, tokensOut: 190, exitCode: 0, shortSha: '9f44e12', status: 'ok' },
    ];
  } else if (preset === 'ci-fault') {
    applyOrch('files-worktree', { usageCount: 14, activeCount: 0, avgDurationMs: 52, cacheHitPct: 71, providers: ['codex'] });
    applyOrch('shell-checks', { usageCount: 18, activeCount: 1, avgDurationMs: 1840, cacheHitPct: 55, lastExitCode: 1, unresolvedFault: true, providers: ['codex'] });
    applyOrch('github-ci', { usageCount: 17, activeCount: 0, avgDurationMs: 620, cacheHitPct: 48, lastExitCode: 1, unresolvedFault: true, providers: ['zachd'] });
    applyOrch('merge-lane', { usageCount: 9, activeCount: 0, avgDurationMs: 210, cacheHitPct: 42, lastExitCode: 1, unresolvedFault: false, providers: ['zachd'] });

    applyWorker('ZACH-009', 'shell', { usageCount: 19, activeCount: 1, avgDurationMs: 1920, cacheHitPct: 52, lastExitCode: 1, unresolvedFault: true, providers: ['codex'] });
    applyWorker('ZACH-009', 'network', { usageCount: 12, activeCount: 0, avgDurationMs: 410, cacheHitPct: 45, lastExitCode: 1, unresolvedFault: true, providers: ['zachd'] });

    orchTrail = ['files-worktree', 'shell-checks', 'reviewers', 'merge-lane', 'github-ci'];
    orchPulses = [
      { id: 'p1', stationId: 'github-ci', direction: 'inbound', isCache: false, isFault: true, provider: 'zachd' },
      { id: 'p2', stationId: 'shell-checks', direction: 'outbound', isCache: false, isFault: true, provider: 'codex' },
    ];
    events = [
      { seq: 604, ts: '22:08:14', taskId: 'ZACH-009', provider: 'zachd', scope: 'orchestration', stationId: 'github-ci', direction: 'inbound', durationMs: 620, tokensIn: 6100, tokensCached: 2900, tokensOut: 240, exitCode: 1, shortSha: '7089a6d', status: 'fault' },
      { seq: 603, ts: '22:08:06', taskId: 'ZACH-009', provider: 'codex', scope: 'worker', stationId: 'shell', direction: 'inbound', durationMs: 1920, tokensIn: 14200, tokensCached: 7400, tokensOut: 490, exitCode: 1, shortSha: '7089a6d', status: 'fault' },
      { seq: 602, ts: '22:07:58', taskId: 'ZACH-009', provider: 'zachd', scope: 'orchestration', stationId: 'merge-lane', direction: 'outbound', durationMs: 210, tokensIn: 3100, tokensCached: 1400, tokensOut: 120, exitCode: 0, shortSha: '7089a6d', status: 'ok' },
    ];
  } else if (preset === 'human-decision') {
    applyOrch('governance', { usageCount: 11, activeCount: 0, avgDurationMs: 110, cacheHitPct: 68, providers: ['zachd'] });
    applyOrch('planner', { usageCount: 15, activeCount: 0, avgDurationMs: 590, cacheHitPct: 80, providers: ['gemini'] });
    applyOrch('reviewers', { usageCount: 13, activeCount: 0, avgDurationMs: 720, cacheHitPct: 77, providers: ['gemini'] });
    applyOrch('you-decisions', { usageCount: 8, activeCount: 1, avgDurationMs: 0, cacheHitPct: 0, providers: ['zachd'] });

    applyWorker('INF-020', 'hooks', { usageCount: 9, activeCount: 1, avgDurationMs: 65, cacheHitPct: 60, providers: ['zachd'] });
    applyWorker('INF-020', 'memory-cache', { usageCount: 14, activeCount: 0, avgDurationMs: 24, cacheHitPct: 82, providers: ['gemini'] });

    orchTrail = ['governance', 'planner', 'reviewers', 'governance', 'you-decisions'];
    orchPulses = [
      { id: 'p1', stationId: 'you-decisions', direction: 'outbound', isCache: false, isFault: false, provider: 'zachd' },
    ];
    events = [
      { seq: 709, ts: '22:08:14', taskId: 'INF-020', provider: 'zachd', scope: 'orchestration', stationId: 'you-decisions', direction: 'outbound', durationMs: 12, tokensIn: 4800, tokensCached: 3100, tokensOut: 180, exitCode: 0, shortSha: '4c82d10', status: 'gate' },
      { seq: 708, ts: '22:08:03', taskId: 'INF-020', provider: 'gemini', scope: 'orchestration', stationId: 'reviewers', direction: 'inbound', durationMs: 720, tokensIn: 19200, tokensCached: 14900, tokensOut: 510, exitCode: 0, shortSha: '4c82d10', status: 'ok' },
      { seq: 707, ts: '22:07:51', taskId: 'INF-020', provider: 'gemini', scope: 'worker', stationId: 'memory-cache', direction: 'inbound', durationMs: 24, tokensIn: 19200, tokensCached: 15800, tokensOut: 0, exitCode: 0, shortSha: '4c82d10', status: 'cached' },
    ];
  } else {
    orchTrail = [];
    orchPulses = [];
    events = [
      { seq: 101, ts: '22:04:00', taskId: 'ZACH-009', provider: 'zachd', scope: 'orchestration', stationId: 'governance', direction: 'inbound', durationMs: 38, tokensIn: 1200, tokensCached: 900, tokensOut: 64, exitCode: 0, shortSha: '7089a6d', status: 'ok' },
    ];
  }

  const workerTrails: Record<WorkerId, string[]> = {
    'ZACH-009': preset === 'idle' ? [] : ['model', 'memory-cache', 'files', 'shell', preset === 'ci-fault' ? 'network' : 'hooks'],
    'INF-020': preset === 'idle' ? [] : ['skills', 'model', 'memory-cache', 'agents', 'hooks'],
    'UDS-021': preset === 'idle' ? [] : ['skills', 'files', 'model', 'memory-cache', 'agents'],
    'LUMI-007': preset === 'idle' ? [] : ['model', 'memory-cache', 'files', 'shell', 'network'],
  };

  const workerPulses: Record<WorkerId, PulseSpec[]> = {
    'ZACH-009': preset === 'idle' ? [] : [
      { id: 'wp1', stationId: preset === 'ci-fault' ? 'shell' : 'files', direction: 'outbound', isCache: false, isFault: preset === 'ci-fault', provider: 'codex' },
      { id: 'wp2', stationId: 'memory-cache', direction: 'inbound', isCache: true, isFault: false, provider: 'codex' },
    ],
    'INF-020': preset === 'idle' ? [] : [
      { id: 'wp3', stationId: 'hooks', direction: 'outbound', isCache: false, isFault: false, provider: 'zachd' },
    ],
    'UDS-021': preset === 'idle' ? [] : [
      { id: 'wp4', stationId: 'agents', direction: 'outbound', isCache: false, isFault: false, provider: 'gemini' },
      { id: 'wp5', stationId: 'memory-cache', direction: 'inbound', isCache: true, isFault: false, provider: 'gemini' },
    ],
    'LUMI-007': preset === 'idle' ? [] : [
      { id: 'wp6', stationId: 'shell', direction: 'outbound', isCache: false, isFault: false, provider: 'gemini' },
      { id: 'wp7', stationId: 'memory-cache', direction: 'inbound', isCache: true, isFault: false, provider: 'gemini' },
    ],
  };

  const defaultStation = scope === 'orchestration'
    ? (preset === 'ci-fault' ? 'github-ci' : preset === 'human-decision' ? 'you-decisions' : preset === 'review-gate' ? 'reviewers' : 'files-worktree')
    : (preset === 'ci-fault' ? 'shell' : 'memory-cache');

  return {
    preset,
    scope,
    selectedWorkerId: workerId,
    selectedStationId: defaultStation,
    providerFilter: 'all',
    autoStream: preset !== 'idle',
    paused: false,
    decision: 'pending',
    decisionNote: '',
    seqCounter: events[0]?.seq ?? 101,
    stepCursor: 0,
    orchStats,
    workerStats,
    orchTrail,
    workerTrails,
    orchPulses,
    workerPulses,
    events,
  };
}

function appendTrail(trail: string[], stationId: string): string[] {
  const deduped = trail[trail.length - 1] === stationId ? trail : [...trail, stationId];
  return deduped.slice(-5);
}

function stepSimulation(prev: SimState): SimState {
  if (prev.paused) return prev;
  const cursor = prev.stepCursor + 1;
  const stations = prev.scope === 'orchestration' ? ORCH_STATIONS : WORKER_STATIONS;
  const cycleOrder = prev.preset === 'review-gate'
    ? [5, 1, 4, 0, 2]
    : prev.preset === 'ci-fault'
      ? [3, 4, 2, 6, 3]
      : prev.preset === 'human-decision'
        ? [7, 0, 1, 5, 7]
        : [2, 3, 1, 5, 4, 0, 6];

  const targetIdx = cycleOrder[cursor % cycleOrder.length] % stations.length;
  const target = stations[targetIdx];
  const nextSeq = prev.seqCounter + 1;
  const isCacheEvent = target.id === 'memory-cache' || target.id === 'planner' || cursor % 3 === 0;
  const isFaultEvent = prev.preset === 'ci-fault' && (target.id === 'github-ci' || target.id === 'shell' || target.id === 'shell-checks');
  const direction: EventDirection = isCacheEvent || cursor % 2 === 0 ? 'inbound' : 'outbound';
  const activeWorker = WORKERS.find((w) => w.id === prev.selectedWorkerId) ?? WORKERS[0];
  const workerChoice = prev.scope === 'worker' ? activeWorker : WORKERS[cursor % WORKERS.length];
  const provider: ProviderId = target.primaryProvider;

  const tokensIn = 8200 + ((cursor * 1973) % 18400);
  const tokensCached = isCacheEvent ? Math.round(tokensIn * 0.82) : Math.round(tokensIn * 0.56);
  const tokensOut = direction === 'inbound' ? 240 + ((cursor * 97) % 640) : 0;
  const durationMs = isCacheEvent ? 24 + (cursor % 19) : 180 + ((cursor * 211) % 1450);

  const newEvent: TelemetryEvent = {
    seq: nextSeq,
    ts: formatClockTime(cursor * 4),
    taskId: workerChoice.id,
    provider,
    scope: prev.scope,
    stationId: target.id,
    direction,
    durationMs,
    tokensIn,
    tokensCached,
    tokensOut,
    exitCode: isFaultEvent ? 1 : 0,
    shortSha: workerChoice.id === 'INF-020' ? '4c82d10' : workerChoice.id === 'UDS-021' ? '9f44e12' : '7089a6d',
    status: isFaultEvent ? 'fault' : isCacheEvent ? 'cached' : prev.preset === 'human-decision' && target.id === 'you-decisions' ? 'gate' : 'active',
  };

  const pulse: PulseSpec = {
    id: `pulse-${nextSeq}`,
    stationId: target.id,
    direction,
    isCache: isCacheEvent,
    isFault: isFaultEvent,
    provider,
  };

  if (prev.scope === 'orchestration') {
    const cur = prev.orchStats[target.id];
    const nextOrchStats: Record<string, StationStats> = {};
    for (const st of ORCH_STATIONS) {
      const s = prev.orchStats[st.id];
      nextOrchStats[st.id] = st.id === target.id
        ? {
            ...s,
            usageCount: s.usageCount + 1,
            activeCount: Math.min(3, Math.max(1, (cursor % 2) + 1)),
            avgDurationMs: Math.round((s.avgDurationMs * 2 + durationMs) / 3),
            cacheHitPct: Math.round((tokensCached / tokensIn) * 100),
            lastSha: newEvent.shortSha,
            lastExitCode: newEvent.exitCode,
            unresolvedFault: s.unresolvedFault || isFaultEvent,
            providers: s.providers.includes(provider) ? s.providers : [...s.providers, provider],
          }
        : { ...s, activeCount: s.activeCount > 0 && cursor % 4 === 0 ? s.activeCount - 1 : s.activeCount };
    }
    return {
      ...prev,
      seqCounter: nextSeq,
      stepCursor: cursor,
      orchStats: { ...nextOrchStats, [target.id]: nextOrchStats[target.id] ?? cur },
      orchTrail: appendTrail(prev.orchTrail, target.id),
      orchPulses: [pulse, ...prev.orchPulses].slice(0, 3),
      events: [newEvent, ...prev.events].slice(0, 14),
    };
  }

  const wId = prev.selectedWorkerId;
  const wMap = prev.workerStats[wId];
  const nextWorkerMap: Record<string, StationStats> = {};
  for (const st of WORKER_STATIONS) {
    const s = wMap[st.id];
    nextWorkerMap[st.id] = st.id === target.id
      ? {
          ...s,
          usageCount: s.usageCount + 1,
          activeCount: Math.min(3, Math.max(1, (cursor % 2) + 1)),
          avgDurationMs: Math.round((s.avgDurationMs * 2 + durationMs) / 3),
          cacheHitPct: Math.round((tokensCached / tokensIn) * 100),
          lastSha: newEvent.shortSha,
          lastExitCode: newEvent.exitCode,
          unresolvedFault: s.unresolvedFault || isFaultEvent,
          providers: s.providers.includes(provider) ? s.providers : [...s.providers, provider],
        }
      : { ...s, activeCount: s.activeCount > 0 && cursor % 4 === 0 ? s.activeCount - 1 : s.activeCount };
  }

  return {
    ...prev,
    seqCounter: nextSeq,
    stepCursor: cursor,
    workerStats: { ...prev.workerStats, [wId]: nextWorkerMap },
    workerTrails: { ...prev.workerTrails, [wId]: appendTrail(prev.workerTrails[wId], target.id) },
    workerPulses: { ...prev.workerPulses, [wId]: [pulse, ...prev.workerPulses[wId]].slice(0, 3) },
    events: [newEvent, ...prev.events].slice(0, 14),
  };
}

function moodForState(s: SimState): Mood {
  if (s.paused) return 'paused';
  if (s.preset === 'idle') return 'idle';
  const hasFault = Object.values(s.orchStats).some((x) => x.unresolvedFault)
    || Object.values(s.workerStats[s.selectedWorkerId]).some((x) => x.unresolvedFault);
  if (hasFault) return 'error';
  if (s.preset === 'human-decision' && s.decision === 'pending') return 'decision';
  if (s.preset === 'review-gate') return 'review';
  return 'hunting';
}

function stationXY(angleDeg: number, radius = SPOKE_R) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: CX + radius * Math.cos(rad), y: CY + radius * Math.sin(rad), cos: Math.cos(rad), sin: Math.sin(rad) };
}

function describeArc(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const toRad = (d: number) => ((d - 90) * Math.PI) / 180;
  const start = { x: cx + r * Math.cos(toRad(startDeg)), y: cy + r * Math.sin(toRad(startDeg)) };
  const end = { x: cx + r * Math.cos(toRad(endDeg)), y: cy + r * Math.sin(toRad(endDeg)) };
  const sweep = endDeg - startDeg <= 180 ? 0 : 1;
  return `M ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${sweep} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)}`;
}

function RadialTelemetryMap({
  sim,
  mood,
  stations,
  statsMap,
  trail,
  pulses,
  onSelectStation,
}: {
  sim: SimState;
  mood: Mood;
  stations: StationDef[];
  statsMap: Record<string, StationStats>;
  trail: string[];
  pulses: PulseSpec[];
  onSelectStation: (id: string) => void;
}) {
  const activeWorker = WORKERS.find((w) => w.id === sim.selectedWorkerId) ?? WORKERS[0];
  const streaming = sim.autoStream && !sim.paused && sim.preset !== 'idle';

  const avgCachePct = useMemo(() => {
    const vals = Object.values(statsMap);
    const activeVals = vals.filter((v) => v.usageCount > 1);
    if (activeVals.length === 0) return sim.scope === 'worker' ? activeWorker.cachePct : 42;
    return Math.round(activeVals.reduce((acc, v) => acc + v.cacheHitPct, 0) / activeVals.length);
  }, [statsMap, sim.scope, activeWorker.cachePct]);

  const contextPct = sim.preset === 'idle' ? 14 : sim.scope === 'worker' ? activeWorker.contextPct : 64;
  const ctxEndDeg = Math.max(12, Math.round((contextPct / 100) * 170));
  const cacheEndDeg = 180 + Math.max(12, Math.round((avgCachePct / 100) * 170));

  const stationById = useMemo(() => new Map(stations.map((s) => [s.id, s])), [stations]);

  const handleStationKeyDown = (e: KeyboardEvent<SVGGElement>, id: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectStation(id);
    }
  };

  return (
    <div className="zlm-svg-wrap">
      <svg
        viewBox="0 0 760 640"
        className={`zlm-svg ${streaming ? 'is-streaming' : ''}`}
        role="img"
        aria-label={`Zach radial telemetry map in ${sim.scope} scope`}
      >
        {/* Subtle lot-map concentric hairlines and cardinal ticks */}
        {[92, 146, 200, 252].map((r) => (
          <circle
            key={r}
            cx={CX}
            cy={CY}
            r={r}
            fill="none"
            stroke="#22252B"
            strokeWidth={r === 200 ? 1 : 0.75}
            strokeDasharray={r === 146 ? '3 5' : undefined}
          />
        ))}
        {stations.map((st) => {
          const p1 = stationXY(st.angleDeg, 246);
          const p2 = stationXY(st.angleDeg, 256);
          return (
            <line
              key={`tick-${st.id}`}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              stroke="#2E323A"
              strokeWidth={1}
            />
          );
        })}

        {/* Fading route trail joining the last 5 stations visited */}
        {trail.length > 1 && trail.slice(0, -1).map((fromId, idx) => {
          const toId = trail[idx + 1];
          const fromDef = stationById.get(fromId);
          const toDef = stationById.get(toId);
          if (!fromDef || !toDef || fromId === toId) return null;
          const a = stationXY(fromDef.angleDeg);
          const b = stationXY(toDef.angleDeg);
          const midX = (a.x + b.x) / 2;
          const midY = (a.y + b.y) / 2;
          const ctrlX = midX * 0.68 + CX * 0.32;
          const ctrlY = midY * 0.68 + CY * 0.32;
          const fadeOpacity = [0.16, 0.28, 0.45, 0.72][Math.min(idx, 3)] ?? 0.72;
          return (
            <path
              key={`trail-${idx}-${fromId}-${toId}`}
              d={`M ${a.x.toFixed(1)} ${a.y.toFixed(1)} Q ${ctrlX.toFixed(1)} ${ctrlY.toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`}
              fill="none"
              stroke="#7FB2FF"
              strokeWidth={1.5 + idx * 0.25}
              strokeOpacity={fadeOpacity}
              strokeDasharray="4 4"
            />
          );
        })}

        {/* Usage-weighted worn spokes & animated / reduced-motion pulses */}
        {stations.map((st) => {
          const stats = statsMap[st.id];
          const pStart = stationXY(st.angleDeg, INNER_ARC_R);
          const pEnd = stationXY(st.angleDeg, SPOKE_R - 27);
          const isSelected = sim.selectedStationId === st.id;
          const matchesProvider = sim.providerFilter === 'all' || stats.providers.includes(sim.providerFilter);
          const wornWidth = 1.2 + Math.min(4.2, (stats.usageCount - 1) * 0.24);
          const wornOpacity = matchesProvider ? Math.min(0.88, 0.24 + (stats.usageCount - 1) * 0.036) : 0.14;
          const spokeStroke = stats.unresolvedFault
            ? '#FFA98C'
            : isSelected
              ? '#F0C94A'
              : st.id === 'memory-cache'
                ? '#62C7BA'
                : '#C9CCD3';

          const activePulse = pulses.find((p) => p.stationId === st.id);
          const pulseColor = activePulse
            ? activePulse.isFault
              ? '#FFA98C'
              : activePulse.isCache
                ? '#62C7BA'
                : activePulse.direction === 'outbound'
                  ? '#F0C94A'
                  : '#7FB2FF'
            : '#7FB2FF';
          const pulsePathD = activePulse?.direction === 'inbound'
            ? `M ${pEnd.x.toFixed(1)} ${pEnd.y.toFixed(1)} L ${pStart.x.toFixed(1)} ${pStart.y.toFixed(1)}`
            : `M ${pStart.x.toFixed(1)} ${pStart.y.toFixed(1)} L ${pEnd.x.toFixed(1)} ${pEnd.y.toFixed(1)}`;
          const midPt = stationXY(st.angleDeg, (INNER_ARC_R + SPOKE_R - 27) / 2);
          const chevronDeg = activePulse?.direction === 'inbound' ? st.angleDeg + 180 : st.angleDeg;

          return (
            <g key={`spoke-${st.id}`}>
              <line
                x1={pStart.x}
                y1={pStart.y}
                x2={pEnd.x}
                y2={pEnd.y}
                stroke={spokeStroke}
                strokeWidth={wornWidth}
                strokeOpacity={wornOpacity}
                strokeLinecap="round"
              />
              {activePulse && matchesProvider && (
                <>
                  <path
                    d={pulsePathD}
                    fill="none"
                    stroke={pulseColor}
                    strokeWidth={3}
                    strokeLinecap="round"
                    className="zlm-pulse-path"
                  />
                  <g
                    className="zlm-pulse-reduced"
                    transform={`translate(${midPt.x.toFixed(1)}, ${midPt.y.toFixed(1)}) rotate(${chevronDeg})`}
                  >
                    <polygon points="6,0 -4,-4.5 -4,4.5" fill={pulseColor} />
                  </g>
                </>
              )}
            </g>
          );
        })}

        {/* Central dual-arc context/quota ring + #62C7BA cache share */}
        <circle cx={CX} cy={CY} r={74} fill="none" stroke="#24272C" strokeWidth={5} />
        <circle cx={CX} cy={CY} r={62} fill="none" stroke="#1E2228" strokeWidth={4} />
        <path
          d={describeArc(CX, CY, 74, 0, ctxEndDeg)}
          fill="none"
          stroke={mood === 'error' ? '#FFA98C' : '#7FB2FF'}
          strokeWidth={5}
          strokeLinecap="round"
        />
        <path
          d={describeArc(CX, CY, 62, 180, cacheEndDeg)}
          fill="none"
          stroke="#62C7BA"
          strokeWidth={4}
          strokeLinecap="round"
        />

        {/* Active clock hands (rotating under reduced-motion: no-preference; static high-contrast under reduce) */}
        <g className="zlm-clock-slow">
          <line x1={CX} y1={CY} x2={CX} y2={CY - 55} stroke="#C9CCD3" strokeWidth={1.6} strokeOpacity={0.7} strokeLinecap="round" />
        </g>
        <g className="zlm-clock-fast">
          <line x1={CX} y1={CY} x2={CX + 58} y2={CY} stroke="#F0C94A" strokeWidth={1.4} strokeOpacity={0.9} strokeLinecap="round" />
          <circle cx={CX + 58} cy={CY} r={2.5} fill="#F0C94A" />
        </g>
        <g className="zlm-clock-reduced">
          <line x1={CX} y1={CY} x2={CX - 36} y2={CY - 40} stroke="#ECEAE4" strokeWidth={2} strokeLinecap="round" />
          <line x1={CX} y1={CY} x2={CX + 52} y2={CY + 24} stroke="#F0C94A" strokeWidth={2} strokeLinecap="round" />
          <circle cx={CX + 52} cy={CY + 24} r={3} fill="#F0C94A" />
        </g>

        {/* Central ZachCat nested inside <svg> per Plan Reviewer note #2 */}
        <circle cx={CX} cy={CY} r={46} fill="#121316" stroke="#2A2D33" strokeWidth={1.2} />
        <svg x={CX - 42} y={CY - 42} width={84} height={84}>
          <ZachCat mood={mood} />
        </svg>

        {/* Core label */}
        <g transform={`translate(${CX}, ${CY + 95})`}>
          <rect x={-72} y={-12} width={144} height={24} rx={12} fill="#1A1C20" stroke="#3A3E46" strokeWidth={1} />
          <text
            x={0}
            y={4}
            textAnchor="middle"
            fill="#ECEAE4"
            fontSize={11.5}
            fontFamily="var(--z-font-mono)"
            fontWeight={600}
          >
            {sim.scope === 'orchestration' ? `zachd · ctx ${contextPct}%` : `${sim.selectedWorkerId} · ${avgCachePct}%c`}
          </text>
        </g>

        {/* 8 radial stations with keyboard access, tooltips, concurrency badges, and persistent fault dots */}
        {stations.map((st) => {
          const pos = stationXY(st.angleDeg);
          const stats = statsMap[st.id];
          const isSelected = sim.selectedStationId === st.id;
          const matchesProvider = sim.providerFilter === 'all' || stats.providers.includes(sim.providerFilter);
          const isGate = st.id === 'you-decisions' && sim.preset === 'human-decision' && sim.decision === 'pending';

          const anchor = Math.abs(pos.cos) < 0.25 ? 'middle' : pos.cos > 0 ? 'start' : 'end';
          const labelX = anchor === 'middle' ? pos.x : pos.cos > 0 ? pos.x + 34 : pos.x - 34;
          const labelY = anchor === 'middle' ? (pos.sin < 0 ? pos.y - 42 : pos.y + 42) : pos.y - 2;
          const subY = labelY + 14;

          const nodeStroke = stats.unresolvedFault
            ? '#FFA98C'
            : isGate
              ? '#F0C94A'
              : stats.activeCount > 0
                ? '#7FB2FF'
                : '#3A3E46';

          return (
            <Tooltip.Root key={st.id}>
              <Tooltip.Trigger
                render={(triggerProps) => (
                  <g
                    {...(triggerProps as unknown as React.SVGProps<SVGGElement>)}
                    className="zlm-station"
                    tabIndex={0}
                    role="button"
                    aria-pressed={isSelected}
                    aria-label={`${st.label}: ${stats.usageCount} calls, ${stats.activeCount} active${stats.unresolvedFault ? ', unresolved fault' : ''}`}
                    opacity={matchesProvider ? 1 : 0.35}
                    onClick={() => onSelectStation(st.id)}
                    onKeyDown={(e) => handleStationKeyDown(e, st.id)}
                  >
                    <circle
                      cx={pos.x}
                      cy={pos.y}
                      r={26}
                      fill="#1A1C20"
                      stroke={nodeStroke}
                      strokeWidth={1.6}
                      className="zlm-station-ring"
                    />
                    <g
                      transform={`translate(${pos.x}, ${pos.y})`}
                      color={stats.unresolvedFault ? '#FFA98C' : isSelected || isGate ? '#F0C94A' : st.id === 'memory-cache' ? '#62C7BA' : '#ECEAE4'}
                    >
                      <StationIcon id={st.id} />
                    </g>

                    {/* Persistent #FFA98C red fault dot until cleared/reset */}
                    {stats.unresolvedFault && (
                      <g transform={`translate(${pos.x - 19}, ${pos.y - 19})`}>
                        <circle r={9} fill="#FFA98C" opacity={0.28} className="zlm-fault-halo" />
                        <circle r={5} fill="#FFA98C" stroke="#121316" strokeWidth={1.4} />
                      </g>
                    )}

                    {/* Concurrency badge (×N) */}
                    {stats.activeCount > 0 && (
                      <g transform={`translate(${pos.x + 19}, ${pos.y - 20})`}>
                        <rect x={-12} y={-9} width={24} height={18} rx={9} fill="#F0C94A" stroke="#121316" strokeWidth={1.4} />
                        <text
                          x={0}
                          y={3.5}
                          textAnchor="middle"
                          fill="#17150C"
                          fontSize={10}
                          fontFamily="var(--z-font-mono)"
                          fontWeight={700}
                        >
                          ×{stats.activeCount}
                        </text>
                      </g>
                    )}

                    <text
                      x={labelX}
                      y={labelY}
                      textAnchor={anchor}
                      fill={isSelected ? '#F0C94A' : '#ECEAE4'}
                      fontSize={12}
                      fontFamily="var(--z-font-display)"
                      fontWeight={600}
                    >
                      {st.label}
                    </text>
                    <text
                      x={labelX}
                      y={subY}
                      textAnchor={anchor}
                      fill={stats.unresolvedFault ? '#FFA98C' : '#A3A6AD'}
                      fontSize={10.5}
                      fontFamily="var(--z-font-mono)"
                    >
                      {stats.unresolvedFault ? `fault · ${stats.usageCount}×` : `${stats.usageCount}× · ${stats.cacheHitPct}%c`}
                    </text>
                  </g>
                )}
              />
              <Tooltip.Portal>
                <Tooltip.Positioner sideOffset={10}>
                  <Tooltip.Popup className="zlm-portal zlm-tooltip">
                    <div className="zlm-display" style={{ fontWeight: 600 }}>{st.label}</div>
                    <div className="zlm-quiet" style={{ fontSize: 11, marginTop: 2 }}>{st.role}</div>
                    <div className="zlm-mono" style={{ fontSize: 11, marginTop: 6, color: 'var(--z-ink-2)' }}>
                      {stats.usageCount} calls · {stats.activeCount} active · {stats.avgDurationMs}ms
                    </div>
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          );
        })}
      </svg>
    </div>
  );
}

export function ZachLiveMap() {
  const [sim, setSim] = useState<SimState>(() => buildPresetState('parallel-impl'));
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (!sim.autoStream || sim.paused || sim.preset === 'idle') return undefined;
    const id = window.setInterval(() => {
      setSim((cur) => stepSimulation(cur));
    }, 1800);
    return () => window.clearInterval(id);
  }, [sim.autoStream, sim.paused, sim.preset]);

  const stations = sim.scope === 'orchestration' ? ORCH_STATIONS : WORKER_STATIONS;
  const statsMap = sim.scope === 'orchestration' ? sim.orchStats : sim.workerStats[sim.selectedWorkerId];
  const trail = sim.scope === 'orchestration' ? sim.orchTrail : sim.workerTrails[sim.selectedWorkerId];
  const pulses = sim.scope === 'orchestration' ? sim.orchPulses : sim.workerPulses[sim.selectedWorkerId];
  const mood = moodForState(sim);

  const selectedStation = stations.find((s) => s.id === sim.selectedStationId) ?? stations[0];
  const selectedStats = statsMap[selectedStation.id] ?? Object.values(statsMap)[0];
  const activeWorker = WORKERS.find((w) => w.id === sim.selectedWorkerId) ?? WORKERS[0];
  const activePreset = PRESETS.find((p) => p.id === sim.preset) ?? PRESETS[0];

  const providerCards: ProviderBusInfo[] = useMemo(() => {
    const counts: Record<ProviderId, number> = { codex: 0, gemini: 0, zachd: 0 };
    const cachedSums: Record<ProviderId, { hit: number; total: number }> = {
      codex: { hit: 0, total: 0 },
      gemini: { hit: 0, total: 0 },
      zachd: { hit: 0, total: 0 },
    };
    for (const ev of sim.events) {
      counts[ev.provider] += 1;
      cachedSums[ev.provider].hit += ev.tokensCached;
      cachedSums[ev.provider].total += ev.tokensIn;
    }
    const ratio = (p: ProviderId, fallback: number) =>
      cachedSums[p].total > 0 ? Math.round((cachedSums[p].hit / cachedSums[p].total) * 100) : fallback;

    return [
      {
        id: 'codex',
        name: PROVIDER_META.codex.name,
        model: PROVIDER_META.codex.model,
        statusLabel: sim.preset === 'ci-fault' ? 'fault · quota 28%' : sim.preset === 'idle' ? 'standby · quota 100%' : 'active · quota 64%',
        isDanger: sim.preset === 'ci-fault',
        isIdle: sim.preset === 'idle' || sim.paused,
        cacheRatioPct: ratio('codex', 72),
        eventCount: counts.codex,
      },
      {
        id: 'gemini',
        name: PROVIDER_META.gemini.name,
        model: PROVIDER_META.gemini.model,
        statusLabel: sim.preset === 'idle' ? 'standby · quota 100%' : 'active · quota 84%',
        isIdle: sim.preset === 'idle' || sim.paused,
        cacheRatioPct: ratio('gemini', 81),
        eventCount: counts.gemini,
      },
      {
        id: 'zachd',
        name: PROVIDER_META.zachd.name,
        model: PROVIDER_META.zachd.model,
        statusLabel: sim.paused ? 'paused · 0/2 slots' : sim.preset === 'idle' ? 'idle · 0/2 slots' : 'online · 2/2 slots',
        isDanger: sim.preset === 'ci-fault',
        isIdle: sim.preset === 'idle' || sim.paused,
        cacheRatioPct: ratio('zachd', 64),
        eventCount: counts.zachd,
      },
    ];
  }, [sim.events, sim.preset, sim.paused]);

  const filteredEvents = useMemo(
    () => (sim.providerFilter === 'all' ? sim.events : sim.events.filter((e) => e.provider === sim.providerFilter)),
    [sim.events, sim.providerFilter],
  );

  const unresolvedFaultCount = Object.values(statsMap).filter((s) => s.unresolvedFault).length;

  const switchPreset = (nextPreset: PresetId) => {
    setSim((cur) => buildPresetState(nextPreset, cur.scope, cur.selectedWorkerId));
  };

  const clearStationFault = (stationId: string) => {
    setSim((cur) => {
      if (cur.scope === 'orchestration') {
        return {
          ...cur,
          orchStats: {
            ...cur.orchStats,
            [stationId]: { ...cur.orchStats[stationId], unresolvedFault: false, lastExitCode: 0 },
          },
        };
      }
      const wId = cur.selectedWorkerId;
      return {
        ...cur,
        workerStats: {
          ...cur.workerStats,
          [wId]: {
            ...cur.workerStats[wId],
            [stationId]: { ...cur.workerStats[wId][stationId], unresolvedFault: false, lastExitCode: 0 },
          },
        },
      };
    });
  };

  const applyHumanDecision = (outcome: 'approved' | 'rejected') => {
    setSim((cur) => {
      const nextSeq = cur.seqCounter + 1;
      const decisionEvent: TelemetryEvent = {
        seq: nextSeq,
        ts: formatClockTime(cur.stepCursor * 4 + 2),
        taskId: 'INF-020',
        provider: 'zachd',
        scope: 'orchestration',
        stationId: outcome === 'approved' ? 'files-worktree' : 'planner',
        direction: 'outbound',
        durationMs: 36,
        tokensIn: 3200,
        tokensCached: 2100,
        tokensOut: 140,
        exitCode: 0,
        shortSha: '4c82d10',
        status: outcome === 'approved' ? 'ok' : 'gate',
      };
      return {
        ...cur,
        decision: outcome,
        seqCounter: nextSeq,
        orchStats: {
          ...cur.orchStats,
          'you-decisions': { ...cur.orchStats['you-decisions'], activeCount: 0, usageCount: cur.orchStats['you-decisions'].usageCount + 1 },
        },
        orchTrail: appendTrail(cur.orchTrail, outcome === 'approved' ? 'files-worktree' : 'planner'),
        events: [decisionEvent, ...cur.events].slice(0, 14),
      };
    });
    setDialogOpen(false);
  };

  return (
    <Tooltip.Provider delay={200}>
      <div className="zlm">
        {/* Top Toolbar: Scenario Presets + Simulation Controls */}
        <header className="zlm-toolbar">
          <div className="zlm-brand">
            <div style={{ width: 34, height: 34, flex: 'none' }}>
              <ZachCat mood={mood} size={34} />
            </div>
            <div>
              <div className="zlm-brand-title">Zach · Live Telemetry Map</div>
              <div className="zlm-brand-sub">{activePreset.summary}</div>
            </div>
          </div>

          <Tabs.Root value={sim.preset} onValueChange={(v) => switchPreset(v as PresetId)}>
            <Tabs.List className="zlm-tabs-list" aria-label="Scenario presets">
              {PRESETS.map((p) => (
                <Tabs.Tab key={p.id} value={p.id} className="zlm-tab">
                  {p.label}
                </Tabs.Tab>
              ))}
            </Tabs.List>
          </Tabs.Root>

          <div className="zlm-controls">
            <label className="zlm-switch-wrap">
              <span>Auto-stream</span>
              <Switch.Root
                className="zlm-switch"
                checked={sim.autoStream}
                onCheckedChange={(checked) => setSim((cur) => ({ ...cur, autoStream: checked }))}
                aria-label="Toggle auto-stream telemetry"
              >
                <Switch.Thumb className="zlm-switch-thumb" />
              </Switch.Root>
            </label>

            <button
              type="button"
              className={`zlm-btn ${sim.paused ? 'is-live' : ''}`}
              onClick={() => setSim((cur) => ({ ...cur, paused: !cur.paused }))}
              aria-pressed={sim.paused}
            >
              {sim.paused ? <Play size={14} /> : <Pause size={14} />}
              <span>{sim.paused ? 'Resume' : 'Pause'}</span>
            </button>

            <button
              type="button"
              className="zlm-btn"
              onClick={() => setSim((cur) => stepSimulation({ ...cur, paused: false }))}
            >
              <StepForward size={14} />
              <span>Step Event</span>
            </button>

            <button
              type="button"
              className="zlm-btn"
              onClick={() => setSim((cur) => buildPresetState(cur.preset, cur.scope, cur.selectedWorkerId))}
            >
              <RotateCcw size={14} />
              <span>Reset</span>
            </button>
          </div>
        </header>

        {/* command-mesh Multi-Provider Bus Strip */}
        <section className="zlm-bus" aria-label="Multi-provider telemetry bus">
          {providerCards.map((p) => {
            const active = sim.providerFilter === p.id;
            return (
              <button
                key={p.id}
                type="button"
                className="zlm-provider"
                aria-pressed={active}
                onClick={() => setSim((cur) => ({ ...cur, providerFilter: cur.providerFilter === p.id ? 'all' : p.id }))}
              >
                <div className="zlm-provider-top">
                  <span className="zlm-provider-name">
                    <span className={`zlm-provider-dot ${p.isDanger ? 'is-danger' : p.isIdle ? 'is-idle' : ''}`} />
                    {p.name}
                  </span>
                  <span className="zlm-mono zlm-quiet" style={{ fontSize: 11 }}>{p.model}</span>
                </div>
                <div className="zlm-provider-meta">
                  <span>{p.statusLabel}</span>
                  <span className="zlm-cache-pill">{p.cacheRatioPct}% cached · {p.eventCount} ev</span>
                </div>
              </button>
            );
          })}
        </section>

        {/* Main Workspace: Radial Map + Side Telemetry Rail */}
        <main className="zlm-workspace">
          <section className="zlm-card zlm-map-card" aria-label="Radial telemetry map">
            <div className="zlm-map-header">
              <Tabs.Root
                value={sim.scope}
                onValueChange={(v) => {
                  const nextScope = v as MapScope;
                  setSim((cur) => ({
                    ...cur,
                    scope: nextScope,
                    selectedStationId: nextScope === 'orchestration' ? ORCH_STATIONS[0].id : WORKER_STATIONS[0].id,
                  }));
                }}
              >
                <Tabs.List className="zlm-tabs-list" aria-label="Map scope">
                  <Tabs.Tab value="orchestration" className="zlm-tab">Orchestration (zachd)</Tabs.Tab>
                  <Tabs.Tab value="worker" className="zlm-tab">Worker ({sim.selectedWorkerId})</Tabs.Tab>
                </Tabs.List>
              </Tabs.Root>

              <div className="zlm-map-meta">
                {sim.providerFilter !== 'all' && (
                  <button
                    type="button"
                    className="zlm-btn is-live"
                    style={{ minHeight: 28, padding: '0 9px' }}
                    onClick={() => setSim((cur) => ({ ...cur, providerFilter: 'all' }))}
                  >
                    Filter: {PROVIDER_META[sim.providerFilter].name} ×
                  </button>
                )}
                <span className="zlm-badge is-cache">cache #62C7BA</span>
                <span className="zlm-badge is-accent">seq #{sim.seqCounter}</span>
                {unresolvedFaultCount > 0 && (
                  <span className="zlm-badge is-danger">{unresolvedFaultCount} fault</span>
                )}
              </div>
            </div>

            <RadialTelemetryMap
              sim={sim}
              mood={mood}
              stations={stations}
              statsMap={statsMap}
              trail={trail}
              pulses={pulses}
              onSelectStation={(id) => setSim((cur) => ({ ...cur, selectedStationId: id }))}
            />

            <div className="zlm-legend" aria-label="Map visual mechanics legend">
              <span className="zlm-legend-item"><span className="zlm-swatch" style={{ background: 'var(--z-ink-2)' }} />Worn spoke = call volume</span>
              <span className="zlm-legend-item"><span className="zlm-swatch" style={{ background: 'var(--z-live)' }} />Trail = last 5 stations</span>
              <span className="zlm-legend-item"><span className="zlm-swatch" style={{ background: 'var(--z-accent)' }} />Outbound / ×N active</span>
              <span className="zlm-legend-item"><span className="zlm-swatch" style={{ background: 'var(--z-cache)' }} />Inbound cache hit</span>
              <span className="zlm-legend-item"><span className="zlm-swatch" style={{ background: 'var(--z-danger)' }} />Persistent fault dot</span>
            </div>
          </section>

          <aside className="zlm-rail" aria-label="Tasks, breakdown and live metadata timeline">
            {/* Human Decision Gate Banner + Base UI Dialog */}
            <div className={`zlm-card zlm-panel ${sim.preset === 'human-decision' && sim.decision === 'pending' ? 'is-gate' : ''}`}>
              <div className="zlm-panel-head">
                <h2 className="zlm-h2">Human Decision Gate · INF-020</h2>
                <span className={`zlm-badge ${sim.decision === 'pending' ? 'is-accent' : ''}`}>
                  {sim.decision}
                </span>
              </div>
              <div className="zlm-quiet" style={{ fontSize: 12 }}>
                {sim.decision === 'pending'
                  ? 'Weight L plan passed plan-review. Requires explicit approval before impl.'
                  : sim.decision === 'approved'
                    ? 'Plan approved in demo state: INF-020 moved to impl.'
                    : 'Plan rejected in demo state: INF-020 returned to planner.'}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
                  <Dialog.Trigger className="zlm-btn is-primary">
                    <ShieldAlert size={14} />
                    <span>{sim.decision === 'pending' ? 'Review Decision Gate' : 'Re-open Gate'}</span>
                  </Dialog.Trigger>
                  <Dialog.Portal>
                    <Dialog.Backdrop className="zlm-portal zlm-dialog-backdrop" />
                    <Dialog.Popup className="zlm-portal zlm-dialog-popup">
                      <Dialog.Title className="zlm-display" style={{ margin: 0, fontSize: 18 }}>
                        Human Gate · INF-020 (Weight L)
                      </Dialog.Title>
                      <Dialog.Description className="zlm-quiet" style={{ margin: 0, fontSize: 12.5 }}>
                        Metadata-only review summary. Decisions never auto-approve on timer.
                      </Dialog.Description>
                      <div className="zlm-kv-grid">
                        <div className="zlm-kv"><span className="zlm-kv-label">Repo</span><span className="zlm-kv-value">infrastructure</span></div>
                        <div className="zlm-kv"><span className="zlm-kv-label">Plan Review</span><span className="zlm-kv-value">PASS · 4c82d10</span></div>
                        <div className="zlm-kv"><span className="zlm-kv-label">Scope Files</span><span className="zlm-kv-value">3 paths</span></div>
                        <div className="zlm-kv"><span className="zlm-kv-label">Cache Share</span><span className="zlm-kv-value">82%</span></div>
                      </div>
                      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
                        <span className="zlm-quiet">Optional decision note (metadata tag)</span>
                        <input
                          type="text"
                          className="zlm-input"
                          value={sim.decisionNote}
                          onChange={(e) => setSim((cur) => ({ ...cur, decisionNote: e.target.value }))}
                          placeholder="e.g. Verified Cloudflare Access policy"
                        />
                      </label>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
                        <Dialog.Close className="zlm-btn">Cancel</Dialog.Close>
                        <button type="button" className="zlm-btn is-danger" onClick={() => applyHumanDecision('rejected')}>
                          Reject to Planner
                        </button>
                        <button type="button" className="zlm-btn is-primary" onClick={() => applyHumanDecision('approved')}>
                          Approve Impl
                        </button>
                      </div>
                    </Dialog.Popup>
                  </Dialog.Portal>
                </Dialog.Root>

                {selectedStats.unresolvedFault && (
                  <button
                    type="button"
                    className="zlm-btn is-danger"
                    onClick={() => clearStationFault(selectedStation.id)}
                  >
                    Clear {selectedStation.shortLabel} Fault
                  </button>
                )}
              </div>
            </div>

            {/* Task / Worker Drill-Down List */}
            <div className="zlm-card zlm-panel">
              <div className="zlm-panel-head">
                <h2 className="zlm-h2">Tasks & Worker Drill-Down</h2>
                <span className="zlm-mono zlm-quiet" style={{ fontSize: 11 }}>click to drill down</span>
              </div>
              <div className="zlm-workers">
                {WORKERS.map((w) => {
                  const isActive = sim.scope === 'worker' && sim.selectedWorkerId === w.id;
                  const stageText = w.id === 'INF-020' && sim.decision !== 'pending'
                    ? sim.decision === 'approved' ? 'impl (approved)' : 'planner (rejected)'
                    : w.stage;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      className="zlm-worker-row"
                      aria-pressed={isActive}
                      onClick={() => setSim((cur) => ({
                        ...cur,
                        scope: 'worker',
                        selectedWorkerId: w.id,
                        selectedStationId: 'memory-cache',
                      }))}
                    >
                      <div className="zlm-worker-top">
                        <span className="zlm-mono" style={{ fontWeight: 600, color: 'var(--z-accent)' }}>
                          {w.id}
                        </span>
                        <span className="zlm-badge">{w.repo} · {w.weight}</span>
                      </div>
                      <div className="zlm-worker-sub">
                        <span>{stageText} · {PROVIDER_META[w.provider].name}</span>
                        <span className="zlm-cache-pill">{w.cachePct}% cached · {w.contextPct}% ctx</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Station & Worker Breakdown (Base UI Accordion) */}
            <div className="zlm-card zlm-panel">
              <div className="zlm-panel-head">
                <h2 className="zlm-h2">Station & Worker Breakdown</h2>
                <span className="zlm-badge">{selectedStation.shortLabel}</span>
              </div>

              <Accordion.Root className="zlm-accordion" defaultValue={['station']}>
                <Accordion.Item value="station" className="zlm-accordion-item">
                  <Accordion.Header style={{ margin: 0 }}>
                    <Accordion.Trigger className="zlm-accordion-trigger">
                      <span>Selected Station · {selectedStation.label}</span>
                      <ChevronDown size={15} className="zlm-accordion-chevron" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel className="zlm-accordion-panel">
                    <div className="zlm-kv-grid">
                      <div className="zlm-kv"><span className="zlm-kv-label">Calls</span><span className="zlm-kv-value">{selectedStats.usageCount}</span></div>
                      <div className="zlm-kv"><span className="zlm-kv-label">Concurrency</span><span className="zlm-kv-value">×{selectedStats.activeCount}</span></div>
                      <div className="zlm-kv"><span className="zlm-kv-label">Avg Latency</span><span className="zlm-kv-value">{selectedStats.avgDurationMs} ms</span></div>
                      <div className="zlm-kv"><span className="zlm-kv-label">Cache Share</span><span className="zlm-kv-value" style={{ color: 'var(--z-cache)' }}>{selectedStats.cacheHitPct}%</span></div>
                      <div className="zlm-kv"><span className="zlm-kv-label">Last SHA</span><span className="zlm-kv-value">{selectedStats.lastSha}</span></div>
                      <div className="zlm-kv"><span className="zlm-kv-label">Exit / Fault</span><span className="zlm-kv-value" style={{ color: selectedStats.unresolvedFault ? 'var(--z-danger)' : 'var(--z-ok)' }}>{selectedStats.lastExitCode} · {selectedStats.unresolvedFault ? 'FAULT' : 'clean'}</span></div>
                    </div>
                  </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="worker" className="zlm-accordion-item">
                  <Accordion.Header style={{ margin: 0 }}>
                    <Accordion.Trigger className="zlm-accordion-trigger">
                      <span>Worker Context · {activeWorker.id}</span>
                      <ChevronDown size={15} className="zlm-accordion-chevron" />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Panel className="zlm-accordion-panel">
                    <div className="zlm-kv-grid">
                      <div className="zlm-kv"><span className="zlm-kv-label">Model</span><span className="zlm-kv-value">{activeWorker.model}</span></div>
                      <div className="zlm-kv"><span className="zlm-kv-label">Context</span><span className="zlm-kv-value">{activeWorker.contextPct}%</span></div>
                      <div className="zlm-kv" style={{ gridColumn: '1 / -1' }}><span className="zlm-kv-label">Worktree</span><span className="zlm-kv-value">{activeWorker.worktreeSlug}</span></div>
                    </div>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion.Root>
            </div>

            {/* Metadata-Only Live Activity Timeline + Base UI Popover Inspector */}
            <div className="zlm-card zlm-panel">
              <div className="zlm-panel-head">
                <h2 className="zlm-h2">Metadata-Only Timeline</h2>
                <span className="zlm-badge">no prompts / secrets</span>
              </div>

              <div className="zlm-events">
                {filteredEvents.map((ev) => (
                  <Popover.Root key={`${ev.seq}-${ev.stationId}`}>
                    <Popover.Trigger className="zlm-event-btn">
                      <div className="zlm-event-left">
                        <div className="zlm-event-top">
                          <span className="zlm-mono" style={{ color: 'var(--z-accent)' }}>#{ev.seq}</span>
                          <span className="zlm-mono">{ev.taskId}</span>
                          <span className="zlm-quiet">{ev.stationId}</span>
                        </div>
                        <div className="zlm-event-meta">
                          {ev.ts} · {ev.provider} · {ev.durationMs}ms · {ev.tokensCached}/{ev.tokensIn}c · {ev.shortSha}
                        </div>
                      </div>
                      <span
                        className={`zlm-badge ${ev.status === 'fault' ? 'is-danger' : ev.status === 'cached' ? 'is-cache' : ev.status === 'gate' ? 'is-accent' : ''}`}
                      >
                        {ev.status}
                      </span>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Positioner side="left" sideOffset={10} align="start">
                        <Popover.Popup className="zlm-portal zlm-popover">
                          <Popover.Title className="zlm-display" style={{ margin: 0, fontSize: 14 }}>
                            Event #{ev.seq} · Metadata Inspector
                          </Popover.Title>
                          <Popover.Description className="zlm-quiet" style={{ margin: '4px 0 10px', fontSize: 11 }}>
                            Strictly metadata-only: no raw prompts, outputs, diffs, or secrets.
                          </Popover.Description>
                          <div className="zlm-kv-grid">
                            <div className="zlm-kv"><span className="zlm-kv-label">seq</span><span className="zlm-kv-value">{ev.seq}</span></div>
                            <div className="zlm-kv"><span className="zlm-kv-label">ts</span><span className="zlm-kv-value">{ev.ts}</span></div>
                            <div className="zlm-kv"><span className="zlm-kv-label">taskId</span><span className="zlm-kv-value">{ev.taskId}</span></div>
                            <div className="zlm-kv"><span className="zlm-kv-label">provider</span><span className="zlm-kv-value">{ev.provider}</span></div>
                            <div className="zlm-kv"><span className="zlm-kv-label">stationId</span><span className="zlm-kv-value">{ev.stationId}</span></div>
                            <div className="zlm-kv"><span className="zlm-kv-label">durationMs</span><span className="zlm-kv-value">{ev.durationMs}</span></div>
                            <div className="zlm-kv"><span className="zlm-kv-label">tokensIn</span><span className="zlm-kv-value">{ev.tokensIn}</span></div>
                            <div className="zlm-kv"><span className="zlm-kv-label">tokensCached</span><span className="zlm-kv-value" style={{ color: 'var(--z-cache)' }}>{ev.tokensCached}</span></div>
                            <div className="zlm-kv"><span className="zlm-kv-label">tokensOut</span><span className="zlm-kv-value">{ev.tokensOut}</span></div>
                            <div className="zlm-kv"><span className="zlm-kv-label">exitCode</span><span className="zlm-kv-value">{ev.exitCode}</span></div>
                            <div className="zlm-kv"><span className="zlm-kv-label">shortSha</span><span className="zlm-kv-value">{ev.shortSha}</span></div>
                            <div className="zlm-kv"><span className="zlm-kv-label">status</span><span className="zlm-kv-value">{ev.status}</span></div>
                          </div>
                        </Popover.Popup>
                      </Popover.Positioner>
                    </Popover.Portal>
                  </Popover.Root>
                ))}
              </div>
            </div>
          </aside>
        </main>
      </div>
    </Tooltip.Provider>
  );
}
