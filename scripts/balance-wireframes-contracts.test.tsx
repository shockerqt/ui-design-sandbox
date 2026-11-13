import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { Router } from 'wouter';
import { App } from '../src/App';
import { foodFromLabel, searchExampleFoods } from '../src/mockups/BalanceFoodRegistration';
import type { LabelDraft } from '../src/mockups/BalanceFoodRegistration';
import { fiberTotal, foodWithQuantity, groupFoodsByHour, hourGroup, makeFixtureFood, santiagoDate, validWeight } from '../src/mockups/BalanceFoodModel';
import { SummaryView } from '../src/mockups/BalanceMeasurementViews';

import { transitionPlusGesture, puckOffset, radialSelection } from '../src/mockups/BalanceDiaryGestures';
import type { PlusGestureState } from '../src/mockups/BalanceDiaryGestures';
import { mockupRegistry } from '../src/mockups/registry';

const start = () => transitionPlusGesture(null, { type: 'start', id: 7, x: 0, y: 0, time: 100 });
const move = (s: PlusGestureState, x: number, y = 0, time = 200) => transitionPlusGesture(s, { type: 'move', x, y, time });
const release = (s: PlusGestureState, x = s.dx, y = s.dy, time = 250, hour?: number | null) => transitionPlusGesture(s, { type: 'release', x, y, time, hour });
const hold = (s: PlusGestureState, elapsed: number) => transitionPlusGesture(s, { type: 'hold', time: s.startedAt + elapsed });
const cancel = (s: PlusGestureState) => transitionPlusGesture(s, { type: 'cancel' });

// Exact tap/hold boundaries; maximum excursion prevents a returning drag becoming a tap.
for (const x of [0, 9.999, 10]) assert.equal(release(move(start(), x), x, 0, 449).outcome, 'tap');
assert.equal(release(move(start(), 10.001)).outcome, 'cancel');
assert.equal(release(start(), 0, 0, 450).outcome, 'cancel');
assert.equal(hold(start(), 349).phase, 'pending');
assert.equal(hold(move(start(), 10), 350).phase, 'radial');
assert.equal(hold(move(start(), 10.001), 350).phase, 'dragging');
assert.equal(hold(move(move(start(), 11), 0), 350).phase, 'dragging');
assert.equal(release(move(move(start(), 50), 0)).outcome, 'cancel');

// Axis lock, 1.3× dominance, center reset, and direction changes only through center.
assert.equal(move(start(), 17.999).axis, null);
assert.equal(move(start(), 18).axis, 'right');
assert.equal(move(start(), 26, 20).axis, 'right');
assert.equal(move(start(), 25.999, 20).axis, null);
assert.equal(move(start(), 20, -26).axis, 'up');
assert.equal(move(start(), 20, -25.999).axis, null);
assert.equal(move(move(start(), 44), -44).armed, null);
assert.equal(move(move(start(), 44), -44).axis, 'right');
assert.equal(move(move(start(), 44), 12.001).axis, 'right');
assert.equal(move(move(start(), 44), 12).axis, null);
assert.equal(move(move(move(start(), 44), 12), -44).armed, 'weight');
assert.equal(move(move(move(start(), 44), 12), 0, -32).phase, 'radial');

