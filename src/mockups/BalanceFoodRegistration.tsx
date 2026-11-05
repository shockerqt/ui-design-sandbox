import { useEffect, useId, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Tabs } from '@base-ui/react/tabs';
import { ArrowLeft, Check, ChevronRight, Image, Search } from 'lucide-react';
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

export function foodRegistrationURL(context: FoodRegistrationContext, basePath = BALANCE_WIREFRAME_PATH) {
  return `${basePath}/agregar-alimento?${new URLSearchParams({ fecha: dayISO(context.day), hora: context.time, modo: context.method })}`;
}

const personalIds = new Set(['a1', 'a2', 'c1', 'c2', 'd1', 'd2']);
export const foodLibrary = (food: Food) => personalIds.has(food.id) ? 'personal' : 'official';
const libraryLabel = (food: Food) => foodLibrary(food) === 'personal' ? 'Mi biblioteca' : 'Oficial';
const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es');
export function searchExampleFoods(foods: Food[], query: string, library: string) {
  return foods.filter((food) => (library === 'all' || foodLibrary(food) === library) && normalize(food.name).includes(normalize(query.trim())));
}

const LABEL_NUTRIENTS = [['calories', 'Energía', 'kcal'], ['protein', 'Proteínas', 'g'], ['carbs', 'Carbohidratos', 'g'], ['fat', 'Grasas', 'g'], ['fiber', 'Fibra', 'g']] as const;
export type LabelDraft = { sodiumMg?: string; cholesterolMg?: string; extendedNutrition?: Record<string, string>; name: string; unit: CanonicalUnit; basis: 'per100' | 'portion'; portionName: string; portionSize: string; quantity: string } & Record<typeof LABEL_NUTRIENTS[number][0], string>;
export function foodFromLabel(draft: LabelDraft): Food | null {
  if (!draft.name.trim() || !['g', 'ml'].includes(draft.unit) || !['per100', 'portion'].includes(draft.basis)) return null;
  if (LABEL_NUTRIENTS.some(([key]) => (key !== 'fiber' || draft[key].trim() !== '') && (draft[key].trim() === '' || !Number.isFinite(Number(draft[key])) || Number(draft[key]) < 0))) return null;
  const extras = Object.fromEntries(Object.entries(draft.extendedNutrition ?? {}).filter(([, value]) => value.trim() !== '').map(([key, value]) => [key, Number(value)]));
  const optional = Object.fromEntries((['sodiumMg', 'cholesterolMg'] as const).filter(key => draft[key]?.trim()).map(key => [key, Number(draft[key])]));
  if ([...Object.values(extras), ...Object.values(optional)].some(value => !Number.isFinite(value) || value < 0)) return null;
  const quantity = Number(draft.quantity);
  const size = Number(draft.portionSize);
  if (!draft.quantity.trim() || !Number.isFinite(quantity) || quantity <= 0 || (draft.basis === 'portion' && (!Number.isFinite(size) || size <= 0))) return null;
  const base = scaleFixtureNutrition({ ...optional, ...(Object.keys(extras).length ? { extendedNutrition: extras } : {}), calories: Number(draft.calories), protein: Number(draft.protein), carbs: Number(draft.carbs), fat: Number(draft.fat), ...(draft.fiber.trim() === '' ? {} : { fiber: Number(draft.fiber) }) }, draft.basis === 'portion' ? 100 / size : 1);
  if (Object.values(base).flatMap(value => typeof value === 'number' ? [value] : Object.values(value)).some((value) => !Number.isFinite(value))) return null;
  const canonical = quantity * (draft.basis === 'portion' ? size : 1);
  if (!Number.isFinite(canonical) || canonical <= 0 || Object.values(base).flatMap(value => typeof value === 'number' ? [value] : Object.values(value)).some((value) => !Number.isFinite(value * (canonical / 100)))) return null;
  const portion = draft.basis === 'portion' ? { name: draft.portionName.trim() || 'porción', portionQuantity: 1, canonicalQuantity: size } : undefined;
  const food = makeFixtureFood('label-draft', draft.name.trim(), '13:00', draft.unit, base, { quantity: draft.quantity, unit: portion ? 'portion' : 'canonical' }, portion);
  return Object.values(base).flatMap(value => typeof value === 'number' ? [value] : Object.values(value)).every((value) => Number.isFinite(value * (food.canonicalQuantity / 100))) ? food : null;
}

