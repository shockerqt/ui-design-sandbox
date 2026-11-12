import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, ReactNode, WheelEvent as ReactWheelEvent } from 'react';
import { Switch } from '@base-ui/react/switch';
import { Tabs } from '@base-ui/react/tabs';
import './BalanceCleanRedesign.css';
import './BalanceDiaryGestures.css';

/* Mockups de BAL-067 (diario en un solo scroll con encabezado que se compacta y guard de listas cortas),
   BAL-066 (+ dual: toque abre menú direccional; swipe/mantener entra a radial ascendente/peso/ahora)
   y variantes limpias de macros en el diario. Jueves 12 de noviembre de 2026, 21:10. */
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

/* Calibrado para probar los 3 regímenes de scroll:
   - Día 9 (L 9): corto, cabe completo sin scrollear (p = 0 fijo).
   - Día 11 (X 11): desborde corto (< RANGE = 260 px), runway dinámico completa p = 1.
   - Día 12 (J 12 · Hoy): desborde completo (> RANGE). */
const LOGS: Record<number, Meal[]> = {
  9: [
    { hour: '08:30', foods: [F.huevos, F.pan] },
    { hour: '13:30', foods: [F.porotos, F.ensalada] },
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

const INITIAL_WEIGHTS: Record<number, number> = {
  9: 79.0,
  10: 78.8,
  11: 78.6,
  12: 78.4,
};

const totals = (meals: Meal[] = []) =>
  meals.flatMap((m) => m.foods).reduce((t, x) => ({ kcal: t.kcal + x.kcal, p: t.p + x.p, c: t.c + x.c, f: t.f + x.f }), { kcal: 0, p: 0, c: 0, f: 0 });
const fmt = (n: number) => n.toLocaleString('es-CL');
const fmtKg = (n: number) => n.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const pct = (v: number, max: number) => `${Math.min(100, Math.round((v / max) * 100))}%`;
const round1 = (n: number) => Math.round(n * 10) / 10;
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
  close: 'M6 6l12 12M18 6l-12 12',
  back: 'M15 5l-7 7 7 7',
  diary: 'M6 4h12a1 1 0 0 1 1 1v15l-3-2-2 2-2-2-2 2-2-2-3 2V5a1 1 0 0 1 1-1zM9 9h6M9 13h6',
  trend: 'M4 18l5-6 4 3 7-9',
  bars: 'M6 20V11M12 20V5M18 20v-6',
  user: 'M12 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8zM4 20c1.5-4 4.5-6 8-6s6.5 2 8 6',
  search: 'M11 4.5a6.5 6.5 0 1 1 0 13 6.5 6.5 0 0 1 0-13zM16 16l4 4',
  clock: 'M12 3.5a8.5 8.5 0 1 1 0 17 8.5 8.5 0 0 1 0-17zM12 7.5V12l3 2',
  scale: 'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zM8 10a4 4 0 0 1 8 0l-4 3-4-3z',
  utensils: 'M6 3v7a2 2 0 0 0 2 2h1v9M8 3v5M10 3v7a2 2 0 0 1-2 2M16 3v18M16 3c2.2 0 3.5 2 3.5 5s-1.3 4.5-3.5 4.5',
};

/* Alturas del encabezado sin fila inline de peso. Compacto queda en <= 1/3 del expandido (108 <= 324 / 3). */
const KCAL_FULL = 188;
const EXPANDED = 64 + 72 + KCAL_FULL;
const COMPACT = 108;
const RANGE = EXPANDED - COMPACT;
const BASE_SCROLL_TOP_PAD = EXPANDED + 12;
const BASE_SCROLL_BOTTOM_PAD = 16;

type MacroKey = (typeof MACROS)[number]['key'];
type MacroMode = 'plain' | 'bar' | 'bar-focus' | 'meal-totals';

function macroCalShares(t: { p: number; c: number; f: number }) {
  const pk = t.p * 4;
  const ck = t.c * 4;
  const fk = t.f * 9;
  const total = pk + ck + fk;
  if (total <= 0) return { p: 0, c: 0, f: 0 };
  return {
    p: (pk / total) * 100,
    c: (ck / total) * 100,
    f: (fk / total) * 100,
  };
}

function MacroMicroBar({ t, focus }: { t: { p: number; c: number; f: number }; focus: MacroKey | null }) {
  const shares = macroCalShares(t);
  return (
    <span className="bdg-macro-bar" aria-hidden="true">
      {MACROS.map((m) => (
        <span
          key={m.key}
          className={focus && focus !== m.key ? 'is-dim' : undefined}
          style={{ width: `${shares[m.key].toFixed(1)}%`, background: m.color }}
        />
      ))}
    </span>
  );
}

const dayLabel = (day: number) => {
  const weekday = WEEKDAY_NAMES[day - 9] ?? '';
  if (day === TODAY) return 'Hoy';
  if (day === TODAY - 1) return 'Ayer';
  return weekday ? `${weekday[0].toUpperCase()}${weekday.slice(1)}` : `Día ${day}`;
};

const dayShort = (day: number) => (day === TODAY ? 'hoy' : day === TODAY - 1 ? 'ayer' : `${day} nov`);

function previousWeightFor(day: number, weights: Record<number, number>): { day: number; value: number } | null {
  const priorDays = Object.keys(weights).map(Number).filter((d) => d < day).sort((a, b) => b - a);
  if (priorDays.length === 0) return null;
  return { day: priorDays[0], value: weights[priorDays[0]] };
}

function DiaryHeader({
  day, setDay, p, macroMode, focusMacro, onToggleFocusMacro, onWheel,
}: {
  day: number;
  setDay: (d: number) => void;
  p: number;
  macroMode: MacroMode;
  focusMacro: MacroKey | null;
  onToggleFocusMacro: (key: MacroKey) => void;
  onWheel?: (e: ReactWheelEvent) => void;
}) {
  const t = totals(LOGS[day]);
  const left = GOAL.kcal - t.kcal;
  const compact = p > 0.5;
  const interactiveMacros = macroMode === 'bar-focus';

  return (
    <header className="bdg-header" style={{ height: lerp(EXPANDED, COMPACT, p), boxShadow: p >= 1 ? '0 1px 0 var(--b-line)' : 'none' }} onWheel={onWheel}>
      <div className="bdg-title" style={{ height: lerp(64, 36, p) }}>
        <div className="bdg-layer bdg-title-full" style={{ opacity: fade(p, 0, 0.42), transform: `translateY(${-p * 28}px)` }} aria-hidden={compact} inert={compact}>
          <div style={{ marginRight: 'auto' }}>
            <h2 className="bcr-h1">{dayLabel(day)}</h2>
            <div className="bcr-sub">{WEEKDAY_NAMES[day - 9]} {day} de noviembre</div>
          </div>
          <button type="button" className="bcr-icon-btn" aria-label="Elegir fecha"><Icon d={I.calendar} /></button>
        </div>
        <div className="bdg-layer bdg-title-compact" style={{ opacity: fade(p, 0.58, 1, true) }} aria-hidden={!compact} inert={!compact}>
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
              <span className="bcr-day-letter bdg-day-letter" style={{ opacity: fade(p, 0, 0.45), maxHeight: lerp(16, 0, p) }}>{letter}</span>
              <span className="bcr-day-num" style={{ fontSize: lerp(17, 15, p) }}>{n}</span>
              <span aria-hidden="true" className="bcr-day-mark" style={{ height: lerp(4, 3, p) }} />
            </button>
          );
        })}
      </nav>
      <div className="bdg-kcal-area" style={{ height: lerp(KCAL_FULL, 30, p) }}>
        {/* La tarjeta se va hacia arriba bajo la semana al ritmo del scroll, en vez de dejar un hueco. */}
        <div className="bdg-layer bdg-kcal-full" style={{ opacity: fade(p, 0, 0.42), transform: `translateY(${-(KCAL_FULL - 30) * p}px)` }} aria-hidden={compact} inert={compact}>
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
              {MACROS.map((m) => {
                const isFocused = interactiveMacros && focusMacro === m.key;
                const inner = (
                  <>
                    <div className="quiet bdg-macro-label" style={{ fontSize: 12, color: isFocused ? m.color : undefined }}>
                      <span>{m.name}</span>
                      {interactiveMacros ? <span aria-hidden="true" className="bdg-macro-dot" style={{ background: m.color, opacity: isFocused ? 1 : 0.45 }} /> : null}
                    </div>
                    <div style={{ fontWeight: 600 }}>{t[m.key]} <span className="quiet" style={{ fontWeight: 400, fontSize: 13 }}>/ {m.target} g</span></div>
                    <div aria-hidden="true" className="bcr-meter is-thin"><span style={{ width: pct(t[m.key], m.target), background: m.color }} /></div>
                  </>
                );
                if (!interactiveMacros) {
                  return <div key={m.key} className="bcr-macro">{inner}</div>;
                }
                return (
                  <button
                    key={m.key}
                    type="button"
                    className={`bcr-macro bdg-macro-btn${isFocused ? ' is-focused' : ''}`}
                    style={isFocused ? { '--bdg-focus-color': m.color } as Record<string, string> : undefined}
                    aria-pressed={isFocused}
                    aria-label={`Enfocar ${m.name.toLowerCase()} en el diario`}
                    onClick={() => onToggleFocusMacro(m.key)}
                  >
                    {inner}
                  </button>
                );
              })}
            </div>
          </section>
        </div>
        <div className="bdg-layer bdg-kcal-compact" style={{ opacity: fade(p, 0.58, 1, true) }} aria-hidden={!compact}>
          <span><strong>{fmt(t.kcal)}</strong> <span className="quiet">/ {fmt(GOAL.kcal)} kcal</span></span>
          <div aria-hidden="true" className="bcr-meter is-thin"><span style={{ width: pct(t.kcal, GOAL.kcal) }} /></div>
        </div>
      </div>
    </header>
  );
}

