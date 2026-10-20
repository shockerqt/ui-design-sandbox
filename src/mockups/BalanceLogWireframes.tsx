import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Accordion } from '@base-ui/react/accordion';
import { Dialog } from '@base-ui/react/dialog';
import { Tabs } from '@base-ui/react/tabs';
import { useLocation, useSearch } from 'wouter';
import { ChartNoAxesCombined, Check, ChevronDown, ChevronLeft, ChevronRight, Image, Plus, Scale, UserRound, Utensils } from 'lucide-react';
import { BodyMeasurementForm, MeasurementIcon, MeasurementView, SummaryView, dayISO, dayOffset, sampleBody, sampleWeights } from './BalanceMeasurementViews';
import type { AppPage, BodyByDay, BodyValues, MeasurementKind, SummaryOptions } from './BalanceMeasurementViews';
import { ProfileView, defaultProfilePreferences } from './BalanceProfileView';
import { BALANCE_WIREFRAME_PATH, FoodRegistrationView, foodRegistrationURL, parseFoodRegistration } from './BalanceFoodRegistration';
import type { FoodRegistrationContext } from './BalanceFoodRegistration';
import { fiberTotal, foodWithQuantity, formatFoodNumber, groupFoodsByHour, hourGroup, makeFixtureFood, quantityDraftFor, santiagoDate, scaleFixtureNutrition, validWeight } from './BalanceFoodModel';
import type { Food, PortionSnapshot, QuantityDraft } from './BalanceFoodModel';
import { FoodQuantityFields } from './BalanceFoodQuantity';
import './BalanceLogWireframes.css';
import './BalanceAndroidMaterial.css';
import './BalanceMaterialExpressive.css';

type View = 'day' | 'detail' | 'selection';
type Sheet = { kind: 'edit'; food: Food } | { kind: 'move' } | { kind: 'delete' } | { kind: 'register' } | { kind: 'weight' } | { kind: 'body' } | { kind: 'nutrition' } | null;
// Explicit fixture quantities and conversions, independent of display text.
const portionOf = (name: string, canonicalQuantity: number): PortionSnapshot => ({ name, portionQuantity: 1, canonicalQuantity });
const EXAMPLE_ENTRIES: Record<string, [number, 'g' | 'ml', PortionSnapshot?]> = {
  a1: [2, 'g', portionOf('rebanada', 30)], a2: [2, 'g', portionOf('unidad', 50)], a3: [40, 'g'], a4: [200, 'ml'],
  b1: [1, 'g', portionOf('envase', 150)], b2: [25, 'g'], b3: [60, 'g'], b4: [1, 'g', portionOf('cucharadita', 7)],
  c1: [150, 'g'], c2: [450, 'g'], c3: [1, 'g', portionOf('plato', 180)], c4: [1, 'g', portionOf('cucharadita', 5)],
  d1: [30, 'g'], d2: [20, 'g'], e1: [120, 'g'], e2: [180, 'g'], e3: [100, 'g'], e4: [80, 'g'],
  f1: [200, 'ml'], f2: [1, 'g', portionOf('unidad', 100)], f3: [15, 'g'], f4: [2, 'g', portionOf('unidad', 7)],
};
const sample = (id: string, name: string, portion: string, time: string, calories: number, protein: number, carbs: number, fat: number, fiber?: number): Food => {
  const [quantity, unit, ratio] = EXAMPLE_ENTRIES[id];
  const canonical = ratio ? quantity / ratio.portionQuantity * ratio.canonicalQuantity : quantity;
  const base = scaleFixtureNutrition({ calories, protein, carbs, fat, ...(fiber === undefined ? {} : { fiber }) }, 100 / canonical);
  return { ...makeFixtureFood(id, name, time, unit, base, { quantity: String(quantity), unit: ratio ? 'portion' : 'canonical' }, ratio), portion };
};

