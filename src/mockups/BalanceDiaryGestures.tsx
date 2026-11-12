import { useEffect, useId, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode, WheelEvent as ReactWheelEvent } from 'react';
import { Switch } from '@base-ui/react/switch';
import { Tabs } from '@base-ui/react/tabs';
import './BalanceCleanRedesign.css';
import './BalanceDiaryGestures.css';

/* Mockups de BAL-067 (diario en un solo scroll con encabezado que se compacta)
   y BAL-066 (elegir la hora manteniendo o arrastrando +). Jueves 12 de noviembre de 2026, 21:10. */
type Food = { name: string; portion: string; kcal: number; p: number; c: number; f: number };
type Meal = { hour: string; foods: Food[] };

const TODAY = 12;
const NOW = '21:10';
const GOAL = { kcal: 2200, p: 150, c: 220, f: 65 };
const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
const WEEKDAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

const F = {
  avena: { name: 'Avena con leche', portion: '1 taza', kcal: 310, p: 14, c: 48, f: 7 },
  platano: { name: 'Plátano', portion: '1 unidad', kcal: 105, p: 1, c: 27, f: 0 },
  cafe: { name: 'Café con leche', portion: '1 taza', kcal: 60, p: 3, c: 5, f: 3 },
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
    { hour: '07:30', foods: [F.avena, F.platano, F.cafe] },
    { hour: '10:30', foods: [F.yogur] },
    { hour: '13:00', foods: [F.pollo, F.ensalada] },
    { hour: '16:30', foods: [F.marraqueta, F.cafe] },
    { hour: '20:00', foods: [F.huevos, F.pan] },
  ],
};

const totals = (meals: Meal[] = []) =>
  meals.flatMap((m) => m.foods).reduce((t, x) => ({ kcal: t.kcal + x.kcal, p: t.p + x.p, c: t.c + x.c, f: t.f + x.f }), { kcal: 0, p: 0, c: 0, f: 0 });
const fmt = (n: number) => n.toLocaleString('es-CL');
const pct = (v: number, max: number) => `${Math.min(100, Math.round((v / max) * 100))}%`;
const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));
const lerp = (from: number, to: number, p: number) => from + (to - from) * p;
/* Opacidad de una capa: desaparece entre a y b, o aparece entre a y b si rising. */
const fade = (p: number, a: number, b: number, rising = false) => {
  const t = clamp((p - a) / (b - a));
  return rising ? t : 1 - t;
};

const MACROS = [
  { key: 'p', name: 'Proteína', target: GOAL.p, color: 'var(--b-protein)' },
  { key: 'c', name: 'Carbohidratos', target: GOAL.c, color: 'var(--b-carbs)' },
  { key: 'f', name: 'Grasa', target: GOAL.f, color: 'var(--b-fat)' },
] as const;

