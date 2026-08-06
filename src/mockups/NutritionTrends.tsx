import React, { useEffect, useRef, useState } from 'react';
import { Tabs } from '@base-ui/react';
import {
  DayPoint,
  RANGES,
  RangeKey,
  SERIES,
  TARGET,
  shortDate,
  trendAt
} from './nutrition/data';
import { Rule, RuleMeter, SectionHead, condensed } from './nutrition/parts';

/* ============================================================
   Resumen en el tiempo.

   El peso diario oscila demasiado para leer progreso, asi que se
   grafican dos series: el registro diario y su media movil de 7
   dias. La tendencia es la cifra que manda; el diario explica por
   que sube y baja.

   Los graficos se dibujan en SVG con coordenadas en pixeles reales
   (no se escala el viewBox) para que ni los trazos ni los puntos se
   deformen al cambiar el ancho.
   ============================================================ */

/** Mide el ancho disponible. El fallback mantiene el render en entornos sin layout. */
function useWidth<T extends HTMLElement>(fallback = 620) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => setWidth(el.clientWidth || fallback);
    read();
    const observer = new ResizeObserver(read);
    observer.observe(el);
    return () => observer.disconnect();
  }, [fallback]);

  return [ref, width] as const;
}

const INK = 'var(--paper-ink)';
const TINT = 'var(--paper-tint)';
const QUIET = 'var(--paper-quiet)';
const SIGNAL = 'var(--paper-signal)';

/* ---------- Peso: diario + tendencia ---------- */

const WeightChart: React.FC<{
  points: DayPoint[];
  trend: number[];
  hover: number | null;
  onHover: (i: number | null) => void;
}> = ({ points, trend, hover, onHover }) => {
  const [ref, width] = useWidth<HTMLDivElement>();
  const height = 180;
  const pad = 10;

  const values = [...points.map(p => p.weight), ...trend];
  const min = Math.min(...values) - 0.3;
  const max = Math.max(...values) + 0.3;

  const x = (i: number) =>
    points.length === 1 ? width / 2 : (i / (points.length - 1)) * width;
  const y = (v: number) => pad + (1 - (v - min) / (max - min)) * (height - pad * 2);

  const dotR = points.length <= 10 ? 3.5 : points.length <= 35 ? 2.5 : 1.8;
  const trendPath = trend.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');

  return (
    <div
      ref={ref}
      style={{ position: 'relative', cursor: 'crosshair' }}
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect();
        if (!r.width) return;
        const i = Math.round(((e.clientX - r.left) / r.width) * (points.length - 1));
        onHover(Math.max(0, Math.min(points.length - 1, i)));
      }}
      onMouseLeave={() => onHover(null)}
    >
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`Peso de ${shortDate(points[0].date)} a ${shortDate(
          points[points.length - 1].date
        )}. Tendencia de ${trend[0]} a ${trend[trend.length - 1]} kilos.`}
        style={{ display: 'block' }}
      >
        {/* Reglas de referencia, recesivas */}
        <line x1={0} x2={width} y1={y(max - 0.3)} y2={y(max - 0.3)} stroke={TINT} strokeWidth={1} />
        <line x1={0} x2={width} y1={y(min + 0.3)} y2={y(min + 0.3)} stroke={TINT} strokeWidth={1} />

        {/* Cruz del punto enfocado */}
        {hover !== null && (
          <line x1={x(hover)} x2={x(hover)} y1={0} y2={height} stroke={INK} strokeWidth={1} />
        )}

        {/* Registro diario: disperso, subordinado */}
        {points.map((p, i) => (
          <circle
            key={p.index}
            cx={x(i)}
            cy={y(p.weight)}
            r={hover === i ? dotR + 1.5 : dotR}
            fill={QUIET}
          />
        ))}

        {/* Tendencia: la linea que manda */}
        <path d={trendPath} fill="none" stroke={INK} strokeWidth={2} strokeLinejoin="round" />

        {hover !== null && (
          <circle cx={x(hover)} cy={y(trend[hover])} r={4} fill={INK} stroke="var(--paper-bg)" strokeWidth={2} />
        )}
      </svg>
    </div>
  );
};

/* ---------- Calorias: barras contra el objetivo ---------- */