// Illustrative intake only. Five four-food groups and one peanut/raisin group.
const SAMPLE_FOODS: Food[] = [
  sample('a1', 'Pan integral', '2 rebanadas', '08:05', 160, 7, 28, 3, 4),
  sample('a2', 'Huevos revueltos', '2 unidades', '08:08', 145, 13, 1, 10),
  sample('a3', 'Palta', '40 g', '08:08', 64, 1, 3, 6, 3),
  sample('a4', 'Café con leche', '200 ml', '08:12', 75, 5, 7, 3),
  sample('b1', 'Yogur natural alto en proteínas', '1 envase · 150 g', '11:10', 95, 15, 6, 1),
  sample('b2', 'Avena', '25 g', '11:12', 95, 4, 16, 2, 3),
  sample('b3', 'Arándanos', '60 g', '11:12', 34, 0, 9, 0, 1),
  sample('b4', 'Miel', '1 cucharadita · 7 g', '11:12', 21, 0, 6, 0),
  sample('c1', 'Pechuga de pollo', '150 g', '13:10', 248, 46, 0, 5),
  // Larger illustrative portion exercises three-digit carbs in detail/selection.
  sample('c2', 'Arroz integral', '450 g', '13:12', 506, 11, 107, 6, 8),
  sample('c3', 'Ensalada de tomate y pepino', '1 plato · 180 g', '13:12', 38, 2, 8, 0, 2),
  sample('c4', 'Aceite de oliva', '1 cucharadita · 5 g', '13:12', 45, 0, 0, 5),
  sample('d1', 'Maní', '30 g', '17:40', 170, 7, 5, 14, 3),
  sample('d2', 'Pasas', '20 g', '17:40', 60, 1, 16, 0, 1),
  sample('e1', 'Salmón al horno', '120 g', '19:10', 250, 26, 0, 16),
  sample('e2', 'Papas cocidas', '180 g', '19:12', 156, 3, 35, 0, 3),
  sample('e3', 'Brócoli', '100 g', '19:12', 35, 3, 7, 0, 3),
  sample('e4', 'Zanahoria', '80 g', '19:12', 33, 1, 8, 0, 2),
  sample('f1', 'Leche', '200 ml', '22:05', 92, 7, 10, 3),
  sample('f2', 'Plátano', '1 unidad · 100 g', '22:05', 89, 1, 23, 0, 3),
  sample('f3', 'Chocolate amargo', '15 g', '22:08', 90, 1, 7, 7, 2),
  sample('f4', 'Galletas de arroz', '2 unidades', '22:08', 56, 1, 12, 0, 1),
];
const sum = (foods: Food[], key: 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber') => foods.reduce((total, food) => total + (food[key] ?? 0), 0);
const CALORIE_TARGET = 2200;
// Illustrative review targets, independent of the user's actual nutrition goals.
const DAILY_NUTRIENTS = [
  ['P', 'Proteínas', 'protein', 150],
  ['C', 'Carbohidratos', 'carbs', 265],
  ['G', 'Grasas', 'fat', 60],
  ['F', 'Fibra', 'fiber', 30],
] as const;
// Neighboring historical days demonstrate partial intake; future days start empty.
const sampleDays = (): Record<number, Food[]> => ({
  [-4]: SAMPLE_FOODS.slice(0, 8),
  [-2]: SAMPLE_FOODS.slice(0, 12),
  [-1]: SAMPLE_FOODS.slice(0, 18),
  [0]: [...SAMPLE_FOODS],
});
const format = formatFoodNumber;
const dateLabel = (offset: number) => {
  const date = new Date(Date.UTC(2026, 9, 9 + offset));
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date);
};

function MacroValues({ protein, carbs, fat }: Pick<Food, 'protein' | 'carbs' | 'fat'>) {
  return <span className="blw-macro-line" aria-label={`Proteínas ${protein} gramos, carbohidratos ${carbs} gramos, grasas ${fat} gramos`}>
    {([['P', protein], ['C', carbs], ['G', fat]] as const).map(([label, value]) => <span key={label}><small>{label}</small><span className="blw-macro-value">{format(value)}<small>g</small></span></span>)}
  </span>;
}

function FoodRow({ food, selectionMode, selected, onEdit, onSelect, onStartSelection }: {
  food: Food; selectionMode: boolean; selected: boolean;
  onEdit: () => void; onSelect: () => void; onStartSelection: () => void;
}) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const held = useRef(false);
  const origin = useRef({ x: 0, y: 0 });
  const cancelHold = () => { if (timer.current) clearTimeout(timer.current); };
  useEffect(() => cancelHold, []);
  return <button type="button" className="blw-food" data-selected={selected || undefined}
    aria-label={`${food.name}, ${food.portion}, ${food.time}, ${food.calories} kilocalorías, proteínas ${food.protein} gramos, carbohidratos ${food.carbs} gramos, grasas ${food.fat} gramos`}
    aria-pressed={selectionMode ? selected : undefined}
    aria-keyshortcuts="Shift+Enter Shift+Space"
    onKeyDown={(event) => {
      if (event.shiftKey && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        if (!event.repeat) selectionMode ? onSelect() : onStartSelection();
      }
    }}
    onClick={() => { if (held.current) { held.current = false; return; } selectionMode ? onSelect() : onEdit(); }}
    onPointerDown={(event) => {
      held.current = false;
      if (!event.isPrimary || event.button !== 0) return;
      origin.current = { x: event.clientX, y: event.clientY };
      cancelHold();
      timer.current = setTimeout(() => { held.current = true; selectionMode ? onSelect() : onStartSelection(); }, 550);
    }}
    onPointerMove={(event) => { if (Math.hypot(event.clientX - origin.current.x, event.clientY - origin.current.y) > 8) cancelHold(); }}
    onPointerUp={cancelHold} onPointerCancel={cancelHold}
    onContextMenu={(event) => event.preventDefault()}>
    {selectionMode && <span className="blw-check" aria-hidden="true">{selected && <Check size={12} />}</span>}
    <span className="blw-image" aria-hidden="true"><Image size={18} strokeWidth={1.2} /></span>
    <span className="blw-food-content">
      <span className="blw-line-one"><span className="blw-food-name" title={food.name}>{food.name}</span><span className="blw-calories">{format(food.calories)}<small> kcal</small></span></span>
      <span className="blw-line-two"><span className="blw-quantity-time"><span className="blw-portion" title={food.portion}>{food.portion}</span><span className="blw-time">· {food.time}</span></span><MacroValues protein={food.protein} carbs={food.carbs} fat={food.fat} /></span>
    </span>
  </button>;
}

