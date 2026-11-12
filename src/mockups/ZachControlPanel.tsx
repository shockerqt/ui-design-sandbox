import { useState } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import './ZachControlPanel.css';

export type Mood = 'idle' | 'hunting' | 'review' | 'decision' | 'merged' | 'error' | 'paused';

const MOODS: { mood: Mood; title: string; when: string; event: string; label: string }[] = [
  { mood: 'idle', title: 'Siesta', when: 'Sin tareas en curso', event: 'cola vacía', label: 'Zach durmiendo' },
  { mood: 'hunting', title: 'Cazando', when: 'Planificando o implementando', event: 'STAGE_STARTED plan · impl', label: 'Zach cazando' },
  { mood: 'review', title: 'Monóculo', when: 'Revisando un plan o un PR', event: 'STAGE_STARTED *-review', label: 'Zach revisando con monóculo' },
  { mood: 'decision', title: 'Atento', when: 'Necesita tu decisión', event: 'DECISION_REQUIRED', label: 'Zach espera una decisión' },
  { mood: 'merged', title: 'Ronroneo', when: 'Un PR se mergeó', event: 'MERGE_COMPLETED', label: 'Zach ronroneando' },
  { mood: 'error', title: 'Erizado', when: 'Etapa o CI fallida', event: 'MERGE_FAILED · FAILED', label: 'Zach erizado' },
  { mood: 'paused', title: 'En pausa', when: 'Cola pausada por ti', event: 'pausa manual', label: 'Zach en pausa' },
];
const moodInfo = (m: Mood) => MOODS.find((x) => x.mood === m)!;