for (const sign of [-1, 1]) {
  const action = sign === -1 ? 'weight' : 'food';
  assert.equal(move(start(), sign * 43.999).armed, null);
  const armed = move(start(), sign * 44);
  assert.equal(armed.armed, action);
  assert.equal(move(armed, sign * 28).armed, action);
  assert.equal(move(armed, sign * 27.999).armed, null);
  assert.equal(release(armed).outcome, action);
  assert.equal(release(armed, sign * 27).outcome, 'cancel');
  const progress = [11, 18, 28, 40, 44].map(x => move(start(), sign * x).progress);
  assert.ok(progress.every((v, i) => v >= 0 && v <= 1 && (i === 0 || v >= progress[i - 1])));
  assert.equal(progress.at(-1), 1);
}
assert.equal(move(start(), 0, -31.999).phase, 'dragging');
const radialEntry = move(start(), 0, -32);
assert.equal(radialEntry.phase, 'radial');
assert.equal(radialEntry.hour, null);
assert.equal(hold(start(), 350).hour, null);
assert.equal(move(start(), 0, 40).phase, 'dragging');
assert.equal(move(start(), 0, 40.001).phase, 'cancelled');
assert.equal(release(move(start(), 44), 44, 40.001).outcome, 'cancel');
const selected = transitionPlusGesture(radialEntry, { type: 'move', x: 0, y: -152, time: 500, hour: 12 });
assert.equal(release(selected, 0, -152, 600, 12).outcome, 12);
assert.equal(release(selected, 0, -152, 600, null).outcome, 'cancel');
assert.equal(release(radialEntry).outcome, 'cancel');
for (const state of [start(), move(start(), 44), selected, move(start(), 0, 41)]) {
  assert.equal(cancel(state).outcome, 'cancel');
  assert.deepEqual(cancel(cancel(state)), cancel(state));
  assert.deepEqual(cancel(state).puck, { x: 0, y: 0 });
  assert.equal(release(cancel(state)).outcome, 'cancel');
}
// Nonzero client origins must not alter the thresholds; transitions never mutate input.
const translatedStart = transitionPlusGesture(null, { type: 'start', id: 9, x: 320, y: 700, time: 100 });
const frozenStart = Object.freeze(start());
assert.deepEqual(move(frozenStart, 44), move(start(), 44));
assert.equal(frozenStart.maxDistance, 0);
assert.equal(transitionPlusGesture(translatedStart, { type: 'release', x: 364, y: 700, time: 250 }).outcome, 'food');
const finished = release(move(start(), 44));
assert.deepEqual(release(finished), finished);
assert.deepEqual(finished.puck, { x: 0, y: 0 });
// The machine has no menu/variant input: presentation cannot change an action sequence.
for (const source of ['idle', 'tap-menu']) for (const variant of ['A', 'B']) {
  const origin = { source, variant, state: start() };
  assert.equal(release(move(origin.state, -44)).outcome, 'weight');
  assert.equal(release(move(origin.state, 44)).outcome, 'food');
  assert.equal(hold(origin.state, 350).phase, 'radial');
}
assert.deepEqual(puckOffset(0, 0), { x: 0, y: 0 });
let priorPuck = 0;
for (const distance of [1, 10, 18, 28, 44, 100, 1000, 1e9]) {
  const value = puckOffset(distance, 0).x;
  assert.ok(value >= priorPuck && value <= 24);
  assert.ok(value < distance);
  priorPuck = value;
  for (let deg = 0; deg < 360; deg += 15) {
    const dx = distance * Math.cos(deg * Math.PI / 180), dy = distance * Math.sin(deg * Math.PI / 180);
    const p = puckOffset(dx, dy);
    assert.ok(Math.hypot(p.x, p.y) <= 24 + 1e-12);
    assert.ok(Math.abs(p.x * dy - p.y * dx) < distance * 1e-10);
  }
}

