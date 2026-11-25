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
type WaveScope = 'full' | 'wave12' | 'wave1';

interface StageAttemptView {
  attemptId: string;
  stage: 'plan' | 'plan-review' | 'impl' | 'pr-review';
  model: string;
  effort: 'low' | 'medium' | 'high';
  duration: string;
  tokens: string;
  status: 'COMPLETED' | 'RUNNING' | 'FAILED';
  failureClass?: string;
  summary: string;
  audit: {
    turns: number;
    toolCalls: number;
    toolErrors: number;
    compileLoops: number;
    errorCode?: string;
  };
}

interface AiExplanation {
  updatedEpoch: number;
  model: string;
  taskGoal: string;
  agentActions: string;
  failureDiagnosis: string;
  optionGuide: { option: string; effect: string; recommended?: boolean }[];
}

interface CompactTask {
  id: string;
  repo: string;
  githubRepo: string;
  issueNumber: number;
  prNumber?: number;
  weight: 'XS' | 'S' | 'M' | 'L';
  status: TaskStatus;
  title: string;
  stageLabel: string;
  stages: [StageState, StageState, StageState, StageState];
  model: string;
  age: string;
  updatedEpoch: number;
  branch: string;
  objective: string;
  targetFiles: string[];
  approvedPlan?: string;
  lastCheckFailure?: string;
  attempts: StageAttemptView[];
  aiExplain: AiExplanation;
}

interface ClassifierBadge {
  tier: string;
  label: string;
  tone: 'ok' | 'info' | 'warn' | 'err';
}

interface PendingDecision {
  id: string;
  seq: number;
  kind: 'plan_approval' | 'merge_approval' | 'blocked_triage';
  taskId: string;
  weight: 'S' | 'M' | 'L';
  question: string;
  contextSummary: string;
  policyNote?: string;
  lastCheckFailure?: string;
  options: string[];
  recommendedOption: string;
  classifier: ClassifierBadge;
}

