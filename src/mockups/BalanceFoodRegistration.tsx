import { useEffect, useRef, useState } from 'react';
import { Tabs } from '@base-ui/react/tabs';
import { ArrowLeft, Check, FileText, Image, Plus, Search } from 'lucide-react';
import { dayISO, dayOffset } from './BalanceMeasurementViews';
import { foodWithQuantity, formatFoodNumber, makeFixtureFood, quantityDraftFor, scaleFixtureNutrition } from './BalanceFoodModel';
import type { CanonicalUnit, Food, QuantityDraft } from './BalanceFoodModel';
import { FoodQuantityFields } from './BalanceFoodQuantity';
export type { Food } from './BalanceFoodModel';

export const BALANCE_WIREFRAME_PATH = '/m/balance-log-wireframes';
export const ADD_FOOD_PATH = `${BALANCE_WIREFRAME_PATH}/agregar-alimento`;
export type FoodRegistrationContext = { day: number; time: string; method: 'libraries' | 'labels' };

export function parseFoodRegistration(search: string): FoodRegistrationContext {
  const params = new URLSearchParams(search);
  const date = params.get('fecha') ?? '';
  const timestamp = /^\d{4}-\d{2}-\d{2}$/.test(date) ? Date.parse(`${date}T00:00:00Z`) : NaN;
  const validDate = Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === date && date >= '2000-01-01' && date <= '2100-12-31';
  const time = params.get('hora') ?? '';
  return { day: validDate ? dayOffset(date) : 0, time: /^([01]\d|2[0-3]):[0-5]\d$/.test(time) ? time : '13:00', method: params.get('modo') === 'labels' ? 'labels' : 'libraries' };
}

export function foodRegistrationURL(context: FoodRegistrationContext) {
  return `${ADD_FOOD_PATH}?${new URLSearchParams({ fecha: dayISO(context.day), hora: context.time, modo: context.method })}`;
}

const personalIds = new Set(['a1', 'a2', 'c1', 'c2', 'd1', 'd2']);
const foodLibrary = (food: Food) => personalIds.has(food.id) ? 'personal' : 'official';
const libraryLabel = (food: Food) => foodLibrary(food) === 'personal' ? 'Mi biblioteca' : 'Oficial';
const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es');
export function searchExampleFoods(foods: Food[], query: string, library: string) {
  return foods.filter((food) => (library === 'all' || foodLibrary(food) === library) && normalize(food.name).includes(normalize(query.trim())));
}

const LABEL_NUTRIENTS = [['calories', 'Energía', 'kcal'], ['protein', 'Proteínas', 'g'], ['carbs', 'Carbohidratos', 'g'], ['fat', 'Grasas', 'g'], ['fiber', 'Fibra', 'g']] as const;
export type LabelDraft = { name: string; unit: CanonicalUnit; basis: 'per100' | 'portion'; portionName: string; portionSize: string; quantity: string } & Record<typeof LABEL_NUTRIENTS[number][0], string>;
export function foodFromLabel(draft: LabelDraft): Food | null {
  if (!draft.name.trim() || !['g', 'ml'].includes(draft.unit) || !['per100', 'portion'].includes(draft.basis)) return null;
  if (LABEL_NUTRIENTS.some(([key]) => (key !== 'fiber' || draft[key].trim() !== '') && (draft[key].trim() === '' || !Number.isFinite(Number(draft[key])) || Number(draft[key]) < 0))) return null;
  const quantity = Number(draft.quantity);
  const size = Number(draft.portionSize);
  if (!draft.quantity.trim() || !Number.isFinite(quantity) || quantity <= 0 || (draft.basis === 'portion' && (!Number.isFinite(size) || size <= 0))) return null;
  const base = scaleFixtureNutrition({ calories: Number(draft.calories), protein: Number(draft.protein), carbs: Number(draft.carbs), fat: Number(draft.fat), ...(draft.fiber.trim() === '' ? {} : { fiber: Number(draft.fiber) }) }, draft.basis === 'portion' ? 100 / size : 1);
  if (Object.values(base).some((value) => !Number.isFinite(value))) return null;
  const canonical = quantity * (draft.basis === 'portion' ? size : 1);
  if (!Number.isFinite(canonical) || canonical <= 0 || Object.values(base).some((value) => !Number.isFinite(value * (canonical / 100)))) return null;
  const portion = draft.basis === 'portion' ? { name: draft.portionName.trim() || 'porción', portionQuantity: 1, canonicalQuantity: size } : undefined;
  const food = makeFixtureFood('label-draft', draft.name.trim(), '13:00', draft.unit, base, { quantity: draft.quantity, unit: portion ? 'portion' : 'canonical' }, portion);
  return Object.values(base).every((value) => Number.isFinite(value * (food.canonicalQuantity / 100))) ? food : null;
}

