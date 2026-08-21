import React, { useState } from 'react';
import { Tabs } from '@base-ui/react';
import { BarChart3, ChevronLeft, ChevronRight, ListChecks, Plus, UserRound } from 'lucide-react';

/* ============================================================
   Balance — pantallas

   Solo las pantallas, cada una en un marco de ancho de telefono
   (390 px) para iterarlas de a una. Las reglas estrechas de la
   superficie son @container y no @media: el marco mide 390 px dentro
   de una ventana ancha, asi que con media queries se habria mostrado
   la variante de escritorio encogida en vez del telefono real.
   ============================================================ */

const TARGETS = { kcal: 2000, protein: 120, carbs: 240, fat: 65 };

const DAYS = [
  { day: 'L', date: 3 },
  { day: 'M', date: 4 },
  { day: 'M', date: 5 },
  { day: 'J', date: 6 },
  { day: 'V', date: 7 },
  { day: 'S', date: 8 },
  { day: 'D', date: 9 },
];

const HOUR_GROUPS = [
  { hour: '07', foods: [] },
  {
    hour: '08',
    foods: [
      { time: '08:07', name: 'Yogur griego natural', portion: '170 g', kcal: 126, protein: 17, carbs: 8, fat: 3 },
      { time: '08:24', name: 'Avena tradicional', portion: '45 g', kcal: 171, protein: 6, carbs: 30, fat: 3 },
    ],
  },
  { hour: '10', foods: [] },
  {
    hour: '13',
    foods: [
      { time: '13:05', name: 'Lentejas con zapallo', portion: '340 g', kcal: 412, protein: 24, carbs: 58, fat: 10 },
      { time: '13:28', name: 'Ensalada chilena', portion: '180 g', kcal: 86, protein: 2, carbs: 12, fat: 4 },
      { time: '13:46', name: 'Aceite de oliva', portion: '1 cdta', kcal: 45, protein: 0, carbs: 0, fat: 5 },
    ],
  },
  { hour: '16', foods: [] },
  {
    hour: '17',
    foods: [
      { time: '17:12', name: 'Manzana fuji', portion: '1 un', kcal: 95, protein: 0, carbs: 25, fat: 0 },
      { time: '17:38', name: 'Nueces', portion: '15 g', kcal: 98, protein: 2, carbs: 2, fat: 10 },
    ],
  },
  { hour: '20', foods: [] },
];

/*
 * El jueves cierra en 1.033 kcal, que es exactamente lo que suman los
 * registros de la pantalla anterior. Las dos pantallas cuentan el mismo
 * dia: si una se edita, la otra tiene que seguirla.
 */
const WEEK = [
  { day: 'L', date: 3, kcal: 2180, protein: 118, carbs: 262, fat: 79 },
  { day: 'M', date: 4, kcal: 1740, protein: 108, carbs: 205, fat: 62 },
  { day: 'M', date: 5, kcal: 1905, protein: 110, carbs: 226, fat: 72 },
  { day: 'J', date: 6, kcal: 1033, protein: 51, carbs: 135, fat: 35, running: true },
  { day: 'V', date: 7, kcal: 0 },
  { day: 'S', date: 8, kcal: 0 },
  { day: 'D', date: 9, kcal: 0 },
];

const PALETTES = {
  libro: {
    label: 'Libro',
    bg: '#F2F5EE',
    surface: '#FFFFFF',
    raised: '#E9EEE2',
    ink: '#1A1D19',
    quiet: '#6F776A',
    faint: '#9AA393',
    line: '#CFD8C6',
    danger: '#B4232A',
  },
  noche: {
    label: 'Noche',
    bg: '#12160F',
    surface: '#1A1F16',
    raised: '#232A1E',
    ink: '#EEF2E6',
    quiet: '#9AA392',
    faint: '#656E5D',
    line: '#333C2C',
    danger: '#FF6B6B',
  },
  tinta: {
    label: 'Alta tinta',
    bg: '#ECEFE8',
    surface: '#F9FAF7',
    raised: '#DDE3D7',
    ink: '#050604',
    quiet: '#454A42',
    faint: '#777E72',
    line: '#AEB8A6',
    danger: '#9C1018',
  },
} as const;