interface ResolvedDecisionRecord {
  id: string;
  seq: number;
  taskId: string;
  kind: string;
  choice: string;
  by: string;
  ago: string;
  note?: string;
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

const STAGE_NAMES = ['plan', 'plan-review', 'impl', 'pr-review'] as const;

const INITIAL_TASKS: CompactTask[] = [
  {
    id: 'BAL-055',
    repo: 'balance',
    githubRepo: 'shockerqt/balance',
    issueNumber: 115,
    prNumber: 209,
    weight: 'L',
    status: 'blocked',
    title: 'Store meal logs in per-month shards with safe migration',
    stageLabel: 'impl',
    stages: ['done', 'done', 'failed', 'pending'],
    model: 'hydro-hi',
    age: '2m',
    updatedEpoch: 1795648810,
    branch: 'task/BAL-055-month-shards',
    objective: 'Particionar el historial de comidas por mes (YYYY-MM) manteniendo migración idempotente y lectura perezosa sin pérdida en bordes horarios.',
    targetFiles: ['src/storage/monthShards.ts', 'src/storage/migration.ts', 'src/storage/monthShards.test.ts'],
    approvedPlan: 'Migrar logs legacy con bucketing por fecha local America/Santiago, verificar conteo total pre/post-migración y mantener fallback de solo lectura al monolito durante 1 versión.',
    lastCheckFailure: `$ npm test -- monthShards.test.ts
FAIL src/storage/monthShards.test.ts > preserves legacy entries across DST boundary
AssertionError: expected shard '2025-11' count 418 to equal 420 (2 entries without UTC offset fell into 'unknown-tz')
  at assertShardParity (src/storage/monthShards.test.ts:89:14)
exit_code=1 (systemd unit zach-check-BAL-055-impl-2.scope, 4.8s)`,
    attempts: [
      {
        attemptId: 'att-bal055-1',
        stage: 'plan',
        model: 'gemini-4-hydrogen-high',
        effort: 'high',
        duration: '48s',
        tokens: '34.2k in / 2.1k out',
        status: 'COMPLETED',
        summary: 'Diseñó esquema de shards YYYY-MM, invariante de paridad de conteo y plan de migración reversible.',
        audit: { turns: 6, toolCalls: 14, toolErrors: 0, compileLoops: 0 },
      },
      {
        attemptId: 'att-bal055-2',
        stage: 'plan-review',
        model: 'gpt-6.2-sol',
        effort: 'high',
        duration: '31s',
        tokens: '28.9k in / 1.4k out',
        status: 'COMPLETED',
        summary: 'APPROVED (AC-1..AC-4 PASS). Advirtió validar timestamps históricos de 2025 sin offset explícito.',
        audit: { turns: 4, toolCalls: 7, toolErrors: 0, compileLoops: 0 },
      },
      {
        attemptId: 'att-bal055-3',
        stage: 'impl',
        model: 'gemini-4-hydrogen-high',
        effort: 'high',
        duration: '3m 12s',
        tokens: '91.4k in / 6.8k out',
        status: 'FAILED',
        failureClass: 'semantic_check_failure',
        summary: 'Implementó particionado y migración, pero 2 registros legacy sin offset UTC quedaron en bucket unknown-tz al correr worker_checks.',
        audit: { turns: 15, toolCalls: 38, toolErrors: 1, compileLoops: 2, errorCode: 'WORKER_CHECKS_FAILED' },
      },
    ],
    aiExplain: {
      updatedEpoch: 1795648810,
      model: 'gemini-2.5-flash',
      taskGoal: 'Migrar el registro monolítico de comidas de Balance a archivos mensuales (YYYY-MM) garantizando cero pérdida de entradas históricas.',
      agentActions: 'El Planner (hydro-hi) y el Plan Reviewer (gpt-6.2-sol) aprobaron el diseño. El Implementer escribió monthShards.ts y migration.ts en 15 turnos, pero falló la prueba de paridad en bordes de cambio de hora (DST).',
      failureDiagnosis: 'Fallo semántico real en código (no es caída de red ni cuota): 2 registros de nov-2025 no traen offset UTC explícito y caen en unknown-tz (418 vs 420 esperados). Reintentar a ciegas sin nota repetirá el mismo error.',
      optionGuide: [
        {
          option: 'Retry w/ note',
          effect: 'Reabre impl en el mismo worktree inyectando tu nota (ej. "Asumir America/Santiago cuando falte offset UTC en registros pre-2026"). Recomendado si quieres que el agente lo corrija ya.',
          recommended: true,
        },
        {
          option: 'Retry fallback',
          effect: 'Reintenta impl cambiando de familia de modelo (gpt-6.2-sol high) sobre el estado actual del worktree.',
        },
        {
          option: 'Park Blocked',
          effect: 'Detiene la ejecución autónoma y mueve BAL-055 a Blocked para inspeccionar los datos reales manualmente.',
        },
      ],
    },
  },
  {
    id: 'INF-024',
    repo: 'infrastructure',
    githubRepo: 'shockerqt/infrastructure',
    issueNumber: 73,
    prNumber: 84,
    weight: 'L',
    status: 'blocked',
    title: 'Mock /proc in test-zach-web.py and streamline Zach release',
    stageLabel: 'pr-review',
    stages: ['done', 'done', 'done', 'failed'],
    model: 'hydro-hi',
    age: '6m',
    updatedEpoch: 1795648520,
    branch: 'task/INF-024-test-zach-web',
    objective: 'Desacoplar test-zach-web.py de /proc del host para que corra determinísticamente en contenedores CI sin procesos reales.',
    targetFiles: ['tests/test-zach-web.py', 'scripts/zach-release.py'],
    approvedPlan: 'Inyectar proc_root sintético mediante fixture temporal y validar PID/starttime sin leer /proc real.',
    lastCheckFailure: `AGY_QUOTA_EXHAUSTED: provider=GeminiAgy model=gemini-4-hydrogen-high HTTP 429 RESOURCE_EXHAUSTED (retry_after=180s) after auditing 2/3 diff hunks; worker_checks on SHA 4e91c02 passed (18/18 tests).`,
    attempts: [
      {
        attemptId: 'att-inf024-1',
        stage: 'impl',
        model: 'gpt-6.2-sol',
        effort: 'high',
        duration: '2m 04s',
        tokens: '62.0k in / 4.3k out',
        status: 'COMPLETED',
        summary: 'Agregó fixture proc_root en test-zach-web.py; 18/18 pruebas unitarias en verde en PR #84 (SHA 4e91c02).',
        audit: { turns: 9, toolCalls: 21, toolErrors: 0, compileLoops: 0 },
      },
      {
        attemptId: 'att-inf024-2',
        stage: 'pr-review',
        model: 'gemini-4-hydrogen-high',
        effort: 'high',
        duration: '19s',
        tokens: '19.4k in / 0.3k out',
        status: 'FAILED',
        failureClass: 'quota_exhausted',
        summary: 'Cortado por HTTP 429 RESOURCE_EXHAUSTED en familia GeminiAgy antes de emitir ReviewVerdict JSON.',
        audit: { turns: 2, toolCalls: 4, toolErrors: 1, compileLoops: 0, errorCode: 'AGY_QUOTA_EXHAUSTED' },
      },
    ],
    aiExplain: {
      updatedEpoch: 1795648520,
      model: 'gemini-2.5-flash',
      taskGoal: 'Aislar las lecturas de /proc en test-zach-web.py usando fixtures temporales para evitar falsos fallos en CI.',
      agentActions: 'impl terminó limpio en PR #84 con 18/18 tests pasando (SHA 4e91c02). El fallo ocurrió recién en pr-review al agotarse la cuota de gemini-4-hydrogen-high.',
      failureDiagnosis: 'Clasificado por gemini-decision-1 (confianza 0.97) como límite de cuota de proveedor, no defecto del PR. El código implementado ya pasó todos los checks locales.',
      optionGuide: [
        {
          option: 'Retry fallback',
          effect: 'Ejecuta pr-review inmediatamente con el modelo alternativo configurado (gpt-6.2-sol) sin esperar los 180s de cooldown de Hydrogen.',
          recommended: true,
        },
        {
          option: 'Retry stage',
          effect: 'Reencola pr-review en gemini-4-hydrogen-high una vez expire el cooldown del proveedor.',
        },
        {
          option: 'Park Blocked',
          effect: 'Pausa la tarea en Blocked conservando el PR #84 intacto.',
        },
      ],
    },
  },
  {
    id: 'ZACH-085',
    repo: 'zach',
    githubRepo: 'shockerqt/zach',
    issueNumber: 172,
    prNumber: 175,
    weight: 'L',
    status: 'merge',
    title: 'Implement compact high-density web UI based on /m/zach-compact',
    stageLabel: 'human-merge',
    stages: ['done', 'done', 'done', 'done'],
    model: 'sol-med',
    age: '9m',
    updatedEpoch: 1795648310,
    branch: 'task/ZACH-085-compact-web-ui',
    objective: 'Portar el diseño compacto de dos columnas a zach/web manteniendo SSE, auth, mascota y cero violaciones Axe.',
    targetFiles: ['web/src/main.tsx', 'web/src/style.css', 'web/src/tokens.css', 'web/tests/panel.spec.ts'],
    approvedPlan: 'Reemplazar tarjetas anchas por filas compactas, conservar selectores accesibles y validar Playwright + Axe en 3 viewports.',
    attempts: [
      {
        attemptId: 'att-zach085-1',
        stage: 'impl',
        model: 'gpt-6.2-sol',
        effort: 'medium',
        duration: '2m 41s',
        tokens: '74.1k in / 5.9k out',
        status: 'COMPLETED',
        summary: 'Actualizó main.tsx y style.css; vitest (26/26) y playwright + axe (10/10) en verde sobre SHA 8a4f2c1.',
        audit: { turns: 11, toolCalls: 26, toolErrors: 0, compileLoops: 1 },
      },
      {
        attemptId: 'att-zach085-2',
        stage: 'pr-review',
        model: 'gemini-4-hydrogen-high',
        effort: 'high',
        duration: '37s',
        tokens: '41.0k in / 1.6k out',
        status: 'COMPLETED',
        summary: 'APPROVED (AC-1..AC-5 PASS, 0 blocking findings) sobre PR #175 (SHA 8a4f2c1).',
        audit: { turns: 4, toolCalls: 9, toolErrors: 0, compileLoops: 0 },
      },
    ],
    aiExplain: {
      updatedEpoch: 1795648310,
      model: 'gemini-2.5-flash',
      taskGoal: 'Actualizar la consola web de Zach al layout compacto de alta densidad sin nuevas dependencias npm.',
      agentActions: 'Las 4 etapas finalizaron en verde. PR #175 pasó 26 tests unitarios, 10 tests e2e Playwright+Axe y CI exact-SHA en 8a4f2c1.',
      failureDiagnosis: 'No hay ningún error: la tarea es peso L y se detuvo en el gate determinístico obligatorio human-merge-approval antes de integrar a main.',
      optionGuide: [
        {
          option: 'Approve merge',
          effect: 'Autoriza a la cola de merge a hacer rebase/merge de PR #175 (SHA 8a4f2c1) en main y cerrar ZACH-085 al pasar CI post-merge.',
          recommended: true,
        },
        {
          option: 'Reject & rework',
          effect: 'Devuelve la tarea a impl adjuntando tu nota para ajustes visuales adicionales antes de mergear.',
        },
      ],
    },
  },
  {
    id: 'ZACH-058',
    repo: 'zach',
    githubRepo: 'shockerqt/zach',
    issueNumber: 126,
    prNumber: 173,
    weight: 'S',
    status: 'active',
    title: 'Sort Zach web pending decisions and tasks with newest first',
    stageLabel: 'impl',
    stages: ['done', 'done', 'running', 'pending'],
    model: 'sol-med',
    age: '1m',
    updatedEpoch: 1795648860,
    branch: 'task/ZACH-058-sort-zach-web',
    objective: 'Ordenar decisiones abiertas por created_seq DESC y tareas activas por updated_epoch DESC.',
    targetFiles: ['web/src/state.ts', 'web/src/core.test.ts'],
    attempts: [
      {
        attemptId: 'att-zach058-1',
        stage: 'impl',
        model: 'gpt-6.2-sol',
        effort: 'medium',
        duration: '52s (en curso)',
        tokens: '22.8k in / 1.9k out',
        status: 'RUNNING',
        summary: 'Ejecutando vitest tras añadir comparadores newest-first en state.ts.',
        audit: { turns: 5, toolCalls: 11, toolErrors: 0, compileLoops: 0 },
      },
    ],
    aiExplain: {
      updatedEpoch: 1795648860,
      model: 'gemini-2.5-flash',
      taskGoal: 'Mostrar primero las decisiones y tareas más recientes en la consola web.',
      agentActions: 'El worker gpt-6.2-sol lleva 52s en impl editando web/src/state.ts y corriendo vitest.',
      failureDiagnosis: 'Ejecución normal en curso; sin bloqueos ni errores de herramientas.',
      optionGuide: [],
    },
  },
  {
    id: 'BAL-053',
    repo: 'balance',
    githubRepo: 'shockerqt/balance',
    issueNumber: 113,
    weight: 'M',
    status: 'active',
    title: 'Project meal days lazily instead of converting whole history',
    stageLabel: 'plan',
    stages: ['running', 'pending', 'pending', 'pending'],
    model: 'sol-hi',
    age: '3m',
    updatedEpoch: 1795648700,
    branch: 'task/BAL-053-lazy-meal-days',
    objective: 'Evitar materializar todo el historial al abrir el diario; proyectar solo el rango visible.',
    targetFiles: ['src/diary/projectMealDays.ts', 'src/diary/useVisibleDays.ts'],
    attempts: [
      {
        attemptId: 'att-bal053-1',
        stage: 'plan',
        model: 'gpt-6.2-sol',
        effort: 'high',
        duration: '1m 15s (en curso)',
        tokens: '31.0k in / 1.1k out',
        status: 'RUNNING',
        summary: 'Inspeccionando consumidores de projectMealDays para acotar el Context Pack.',
        audit: { turns: 4, toolCalls: 9, toolErrors: 0, compileLoops: 0 },
      },
    ],
    aiExplain: {
      updatedEpoch: 1795648700,
      model: 'gemini-2.5-flash',
      taskGoal: 'Proyectar días del diario bajo demanda para reducir latencia inicial en historiales largos.',
      agentActions: 'Etapa plan en curso con gpt-6.2-sol (4 turnos, 0 errores).',
      failureDiagnosis: 'En progreso normal; no requiere intervención.',
      optionGuide: [],
    },
  },
  {
    id: 'GOV-069',
    repo: 'governance',
    githubRepo: 'shockerqt/workspace-governance',
    issueNumber: 301,
    prNumber: 329,
    weight: 'L',
    status: 'active',
    title: 'Verify Codex subagent bootstrap from the workspace root',
    stageLabel: 'pr-review',
    stages: ['done', 'done', 'done', 'running'],
    model: 'hydro-hi',
    age: '9m',
    updatedEpoch: 1795648300,
    branch: 'task/GOV-069-codex-bootstrap',
    objective: 'Verificar contratos de bootstrap de subagentes Codex lanzados desde /home/ubuntu/workspace.',
    targetFiles: ['bin/ws-preflight', 'contracts/stage-contract.yaml'],
    attempts: [
      {
        attemptId: 'att-gov069-1',
        stage: 'pr-review',
        model: 'gemini-4-hydrogen-high',
        effort: 'high',
        duration: '29s (en curso)',
        tokens: '27.4k in / 0.8k out',
        status: 'RUNNING',
        summary: 'Auditando hunks de PR #329 contra AC-1..AC-3.',
        audit: { turns: 3, toolCalls: 6, toolErrors: 0, compileLoops: 0 },
      },
    ],
    aiExplain: {
      updatedEpoch: 1795648300,
      model: 'gemini-2.5-flash',
      taskGoal: 'Garantizar que subagentes Codex hereden reglas y límites al iniciar en la raíz del workspace.',
      agentActions: 'impl completado; pr-review corriendo en PR #329.',
      failureDiagnosis: 'Sin fallos; al terminar pr-review abrirá merge_approval por ser peso L.',
      optionGuide: [],
    },
  },
  {
    id: 'ZACH-065',
    repo: 'zach',
    githubRepo: 'shockerqt/zach',
    issueNumber: 138,
    prNumber: 176,
    weight: 'S',
    status: 'merge',
    title: 'Allow Expand target_files decision and test-file tolerance',
    stageLabel: 'rebasing',
    stages: ['done', 'done', 'done', 'done'],
    model: 'sol-med',
    age: '18m',
    updatedEpoch: 1795647900,
    branch: 'task/ZACH-065-expand-target',
    objective: 'Permitir expandir target_files mediante decisión cuando un worker toca un test colateral legítimo.',
    targetFiles: ['src/v2/coordinator.rs', 'src/v2/pipeline.rs'],
    attempts: [
      {
        attemptId: 'att-zach065-1',
        stage: 'impl',
        model: 'gpt-6.2-sol',
        effort: 'medium',
        duration: '3m 05s',
        tokens: '83.2k in / 4.7k out',
        status: 'COMPLETED',
        summary: 'Añadió opción Expand target_files y tolerancia para *_test.rs / *.test.ts.',
        audit: { turns: 10, toolCalls: 24, toolErrors: 0, compileLoops: 1 },
      },
    ],
    aiExplain: {
      updatedEpoch: 1795647900,
      model: 'gemini-2.5-flash',
      taskGoal: 'Evitar rechazos rígidos cuando impl solo agrega pruebas unitarias junto al archivo objetivo.',
      agentActions: 'impl y pr-review aprobados; actualmente haciendo rebase automático sobre origin/main en merge_queue.',
      failureDiagnosis: 'En cola de merge automática (peso S no requiere gate humano).',
      optionGuide: [],
    },
  },
  {
    id: 'ZACH-066',
    repo: 'zach',
    githubRepo: 'shockerqt/zach',
    issueNumber: 139,
    weight: 'S',
    status: 'queued',
    title: 'Capture failing command stdout/stderr in run_checks',
    stageLabel: 'ready',
    stages: ['pending', 'pending', 'pending', 'pending'],
    model: '—',
    age: '22m',
    updatedEpoch: 1795647600,
    branch: 'task/ZACH-066-run-checks',
    objective: 'Incluir stdout/stderr acotado del comando fallido en last_check_failure en vez de solo el trailer de systemd-run.',
    targetFiles: ['src/v2/runner.rs'],
    attempts: [],
    aiExplain: {
      updatedEpoch: 1795647600,
      model: 'gemini-2.5-flash',
      taskGoal: 'Capturar la salida real de tests/compilador cuando falla run_checks en runner.rs.',
      agentActions: 'En cola (Ready), esperando slot libre de worker.',
      failureDiagnosis: 'Aún no iniciada.',
      optionGuide: [],
    },
  },
  {
    id: 'ZACH-073',
    repo: 'zach',
    githubRepo: 'shockerqt/zach',
    issueNumber: 147,
    weight: 'M',
    status: 'queued',
    title: 'Add 3-tier Gemini Decision 1 classifier and recommended_option',
    stageLabel: 'ready',
    stages: ['pending', 'pending', 'pending', 'pending'],
    model: '—',
    age: '25m',
    updatedEpoch: 1795647400,
    branch: 'task/ZACH-073-gemini-decision-1',
    objective: 'Clasificar fallos ambiguos con Tier 1 determinístico, Tier 2 gemini-decision-1 (0 output tokens) y Tier 3 heurístico, poblando recommended_option.',
    targetFiles: ['src/v2/gemini.rs', 'src/v2/pipeline.rs', 'src/v2/coordinator.rs'],
    attempts: [],
    aiExplain: {
      updatedEpoch: 1795647400,
      model: 'gemini-2.5-flash',
      taskGoal: 'Integrar clasificador de 3 niveles con gemini-decision-1 y resaltar la opción recomendada en decisiones humanas.',
      agentActions: 'En cola (Ready).',
      failureDiagnosis: 'Aún no iniciada.',
      optionGuide: [],
    },
  },
  {
    id: 'GOV-077',
    repo: 'governance',
    githubRepo: 'shockerqt/workspace-governance',
    issueNumber: 320,
    weight: 'S',
    status: 'queued',
    title: 'Align Claude governance subagent tool lists with exposed tools',
    stageLabel: 'ready',
    stages: ['pending', 'pending', 'pending', 'pending'],
    model: '—',
    age: '31m',
    updatedEpoch: 1795647000,
    branch: 'task/GOV-077-claude-tools',
    objective: 'Sincronizar nombres de herramientas declaradas en .claude/skills con las expuestas en sesión.',
    targetFiles: ['.agents/skills/governance-planner/SKILL.md'],
    attempts: [],
    aiExplain: {
      updatedEpoch: 1795647000,
      model: 'gemini-2.5-flash',
      taskGoal: 'Alinear listas de tools de subagentes Claude con el runtime.',
      agentActions: 'En cola (Ready).',
      failureDiagnosis: 'Aún no iniciada.',
      optionGuide: [],
    },
  },
  {
    id: 'ZACH-057',
    repo: 'zach',
    githubRepo: 'shockerqt/zach',
    issueNumber: 123,
    prNumber: 125,
    weight: 'M',
    status: 'done',
    title: 'Switch default router models to hydrogen and add router.json',
    stageLabel: 'merged',
    stages: ['done', 'done', 'done', 'done'],
    model: 'hydro-hi',
    age: '2h',
    updatedEpoch: 1795641600,
    branch: 'task/ZACH-057-router-json',
    objective: 'Externalizar tabla de ruteo por peso/etapa a config/router.json con recarga en caliente.',
    targetFiles: ['config/router.json', 'src/v2/router.rs'],
    attempts: [
      {
        attemptId: 'att-zach057-1',
        stage: 'impl',
        model: 'gemini-4-hydrogen-high',
        effort: 'high',
        duration: '2m 18s',
        tokens: '58.3k in / 3.9k out',
        status: 'COMPLETED',
        summary: 'Implementó config/router.json y subcomando reload-config; PR #125 mergeado.',
        audit: { turns: 8, toolCalls: 19, toolErrors: 0, compileLoops: 0 },
      },
    ],
    aiExplain: {
      updatedEpoch: 1795641600,
      model: 'gemini-2.5-flash',
      taskGoal: 'Configurar ruteo declarativo de modelos en router.json.',
      agentActions: 'Completada e integrada en PR #125 con retro=clean.',
      failureDiagnosis: 'Cerrada exitosamente.',
      optionGuide: [],
    },
  },
];

const INITIAL_DECISIONS: PendingDecision[] = [
  {
    id: 'dec-905',
    seq: 905,
    kind: 'blocked_triage',
    taskId: 'BAL-055',
    weight: 'L',
    question: 'BAL-055 failed; choose how to proceed',
    contextSummary:
      'Stage impl failed worker_checks (attempt 2/2): monthShards.test.ts failed parity assertion — 2 legacy 2025-11 entries without explicit UTC offset landed in bucket "unknown-tz" instead of "2025-11".',
    lastCheckFailure: `$ npm test -- monthShards.test.ts
AssertionError: expected shard '2025-11' count 418 to equal 420 (2 entries without UTC offset fell into 'unknown-tz')
  at assertShardParity (src/storage/monthShards.test.ts:89:14) · exit_code=1`,
    options: ['Retry w/ note', 'Retry fallback', 'Park Blocked'],
    recommendedOption: 'Retry w/ note',
    classifier: {
      tier: 'tier2:decision-1',
      label: 'semantic_defect · 0.93',
      tone: 'err',
    },
  },
  {
    id: 'dec-904',
    seq: 904,
    kind: 'blocked_triage',
    taskId: 'INF-024',
    weight: 'L',
    question: 'INF-024 failed; choose how to proceed',
    contextSummary:
      'Stage pr-review aborted on HTTP 429 RESOURCE_EXHAUSTED (gemini-4-hydrogen-high) after auditing 2/3 hunks. impl checks on PR #84 (SHA 4e91c02) are 18/18 green.',
    lastCheckFailure:
      'AGY_QUOTA_EXHAUSTED: family=GeminiAgy model=gemini-4-hydrogen-high retry_after=180s (0 code defects reported)',
    options: ['Retry fallback', 'Retry stage', 'Park Blocked'],
    recommendedOption: 'Retry fallback',
    classifier: {
      tier: 'tier2:decision-1',
      label: 'quota_limit · 0.97',
      tone: 'warn',
    },
  },
  {
    id: 'dec-903',
    seq: 903,
    kind: 'merge_approval',
    taskId: 'ZACH-085',
    weight: 'L',
    question: 'Approve merge to main for ZACH-085 (SHA 8a4f2c1)?',
    contextSummary:
      'All 4 stages completed (pr-review APPROVED, 0 blocking findings). Exact-SHA CI green on PR #175 (26 vitest + 10 Playwright/Axe checks).',
    policyNote: 'Política Weight L · Requiere aprobación humana explícita antes de entrar a merge_queue.',
    options: ['Approve merge', 'Reject & rework'],
    recommendedOption: 'Approve merge',
    classifier: {
      tier: 'tier1:policy',
      label: 'human_merge_gate',
      tone: 'info',
    },
  },
];

const INITIAL_HISTORY: ResolvedDecisionRecord[] = [
  {
    id: 'dec-899',
    seq: 899,
    taskId: 'BAL-055',
    kind: 'plan_approval',
    choice: 'Approve plan',
    by: 'shocker',
    ago: '14m',
    note: 'Validar conteo total antes de borrar monolito',
  },
  {
    id: 'dec-896',
    seq: 896,
    taskId: 'ZACH-085',
    kind: 'plan_approval',
    choice: 'Approve plan',
    by: 'shocker',
    ago: '38m',
  },
];

const MERGE_QUEUE: MergeItem[] = [
  { taskId: 'ZACH-085', repo: 'zach', phase: 'awaiting_human_merge', sha: '8a4f2c1' },
  { taskId: 'ZACH-065', repo: 'zach', phase: 'rebasing_on_main', sha: '3d91e0b' },
];

const INITIAL_EVENTS: FeedEvent[] = [
  { seq: 2594, time: '23:34:12', type: 'DECISION_REQUIRED', tone: 'err', taskId: 'BAL-055', detail: 'blocked_triage #905 (decision-1: semantic 0.93)' },
  { seq: 2593, time: '23:34:09', type: 'STAGE_FAILED', tone: 'err', taskId: 'BAL-055', detail: 'impl checks failed: monthShards.test.ts:89' },
  { seq: 2592, time: '23:31:48', type: 'DECISION_REQUIRED', tone: 'warn', taskId: 'INF-024', detail: 'blocked_triage #904 (decision-1: quota 0.97 -> fallback)' },
  { seq: 2591, time: '23:31:45', type: 'PROVIDER_COOLDOWN', tone: 'warn', taskId: 'INF-024', detail: 'GeminiAgy 429 cooldown=180s' },
  { seq: 2590, time: '23:28:40', type: 'DECISION_REQUIRED', tone: 'info', taskId: 'ZACH-085', detail: 'merge_approval #903 queued (SHA 8a4f2c1)' },
  { seq: 2589, time: '23:28:12', type: 'STAGE_COMPLETED', tone: 'ok', taskId: 'ZACH-085', detail: 'pr-review APPROVED (hydro-hi)' },
  { seq: 2587, time: '23:26:03', type: 'STAGE_STARTED', tone: 'info', taskId: 'ZACH-058', detail: 'impl started (gpt-6.2-sol medium)' },
  { seq: 2584, time: '23:24:30', type: 'CI_PASSED', tone: 'ok', taskId: 'ZACH-085', detail: 'exact-SHA 8a4f2c1 green (42s)' },
  { seq: 2583, time: '23:20:55', type: 'MERGE_CHECKPOINT', tone: 'info', taskId: 'ZACH-065', detail: 'rebasing on origin/main' },
  { seq: 2580, time: '23:18:22', type: 'STAGE_STARTED', tone: 'info', taskId: 'GOV-069', detail: 'pr-review started (hydro-hi)' },
  { seq: 2575, time: '23:12:50', type: 'HEARTBEAT', tone: 'ok', taskId: 'DAEMON', detail: 'sse=connected workers=3/4 explain_cache=2' },
  { seq: 2574, time: '23:10:02', type: 'MERGE_COMPLETED', tone: 'ok', taskId: 'ZACH-057', detail: 'merged PR #125 -> main (retro=clean)' },
];

export function ZachCompactPanel() {
  const [tasks] = useState<CompactTask[]>(INITIAL_TASKS);
  const [decisions, setDecisions] = useState<PendingDecision[]>(INITIAL_DECISIONS);
  const [history, setHistory] = useState<ResolvedDecisionRecord[]>(INITIAL_HISTORY);
  const [events, setEvents] = useState<FeedEvent[]>(INITIAL_EVENTS);
  const [waveScope, setWaveScope] = useState<WaveScope>('full');
  const [ultraDense, setUltraDense] = useState(false);
  const [paused, setPaused] = useState(false);
  const [query, setQuery] = useState('');
  const [repoFilter, setRepoFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('all');
  const [eventFilter, setEventFilter] = useState<'ALL' | 'STAGE' | 'DECISION' | 'ERR'>('ALL');

  const [selectedTask, setSelectedTask] = useState<CompactTask | null>(null);
  const [dialogTab, setDialogTab] = useState<'overview' | 'attempts' | 'explain'>('overview');

  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});
  const [expandedExplain, setExpandedExplain] = useState<Record<string, boolean>>({ 'dec-905': true });
  const [loadingExplain, setLoadingExplain] = useState<Record<string, boolean>>({});
  const [cachedExplainTasks, setCachedExplainTasks] = useState<Record<string, number>>({
    'BAL-055': 1,
  });
  const [noteByDecision, setNoteByDecision] = useState<Record<string, string>>({});