const Icon = ({ d, size = 20, width = 2 }: { d: string; size?: number; width?: number }) => (
  <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={width} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const I = {
  calendar: 'M4 9h16M8 3v4M16 3v4M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  plus: 'M12 5v14M5 12h14',
  back: 'M15 5l-7 7 7 7',
  diary: 'M6 4h12a1 1 0 0 1 1 1v15l-3-2-2 2-2-2-2 2-2-2-3 2V5a1 1 0 0 1 1-1zM9 9h6M9 13h6',
  trend: 'M4 18l5-6 4 3 7-9',
  bars: 'M6 20V11M12 20V5M18 20v-6',
  user: 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 20c1.5-4 4.5-6 8-6s6.5 2 8 6',
  search: 'M11 4.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM16 16l4 4',
  clock: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM12 7.5V12l3 2',
};

/* Alturas del encabezado. El compacto queda en menos de un tercio del expandido (108 ≤ 368 / 3). */
const KCAL_FULL = 232;
const EXPANDED = 64 + 72 + KCAL_FULL;
const COMPACT = 108;
const RANGE = EXPANDED - COMPACT;

const dayLabel = (day: number) => {
  const weekday = WEEKDAY_NAMES[day - 9];
  if (day === TODAY) return 'Hoy';
  if (day === TODAY - 1) return 'Ayer';
  return `${weekday[0].toUpperCase()}${weekday.slice(1)}`;
};

function DiaryHeader({ day, setDay, p, onWheel }: { day: number; setDay: (d: number) => void; p: number; onWheel?: (e: ReactWheelEvent) => void }) {
  const t = totals(LOGS[day]);
  const left = GOAL.kcal - t.kcal;
  const compact = p > 0.5;
  return (
    <header className="bdg-header" style={{ height: lerp(EXPANDED, COMPACT, p), boxShadow: p >= 1 ? '0 1px 0 var(--b-line)' : 'none' }} onWheel={onWheel}>
      <div className="bdg-title" style={{ height: lerp(64, 36, p) }}>
        <div className="bdg-layer bdg-title-full" style={{ opacity: fade(p, 0, 0.55), transform: `translateY(${-p * 28}px)` }} aria-hidden={compact} inert={compact}>
          <div style={{ marginRight: 'auto' }}>
            <h2 className="bcr-h1">{dayLabel(day)}</h2>
            <div className="bcr-sub">{WEEKDAY_NAMES[day - 9]} {day} de noviembre</div>
          </div>
          <button type="button" className="bcr-icon-btn" aria-label="Elegir fecha"><Icon d={I.calendar} /></button>
        </div>
        <div className="bdg-layer bdg-title-compact" style={{ opacity: fade(p, 0.3, 0.8, true) }} aria-hidden={!compact} inert={!compact}>
          <span className="bdg-compact-date">{dayLabel(day)} · {day} nov</span>
          <button type="button" className="bdg-mini-btn" aria-label="Elegir fecha"><Icon d={I.calendar} size={18} /></button>
        </div>
      </div>
      <nav aria-label="Semana" className="bcr-week" style={{ padding: `${lerp(4, 2, p)}px 20px ${lerp(8, 4, p)}px` }}>
        {WEEKDAYS.map((letter, i) => {
          const n = 9 + i;
          const cls = ['bcr-day', LOGS[n] ? 'is-logged' : '', n > TODAY ? 'is-future' : ''].join(' ');
          return (
            <button key={n} type="button" className={cls} style={{ minHeight: lerp(60, 36, p) }} aria-pressed={n === day}
              aria-label={`${WEEKDAY_NAMES[i]} ${n} de noviembre${LOGS[n] ? ', con registros' : ''}`} onClick={() => setDay(n)}>
              <span className="bcr-day-letter bdg-day-letter" style={{ opacity: fade(p, 0, 0.5), maxHeight: lerp(16, 0, p) }}>{letter}</span>
              <span className="bcr-day-num" style={{ fontSize: lerp(17, 15, p) }}>{n}</span>
              <span aria-hidden="true" className="bcr-day-mark" style={{ height: lerp(4, 3, p) }} />
            </button>
          );
        })}
      </nav>
      <div className="bdg-kcal-area" style={{ height: lerp(KCAL_FULL, 30, p) }}>
        {/* La tarjeta se va hacia arriba bajo la semana al ritmo del scroll, en vez de dejar un hueco. */}
        <div className="bdg-layer bdg-kcal-full" style={{ opacity: fade(p, 0.2, 0.7), transform: `translateY(${-(KCAL_FULL - 30) * p}px)` }} aria-hidden={compact} inert={compact}>
          <section aria-label="Resumen del día" className="bcr-card bdg-summary">
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
            <div aria-hidden="true" className="bcr-meter"><span style={{ width: pct(t.kcal, GOAL.kcal) }} /></div>
            <div className="bcr-macros">
              {MACROS.map((m) => (
                <div key={m.key} className="bcr-macro">
                  <div className="quiet" style={{ fontSize: 12 }}>{m.name}</div>
                  <div style={{ fontWeight: 600 }}>{t[m.key]} <span className="quiet" style={{ fontWeight: 400, fontSize: 13 }}>/ {m.target} g</span></div>
                  <div aria-hidden="true" className="bcr-meter is-thin"><span style={{ width: pct(t[m.key], m.target), background: m.color }} /></div>
                </div>
              ))}
            </div>
          </section>
          <div className="bdg-weight">
            <span>Peso</span>
            <strong>78,4 kg</strong>
            <span className="quiet" style={{ marginRight: 'auto', fontSize: 13 }}>−0,6 kg esta semana</span>
            <button type="button" className="bdg-link-btn">Registrar</button>
          </div>
        </div>
        <div className="bdg-layer bdg-kcal-compact" style={{ opacity: fade(p, 0.7, 1, true) }} aria-hidden={!compact}>
          <span><strong>{fmt(t.kcal)}</strong> <span className="quiet">/ {fmt(GOAL.kcal)} kcal</span></span>
          <div aria-hidden="true" className="bcr-meter is-thin"><span style={{ width: pct(t.kcal, GOAL.kcal) }} /></div>
        </div>
      </div>
    </header>
  );
}

function MealFeed({ day, onAddAt }: { day: number; onAddAt: (hour: string) => void }) {
  const meals = LOGS[day] ?? [];
  if (meals.length === 0) {
    return (
      <div className="bcr-card bcr-empty">
        <div style={{ fontWeight: 600 }}>{day > TODAY ? 'Este día todavía no llega' : 'Sin registros este día'}</div>
        <div className="quiet" style={{ fontSize: 14 }}>Agrega lo que comiste con el botón +.</div>
      </div>
    );
  }
  return (
    <>
      {meals.map((m) => (
        <section key={m.hour} aria-label={`Comidas de las ${m.hour}`}>
          <div className="bcr-group-head">
            <span className="bcr-group-hour">{m.hour}</span>
            <span className="quiet" style={{ fontSize: 13, marginRight: 'auto' }}>{fmt(totals([m]).kcal)} kcal</span>
            <button type="button" className="bcr-icon-btn is-outline" style={{ height: 36, borderRadius: 12 }} aria-label={`Agregar a las ${m.hour}`} onClick={() => onAddAt(m.hour)}>
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
      ))}
    </>
  );
}

/* Diario: una sola lista desplazable; el encabezado flota encima y su altura sigue al scroll. */
function Diary({ forced, onAddAt }: { forced?: number; onAddAt: (hour: string) => void }) {
  const [day, setDay] = useState(TODAY);
  const [scroll, setScroll] = useState(0);
  const scroller = useRef<HTMLDivElement>(null);
  const p = forced ?? clamp(scroll / RANGE);
  /* Cambiar de día vuelve arriba, como hoy. */
  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
    setScroll(0);
  }, [day]);
  const forward = (e: ReactWheelEvent) => {
    if (scroller.current) scroller.current.scrollTop += e.deltaY;
  };
  return (
    <div className="bdg-body">
      <div ref={scroller} className="bdg-scroll" style={{ paddingTop: (forced === undefined ? EXPANDED : lerp(EXPANDED, COMPACT, forced)) + 12 }}
        onScroll={(e) => setScroll(e.currentTarget.scrollTop)}>
        <MealFeed day={day} onAddAt={onAddAt} />
      </div>
      <DiaryHeader day={day} setDay={setDay} p={p} onWheel={forward} />
    </div>
  );
}

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5);
const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;
const SLOT = 26;
const HOLD_MS = 300;
const DRAG_START = 8;
/* Margen lateral fuera del riel antes de cancelar. */
const SIDE_SLACK = 44;

