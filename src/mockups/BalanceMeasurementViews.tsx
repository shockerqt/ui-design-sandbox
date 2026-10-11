import { useEffect, useState } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { ChevronLeft, ChevronRight, Scale, Ruler } from 'lucide-react';

const DAY_MS = 86_400_000;
const REFERENCE_DAY = Date.UTC(2026, 9, 9);
export const dayISO = (offset: number) => new Date(REFERENCE_DAY + offset * DAY_MS).toISOString().slice(0, 10);
export const dayOffset = (iso: string) => Math.round((Date.parse(`${iso}T00:00:00Z`) - REFERENCE_DAY) / DAY_MS);
export const shortDate = (offset: number) => new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(REFERENCE_DAY + offset * DAY_MS));
const decimal = (value: number) => new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format(value);

export const BODY_FIELDS = [
  ['waist', 'Cintura'], ['hips', 'Cadera'], ['chest', 'Pecho'], ['neck', 'Cuello'],
  ['armLeft', 'Brazo izquierdo'], ['armRight', 'Brazo derecho'],
  ['thighLeft', 'Muslo izquierdo'], ['thighRight', 'Muslo derecho'],
  ['calfLeft', 'Pantorrilla izquierda'], ['calfRight', 'Pantorrilla derecha'],
] as const;
export type BodyKey = typeof BODY_FIELDS[number][0];
export type BodyValues = Partial<Record<BodyKey, number>>;
export type BodyByDay = Record<number, BodyValues>;
export type MeasurementKind = 'weight' | 'body';
export type AppPage = 'foods' | 'measurements' | 'summary' | 'profile';
export type NutritionDay = { day: number; calories: number; protein: number; carbs: number; fat: number };
export type SummaryOptions = { area: 'nutrition' | 'body'; period: number; metric: string; endDay: number };

export const sampleWeights = (): Record<number, string> => Object.fromEntries(
  Array.from({ length: 43 }, (_, i) => i - 42)
    .filter((day) => ![-33, -19, -11, -5, -1].includes(day))
    .map((day, i) => [day, (74.6 - i * 0.025 + [0.1, -0.15, 0.2, 0, -0.1][i % 5]).toFixed(1)]),
);
export const sampleBody = (): BodyByDay => ({
  [-38]: { waist: 85.2, hips: 98, chest: 101, neck: 37.5, armLeft: 31, armRight: 31.5, thighLeft: 56, thighRight: 56.5, calfLeft: 37, calfRight: 37.5 },
  [-12]: { waist: 84.5, hips: 97.5, chest: 100.5, neck: 37.3, armLeft: 31.2, armRight: 31.7, thighLeft: 55.8, thighRight: 56.2, calfLeft: 37, calfRight: 37.3 },
  [0]: { waist: 84, neck: 37.2 },
});

export function latestBodyValues(body: BodyByDay) {
  return BODY_FIELDS.flatMap(([key, label]) => {
    const latest = Object.entries(body).filter(([, values]) => values[key] !== undefined).sort(([a], [b]) => Number(b) - Number(a))[0];
    return latest ? [{ key, label, day: Number(latest[0]), value: latest[1][key]! }] : [];
  });
}

export function monthDays(month: string): (number | null)[] {
  const [year, number] = month.split('-').map(Number);
  const first = new Date(Date.UTC(year, number - 1, 1));
  const count = new Date(Date.UTC(year, number, 0)).getUTCDate();
  const padding = (first.getUTCDay() + 6) % 7;
  return [...Array<null>(padding).fill(null), ...Array.from({ length: count }, (_, i) => Math.round((first.getTime() - REFERENCE_DAY) / DAY_MS) + i)];
}

function Segments({ value, onChange, labels }: { value: string; onChange: (value: string) => void; labels: [string, string][] }) {
  return <Tabs.Root value={value} onValueChange={(next) => onChange(String(next))}>
    <Tabs.List className="blw-segments" aria-label="Elegir vista">{labels.map(([key, label]) => <Tabs.Tab key={key} value={key}>{label}</Tabs.Tab>)}</Tabs.List>
  </Tabs.Root>;
}