  const taskById = useMemo(() => {
    const map: Record<string, CompactTask> = {};
    for (const t of tasks) map[t.id] = t;
    return map;
  }, [tasks]);

  const counts = useMemo(
    () => ({
      all: tasks.length,
      active: tasks.filter((t) => t.status === 'active').length,
      queued: tasks.filter((t) => t.status === 'queued').length,
      blocked: tasks.filter((t) => t.status === 'blocked').length,
      merge: tasks.filter((t) => t.status === 'merge').length,
    }),
    [tasks],
  );

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

  function openTaskModal(task: CompactTask, initialTab: 'overview' | 'attempts' | 'explain' = 'overview') {
    const safeTab =
      initialTab === 'explain' && waveScope !== 'full'
        ? 'overview'
        : initialTab === 'attempts' && waveScope === 'wave1'
          ? 'overview'
          : initialTab;
    setSelectedTask(task);
    setDialogTab(safeTab);
    if (safeTab === 'explain' && !cachedExplainTasks[task.id]) {
      triggerExplainGeneration(task.id);
    }
  }

  function triggerExplainGeneration(taskId: string, forceRefresh = false) {
    if (cachedExplainTasks[taskId] && !forceRefresh) return;
    setLoadingExplain((prev) => ({ ...prev, [taskId]: true }));
    window.setTimeout(() => {
      setLoadingExplain((prev) => ({ ...prev, [taskId]: false }));
      setCachedExplainTasks((prev) => ({ ...prev, [taskId]: (prev[taskId] ?? 0) + 1 }));
    }, 320);
  }