const dialBox = { left: 20, top: 40, width: 288, height: 288 };
const atAngle = (deg: number, r = 112, box = dialBox) => ({
  x: box.left + (144 + r * Math.cos(deg * Math.PI / 180)) * box.width / 288,
  y: box.top + (144 + r * Math.sin(deg * Math.PI / 180)) * box.height / 288 + 24,
});
const pick = (deg: number, previous: number | null = null, radius = 112) => {
  const { x, y } = atAngle(deg, radius);
  return radialSelection(x, y, dialBox, previous);
};
// All clockwise slots, wrap through 360°, and client-coordinate scaling.
for (let i = 0; i < 19; i++) {
  const deg = 126 + 16 * i;
  assert.equal(pick(deg), i + 5);
  for (const scale of [0.5, 1, 1.5]) {
    const box = { left: 135, top: 87, width: 288 * scale, height: 288 * scale };
    const point = atAngle(deg, 112, box);
    assert.equal(radialSelection(point.x, point.y, box), i + 5);
  }
}
// Virtual cursor lands on 06:00 only after the -24px offset (unshifted lands on 05).
const offsetPoint = atAngle(142);
assert.equal(radialSelection(offsetPoint.x, offsetPoint.y, dialBox), 6);
const rawAngle = Math.atan2(offsetPoint.y - dialBox.top - 144, offsetPoint.x - dialBox.left - 144) * 180 / Math.PI;
assert.equal(pick(rawAngle), 5);
for (let hour = 5; hour < 23; hour++) {
  const deg = 126 + (hour - 5) * 16;
  assert.equal(pick(deg + 10.99, hour), hour);
  assert.equal(pick(deg + 11.01, hour), hour + 1);
  assert.equal(pick(deg + 5.01, hour + 1), hour + 1);
  assert.equal(pick(deg + 4.99, hour + 1), hour);
}
// The release uses the same latched selection: a midpoint alone cannot commit a neighbor.
const latchedHour = 12;
const latchedState = { ...radialEntry, hour: latchedHour };
assert.equal(release(latchedState, 0, -152, 600, pick(248.99, latchedHour)).outcome, 12);
assert.equal(release(latchedState, 0, -152, 600, pick(249.01, latchedHour)).outcome, 13);
assert.equal(release(latchedState, 0, -152, 600, pick(90, latchedHour)).outcome, 'cancel');
assert.equal(pick(118.01), 5);
assert.equal(pick(61.99), 23);
for (const previous of [null, 5, 12, 23]) {
  for (const deg of [62.01, 90, 117.99]) assert.equal(pick(deg, previous), null);
  assert.equal(pick(270, previous, 0), null);
  assert.equal(pick(270, previous, 69.99), null);
  assert.equal(pick(270, previous, 144.01), null);
}
assert.equal(pick(270, null, 70.01), 14);
assert.equal(pick(270, null, 143.99), 14);
assert.equal(radialSelection(0, 0, { left: 0, top: 0, width: 0, height: 0 }), null);

const label: LabelDraft = { name: 'Yogur', unit: 'g', basis: 'portion', portionName: 'envase', portionSize: '150', quantity: '2', calories: '95', protein: '15', carbs: '6', fat: '1', fiber: '' };
const yogurt = foodFromLabel(label)!;
assert.equal(yogurt.canonicalQuantity, 300);
assert.equal(yogurt.entry.enteredQuantity, 2);
assert.equal(yogurt.entry.portionSnapshot!.canonicalQuantity, 150);
assert.ok(Math.abs(yogurt.nutritionSnapshot.nutritionPer100.calories - 95 * 100 / 150) < 1e-10);
assert.ok(Math.abs(yogurt.calories - 190) < 1e-10);
assert.equal(yogurt.fiber, undefined);
assert.equal(Object.hasOwn(yogurt.nutritionSnapshot.nutritionPer100, 'fiber'), false);

const enriched = foodFromLabel({ ...label, sodiumMg: '80', cholesterolMg: '', extendedNutrition: { calciumMg: '120' } })!;
assert.equal(enriched.sodiumMg, 160);
assert.equal(enriched.cholesterolMg, undefined);
assert.equal(enriched.extendedNutrition?.calciumMg, 240);
assert.equal(foodFromLabel({ ...label, sodiumMg: '-1' }), null);
assert.equal(foodFromLabel({ ...label, extendedNutrition: { calciumMg: 'Infinity' } }), null);

