import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { Router } from 'wouter';
import { App } from '../src/App';
import { foodFromLabel, searchExampleFoods } from '../src/mockups/BalanceFoodRegistration';
import type { LabelDraft } from '../src/mockups/BalanceFoodRegistration';
import { fiberTotal, foodWithQuantity, groupFoodsByHour, hourGroup, makeFixtureFood, santiagoDate, validWeight } from '../src/mockups/BalanceFoodModel';
import { SummaryView } from '../src/mockups/BalanceMeasurementViews';

const label: LabelDraft = { name: 'Yogur', unit: 'g', basis: 'portion', portionName: 'envase', portionSize: '150', quantity: '2', calories: '95', protein: '15', carbs: '6', fat: '1', fiber: '' };
const yogurt = foodFromLabel(label)!;
assert.equal(yogurt.canonicalQuantity, 300);
assert.equal(yogurt.entry.enteredQuantity, 2);
assert.equal(yogurt.entry.portionSnapshot!.canonicalQuantity, 150);
assert.ok(Math.abs(yogurt.nutritionSnapshot.nutritionPer100.calories - 95 * 100 / 150) < 1e-10);
assert.ok(Math.abs(yogurt.calories - 190) < 1e-10);
assert.equal(yogurt.fiber, undefined);
assert.equal(Object.hasOwn(yogurt.nutritionSnapshot.nutritionPer100, 'fiber'), false);

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
console.log('Balance wireframe contracts: quantity conversion/recalculation, optional fiber, official catalogue, Santiago weight dates, midnight ordering and routed form checks pass.');