  function toggleDecisionExplain(d: PendingDecision) {
    const nextOpen = !expandedExplain[d.id];
    setExpandedExplain((prev) => ({ ...prev, [d.id]: nextOpen }));
    if (nextOpen) {
      triggerExplainGeneration(d.taskId, false);
    }
  }

  function resolveDecision(d: PendingDecision, choice: string) {
    const note = (noteByDecision[d.id] ?? '').trim();
    setDecisions((prev) => prev.filter((item) => item.id !== d.id));
    setHistory((prev) => [
      {
        id: d.id,
        seq: d.seq,
        taskId: d.taskId,
        kind: d.kind,
        choice,
        by: 'shocker',
        ago: 'ahora',
        note: note || undefined,
      },
      ...prev,
    ]);
    const now = new Date().toTimeString().slice(0, 8);
    setEvents((prev) => [
      {
        seq: prev[0].seq + 1,
        time: now,
        type: 'DECISION_RESOLVED',
        tone: choice.toLowerCase().includes('reject') || choice.toLowerCase().includes('park') ? 'warn' : 'ok',
        taskId: d.taskId,
        detail: `${choice} #${d.seq}${note ? ` ("${note}")` : ''}`,
      },
      ...prev,
    ]);
    setNoteByDecision((prev) => ({ ...prev, [d.id]: '' }));
  }