export function MeasurementView({ offset, onDate, kind, onKind, weights, body, onRegister }: {
  offset: number; onDate: (day: number) => void; kind: MeasurementKind; onKind: (kind: MeasurementKind) => void;
  weights: Record<number, string>; body: BodyByDay; onRegister: (kind: MeasurementKind) => void;
}) {
  const [month, setMonth] = useState(dayISO(offset).slice(0, 7));
  const [showLatest, setShowLatest] = useState(false);
  useEffect(() => setMonth(dayISO(offset).slice(0, 7)), [offset]);
  const monthTitle = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${month}-01T00:00:00Z`));
  const moveMonth = (direction: number) => {
    const date = new Date(`${month}-01T00:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + direction);
    setMonth(date.toISOString().slice(0, 7));
    onDate(dayOffset(date.toISOString().slice(0, 10)));
  };
  const bodyEntries = BODY_FIELDS.filter(([key]) => body[offset]?.[key] !== undefined);
  return <>
    <header className="blw-page-header"><h2>Mediciones</h2><span>Registrar y consultar</span></header>
    <Segments value={kind} onChange={(next) => onKind(next as MeasurementKind)} labels={[[ 'weight', 'Peso' ], [ 'body', 'Medidas corporales' ]]} />
    <div className="blw-feed blw-measurement-feed">
      <section className="blw-calendar" aria-label="Calendario mensual de mediciones">
        <div className="blw-month-navigation">
          <button aria-label="Mes anterior" onClick={() => moveMonth(-1)}><ChevronLeft size={19} /></button>
          <label className="blw-month-picker"><span>{monthTitle}<ChevronDownMark /></span><input type="month" aria-label="Elegir mes y año" value={month} min="2000-01" max="2100-12" onClick={(event) => { try { event.currentTarget.showPicker?.(); } catch { /* Native field remains usable if a picker is unavailable. */ } }} onChange={(event) => { if (event.target.value) { setMonth(event.target.value); onDate(dayOffset(`${event.target.value}-01`)); } }} /></label>
          <button aria-label="Mes siguiente" onClick={() => moveMonth(1)}><ChevronRight size={19} /></button>
        </div>
        <div className="blw-month-grid">
          {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((label, i) => <span className="blw-month-weekday" key={`weekday-${i}`} aria-hidden="true">{label}</span>)}
          {monthDays(month).map((day, i) => day === null ? <span key={`blank-${i}`} /> : <button key={day} aria-pressed={offset === day} aria-label={`${shortDate(day)} de ${month.slice(0, 4)}: ${kind === 'weight' ? weights[day] ? `peso ${decimal(Number(weights[day]))} kilogramos` : 'sin peso registrado' : Object.keys(body[day] ?? {}).length ? `${Object.keys(body[day]).length} medidas corporales` : 'sin medidas corporales'}`} onClick={() => onDate(day)}>
            <span>{new Date(`${dayISO(day)}T00:00:00Z`).getUTCDate()}</span>
            <span className="blw-calendar-mark" aria-hidden="true">{(kind === 'weight' ? !!weights[day] : !!Object.keys(body[day] ?? {}).length) && <i />}</span>
          </button>)}
        </div>
        <div className="blw-calendar-key"><span><i /> {kind === 'weight' ? 'Peso registrado' : 'Medidas registradas'}</span><button onClick={() => { setMonth(dayISO(0).slice(0, 7)); onDate(0); }}>Volver al 9 oct</button></div>
      </section>
      <section className="blw-day-measurements" aria-label="Registros de la fecha seleccionada">
        <h3>{shortDate(offset)} de {dayISO(offset).slice(0, 4)}</h3>
        {kind === 'weight' ? weights[offset] ? <button className="blw-measurement-row" onClick={() => onRegister('weight')}><Scale size={20} aria-hidden="true" /><span>Peso<small>Un registro por día</small></span><strong>{decimal(Number(weights[offset]))} <small>kg</small></strong><ChevronRight size={16} /></button> : <div className="blw-measurement-empty"><p>Sin peso registrado este día.</p><button onClick={() => onRegister('weight')}>Registrar peso</button></div> : bodyEntries.length ? <>
          <dl className="blw-body-record">{bodyEntries.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{decimal(body[offset][key]!)} <small>cm</small></dd></div>)}</dl>
          <button className="blw-inline-action" onClick={() => onRegister('body')}>Editar / agregar medidas</button>
        </> : <div className="blw-measurement-empty"><p>Sin medidas corporales este día.</p><button onClick={() => onRegister('body')}>Registrar medidas</button></div>}
      </section>
      {kind === 'body' && <section className="blw-latest-measures"><button className="blw-inline-action" aria-expanded={showLatest} onClick={() => setShowLatest(!showLatest)}>{showLatest ? 'Ocultar' : 'Ver'} últimas medidas por zona</button>
        {showLatest && <dl className="blw-body-record">{latestBodyValues(body).map(({ key, label, value, day }) => <div key={key}><dt>{label}<small>{shortDate(day)} de {dayISO(day).slice(0, 4)}</small></dt><dd>{decimal(value)} <small>cm</small></dd></div>)}{!latestBodyValues(body).length && <p>Aún no hay medidas registradas.</p>}</dl>}
      </section>}
    </div>
  </>;
}

