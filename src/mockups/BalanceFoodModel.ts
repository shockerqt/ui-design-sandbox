// Local fixture projection of Balance V2 (0c01f5a); no API or persistence layer.
export type Nutrition = { calories: number; protein: number; carbs: number; fat: number; fiber?: number };
export type CanonicalUnit = 'g' | 'ml';
export type PortionSnapshot = { name: string; portionQuantity: number; canonicalQuantity: number };
export type Food = Nutrition & {
  id: string; name: string; portion: string; time: string;
  nutritionSnapshot: { schemaVersion: 2; canonicalUnit: CanonicalUnit; nutritionPer100: Nutrition };
  canonicalQuantity: number;
  entry: { enteredQuantity: number; portionSnapshot?: PortionSnapshot };
  portionOption?: PortionSnapshot;
};
export type QuantityDraft = { quantity: string; unit: 'canonical' | 'portion' };
export const formatFoodNumber = (value: number) => new Intl.NumberFormat('es-CL', { maximumFractionDigits: 1 }).format(value);
const positive = (value: number) => Number.isFinite(value) && value > 0;

export function scaleFixtureNutrition(base: Nutrition, factor: number): Nutrition {
  return {
    calories: base.calories * factor, protein: base.protein * factor,
    carbs: base.carbs * factor, fat: base.fat * factor,
    ...(base.fiber === undefined ? {} : { fiber: base.fiber * factor }),
  };
}

export const quantityDraftFor = (food: Food): QuantityDraft => ({ quantity: String(food.entry.enteredQuantity), unit: food.entry.portionSnapshot ? 'portion' : 'canonical' });

export function foodWithQuantity(food: Food, draft: QuantityDraft): Food | null {
  const enteredQuantity = Number(draft.quantity);
  if (!draft.quantity.trim() || !positive(enteredQuantity)) return null;
  const portion = draft.unit === 'portion' ? food.portionOption : undefined;
  if (draft.unit === 'portion' && (!portion || !positive(portion.portionQuantity) || !positive(portion.canonicalQuantity))) return null;
  const canonicalQuantity = portion ? enteredQuantity / portion.portionQuantity * portion.canonicalQuantity : enteredQuantity;
  if (!positive(canonicalQuantity)) return null;
  const consumed = scaleFixtureNutrition(food.nutritionSnapshot.nutritionPer100, canonicalQuantity / 100);
  if (Object.values(consumed).some((value) => !Number.isFinite(value) || value < 0)) return null;
  const canonical = `${formatFoodNumber(canonicalQuantity)} ${food.nutritionSnapshot.canonicalUnit}`;
  return {
    ...food, ...consumed,
    canonicalQuantity, entry: { enteredQuantity, ...(portion ? { portionSnapshot: { ...portion } } : {}) },
    portion: portion ? `${formatFoodNumber(enteredQuantity)} × ${portion.name} · ${canonical}` : canonical,
  };
}

export function makeFixtureFood(id: string, name: string, time: string, canonicalUnit: CanonicalUnit, nutritionPer100: Nutrition, draft: QuantityDraft, portionOption?: PortionSnapshot): Food {
  const food: Food = { id, name, time, portion: '', ...nutritionPer100, nutritionSnapshot: { schemaVersion: 2, canonicalUnit, nutritionPer100: { ...nutritionPer100 } }, canonicalQuantity: 1, entry: { enteredQuantity: 1 }, portionOption };
  const result = foodWithQuantity(food, draft);
  if (!result) throw new Error('Invalid example quantity');
  return result;
}

export function hourGroup(time: string) {
  const [hour, minute] = time.split(':').map(Number);
  // Rounding near midnight must not move a same-day record to the day's start.
  return `${String(Math.min(23, hour + (minute > 30 ? 1 : 0))).padStart(2, '0')}:00`;
}

export function groupFoodsByHour(foods: Food[]): [string, Food[]][] {
  const groups = new Map<string, Food[]>();
  for (const food of foods) {
    const hour = hourGroup(food.time);
    groups.set(hour, [...(groups.get(hour) ?? []), food]);
  }
  return [...groups.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([hour, rows]) => [hour, [...rows].sort((a, b) => a.time.localeCompare(b.time))]);
}

export function fiberTotal(foods: Food[]): { value: number | undefined; partial: boolean } {
  const known = foods.filter((food) => food.fiber !== undefined);
  return { value: known.length ? known.reduce((total, food) => total + food.fiber!, 0) : undefined, partial: known.length > 0 && known.length < foods.length };
}

export function santiagoDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  return ['year', 'month', 'day'].map((type) => parts.find((part) => part.type === type)!.value).join('-');
}

export function validWeight(value: string, date: string, now = new Date()) {
  const kg = Number(value);
  const timestamp = /^\d{4}-\d{2}-\d{2}$/.test(date) ? Date.parse(`${date}T00:00:00Z`) : NaN;
  return value.trim() !== '' && Number.isFinite(kg) && kg >= 1 && kg <= 500 && Math.abs(kg * 10 - Math.round(kg * 10)) < 1e-8
    && Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === date && date <= santiagoDate(now);
}