type PaletteKey = keyof typeof PALETTES;

const es = (n: number) => n.toLocaleString('es-CL');

function GalleryLabel({ children, index }: { children: React.ReactNode; index?: string }) {
  return (
    <div className="bcg-label">
      {index && <span>{index}</span>}
      {children}
    </div>
  );
}

/** La barra inferior, identica en las dos pantallas salvo cual va activa. */
function BottomNav({ active }: { active: 'summary' | 'log' | 'profile' }) {
  return (
    <nav className="bcg-bottom-nav" aria-label="Navegación principal">
      <button data-active={active === 'summary'} aria-current={active === 'summary'}>
        <BarChart3 size={18} /><span>Resumen</span>
      </button>
      <button data-active={active === 'log'} aria-current={active === 'log'}>
        <ListChecks size={18} /><span>Registro</span>
      </button>
      <button data-active={active === 'profile'} aria-current={active === 'profile'}>
        <UserRound size={18} /><span>Perfil</span>
      </button>
    </nav>
  );
}

/* --- Pantalla 01: el registro del dia ------------------------------- */

function LogScreen() {
  const [selectedDay, setSelectedDay] = useState(3);

  return (
    <div className="bcg-app-surface">
      <nav className="bcg-top-nav" aria-label="Navegación de fecha">
        <button className="bcg-icon-button" aria-label="Día anterior"><ChevronLeft size={19} /></button>
        <button className="bcg-date-title"><strong>Hoy</strong><span>6 de agosto</span></button>
        <button className="bcg-icon-button" aria-label="Día siguiente"><ChevronRight size={19} /></button>
      </nav>

      <div className="bcg-week-strip">
        {DAYS.map((item, index) => (
          <button key={`${item.day}-${item.date}`} data-active={selectedDay === index} onClick={() => setSelectedDay(index)}>
            <span>{item.day}</span><strong>{item.date}</strong>
          </button>
        ))}
      </div>

      <div className="bcg-balance-row">
        <div><span>Restantes</span><strong>967</strong><small>de 2.000 kcal</small></div>
        <div className="bcg-ring"><span>52%</span></div>
        <dl>
          <div><dt>Proteína</dt><dd>51 / 120 g</dd></div>
          <div><dt>Carbos</dt><dd>135 / 240 g</dd></div>
          <div><dt>Grasa</dt><dd>35 / 65 g</dd></div>
        </dl>
      </div>

      <div className="bcg-ledger-head"><span>Hora / alimento y macros</span><span>Porción</span><span>Kcal</span></div>
      <div className="bcg-hour-ledger">
        {HOUR_GROUPS.map((group) => {
          const isEmpty = group.foods.length === 0;
          const groupMacros = group.foods.reduce(
            (total, food) => ({
              protein: total.protein + food.protein,
              carbs: total.carbs + food.carbs,
              fat: total.fat + food.fat,
            }),
            { protein: 0, carbs: 0, fat: 0 },
          );

          return (
            <div className="bcg-hour-group" data-empty={isEmpty} key={group.hour}>
              <div className="bcg-hour-axis">
                <span>{group.hour}</span>
                <button aria-label={`Registrar a las ${group.hour}:00`}><Plus size={11} /></button>
              </div>

              <div className="bcg-hour-content">
                {isEmpty ? (
                  <button className="bcg-empty-hour">
                    <span>Hora libre</span>
                    <strong>Registrar a las {group.hour}:00</strong>
                  </button>
                ) : (
                  <>
                    <div className="bcg-hour-summary">
                      <span>{group.foods.length} registros</span>
                      <b>{groupMacros.protein} P · {groupMacros.carbs} C · {groupMacros.fat} G</b>
                    </div>
                    {group.foods.map((food) => (
                      <div className="bcg-food-row" key={`${food.time}-${food.name}`}>
                        <time>{food.time}</time>
                        <div className="bcg-meal-name">
                          <strong>{food.name}</strong>
                          <small>{food.protein} P · {food.carbs} C · {food.fat} G</small>
                        </div>
                        <span>{food.portion}</span>
                        <b>{food.kcal}</b>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <button className="bcg-fab"><Plus size={19} /> Registrar comida</button>

      <BottomNav active="log" />
    </div>
  );
}

/* --- Pantalla 02: el resumen de la semana ---------------------------- */

/*
 * El promedio va sobre los dias cerrados y no sobre los siete: con el
 * jueves a medio registrar y el fin de semana en cero, el promedio de
 * la semana completa diria 1.123 kcal y se leeria como un deficit que
 * no existe. El dia en curso se dibuja, pero no entra en la cuenta.
 */
const CLOSED = WEEK.filter((d) => d.kcal > 0 && !d.running);
const AVG = {
  kcal: Math.round(CLOSED.reduce((t, d) => t + d.kcal, 0) / CLOSED.length),
  protein: Math.round(CLOSED.reduce((t, d) => t + (d.protein ?? 0), 0) / CLOSED.length),
  carbs: Math.round(CLOSED.reduce((t, d) => t + (d.carbs ?? 0), 0) / CLOSED.length),
  fat: Math.round(CLOSED.reduce((t, d) => t + (d.fat ?? 0), 0) / CLOSED.length),
};

function SummaryScreen() {
  const peak = Math.max(TARGETS.kcal, ...WEEK.map((d) => d.kcal));
  const macros = [
    { label: 'Proteína', value: AVG.protein, target: TARGETS.protein },
    { label: 'Carbos', value: AVG.carbs, target: TARGETS.carbs },
    { label: 'Grasa', value: AVG.fat, target: TARGETS.fat },
  ];
  const over = CLOSED.filter((d) => d.kcal > TARGETS.kcal).length;
  /* "Mejor dia" seria el de menos calorias, que en un presupuesto no es
     mejor sino solo mas bajo. La pregunta util es cual quedo mas cerca. */
  const closest = CLOSED.reduce((best, d) =>
    Math.abs(d.kcal - TARGETS.kcal) < Math.abs(best.kcal - TARGETS.kcal) ? d : best,
  );

  return (
    <div className="bcg-app-surface">
      <nav className="bcg-top-nav" aria-label="Navegación de semana">
        <button className="bcg-icon-button" aria-label="Semana anterior"><ChevronLeft size={19} /></button>
        <button className="bcg-date-title"><strong>Esta semana</strong><span>3 – 9 de agosto</span></button>
        <button className="bcg-icon-button" aria-label="Semana siguiente"><ChevronRight size={19} /></button>
      </nav>

      <div className="bcg-balance-row">
        <div><span>Promedio diario</span><strong>{es(AVG.kcal)}</strong><small>de 2.000 kcal</small></div>
        <div className="bcg-ring" style={{ '--fill': `${Math.min((AVG.kcal / TARGETS.kcal) * 100, 100)}%` } as React.CSSProperties}>
          <span>{Math.round((AVG.kcal / TARGETS.kcal) * 100)}%</span>
        </div>
        <dl>
          {macros.map((m) => (
            <div key={m.label}><dt>{m.label}</dt><dd data-over={m.value > m.target}>{m.value} / {m.target} g</dd></div>
          ))}
        </dl>
      </div>

      {/* Un solo rotulo: cada barra ya lleva su cifra encima, y la
          variante de dos columnas es la del registro, no la de aqui. */}
      <div className="bcg-ledger-head bcg-ledger-head--single"><span>Energía por día</span></div>

      <div className="bcg-chart" style={{ '--goal': `${(TARGETS.kcal / peak) * 100}%` } as React.CSSProperties}>
        {WEEK.map((d) => (
          <div
            className="bcg-chart-col"
            key={`${d.day}-${d.date}`}
            data-over={d.kcal > TARGETS.kcal}
            data-running={d.running === true}
          >
            <span className="bcg-chart-value">{d.kcal > 0 ? es(d.kcal) : '—'}</span>
            <span className="bcg-chart-bar">
              {/* Un dia en cero no dibuja barra: un tope minimo se leeria
                  como un dato que no existe. */}
              {d.kcal > 0 && <i style={{ height: `${(d.kcal / peak) * 100}%` }} />}
            </span>
            <span className="bcg-chart-dow">{d.day}</span>
            <strong className="bcg-chart-date">{d.date}</strong>
          </div>
        ))}
      </div>

      <div className="bcg-macro-summary">
        {macros.map((m) => (
          <div key={m.label}>
            <div><span>{m.label}</span><b>{m.value} <small>/ {m.target} g</small></b></div>
            <div className="bcg-progress" data-over={m.value > m.target}>
              <i style={{ width: `${Math.min((m.value / m.target) * 100, 100)}%` }} />
            </div>
          </div>
        ))}
      </div>

      <dl className="bcg-stat-list">
        <div><dt>Días cerrados</dt><dd>{CLOSED.length} de 7</dd></div>
        <div><dt>Días sobre la meta</dt><dd data-over={over > 0}>{over}</dd></div>
        <div><dt>Más cerca de la meta</dt><dd>{closest.day} {closest.date} · {es(closest.kcal)}</dd></div>
      </dl>

      <BottomNav active="summary" />
    </div>
  );
}

/* --- La lamina ------------------------------------------------------- */

const SCREENS = [
  { index: '01', label: 'Pantalla', title: 'Registro del día', Screen: LogScreen },
  { index: '02', label: 'Pantalla', title: 'Resumen de la semana', Screen: SummaryScreen },
];

export const BalanceComponentGallery: React.FC = () => {
  const [paletteKey, setPaletteKey] = useState<PaletteKey>('libro');
  const palette = PALETTES[paletteKey];

  const paletteStyle = {
    '--bcg-bg': palette.bg,
    '--bcg-surface': palette.surface,
    '--bcg-raised': palette.raised,
    '--bcg-ink': palette.ink,
    '--bcg-quiet': palette.quiet,
    '--bcg-faint': palette.faint,
    '--bcg-line': palette.line,
    '--bcg-danger': palette.danger,
  } as React.CSSProperties;

  return (
    <main className="bcg" style={paletteStyle}>
      <header className="bcg-masthead">
        <div className="bcg-masthead-title">
          <GalleryLabel>Balance / interfaz viva</GalleryLabel>
          <h1>Pantallas</h1>
          <p>Las pantallas de Balance a ancho de teléfono, para iterarlas de a una.</p>
        </div>
        <div className="bcg-lab-controls" aria-label="Controles del laboratorio">
          <div>
            <GalleryLabel>Paleta</GalleryLabel>
            <Tabs.Root value={paletteKey} onValueChange={(value) => setPaletteKey(value as PaletteKey)}>
              <Tabs.List className="bcg-segments" aria-label="Paleta del mockup">
                {(Object.keys(PALETTES) as PaletteKey[]).map((key) => (
                  <Tabs.Tab key={key} value={key}>
                    {PALETTES[key].label}
                  </Tabs.Tab>
                ))}
              </Tabs.List>
            </Tabs.Root>
          </div>
        </div>
      </header>

      <div className="bcg-screens">
        {SCREENS.map(({ index, label, title, Screen }) => (
          <figure className="bcg-screen-item" key={index}>
            <figcaption className="bcg-screen-caption">
              <GalleryLabel index={index}>{label}</GalleryLabel>
              <h2>{title}</h2>
            </figcaption>
            <div className="bcg-phone">
              <Screen />
            </div>
          </figure>
        ))}
      </div>
    </main>
  );
};