function NutritionLabelForm({ id, draft, setDraft, onAdd }: { id: string; draft: LabelDraft; setDraft: (draft: LabelDraft) => void; onAdd: (food: Food) => void }) {
  const preview = foodFromLabel(draft);
  return <form id={id} className="blw-label-form" onSubmit={(event) => { event.preventDefault(); if (preview) onAdd(preview); }}>
    <section className="blw-label-section" aria-label="Datos de la etiqueta">
    <h3>Datos de la etiqueta</h3><p>Copia los valores tal como aparecen en el envase.</p>
    <button type="button" className="blw-label-example" onClick={() => setDraft({ name: 'Yogur natural', unit: 'g', basis: 'portion', portionName: 'envase', portionSize: '150', quantity: '1', calories: '95', protein: '15', carbs: '6', fat: '1', fiber: '' })}>Usar etiqueta de ejemplo</button>
    <label className="blw-field">Nombre del alimento<input required maxLength={120} value={draft.name} placeholder="Nombre del producto" onChange={(event) => setDraft({ ...draft, name: event.target.value })} /></label>
    <div className="blw-quantity-fields">
      <label className="blw-field">Unidad de la etiqueta<select value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value as CanonicalUnit })}><option value="g">g</option><option value="ml">ml</option></select></label>
      <label className="blw-field">Valores indicados<select value={draft.basis} onChange={(event) => setDraft({ ...draft, basis: event.target.value as LabelDraft['basis'] })}><option value="per100">Por 100 {draft.unit}</option><option value="portion">Por porción</option></select></label>
    </div>
    {draft.basis === 'portion' && <div className="blw-quantity-fields"><label className="blw-field">Nombre de porción<input value={draft.portionName} placeholder="Ej. envase" onChange={(event) => setDraft({ ...draft, portionName: event.target.value })} /></label><label className="blw-field">Tamaño ({draft.unit})<input type="number" required min="0" step="any" value={draft.portionSize} onChange={(event) => setDraft({ ...draft, portionSize: event.target.value })} /></label></div>}
    <fieldset className="blw-label-nutrients"><legend>{draft.basis === 'portion' ? 'Información por porción' : `Información por 100 ${draft.unit}`}</legend>{LABEL_NUTRIENTS.map(([key, label, unit]) => <label className="blw-field" key={key}>{label} ({unit}){key === 'fiber' ? ' · opcional' : ''}<input type="number" inputMode="decimal" required={key !== 'fiber'} min="0" step="any" value={draft[key]} onChange={(event) => setDraft({ ...draft, [key]: event.target.value })} /></label>)}</fieldset>
    <details className="blw-optional-nutrients"><summary>Fibra y otros nutrientes</summary><p>Opcionales; deja en blanco los que no conozcas.</p>
    <div className="blw-secondary-grid">{([['sodiumMg', 'Sodio (mg)'], ['cholesterolMg', 'Colesterol (mg)']] as const).map(([key, label]) => <label className="blw-field" key={key}>{label}<input type="number" min="0" step="any" inputMode="decimal" value={draft[key] ?? ''} onChange={e => setDraft({ ...draft, [key]: e.target.value })} /></label>)}</div>
    <label className="blw-field">Añadir otro nutriente<select value="" onChange={e => { if (e.target.value) setDraft({ ...draft, extendedNutrition: { ...draft.extendedNutrition, [e.target.value]: '' } }); }}><option value="">Elegir nutriente</option>{[['calciumMg', 'Calcio (mg)'], ['ironMg', 'Hierro (mg)'], ['potassiumMg', 'Potasio (mg)'], ['vitaminCMg', 'Vitamina C (mg)'], ['vitaminB12Mcg', 'Vitamina B12 (µg)'], ['saturatedFatG', 'Grasas saturadas (g)'], ['sugarsG', 'Azúcares (g)']].map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    {Object.entries(draft.extendedNutrition ?? {}).map(([key, value]) => <label className="blw-field" key={key}>{({ calciumMg: 'Calcio (mg)', ironMg: 'Hierro (mg)', potassiumMg: 'Potasio (mg)', vitaminCMg: 'Vitamina C (mg)', vitaminB12Mcg: 'Vitamina B12 (µg)', saturatedFatG: 'Grasas saturadas (g)', sugarsG: 'Azúcares (g)' } as Record<string, string>)[key]}<input type="number" min="0" step="any" inputMode="decimal" value={value} onChange={e => setDraft({ ...draft, extendedNutrition: { ...draft.extendedNutrition, [key]: e.target.value } })} /></label>)}
    </details></section>
    <section className="blw-label-section blw-label-consumption" aria-label="Tu consumo"><h3>Tu consumo</h3><p>Indica cuánto consumiste de este alimento.</p>
    <label className="blw-field">Cantidad consumida ({draft.basis === 'portion' ? 'porciones' : draft.unit})<input type="number" inputMode="decimal" required min="0" step="any" value={draft.quantity} onChange={(event) => setDraft({ ...draft, quantity: event.target.value })} /></label>
    {draft.basis === 'portion' && Number(draft.portionSize) > 0 && <p className="blw-quantity-equivalence">1 {draft.portionName.trim() || 'porción'} = {formatFoodNumber(Number(draft.portionSize))} {draft.unit}</p>}
    {preview && <p className="blw-snapshot">Consumo: {formatFoodNumber(preview.calories)} kcal · P {formatFoodNumber(preview.protein)} g · C {formatFoodNumber(preview.carbs)} g · G {formatFoodNumber(preview.fat)} g<br /><small>{formatFoodNumber(preview.canonicalQuantity)} {draft.unit} · Fibra: {preview.fiber === undefined ? 'Sin datos' : `${formatFoodNumber(preview.fiber)} g`}</small></p>}
    </section>
  </form>;
}