export function BalanceLogWireframes({ initialPage = 'foods', appearance = 'wireframe', basePath = BALANCE_WIREFRAME_PATH }: { initialPage?: AppPage; appearance?: 'wireframe' | 'android' | 'expressive'; basePath?: string } = {}) {
  const android = appearance !== 'wireframe';
  const expressive = appearance === 'expressive';
  const [colorMode, setColorMode] = useState<'dark' | 'light'>('dark');
  const themeClass = android ? `blw-android blw-android-${colorMode}${expressive ? ' blw-expressive' : ''}` : '';
  const [location, navigate] = useLocation();
  const search = useSearch();
  const addingFood = location === `${basePath}/agregar-alimento`;
  const foodContext = parseFoodRegistration(search);
  const [foodsByDay, setFoodsByDay] = useState<Record<number, Food[]>>(sampleDays);
  const [weightsByDay, setWeightsByDay] = useState<Record<number, string>>(sampleWeights);
  const [bodyByDay, setBodyByDay] = useState<BodyByDay>(sampleBody);
  const [page, setPage] = useState<AppPage>(initialPage);
  const [measurementKind, setMeasurementKind] = useState<MeasurementKind>('weight');
  const [summaryOptions, setSummaryOptions] = useState<SummaryOptions>({ area: 'nutrition', period: 30, metric: 'Cintura', endDay: 0 });
  const [profilePreferences, setProfilePreferences] = useState(defaultProfilePreferences);
  const [weightDate, setWeightDate] = useState(dayISO(0));
  const [weight, setWeight] = useState('');
  const [view, setView] = useState<View>('day');
  const [opened, setOpened] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [emptyDay, setEmptyDay] = useState(false);
  const [offset, setOffset] = useState(0);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [time, setTime] = useState('13:00');
  const [quantityDraft, setQuantityDraft] = useState<QuantityDraft>({ quantity: '', unit: 'canonical' });
  const [weightError, setWeightError] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const editFormId = useId();
  const activeFoods = foodsByDay[offset] ?? [];
  const dailyCalories = sum(activeFoods, 'calories');
  const dailyFiber = fiberTotal(activeFoods);
  const editedFood = sheet?.kind === 'edit' ? foodWithQuantity(sheet.food, quantityDraft) : null;
  const dailyProgress = Math.round(dailyCalories / CALORIE_TARGET * 100);
  const weekStart = offset - ((new Date(`${dayISO(offset)}T00:00:00Z`).getUTCDay() + 6) % 7);
  const updateFoods = (update: (foods: Food[]) => Food[]) =>
    setFoodsByDay((previous) => ({ ...previous, [offset]: update(previous[offset] ?? []) }));
  const groups = useMemo(() => groupFoodsByHour(activeFoods), [activeFoods]);
  const exitSelection = () => { setSelectionMode(false); setSelected(new Set()); };
  const changePage = (next: AppPage) => { if (addingFood) navigate(basePath, { replace: true }); setPage(next); exitSelection(); setAnnouncement(''); };
  const changeView = (next: View) => {
    if (addingFood) navigate(basePath, { replace: true });
    setView(next); setPage('foods'); setOffset(0); setEmptyDay(false); setFoodsByDay(sampleDays()); setWeightsByDay(sampleWeights()); setBodyByDay(sampleBody()); setAnnouncement('');
    setSummaryOptions({ area: 'nutrition', period: 30, metric: 'Cintura', endDay: 0 });
    setProfilePreferences(defaultProfilePreferences());
    setOpened(next === 'day' ? [] : ['13:00', '18:00']);
    setSelectionMode(next === 'selection');
    setSelected(next === 'selection' ? new Set(['c1', 'c2', 'd1']) : new Set());
    scrollRef.current?.scrollTo({ top: 0 });
  };
  const toggleFood = (id: string) => setSelected((previous) => {
    const next = new Set(previous); next.has(id) ? next.delete(id) : next.add(id); return next;
  });
  const startSelection = (ids: string[]) => { setSelectionMode(true); setSelected(new Set(ids)); };
  const toggleGroup = (groupFoods: Food[]) => {
    setSelectionMode(true);
    setSelected((previous) => {
      const next = new Set(previous); const all = groupFoods.every((food) => next.has(food.id));
      groupFoods.forEach((food) => all ? next.delete(food.id) : next.add(food.id)); return next;
    });
  };
  const openSheet = (next: NonNullable<Sheet>) => {
    setSheet(next);
    setTime(next.kind === 'edit' ? next.food.time : '13:00');
    if (next.kind === 'edit') setQuantityDraft(quantityDraftFor(next.food));
    setWeightError('');
    if (next.kind === 'weight') { setWeight(weightsByDay[offset] ?? ''); setWeightDate(dayISO(offset)); }
  };
  const setDate = (next: number) => { setOffset(next); setEmptyDay(false); setAnnouncement(''); exitSelection(); setOpened([]); scrollRef.current?.scrollTo({ top: 0 }); };
  const finishAction = (message: string) => { setSheet(null); setAnnouncement(message); };
  const openAddFood = (hour: string) => {
    setSheet(null); exitSelection();
    navigate(foodRegistrationURL({ day: offset, time: hour, method: 'libraries' }, basePath), { state: { balanceFoodRegistration: true } });
  };
  const changeFoodContext = (context: FoodRegistrationContext) => navigate(foodRegistrationURL(context, basePath), { replace: true, state: window.history.state });
  const closeAddFood = () => {
    if (window.history.state?.balanceFoodRegistration) window.history.back();
    else navigate(basePath, { replace: true });
  };
  const saveWeight = () => {
    if (!validWeight(weight, weightDate)) { setWeightError('Usa entre 1 y 500 kg, en pasos de 0,1, y una fecha hasta hoy según Santiago.'); return; }
    const day = dayOffset(weightDate);
    setWeightsByDay((previous) => ({ ...previous, [day]: weight }));
    setDate(day);
    finishAction('Peso guardado para el día seleccionado.');
  };
  const saveBody = (day: number, values: BodyValues) => {
    setBodyByDay((previous) => ({ ...previous, [day]: values }));
    setDate(day);
    finishAction('Medidas guardadas para el día seleccionado.');
  };
  const openRecords = (day: number, destination: AppPage, kind?: MeasurementKind) => {
    setDate(day); setPage(destination);
    if (kind) setMeasurementKind(kind);
  };
  const saveEdit = () => {
    if (sheet?.kind !== 'edit' || !editedFood) return;
    updateFoods((previous) => previous.map((food) => food.id === sheet.food.id ? { ...editedFood, time } : food));
    setOpened((previous) => [...new Set([...previous, hourGroup(time)])]);
    finishAction('Registro actualizado.');
  };
  const moveSelected = () => {
    updateFoods((previous) => previous.map((food) => selected.has(food.id) ? { ...food, time } : food));
    setOpened([hourGroup(time)]); exitSelection(); finishAction('Registros movidos.');
  };
  const deleteSelected = () => {
    updateFoods((previous) => previous.filter((food) => !selected.has(food.id))); exitSelection(); finishAction('Registros eliminados.');
  };
  const addExample = (food: Food) => {
    const id = `example-${Date.now()}-${nextId.current++}`;
    const { day, time: hour } = foodContext;
    setFoodsByDay((previous) => ({ ...previous, [day]: [...(previous[day] ?? []), { ...food, id, time: hour }] }));
    setOffset(day); setPage('foods'); setEmptyDay(false); setOpened([hourGroup(hour)]);
    finishAction(`${food.name} agregado al día seleccionado.`);
    closeAddFood();
  };

  return <div className={`blw-root ${themeClass}`}><div className="blw">
    <section className="blw-review" aria-label="Controles del wireframe">
      <div className="blw-intro"><span className="blw-kicker">{expressive ? 'Balance / Material Expressive · Estudio 02' : android ? 'Balance / Android · Estudio visual 01' : 'Balance / Propuesta multivista'}</span><h1>{expressive ? 'Balance · Expressive' : android ? <>Balance.<br /> En Android.</> : 'Registrar. Después, explorar.'}</h1><p>{expressive ? 'Más intención en las acciones y las transiciones. La misma información, con otra jerarquía.' : android ? 'Material 3 Expressive. Color tonal, formas suaves y el mismo registro cotidiano.' : 'Alimentos y mediciones para registrar; Resumen para mirar la evolución. Solo estructura e interacción.'}</p></div>
      {android && <div className="blw-style-controls">
        <div role="group" aria-label="Apariencia"><button aria-pressed={colorMode === 'dark'} onClick={() => setColorMode('dark')}>Oscuro</button><button aria-pressed={colorMode === 'light'} onClick={() => setColorMode('light')}>Claro</button></div>
        {expressive && <a href="/m/balance-android-material">Comparar con Android inicial ↗</a>}
        {appearance === 'android' && <a href="/m/balance-material-expressive">Comparar con Expressive ↗</a>}
        <a href={BALANCE_WIREFRAME_PATH}>Ver wireframe original ↗</a>
      </div>}
      <Tabs.Root value={page} onValueChange={(value) => changePage(value as AppPage)}>
        <Tabs.List className="blw-views" aria-label="Pantallas de revisión"><Tabs.Tab value="foods">Alimentos</Tabs.Tab><Tabs.Tab value="measurements">Mediciones</Tabs.Tab><Tabs.Tab value="summary">Resumen</Tabs.Tab><Tabs.Tab value="profile">Perfil</Tabs.Tab></Tabs.List>
      </Tabs.Root>
      {page === 'foods' && !addingFood && <Tabs.Root value={view} onValueChange={(value) => changeView(value as View)}>
        <Tabs.List className="blw-views" aria-label="Estados de revisión">
          <Tabs.Tab value="day">Día plegado</Tabs.Tab><Tabs.Tab value="detail">Detalle</Tabs.Tab><Tabs.Tab value="selection">Selección</Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>}
      <div className="blw-options">
        {page === 'foods' && !addingFood && <label><input type="checkbox" checked={emptyDay} onChange={(event) => { let day = 0; if (event.target.checked) { day = 1; while (foodsByDay[day]?.length) day++; } setDate(day); setEmptyDay(event.target.checked); }} /> Día vacío</label>}
        <button onClick={() => { changeView('day'); setPage(page); }}>Restablecer ejemplo</button>
      </div>
      {android && <div className="blw-material-notes"><div className="blw-swatches" aria-hidden="true"><i /><i /><i /><i /></div><p>{expressive ? "El énfasis está en Registrar, la selección y las transiciones. Las filas conservan su densidad." : "Superficies minerales. Azul para actuar. Ámbar para el exceso de energía."}</p><p>Explora las cuatro vistas, abre el + o cambia a Detalle para revisar los alimentos.</p><small>Prototipo web · referencia para Jetpack Compose<br />Datos ilustrativos · cambios solo en memoria</small></div>}
      <div className="blw-review-notes"><p><strong>Datos ilustrativos.</strong> Día de referencia: 9 oct 2026. 22 alimentos en seis grupos; pesos frecuentes y medidas corporales más espaciadas. No son tus datos.</p><p><strong>Alimentos.</strong> Conserva los registros de dos líneas, macros por grupo y resumen consumido / meta. El aro sigue llenándose de ámbar sobre la meta. Pulsación larga para seleccionar.</p><p><strong>Mediciones.</strong> Calendario mensual y registro por fecha. Peso diario o zonas opcionales, con ambos lados juntos. Sin gráficos ni días pendientes.</p><p><strong>Resumen.</strong> Alimentación / Cuerpo y períodos de 7, 30 o 90 días. Toca un gráfico para explorar una fecha; su enlace abre los registros correspondientes.</p><p><strong>Agregar alimento.</strong> Ruta propia con Bibliotecas y Etiquetas. En Etiquetas, completa la información nutricional por porción o usa el ejemplo para registrar un alimento.</p><p><strong>Perfil.</strong> Primera anatomía de cuenta, unidades actuales y preferencias. Los recordatorios son controles de ejemplo; no envían notificaciones.</p><p>El + compartido queda al centro y permite registrar alimento, peso o medidas. Los cambios se conservan entre vistas hasta restablecer el ejemplo o recargar.</p></div>
    </section>

    <section className="blw-stage" aria-label={android ? 'Propuesta visual Android' : 'Wireframe de teléfono'}>
      <div className="blw-device">
        {android && <div className="blw-app-brand"><span><Utensils size={18} aria-hidden="true" />Balance</span><small>{addingFood ? 'Nuevo registro' : { foods: 'Alimentos', measurements: 'Mediciones', summary: 'Resumen', profile: 'Perfil' }[page]}</small></div>}
        {addingFood ? <FoodRegistrationView foods={SAMPLE_FOODS} context={foodContext} onContext={changeFoodContext} onBack={closeAddFood} onAdd={addExample} /> : <>
        {page === 'foods' && <><header className="blw-date">
          <div className="blw-date-main"><button aria-label="Día anterior" onClick={() => setDate(offset - 1)}><ChevronLeft size={20} /></button><span><strong>{offset === 0 ? 'Hoy' : dateLabel(offset)}</strong><small>{dateLabel(offset)} de {dayISO(offset).slice(0, 4)}</small></span><button aria-label="Día siguiente" onClick={() => setDate(offset + 1)}><ChevronRight size={20} /></button></div>
          <div className="blw-week" aria-label="Elegir día y consultar kcal registradas">{Array.from({ length: 7 }, (_, i) => weekStart + i).map((dayOffset, i) => {
            const dayFoods = foodsByDay[dayOffset] ?? [];
            const calories = sum(dayFoods, 'calories');
            const progress = Math.round(calories / CALORIE_TARGET * 100);
            const ratio = calories / CALORIE_TARGET;
            return <button key={dayOffset} className="blw-day" aria-pressed={offset === dayOffset}
              aria-label={`${dateLabel(dayOffset)}: ${dayFoods.length ? `${dayFoods.length} alimentos registrados, ${format(calories)} de ${format(CALORIE_TARGET)} kcal, ${progress}% de la meta${calories > CALORIE_TARGET ? ', por encima de la meta' : ''}` : 'sin registros'}`}
              onClick={() => setDate(dayOffset)}>
              <span className="blw-weekday">{['L', 'M', 'M', 'J', 'V', 'S', 'D'][i]}</span>
              <span className="blw-day-number"><svg viewBox="0 0 36 36" aria-hidden="true">
                <circle className="blw-ring-track" cx="18" cy="18" r="15" />
                <circle className="blw-ring-value" cx="18" cy="18" r="15" pathLength="100" strokeDasharray={`${Math.min(1, ratio) * 100} 100`} />
                {ratio > 1 && <circle className="blw-ring-overflow" cx="18" cy="18" r="15" pathLength="100" strokeDasharray={`${Math.min(1, ratio - 1) * 100} 100`} />}
              </svg><span>{new Date(`${dayISO(dayOffset)}T00:00:00Z`).getUTCDate()}</span></span>
            </button>;
          })}</div>
          {offset !== 0 && <button className="blw-today" onClick={() => setDate(0)}>Volver a hoy</button>}
        </header>
        <button type="button" className="blw-summary" aria-label={`Totales del día: ${format(dailyCalories)} de ${format(CALORIE_TARGET)} kilocalorías. ${DAILY_NUTRIENTS.slice(0, 3).map(([, label, key, target]) => `${label}: ${sum(activeFoods, key)} de ${target} gramos`).join('. ')}. Ver detalle nutricional`} aria-haspopup="dialog" aria-expanded={sheet?.kind === 'nutrition'} onClick={() => openSheet({ kind: 'nutrition' })}>
          {expressive ? <>
            <span className="blx-energy-label">Energía registrada <ChevronRight size={18} aria-hidden="true" /></span>
            <span className="blw-energy"><span><strong>{format(dailyCalories)}</strong><span className="blx-energy-target"> / {format(CALORIE_TARGET)} kcal</span></span></span>
            <span className="blx-nutrients">{DAILY_NUTRIENTS.slice(0, 3).map(([, label, key, target]) => <span key={key}>
              <span className="blx-nutrient-label">{label}</span><span><strong>{format(sum(activeFoods, key))}</strong><small> / {target} g</small></span>
              <span className="blx-nutrient-meter" aria-hidden="true"><i style={{ width: `${Math.min(100, sum(activeFoods, key) / target * 100)}%` }} /></span>
            </span>)}</span>
          </> : <>
          <span className="blw-energy"><span><strong>{format(dailyCalories)}</strong> / {format(CALORIE_TARGET)} kcal</span><ChevronRight size={16} aria-hidden="true" /></span>
          <span className="blw-summary-macros">{DAILY_NUTRIENTS.slice(0, 3).map(([short, label, key, target]) => <span key={key} aria-label={`${label}: ${sum(activeFoods, key)} de ${target} gramos`}><abbr title={label}>{short}</abbr> <strong>{format(sum(activeFoods, key))}</strong><small> / {target} g</small></span>)}</span>
          </>}
        </button>
        <div className="blw-feed" ref={scrollRef}>
          {!groups.length ? <div className="blw-empty"><Image size={32} strokeWidth={1} /><h2>No hay registros</h2><p>Agrega el primer alimento de este día.</p><button onClick={() => openAddFood('08:00')}>Registrar alimento</button></div> :
            <Accordion.Root className="blw-groups" multiple value={opened} onValueChange={setOpened}>
              {groups.map(([hour, groupFoods]) => <Accordion.Item key={hour} value={hour} className="blw-group">
                <div className="blw-group-top">
                  {selectionMode && <button className="blw-group-select" aria-label={`Seleccionar grupo de ${hour}`} aria-pressed={groupFoods.every((food) => selected.has(food.id))} onClick={() => toggleGroup(groupFoods)}><span className="blw-check">{groupFoods.every((food) => selected.has(food.id)) && <Check size={12} />}</span></button>}
                  <Accordion.Header className="blw-group-heading"><Accordion.Trigger className="blw-group-trigger">
                    <span className="blw-group-line"><span className="blw-group-identity"><strong>{hour}</strong><small>{groupFoods.length} {groupFoods.length === 1 ? 'alimento' : 'alimentos'}</small></span><span className="blw-group-energy"><span className="blw-group-calories">{format(sum(groupFoods, 'calories'))}<small> kcal</small></span><ChevronDown size={14} aria-hidden="true" /></span></span>
                    <MacroValues protein={sum(groupFoods, 'protein')} carbs={sum(groupFoods, 'carbs')} fat={sum(groupFoods, 'fat')} />
                  </Accordion.Trigger></Accordion.Header>
                  <button className="blw-group-add" aria-label={`Agregar alimento a las ${hour}`} disabled={selectionMode} onClick={() => openAddFood(hour)}><Plus size={18} /></button>
                </div>
                <Accordion.Panel className="blw-group-panel">{groupFoods.map((food) => <FoodRow key={food.id} food={food} selectionMode={selectionMode} selected={selected.has(food.id)} onEdit={() => openSheet({ kind: 'edit', food })} onSelect={() => toggleFood(food.id)} onStartSelection={() => startSelection([food.id])} />)}</Accordion.Panel>
              </Accordion.Item>)}
            </Accordion.Root>}
          {announcement && <p className="blw-announcement" role="status">{announcement}</p>}
        </div></>}
        {page === 'measurements' && <MeasurementView offset={offset} onDate={setDate} kind={measurementKind} onKind={setMeasurementKind} weights={weightsByDay} body={bodyByDay} onRegister={(kind) => openSheet({ kind })} />}
        {page === 'summary' && <SummaryView nutrition={Object.entries(foodsByDay).filter(([, foods]) => foods.length > 0).map(([day, foods]) => ({ day: Number(day), calories: sum(foods, 'calories'), protein: sum(foods, 'protein'), carbs: sum(foods, 'carbs'), fat: sum(foods, 'fat') }))} weights={weightsByDay} body={bodyByDay} options={summaryOptions} onOptions={setSummaryOptions} onOpenFoods={(day) => openRecords(day, 'foods')} onOpenMeasurements={(day, kind) => openRecords(day, 'measurements', kind)} />}
        {page === 'profile' && <ProfileView preferences={profilePreferences} onChange={setProfilePreferences} />}
        {page !== 'foods' && announcement && <p className="blw-announcement" role="status">{announcement}</p>}
        {selectionMode ? <div className="blw-action" aria-label="Acciones de selección">
          <span>{selected.size} seleccionados</span><div><button onClick={exitSelection}>Cancelar</button><button disabled={!selected.size} onClick={() => openSheet({ kind: 'move' })}>Mover</button><button disabled={!selected.size} onClick={() => openSheet({ kind: 'delete' })}>Eliminar</button></div>
        </div> : <nav className="blw-bottom-nav" aria-label="Navegación y registro">
          <button className="blw-nav-destination" aria-current={page === 'foods' ? 'page' : undefined} onClick={() => changePage('foods')}><Utensils size={18} aria-hidden="true" /><span>Alimentos</span></button>
          <button className="blw-nav-destination" aria-current={page === 'measurements' ? 'page' : undefined} onClick={() => changePage('measurements')}><MeasurementIcon size={18} aria-hidden="true" /><span>Mediciones</span></button>
          <button className="blw-nav-add" aria-label="Registrar alimento, peso o medidas" aria-haspopup="dialog" aria-expanded={sheet?.kind === 'register' || sheet?.kind === 'weight' || sheet?.kind === 'body'} onClick={() => openSheet({ kind: 'register' })}><Plus size={22} aria-hidden="true" />{expressive && <span>Registrar</span>}</button>
          <button className="blw-nav-destination" aria-current={page === 'summary' ? 'page' : undefined} onClick={() => changePage('summary')}><ChartNoAxesCombined size={18} aria-hidden="true" /><span>Resumen</span></button>
          <button className="blw-nav-destination" aria-current={page === 'profile' ? 'page' : undefined} onClick={() => changePage('profile')}><UserRound size={18} aria-hidden="true" /><span>Perfil</span></button>
        </nav>}</>}
      </div>
      <p className="blw-caption">{android ? expressive ? "Material 3 Expressive / Exploración 02" : "Material 3 / Exploración Android · 01" : "Alimentos · Mediciones · + · Resumen · Perfil / datos de ejemplo"}</p>
    </section>

    <Dialog.Root open={sheet !== null} onOpenChange={(open) => { if (!open) setSheet(null); }}>
      <Dialog.Portal><Dialog.Backdrop className="blw-dialog-backdrop" /><Dialog.Popup className={`blw-dialog ${themeClass}${sheet?.kind === 'register' || sheet?.kind === 'weight' || sheet?.kind === 'body' || sheet?.kind === 'nutrition' ? ' blw-registration-sheet' : ''}`}>
        <div className="blw-dialog-heading">
          <Dialog.Title>{sheet?.kind === 'nutrition' ? 'Detalle nutricional del día' : sheet?.kind === 'edit' ? sheet.food.name : sheet?.kind === 'register' ? 'Registrar' : sheet?.kind === 'body' ? 'Registrar medidas corporales' : sheet?.kind === 'weight' ? 'Registrar peso' : sheet?.kind === 'move' ? 'Mover de hora' : 'Eliminar registros'}</Dialog.Title>
          <Dialog.Description>{sheet?.kind === 'nutrition' ? `${dateLabel(offset)} · Consumido / meta` : sheet?.kind === 'edit' ? 'Ajusta la cantidad y la hora de este registro.' : sheet?.kind === 'body' ? 'Completa solo las zonas que mediste, en centímetros.' : sheet?.kind === 'weight' ? 'Registra un peso para la fecha elegida.' : sheet?.kind === 'move' ? 'Elige una nueva hora para los registros seleccionados.' : sheet?.kind === 'delete' ? 'Los registros se quitarán del día seleccionado.' : `Para ${dateLabel(offset)} de ${dayISO(offset).slice(0, 4)}`}</Dialog.Description>
        </div>
        {sheet?.kind === 'body' ? <BodyMeasurementForm offset={offset} body={bodyByDay} onSave={saveBody} onCancel={() => setSheet(null)} /> : <>
        <div className="blw-dialog-content">
        {sheet?.kind === 'nutrition' ? <>
          <dl className="blw-nutrition-details">
            <div><dt>Energía</dt><dd><strong>{format(dailyCalories)}</strong> / {format(CALORIE_TARGET)} kcal</dd></div>
            {DAILY_NUTRIENTS.map(([, label, key, target]) => <div key={key}><dt>{label}</dt><dd>{key === 'fiber' && dailyFiber.value === undefined ? 'Sin datos' : key === 'fiber' && dailyFiber.partial ? `${format(dailyFiber.value!)} g conocidos (parcial)` : <><strong>{format(sum(activeFoods, key))}</strong> / {target} g</>}</dd></div>)}
            {['Azúcares', 'Grasas saturadas', 'Sodio', 'Colesterol'].map((label) => <div key={label}><dt>{label}</dt><dd>Sin datos</dd></div>)}
          </dl>
          <p className="blw-nutrition-note">Energía: {dailyProgress}% de la meta. Los nutrientes sin datos no se contabilizan como cero.</p>
        </> : sheet?.kind === 'register' ? <div className="blw-registration-options">
          <button onClick={() => openAddFood('13:00')}><Utensils size={22} aria-hidden="true" /><span><strong>Alimento</strong><small>Buscar y registrar</small></span><ChevronRight size={18} aria-hidden="true" /></button>
          <button onClick={() => openSheet({ kind: 'weight' })}><Scale size={22} aria-hidden="true" /><span><strong>Peso</strong><small>Anotar el peso del día</small></span><ChevronRight size={18} aria-hidden="true" /></button>
          <button onClick={() => openSheet({ kind: 'body' })}><MeasurementIcon size={22} aria-hidden="true" /><span><strong>Medidas corporales</strong><small>Registrar las zonas que mediste</small></span><ChevronRight size={18} aria-hidden="true" /></button>
        </div> : sheet?.kind === 'weight' ? <form id={editFormId} onSubmit={(event) => { event.preventDefault(); saveWeight(); }}>
          <label className="blw-field">Fecha<input type="date" required min="2000-01-01" max={santiagoDate()} value={weightDate} onChange={(event) => { setWeightDate(event.target.value); if (event.target.value) setWeight(weightsByDay[dayOffset(event.target.value)] ?? ''); }} /></label>
          <label className="blw-field">Peso en kg<input type="number" inputMode="decimal" min="1" max="500" step="0.1" required value={weight} placeholder="72,4" onChange={(event) => setWeight(event.target.value)} /></label>
          <small>Entre 1 y 500 kg, en pasos de 0,1.</small>{weightError && <p role="alert">{weightError}</p>}
        </form> : sheet?.kind === 'delete' ? <p>¿Eliminar {selected.size} registros?</p> :
          <form id={editFormId} onSubmit={(event) => { event.preventDefault(); if (sheet?.kind === 'edit') saveEdit(); if (sheet?.kind === 'move') moveSelected(); }}>
            <label className="blw-field">Hora<input type="time" value={time} required onChange={(event) => setTime(event.target.value)} /></label>
            {sheet?.kind === 'edit' && <><FoodQuantityFields food={sheet.food} draft={quantityDraft} onChange={setQuantityDraft} />{editedFood && <p className="blw-snapshot">{format(editedFood.calories)} kcal · P {format(editedFood.protein)} g · C {format(editedFood.carbs)} g · G {format(editedFood.fat)} g<br /><small>{format(editedFood.canonicalQuantity)} {sheet.food.nutritionSnapshot.canonicalUnit} consumidos</small></p>}</>}
            {sheet?.kind === 'move' && <p>{selected.size} registros seleccionados, dentro del mismo día.</p>}
          </form>}
        </div>
        {sheet?.kind === 'edit' && <button type="button" className="blw-select-multiple" onClick={() => { startSelection([sheet.food.id]); setSheet(null); }}>Seleccionar varios</button>}
        <footer className="blw-form-actions">
          <Dialog.Close className="blw-sheet-close">{sheet?.kind === 'nutrition' || sheet?.kind === 'register' ? 'Cerrar' : 'Cancelar'}</Dialog.Close>
          {sheet?.kind === 'weight' && <button className="blw-sheet-primary" type="submit" form={editFormId}>Guardar peso</button>}
          {sheet?.kind === 'edit' && <button className="blw-sheet-primary" type="submit" form={editFormId} disabled={!editedFood}>Guardar registro</button>}
          {sheet?.kind === 'move' && <button className="blw-sheet-primary" type="submit" form={editFormId}>Mover a las {time}</button>}
          {sheet?.kind === 'delete' && <button className="blw-sheet-primary" onClick={deleteSelected}>Eliminar seleccionados</button>}
        </footer>
        </>}
      </Dialog.Popup></Dialog.Portal>
    </Dialog.Root>
  </div></div>;
}
