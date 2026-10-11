import { useEffect, useMemo, useRef, useState } from 'react';
import { Accordion } from '@base-ui/react/accordion';
import { Dialog } from '@base-ui/react/dialog';
import { Tabs } from '@base-ui/react/tabs';
import { Check, ChevronDown, ChevronLeft, ChevronRight, Image, Plus } from 'lucide-react';
import './BalanceLogWireframes.css';

type Food = { id: string; name: string; portion: string; time: string; calories: number; protein: number; carbs: number; fat: number; fiber: number };
type View = 'day' | 'detail' | 'selection';
type Sheet = { kind: 'edit'; food: Food } | { kind: 'add'; time: string } | { kind: 'move' } | { kind: 'delete' } | null;
const sample = (id: string, name: string, portion: string, time: string, calories: number, protein: number, carbs: number, fat: number, fiber = 0): Food =>
  ({ id, name, portion, time, calories, protein, carbs, fat, fiber });

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
  sample('c2', 'Arroz integral', '160 g', '13:12', 180, 4, 38, 2, 3),
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
const sum = (foods: Food[], key: 'calories' | 'protein' | 'carbs' | 'fat' | 'fiber') => foods.reduce((total, food) => total + food[key], 0);
const CALORIE_TARGET = 2200;
// Neighboring historical days demonstrate partial intake; future days start empty.
const sampleDays = (): Record<number, Food[]> => ({
  [-4]: SAMPLE_FOODS.slice(0, 8),
  [-2]: SAMPLE_FOODS.slice(0, 12),
  [-1]: SAMPLE_FOODS.slice(0, 18),
  [0]: [...SAMPLE_FOODS],
});
const hourGroup = (time: string) => {
  const [hour, minute] = time.split(':').map(Number);
  return `${String((hour + (minute > 30 ? 1 : 0)) % 24).padStart(2, '0')}:00`;
};
const format = (value: number) => new Intl.NumberFormat('es-CL').format(value);
const dateLabel = (offset: number) => {
  const date = new Date(Date.UTC(2026, 9, 9 + offset));
  return new Intl.DateTimeFormat('es-CL', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date);
};

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
    onClick={() => { if (held.current) { held.current = false; return; } selectionMode ? onSelect() : onEdit(); }}
    onPointerDown={(event) => {
      held.current = false;
      if (!event.isPrimary || event.button !== 0) return;
      origin.current = { x: event.clientX, y: event.clientY };
      cancelHold();
      timer.current = setTimeout(() => { held.current = true; onStartSelection(); }, 550);
    }}
    onPointerMove={(event) => { if (Math.hypot(event.clientX - origin.current.x, event.clientY - origin.current.y) > 8) cancelHold(); }}
    onPointerUp={cancelHold} onPointerCancel={cancelHold}
    onContextMenu={(event) => event.preventDefault()}>
    {selectionMode && <span className="blw-check" aria-hidden="true">{selected && <Check size={12} />}</span>}
    <span className="blw-image" aria-hidden="true"><Image size={18} strokeWidth={1.2} /></span>
    <span className="blw-food-content">
      <span className="blw-line-one"><span className="blw-food-name" title={food.name}>{food.name}</span><span className="blw-calories">{food.calories}<small> kcal</small></span></span>
      <span className="blw-line-two"><span className="blw-quantity-time"><span className="blw-portion" title={food.portion}>{food.portion}</span><span className="blw-time">· {food.time}</span></span><span className="blw-macros">P {food.protein}g · C {food.carbs}g · G {food.fat}g</span></span>
    </span>
  </button>;
}