const CaloriesChart: React.FC<{
  points: DayPoint[];
  hover: number | null;
  onHover: (i: number | null) => void;
}> = ({ points, hover, onHover }) => {
  const [ref, width] = useWidth<HTMLDivElement>();
  const height = 132;

  const max = Math.max(...points.map(p => p.kcal), TARGET.kcal) * 1.08;
  const slot = width / points.length;
  const gap = slot > 6 ? 2 : 0.5;
  const barW = Math.max(1, slot - gap);
  const y = (v: number) => height - (v / max) * height;

  return (
    <div
      ref={ref}
      style={{ position: 'relative', cursor: 'crosshair' }}
      onMouseMove={e => {
        const r = e.currentTarget.getBoundingClientRect();
        if (!r.width) return;
        const i = Math.floor(((e.clientX - r.left) / r.width) * points.length);
        onHover(Math.max(0, Math.min(points.length - 1, i)));
      }}
      onMouseLeave={() => onHover(null)}
    >
      <svg
        width={width}
        height={height}
        role="img"
        aria-label={`Calorias diarias contra un objetivo de ${TARGET.kcal}. ${
          points.filter(p => p.kcal > TARGET.kcal).length
        } de ${points.length} dias sobre el objetivo.`}
        style={{ display: 'block' }}
      >
        {points.map((p, i) => {
          const over = p.kcal > TARGET.kcal;
          return (
            <rect
              key={p.index}
              x={i * slot}
              y={y(p.kcal)}
              width={barW}
              height={height - y(p.kcal)}
              fill={over ? SIGNAL : INK}
              opacity={hover === null || hover === i ? 1 : 0.38}
            />
          );
        })}

        {/* El objetivo es una regla, no un adorno */}
        <line
          x1={0}
          x2={width}
          y1={y(TARGET.kcal)}
          y2={y(TARGET.kcal)}
          stroke={INK}
          strokeWidth={1}
          strokeDasharray="3 3"
        />
      </svg>
    </div>
  );
};

/* ---------- Chispa de macro ---------- */