const half = foodWithQuantity(yogurt, { quantity: '0.5', unit: 'portion' })!;
assert.equal(half.canonicalQuantity, 75);
assert.ok(Math.abs(half.calories - 47.5) < 1e-10);
assert.strictEqual(half.nutritionSnapshot, yogurt.nutritionSnapshot);
assert.equal(yogurt.entry.enteredQuantity, 2);
const grams = foodWithQuantity(yogurt, { quantity: '75', unit: 'canonical' })!;
assert.equal(grams.canonicalQuantity, half.canonicalQuantity);
assert.equal(grams.entry.portionSnapshot, undefined);
assert.equal(grams.calories, half.calories);

const milk = foodFromLabel({ ...label, unit: 'ml', basis: 'per100', quantity: '200', calories: '46', fiber: '0' })!;
assert.equal(milk.nutritionSnapshot.canonicalUnit, 'ml');
assert.equal(milk.canonicalQuantity, 200);
assert.equal(milk.calories, 92);
assert.equal(milk.fiber, 0);
assert.deepEqual(fiberTotal([yogurt]), { value: undefined, partial: false });
assert.deepEqual(fiberTotal([milk]), { value: 0, partial: false });
assert.deepEqual(fiberTotal([milk, yogurt]), { value: 0, partial: true });
for (const value of ['', '-1', 'NaN', 'Infinity']) assert.equal(foodFromLabel({ ...label, calories: value }), null);
for (const quantity of ['', '0', '-1', 'Infinity', '1e308']) assert.equal(foodFromLabel({ ...label, quantity }), null);
assert.equal(foodFromLabel({ ...label, fiber: '-1' }), null);
assert.equal(foodFromLabel({ ...label, portionSize: '0' }), null);
assert.equal(foodWithQuantity(yogurt, { quantity: '0', unit: 'portion' }), null);

assert.equal(hourGroup('23:45'), '23:00');
assert.equal(hourGroup('00:05'), '00:00');
const rows = [{ ...yogurt, id: 'late', time: '23:45' }, { ...milk, id: 'early', time: '00:05' }, { ...milk, id: 'mid', time: '23:10' }];
const groups = groupFoodsByHour(rows);
assert.deepEqual(groups.map(([hour]) => hour), ['00:00', '23:00']);
assert.deepEqual(groups[1][1].map((food) => food.id), ['mid', 'late']);
assert.deepEqual(rows.map((food) => food.id), ['late', 'early', 'mid']);

const beforeSantiagoMidnight = new Date('2026-10-18T01:30:00Z');
assert.equal(santiagoDate(beforeSantiagoMidnight), '2026-10-17');
assert.equal(santiagoDate(new Date('2026-10-18T03:30:00Z')), '2026-10-18');
for (const value of ['1', '72.4', '500']) assert.equal(validWeight(value, '2026-10-17', beforeSantiagoMidnight), true);
for (const value of ['', '0.9', '500.1', '72.45', 'Infinity']) assert.equal(validWeight(value, '2026-10-17', beforeSantiagoMidnight), false);
assert.equal(validWeight('72.4', '2026-10-18', beforeSantiagoMidnight), false);
assert.equal(validWeight('72.4', '2026-02-30', beforeSantiagoMidnight), false);

const official = makeFixtureFood('b1', 'Yogur', '13:00', 'g', { calories: 60, protein: 10, carbs: 4, fat: 1 }, { quantity: '100', unit: 'canonical' });
const personal = { ...official, id: 'd1', name: 'Maní' };
assert.deepEqual(searchExampleFoods([official, personal], 'mani', 'personal').map((food) => food.id), ['d1']);
assert.deepEqual(searchExampleFoods([official, personal], '', 'official').map((food) => food.id), ['b1']);
const route = (path: string) => render(h(Router, { ssrPath: path }, h(App)));
const libraryHTML = route('/m/balance-log-wireframes/agregar-alimento');
assert.match(libraryHTML, /Oficial/);
assert.doesNotMatch(libraryHTML, /Compartida/);
const labelHTML = route('/m/balance-log-wireframes/agregar-alimento?modo=labels');
const fiberInput = labelHTML.match(/Fibra \(g\).*?<input[^>]*>/s)![0];
assert.doesNotMatch(fiberInput, /required/);
assert.match(labelHTML, /Por 100 g/);
assert.ok(labelHTML.indexOf('Datos de la etiqueta') < labelHTML.indexOf('Tu consumo'));
assert.ok(labelHTML.indexOf('Grasas (g)') < labelHTML.indexOf('Cantidad consumida'));
assert.doesNotMatch(labelHTML, /blw-dialog-backdrop|blw-bottom-nav/);