function ChevronDownMark() { return <span aria-hidden="true">⌄</span>; }

export function BodyMeasurementForm({ offset, body, onSave }: { offset: number; body: BodyByDay; onSave: (day: number, values: BodyValues) => void }) {
  const [date, setDate] = useState(dayISO(offset));
  const valuesFor = (day: number) => Object.fromEntries(BODY_FIELDS.map(([key]) => [key, body[day]?.[key]?.toString() ?? ''])) as Record<BodyKey, string>;
  const [values, setValues] = useState(() => valuesFor(offset));
  const groups: [string, readonly BodyKey[]][] = [['Tronco', ['waist', 'hips', 'chest', 'neck']], ['Brazos', ['armLeft', 'armRight']], ['Muslos', ['thighLeft', 'thighRight']], ['Pantorrillas', ['calfLeft', 'calfRight']]];
  const anyValue = Object.values(values).some((value) => value !== '');
  const canSave = anyValue || Object.keys(body[dayOffset(date)] ?? {}).length > 0;
  return <form onSubmit={(event) => {
    event.preventDefault();
    if (!canSave) return;
    const next: BodyValues = {};
    for (const [key] of BODY_FIELDS) if (values[key] !== '') next[key] = Number(values[key]);
    onSave(dayOffset(date), next);
  }}>
    <label className="blw-field">Fecha<input type="date" required min="2000-01-01" max="2100-12-31" value={date} onChange={(event) => { setDate(event.target.value); if (event.target.value) setValues(valuesFor(dayOffset(event.target.value))); }} /></label>
    <p className="blw-form-hint">Completa solo las zonas que mediste. Todos los valores están en cm. Al editar, vaciar un campo quita esa medida de la fecha.</p>
    {groups.map(([label, keys]) => <fieldset className="blw-body-fields" key={label}><legend>{label}</legend><div>{keys.map((key) => <label className="blw-field" key={key}>{BODY_FIELDS.find(([field]) => field === key)![1]}<input type="number" inputMode="decimal" min="0.1" max="999" step="0.1" value={values[key]} placeholder="Sin medir" onChange={(event) => setValues((previous) => ({ ...previous, [key]: event.target.value }))} /></label>)}</div></fieldset>)}
    <button className="blw-sheet-primary" type="submit" disabled={!canSave}>Guardar medidas</button>
  </form>;
}

type ChartPoint = { day: number; values: (number | undefined)[] };
type ChartSeries = { label: string; dash?: string; target?: number };