function NutritionLabelForm({ onAdd }: { onAdd: (food: Food) => void }) {
  const [draft, setDraft] = useState<LabelDraft>({ name: '', unit: 'g', basis: 'per100', portionName: '', portionSize: '', quantity: '', calories: '', protein: '', carbs: '', fat: '', fiber: '' });
  const preview = foodFromLabel(draft);
  return <form className="blw-label-form" onSubmit={(event) => { event.preventDefault(); if (preview) onAdd(preview); }}>
    <div className="blw-label-intro"><FileText size={24} strokeWidth={1.3} aria-hidden="true" /><div><h3>Desde una etiqueta nutricional</h3><p>Transcribe por 100 g/ml o por porción y elige cuánto consumiste.</p></div></div>
    <button type="button" className="blw-label-example" onClick={() => setDraft({ name: 'Yogur natural', unit: 'g', basis: 'portion', portionName: 'envase', portionSize: '150', quantity: '1', calories: '95', protein: '15', carbs: '6', fat: '1', fiber: '' })}>Usar etiqueta de ejemplo</button>
    <label className="blw-field">Nombre del alimento<input required maxLength={120} value={draft.name} placeholder="Nombre del producto" onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
    <div className="blw-quantity-fields">
      <label className="blw-field">Unidad de la etiqueta<select value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value as CanonicalUnit })}><option value="g">g</option><option value="ml">ml</option></select></label>
      <label className="blw-field">Valores indicados<select value={draft.basis} onChange={(event) => setDraft({ ...draft, basis: event.target.value as LabelDraft['basis'] })}><option value="per100">Por 100 {draft.unit}</option><option value="portion">Por porción</option></select></label>
    </div>
    {draft.basis === 'portion' && <div className="blw-quantity-fields"><label className="blw-field">Nombre de porción<input value={draft.portionName} placeholder="Ej. envase" onChange={(event) => setDraft({ ...draft, portionName: event.target.value })} /></label><label className="blw-field">Tamaño ({draft.unit})<input type="number" required min="0" step="any" value={draft.portionSize} onChange={(event) => setDraft({ ...draft, portionSize: event.target.value })} /></label></div>}
    <label className="blw-field">Cantidad consumida ({draft.basis === 'portion' ? 'porciones' : draft.unit})<input type="number" required min="0" step="any" value={draft.quantity} onChange={(event) => setDraft({ ...draft, quantity: event.target.value })} /></label>
    <fieldset className="blw-label-nutrients"><legend>{draft.basis === 'portion' ? 'Información por porción' : `Información por 100 ${draft.unit}`}</legend>{LABEL_NUTRIENTS.map(([key, label, unit]) => <label className="blw-field" key={key}>{label} ({unit}){key === 'fiber' ? ' · opcional' : ''}<input type="number" inputMode="decimal" required={key !== 'fiber'} min="0" step="any" value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></label>)}</fieldset>
    {preview && <p className="blw-snapshot">Consumo: {formatFoodNumber(preview.calories)} kcal · P {formatFoodNumber(preview.protein)} g · C {formatFoodNumber(preview.carbs)} g · G {formatFoodNumber(preview.fat)} g<br /><small>{formatFoodNumber(preview.canonicalQuantity)} {draft.unit} · Fibra: {preview.fiber === undefined ? 'Sin datos' : `${formatFoodNumber(preview.fiber)} g`}</small></p>}
    <button className="blw-label-register" type="submit" disabled={!preview}>Registrar alimento</button>
  </form>;
}

export function FoodRegistrationView({ foods, context, onContext, onBack, onAdd }: {
  foods: Food[]; context: FoodRegistrationContext; onContext: (context: FoodRegistrationContext) => void;
  onBack: () => void; onAdd: (food: Food) => void;
}) {
  const [query, setQuery] = useState('');
  const [library, setLibrary] = useState('all');
  const [chosen, setChosen] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState<QuantityDraft>({ quantity: '', unit: 'canonical' });
  const selectedFood = chosen ? foodWithQuantity(chosen, quantity) : null;
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
      <Tabs.List className="blw-segments" aria-label="Origen del alimento"><Tabs.Tab value="libraries">Bibliotecas</Tabs.Tab><Tabs.Tab value="labels">Etiquetas</Tabs.Tab></Tabs.List>
      <Tabs.Panel value="libraries" className="blw-add-panel">
        <div className="blw-library-search"><label><Search size={16} aria-hidden="true" /><input type="search" aria-label="Buscar alimento en bibliotecas" value={query} placeholder="Buscar un alimento" onChange={(event) => setQuery(event.target.value)} /></label>
          <label className="blw-library-filter">Biblioteca<select value={library} onChange={(event) => setLibrary(event.target.value)}><option value="all">Todas</option><option value="personal">Mi biblioteca</option><option value="official">Oficial</option></select></label>
        </div>
        <div className="blw-library-results" aria-label="Alimentos de las bibliotecas">{filtered.map((food) => <button className="blw-library-food" key={food.id} aria-pressed={chosen?.id === food.id} onClick={() => { setChosen(chosen?.id === food.id ? null : food); setQuantity(quantityDraftFor(food)); }}>
          <span className="blw-image" aria-hidden="true"><Image size={18} strokeWidth={1.2} /></span><span className="blw-library-food-name"><strong title={food.name}>{food.name}</strong><small title={`${food.portion} · ${libraryLabel(food)}`}>{food.portion} · {libraryLabel(food)}</small></span><span className="blw-library-food-kcal">{formatFoodNumber(food.calories)}<small> kcal</small></span>{chosen?.id === food.id ? <Check size={16} aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
        </button>)}</div>
        {!filtered.length && <div className="blw-measurement-empty blw-library-empty"><p>No encontramos alimentos.</p><span>Prueba otro nombre o biblioteca.</span></div>}
      </Tabs.Panel>
      <Tabs.Panel value="labels" className="blw-add-panel"><NutritionLabelForm onAdd={onAdd} /></Tabs.Panel>
    </Tabs.Root>
    {chosen && context.method === 'libraries' && <footer className="blw-add-confirm"><div><strong>{chosen.name}</strong><FoodQuantityFields food={chosen} draft={quantity} onChange={setQuantity} />{selectedFood && <small>{formatFoodNumber(selectedFood.calories)} kcal · P {formatFoodNumber(selectedFood.protein)} g · C {formatFoodNumber(selectedFood.carbs)} g · G {formatFoodNumber(selectedFood.fat)} g</small>}</div><button disabled={!selectedFood} onClick={() => { if (selectedFood) onAdd(selectedFood); }}>Registrar alimento</button></footer>}

  </>;
}