export function BalanceLogWireframes() {
  const [foodsByDay, setFoodsByDay] = useState<Record<number, Food[]>>(sampleDays);
  const [view, setView] = useState<View>('day');
  const [opened, setOpened] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [emptyDay, setEmptyDay] = useState(false);
  const [offset, setOffset] = useState(0);
  const [sheet, setSheet] = useState<Sheet>(null);
  const [time, setTime] = useState('13:00');
  const [portion, setPortion] = useState('');
  const [query, setQuery] = useState('');
  const [announcement, setAnnouncement] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const activeFoods = emptyDay ? [] : foodsByDay[offset] ?? [];
  const dailyCalories = sum(activeFoods, 'calories');
  const dailyProgress = Math.round(dailyCalories / CALORIE_TARGET * 100);
  const updateFoods = (update: (foods: Food[]) => Food[]) =>
    setFoodsByDay((previous) => ({ ...previous, [offset]: update(emptyDay ? [] : previous[offset] ?? []) }));
  const groups = useMemo(() => {
    const byHour = new Map<string, Food[]>();
    for (const food of activeFoods) {
      const hour = hourGroup(food.time);
      byHour.set(hour, [...(byHour.get(hour) ?? []), food]);
    }
    return [...byHour.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [activeFoods]);
  const exitSelection = () => { setSelectionMode(false); setSelected(new Set()); };
  const changeView = (next: View) => {
    setView(next); setOffset(0); setEmptyDay(false); setFoodsByDay(sampleDays()); setAnnouncement('');
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
    setSheet(next); setQuery('');
    setTime(next.kind === 'edit' ? next.food.time : next.kind === 'add' ? next.time : '13:00');
    setPortion(next.kind === 'edit' ? next.food.portion : '');
  };
  const setDate = (next: number) => { setOffset(next); setEmptyDay(false); setAnnouncement(''); exitSelection(); setOpened([]); scrollRef.current?.scrollTo({ top: 0 }); };
  const finishAction = (message: string) => { setSheet(null); setAnnouncement(message); };
  const saveEdit = () => {
    if (sheet?.kind !== 'edit') return;
    updateFoods((previous) => previous.map((food) => food.id === sheet.food.id ? { ...food, time, portion: portion.trim() } : food));
    setOpened((previous) => [...new Set([...previous, hourGroup(time)])]);
    finishAction('Registro de ejemplo actualizado. La nutrición histórica se conserva.');
  };
  const moveSelected = () => {
    updateFoods((previous) => previous.map((food) => selected.has(food.id) ? { ...food, time } : food));
    setOpened([hourGroup(time)]); exitSelection(); finishAction('Registros de ejemplo movidos.');
  };
  const deleteSelected = () => {
    updateFoods((previous) => previous.filter((food) => !selected.has(food.id))); exitSelection(); finishAction('Registros de ejemplo eliminados.');
  };
  const addExample = (food: Food) => {
    const id = `example-${Date.now()}-${nextId.current++}`;
    updateFoods((previous) => [...previous, { ...food, id, time }]);
    setEmptyDay(false); setOpened((previous) => [...new Set([...previous, hourGroup(time)])]);
    finishAction(`${food.name} agregado al día seleccionado.`);
  };

  return <div className="blw-root"><div className="blw">
    <section className="blw-review" aria-label="Controles del wireframe">
      <div className="blw-intro"><span className="blw-kicker">Balance / Registros</span><h1>Anatomía primero.</h1><p>El mismo día, tres estados. Solo estructura e interacción; la apariencia viene después.</p></div>
      <Tabs.Root value={view} onValueChange={(value) => changeView(value as View)}>
        <Tabs.List className="blw-views" aria-label="Estados de revisión">
          <Tabs.Tab value="day">Día plegado</Tabs.Tab><Tabs.Tab value="detail">Detalle</Tabs.Tab><Tabs.Tab value="selection">Selección</Tabs.Tab>
        </Tabs.List>
      </Tabs.Root>
      <div className="blw-options">
        <label><input type="checkbox" checked={emptyDay} onChange={(event) => { setEmptyDay(event.target.checked); exitSelection(); }} /> Día vacío</label>
        <button onClick={() => changeView(view)}>Restablecer ejemplo</button>
      </div>
      <div className="blw-review-notes"><p><strong>Datos ilustrativos.</strong> Hoy tiene 22 alimentos en seis grupos. Los días anteriores muestran ejemplos parciales.</p><p>En la semana: punto = hay registros; aro = kcal / meta. El signo + indica más del 100%. Ninguna señal confirma que el día esté completo.</p><p>Toca un grupo para abrirlo. Toca un alimento para consultar o editar; mantén pulsado para seleccionar.</p><p>Los nombres y las porciones largos conservan dos líneas; el detalle completo está al tocar el registro.</p></div>
    </section>

    <section className="blw-stage" aria-label="Wireframe de teléfono">
      <div className="blw-device">
        <header className="blw-date">
          <div className="blw-date-main"><button aria-label="Día anterior" onClick={() => setDate(offset - 1)}><ChevronLeft size={20} /></button><span><strong>{offset === 0 ? 'Hoy' : dateLabel(offset)}</strong><small>{dateLabel(offset)} de 2026</small></span><button aria-label="Día siguiente" onClick={() => setDate(offset + 1)}><ChevronRight size={20} /></button></div>
          <div className="blw-week" aria-label="Elegir día y consultar kcal registradas">{Array.from({ length: 7 }, (_, i) => i - 4).map((dayOffset) => {
            const dayFoods = emptyDay && offset === dayOffset ? [] : foodsByDay[dayOffset] ?? [];
            const calories = sum(dayFoods, 'calories');
            const progress = Math.round(calories / CALORIE_TARGET * 100);
            return <button key={dayOffset} className="blw-day" aria-pressed={offset === dayOffset}
              aria-label={`${dateLabel(dayOffset)}: ${dayFoods.length ? `${dayFoods.length} alimentos registrados, ${format(calories)} de ${format(CALORIE_TARGET)} kcal, ${progress}% de la meta${calories > CALORIE_TARGET ? ', por encima de la meta' : ''}` : 'sin registros'}`}
              data-logged={dayFoods.length > 0 || undefined} onClick={() => setDate(dayOffset)}>
              <span className="blw-weekday">{['L', 'M', 'M', 'J', 'V', 'S', 'D'][dayOffset + 4]}<span className="blw-logged-dot" aria-hidden="true" /></span>
              <span className="blw-day-number"><svg viewBox="0 0 36 36" aria-hidden="true"><circle className="blw-ring-track" cx="18" cy="18" r="15" /><circle className="blw-ring-value" cx="18" cy="18" r="15" pathLength="100" strokeDasharray={`${Math.min(100, calories / CALORIE_TARGET * 100)} 100`} /></svg><span>{dayOffset + 9}</span>{calories > CALORIE_TARGET && <small aria-hidden="true">+</small>}</span>
            </button>;
          })}</div>
          {offset !== 0 && <button className="blw-today" onClick={() => setDate(0)}>Volver a hoy</button>}
        </header>
        <section className="blw-summary" aria-label="Totales del día">
          <div className="blw-energy"><span><strong>{format(dailyCalories)}</strong> / {format(CALORIE_TARGET)} kcal</span><small>{dailyProgress}% de la meta</small></div>
          <div className="blw-summary-macros">{([['P', 'Proteínas', 'protein'], ['C', 'Carbohidratos', 'carbs'], ['G', 'Grasas', 'fat'], ['F', 'Fibra', 'fiber']] as const).map(([short, label, key]) => <span key={key} aria-label={`${label}: ${sum(activeFoods, key)} gramos`}><abbr title={label}>{short}</abbr> <strong>{sum(activeFoods, key)}<small> g</small></strong></span>)}</div>
        </section>
        <div className="blw-feed" ref={scrollRef}>
          <div className="blw-list-tools"><span>{activeFoods.length} alimentos · {groups.length} grupos</span><button disabled={!activeFoods.length} onClick={() => selectionMode ? exitSelection() : setSelectionMode(true)}>{selectionMode ? 'Cancelar selección' : 'Seleccionar'}</button></div>
          {!groups.length ? <div className="blw-empty"><Image size={32} strokeWidth={1} /><h2>No hay registros</h2><p>Agrega el primer alimento de este día.</p><button onClick={() => openSheet({ kind: 'add', time: '08:00' })}>Registrar alimento</button></div> :
            <Accordion.Root className="blw-groups" multiple value={opened} onValueChange={setOpened}>
              {groups.map(([hour, groupFoods]) => <Accordion.Item key={hour} value={hour} className="blw-group">
                <div className="blw-group-top">
                  {selectionMode && <button className="blw-group-select" aria-label={`Seleccionar grupo de ${hour}`} aria-pressed={groupFoods.every((food) => selected.has(food.id))} onClick={() => toggleGroup(groupFoods)}><span className="blw-check">{groupFoods.every((food) => selected.has(food.id)) && <Check size={12} />}</span></button>}
                  <Accordion.Header className="blw-group-heading"><Accordion.Trigger className="blw-group-trigger"><ChevronDown size={15} /><span className="blw-group-content"><span className="blw-group-line"><strong>{hour}</strong><span className="blw-group-calories">{sum(groupFoods, 'calories')}<small> kcal</small></span></span><span className="blw-group-line"><small>{groupFoods.length} {groupFoods.length === 1 ? 'alimento' : 'alimentos'}</small><span className="blw-group-macros" aria-label={`Proteínas ${sum(groupFoods, 'protein')} gramos, carbohidratos ${sum(groupFoods, 'carbs')} gramos, grasas ${sum(groupFoods, 'fat')} gramos`}>P {sum(groupFoods, 'protein')}g · C {sum(groupFoods, 'carbs')}g · G {sum(groupFoods, 'fat')}g</span></span></span></Accordion.Trigger></Accordion.Header>
                  <button className="blw-group-add" aria-label={`Agregar alimento a las ${hour}`} disabled={selectionMode} onClick={() => openSheet({ kind: 'add', time: hour })}><Plus size={18} /></button>
                </div>
                <Accordion.Panel className="blw-group-panel">{groupFoods.map((food) => <FoodRow key={food.id} food={food} selectionMode={selectionMode} selected={selected.has(food.id)} onEdit={() => openSheet({ kind: 'edit', food })} onSelect={() => toggleFood(food.id)} onStartSelection={() => startSelection([food.id])} />)}</Accordion.Panel>
              </Accordion.Item>)}
            </Accordion.Root>}
          {announcement && <p className="blw-announcement" role="status">{announcement}</p>}
        </div>
        <div className="blw-action">
          {selectionMode ? <><span>{selected.size} seleccionados</span><div><button onClick={exitSelection}>Cancelar</button><button disabled={!selected.size} onClick={() => openSheet({ kind: 'move' })}>Mover</button><button disabled={!selected.size} onClick={() => openSheet({ kind: 'delete' })}>Eliminar</button></div></> : <button className="blw-register" onClick={() => openSheet({ kind: 'add', time: '13:00' })}><Plus size={17} /> Registrar alimento</button>}
        </div>
        <nav className="blw-bottom-nav" aria-label="Navegación de referencia"><span>Resumen</span><strong aria-current="page">Registros</strong><span>Biblioteca</span></nav>
      </div>
      <p className="blw-caption">Dos líneas por alimento · imágenes neutras · sin nombres de comidas</p>
    </section>

    <Dialog.Root open={sheet !== null} onOpenChange={(open) => { if (!open) setSheet(null); }}>
      <Dialog.Portal><Dialog.Backdrop className="blw-dialog-backdrop" /><Dialog.Popup className="blw-dialog">
        <Dialog.Title>{sheet?.kind === 'edit' ? sheet.food.name : sheet?.kind === 'add' ? 'Registrar alimento' : sheet?.kind === 'move' ? 'Mover de hora' : 'Eliminar registros'}</Dialog.Title>
        <Dialog.Description>Prototipo con datos de ejemplo. Los cambios se conservan solo mientras revisas esta pantalla.</Dialog.Description>
        {sheet?.kind === 'delete' ? <><p>¿Eliminar {selected.size} registros del ejemplo?</p><button className="blw-sheet-primary" onClick={deleteSelected}>Eliminar seleccionados</button></> :
          <form onSubmit={(event) => { event.preventDefault(); if (sheet?.kind === 'edit') saveEdit(); if (sheet?.kind === 'move') moveSelected(); }}>
            <label className="blw-field">Hora<input type="time" value={time} required onChange={(event) => setTime(event.target.value)} /></label>
            {sheet?.kind === 'edit' && <><label className="blw-field">Cantidad<input value={portion} required onChange={(event) => setPortion(event.target.value)} /></label><p className="blw-snapshot">{sheet.food.calories} kcal · P {sheet.food.protein}g · C {sheet.food.carbs}g · G {sheet.food.fat}g<br /><small>La nutrición histórica se conserva al editar hora y cantidad.</small></p><button className="blw-sheet-primary" type="submit">Guardar registro</button></>}
            {sheet?.kind === 'move' && <><p>{selected.size} registros seleccionados, dentro del mismo día.</p><button className="blw-sheet-primary" type="submit">Mover a las {time}</button></>}
            {sheet?.kind === 'add' && <><label className="blw-field">Buscar en el ejemplo<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Nombre del alimento" /></label><div className="blw-example-library">{SAMPLE_FOODS.filter((food) => food.name.toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es'))).map((food) => <button type="button" key={food.id} onClick={() => addExample(food)}><span>{food.name}<small>{food.portion}</small></span><Plus size={16} /></button>)}</div></>}
          </form>}
        <Dialog.Close className="blw-sheet-close">Cerrar</Dialog.Close>
      </Dialog.Popup></Dialog.Portal>
    </Dialog.Root>
  </div></div>;
}
