import { useId, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { Switch } from '@base-ui/react/switch';
import { Tabs } from '@base-ui/react/tabs';
import './BalanceCleanRedesign.css';

/* Datos de muestra: semana del lunes 9 al domingo 15 de noviembre de 2026; hoy es el jueves 12. */
type Food = { name: string; portion: string; kcal: number; p: number; c: number; f: number };
type Meal = { hour: string; foods: Food[] };

const TODAY = 12;
const GOAL = { kcal: 2200, p: 150, c: 220, f: 65 };
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEKDAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const F = {
  avena: { name: 'Avena con leche', portion: '1 taza', kcal: 310, p: 14, c: 48, f: 7 },
  platano: { name: 'Plátano', portion: '1 unidad', kcal: 105, p: 1, c: 27, f: 0 },
  pollo: { name: 'Pollo con arroz', portion: '1 plato', kcal: 620, p: 55, c: 38, f: 20 },
  ensalada: { name: 'Ensalada chilena', portion: '1 porción', kcal: 80, p: 2, c: 9, f: 4 },
  marraqueta: { name: 'Marraqueta con palta', portion: '1 unidad', kcal: 225, p: 10, c: 28, f: 7 },
  yogur: { name: 'Yogur natural', portion: '1 pote', kcal: 95, p: 9, c: 11, f: 2 },
  porotos: { name: 'Porotos con riendas', portion: '1 plato', kcal: 540, p: 24, c: 82, f: 9 },
  huevos: { name: 'Huevos revueltos', portion: '2 unidades', kcal: 190, p: 13, c: 2, f: 14 },
  cazuela: { name: 'Cazuela de vacuno', portion: '1 plato', kcal: 480, p: 34, c: 40, f: 18 },
  pan: { name: 'Pan integral', portion: '2 rebanadas', kcal: 160, p: 7, c: 28, f: 2 },
} satisfies Record<string, Food>;

const LOGS: Record<number, Meal[]> = {
  9: [
    { hour: '08:30', foods: [F.huevos, F.pan] },
    { hour: '13:30', foods: [F.porotos, F.ensalada] },
    { hour: '20:00', foods: [F.cazuela, F.yogur] },
  ],
  10: [
    { hour: '08:00', foods: [F.avena] },
    { hour: '13:00', foods: [F.cazuela, F.ensalada] },
    { hour: '19:30', foods: [F.pollo, F.yogur] },
  ],
  11: [
    { hour: '07:45', foods: [F.avena, F.platano] },
    { hour: '13:15', foods: [F.porotos] },
    { hour: '17:00', foods: [F.marraqueta] },
    { hour: '21:00', foods: [F.pollo, F.ensalada] },
  ],
  12: [
    { hour: '08:00', foods: [F.avena, F.platano] },
    { hour: '13:00', foods: [F.pollo, F.ensalada] },
    { hour: '17:00', foods: [F.marraqueta] },
  ],
};

const totals = (meals: Meal[] = []) =>
  meals.flatMap((m) => m.foods).reduce((t, x) => ({ kcal: t.kcal + x.kcal, p: t.p + x.p, c: t.c + x.c, f: t.f + x.f }), { kcal: 0, p: 0, c: 0, f: 0 });

const fmt = (n: number) => n.toLocaleString('es-CL');
const pct = (v: number, max: number) => `${Math.min(100, Math.round((v / max) * 100))}%`;

const MACROS = [
  { key: 'p', name: 'Proteína', target: GOAL.p, color: 'var(--b-protein)' },
  { key: 'c', name: 'Carbohidratos', target: GOAL.c, color: 'var(--b-carbs)' },
  { key: 'f', name: 'Grasa', target: GOAL.f, color: 'var(--b-fat)' },
] as const;

/* Iconos (trazo, heredan currentColor) */
const Icon = ({ d, size = 20, width = 2 }: { d: string; size?: number; width?: number }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const I = {
  calendar: 'M4 9h16M8 3v4M16 3v4M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  plus: 'M12 5v14M5 12h14',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  back: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
  diary: 'M6 4h12a1 1 0 0 1 1 1v15l-3-2-2 2-2-2-2 2-2-2-3 2V5a1 1 0 0 1 1-1zM9 9h6M9 13h6',
  trend: 'M4 18l5-6 4 3 7-9',
  bars: 'M6 20V11M12 20V5M18 20v-6',
  user: 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 20c1.5-4 4.5-6 8-6s6.5 2 8 6',
  search: 'M11 4.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM16 16l4 4',
  clock: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM12 7.5V12l3 2',
};

type Screen = 'diary' | 'summary';

function TabBar({ current, onNavigate }: { current: Screen | 'add'; onNavigate: (s: Screen | 'add') => void }) {
  const tab = (id: Screen | null, label: string, icon: string) => (
    <button type="button" className="bcr-tab" aria-current={id && current === id ? 'page' : undefined} onClick={() => id && onNavigate(id)}>
      <Icon d={icon} size={22} />
      {label}
    </button>
  );
  return (
    <nav aria-label="Secciones" className="bcr-tabbar">
      {tab('diary', 'Diario', I.diary)}
      {tab(null, 'Mediciones', I.trend)}
      <button type="button" className="bcr-tab-add" aria-label="Agregar alimento" onClick={() => onNavigate('add')}>
        <Icon d={I.plus} size={24} width={2.4} />
      </button>
      {tab('summary', 'Resumen', I.bars)}
      {tab(null, 'Perfil', I.user)}
    </nav>
  );
}

function MacroBars({ t, compact }: { t: ReturnType<typeof totals>; compact?: boolean }) {
  if (compact) {
    return (
      <div className="bcr-macros">
        {MACROS.map((m) => (
          <div key={m.key} className="bcr-macro">
            <div className="quiet" style={{ fontSize: 12 }}>{m.name}</div>
            <div style={{ fontWeight: 600 }}>
              {t[m.key]} <span className="quiet" style={{ fontWeight: 400, fontSize: 13 }}>/ {m.target} g</span>
            </div>
            <div aria-hidden="true" className="bcr-meter is-thin"><span style={{ width: pct(t[m.key], m.target), background: m.color }} /></div>
          </div>
        ))}
      </div>
    );
  }
  return (
    <>
      {MACROS.map((m) => (
        <div key={m.key} className="bcr-macro-row">
          <div className="name">{m.name}</div>
          <div aria-hidden="true" className="bcr-meter is-mid"><span style={{ width: pct(t[m.key], m.target), background: m.color }} /></div>
          <div className="value"><span style={{ fontWeight: 600 }}>{t[m.key]}</span><span className="quiet"> / {m.target} g</span></div>
        </div>
      ))}
    </>
  );
}

function DaySummary({ t, style }: { t: ReturnType<typeof totals>; style?: CSSProperties }) {
  const left = GOAL.kcal - t.kcal;
  return (
    <section aria-label="Resumen del día" className="bcr-card bcr-summary" style={style}>
      <div className="bcr-kcal-row">
        <div>
          <div className="bcr-kcal">{fmt(t.kcal)}</div>
          <div className="quiet" style={{ fontSize: 13, marginTop: 4 }}>de {fmt(GOAL.kcal)} kcal</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 600, fontSize: 17 }}>{fmt(Math.abs(left))}</div>
          <div className="quiet" style={{ fontSize: 13 }}>{left >= 0 ? 'te quedan' : 'sobre la meta'}</div>
        </div>
      </div>
      <div role="img" aria-label={`${Math.round((t.kcal / GOAL.kcal) * 100)} por ciento de la meta de calorías`} className="bcr-meter">
        <span style={{ width: pct(t.kcal, GOAL.kcal) }} />
      </div>
      {style ? <MacroBars t={t} /> : <MacroBars t={t} compact />}
    </section>
  );
}