function MealFeed({
  day, macroMode, focusMacro, onAddAt,
}: {
  day: number;
  macroMode: MacroMode;
  focusMacro: MacroKey | null;
  onAddAt: (hour: string) => void;
}) {
  const [expandedFood, setExpandedFood] = useState<string | null>(null);
  const meals = LOGS[day] ?? [];
  const activeFocus = macroMode === 'bar-focus' ? focusMacro : null;
  const focusMeta = activeFocus ? MACROS.find((m) => m.key === activeFocus) : null;
  const canExpandFood = macroMode === 'bar-focus' || macroMode === 'meal-totals';

  useEffect(() => {
    setExpandedFood(null);
  }, [day, macroMode]);

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
      {meals.map((m) => {
        const mealTotals = totals([m]);
        return (
          <section key={m.hour} aria-label={`Comidas de las ${m.hour}`}>
            <div className="bcr-group-head">
              <span className="bcr-group-hour">{m.hour}</span>
              <span
                className="quiet"
                style={{
                  fontSize: 13,
                  color: focusMeta ? focusMeta.color : undefined,
                  fontWeight: focusMeta ? 600 : undefined,
                }}
              >
                {focusMeta ? `${mealTotals[focusMeta.key]} g ${focusMeta.name.toLowerCase()}` : `${fmt(mealTotals.kcal)} kcal`}
              </span>
              {(macroMode === 'bar' || macroMode === 'bar-focus') ? (
                <MacroMicroBar t={mealTotals} focus={activeFocus} />
              ) : null}
              {macroMode === 'meal-totals' ? (
                <span className="bdg-meal-macros" aria-label={`Proteína ${mealTotals.p} gramos, carbohidratos ${mealTotals.c} gramos, grasa ${mealTotals.f} gramos`}>
                  {MACROS.map((macro) => (
                    <span key={macro.key} className="bdg-meal-macro-item">
                      <span aria-hidden="true" className="bdg-dot" style={{ background: macro.color }} />
                      {mealTotals[macro.key]}g
                    </span>
                  ))}
                </span>
              ) : null}
              <button
                type="button"
                className="bcr-icon-btn is-outline"
                style={{ height: 36, borderRadius: 12, marginLeft: 'auto' }}
                aria-label={`Agregar a las ${m.hour}`}
                onClick={() => onAddAt(m.hour)}
              >
                <Icon d={I.plus} size={16} width={2.4} />
              </button>
            </div>
            <div className="bcr-list">
              {m.foods.map((f) => {
                const foodKey = `${day}-${m.hour}-${f.name}`;
                const isOpen = canExpandFood && expandedFood === foodKey;
                const valueText = focusMeta ? `${f[focusMeta.key]} g` : String(f.kcal);
                const valueStyle = { fontWeight: 600, color: focusMeta ? focusMeta.color : undefined };

                if (!canExpandFood) {
                  return (
                    <div key={f.name} className="bcr-row">
                      <div className="bcr-row-main">
                        <div className="bcr-row-name">{f.name}</div>
                        <div className="bcr-row-meta">{f.portion}</div>
                      </div>
                      <div style={valueStyle}>{valueText}</div>
                    </div>
                  );
                }

                return (
                  <div key={f.name} className={`bdg-row-wrap${isOpen ? ' is-open' : ''}`}>
                    <button
                      type="button"
                      className="bcr-row bdg-food-btn"
                      aria-expanded={isOpen}
                      onClick={() => setExpandedFood((cur) => (cur === foodKey ? null : foodKey))}
                    >
                      <div className="bcr-row-main">
                        <div className="bcr-row-name">{f.name}</div>
                        <div className="bcr-row-meta">{f.portion}</div>
                      </div>
                      <div style={valueStyle}>{valueText}</div>
                    </button>
                    {isOpen ? (
                      <div className="bdg-food-detail">
                        <MacroMicroBar t={f} focus={activeFocus} />
                        <span className="bdg-food-macros">
                          <span><i className="bdg-dot" style={{ background: 'var(--b-protein)' }} />{f.p}g P</span>
                          <span><i className="bdg-dot" style={{ background: 'var(--b-carbs)' }} />{f.c}g C</span>
                          <span><i className="bdg-dot" style={{ background: 'var(--b-fat)' }} />{f.f}g G</span>
                        </span>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </>
  );
}

/* Diario: una sola lista desplazable; en listas cortas con desborde garantiza recorrido completo y hace snap al soltar. */
function Diary({
  day, setDay, forced, macroMode, focusMacro, onToggleFocusMacro, onAddAt,
}: {
  day: number;
  setDay: (d: number) => void;
  forced?: number;
  macroMode: MacroMode;
  focusMacro: MacroKey | null;
  onToggleFocusMacro: (key: MacroKey) => void;
  onAddAt: (hour: string) => void;
}) {
  const [scroll, setScroll] = useState(0);
  const [metrics, setMetrics] = useState({ rawMax: 0 });
  const scroller = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const draggingScroll = useRef(false);
  const snapTimer = useRef<number | null>(null);

  const measure = useCallback(() => {
    if (forced !== undefined) return;
    const scrollerEl = scroller.current;
    const feedEl = feedRef.current;
    if (!scrollerEl || !feedEl) return;
    const rawMax = Math.max(0, (BASE_SCROLL_TOP_PAD + feedEl.offsetHeight + BASE_SCROLL_BOTTOM_PAD) - scrollerEl.clientHeight);
    setMetrics((prev) => (Math.abs(prev.rawMax - rawMax) < 1 ? prev : { rawMax }));
  }, [forced]);

  useLayoutEffect(() => {
    measure();
  }, [day, measure]);

  useEffect(() => {
    if (forced !== undefined) return;
    const feedEl = feedRef.current;
    const scrollerEl = scroller.current;
    if (!feedEl || !scrollerEl || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(feedEl);
    observer.observe(scrollerEl);
    return () => observer.disconnect();
  }, [forced, measure]);

  /* Cambiar de día vuelve arriba, como hoy. */
  useEffect(() => {
    if (forced !== undefined) return;
    if (snapTimer.current !== null) window.clearTimeout(snapTimer.current);
    scroller.current?.scrollTo({ top: 0 });
    setScroll(0);
  }, [day, forced]);

  const nonOverflowing = forced === undefined && metrics.rawMax <= 0;
  const runwayPad = forced === undefined && metrics.rawMax > 0 && metrics.rawMax < RANGE ? Math.ceil(RANGE - metrics.rawMax) : 0;
  const p = forced ?? (nonOverflowing ? 0 : clamp(scroll / RANGE));

  const runSnap = useCallback(() => {
    if (forced !== undefined || draggingScroll.current || nonOverflowing) return;
    const el = scroller.current;
    if (!el) return;
    const top = el.scrollTop;
    if (top <= 1 || top >= RANGE - 1) return;
    const targetTop = top >= RANGE * 0.5 ? RANGE : 0;
    const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    el.scrollTo({ top: targetTop, behavior: reduced ? 'auto' : 'smooth' });
  }, [forced, nonOverflowing]);

  useEffect(() => {
    if (forced !== undefined) return;
    const el = scroller.current;
    if (!el) return;
    const onScrollEnd = () => runSnap();
    el.addEventListener('scrollend', onScrollEnd);
    return () => {
      el.removeEventListener('scrollend', onScrollEnd);
      if (snapTimer.current !== null) window.clearTimeout(snapTimer.current);
    };
  }, [forced, runSnap]);

  const handleScroll = (top: number) => {
    if (forced !== undefined) return;
    setScroll(top);
    if (snapTimer.current !== null) window.clearTimeout(snapTimer.current);
    snapTimer.current = window.setTimeout(runSnap, 150);
  };

  const forward = (e: ReactWheelEvent) => {
    if (forced !== undefined || nonOverflowing || !scroller.current) return;
    scroller.current.scrollTop += e.deltaY;
  };

  return (
    <div className="bdg-body">
      <div
        ref={scroller}
        className="bdg-scroll"
        style={{
          paddingTop: (forced === undefined ? EXPANDED : lerp(EXPANDED, COMPACT, forced)) + 12,
          paddingBottom: BASE_SCROLL_BOTTOM_PAD + runwayPad,
          overflowY: forced !== undefined || nonOverflowing ? 'hidden' : 'auto',
        }}
        onPointerDown={() => {
          draggingScroll.current = true;
          if (snapTimer.current !== null) window.clearTimeout(snapTimer.current);
        }}
        onPointerUp={() => {
          draggingScroll.current = false;
          if (snapTimer.current !== null) window.clearTimeout(snapTimer.current);
          snapTimer.current = window.setTimeout(runSnap, 150);
        }}
        onPointerCancel={() => {
          draggingScroll.current = false;
        }}
        onScroll={(e) => handleScroll(e.currentTarget.scrollTop)}
      >
        <div ref={feedRef} className="bdg-feed-inner">
          <MealFeed day={day} macroMode={macroMode} focusMacro={focusMacro} onAddAt={onAddAt} />
        </div>
      </div>
      <DiaryHeader
        day={day}
        setDay={setDay}
        p={p}
        macroMode={macroMode}
        focusMacro={focusMacro}
        onToggleFocusMacro={onToggleFocusMacro}
        onWheel={forward}
      />
    </div>
  );
}

const HOURS = Array.from({ length: 19 }, (_, i) => i + 5);
const hh = (h: number) => `${String(h).padStart(2, '0')}:00`;
const HOLD_MS = 300;

/* Geometría del dial radial de herradura (288° con boca inferior de 72° mirando al +). */
const RADIAL_SIZE = 336;
const RADIAL_CX = RADIAL_SIZE / 2;
const RADIAL_R_OUT = 168;
const RADIAL_R_IN = 92;
const RADIAL_R_SLOT = 130;
const RADIAL_CAP = (RADIAL_R_OUT - RADIAL_R_IN) / 2;
const RADIAL_START_DEG = 126;
const RADIAL_STEP_DEG = 16;
const RADIAL_INNER_CANCEL = 84;
const RADIAL_OUTER_CANCEL = 192;

const polar = (cx: number, cy: number, r: number, deg: number) => {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const HORSESHOE_PATH = (() => {
  const oStart = polar(RADIAL_CX, RADIAL_CX, RADIAL_R_OUT, 126);
  const oEnd = polar(RADIAL_CX, RADIAL_CX, RADIAL_R_OUT, 54);
  const iEnd = polar(RADIAL_CX, RADIAL_CX, RADIAL_R_IN, 54);
  const iStart = polar(RADIAL_CX, RADIAL_CX, RADIAL_R_IN, 126);
  return [
    `M ${oStart.x.toFixed(2)} ${oStart.y.toFixed(2)}`,
    `A ${RADIAL_R_OUT} ${RADIAL_R_OUT} 0 1 1 ${oEnd.x.toFixed(2)} ${oEnd.y.toFixed(2)}`,
    `A ${RADIAL_CAP} ${RADIAL_CAP} 0 0 1 ${iEnd.x.toFixed(2)} ${iEnd.y.toFixed(2)}`,
    `A ${RADIAL_R_IN} ${RADIAL_R_IN} 0 1 0 ${iStart.x.toFixed(2)} ${iStart.y.toFixed(2)}`,
    `A ${RADIAL_CAP} ${RADIAL_CAP} 0 0 1 ${oStart.x.toFixed(2)} ${oStart.y.toFixed(2)}`,
    'Z',
  ].join(' ');
})();

function periodLabel(h: number): string {
  if (h < 12) return 'Mañana';
  if (h < 20) return 'Tarde';
  return 'Noche';
}

type SwipeAction = 'weight' | 'hour' | 'food';
type OverlayState =
  | { kind: 'none' }
  | { kind: 'menu'; mode: 'tap' | 'swipe'; active: SwipeAction | null }
  | { kind: 'hour'; mode: 'gesture' | 'tap' };

type GestureState = {
  id: number;
  x: number;
  y: number;
  phase: 'pending' | 'swipe' | 'hour';
  swipe: SwipeAction | null;
  timer: number | null;
};

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

function AddPreview({ hour, day, how, onBack }: { hour: string; day: number; how: string; onBack: () => void }) {
  return (
    <>
      <header className="bcr-header" style={{ paddingBottom: 12 }}>
        <button type="button" className="bcr-icon-btn" aria-label="Volver al diario" onClick={onBack}><Icon d={I.back} width={2.2} /></button>
        <div className="bcr-header-title">
          <div className="bcr-display" style={{ fontWeight: 700, fontSize: 22, lineHeight: 1.1 }}>Agregar</div>
          <div className="quiet" style={{ fontSize: 13 }}>{dayLabel(day)} · {day} nov</div>
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

/* Sheet editorial de peso (reemplaza el diálogo genérico de Android). */
function WeightSheet({
  day, weights, onSave, onDelete, onClose,
}: {
  day: number;
  weights: Record<number, number>;
  onSave: (grams: number) => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const existing = weights[day];
  const prev = previousWeightFor(day, weights);
  const seed = existing ?? prev?.value ?? 78.4;
  const [draft, setDraft] = useState(seed);
  const [editingText, setEditingText] = useState(false);
  const [rawInput, setRawInput] = useState(fmtKg(seed));
  const [error, setError] = useState<string | null>(null);
  const rulerDrag = useRef<{ id: number; startX: number; startVal: number } | null>(null);
  const isFuture = day > TODAY;

  const setBounded = (next: number) => {
    const clamped = clamp(round1(next), 1.0, 500.0);
    setDraft(clamped);
    setRawInput(fmtKg(clamped));
    setError(null);
  };

  const commitInput = () => {
    const normalized = rawInput.trim().replace(',', '.');
    const parsed = Number(normalized);
    if (!normalized || Number.isNaN(parsed) || parsed < 1 || parsed > 500) {
      setError('Ingresa un valor entre 1,0 y 500,0 kg.');
      return false;
    }
    setBounded(parsed);
    setEditingText(false);
    return true;
  };

  const onRulerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (isFuture || e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    rulerDrag.current = { id: e.pointerId, startX: e.clientX, startVal: draft };
  };
  const onRulerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = rulerDrag.current;
    if (!d || d.id !== e.pointerId) return;
    /* 10 px = 0,1 kg -> 100 px = 1,0 kg */
    setBounded(d.startVal + (d.startX - e.clientX) / 100);
  };
  const onRulerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (rulerDrag.current?.id === e.pointerId) rulerDrag.current = null;
  };

  const delta = prev ? round1(draft - prev.value) : null;
  let deltaText = 'Primer registro de la semana';
  if (delta !== null && prev) {
    const sign = delta > 0 ? '+' : delta < 0 ? '−' : '';
    deltaText = delta === 0
      ? `Igual que ${dayShort(prev.day)} (${fmtKg(prev.value)} kg)`
      : `${sign}${fmtKg(Math.abs(delta))} kg vs. ${dayShort(prev.day)} (${fmtKg(prev.value)} kg)`;
  }

  /* Generamos marcas alrededor del valor redondeado entero para simular la cinta deslizable continua. */
  const centerKg = Math.round(draft);
  const tickIntegers = Array.from({ length: 7 }, (_, i) => centerKg - 3 + i).filter((k) => k >= 1 && k <= 500);
  const pxOffset = (centerKg - draft) * 100;

  return (
    <div className="bdg-sheet-backdrop" role="dialog" aria-modal="true" aria-label={`Peso del ${day} de noviembre`} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bdg-weight-sheet">
        <div className="bdg-sheet-handle" aria-hidden="true" />
        <div className="bdg-sheet-head">
          <div>
            <div className="bcr-display" style={{ fontSize: 19, fontWeight: 700 }}>{existing !== undefined ? 'Editar peso' : 'Registrar peso'}</div>
            <div className="quiet" style={{ fontSize: 13 }}>{dayLabel(day)} · {WEEKDAY_NAMES[day - 9]} {day} de noviembre</div>
          </div>
          <button type="button" className="bcr-icon-btn" aria-label="Cancelar" onClick={onClose}>
            <Icon d={I.close} size={18} width={2.2} />
          </button>
        </div>

        <div className="bdg-weight-hero">
          {editingText ? (
            <div className="bdg-weight-edit-row">
              <input
                type="text"
                inputMode="decimal"
                aria-label="Peso en kilogramos"
                className="bdg-weight-input"
                autoFocus
                value={rawInput}
                onChange={(e) => { setRawInput(e.target.value); setError(null); }}
                onBlur={() => { commitInput(); }}
                onKeyDown={(e) => { if (e.key === 'Enter') commitInput(); if (e.key === 'Escape') setEditingText(false); }}
              />
              <span className="bdg-weight-unit">kg</span>
            </div>
          ) : (
            <button type="button" className="bdg-weight-readout" aria-label={`Peso ${fmtKg(draft)} kg, tocar para escribir`} disabled={isFuture} onClick={() => setEditingText(true)}>
              <span>{fmtKg(draft)}</span>
              <span className="bdg-weight-unit">kg</span>
            </button>
          )}
          <div className="bdg-delta-pill">{deltaText}</div>
        </div>

        <div
          className={`bdg-ruler${isFuture ? ' is-disabled' : ''}`}
          aria-label="Regla deslizable de peso, precisión 0,1 kg"
          onPointerDown={onRulerDown}
          onPointerMove={onRulerMove}
          onPointerUp={onRulerEnd}
          onPointerCancel={onRulerEnd}
        >
          <div className="bdg-ruler-track" style={{ transform: `translateX(${pxOffset}px)` }}>
            {tickIntegers.map((kg) => (
              <div key={kg} className="bdg-ruler-unit" style={{ left: `${(kg - centerKg) * 100}px` }}>
                {Array.from({ length: 10 }, (_, tenth) => {
                  const isMajor = tenth === 0;
                  const isHalf = tenth === 5;
                  return (
                    <span
                      key={tenth}
                      className={`bdg-tick${isMajor ? ' is-major' : isHalf ? ' is-half' : ''}`}
                      style={{ left: `${tenth * 10}px` }}
                    />
                  );
                })}
                <span className="bdg-tick-label">{kg}</span>
              </div>
            ))}
          </div>
          <div className="bdg-ruler-needle" aria-hidden="true" />
        </div>

        <div className="bdg-steppers">
          {[
            { label: '−1,0', delta: -1.0 },
            { label: '−0,1', delta: -0.1 },
            { label: '+0,1', delta: 0.1 },
            { label: '+1,0', delta: 1.0 },
          ].map((s) => (
            <button key={s.label} type="button" className="bdg-step-btn" disabled={isFuture} onClick={() => setBounded(draft + s.delta)}>
              {s.label}
            </button>
          ))}
        </div>

        {error ? <div className="bdg-weight-error">{error}</div> : null}
        {isFuture ? <div className="bdg-weight-error">Las fechas futuras no admiten registros.</div> : null}

        <div className="bdg-sheet-actions">
          {existing !== undefined && !isFuture ? (
            <button type="button" className="bdg-danger-btn" onClick={onDelete}>Eliminar</button>
          ) : null}
          <button
            type="button"
            className="bcr-primary"
            style={{ flex: 1 }}
            disabled={isFuture}
            onClick={() => {
              if (editingText && !commitInput()) return;
              onSave(draft);
            }}
          >
            Guardar peso
          </button>
        </div>
      </div>
    </div>
  );
}

/* Teléfono navegable: diario + menú direccional / swipes en + + radial ascendente + peso. */
function GesturePhone({
  macroMode, forced, label, onLog,
}: {
  macroMode: MacroMode;
  forced?: number;
  label: string;
  onLog: (msg: string) => void;
}) {
  const [day, setDay] = useState(TODAY);
  const [focusMacro, setFocusMacro] = useState<MacroKey | null>(null);
  const [weights, setWeights] = useState<Record<number, number>>(INITIAL_WEIGHTS);
  const [add, setAdd] = useState<{ hour: string; how: string } | null>(null);
  const [weightOpen, setWeightOpen] = useState(false);
  const [overlay, setOverlay] = useState<OverlayState>({ kind: 'none' });
  const [hour, setHour] = useState<number | null>(null);
  const gesture = useRef<GestureState | null>(null);
  const radialRef = useRef<HTMLDivElement>(null);
  const suppressClick = useRef(false);
  const hintId = useId();

  useEffect(() => {
    if (macroMode !== 'bar-focus') setFocusMacro(null);
  }, [macroMode]);

  useEffect(() => () => {
    if (gesture.current?.timer !== null && gesture.current?.timer !== undefined) {
      window.clearTimeout(gesture.current.timer);
    }
  }, []);

  useEffect(() => {
    if (overlay.kind === 'none') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOverlay({ kind: 'none' });
        setHour(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [overlay.kind]);

  const toggleFocusMacro = (key: MacroKey) => {
    setFocusMacro((prev) => {
      const next = prev === key ? null : key;
      const meta = MACROS.find((m) => m.key === key);
      onLog(next ? `Enfoque macro: ${meta?.name} (${dayLabel(day)})` : `Enfoque macro desactivado → vuelve a kcal`);
      return next;
    });
  };

  const openAdd = (h: string, how: string) => {
    setOverlay({ kind: 'none' });
    setHour(null);
    setAdd({ hour: h, how });
    onLog(`${how} → Agregar a las ${h} (${dayLabel(day)})`);
  };

  const openWeight = (how: string) => {
    setOverlay({ kind: 'none' });
    setHour(null);
    setWeightOpen(true);
    onLog(`${how} → Peso (${dayLabel(day)})`);
  };

  const hourAtRadial = (x: number, y: number) => {
    const box = radialRef.current?.getBoundingClientRect();
    if (!box) return null;
    const cx = box.left + box.width / 2;
    const cy = box.top + box.height / 2;
    const dx = x - cx;
    const dy = y - cy;
    const r = Math.hypot(dx, dy);
    if (r < RADIAL_INNER_CANCEL || r > RADIAL_OUTER_CANCEL) return null;
    const alpha = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
    /* Boca inferior (62°..118°) sobre + cancela. */
    if (alpha > 62 && alpha < 118) return null;
    let delta = (alpha - RADIAL_START_DEG + 360) % 360;
    if (delta > 324) delta = 0;
    const idx = clamp(Math.round(delta / RADIAL_STEP_DEG), 0, HOURS.length - 1);
    return HOURS[idx];
  };

  const enterHourGesture = () => {
    if (gesture.current) {
      if (gesture.current.timer !== null) window.clearTimeout(gesture.current.timer);
      gesture.current.timer = null;
      gesture.current.phase = 'hour';
    }
    setOverlay({ kind: 'hour', mode: 'gesture' });
    setHour(null);
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.button !== 0) return;
    if (overlay.kind === 'menu' && overlay.mode === 'tap') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    suppressClick.current = false;
    gesture.current = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      phase: 'pending',
      swipe: null,
      timer: window.setTimeout(enterHourGesture, HOLD_MS),
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    if (g.phase === 'hour') {
      setHour(hourAtRadial(e.clientX, e.clientY));
      return;
    }
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    const dist = Math.hypot(dx, dy);
    if (dist > 10 && g.timer !== null) {
      window.clearTimeout(g.timer);
      g.timer = null;
    }
    if (dist < 14) {
      if (g.phase === 'swipe') {
        g.swipe = null;
        setOverlay({ kind: 'menu', mode: 'swipe', active: null });
      }
      return;
    }
    /* Deslizar hacia arriba >= 26 px salta directo al selector de hora bajo el dedo. */
    if (dy <= -26 && Math.abs(dy) >= Math.abs(dx)) {
      enterHourGesture();
      return;
    }
    g.phase = 'swipe';
    let swipe: SwipeAction | null = null;
    if (dx <= -26 && Math.abs(dx) > Math.abs(dy)) swipe = 'weight';
    else if (dx >= 26 && Math.abs(dx) > Math.abs(dy)) swipe = 'food';
    else if (dy < -12 && Math.abs(dy) >= Math.abs(dx)) swipe = 'hour';
    g.swipe = swipe;
    setOverlay({ kind: 'menu', mode: 'swipe', active: swipe });
  };

  const finishGesture = (e: ReactPointerEvent<HTMLButtonElement>, cancelled: boolean) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    if (g.timer !== null) window.clearTimeout(g.timer);
    gesture.current = null;

    if (g.phase === 'pending') return; // toque corto lo resuelve onClick
    suppressClick.current = true;

    if (g.phase === 'hour') {
      const picked = cancelled ? null : hourAtRadial(e.clientX, e.clientY);
      setOverlay({ kind: 'none' });
      setHour(null);
      if (picked === null) onLog('Radial abierto y soltado en zona neutra → cancelado');
      else openAdd(hh(picked), 'Gesto ↑ al radial');
      return;
    }

    const action = cancelled ? null : g.swipe;
    setOverlay({ kind: 'none' });
    if (action === 'weight') openWeight('Swipe ← en +');
    else if (action === 'food') openAdd(NOW, 'Swipe → en + (hora actual)');
    else if (action === 'hour') setOverlay({ kind: 'hour', mode: 'tap' });
    else onLog('Swipe cancelado al volver al centro');
  };

  const onPlusClick = () => {
    if (suppressClick.current) {
      suppressClick.current = false;
      return;
    }
    if (overlay.kind === 'menu' && overlay.mode === 'tap') {
      setOverlay({ kind: 'none' });
    } else if (overlay.kind === 'hour') {
      setOverlay({ kind: 'none' });
      setHour(null);
    } else {
      setOverlay({ kind: 'menu', mode: 'tap', active: null });
      onLog('Toque en + → menú de acciones (← peso · ↑ hora · → ahora)');
    }
  };

  const activeIdx = hour !== null ? HOURS.indexOf(hour) : -1;
  const activeDeg = activeIdx >= 0 ? RADIAL_START_DEG + activeIdx * RADIAL_STEP_DEG : null;
  const activeSpokeStart = activeDeg !== null ? polar(RADIAL_CX, RADIAL_CX, RADIAL_R_IN, activeDeg) : null;
  const activeSpokeEnd = activeDeg !== null ? polar(RADIAL_CX, RADIAL_CX, RADIAL_R_SLOT - 16, activeDeg) : null;

  return (
    <div className="bcr-board">
      <div className="bcr-board-label">{label}</div>
      <div className="bcr-phone bdg-phone">
        {add ? (
          <AddPreview hour={add.hour} day={day} how={add.how} onBack={() => setAdd(null)} />
        ) : (
          <>
            <Diary
              day={day}
              setDay={setDay}
              forced={forced}
              macroMode={macroMode}
              focusMacro={focusMacro}
              onToggleFocusMacro={toggleFocusMacro}
              onAddAt={(h) => openAdd(h, `+ del grupo de las ${h}`)}
            />
            <TabBar>
              <button
                type="button"
                className={`bcr-tab-add bdg-add${overlay.kind !== 'none' ? ' is-open' : ''}`}
                aria-label={overlay.kind === 'menu' ? 'Cerrar acciones' : 'Agregar alimento o peso'}
                aria-expanded={overlay.kind !== 'none'}
                aria-describedby={hintId}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={(e) => finishGesture(e, false)}
                onPointerCancel={(e) => finishGesture(e, true)}
                onClick={onPlusClick}
                onContextMenu={(e) => e.preventDefault()}
              >
                <Icon d={overlay.kind === 'menu' && overlay.mode === 'tap' ? I.close : I.plus} size={24} width={2.4} />
              </button>
              <span id={hintId} className="sr-only">
                Toca para elegir alimento ahora, hora o peso; desliza a la izquierda para peso, derecha para alimento ahora, o arriba para elegir hora.
              </span>
            </TabBar>
          </>
        )}

        {overlay.kind === 'menu' ? (
          <div
            className="bdg-scrim"
            aria-hidden={overlay.mode === 'swipe'}
            onClick={(e) => { if (overlay.mode === 'tap' && e.target === e.currentTarget) setOverlay({ kind: 'none' }); }}
          >
            <div className="bdg-triad" role={overlay.mode === 'tap' ? 'group' : undefined} aria-label="Acciones rápidas">
              <div className="bdg-triad-top">
                <button
                  type="button"
                  className={`bdg-triad-btn is-up${overlay.active === 'hour' ? ' is-active' : ''}`}
                  onClick={() => setOverlay({ kind: 'hour', mode: 'tap' })}
                >
                  <span className="bdg-triad-dir" aria-hidden="true">↑</span>
                  <Icon d={I.clock} size={18} />
                  <span>Elegir hora</span>
                </button>
              </div>
              <div className="bdg-triad-row">
                <button
                  type="button"
                  className={`bdg-triad-btn${overlay.active === 'weight' ? ' is-active' : ''}`}
                  onClick={() => openWeight('Menú + → Registrar peso')}
                >
                  <span className="bdg-triad-dir" aria-hidden="true">←</span>
                  <Icon d={I.scale} size={18} />
                  <span>Peso</span>
                </button>
                <button
                  type="button"
                  className={`bdg-triad-btn is-primary${overlay.active === 'food' ? ' is-active' : ''}`}
                  onClick={() => openAdd(NOW, 'Menú + → Alimento ahora')}
                >
                  <Icon d={I.utensils} size={18} />
                  <span>Ahora · {NOW}</span>
                  <span className="bdg-triad-dir" aria-hidden="true">→</span>
                </button>
              </div>
              <div className="bdg-triad-hint">
                {overlay.mode === 'swipe'
                  ? overlay.active === 'weight'
                    ? 'Suelta ← para registrar peso'
                    : overlay.active === 'food'
                      ? `Suelta → para agregar ahora (${NOW})`
                      : 'Desliza ↑ al selector de hora · centro cancela'
                  : 'Toca una opción · o desliza ← peso · ↑ hora · → ahora'}
              </div>
            </div>
          </div>
        ) : null}

        {overlay.kind === 'hour' ? (
          <div
            className="bdg-scrim is-radial"
            aria-hidden={overlay.mode === 'gesture'}
            onClick={(e) => {
              if (overlay.mode === 'tap' && e.target === e.currentTarget) {
                setOverlay({ kind: 'none' });
                setHour(null);
              }
            }}
          >
            <div className="bdg-radial-stage">
              <div className={`bdg-radial-pill${hour !== null ? ' is-picked' : ''}`}>
                {hour !== null ? (
                  <>
                    <strong>{hh(hour)}</strong>
                    <span className="quiet">{periodLabel(hour)}</span>
                  </>
                ) : (
                  <span className="quiet">
                    {overlay.mode === 'tap' ? 'Toca una hora' : 'Desliza por el aro · suelta fuera para cancelar'}
                  </span>
                )}
              </div>

              <div
                ref={radialRef}
                className="bdg-radial"
                role={overlay.mode === 'tap' ? 'group' : undefined}
                aria-label="Selector radial de hora"
              >
                <svg className="bdg-radial-svg" viewBox={`0 0 ${RADIAL_SIZE} ${RADIAL_SIZE}`} aria-hidden="true">
                  <path className="bdg-radial-ring" d={HORSESHOE_PATH} />
                  {activeSpokeStart && activeSpokeEnd ? (
                    <line
                      className="bdg-radial-spoke"
                      x1={activeSpokeStart.x}
                      y1={activeSpokeStart.y}
                      x2={activeSpokeEnd.x}
                      y2={activeSpokeEnd.y}
                    />
                  ) : null}
                </svg>

                {HOURS.map((h, i) => {
                  const deg = RADIAL_START_DEG + i * RADIAL_STEP_DEG;
                  const pos = polar(RADIAL_CX, RADIAL_CX, RADIAL_R_SLOT, deg);
                  const isActive = h === hour;
                  const isAnchor = h === 6 || h === 12 || h === 18 || h === 23;
                  return (
                    <button
                      key={h}
                      type="button"
                      tabIndex={overlay.mode === 'tap' ? 0 : -1}
                      className={`bdg-radial-node${isActive ? ' is-active' : ''}${isAnchor ? ' is-anchor' : ''}`}
                      style={{ left: pos.x, top: pos.y }}
                      aria-label={`Agregar a las ${hh(h)}`}
                      onMouseEnter={() => { if (overlay.mode === 'tap') setHour(h); }}
                      onFocus={() => { if (overlay.mode === 'tap') setHour(h); }}
                      onClick={() => openAdd(hh(h), 'Selector radial (toque)')}
                    >
                      {isActive ? hh(h) : String(h).padStart(2, '0')}
                    </button>
                  );
                })}

                {overlay.mode === 'tap' ? (
                  <button
                    type="button"
                    className="bdg-radial-hub is-btn"
                    onClick={() => {
                      setOverlay({ kind: 'none' });
                      setHour(null);
                    }}
                  >
                    <span className="bdg-hub-hour">{hour !== null ? hh(hour) : '05–23'}</span>
                    <span className="bdg-hub-cap">{hour !== null ? periodLabel(hour) : 'Toca una hora'}</span>
                    <span className="bdg-hub-cancel">Cancelar</span>
                  </button>
                ) : (
                  <div className="bdg-radial-hub" aria-hidden="true">
                    <span className="bdg-hub-hour">{hour !== null ? hh(hour) : '05–23'}</span>
                    <span className="bdg-hub-cap">{hour !== null ? 'Suelta para abrir' : 'Soltar aquí cancela'}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {weightOpen ? (
          <WeightSheet
            day={day}
            weights={weights}
            onClose={() => setWeightOpen(false)}
            onSave={(nextKg) => {
              setWeights((prev) => ({ ...prev, [day]: nextKg }));
              setWeightOpen(false);
              onLog(`Peso guardado: ${fmtKg(nextKg)} kg (${dayLabel(day)})`);
            }}
            onDelete={() => {
              setWeights((prev) => {
                const copy = { ...prev };
                delete copy[day];
                return copy;
              });
              setWeightOpen(false);
              onLog(`Peso eliminado (${dayLabel(day)})`);
            }}
          />
        ) : null}
      </div>
    </div>
  );
}

const MACRO_MODE_DESC: Record<MacroMode, string> = {
  plain: 'Vista base actual: solo calorías por comida y alimento, sin macros en la lista.',
  bar: 'Micro-barra tricolor de 3 px por grupo horario según aporte calórico (P/C/G). Filas intactas.',
  'bar-focus': 'Recomendada: micro-barra + toca Proteína/Carbs/Grasa arriba para enfocar gramos + toca un alimento para ver detalle.',
  'meal-totals': 'Totales P/C/G compactos con puntos de color en cada hora + detalle puntual al tocar un alimento.',
};

export function BalanceDiaryGestures() {
  const [dark, setDark] = useState(false);
  const [macroMode, setMacroMode] = useState<MacroMode>('bar-focus');
  const [log, setLog] = useState('Todavía no hay gestos.');
  return (
    <div className="bcr" data-theme={dark ? 'dark' : 'light'}>
      <div className="bcr-toolbar">
        <div className="bcr-toolbar-title">
          <strong>Balance · diario compacto, radial ascendente y macros</strong>
          <span>{MACRO_MODE_DESC[macroMode]}</span>
        </div>
        <Tabs.Root value={macroMode} onValueChange={(v) => setMacroMode(v as MacroMode)}>
          <Tabs.List className="bcr-seg" aria-label="Macros en el diario">
            <Tabs.Tab value="plain">Tal como está</Tabs.Tab>
            <Tabs.Tab value="bar">Micro-barra</Tabs.Tab>
            <Tabs.Tab value="bar-focus">Barra + foco</Tabs.Tab>
            <Tabs.Tab value="meal-totals">Por comida</Tabs.Tab>
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
        <GesturePhone macroMode={macroMode} onLog={setLog} label="Navegable · prueba día L 9 (corto), X 11 (medio), J 12 (largo)" />
        <GesturePhone macroMode={macroMode} forced={1} onLog={setLog} label="Encabezado compacto (fijo, para comparar)" />
        <aside className="bdg-notes">
          <div style={{ fontWeight: 600 }}>Último gesto</div>
          <div aria-live="polite" className="quiet">{log}</div>
          <div style={{ fontWeight: 600, marginTop: 12 }}>Cómo probar</div>
          <ul className="quiet">
            <li><strong>Macros en el diario:</strong> compara <em>Tal como está</em> con <em>Micro-barra</em>, <em>Barra + foco</em> (toca un macro en la tarjeta o un alimento) y <em>Por comida</em>.</li>
            <li><strong>Toque en +:</strong> abre las 3 opciones (← Peso, ↑ Elegir hora, → Alimento ahora).</li>
            <li><strong>Swipe ← en +:</strong> abre directo el registro editorial de peso (sin fila de peso en el diario).</li>
            <li><strong>Swipe → en +:</strong> abre directo Agregar a la hora actual ({NOW}).</li>
            <li><strong>Swipe ↑ o mantener ({HOLD_MS} ms):</strong> abre directo el radial ascendente 05:00–23:00 (soltar en el centro cancela).</li>
            <li><strong>Sticky corto:</strong> día L 9 queda expandido sin scroll; día X 11 (desborde corto) llega al 100% compacto y hace snap al soltar.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