/* Mascota: gato negro sobre luna. Cada estado activa capas de ojos e insignias. */
export function ZachCat({ mood, size }: { mood: Mood; size?: number }) {
  const open = mood === 'review' || mood === 'decision';
  const ink = '#0E0E10';
  const eye = '#F0C94A';
  return (
    <svg viewBox="0 0 200 200" role="img" aria-label={moodInfo(mood).label} className="zcp-cat" data-mood={mood} style={size ? { width: size, height: size } : undefined}>
      <circle cx="100" cy="100" r="94" fill="#F3E4A4" />
      <circle cx="62" cy="58" r="9" fill="#E6D48C" />
      <circle cx="146" cy="128" r="6" fill="#E6D48C" />
      <circle cx="52" cy="124" r="4" fill="#E6D48C" />
      <path className="tail" d="M144 172 C174 170 180 138 164 124" fill="none" stroke={ink} strokeWidth="11" strokeLinecap="round" />
      <g className="body">
        <path d="M56 186 C46 142 60 108 100 104 C140 108 154 142 144 186 Z" fill={ink} />
        <path d="M66 68 L60 28 L92 54 Z" fill={ink} />
        <path d="M134 68 L140 28 L108 54 Z" fill={ink} />
        <ellipse cx="100" cy="84" rx="42" ry="35" fill={ink} />
        <path d="M96 96 L104 96 L100 101 Z" fill="#D9A08F" />
        <path d="M58 92 L32 86 M58 98 L32 102 M142 92 L168 86 M142 98 L168 102" stroke={ink} strokeWidth="1.6" strokeLinecap="round" fill="none" />
        {open && (
          <g>
            <ellipse cx="83" cy="82" rx="9" ry="10" fill={eye} />
            <ellipse cx="117" cy="82" rx="9" ry="10" fill={eye} />
            <ellipse cx="83" cy="82" rx="2.6" ry="8.5" fill={ink} />
            <ellipse cx="117" cy="82" rx="2.6" ry="8.5" fill={ink} />
          </g>
        )}
        {mood === 'hunting' && (
          <g>
            <ellipse cx="83" cy="82" rx="10" ry="11" fill={eye} />
            <ellipse cx="117" cy="82" rx="10" ry="11" fill={eye} />
            <ellipse cx="83" cy="82" rx="7" ry="8.5" fill={ink} />
            <ellipse cx="117" cy="82" rx="7" ry="8.5" fill={ink} />
            <circle cx="80" cy="78" r="2" fill="#FFF6D6" />
            <circle cx="114" cy="78" r="2" fill="#FFF6D6" />
          </g>
        )}
        {(mood === 'idle' || mood === 'paused') && (
          <path d="M74 82 Q83 90 92 82 M108 82 Q117 90 126 82" stroke={eye} strokeWidth="3" strokeLinecap="round" fill="none" />
        )}
        {mood === 'merged' && (
          <path d="M74 86 Q83 76 92 86 M108 86 Q117 76 126 86" stroke={eye} strokeWidth="3" strokeLinecap="round" fill="none" />
        )}
        {mood === 'error' && (
          <g>
            <path d="M73 76 L93 82 L93 86 L73 86 Z" fill={eye} />
            <path d="M127 76 L107 82 L107 86 L127 86 Z" fill={eye} />
            <path d="M60 40 L52 34 M64 36 L58 28 M140 40 L148 34 M136 36 L142 28" stroke={ink} strokeWidth="3" strokeLinecap="round" fill="none" />
          </g>
        )}
        {mood === 'review' && (
          <g fill="none" stroke={eye} strokeWidth="2.4" strokeLinecap="round">
            <circle cx="117" cy="82" r="15" />
            <path d="M128 93 C136 108 134 124 126 136" />
          </g>
        )}
      </g>
      {mood === 'decision' && (
        <g>
          <circle cx="160" cy="40" r="20" fill={ink} />
          <circle cx="160" cy="40" r="16" fill={eye} />
          <path d="M160 30 L160 43" stroke={ink} strokeWidth="4.5" strokeLinecap="round" />
          <circle cx="160" cy="50" r="2.6" fill={ink} />
        </g>
      )}
      {mood === 'paused' && (
        <g>
          <circle cx="160" cy="40" r="20" fill={ink} />
          <circle cx="160" cy="40" r="16" fill="#C9CCD3" />
          <path d="M155 32 L155 48 M165 32 L165 48" stroke={ink} strokeWidth="4.5" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}

type StageKind = 'done' | 'fail' | 'now' | 'todo';
type Stage = { name: string; kind: StageKind; meta: string };
type Task = { id: string; title: string; repo: string; weight: string; note: string; noteTone: 'danger' | 'accent' | 'ok' | 'quiet'; stages: Stage[]; canRetry?: boolean };

const StageIcon = ({ kind }: { kind: StageKind }) => {
  if (kind === 'done') return <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>;
  if (kind === 'fail') return <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>;
  if (kind === 'now') return <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" fill="currentColor" /></svg>;
  return <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="6" /></svg>;
};
const STAGE_LABEL: Record<StageKind, string> = { done: 'terminada', fail: 'fallida', now: 'en curso', todo: 'pendiente' };
const toneColor = { danger: 'var(--z-danger)', accent: 'var(--z-accent)', ok: 'var(--z-ok)', quiet: 'var(--z-quiet)' };

type Decision = 'pending' | 'approved' | 'rejected';

function buildTasks(decision: Decision, retried: boolean): Task[] {
  const zach: Task = retried
    ? {
        id: 'ZACH-009', title: 'Implement local HTTP web gateway and SSE event stream', repo: 'zach', weight: 'M',
        note: 'Reintentando: esperando la CI del SHA exacto.', noteTone: 'accent',
        stages: [
          { name: 'plan', kind: 'done', meta: 'gemini-3.8-flash · 6 min' },
          { name: 'plan-review', kind: 'done', meta: 'gemini-3.8-flash · 9 min' },
          { name: 'impl', kind: 'done', meta: '3 intentos · 20 min' },
          { name: 'pr-review', kind: 'done', meta: '4 intentos · 20 min' },
          { name: 'merge', kind: 'now', meta: 'CI en curso' },
        ],
      }
    : {
        id: 'ZACH-009', title: 'Implement local HTTP web gateway and SSE event stream', repo: 'zach', weight: 'M',
        note: 'Merge detenido: la CI falló en 7089a6d.', noteTone: 'danger', canRetry: true,
        stages: [
          { name: 'plan', kind: 'done', meta: 'gemini-3.8-flash · 6 min' },
          { name: 'plan-review', kind: 'done', meta: 'gemini-3.8-flash · 9 min' },
          { name: 'impl', kind: 'done', meta: '3 intentos · 20 min' },
          { name: 'pr-review', kind: 'done', meta: '4 intentos · 20 min' },
          { name: 'merge', kind: 'fail', meta: 'CI en rojo' },
        ],
      };
  const inf: Task = {
    id: 'INF-020', title: 'Expose zach.shocker.cl with Cloudflare Access and Nginx reverse proxy', repo: 'infrastructure', weight: 'L',
    note: decision === 'pending' ? 'Esperando tu aprobación del plan.' : decision === 'approved' ? 'Plan aprobado: implementando.' : 'Plan rechazado: vuelve a planificación con tu nota.',
    noteTone: decision === 'pending' ? 'accent' : decision === 'approved' ? 'ok' : 'quiet',
    stages: [
      { name: 'plan', kind: decision === 'rejected' ? 'now' : 'done', meta: decision === 'rejected' ? 'replanificando' : 'listo' },
      { name: 'plan-review', kind: decision === 'rejected' ? 'todo' : 'done', meta: decision === 'rejected' ? '' : 'aprobado' },
      { name: 'tu aprobación', kind: decision === 'pending' ? 'now' : decision === 'approved' ? 'done' : 'todo', meta: decision === 'pending' ? 'pendiente' : decision === 'approved' ? 'aprobado por ti' : '' },
      { name: 'impl', kind: decision === 'approved' ? 'now' : 'todo', meta: decision === 'approved' ? 'gemini-3.8-flash · recién iniciada' : '' },
      { name: 'pr-review', kind: 'todo', meta: '' },
      { name: 'aprobar merge', kind: 'todo', meta: '' },
    ],
  };
  return [zach, inf];
}

function moodFor(decision: Decision, retried: boolean, paused: boolean): Mood {
  if (paused) return 'paused';
  if (decision === 'pending') return 'decision';
  if (!retried) return 'error';
  return 'hunting';
}

function TaskCard({ t, onRetry }: { t: Task; onRetry: () => void }) {
  return (
    <article className="zcp-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }} aria-label={`${t.id} ${t.title}`}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: '6px 12px' }}>
        <span className="zcp-mono" style={{ fontWeight: 500, color: 'var(--z-accent)' }}>{t.id}</span>
        <span className="zcp-display" style={{ fontWeight: 600, fontSize: 17, flex: '1 1 240px', minWidth: 0 }}>{t.title}</span>
        <span className="quiet" style={{ fontSize: 12 }}>{t.repo} · peso {t.weight}</span>
      </div>
      <ol className="zcp-stages">
        {t.stages.map((s) => (
          <li key={s.name} className={`zcp-stage is-${s.kind}`}>
            <div className="zcp-stage-name"><StageIcon kind={s.kind} /><span>{s.name}</span><span style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clipPath: 'inset(50%)' }}>, {STAGE_LABEL[s.kind]}</span></div>
            <div className="zcp-stage-meta">{s.meta}</div>
          </li>
        ))}
      </ol>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px 16px' }}>
        <span style={{ flex: '1 1 260px', minWidth: 0, color: toneColor[t.noteTone] }} aria-live="polite">{t.note}</span>
        {t.canRetry && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="zcp-btn" onClick={onRetry}>Reintentar merge</button>
            <a className="zcp-btn" href="https://github.com/shockerqt/zach/pull/47">Ver PR #47</a>
          </div>
        )}
      </div>
    </article>
  );
}