type Order = 'morning-top' | 'morning-bottom';
type Gesture = { id: number; x: number; y: number; timer: number };

function TabBar({ children }: { children: ReactNode }) {
  const tab = (label: string, icon: string, current?: boolean) => (
    <button type="button" className="bcr-tab" aria-current={current ? 'page' : undefined}>
      <Icon d={icon} size={22} />
      {label}
    </button>
  );
  return (
    <nav aria-label="Secciones" className="bcr-tabbar">
      {tab('Diario', I.diary, true)}
      {tab('Mediciones', I.trend)}
      {children}
      {tab('Resumen', I.bars)}
      {tab('Perfil', I.user)}
    </nav>
  );
}

function AddPreview({ hour, how, onBack }: { hour: string; how: string; onBack: () => void }) {
  return (
    <>
      <header className="bcr-header" style={{ paddingBottom: 12 }}>
        <button type="button" className="bcr-icon-btn" aria-label="Volver al diario" onClick={onBack}><Icon d={I.back} width={2.2} /></button>
        <div className="bcr-header-title">
          <div className="bcr-display" style={{ fontWeight: 700, fontSize: 22, lineHeight: 1.1 }}>Agregar</div>
          <div className="quiet" style={{ fontSize: 13 }}>Hoy</div>
        </div>
        <button type="button" className="bcr-icon-btn is-solid" style={{ width: 'auto', padding: '0 14px', gap: 8, fontWeight: 600 }} aria-label={`Cambiar hora, ahora ${hour}`}>
          <Icon d={I.clock} size={16} width={2.2} />{hour}
        </button>
      </header>
      <div className="bcr-scroll">
        <div className="bcr-card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 600 }}>Hora {hour}</div>
          <div className="quiet" style={{ fontSize: 14 }}>{how}</div>
        </div>
        <div className="bcr-search">
          <span className="quiet" style={{ display: 'inline-flex' }}><Icon d={I.search} size={18} width={2.2} /></span>
          <input type="search" placeholder="Buscar alimento" aria-label="Buscar alimento" />
        </div>
        <div className="bcr-list">
          {[F.pollo, F.ensalada, F.avena, F.yogur].map((f) => (
            <div key={f.name} className="bcr-row" style={{ minHeight: 60 }}>
              <div className="bcr-row-main">
                <div className="bcr-row-name">{f.name}</div>
                <div className="bcr-row-meta">{f.portion} · {f.kcal} kcal</div>
              </div>
              <span className="bcr-icon-btn is-outline" aria-hidden="true"><Icon d={I.plus} size={18} width={2.6} /></span>
            </div>
          ))}
        </div>
      </div>
      <div className="bcr-footer">
        <div style={{ marginRight: 'auto' }}>
          <div style={{ fontWeight: 600 }}>0 alimentos</div>
          <div className="quiet" style={{ fontSize: 13 }}>a las {hour}</div>
        </div>
        <button type="button" className="bcr-primary" disabled>Guardar</button>
      </div>
    </>
  );
}