function RecordChart({ title, unit, points, series, period, endDay, onOpen, openLabel, bars = false }: {
  title: string; unit: string; points: ChartPoint[]; series: ChartSeries[]; period: number; endDay: number;
  onOpen: (day: number) => void; openLabel: string; bars?: boolean;
}) {
  const [selectedDay, setSelectedDay] = useState<number | undefined>();
  const selectedIndex = Math.max(0, points.findIndex((point) => point.day === selectedDay));
  const selected = points.find((point) => point.day === selectedDay) ?? points.at(-1);
  const allValues = points.flatMap((point) => point.values.filter((value): value is number => value !== undefined));
  const maximum = Math.max(...allValues, ...series.flatMap((item) => item.target === undefined ? [] : [item.target]), 1);
  const minimum = bars || unit === 'g' ? 0 : Math.min(...allValues, maximum);
  const padding = Math.max((maximum - minimum) * 0.15, unit === 'kg' ? 0.3 : 1);
  const low = bars || unit === 'g' ? 0 : minimum - padding;
  const high = maximum + padding;
  const x = (day: number) => 40 + ((day - endDay + period - 1) / (period - 1)) * 288;
  const y = (value: number) => 140 - (value - low) / (high - low) * 116;
  const choosePoint = (clientX: number, bounds: DOMRect) => {
    const coordinate = (clientX - bounds.left) / bounds.width * 350;
    const closest = points.reduce((best, point) => Math.abs(x(point.day) - coordinate) < Math.abs(x(best.day) - coordinate) ? point : best, points[0]);
    setSelectedDay(closest.day);
  };
  return <section className="blw-chart-section" aria-label={title}>
    <div className="blw-chart-heading"><h3>{title}</h3><small>{points.length} {points.length === 1 ? 'día con datos' : 'días con datos'}</small></div>
    {!selected ? <p className="blw-chart-empty">Sin registros en este período.</p> : <>
      <div className="blw-chart-readout"><span>{shortDate(selected.day)}</span><div>{series.map((item, i) => <span key={item.label}><small>{series.length > 1 ? `${item.label} ` : ''}</small><strong>{selected.values[i] === undefined ? '—' : decimal(selected.values[i]!)}</strong><small> {unit}</small></span>)}</div></div>
      <button className="blw-chart-touch" aria-label={`${title}. Seleccionado ${shortDate(selected.day)}. Toca una fecha o usa las flechas para explorar los registros.`} onClick={(event) => { if (event.detail !== 0) choosePoint(event.clientX, event.currentTarget.getBoundingClientRect()); }} onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault();
          const current = points.findIndex((point) => point.day === selected.day);
          setSelectedDay(points[Math.min(points.length - 1, Math.max(0, (current < 0 ? selectedIndex : current) + (event.key === 'ArrowRight' ? 1 : -1)))].day);
        }
      }}>
        <svg viewBox="0 0 350 169" aria-hidden="true">
          {[low, (low + high) / 2, high].map((value, i) => <g key={i}><line x1="40" x2="328" y1={y(value)} y2={y(value)} className="blw-chart-grid" /><text x="33" y={y(value) + 3} textAnchor="end">{decimal(value)}</text></g>)}
          {series.map((item, i) => <g key={item.label}>
            {item.target !== undefined && <line x1="40" x2="328" y1={y(item.target)} y2={y(item.target)} className="blw-chart-target" />}
            {!bars && points.map((point, index) => {
              const previous = points[index - 1];
              // Food gaps remain visible; body curves connect actual measurement dates.
              return previous && point.values[i] !== undefined && previous.values[i] !== undefined && (unit !== 'g' || point.day - previous.day === 1) ? <line key={point.day} x1={x(previous.day)} y1={y(previous.values[i]!)} x2={x(point.day)} y2={y(point.values[i]!)} className="blw-chart-line" strokeDasharray={item.dash} /> : null;
            })}
            {points.map((point) => point.values[i] === undefined ? null : bars ? <rect key={point.day} x={x(point.day) - Math.min(9, 110 / period)} y={y(point.values[i]!)} width={Math.min(18, 220 / period)} height={y(0) - y(point.values[i]!)} className="blw-chart-bar" /> : <circle key={point.day} cx={x(point.day)} cy={y(point.values[i]!)} r={series.length > 1 ? 2.8 : 3.2} className="blw-chart-point" />)}
          </g>)}
          <line x1={x(selected.day)} x2={x(selected.day)} y1="17" y2="145" className="blw-chart-cursor" />
          <text x="40" y="163">{shortDate(endDay + 1 - period)}</text><text x="328" y="163" textAnchor="end">{shortDate(endDay)}</text>
        </svg>
      </button>
      <div className="blw-chart-legend">{series.map((item) => <span key={item.label}><i style={{ borderTopStyle: item.dash ? 'dashed' : 'solid' }} />{item.label}{item.target !== undefined && ` · meta ${decimal(item.target)} ${unit}`}</span>)}</div>
      <label className="blw-chart-date-picker">Fecha del registro<select value={selected.day} onChange={(event) => setSelectedDay(Number(event.target.value))}>{points.map((point) => <option key={point.day} value={point.day}>{shortDate(point.day)} de {dayISO(point.day).slice(0, 4)}</option>)}</select></label>
      <button className="blw-chart-open" onClick={() => onOpen(selected.day)}>{openLabel} del {shortDate(selected.day)}<ChevronRight size={15} /></button>
    </>}
  </section>;
}

const BODY_CHARTS: [string, readonly BodyKey[]][] = [['Cintura', ['waist']], ['Cadera', ['hips']], ['Pecho', ['chest']], ['Cuello', ['neck']], ['Brazos', ['armLeft', 'armRight']], ['Muslos', ['thighLeft', 'thighRight']], ['Pantorrillas', ['calfLeft', 'calfRight']]];