  function resetDemoDecisions() {
    setDecisions(INITIAL_DECISIONS);
    setExpandedExplain({ 'dec-905': true });
  }

  const showAttemptsWave = waveScope === 'wave12' || waveScope === 'full';
  const showAiWave = waveScope === 'full';

  return (
    <Tooltip.Provider delay={220}>
      <div className="zcp2-root" data-density={ultraDense ? 'ultra' : 'compact'}>
        {/* Top Command & Health Bar */}
        <header className="zcp2-topbar">
          <div className="zcp2-brand">
            <ZachCat mood={mood} size={24} />
            <span className="zcp2-title">Zach Console</span>
            <span className={`zcp2-pill ${paused ? '' : 'is-live'}`}>
              <span className="zcp2-dot" />
              {paused ? 'PAUSED' : 'SSE LIVE · 4s'}
            </span>
          </div>

          <div className="zcp2-kpis">
            {(
              [
                ['active', 'Active', counts.active],
                ['queued', 'Queued', counts.queued],
                ['blocked', 'Blocked', counts.blocked],
                ['merge', 'Merge', counts.merge],
              ] as const
            ).map(([key, label, num]) => (
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

          {/* Interactive Scope Switcher to preview each proposed wave */}
          <div className="zcp2-wave-bar" role="group" aria-label="Alcance de olas propuesto">
            <span className="zcp2-wave-label zcp2-mono">Alcance UI:</span>
            {(
              [
                ['wave1', 'Ola 1 · Contexto'],
                ['wave12', '+Ola 2 · Intentos/Audit'],
                ['full', '+Ola 3 · Gemini + Decision-1'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className="zcp2-wave-btn"
                data-selected={waveScope === id}
                onClick={() => setWaveScope(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="zcp2-controls">
            <input
              type="search"
              className="zcp2-search zcp2-mono"
              placeholder="Filtrar tarea, repo, evento..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="zcp2-select"
              aria-label="Filtrar repositorio"
              value={repoFilter}
              onChange={(e) => setRepoFilter(e.target.value)}
            >
              <option value="all">Todos los repos</option>
              <option value="zach">zach</option>
              <option value="balance">balance</option>
              <option value="governance">governance</option>
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
          {/* Left Pane: Enriched Pending Decisions + Dense Task Table */}
          <section className="zcp2-col" aria-label="Decisions and Tasks">
            <div className="zcp2-sec-head">
              <span className="zcp2-sec-title">
                Decisiones pendientes (Newest First)
                <span className="zcp2-count">{decisions.length}</span>
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {decisions.length < INITIAL_DECISIONS.length && (
                  <button type="button" className="zcp2-btn" onClick={resetDemoDecisions}>
                    Restaurar demo ({INITIAL_DECISIONS.length})
                  </button>
                )}
                <span className="zcp2-mono" style={{ color: 'var(--z2-faint)', fontSize: 10 }}>
                  {showAiWave
                    ? 'context_summary + ZACH-066 stderr + ZACH-073 recommended + Gemini explain'
                    : showAttemptsWave
                      ? 'context_summary + ZACH-066 stderr + historial de intentos'
                      : 'context_summary + ZACH-066 stderr + links PR/Issue'}
                </span>
              </div>
            </div>

            {decisions.length > 0 ? (
              <div className="zcp2-decisions">
                {decisions.map((d) => {
                  const task = taskById[d.taskId];
                  const logOpen = !!expandedLogs[d.id];
                  const explainOpen = showAiWave && !!expandedExplain[d.id];
                  const isGenerating = !!loadingExplain[d.taskId];
                  const noteValue = noteByDecision[d.id] ?? '';

                  return (
                    <article key={d.id} className="zcp2-dec-card">
                      {/* Row 1: Identity, question, classifier chip, external links, and action buttons */}
                      <div className="zcp2-dec-top">
                        <span className="zcp2-dec-kind zcp2-mono">{d.kind}</span>
                        <button
                          type="button"
                          className="zcp2-dec-taskbtn zcp2-mono"
                          onClick={() => task && openTaskModal(task, showAttemptsWave ? 'attempts' : 'overview')}
                          title="Abrir detalle e intentos de la tarea"
                        >
                          {d.taskId}·{d.weight}
                        </button>
                        <span className="zcp2-dec-q" title={d.question}>
                          {d.question}
                        </span>

                        {showAiWave && (
                          <Tooltip.Root>
                            <Tooltip.Trigger
                              className={`zcp2-classifier-chip zcp2-mono is-${d.classifier.tone}`}
                            >
                              {d.classifier.tier} · {d.classifier.label}
                            </Tooltip.Trigger>
                            <Tooltip.Portal>
                              <Tooltip.Positioner sideOffset={6}>
                                <Tooltip.Popup className="zcp2-tooltip">
                                  ZACH-073 (3-Tier Classifier): clasifica el fallo con 0 tokens de salida y marca con ★ la opción recomendada.
                                </Tooltip.Popup>
                              </Tooltip.Positioner>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        )}

                        <div className="zcp2-dec-links zcp2-mono">
                          {task && (
                            <a
                              className="zcp2-ext-link"
                              href={`https://github.com/${task.githubRepo}/issues/${task.issueNumber}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              Issue #{task.issueNumber} ↗
                            </a>
                          )}
                          {task?.prNumber && (
                            <a
                              className="zcp2-ext-link"
                              href={`https://github.com/${task.githubRepo}/pull/${task.prNumber}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              PR #{task.prNumber} ↗
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Row 2: Deterministic context_summary + policy note (Wave 1 — always visible!) */}
                      <div className="zcp2-dec-context">
                        <p className="zcp2-dec-summary">{d.contextSummary}</p>
                        {d.policyNote && (
                          <div className="zcp2-policy-note zcp2-mono">{d.policyNote}</div>
                        )}
                      </div>

                      {/* Collapsible ZACH-066 check stdout/stderr */}
                      {d.lastCheckFailure && logOpen && (
                        <pre className="zcp2-check-pre zcp2-mono">{d.lastCheckFailure}</pre>
                      )}

                      {/* Collapsible Wave 3 On-Demand Gemini Explanation */}
                      {explainOpen && task && (
                        <div className="zcp2-ai-box" role="region" aria-label={`Explicación IA ${d.taskId}`}>
                          <div className="zcp2-ai-head">
                            <span className="zcp2-ai-title">
                              ✦ Síntesis Gemini ({task.aiExplain.model}) · solo lectura
                            </span>
                            <div className="zcp2-ai-meta zcp2-mono">
                              <span>
                                {isGenerating
                                  ? 'Generando síntesis...'
                                  : `caché (${task.id}, epoch ${task.aiExplain.updatedEpoch}) · 0 tok extra`}
                              </span>
                              <button
                                type="button"
                                className="zcp2-link-btn zcp2-mono"
                                disabled={isGenerating}
                                onClick={() => triggerExplainGeneration(task.id, true)}
                              >
                                ↻ Regenerar
                              </button>
                              {showAttemptsWave && (
                                <button
                                  type="button"
                                  className="zcp2-link-btn zcp2-mono"
                                  onClick={() => openTaskModal(task, 'attempts')}
                                >
                                  Ver {task.attempts.length} intentos →
                                </button>
                              )}
                            </div>
                          </div>

                          {isGenerating ? (
                            <div className="zcp2-ai-loading zcp2-mono">
                              Consultando POST /api/tasks/{task.id}/explain con resúmenes redactados de intentos y auditoría...
                            </div>
                          ) : (
                            <div className="zcp2-ai-grid">
                              <div>
                                <span className="zcp2-ai-k">1. Qué pide la tarea</span>
                                <p>{task.aiExplain.taskGoal}</p>
                              </div>
                              <div>
                                <span className="zcp2-ai-k">2. Qué hicieron los agentes</span>
                                <p>{task.aiExplain.agentActions}</p>
                              </div>
                              <div>
                                <span className="zcp2-ai-k">3. Diagnóstico del bloqueo</span>
                                <p>{task.aiExplain.failureDiagnosis}</p>
                              </div>
                              <div>
                                <span className="zcp2-ai-k">4. Qué hace cada botón</span>
                                <ul className="zcp2-ai-options">
                                  {task.aiExplain.optionGuide.map((og) => (
                                    <li key={og.option}>
                                      <strong className="zcp2-mono">
                                        {og.recommended ? '★ ' : ''}
                                        {og.option}:
                                      </strong>{' '}
                                      {og.effect}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Row 3: Compact Diagnostics Triggers + Note + Real Decision Option Buttons */}
                      <div className="zcp2-dec-footer">
                        <div className="zcp2-dec-tools">
                          {d.lastCheckFailure && (
                            <button
                              type="button"
                              className="zcp2-btn zcp2-btn-ghost zcp2-mono"
                              onClick={() =>
                                setExpandedLogs((prev) => ({ ...prev, [d.id]: !prev[d.id] }))
                              }
                            >
                              {logOpen ? '▾ Ocultar stderr check' : '▸ Ver stderr check (ZACH-066)'}
                            </button>
                          )}
                          {showAttemptsWave && task && (
                            <button
                              type="button"
                              className="zcp2-btn zcp2-btn-ghost zcp2-mono"
                              onClick={() => openTaskModal(task, 'attempts')}
                            >
                              Intentos ({task.attempts.length})
                            </button>
                          )}
                          {showAiWave && (
                            <button
                              type="button"
                              className={`zcp2-btn zcp2-btn-ai ${explainOpen ? 'is-open' : ''}`}
                              onClick={() => toggleDecisionExplain(d)}
                            >
                              {explainOpen ? '✦ Ocultar explicación' : '✦ Explicar con IA'}
                            </button>
                          )}
                        </div>

                        <div className="zcp2-dec-actions">
                          <input
                            type="text"
                            className="zcp2-inline-note"
                            placeholder="Nota opcional para el worker..."
                            aria-label={`Nota opcional para ${d.taskId}`}
                            value={noteValue}
                            onChange={(e) =>
                              setNoteByDecision((prev) => ({ ...prev, [d.id]: e.target.value }))
                            }
                          />
                          {d.options.map((opt) => {
                            const isRec = showAiWave && opt === d.recommendedOption;
                            const isNegative =
                              opt.toLowerCase().includes('reject') ||
                              opt.toLowerCase().includes('park');
                            return (
                              <button
                                key={opt}
                                type="button"
                                className={`zcp2-btn ${
                                  isRec
                                    ? 'zcp2-btn-rec'
                                    : isNegative
                                      ? 'zcp2-btn-err'
                                      : 'zcp2-btn-ok'
                                }`}
                                onClick={() => resolveDecision(d, opt)}
                              >
                                {isRec ? `★ ${opt}` : opt}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div
                style={{
                  padding: '6px 10px',
                  color: 'var(--z2-faint)',
                  borderBottom: '1px solid var(--z2-border)',
                  fontSize: 11,
                }}
              >
                Sin decisiones pendientes.{' '}
                <button type="button" className="zcp2-link-btn" onClick={resetDemoDecisions}>
                  Restaurar escenarios de ejemplo
                </button>
              </div>
            )}

            <Tabs.Root
              className="zcp2-tabs-root"
              value={activeTab}
              onValueChange={(val) => setActiveTab(String(val))}
            >
              <Tabs.List className="zcp2-tabs-list">
                <Tabs.Tab className="zcp2-tab" value="all">
                  All ({counts.all})
                </Tabs.Tab>
                <Tabs.Tab className="zcp2-tab" value="active">
                  Active ({counts.active})
                </Tabs.Tab>
                <Tabs.Tab className="zcp2-tab" value="queued">
                  Queued ({counts.queued})
                </Tabs.Tab>
                <Tabs.Tab className="zcp2-tab" value="blocked">
                  Blocked ({counts.blocked})
                </Tabs.Tab>
                <Tabs.Tab className="zcp2-tab" value="merge">
                  Merge ({counts.merge})
                </Tabs.Tab>
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
                    onClick={() => openTaskModal(t, 'overview')}
                    onKeyDown={(e) => e.key === 'Enter' && openTaskModal(t, 'overview')}
                  >
                    <span className="zcp2-task-id zcp2-mono">
                      <span className={`zcp2-status-dot is-${t.status}`} />
                      {t.id}
                    </span>
                    <span className="zcp2-repo zcp2-mono">{t.repo}</span>
                    <span className="zcp2-weight zcp2-mono">{t.weight}</span>
                    <Tooltip.Root>
                      <Tooltip.Trigger
                        className="zcp2-task-title"
                        style={{
                          textAlign: 'left',
                          background: 'none',
                          border: 'none',
                          padding: 0,
                          cursor: 'pointer',
                          font: 'inherit',
                        }}
                      >
                        {t.title}
                      </Tooltip.Trigger>
                      <Tooltip.Portal>
                        <Tooltip.Positioner sideOffset={6}>
                          <Tooltip.Popup className="zcp2-tooltip">
                            {t.title} · clic para ver Context Pack, intentos y explicación IA
                          </Tooltip.Popup>
                        </Tooltip.Positioner>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                    <span className="zcp2-pipeline" aria-label={`Stage ${t.stageLabel}`}>
                      {t.stages.map((st, idx) => (
                        <span key={idx} className={`zcp2-pip is-${st}`} title={`${STAGE_NAMES[idx]}: ${st}`} />
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
              <Popover.Root>
                <Popover.Trigger className="zcp2-btn zcp2-btn-ghost zcp2-mono">
                  Decisiones resueltas ({history.length})
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Positioner sideOffset={6} align="end">
                    <Popover.Popup className="zcp2-popover">
                      <div style={{ fontWeight: 700, fontSize: 11, marginBottom: 6 }}>
                        Historial reciente de decisiones
                      </div>
                      {history.map((h) => (
                        <div key={`${h.id}-${h.ago}`} className="zcp2-hist-item zcp2-mono">
                          <div>
                            <strong>{h.taskId}</strong> · {h.choice}{' '}
                            <span style={{ color: 'var(--z2-faint)' }}>({h.ago})</span>
                          </div>
                          {h.note && <div style={{ color: 'var(--z2-muted)' }}>“{h.note}”</div>}
                        </div>
                      ))}
                    </Popover.Popup>
                  </Popover.Positioner>
                </Popover.Portal>
              </Popover.Root>
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

        {/* Enriched Task Detail Dialog (Waves 1, 2, and 3) */}
        <Dialog.Root open={!!selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)}>
          <Dialog.Portal>
            <Dialog.Backdrop className="zcp2-dialog-backdrop" />
            <Dialog.Popup className="zcp2-dialog-popup">
              {selectedTask && (
                <>
                  <div className="zcp2-dialog-head">
                    <div>
                      <div
                        className="zcp2-mono"
                        style={{
                          color: 'var(--z2-accent)',
                          fontSize: 11,
                          display: 'flex',
                          gap: 8,
                          alignItems: 'center',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>
                          {selectedTask.id} · {selectedTask.repo} · Peso {selectedTask.weight}
                        </span>
                        <a
                          className="zcp2-ext-link"
                          href={`https://github.com/${selectedTask.githubRepo}/issues/${selectedTask.issueNumber}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Issue #{selectedTask.issueNumber} ↗
                        </a>
                        {selectedTask.prNumber && (
                          <a
                            className="zcp2-ext-link"
                            href={`https://github.com/${selectedTask.githubRepo}/pull/${selectedTask.prNumber}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            PR #{selectedTask.prNumber} ↗
                          </a>
                        )}
                      </div>
                      <Dialog.Title style={{ fontSize: 15, fontWeight: 700, marginTop: 3 }}>
                        {selectedTask.title}
                      </Dialog.Title>
                    </div>
                    <Dialog.Close className="zcp2-btn">Cerrar</Dialog.Close>
                  </div>

                  <Dialog.Description className="zcp2-sr-only">
                    Diagnóstico detallado, historial de intentos por etapa y explicación asistida para {selectedTask.id}.
                  </Dialog.Description>

                  {/* Visual Stage Pipeline Strip */}
                  <div className="zcp2-stage-strip zcp2-mono">
                    {STAGE_NAMES.map((stageName, i) => {
                      const st = selectedTask.stages[i];
                      return (
                        <div key={stageName} className={`zcp2-stage-pill is-${st}`}>
                          <span className={`zcp2-pip is-${st}`} />
                          <span>{stageName}</span>
                          <span className="zcp2-stage-st">{st}</span>
                        </div>
                      );
                    })}
                  </div>

                  <Tabs.Root
                    className="zcp2-modal-tabs"
                    value={dialogTab}
                    onValueChange={(val) => {
                      const next = val as 'overview' | 'attempts' | 'explain';
                      setDialogTab(next);
                      if (next === 'explain') {
                        triggerExplainGeneration(selectedTask.id, false);
                      }
                    }}
                  >
                    <Tabs.List className="zcp2-tabs-list">
                      <Tabs.Tab className="zcp2-tab" value="overview">
                        Resumen & Context Pack
                      </Tabs.Tab>
                      {showAttemptsWave && (
                        <Tabs.Tab className="zcp2-tab" value="attempts">
                          Intentos & Auditoría ({selectedTask.attempts.length})
                        </Tabs.Tab>
                      )}
                      {showAiWave && (
                        <Tabs.Tab className="zcp2-tab" value="explain">
                          ✦ Explicar con Gemini
                        </Tabs.Tab>
                      )}
                    </Tabs.List>

                    {/* Tab 1: Overview, Context Pack, Approved Plan, and Last Check Failure */}
                    <Tabs.Panel className="zcp2-modal-panel" value="overview">
                      <div className="zcp2-dialog-meta zcp2-mono">
                        <div>Estado: {selectedTask.status}</div>
                        <div>Etapa actual: {selectedTask.stageLabel}</div>
                        <div>Modelo activo: {selectedTask.model}</div>
                        <div>Actualizado: hace {selectedTask.age}</div>
                        <div style={{ gridColumn: '1 / -1' }}>Branch: {selectedTask.branch}</div>
                      </div>

                      <div className="zcp2-detail-block">
                        <div className="zcp2-detail-label">Objetivo (Context Pack)</div>
                        <p className="zcp2-detail-text">{selectedTask.objective}</p>
                        <div className="zcp2-file-chips zcp2-mono">
                          {selectedTask.targetFiles.map((f) => (
                            <span key={f} className="zcp2-file-chip">
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>

                      {selectedTask.approvedPlan && (
                        <div className="zcp2-detail-block">
                          <div className="zcp2-detail-label">Plan aprobado (memory.approved_plan)</div>
                          <p className="zcp2-detail-text">{selectedTask.approvedPlan}</p>
                        </div>
                      )}

                      {selectedTask.lastCheckFailure && (
                        <div className="zcp2-detail-block">
                          <div className="zcp2-detail-label" style={{ color: 'var(--z2-err)' }}>
                            Último fallo de verificación (memory.last_check_failure · ZACH-066)
                          </div>
                          <pre className="zcp2-check-pre zcp2-mono">{selectedTask.lastCheckFailure}</pre>
                        </div>
                      )}
                    </Tabs.Panel>

                    {/* Tab 2: SQLite stage_attempts + attempt_audits (Wave 2) */}
                    {showAttemptsWave && (
                      <Tabs.Panel className="zcp2-modal-panel" value="attempts">
                        <div className="zcp2-mono" style={{ fontSize: 10.5, color: 'var(--z2-faint)', marginBottom: 8 }}>
                          Fuente: GET /api/tasks/{selectedTask.id} (tablas SQLite stage_attempts + attempt_audits de ZACH-072 · 0 tokens LLM)
                        </div>
                        {selectedTask.attempts.length > 0 ? (
                          <div className="zcp2-attempt-list">
                            {selectedTask.attempts.map((att) => (
                              <div key={att.attemptId} className="zcp2-attempt-card">
                                <div className="zcp2-attempt-head zcp2-mono">
                                  <span className={`zcp2-att-status is-${att.status.toLowerCase()}`}>
                                    {att.status}
                                  </span>
                                  <strong>{att.stage}</strong>
                                  <span>
                                    {att.model} ({att.effort})
                                  </span>
                                  <span>⏱ {att.duration}</span>
                                  <span style={{ marginLeft: 'auto', color: 'var(--z2-muted)' }}>
                                    {att.tokens}
                                  </span>
                                </div>
                                <p className="zcp2-attempt-summary">{att.summary}</p>
                                <div className="zcp2-audit-row zcp2-mono">
                                  <span>turns={att.audit.turns}</span>
                                  <span>tool_calls={att.audit.toolCalls}</span>
                                  <span
                                    style={{
                                      color: att.audit.toolErrors > 0 ? 'var(--z2-warn)' : undefined,
                                    }}
                                  >
                                    tool_errors={att.audit.toolErrors}
                                  </span>
                                  <span
                                    style={{
                                      color: att.audit.compileLoops > 0 ? 'var(--z2-warn)' : undefined,
                                    }}
                                  >
                                    compile_loops={att.audit.compileLoops}
                                  </span>
                                  {att.failureClass && (
                                    <span style={{ color: 'var(--z2-err)' }}>
                                      class={att.failureClass}
                                    </span>
                                  )}
                                  {att.audit.errorCode && (
                                    <span style={{ color: 'var(--z2-err)' }}>
                                      code={att.audit.errorCode}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ color: 'var(--z2-muted)', fontSize: 12 }}>
                            Esta tarea aún está en cola y no registra intentos ejecutados.
                          </p>
                        )}
                      </Tabs.Panel>
                    )}

                    {/* Tab 3: On-Demand Gemini Explainer (Wave 3) */}
                    {showAiWave && (
                      <Tabs.Panel className="zcp2-modal-panel" value="explain">
                        <div className="zcp2-ai-box" style={{ margin: 0 }}>
                          <div className="zcp2-ai-head">
                            <span className="zcp2-ai-title">
                              ✦ POST /api/tasks/{selectedTask.id}/explain ({selectedTask.aiExplain.model})
                            </span>
                            <div className="zcp2-ai-meta zcp2-mono">
                              <span>
                                {loadingExplain[selectedTask.id]
                                  ? 'Generando...'
                                  : `caché (${selectedTask.id}, epoch ${selectedTask.aiExplain.updatedEpoch})`}
                              </span>
                              <button
                                type="button"
                                className="zcp2-link-btn zcp2-mono"
                                disabled={!!loadingExplain[selectedTask.id]}
                                onClick={() => triggerExplainGeneration(selectedTask.id, true)}
                              >
                                ↻ Regenerar
                              </button>
                            </div>
                          </div>

                          {loadingExplain[selectedTask.id] ? (
                            <div className="zcp2-ai-loading zcp2-mono">
                              Sintetizando Context Pack, resúmenes de agentes y último fallo con redacción previa de secretos...
                            </div>
                          ) : (
                            <div className="zcp2-ai-grid">
                              <div>
                                <span className="zcp2-ai-k">1. Qué pide la tarea</span>
                                <p>{selectedTask.aiExplain.taskGoal}</p>
                              </div>
                              <div>
                                <span className="zcp2-ai-k">2. Qué hicieron los agentes</span>
                                <p>{selectedTask.aiExplain.agentActions}</p>
                              </div>
                              <div>
                                <span className="zcp2-ai-k">3. Estado / diagnóstico</span>
                                <p>{selectedTask.aiExplain.failureDiagnosis}</p>
                              </div>
                              {selectedTask.aiExplain.optionGuide.length > 0 && (
                                <div>
                                  <span className="zcp2-ai-k">4. Guía de opciones de decisión</span>
                                  <ul className="zcp2-ai-options">
                                    {selectedTask.aiExplain.optionGuide.map((og) => (
                                      <li key={og.option}>
                                        <strong className="zcp2-mono">
                                          {og.recommended ? '★ ' : ''}
                                          {og.option}:
                                        </strong>{' '}
                                        {og.effect}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </Tabs.Panel>
                    )}
                  </Tabs.Root>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginTop: 10 }}>
                    <span className="zcp2-mono" style={{ fontSize: 10, color: 'var(--z2-faint)' }}>
                      Guardrail: Gemini solo explica; las decisiones siempre pasan por /api/decide.
                    </span>
                    <button
                      type="button"
                      className="zcp2-btn"
                      onClick={() => {
                        setQuery(selectedTask.id);
                        setSelectedTask(null);
                      }}
                    >
                      Filtrar eventos por {selectedTask.id}
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