const Spark: React.FC<{ values: number[]; target: number }> = ({ values, target }) => {
  const [ref, width] = useWidth<HTMLDivElement>(150);
  const height = 30;
  const min = Math.min(...values, target) * 0.94;
  const max = Math.max(...values, target) * 1.06;

  const x = (i: number) => (values.length === 1 ? width / 2 : (i / (values.length - 1)) * width);
  const y = (v: number) => (1 - (v - min) / (max - min)) * height;
  const path = values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(v)}`).join(' ');

  return (
    <div ref={ref} style={{ width: '100%' }}>
      <svg width={width} height={height} style={{ display: 'block' }} aria-hidden="true">
        <line x1={0} x2={width} y1={y(target)} y2={y(target)} stroke={TINT} strokeWidth={1} />
        <path d={path} fill="none" stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

/* ---------- Pantalla ---------- */

const mean = (n: number[]) => n.reduce((s, v) => s + v, 0) / n.length;
const signed = (n: number) => `${n > 0 ? '+' : n < 0 ? '−' : ''}${Math.abs(n).toFixed(1)}`;

export const NutritionTrends: React.FC = () => {
  const [range, setRange] = useState<RangeKey>('30');
  const [view, setView] = useState<'chart' | 'table'>('chart');
  const [hoverWeight, setHoverWeight] = useState<number | null>(null);
  const [hoverKcal, setHoverKcal] = useState<number | null>(null);

  const days = RANGES.find(r => r.key === range)!.days;
  const start = SERIES.length - days;
  const points = SERIES.slice(start);
  // La media movil se calcula sobre la serie completa: si no, los
  // primeros dias del rango tendrian una ventana incompleta.
  const trend = points.map(p => trendAt(SERIES, p.index));

  const trendNow = trend[trend.length - 1];
  const delta = Math.round((trendNow - trend[0]) * 10) / 10;

  const avgKcal = Math.round(mean(points.map(p => p.kcal)));
  const daysOver = points.filter(p => p.kcal > TARGET.kcal).length;

  const macros = [
    { name: 'Proteina', values: points.map(p => p.protein), target: TARGET.protein },
    { name: 'Carbohidratos', values: points.map(p => p.carbs), target: TARGET.carbs },
    { name: 'Grasas', values: points.map(p => p.fat), target: TARGET.fat }
  ];

  const focus = hoverWeight !== null ? points[hoverWeight] : null;
  const focusKcal = hoverKcal !== null ? points[hoverKcal] : null;

  return (
    <div
      className="paper"
      style={{
        background: 'var(--paper-bg)',
        color: 'var(--paper-ink)',
        minHeight: '100%',
        padding: '36px 24px 72px',
        fontFamily: 'var(--font-ui)'
      }}
    >
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        <Rule weight={10} />

        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 16,
            padding: '10px 0 8px',
            flexWrap: 'wrap'
          }}
        >
          <h1 style={{ ...condensed(800, '2rem'), textTransform: 'uppercase' }}>Resumen</h1>

          <Tabs.Root value={range} onValueChange={v => setRange(v as RangeKey)}>
            <Tabs.List className="base-Tabs-list">
              {RANGES.map(r => (
                <Tabs.Tab key={r.key} className="base-Tabs-tab" value={r.key}>
                  {r.label}
                </Tabs.Tab>
              ))}
              <Tabs.Indicator className="base-Tabs-indicator" />
            </Tabs.List>
          </Tabs.Root>
        </div>

        <Rule weight={1} />

        <div
          style={{
            ...condensed(400, '0.85rem'),
            color: QUIET,
            padding: '7px 0'
          }}
        >
          {shortDate(points[0].date)} — {shortDate(points[points.length - 1].date)}
        </div>

        <Rule weight={7} />

        {/* ---------- Peso ---------- */}

        <SectionHead title="Peso">
          <Tabs.Root value={view} onValueChange={v => setView(v as 'chart' | 'table')}>
            <Tabs.List className="base-Tabs-list">
              <Tabs.Tab className="base-Tabs-tab" value="chart">
                Grafico
              </Tabs.Tab>
              <Tabs.Tab className="base-Tabs-tab" value="table">
                Tabla
              </Tabs.Tab>
              <Tabs.Indicator className="base-Tabs-indicator" />
            </Tabs.List>
          </Tabs.Root>
        </SectionHead>

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div style={{ ...condensed(400, '0.75rem'), color: QUIET, textTransform: 'uppercase' }}>
              Tendencia hoy
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={condensed(800, '3.2rem')}>{trendNow.toFixed(1)}</span>
              <span style={{ ...condensed(400, '1rem'), color: QUIET }}>kg</span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ ...condensed(400, '0.75rem'), color: QUIET, textTransform: 'uppercase' }}>
              En el periodo
            </div>
            <div style={{ ...condensed(800, '1.6rem'), color: delta > 0 ? SIGNAL : INK }}>
              {signed(delta)} kg
            </div>
          </div>
        </div>

        {view === 'chart' ? (
          <>
            {/* La lectura del punto enfocado va en el encabezado, no flotando:
                no se corta contra los bordes y se lee como un renglon de la tabla. */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                ...condensed(600, '0.8rem'),
                color: focus ? INK : TINT,
                padding: '14px 0 6px',
                minHeight: 26
              }}
            >
              {focus ? (
                <>
                  <span style={{ textTransform: 'uppercase' }}>{shortDate(focus.date)}</span>
                  <span style={{ display: 'flex', gap: 16 }}>
                    <span style={{ color: QUIET }}>diario {focus.weight.toFixed(1)} kg</span>
                    <span>tendencia {trend[hoverWeight!].toFixed(1)} kg</span>
                  </span>
                </>
              ) : (
                <span style={{ color: QUIET }}>Pasa el cursor para leer un dia</span>
              )}
            </div>

            <WeightChart
              points={points}
              trend={trend}
              hover={hoverWeight}
              onHover={setHoverWeight}
            />

            {/* Dos series: la leyenda va siempre */}
            <div style={{ display: 'flex', gap: 20, paddingTop: 10, ...condensed(400, '0.75rem') }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: QUIET }}>
                <svg width="10" height="10" aria-hidden="true">
                  <circle cx="5" cy="5" r="2.5" fill={QUIET} />
                </svg>
                Registro diario
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="16" height="10" aria-hidden="true">
                  <line x1="0" y1="5" x2="16" y2="5" stroke={INK} strokeWidth="2" />
                </svg>
                Tendencia 7 dias
              </span>
            </div>
          </>
        ) : (
          <div style={{ maxHeight: 260, overflow: 'auto', marginTop: 14 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', ...condensed(400, '0.8rem') }}>
              <thead>
                <tr>
                  {['Dia', 'Diario', 'Tendencia'].map((h, i) => (
                    <th
                      key={h}
                      style={{
                        ...condensed(700, '0.7rem'),
                        textTransform: 'uppercase',
                        textAlign: i === 0 ? 'left' : 'right',
                        padding: '6px 0',
                        borderBottom: `2px solid ${INK}`,
                        position: 'sticky',
                        top: 0,
                        background: 'var(--paper-bg)'
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {points
                  .map((p, i) => ({ p, t: trend[i] }))
                  .reverse()
                  .map(({ p, t }) => (
                    <tr key={p.index}>
                      <td style={{ padding: '5px 0', borderBottom: `1px solid ${TINT}` }}>
                        {shortDate(p.date)}
                      </td>
                      <td
                        style={{
                          textAlign: 'right',
                          color: QUIET,
                          padding: '5px 0',
                          borderBottom: `1px solid ${TINT}`
                        }}
                      >
                        {p.weight.toFixed(1)}
                      </td>
                      <td
                        style={{
                          ...condensed(700, '0.8rem'),
                          textAlign: 'right',
                          padding: '5px 0',
                          borderBottom: `1px solid ${TINT}`
                        }}
                      >
                        {t.toFixed(1)}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        <div style={{ paddingTop: 22 }}>
          <Rule weight={7} />
        </div>

        {/* ---------- Calorias ---------- */}

        <SectionHead title="Calorias" />

        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
          <div>
            <div style={{ ...condensed(400, '0.75rem'), color: QUIET, textTransform: 'uppercase' }}>
              Promedio diario
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={condensed(800, '2.4rem')}>{avgKcal.toLocaleString('es-CL')}</span>
              <span style={{ ...condensed(400, '0.95rem'), color: QUIET }}>
                / {TARGET.kcal.toLocaleString('es-CL')}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ ...condensed(400, '0.75rem'), color: QUIET, textTransform: 'uppercase' }}>
              Dias sobre el objetivo
            </div>
            <div style={{ ...condensed(800, '1.6rem'), color: daysOver > days / 2 ? SIGNAL : INK }}>
              {daysOver} de {days}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            ...condensed(600, '0.8rem'),
            color: focusKcal ? INK : TINT,
            padding: '14px 0 6px',
            minHeight: 26
          }}
        >
          {focusKcal ? (
            <>
              <span style={{ textTransform: 'uppercase' }}>{shortDate(focusKcal.date)}</span>
              <span style={{ color: focusKcal.kcal > TARGET.kcal ? SIGNAL : INK }}>
                {focusKcal.kcal.toLocaleString('es-CL')} kcal ·{' '}
                {focusKcal.kcal > TARGET.kcal
                  ? `${(focusKcal.kcal - TARGET.kcal).toLocaleString('es-CL')} sobre`
                  : `${(TARGET.kcal - focusKcal.kcal).toLocaleString('es-CL')} bajo`}
              </span>
            </>
          ) : (
            <span style={{ color: QUIET }}>Pasa el cursor para leer un dia</span>
          )}
        </div>

        <CaloriesChart points={points} hover={hoverKcal} onHover={setHoverKcal} />

        <div style={{ display: 'flex', gap: 20, paddingTop: 10, ...condensed(400, '0.75rem') }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="10" height="10" aria-hidden="true">
              <rect width="10" height="10" fill={INK} />
            </svg>
            Bajo el objetivo
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: SIGNAL }}>
            <svg width="10" height="10" aria-hidden="true">
              <rect width="10" height="10" fill={SIGNAL} />
            </svg>
            Sobre el objetivo
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: QUIET }}>
            <svg width="16" height="10" aria-hidden="true">
              <line x1="0" y1="5" x2="16" y2="5" stroke={INK} strokeWidth="1" strokeDasharray="3 3" />
            </svg>
            Objetivo
          </span>
        </div>

        <div style={{ paddingTop: 22 }}>
          <Rule weight={7} />
        </div>

        {/* ---------- Macros ---------- */}

        <SectionHead title="Macros" />

        <div style={{ ...condensed(400, '0.75rem'), color: QUIET, paddingBottom: 6 }}>
          Promedio del periodo contra el objetivo diario
        </div>

        <Rule weight={1} />

        {macros.map(macro => {
          const avg = Math.round(mean(macro.values));
          const ratio = avg / macro.target;
          return (
            <div key={macro.name} style={{ paddingTop: 14 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) 150px',
                  gap: 20,
                  alignItems: 'end'
                }}
              >
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      justifyContent: 'space-between',
                      gap: 12
                    }}
                  >
                    <span style={{ ...condensed(700, '0.95rem'), textTransform: 'uppercase' }}>
                      {macro.name}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                      <span style={condensed(700, '1.15rem')}>{avg} g</span>
                      <span style={{ ...condensed(400, '0.8rem'), color: QUIET }}>
                        de {macro.target} g
                      </span>
                    </span>
                  </div>
                  <div style={{ paddingTop: 7 }}>
                    <RuleMeter ratio={ratio} />
                  </div>
                </div>

                <Spark values={macro.values} target={macro.target} />
              </div>
            </div>
          );
        })}

        <div style={{ paddingTop: 26 }}>
          <Rule weight={10} />
        </div>
      </div>
    </div>
  );
};