// A measurement of the opposite side must not interrupt a body's own series.
const summary = (body: Parameters<typeof SummaryView>[0]['body'], nutrition: Parameters<typeof SummaryView>[0]['nutrition'] = []) => render(h(SummaryView, {
  body, nutrition, weights: {}, options: { area: nutrition.length ? 'nutrition' : 'body', period: 90, metric: 'Brazos', endDay: 0 },
  onOptions() {}, onOpenFoods() {}, onOpenMeasurements() {},
}));
const arms = summary({ [-12]: { armLeft: 31 }, [-8]: { armRight: 32 }, [0]: { armLeft: 32 } });
assert.equal((arms.match(/class="blw-chart-line"/g) ?? []).length, 1);
// Sparse nutrition dates still show a gap instead of suggesting continuous intake.
const sparseIntake = summary({}, [-2, 0].map((day) => ({ day, calories: 2000, protein: 100, carbs: 200, fat: 60 })));
assert.equal((sparseIntake.match(/class="blw-chart-line"/g) ?? []).length, 0);
assert.doesNotMatch(route('/m/balance-log-wireframes'), /NaN|Infinity/);
assert.match(route('/m/base-ui-color-system/agregar-alimento'), /Esta ruta no corresponde/);
// Visual variants share forms but own their routes; unknown screens remain 404.
assert.match(route('/m/balance-android-material'), /blw-android-dark/);
assert.doesNotMatch(route('/m/balance-log-wireframes'), /class="[^"]*blw-android/);
assert.match(route('/m/balance-android-material/agregar-alimento'), /Oficial/);
assert.match(route('/m/balance-android-material/agregar-alimento?modo=labels'), /Datos de la etiqueta/);
assert.match(route('/m/balance-android-material/unknown'), /Esta ruta no corresponde/);
assert.match(route('/m/balance-material-expressive'), /blw-expressive/);
assert.match(route('/m/balance-material-expressive/agregar-alimento?modo=labels'), /Datos de la etiqueta/);
assert.match(route('/m/balance-material-expressive/unknown'), /Esta ruta no corresponde/);
assert.match(route('/m/balance-style-studies'), /blw-study-organic/);
assert.match(route('/m/balance-style-studies/agregar-alimento?modo=labels'), /Datos de la etiqueta/);
assert.match(route('/m/balance-style-studies/unknown'), /Esta ruta no corresponde/);
const gestureHTML = route('/m/balance-diary-gestures');
assert.match(gestureHTML, /Variante A: Dock morfeado/);
assert.match(gestureHTML, /Variante B: Alas en y₀ \+ puck/);
assert.match(gestureHTML, /<button[^>]*data-active=""[^>]*>Variante A: Dock morfeado<\/button>/);
assert.doesNotMatch(gestureHTML, /<button[^>]*data-active=""[^>]*>Variante B/);
assert.equal((gestureHTML.match(/data-variant="A"/g) ?? []).length, 2);
assert.equal((gestureHTML.match(/class="bcr-tab-add bdg-add"/g) ?? []).length, 2);
assert.doesNotMatch(gestureHTML, /bdg-radial-pill|NaN|Infinity/);
const gestureMetadata = mockupRegistry.find(item => item.id === 'balance-diary-gestures')!;
assert.equal(gestureMetadata.version, 'v1.4.0');
assert.equal(gestureMetadata.updatedAt, '2026-11-13');
console.log('Balance wireframe contracts: existing food/route checks and UDS-025 gesture boundaries, cancellation, puck, radial hysteresis/scaling, SSR and metadata pass.');