type PanelState = { decision: Decision; retried: boolean; paused: boolean; muted: boolean; note: string };

function DesktopPanel({ s, set }: { s: PanelState; set: (p: Partial<PanelState>) => void }) {
  const mood = moodFor(s.decision, s.retried, s.paused);
  const tasks = buildTasks(s.decision, s.retried);
  const open = s.decision === 'pending' ? 1 : 0;
  const headline = s.paused ? 'Cola en pausa' : open ? 'Zach espera tu decisión' : s.retried ? 'Zach está trabajando' : 'Zach necesita revisar un merge';
  const events = [
    ...(s.retried ? [{ at: '22:09:12', what: 'Merge reintentado', detail: 'ZACH-009 · esperando CI', color: 'var(--z-ink)' }] : []),
    ...(s.decision === 'approved' ? [{ at: '22:08:40', what: 'Plan aprobado', detail: `INF-020 · por ti${s.note ? ` · «${s.note}»` : ''}`, color: 'var(--z-ok)' }] : []),
    ...(s.decision === 'rejected' ? [{ at: '22:08:40', what: 'Plan rechazado', detail: `INF-020 · por ti${s.note ? ` · «${s.note}»` : ''}`, color: 'var(--z-ink)' }] : []),
    { at: '22:07:06', what: 'Merge fallido', detail: 'ZACH-009 · CI del SHA 7089a6d', color: 'var(--z-danger)' },
    { at: '22:07:04', what: 'En cola de merge', detail: 'ZACH-009 · PR #47', color: 'var(--z-ink)' },
    { at: '22:06:58', what: 'Etapa terminada', detail: 'ZACH-009 · pr-review', color: 'var(--z-ink)' },
    { at: '22:02:34', what: 'Etapa iniciada', detail: 'ZACH-009 · pr-review · gemini-3.8-flash-high', color: 'var(--z-ink)' },
  ].slice(0, 6);
  return (
    <>
      <header className="zcp-header">
        <div className="zcp-brand">
          <ZachCat mood={mood} size={36} />
          <span className="zcp-brand-name">Zach</span>
        </div>
        <div className="zcp-pills">
          <span className="zcp-pill"><span className={`zcp-dot ${s.paused ? 'is-paused' : ''}`} />{s.paused ? 'Cola en pausa' : 'Daemon activo · latido hace 4 s'}</span>
          <span className="zcp-pill">Slots {(s.decision === 'approved' ? 1 : 0) + (s.retried ? 1 : 0)} de 2</span>
          <span className="zcp-pill is-danger">
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M12 8v5M12 17h.01M3 20h18L12 4 3 20z" /></svg>
            Codex sin cuota hasta 11:42
          </span>
          <span className="zcp-pill">Gemini disponible</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="zcp-btn" aria-pressed={s.paused} onClick={() => set({ paused: !s.paused })}>{s.paused ? 'Reanudar cola' : 'Pausar cola'}</button>
          <button type="button" className="zcp-btn is-icon" aria-pressed={s.muted} aria-label={s.muted ? 'Activar sonidos' : 'Silenciar sonidos'} onClick={() => set({ muted: !s.muted })}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d={s.muted ? 'M4 10v4h4l5 4V6L8 10H4zM17 9l5 6M22 9l-5 6' : 'M4 10v4h4l5 4V6L8 10H4zM17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11'} />
            </svg>
          </button>
        </div>
      </header>
      <main className="zcp-main">
        <section aria-label="Estado y decisión" className="zcp-col-left">
          <div className="zcp-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 200, height: 200 }}><ZachCat mood={mood} /></div>
            <div style={{ textAlign: 'center' }}>
              <div className="zcp-display" style={{ fontWeight: 600, fontSize: 20 }} aria-live="polite">{headline}</div>
              <div className="quiet" style={{ marginTop: 4 }}>{open} {open === 1 ? 'decisión abierta' : 'decisiones abiertas'} · {s.retried ? 'merge reintentándose' : '1 tarea bloqueada en merge'}</div>
            </div>
          </div>
          {s.decision === 'pending' ? (
            <div className="zcp-card is-decision" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span className="zcp-eyebrow">Aprobación de plan</span>
                <span className="zcp-tag">INF-020 · L</span>
              </div>
              <div className="zcp-display" style={{ fontWeight: 600, fontSize: 18, lineHeight: 1.3 }}>¿Aprobar el plan de INF-020?</div>
              <div style={{ color: 'var(--z-ink-2)' }}>Expose zach.shocker.cl with Cloudflare Access and Nginx reverse proxy. El plan pasó plan-review; hace falta tu aprobación antes de implementar.</div>
              <a href="#plan" style={{ fontWeight: 500, textDecoration: 'none' }}>Leer el plan y la revisión</a>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label htmlFor="zcp-nota" className="quiet" style={{ fontSize: 12 }}>Nota (opcional)</label>
                <input id="zcp-nota" className="zcp-input" type="text" value={s.note} onChange={(e) => set({ note: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" className="zcp-btn is-primary" style={{ flex: '1 1 0', minHeight: 48, fontSize: 15 }} onClick={() => set({ decision: 'approved' })}>Aprobar</button>
                <button type="button" className="zcp-btn" style={{ flex: '1 1 0', minHeight: 48, fontSize: 15, fontWeight: 600 }} onClick={() => set({ decision: 'rejected' })}>Rechazar</button>
              </div>
              <div className="quiet" style={{ fontSize: 12 }}>Las decisiones no se aprueban solas por tiempo.</div>
            </div>
          ) : (
            <div className="zcp-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <span className="zcp-eyebrow" style={{ color: 'var(--z-quiet)' }}>Sin decisiones pendientes</span>
              <div style={{ color: 'var(--z-ink-2)' }}>{s.decision === 'approved' ? 'Aprobaste el plan de INF-020.' : 'Rechazaste el plan de INF-020; vuelve a planificación.'}</div>
              <button type="button" className="zcp-btn" onClick={() => set({ decision: 'pending', note: '' })}>Deshacer (demo)</button>
            </div>
          )}
        </section>
        <section aria-label="Tareas" className="zcp-col-mid">
          <h2 className="zcp-h2">En curso</h2>
          {tasks.map((t) => <TaskCard key={t.id} t={t} onRetry={() => set({ retried: true })} />)}
          <h2 className="zcp-h2" style={{ marginTop: 8 }}>En cola</h2>
          <div className="zcp-card" style={{ padding: '4px 20px' }}>
            <div className="zcp-list-row">
              <span className="zcp-mono" style={{ fontWeight: 500, color: 'var(--z-ink-2)' }}>ZACH-010</span>
              <span style={{ flex: '1 1 240px', minWidth: 0 }}>Build live visualizer frontend SPA with animated Zach black cat mascot</span>
              <span className="quiet" style={{ fontSize: 12 }}>espera a ZACH-009</span>
            </div>
          </div>
        </section>
        <aside className="zcp-col-right">
          <h2 className="zcp-h2">Cola de merge</h2>
          <div className="zcp-card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontWeight: 600 }}>zach</span>
              <span style={{ fontSize: 12, color: s.retried ? 'var(--z-accent)' : 'var(--z-danger)' }}>{s.retried ? 'esperando CI' : 'carril detenido'}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 10px', fontSize: 13 }}>
              <span className="zcp-mono" style={{ color: 'var(--z-accent)' }}>ZACH-009</span>
              <span>PR #47</span>
              <span className="zcp-mono quiet">7089a6d</span>
              <span style={{ color: s.retried ? 'var(--z-accent)' : 'var(--z-danger)' }}>{s.retried ? 'CI en curso' : 'CI fallida'}</span>
            </div>
            <div style={{ borderTop: '1px solid var(--z-line)', paddingTop: 12, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontWeight: 600 }}>discord-ai-bot</span>
              <span className="quiet" style={{ fontSize: 12 }}>vacía</span>
            </div>
          </div>
          <h2 className="zcp-h2" style={{ marginTop: 8 }}>Eventos</h2>
          <div className="zcp-card" style={{ padding: '6px 20px' }}>
            {events.map((e) => (
              <div key={e.at + e.what} className="zcp-event">
                <span className="zcp-mono quiet" style={{ flex: '0 0 auto' }}>{e.at}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 500, color: e.color }}>{e.what}</div>
                  <div className="quiet" style={{ overflowWrap: 'anywhere' }}>{e.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </aside>
      </main>
    </>
  );
}

function PhoneDecision({ s, set }: { s: PanelState; set: (p: Partial<PanelState>) => void }) {
  const mood = moodFor(s.decision, s.retried, s.paused);
  return (
    <div className="zcp-canvas">
      <div className="zcp-phone">
        <header style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 20px', borderBottom: '1px solid var(--z-line)' }}>
          <span className="zcp-display" style={{ fontWeight: 700, fontSize: 20, marginRight: 'auto' }}>Zach</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--z-ink-2)' }}><span className={`zcp-dot ${s.paused ? 'is-paused' : ''}`} />{s.paused ? 'En pausa' : 'Activo'}</span>
          <button type="button" className="zcp-btn is-icon" aria-pressed={s.paused} aria-label={s.paused ? 'Reanudar cola' : 'Pausar cola'} onClick={() => set({ paused: !s.paused })}>
            <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d={s.paused ? 'M8 5l11 7-11 7z' : 'M9 6v12M15 6v12'} /></svg>
          </button>
        </header>
        <div style={{ flex: '1 1 auto', minHeight: 0, padding: 20, display: 'flex', flexDirection: 'column', gap: 16, overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 112, height: 112, flex: '0 0 auto' }}><ZachCat mood={mood} /></div>
            <div>
              <div className="zcp-display" style={{ fontWeight: 600, fontSize: 20, lineHeight: 1.25 }}>{s.decision === 'pending' ? 'Zach espera tu decisión' : 'Sin decisiones pendientes'}</div>
              <div className="quiet" style={{ fontSize: 13, marginTop: 4 }}>{s.decision === 'pending' ? '1 abierta' : 'Te avisará cuando haya otra'}</div>
            </div>
          </div>
          {s.decision === 'pending' && (
            <div className="zcp-card is-decision" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span className="zcp-eyebrow">Aprobación de plan</span>
                <span className="zcp-tag">INF-020 · L</span>
              </div>
              <div className="zcp-display" style={{ fontWeight: 600, fontSize: 19, lineHeight: 1.3 }}>¿Aprobar el plan de INF-020?</div>
              <div style={{ color: 'var(--z-ink-2)' }}>Expose zach.shocker.cl with Cloudflare Access and Nginx reverse proxy. El plan pasó plan-review.</div>
              <a href="#plan" style={{ minHeight: 44, display: 'inline-flex', alignItems: 'center', fontWeight: 500, textDecoration: 'none' }}>Leer el plan y la revisión</a>
              <button type="button" className="zcp-btn is-primary" style={{ minHeight: 52, fontSize: 16, borderRadius: 12 }} onClick={() => set({ decision: 'approved' })}>Aprobar</button>
              <button type="button" className="zcp-btn" style={{ minHeight: 52, fontSize: 16, fontWeight: 600, borderRadius: 12 }} onClick={() => set({ decision: 'rejected' })}>Rechazar</button>
            </div>
          )}
          <h2 className="zcp-h2" style={{ fontSize: 15, marginTop: 4 }}>En curso</h2>
          <div className="zcp-card" style={{ padding: '4px 18px' }}>
            {buildTasks(s.decision, s.retried).map((t) => {
              const now = t.stages.findIndex((x) => x.kind === 'now' || x.kind === 'fail');
              return (
                <div key={t.id} className="zcp-list-row" style={{ display: 'block', padding: '12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
                    <span className="zcp-mono" style={{ fontWeight: 500, color: 'var(--z-accent)' }}>{t.id}</span>
                    <span style={{ fontSize: 13, color: toneColor[t.noteTone] }}>{t.note.split(':')[0].replace(/\.$/, '')}</span>
                  </div>
                  <div className="quiet" style={{ fontSize: 13, marginTop: 2 }}>{t.canRetry ? 'La CI falló en 7089a6d · PR #47' : `Etapa ${Math.max(now, 0) + 1} de ${t.stages.length}`}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatesBoard({ selected, onSelect }: { selected: Mood; onSelect: (m: Mood) => void }) {
  return (
    <div>
      <div className="zcp-display" style={{ padding: '32px 48px 0', fontWeight: 600, fontSize: 22 }}>Siete estados, uno por lo que el daemon está haciendo</div>
      <div className="zcp-states">
        {MOODS.map((m) => (
          <button key={m.mood} type="button" className="zcp-state" aria-pressed={selected === m.mood} onClick={() => onSelect(m.mood)}>
            <div className="zcp-cat-wrap"><ZachCat mood={m.mood} /></div>
            <div className="zcp-display" style={{ fontWeight: 600, fontSize: 16 }}>{m.title}</div>
            <div className="quiet" style={{ fontSize: 13 }}>{m.when}</div>
            <div className="zcp-mono" style={{ fontSize: 11, color: 'var(--z-ink-2)' }}>{m.event}</div>
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '0 48px 48px' }}>
        <div className="zcp-card" style={{ padding: 32, display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap', justifyContent: 'center' }}>
          <div style={{ width: 260, height: 260 }}><ZachCat mood={selected} /></div>
          <div style={{ maxWidth: 360 }}>
            <div className="zcp-eyebrow">{moodInfo(selected).event}</div>
            <div className="zcp-display" style={{ fontWeight: 600, fontSize: 28, marginTop: 6 }}>{moodInfo(selected).title}</div>
            <div style={{ color: 'var(--z-ink-2)', marginTop: 6 }}>{moodInfo(selected).when}. La cola, los ojos y las insignias cambian con el estado; con movimiento reducido el gato queda quieto.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const INITIAL: PanelState = { decision: 'pending', retried: false, paused: false, muted: false, note: '' };

export function ZachControlPanel() {
  const [view, setView] = useState('desktop');
  const [state, setState] = useState<PanelState>(INITIAL);
  const [mood, setMood] = useState<Mood>('decision');
  const set = (p: Partial<PanelState>) => setState((cur) => ({ ...cur, ...p }));
  return (
    <div className="zcp">
      <div className="zcp-toolbar">
        <div className="zcp-toolbar-title">
          <strong>Zach · panel de control</strong>
          <span>Aprueba, rechaza, pausa o reintenta: la mascota cambia con el estado del daemon.</span>
        </div>
        <Tabs.Root value={view} onValueChange={(v) => setView(String(v))}>
          <Tabs.List className="zcp-seg" aria-label="Vista">
            <Tabs.Tab value="desktop">Escritorio</Tabs.Tab>
            <Tabs.Tab value="phone">Teléfono</Tabs.Tab>
            <Tabs.Tab value="states">Estados de la mascota</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
        <button type="button" className="zcp-btn" onClick={() => setState(INITIAL)}>Reiniciar demo</button>
      </div>
      {view === 'desktop' && <DesktopPanel s={state} set={set} />}
      {view === 'phone' && <PhoneDecision s={state} set={set} />}
      {view === 'states' && <StatesBoard selected={mood} onSelect={setMood} />}
    </div>
  );
}