export function FoodRegistrationView({ themeClass = '', foods, context, onContext, onBack, onAdd }: {
  themeClass?: string; foods: Food[]; context: FoodRegistrationContext; onContext: (context: FoodRegistrationContext) => void;
  onBack: () => void; onAdd: (food: Food) => void;
}) {
  const [discard, setDiscard] = useState(false);
  const [query, setQuery] = useState('');
  const [library, setLibrary] = useState('all');
  const [chosen, setChosen] = useState<Food | null>(null);
  const [quantity, setQuantity] = useState<QuantityDraft>({ quantity: '', unit: 'canonical' });
  const [labelDraft, setLabelDraft] = useState<LabelDraft>({ name: '', unit: 'g', basis: 'per100', portionName: '', portionSize: '', quantity: '', calories: '', protein: '', carbs: '', fat: '', fiber: '' });
  const labelFormId = useId();
  const labelPreview = foodFromLabel(labelDraft);
  const selectedFood = chosen ? foodWithQuantity(chosen, quantity) : null;
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => heading.current?.focus(), []);
  const dirty = !!chosen || !!labelDraft.name || !!labelDraft.quantity;
  const filtered = searchExampleFoods(foods, query, library);
  return <>
    <header className="blw-add-header"><button onClick={() => dirty ? setDiscard(true) : onBack()} aria-label="Volver sin agregar alimento"><ArrowLeft size={20} /></button><h2 ref={heading} tabIndex={-1}>Agregar alimento</h2></header>
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
          <span className="blw-image" aria-hidden="true"><Image size={18} strokeWidth={1.2} /></span><span className="blw-library-food-name"><strong title={food.name}>{food.name}</strong><small title={`${food.portion} · ${libraryLabel(food)}`}>{food.portion} · {libraryLabel(food)}</small></span><span className="blw-library-food-kcal">{formatFoodNumber(food.calories)}<small> kcal</small></span>{chosen?.id === food.id ? <Check size={18} aria-label="Seleccionado" /> : <ChevronRight size={18} aria-hidden="true" />}
        </button>)}</div>
        {!filtered.length && <div className="blw-measurement-empty blw-library-empty"><p>No encontramos alimentos.</p><span>Prueba otro nombre o biblioteca.</span></div>}
      </Tabs.Panel>
      <Tabs.Panel value="labels" className="blw-add-panel"><NutritionLabelForm id={labelFormId} draft={labelDraft} setDraft={setLabelDraft} onAdd={onAdd} /></Tabs.Panel>
    </Tabs.Root>
    {chosen && context.method === 'libraries' && <footer className="blw-add-confirm"><div><strong>{chosen.name}</strong><FoodQuantityFields food={chosen} draft={quantity} onChange={setQuantity} />{selectedFood && <small>{formatFoodNumber(selectedFood.calories)} kcal · P {formatFoodNumber(selectedFood.protein)} g · C {formatFoodNumber(selectedFood.carbs)} g · G {formatFoodNumber(selectedFood.fat)} g</small>}</div><button disabled={!selectedFood} onClick={() => { if (selectedFood) onAdd(selectedFood); }}>Registrar alimento</button></footer>}
    {context.method === 'labels' && <footer className="blw-add-confirm blw-label-confirm"><span>{labelPreview ? `${formatFoodNumber(labelPreview.canonicalQuantity)} ${labelDraft.unit} · ${formatFoodNumber(labelPreview.calories)} kcal` : 'Completa la etiqueta y tu consumo'}</span><button type="submit" form={labelFormId} disabled={!labelPreview}>Registrar alimento</button></footer>}

    <Dialog.Root open={discard} onOpenChange={setDiscard}><Dialog.Portal><Dialog.Backdrop className="blw-dialog-backdrop" /><Dialog.Popup className={`blw-dialog ${themeClass}`}><div className="blw-dialog-heading"><Dialog.Title>¿Descartar el registro?</Dialog.Title><Dialog.Description>Los cambios sin guardar de este alimento se perderán.</Dialog.Description></div><footer className="blw-form-actions"><Dialog.Close>Seguir editando</Dialog.Close><button className="blw-sheet-primary" onClick={() => { setDiscard(false); onBack(); }}>Descartar</button></footer></Dialog.Popup></Dialog.Portal></Dialog.Root>
  </>;
}
