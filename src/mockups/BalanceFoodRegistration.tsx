import { useEffect, useRef, useState } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { ArrowLeft, Check, Image, Plus, ScanQrCode, Search } from 'lucide-react';
import { dayISO, dayOffset } from './BalanceMeasurementViews';

export type Food = { id: string; name: string; portion: string; time: string; calories: number; protein: number; carbs: number; fat: number; fiber: number };
export const BALANCE_WIREFRAME_PATH = '/m/balance-log-wireframes';
export const ADD_FOOD_PATH = `${BALANCE_WIREFRAME_PATH}/agregar-alimento`;
export type FoodRegistrationContext = { day: number; time: string; method: 'libraries' | 'qr' };

export function parseFoodRegistration(search: string): FoodRegistrationContext {
  const params = new URLSearchParams(search);
  const date = params.get('fecha') ?? '';
  const timestamp = /^\d{4}-\d{2}-\d{2}$/.test(date) ? Date.parse(`${date}T00:00:00Z`) : NaN;
  const validDate = Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === date && date >= '2000-01-01' && date <= '2100-12-31';
  const time = params.get('hora') ?? '';
  return { day: validDate ? dayOffset(date) : 0, time: /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : '13:00', method: params.get('modo') === 'qr' ? 'qr' : 'libraries' };
}

export function foodRegistrationURL(context: FoodRegistrationContext) {
  return `${ADD_FOOD_PATH}?${new URLSearchParams({ fecha: dayISO(context.day), hora: context.time, modo: context.method })}`;
}

const personalIds = new Set(['a1', 'a2', 'c1', 'c2', 'd1', 'd2']);
const foodLibrary = (food: Food) => personalIds.has(food.id) ? 'personal' : 'shared';
const libraryLabel = (food: Food) => foodLibrary(food) === 'personal' ? 'Mi biblioteca' : 'Compartida';
const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es');
export function searchExampleFoods(foods: Food[], query: string, library: string) {
  return foods.filter((food) => (library === 'all' || foodLibrary(food) === library) && normalize(food.name).includes(normalize(query.trim())));
}

export function FoodRegistrationView({ foods, context, onContext, onBack, onAdd }: {
  foods: Food[]; context: FoodRegistrationContext; onContext: (context: FoodRegistrationContext) => void;
  onBack: () => void; onAdd: (food: Food) => void;
}) {
  const [query, setQuery] = useState('');
  const [library, setLibrary] = useState('all');
  const [chosen, setChosen] = useState<Food | null>(null);
  const [qrResult, setQrResult] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const filtered = searchExampleFoods(foods, query, library);
  return <>
    <header className="blw-add-header"><button onClick={onBack} aria-label="Volver sin agregar alimento"><ArrowLeft size={20} /></button><h2 ref={heading} tabIndex={-1}>Agregar alimento</h2></header>
    <div className="blw-add-context">
      <label>Fecha<input type="date" min="2000-01-01" max="2100-12-31" value={dayISO(context.day)} onChange={(event) => { if (event.target.value) onContext({ ...context, day: dayOffset(event.target.value) }); }} /></label>
      <label>Hora<input type="time" value={context.time} onChange={(event) => { if (event.target.value) onContext({ ...context, time: event.target.value }); }} /></label>
    </div>
    <Tabs.Root className="blw-add-tabs" value={context.method} onValueChange={(value) => onContext({ ...context, method: value as FoodRegistrationContext['method'] })}>
      <Tabs.List className="blw-segments" aria-label="Origen del alimento"><Tabs.Tab value="libraries">Bibliotecas</Tabs.Tab><Tabs.Tab value="qr">Código QR</Tabs.Tab></Tabs.List>
      <Tabs.Panel value="libraries" className="blw-add-panel">
        <div className="blw-library-search"><label><Search size={16} aria-hidden="true" /><input type="search" aria-label="Buscar alimento en bibliotecas" value={query} placeholder="Buscar un alimento" onChange={(event) => setQuery(event.target.value)} /></label>
          <label className="blw-library-filter">Biblioteca<select value={library} onChange={(event) => setLibrary(event.target.value)}><option value="all">Todas</option><option value="personal">Mi biblioteca</option><option value="shared">Compartida</option></select></label>
        </div>
        <div className="blw-library-results" aria-label="Alimentos de las bibliotecas">{filtered.map((food) => <button className="blw-library-food" key={food.id} aria-pressed={chosen?.id === food.id} onClick={() => setChosen(chosen?.id === food.id ? null : food)}>
          <span className="blw-image" aria-hidden="true"><Image size={18} strokeWidth={1.2} /></span><span className="blw-library-food-name"><strong title={food.name}>{food.name}</strong><small title={`${food.portion} · ${libraryLabel(food)}`}>{food.portion} · {libraryLabel(food)}</small></span><span className="blw-library-food-kcal">{food.calories}<small> kcal</small></span>{chosen?.id === food.id ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
        </button>)}</div>
        {!filtered.length && <div className="blw-measurement-empty blw-library-empty"><p>No encontramos alimentos.</p><span>Prueba otro nombre o biblioteca.</span></div>}
      </Tabs.Panel>
      <Tabs.Panel value="qr" className="blw-add-panel blw-qr-panel">
        <div className="blw-qr-frame" aria-label="Área ilustrativa del lector QR"><ScanQrCode size={68} strokeWidth={1} /><span>Código QR</span></div>
        <h3>Escanea el alimento</h3><p>Busca el código para encontrarlo en tus bibliotecas.</p>
        <button className="blw-qr-example" onClick={() => { const food = foods.find((entry) => entry.id === 'b1') ?? foods[0]; if (food) { setChosen(food); setQrResult(`${food.name} encontrado en la biblioteca ${libraryLabel(food).toLocaleLowerCase('es')}.`); } }}>Usar QR de ejemplo</button>
        {qrResult && <p className="blw-qr-result" role="status">{qrResult}</p>}
      </Tabs.Panel>
    </Tabs.Root>
    {chosen && <footer className="blw-add-confirm"><div><strong>{chosen.name}</strong><small>{chosen.portion} · {chosen.calories} kcal · P {chosen.protein} g · C {chosen.carbs} g · G {chosen.fat} g</small></div><button onClick={() => onAdd(chosen)}>Registrar alimento</button></footer>}
  </>;
}