function DiaryScreen({ day, setDay, onNavigate }: { day: number; setDay: (d: number) => void; onNavigate: (s: Screen | 'add') => void }) {
  const meals = LOGS[day] ?? [];
  const t = totals(meals);
  const weekday = WEEKDAY_NAMES[day - 9];
  return (
    <>
      <header className="bcr-header">
        <div className="bcr-header-title">
          <h2 className="bcr-h1">{day === TODAY ? 'Hoy' : day === TODAY - 1 ? 'Ayer' : `${weekday[0].toUpperCase()}${weekday.slice(1)}`}</h2>
          <div className="bcr-sub">{weekday} {day} de noviembre</div>
        </div>
        <button type="button" className="bcr-icon-btn" aria-label="Elegir fecha"><Icon d={I.calendar} /></button>
      </header>
      <nav aria-label="Semana" className="bcr-week">
        {WEEKDAYS.map((letter, i) => {
          const n = 9 + i;
          const cls = ['bcr-day', LOGS[n] ? 'is-logged' : '', n > TODAY ? 'is-future' : ''].join(' ');
          return (
            <button key={n} type="button" className={cls} aria-pressed={n === day} aria-label={`${WEEKDAY_NAMES[i]} ${n} de noviembre${LOGS[n] ? ', con registros' : ''}`} onClick={() => setDay(n)}>
              <span className="bcr-day-letter">{letter}</span>
              <span className="bcr-day-num">{n}</span>
              <span aria-hidden="true" className="bcr-day-mark" />
            </button>
          );
        })}
      </nav>
      <DaySummary t={t} />
      <div className="bcr-scroll">
        {meals.length === 0 ? (
          <div className="bcr-card bcr-empty">
            <div style={{ fontWeight: 600 }}>{day > TODAY ? 'Este día todavía no llega' : 'Sin registros este día'}</div>
            <div className="quiet" style={{ fontSize: 14 }}>{day > TODAY ? 'Puedes planificar comidas desde Agregar.' : 'Agrega lo que comiste con el botón +.'}</div>
          </div>
        ) : (
          meals.map((m) => {
            const mt = totals([m]);
            return (
              <section key={m.hour} aria-label={`Comidas de las ${m.hour}`}>
                <div className="bcr-group-head">
                  <span className="bcr-group-hour">{m.hour}</span>
                  <span className="quiet" style={{ fontSize: 13, marginRight: 'auto' }}>{fmt(mt.kcal)} kcal</span>
                  <button type="button" className="bcr-icon-btn is-outline" style={{ height: 36, borderRadius: 12 }} aria-label={`Agregar a las ${m.hour}`} onClick={() => onNavigate('add')}>
                    <Icon d={I.plus} size={16} width={2.4} />
                  </button>
                </div>
                <div className="bcr-list">
                  {m.foods.map((f) => (
                    <div key={f.name} className="bcr-row">
                      <div className="bcr-row-main">
                        <div className="bcr-row-name">{f.name}</div>
                        <div className="bcr-row-meta">{f.portion}</div>
                      </div>
                      <div style={{ fontWeight: 600 }}>{f.kcal}</div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </div>
      <TabBar current="diary" onNavigate={onNavigate} />
    </>
  );
}

const CATALOG: Record<string, Food[]> = {
  recent: [F.pollo, F.ensalada, F.avena, F.marraqueta, F.platano, F.yogur],
  frequent: [F.avena, F.platano, F.pollo, F.porotos, F.cazuela],
  mine: [F.huevos, F.pan, F.yogur],
};

function AddScreen({ onNavigate }: { onNavigate: (s: Screen | 'add') => void }) {
  const [source, setSource] = useState('recent');
  const searchId = useId();
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Record<string, { qty: number; unit: 'portion' | 'grams' }>>({ 'Pollo con arroz': { qty: 1, unit: 'portion' }, 'Ensalada chilena': { qty: 1, unit: 'portion' } });
  const all = Object.values(F);
  const list = (query.trim() ? all.filter((f) => f.name.toLowerCase().includes(query.trim().toLowerCase())) : CATALOG[source]) ?? [];
  const chosen = Object.entries(selected);
  const kcal = chosen.reduce((sum, [name, s]) => sum + (all.find((f) => f.name === name)?.kcal ?? 0) * s.qty, 0);
  const toggle = (name: string) =>
    setSelected((cur) => {
      const next = { ...cur };
      if (next[name]) delete next[name];
      else next[name] = { qty: 1, unit: 'portion' };
      return next;
    });
  const update = (name: string, patch: Partial<{ qty: number; unit: 'portion' | 'grams' }>) =>
    setSelected((cur) => ({ ...cur, [name]: { ...cur[name], ...patch } }));

  return (
    <>
      <header className="bcr-header" style={{ paddingBottom: 12 }}>
        <button type="button" className="bcr-icon-btn" aria-label="Volver al diario" onClick={() => onNavigate('diary')}><Icon d={I.back} width={2.2} /></button>
        <div className="bcr-header-title">
          <div className="bcr-display" style={{ fontWeight: 700, fontSize: 22, lineHeight: 1.1 }}>Agregar</div>
          <div className="quiet" style={{ fontSize: 13 }}>Hoy</div>
        </div>
        <button type="button" className="bcr-icon-btn" style={{ width: 'auto', padding: '0 14px', gap: 8, fontWeight: 600 }} aria-label="Cambiar hora, ahora 13:00">
          <Icon d={I.clock} size={16} width={2.2} />13:00
        </button>
      </header>
      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="bcr-search">
          <span className="quiet" style={{ display: 'inline-flex' }}><Icon d={I.search} size={18} width={2.2} /></span>
          <label htmlFor={searchId} className="sr-only">Buscar alimento</label>
          <input id={searchId} type="search" placeholder="Buscar alimento" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <Tabs.Root value={source} onValueChange={(v) => setSource(String(v))}>
          <Tabs.List className="bcr-chips" aria-label="Origen">
            <Tabs.Tab value="recent" className="bcr-chip">Recientes</Tabs.Tab>
            <Tabs.Tab value="frequent" className="bcr-chip">Frecuentes</Tabs.Tab>
            <Tabs.Tab value="mine" className="bcr-chip">Mis alimentos</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      </div>
      <div className="bcr-scroll" style={{ gap: 6 }}>
        <div className="bcr-list">
          {list.length === 0 && <div className="bcr-row quiet">Sin resultados para «{query}»</div>}
          {list.map((f) => {
            const s = selected[f.name];
            return (
              <div key={f.name} className="bcr-row" style={{ minHeight: 60, flexWrap: 'wrap', paddingBlock: s ? 12 : 0, rowGap: 12 }}>
                <div className="bcr-row-main">
                  <div className="bcr-row-name" style={{ fontWeight: s ? 600 : 500 }}>{f.name}</div>
                  <div className="bcr-row-meta">{f.portion} · {f.kcal} kcal · {f.p} g proteína</div>
                </div>
                <button type="button" className={`bcr-icon-btn ${s ? 'is-solid' : 'is-outline'}`} aria-label={`${s ? 'Quitar' : 'Agregar'} ${f.name}`} onClick={() => toggle(f.name)}>
                  <Icon d={s ? I.check : I.plus} size={18} width={2.6} />
                </button>
                {s && (
                  <div className="bcr-qty" style={{ flex: '1 0 100%' }}>
                    <div className="bcr-stepper">
                      <button type="button" aria-label={`Menos ${f.name}`} disabled={s.qty <= 1} onClick={() => update(f.name, { qty: s.qty - 1 })}>−</button>
                      <span aria-live="polite">{s.qty}</span>
                      <button type="button" aria-label={`Más ${f.name}`} onClick={() => update(f.name, { qty: s.qty + 1 })}>+</button>
                    </div>
                    <div className="bcr-unit" role="group" aria-label="Unidad">
                      <button type="button" aria-pressed={s.unit === 'portion'} onClick={() => update(f.name, { unit: 'portion' })}>{f.portion.split(' ').slice(1).join(' ') || 'porción'}</button>
                      <button type="button" aria-pressed={s.unit === 'grams'} onClick={() => update(f.name, { unit: 'grams' })}>gramos</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <a href="#crear" style={{ display: 'inline-flex', alignItems: 'center', minHeight: 44, fontWeight: 500, textDecoration: 'none' }}>Crear alimento nuevo</a>
      </div>
      <div className="bcr-footer">
        <div style={{ marginRight: 'auto' }} aria-live="polite">
          <div style={{ fontWeight: 600 }}>{chosen.length} {chosen.length === 1 ? 'alimento' : 'alimentos'}</div>
          <div className="quiet" style={{ fontSize: 13 }}>{fmt(kcal)} kcal a las 13:00</div>
        </div>
        <button type="button" className="bcr-primary" disabled={chosen.length === 0} onClick={() => onNavigate('diary')}>Guardar</button>
      </div>
    </>
  );
}

const RANGES: Record<string, { kcal: number[]; labels: string[]; avg: number; weight: string; delta: string; path: string; macros: { p: number; c: number; f: number } }> = {
  '7': { kcal: [2150, 1980, 2310, 1340, 0, 0, 0], labels: WEEKDAYS, avg: 2050, weight: '78,4', delta: '−0,6 kg en 7 días', path: 'M4 16 L54 22 L104 20 L154 34 L204 38 L254 50 L306 54', macros: { p: 128, c: 205, f: 61 } },
  '30': { kcal: [2080, 2210, 1960, 2140, 2050, 1890, 2230, 2010, 2120, 1980], labels: ['S1', '', 'S2', '', '', 'S3', '', '', 'S4', ''], avg: 2067, weight: '78,4', delta: '−1,4 kg en 30 días', path: 'M4 8 L44 12 L84 18 L124 16 L164 28 L204 34 L244 40 L284 48 L306 54', macros: { p: 131, c: 210, f: 59 } },
  '90': { kcal: [2240, 2190, 2150, 2120, 2080, 2010, 2060, 1990, 2030, 1980, 2050, 2000], labels: ['ago', '', '', '', 'sep', '', '', '', 'oct', '', '', 'nov'], avg: 2075, weight: '78,4', delta: '−3,2 kg en 90 días', path: 'M4 6 L60 14 L116 22 L172 30 L228 40 L284 50 L306 56', macros: { p: 126, c: 214, f: 62 } },
};

function KcalChart({ data, current, height }: { data: number[]; current?: number; height: number }) {
  const cols = { gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` };
  const scale = height - 32;
  return (
    <div role="img" aria-label="Calorías por día frente a la meta" className="bcr-chart" style={{ ...cols, height }}>
      <div aria-hidden="true" className="bcr-chart-goal" style={{ bottom: scale }} />
      {data.map((k, i) => (
        <div key={i} className={`bcr-bar ${!k ? 'is-empty' : i === current ? 'is-current' : ''}`} style={{ height: k ? Math.round((k / GOAL.kcal) * scale) : 4 }} />
      ))}
    </div>
  );
}

function SummaryScreen({ onNavigate }: { onNavigate: (s: Screen | 'add') => void }) {
  const [range, setRange] = useState('7');
  const r = RANGES[range];
  const cols = { gridTemplateColumns: `repeat(${r.kcal.length}, minmax(0, 1fr))` };
  return (
    <>
      <header style={{ padding: '16px 20px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h2 className="bcr-h1">Resumen</h2>
        <Tabs.Root value={range} onValueChange={(v) => setRange(String(v))}>
          <Tabs.List className="bcr-range" aria-label="Periodo">
            <Tabs.Tab value="7">7 días</Tabs.Tab>
            <Tabs.Tab value="30">30 días</Tabs.Tab>
            <Tabs.Tab value="90">90 días</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
      </header>
      <div className="bcr-scroll" style={{ paddingTop: 0, paddingBottom: 12 }}>
        <section className="bcr-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 600 }}>Calorías</div>
            <div className="quiet" style={{ fontSize: 13 }}>meta {fmt(GOAL.kcal)}</div>
          </div>
          <div><span className="bcr-display" style={{ fontWeight: 700, fontSize: 32 }}>{fmt(r.avg)}</span> <span className="quiet" style={{ fontSize: 13 }}>kcal por día registrado</span></div>
          <KcalChart data={r.kcal} current={range === '7' ? 3 : undefined} height={120} />
          <div aria-hidden="true" className="bcr-axis" style={cols}>{r.labels.map((l, i) => <span key={i}>{l}</span>)}</div>
          <div className="quiet" style={{ fontSize: 13 }}>{range === '7' ? 'Los días sin registro no cuentan en el promedio.' : 'Cada barra es el promedio de esos días.'}</div>
        </section>
        <section className="bcr-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 600 }}>Peso</div>
            <div className="quiet" style={{ fontSize: 13 }}>{r.delta}</div>
          </div>
          <div><span className="bcr-display" style={{ fontWeight: 700, fontSize: 32 }}>{r.weight}</span> <span className="quiet" style={{ fontSize: 13 }}>kg hoy</span></div>
          <svg role="img" aria-label={`Tendencia de peso: ${r.delta}`} viewBox="0 0 310 70" style={{ width: '100%', height: 70, display: 'block' }}>
            <path d={r.path} fill="none" stroke="var(--b-protein)" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            <circle cx={306} cy={54} r={5} fill="var(--b-protein)" />
          </svg>
        </section>
        <section className="bcr-card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontWeight: 600 }}>Macros promedio</div>
          <MacroBars t={{ kcal: r.avg, ...r.macros }} />
        </section>
      </div>
      <TabBar current="summary" onNavigate={onNavigate} />
    </>
  );
}

function Phone({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bcr-board">
      <div className="bcr-board-label">{label}</div>
      <div className="bcr-phone">{children}</div>
    </div>
  );
}

function MobileBoards() {
  const [day, setDay] = useState(TODAY);
  /* El primer teléfono navega solo; los otros dos fijan su pantalla para verlas lado a lado. */
  const [screen, setScreen] = useState<Screen | 'add'>('diary');
  return (
    <div className="bcr-canvas">
      <Phone label="Navegable · toca + o Resumen">
        {screen === 'diary' && <DiaryScreen day={day} setDay={setDay} onNavigate={setScreen} />}
        {screen === 'add' && <AddScreen onNavigate={setScreen} />}
        {screen === 'summary' && <SummaryScreen onNavigate={setScreen} />}
      </Phone>
      <Phone label="Agregar alimento · selección múltiple">
        <AddScreen onNavigate={() => undefined} />
      </Phone>
      <Phone label="Resumen">
        <SummaryScreen onNavigate={() => undefined} />
      </Phone>
    </div>
  );
}

function WebBoard() {
  const [day, setDay] = useState(TODAY);
  const [section, setSection] = useState('Diario');
  const meals = LOGS[day] ?? [];
  const rows = meals.flatMap((m) => m.foods.map((f) => ({ ...f, hour: m.hour })));
  const t = totals(meals);
  const weekday = WEEKDAY_NAMES[(day - 9 + 70) % 7];
  const month = useMemo(() => {
    const cells: (number | null)[] = Array.from({ length: 6 }, () => null);
    for (let d = 1; d <= 30; d++) cells.push(d);
    return cells;
  }, []);
  const logged = new Set([2, 3, 4, 5, 6, 9, 10, 11, 12]);
  const step = (delta: number) => setDay((d) => Math.min(30, Math.max(1, d + delta)));
  return (
    <div className="bcr-canvas">
      <div className="bcr-web">
        <aside className="bcr-aside">
          <div className="bcr-display" style={{ fontWeight: 700, fontSize: 26 }}>Balance</div>
          <nav aria-label="Secciones" className="bcr-nav">
            {['Diario', 'Alimentos', 'Resumen', 'Mediciones', 'Importar'].map((s) => (
              <button key={s} type="button" aria-current={section === s ? 'page' : undefined} onClick={() => setSection(s)}>{s}</button>
            ))}
          </nav>
          <div className="bcr-card bcr-month">
            <div>
              <div style={{ fontWeight: 600 }}>Noviembre 2026</div>
              <div className="quiet" style={{ fontSize: 13 }}>{logged.size} días con registros</div>
            </div>
            <div aria-hidden="true" className="bcr-month-grid quiet" style={{ textAlign: 'center', fontSize: 11 }}>
              {WEEKDAYS.map((w) => <span key={w} style={{ height: 'auto', color: 'var(--b-ink-2)' }}>{w}</span>)}
            </div>
            <div className="bcr-month-grid">
              {month.map((d, i) =>
                d === null ? <span key={`e${i}`} /> : (
                  <button key={d} type="button" aria-pressed={d === day} aria-label={`${d} de noviembre${logged.has(d) ? ', con registros' : ''}`} className={[logged.has(d) ? 'is-logged' : '', d > TODAY ? 'is-future' : ''].join(' ')} onClick={() => setDay(d)}>
                    {d}
                  </button>
                ),
              )}
            </div>
                      </div>
        </aside>
        <main className="bcr-main">
          <div className="bcr-cmd">
            <span className="quiet" style={{ display: 'inline-flex' }}><Icon d={I.plus} size={18} width={2.2} /></span>
            <label htmlFor="bcr-cmd" className="sr-only">Agregar alimento o escribir un comando</label>
            <input id="bcr-cmd" type="text" placeholder="Agrega: 150 g pollo con arroz a las 13:00" />
            <span className="bcr-kbd">/</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 12 }}>
            <div style={{ marginRight: 'auto' }}>
              <h2 className="bcr-h1" style={{ fontSize: 32 }}>{day === TODAY ? 'Hoy' : day === TODAY - 1 ? 'Ayer' : `${day} de noviembre`}</h2>
              <div className="quiet" style={{ marginTop: 2 }}>{weekday} {day} de noviembre</div>
            </div>
            <button type="button" className="bcr-icon-btn" style={{ borderRadius: 12 }} aria-label="Día anterior" onClick={() => step(-1)}><Icon d={I.back} size={18} width={2.2} /></button>
            <button type="button" className="bcr-icon-btn" style={{ borderRadius: 12 }} aria-label="Día siguiente" onClick={() => step(1)}><Icon d={I.next} size={18} width={2.2} /></button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', gap: 20 }}>
            <div className="bcr-card bcr-table-wrap">
              {rows.length === 0 ? (
                <div className="bcr-empty">
                  <div style={{ fontWeight: 600 }}>Sin registros este día</div>
                  <div className="quiet" style={{ fontSize: 14 }}>Escribe en la barra de arriba para agregar.</div>
                </div>
              ) : (
                <table className="bcr-table">
                  <thead>
                    <tr>
                      <th scope="col">Hora</th><th scope="col">Alimento</th><th scope="col">Porción</th>
                      <th scope="col" className="num">kcal</th><th scope="col" className="num">Prot.</th><th scope="col" className="num">Carb.</th><th scope="col" className="num">Grasa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r, i) => (
                      <tr key={i}>
                        <td className="bcr-display" style={{ fontWeight: 600, letterSpacing: 0 }}>{r.hour}</td>
                        <td style={{ fontWeight: 500 }}>{r.name}</td>
                        <td className="quiet">{r.portion}</td>
                        <td className="num" style={{ fontWeight: 600 }}>{r.kcal}</td>
                        <td className="num">{r.p}</td><td className="num">{r.c}</td><td className="num">{r.f}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan={3}>Total del día</td>
                      <td className="num">{fmt(t.kcal)}</td><td className="num">{t.p}</td><td className="num">{t.c}</td><td className="num">{t.f}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </div>
            <div className="bcr-side">
              <DaySummary t={t} style={{ margin: 0, padding: 20 }} />
              <section className="bcr-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                  <div style={{ fontWeight: 600 }}>Esta semana</div>
                  <div className="quiet" style={{ fontSize: 13 }}>meta {fmt(GOAL.kcal)}</div>
                </div>
                <KcalChart data={RANGES['7'].kcal} current={3} height={110} />
                <div aria-hidden="true" className="bcr-axis" style={{ gridTemplateColumns: 'repeat(7, minmax(0, 1fr))' }}>{WEEKDAYS.map((w) => <span key={w}>{w}</span>)}</div>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export function BalanceCleanRedesign() {
  const [dark, setDark] = useState(false);
  const [view, setView] = useState('mobile');
  return (
    <div className="bcr" data-theme={dark ? 'dark' : 'light'}>
      <div className="bcr-toolbar">
        <div className="bcr-toolbar-title">
          <strong>Balance · rediseño limpio</strong>
          <span>Papel neutro, tinta y tres colores de macros. Mismos tokens en claro y oscuro.</span>
        </div>
        <Tabs.Root value={view} onValueChange={(v) => setView(String(v))}>
          <Tabs.List className="bcr-seg" aria-label="Vista">
            <Tabs.Tab value="mobile">Móvil</Tabs.Tab>
            <Tabs.Tab value="web">Web</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
        <label className="bcr-switch">
          <Switch.Root className="bcr-switch-root" checked={dark} onCheckedChange={(checked) => setDark(checked)}>
            <Switch.Thumb className="bcr-switch-thumb" />
          </Switch.Root>
          Tema oscuro
        </label>
      </div>
      {view === 'mobile' ? <MobileBoards /> : <WebBoard />}
    </div>
  );
}