export function SummaryView({ nutrition, weights, body, options, onOptions, onOpenFoods, onOpenMeasurements }: {
  nutrition: NutritionDay[]; weights: Record<number, string>; body: BodyByDay;
  options: SummaryOptions; onOptions: (options: SummaryOptions) => void;
  onOpenFoods: (day: number) => void; onOpenMeasurements: (day: number, kind: MeasurementKind) => void;
}) {
  const { area, period, metric, endDay } = options;
  const included = (day: number) => day >= endDay + 1 - period && day <= endDay;
  const intake = nutrition.filter(({ day }) => included(day)).sort((a, b) => a.day - b.day);
  const weightPoints = Object.entries(weights).filter(([day]) => included(Number(day))).map(([day, weight]) => ({ day: Number(day), values: [Number(weight)] })).sort((a, b) => a.day - b.day);
  const fields = BODY_CHARTS.find(([label]) => label === metric)![1];
  const bodyPoints = Object.entries(body).filter(([day, values]) => included(Number(day)) && fields.some((key) => values[key] !== undefined)).map(([day, values]) => ({ day: Number(day), values: fields.map((key) => values[key]) })).sort((a, b) => a.day - b.day);
  return <>
    <header className="blw-page-header"><h2>Resumen</h2><span>Evolución por período</span></header>
    <Segments value={area} onChange={(next) => onOptions({ ...options, area: next as SummaryOptions['area'] })} labels={[[ 'nutrition', 'Alimentación' ], [ 'body', 'Cuerpo' ]]} />
    <div className="blw-period-controls" aria-label="Período de los gráficos">{[7, 30, 90].map((days) => <button key={days} aria-pressed={period === days} onClick={() => onOptions({ ...options, period: days })}>{days} días</button>)}<label>Hasta<input type="date" aria-label="Última fecha del período" min="2000-01-01" max="2100-12-31" value={dayISO(endDay)} onChange={(event) => { if (event.target.value) onOptions({ ...options, endDay: dayOffset(event.target.value) }); }} /></label></div>
    <div className="blw-feed blw-summary-feed">
      {area === 'nutrition' ? <>
        <RecordChart key={`energy-${period}-${endDay}`} title="Calorías" unit="kcal" period={period} endDay={endDay} bars series={[{ label: 'Energía', target: 2200 }]} points={intake.map(({ day, calories }) => ({ day, values: [calories] }))} onOpen={onOpenFoods} openLabel="Ver alimentos" />
        <RecordChart key={`macros-${period}-${endDay}`} title="Macronutrientes" unit="g" period={period} endDay={endDay} series={[{ label: 'P' }, { label: 'C', dash: '5 3' }, { label: 'G', dash: '2 3' }]} points={intake.map(({ day, protein, carbs, fat }) => ({ day, values: [protein, carbs, fat] }))} onOpen={onOpenFoods} openLabel="Ver alimentos" />
        <p className="blw-chart-footnote">Solo se muestran días con alimentos registrados. Un día vacío no equivale a consumo cero. Las metas son ilustrativas.</p>
      </> : <>
        <RecordChart key={`weight-${period}-${endDay}`} title="Peso" unit="kg" period={period} endDay={endDay} series={[{ label: 'Peso' }]} points={weightPoints} onOpen={(day) => onOpenMeasurements(day, 'weight')} openLabel="Ver peso" />
        <section className="blw-body-chart-picker"><label>Medida corporal<select value={metric} onChange={(event) => onOptions({ ...options, metric: event.target.value })}>{BODY_CHARTS.map(([label]) => <option key={label}>{label}</option>)}</select></label></section>
        <RecordChart key={`${metric}-${period}-${endDay}`} title={metric} unit="cm" period={period} endDay={endDay} series={fields.map((_, i) => ({ label: fields.length === 1 ? metric : i === 0 ? 'Izquierda' : 'Derecha', dash: i === 1 ? '5 3' : undefined }))} points={bodyPoints} onOpen={(day) => onOpenMeasurements(day, 'body')} openLabel="Ver medidas" />
        <p className="blw-chart-footnote">Los puntos son mediciones registradas. Las líneas unen los valores disponibles; no crean registros en los días intermedios.</p>
      </>}
    </div>
  </>;
}

export const MeasurementIcon = Ruler;