/* Teléfono navegable: el diario compacta su encabezado y el + abre el riel de horas. */
function GesturePhone({ order, forced, label, onLog }: { order: Order; forced?: number; label: string; onLog: (msg: string) => void }) {
  const [add, setAdd] = useState<{ hour: string; how: string } | null>(null);
  const [rail, setRail] = useState(false);
  const [hour, setHour] = useState<number | null>(null);
  const gesture = useRef<Gesture | null>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const suppressClick = useRef(false);
  const hintId = useId();
  const hours = order === 'morning-top' ? HOURS : [...HOURS].reverse();

  useEffect(() => () => {
    if (gesture.current) window.clearTimeout(gesture.current.timer);
  }, []);

  const open = (h: string, how: string) => {
    setAdd({ hour: h, how });
    onLog(`${how} → Agregar a las ${h}`);
  };
  const hourAt = (x: number, y: number) => {
    const box = railRef.current?.getBoundingClientRect();
    if (!box) return null;
    if (x < box.left - SIDE_SLACK || x > box.right + SIDE_SLACK || y < box.top - SLOT || y > box.bottom) return null;
    return hours[clamp(Math.floor((y - box.top) / SLOT), 0, hours.length - 1)];
  };
  const showRail = () => {
    if (gesture.current) window.clearTimeout(gesture.current.timer);
    setRail(true);
    setHour(null);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    suppressClick.current = false;
    gesture.current = { id: e.pointerId, x: e.clientX, y: e.clientY, timer: window.setTimeout(showRail, HOLD_MS) };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    if (!rail) {
      if (g.y - e.clientY > DRAG_START) showRail();
      return;
    }
    setHour(hourAt(e.clientX, e.clientY));
  };
  const finish = (e: ReactPointerEvent<HTMLButtonElement>, cancelled: boolean) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    window.clearTimeout(g.timer);
    gesture.current = null;
    if (!rail) return; // un toque normal lo resuelve onClick
    suppressClick.current = true;
    const picked = cancelled ? null : hourAt(e.clientX, e.clientY);
    setRail(false);
    setHour(null);
    if (picked === null) onLog('Riel abierto y soltado fuera → cancelado, sigue en el diario');
    else open(hh(picked), 'Elegida en el riel');
  };
  const onClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    open(NOW, 'Toque en + (hora actual)');
  };

  return (
    <div className="bcr-board">
      <div className="bcr-board-label">{label}</div>
      <div className="bcr-phone bdg-phone">
        {add ? (
          <AddPreview hour={add.hour} how={add.how} onBack={() => setAdd(null)} />
        ) : (
          <>
            <Diary forced={forced} onAddAt={(h) => open(h, `+ del grupo de las ${h}`)} />
            <TabBar>
              <button type="button" className="bcr-tab-add bdg-add" aria-label="Agregar alimento"
                aria-describedby={hintId}
                onPointerDown={onPointerDown} onPointerMove={onPointerMove}
                onPointerUp={(e) => finish(e, false)} onPointerCancel={(e) => finish(e, true)} onClick={onClick}
                onContextMenu={(e) => e.preventDefault()}>
                <Icon d={I.plus} size={24} width={2.4} />
              </button>
              <span id={hintId} className="sr-only">Mantén presionado o desliza hacia arriba para elegir la hora</span>
            </TabBar>
          </>
        )}
        {rail && (
          <div className="bdg-scrim" aria-hidden="true">
            <div ref={railRef} className="bdg-rail" style={{ height: SLOT * hours.length }}>
              {hours.map((h) => (
                <div key={h} className={`bdg-slot${h === hour ? ' is-active' : ''}`} style={{ height: SLOT }}>{hh(h)}</div>
              ))}
            </div>
            <div className="bdg-rail-hint">{hour === null ? 'Desliza hasta una hora · suelta fuera para cancelar' : `Suelta para agregar a las ${hh(hour)}`}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export function BalanceDiaryGestures() {
  const [dark, setDark] = useState(false);
  const [order, setOrder] = useState<Order>('morning-top');
  const [log, setLog] = useState('Todavía no hay gestos.');
  return (
    <div className="bcr" data-theme={dark ? 'dark' : 'light'}>
      <div className="bcr-toolbar">
        <div className="bcr-toolbar-title">
          <strong>Balance · diario compacto y hora desde +</strong>
          <span>BAL-067: desplaza el diario y el encabezado se compacta. BAL-066: mantén o arrastra + hacia arriba para elegir la hora.</span>
        </div>
        <Tabs.Root value={order} onValueChange={(v) => setOrder(v as Order)}>
          <Tabs.List className="bcr-seg" aria-label="Orden del riel">
            <Tabs.Tab value="morning-top">05:00 arriba</Tabs.Tab>
            <Tabs.Tab value="morning-bottom">05:00 abajo</Tabs.Tab>
          </Tabs.List>
        </Tabs.Root>
        <label className="bcr-switch">
          <Switch.Root className="bcr-switch-root" checked={dark} onCheckedChange={(checked) => setDark(checked)}>
            <Switch.Thumb className="bcr-switch-thumb" />
          </Switch.Root>
          Tema oscuro
        </label>
      </div>
      <div className="bcr-canvas">
        <GesturePhone order={order} onLog={setLog} label="Navegable · desplaza el diario · toca, mantén o arrastra +" />
        <GesturePhone order={order} onLog={setLog} forced={1} label="Encabezado compacto (fijo, para comparar)" />
        <aside className="bdg-notes">
          <div style={{ fontWeight: 600 }}>Último gesto</div>
          <div aria-live="polite" className="quiet">{log}</div>
          <div style={{ fontWeight: 600, marginTop: 12 }}>Cómo probar</div>
          <ul className="quiet">
            <li>Toque en +: abre Agregar a la hora actual ({NOW}).</li>
            <li>Mantén + ({HOLD_MS} ms) o arrástralo hacia arriba: aparece el riel 05:00–23:00.</li>
            <li>Desliza sobre el riel: la hora resaltada sigue el dedo. Suelta para abrir Agregar a esa hora.</li>
            <li>Suelta fuera del riel (a un lado o bajo él): se cancela.</li>
            <li>Desplaza el diario: el encabezado pasa de {EXPANDED} px a {COMPACT} px; macros y peso se ocultan. Al volver arriba se expande.</li>
            <li>TalkBack (en la app): acciones de accesibilidad en + para elegir la hora.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
