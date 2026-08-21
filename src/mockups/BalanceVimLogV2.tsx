import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Mode = 'normal' | 'visual' | 'insert' | 'edit-qty' | 'edit-time' | 'search';
type Totals = Pick<FoodRow, 'kcal' | 'protein' | 'carbs' | 'fat'>;
type Operator = 'd' | 'y' | '=';

type FoodRow = {
  id: string;
  time: string;
  name: string;
  quantity: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

type DayLog = { iso: string; rows: FoodRow[] };
type RegisterItem = Omit<FoodRow, 'id'>;
type Register = { rows: RegisterItem[]; source: 'yank' | 'delete' | 'visual-paste' } | null;
type UnitOption = { label: string; grams: number };

type AddIntent =
  | { kind: 'insert'; position: 'before' | 'after' | 'chronological'; time: string }
  | { kind: 'replace'; index: number };

type QtyEditor = {
  index: number;
  value: string;
  unitIndex: number;
  units: UnitOption[];
  original: FoodRow;
};

type TimeEditor = {
  indexes: number[];
  buffer: string;
  originalTimes: string[];
};

type PendingOperator = {
  op: Operator;
  operatorCount: number;
  motionCount: string;
  objectPrefix: 'i' | 'a' | null;
  awaitingG: boolean;
};

type LastChange =
  | { kind: 'move'; direction: -1 | 1; count: number }
  | { kind: 'set-time'; time: string }
  | { kind: 'shift-time'; delta: number }
  | { kind: 'normalize' }
  | { kind: 'quantity'; value: number; unit: string }
  | { kind: 'replace'; foodName: string }
  | null;

const TODAY_ISO = '2026-08-19';
const DAY_MS = 86_400_000;

const KNOWN_ROWS: Record<string, FoodRow[]> = {
  '2026-08-17': [
    { id: 'm1', time: '07:10', name: 'Avena tradicional', quantity: '80 g', kcal: 311, protein: 10, carbs: 53, fat: 6 },
    { id: 'm2', time: '12:30', name: 'Pechuga de pollo', quantity: '180 g', kcal: 298, protein: 55, carbs: 0, fat: 6 },
    { id: 'm3', time: '12:31', name: 'Arroz integral', quantity: '320 g', kcal: 416, protein: 9, carbs: 87, fat: 3 },
  ],
  '2026-08-18': [
    { id: 't1', time: '07:00', name: 'Avena tradicional', quantity: '80 g', kcal: 311, protein: 10, carbs: 53, fat: 6 },
    { id: 't2', time: '07:12', name: 'Whey vainilla', quantity: '30 g', kcal: 118, protein: 24, carbs: 2, fat: 2 },
    { id: 't3', time: '13:05', name: 'Pechuga de pollo', quantity: '180 g', kcal: 298, protein: 55, carbs: 0, fat: 6 },
    { id: 't4', time: '13:06', name: 'Papas cocidas', quantity: '400 g', kcal: 348, protein: 8, carbs: 80, fat: 0 },
  ],
  '2026-08-19': [
    { id: 'w1', time: '07:14', name: 'Tortilla de avena', quantity: '1 porción', kcal: 620, protein: 42, carbs: 72, fat: 18 },
    { id: 'w2', time: '10:32', name: 'Whey vainilla', quantity: '30 g', kcal: 118, protein: 24, carbs: 2, fat: 2 },
    { id: 'w3', time: '13:21', name: 'Pechuga de pollo', quantity: '150 g', kcal: 248, protein: 46, carbs: 0, fat: 5 },
    { id: 'w4', time: '13:22', name: 'Arroz integral', quantity: '300 g', kcal: 390, protein: 8, carbs: 82, fat: 3 },
    { id: 'w5', time: '13:23', name: 'Aceite de oliva', quantity: '10 g', kcal: 90, protein: 0, carbs: 0, fat: 10 },
    { id: 'w6', time: '18:42', name: 'Pan integral casero', quantity: '200 g', kcal: 430, protein: 18, carbs: 74, fat: 7 },
  ],
  '2026-08-20': [
    { id: 'h1', time: '06:40', name: 'Avena tradicional', quantity: '100 g', kcal: 389, protein: 13, carbs: 66, fat: 7 },
    { id: 'h2', time: '06:45', name: 'Whey vainilla', quantity: '40 g', kcal: 157, protein: 32, carbs: 3, fat: 3 },
    { id: 'h3', time: '14:10', name: 'Carne molida 4%', quantity: '180 g', kcal: 310, protein: 42, carbs: 0, fat: 15 },
    { id: 'h4', time: '14:12', name: 'Arroz integral', quantity: '350 g', kcal: 455, protein: 9, carbs: 96, fat: 4 },
    { id: 'h5', time: '20:15', name: 'Palta', quantity: '80 g', kcal: 128, protein: 2, carbs: 7, fat: 12 },
  ],
  '2026-08-21': [
    { id: 'f1', time: '08:00', name: 'Pan integral', quantity: '200 g', kcal: 430, protein: 18, carbs: 74, fat: 7 },
    { id: 'f2', time: '08:02', name: 'Huevos', quantity: '3 u', kcal: 216, protein: 19, carbs: 1, fat: 15 },
    { id: 'f3', time: '15:00', name: 'Pechuga de pollo', quantity: '200 g', kcal: 330, protein: 62, carbs: 0, fat: 7 },
  ],
};

const LIBRARY: Array<Omit<FoodRow, 'id' | 'time'>> = [
  { name: 'Avena tradicional', quantity: '80 g', kcal: 311, protein: 10, carbs: 53, fat: 6 },
  { name: 'Whey vainilla', quantity: '30 g', kcal: 118, protein: 24, carbs: 2, fat: 2 },
  { name: 'Pechuga de pollo', quantity: '150 g', kcal: 248, protein: 46, carbs: 0, fat: 5 },
  { name: 'Arroz integral', quantity: '300 g', kcal: 390, protein: 8, carbs: 82, fat: 3 },
  { name: 'Aceite de oliva', quantity: '10 g', kcal: 90, protein: 0, carbs: 0, fat: 10 },
  { name: 'Pan integral casero', quantity: '200 g', kcal: 430, protein: 18, carbs: 74, fat: 7 },
  { name: 'Papas cocidas', quantity: '400 g', kcal: 348, protein: 8, carbs: 80, fat: 0 },
  { name: 'Palta', quantity: '80 g', kcal: 128, protein: 2, carbs: 7, fat: 12 },
];

const UNIT_MAP: Record<string, UnitOption[]> = {
  'Avena tradicional': [{ label: 'g', grams: 1 }, { label: 'serving', grams: 80 }],
  'Whey vainilla': [{ label: 'g', grams: 1 }, { label: 'scoop', grams: 30 }, { label: 'serving', grams: 30 }],
  'Pechuga de pollo': [{ label: 'g', grams: 1 }, { label: 'serving', grams: 150 }],
  'Arroz integral': [{ label: 'g', grams: 1 }, { label: 'serving', grams: 300 }],
  'Aceite de oliva': [{ label: 'g', grams: 1 }, { label: 'ml', grams: 0.92 }, { label: 'tbsp', grams: 13.8 }, { label: 'serving', grams: 10 }],
  'Pan integral casero': [{ label: 'g', grams: 1 }, { label: 'serving', grams: 200 }],
  'Papas cocidas': [{ label: 'g', grams: 1 }, { label: 'serving', grams: 400 }],
  Palta: [{ label: 'g', grams: 1 }, { label: 'serving', grams: 80 }],
  Huevos: [{ label: 'u', grams: 50 }, { label: 'g', grams: 1 }, { label: 'serving', grams: 150 }],
};

const parseIso = (iso: string) => new Date(`${iso}T12:00:00`);
const toIso = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const addDays = (iso: string, delta: number) => {
  const date = parseIso(iso);
  date.setDate(date.getDate() + delta);
  return toIso(date);
};
const dayDelta = (iso: string) => Math.round((parseIso(iso).getTime() - parseIso(TODAY_ISO).getTime()) / DAY_MS);
const relationFor = (iso: string) => {
  const delta = dayDelta(iso);
  if (delta === 0) return 'today';
  if (delta === -1) return 'yesterday';
  if (delta === 1) return 'tomorrow';
  return delta < 0 ? `${Math.abs(delta)} days ago` : `in ${delta} days`;
};
const labelFor = (iso: string) => parseIso(iso).toLocaleDateString('en-US', { weekday: 'long', day: 'numeric' }).toUpperCase();
const monthLabelFor = (iso: string) => parseIso(iso).toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
const cloneDays = (days: DayLog[]) => days.map((day) => ({ ...day, rows: day.rows.map((row) => ({ ...row })) }));
const buildDays = () => Array.from({ length: 241 }, (_, index) => {
  const iso = addDays(TODAY_ISO, index - 120);
  return { iso, rows: (KNOWN_ROWS[iso] ?? []).map((row) => ({ ...row })) } satisfies DayLog;
});
const sumRows = (rows: FoodRow[]): Totals => rows.reduce((acc, row) => ({
  kcal: acc.kcal + row.kcal,
  protein: acc.protein + row.protein,
  carbs: acc.carbs + row.carbs,
  fat: acc.fat + row.fat,
}), { kcal: 0, protein: 0, carbs: 0, fat: 0 });
const hourOf = (time: string) => `${time.slice(0, 2)}:00`;
const groupByHour = (rows: FoodRow[]) => {
  const groups = new Map<string, Array<{ row: FoodRow; index: number }>>();
  rows.forEach((row, index) => {
    const hour = hourOf(row.time);
    const group = groups.get(hour) ?? [];
    group.push({ row, index });
    groups.set(hour, group);
  });
  return Array.from(groups.entries());
};
const monthGrid = (iso: string) => {
  const selected = parseIso(iso);
  const first = new Date(selected.getFullYear(), selected.getMonth(), 1, 12);
  const mondayOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(1 - mondayOffset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { iso: toIso(date), outside: date.getMonth() !== selected.getMonth() };
  });
};
const snapshotRows = (rows: FoodRow[]) => rows.map(({ id: _id, ...row }) => ({ ...row }));
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const roundMacro = (value: number) => Math.round(value * 10) / 10;
const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};
const minutesToTime = (minutes: number) => {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, '0')}:${String(normalized % 60).padStart(2, '0')}`;
};
const parseAbsoluteTime = (raw: string) => {
  if (!/^\d{1,4}$/.test(raw)) return null;
  let hours = 0;
  let minutes = 0;
  if (raw.length <= 2) hours = Number(raw);
  else {
    hours = Number(raw.slice(0, -2));
    minutes = Number(raw.slice(-2));
  }
  if (hours > 23 || minutes > 59) return null;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};
const parseTimeExpression = (raw: string): { kind: 'absolute'; time: string } | { kind: 'relative'; delta: number } | null => {
  const value = raw.trim().toLowerCase();
  const absolute = parseAbsoluteTime(value);
  if (absolute) return { kind: 'absolute', time: absolute };
  const relative = value.match(/^([+-])(\d+)(h)?$/);
  if (!relative) return null;
  const magnitude = Number(relative[2]) * (relative[3] ? 60 : 1);
  return { kind: 'relative', delta: relative[1] === '-' ? -magnitude : magnitude };
};
const currentClockTime = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};
const parseQuantity = (quantity: string) => {
  const match = quantity.trim().match(/^([0-9]+(?:\.[0-9]+)?)\s*(.*)$/);
  return match ? { value: Number(match[1]), unit: match[2] || 'unit' } : { value: 1, unit: quantity.trim() || 'unit' };
};
const unitOptionsFor = (name: string, currentUnit: string) => {
  const options = UNIT_MAP[name] ?? [];
  if (options.some((unit) => unit.label === currentUnit)) return options;
  return [{ label: currentUnit, grams: 1 }, ...options.filter((unit) => unit.label !== currentUnit)];
};
const gramsFor = (value: number, unit: string, units: UnitOption[]) => value * (units.find((option) => option.label === unit)?.grams ?? 1);
const formatQuantityValue = (value: number) => Number.isInteger(value) ? String(value) : String(Math.round(value * 10) / 10);
const scaleRowQuantity = (original: FoodRow, value: number, unit: string, units: UnitOption[]) => {
  const parsed = parseQuantity(original.quantity);
  const originalGrams = gramsFor(parsed.value, parsed.unit, unitOptionsFor(original.name, parsed.unit));
  const nextGrams = gramsFor(value, unit, units);
  const ratio = originalGrams > 0 ? nextGrams / originalGrams : 1;
  return {
    ...original,
    quantity: `${formatQuantityValue(value)} ${unit}`,
    kcal: Math.round(original.kcal * ratio),
    protein: roundMacro(original.protein * ratio),
    carbs: roundMacro(original.carbs * ratio),
    fat: roundMacro(original.fat * ratio),
  };
};
const fitLibraryFoodToQuantity = (food: (typeof LIBRARY)[number], quantity: string, time: string, id: string) => {
  const requested = parseQuantity(quantity);
  const units = unitOptionsFor(food.name, parseQuantity(food.quantity).unit);
  if (!units.some((unit) => unit.label === requested.unit)) return { ...food, id, time };
  const base = { ...food, id, time } as FoodRow;
  return scaleRowQuantity(base, requested.value, requested.unit, units);
};
const sortByTime = (rows: FoodRow[]) => [...rows].sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

export const BalanceVimLogV2: React.FC = () => {
  const [days, setDays] = useState(buildDays);
  const [dayIndex, setDayIndex] = useState(120);
  const [cursor, setCursor] = useState(2);
  const [mode, setMode] = useState<Mode>('normal');
  const [visualAnchor, setVisualAnchor] = useState<number | null>(null);
  const [register, setRegister] = useState<Register>(null);
  const [history, setHistory] = useState<DayLog[][]>([]);
  const [future, setFuture] = useState<DayLog[][]>([]);
  const [lastChange, setLastChange] = useState<LastChange>(null);
  const [notice, setNotice] = useState('');
  const [displayedIso, setDisplayedIso] = useState(TODAY_ISO);
  const [headerTyping, setHeaderTyping] = useState(false);
  const [bufferRevision, setBufferRevision] = useState(0);
  const [pickerSearch, setPickerSearch] = useState('');
  const [resultIndex, setResultIndex] = useState(0);
  const [addIntent, setAddIntent] = useState<AddIntent | null>(null);
  const [qtyEditor, setQtyEditor] = useState<QtyEditor | null>(null);
  const [timeEditor, setTimeEditor] = useState<TimeEditor | null>(null);
  const [daySearchInput, setDaySearchInput] = useState('');
  const [lastSearch, setLastSearch] = useState('');
  const [countBuffer, setCountBuffer] = useState('');
  const [pendingOperator, setPendingOperator] = useState<PendingOperator | null>(null);
  const [pendingG, setPendingG] = useState(false);
  const [visualObjectPrefix, setVisualObjectPrefix] = useState<'i' | 'a' | null>(null);
  const [syncState, setSyncState] = useState<'synced' | 'syncing'>('synced');

  const terminalRef = useRef<HTMLElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const headerTimerRef = useRef<number | null>(null);
  const headerFrameRef = useRef<number | null>(null);
  const headerGenerationRef = useRef(0);
  const noticeTimerRef = useRef<number | null>(null);
  const syncTimerRef = useRef<number | null>(null);
  const countRef = useRef('');

  const day = days[dayIndex];
  const rows = day.rows;
  const totals = useMemo(() => sumRows(rows), [rows]);
  const groups = useMemo(() => groupByHour(rows), [rows]);
  const calendar = useMemo(() => monthGrid(day.iso), [day.iso]);
  const deltaFromToday = dayDelta(day.iso);
  const hourOrder = useMemo(() => Array.from(new Set(rows.map((row) => hourOf(row.time)))), [rows]);

  const selectedIndexes = useMemo(() => {
    if (!rows.length) return [];
    if (mode !== 'visual' || visualAnchor === null) return [cursor];
    const from = Math.min(visualAnchor, cursor);
    const to = Math.max(visualAnchor, cursor);
    return Array.from({ length: to - from + 1 }, (_, index) => from + index);
  }, [cursor, mode, rows.length, visualAnchor]);
  const selectedSet = useMemo(() => new Set(selectedIndexes), [selectedIndexes]);
  const filteredLibrary = useMemo(() => {
    const query = pickerSearch.trim().toLowerCase();
    return LIBRARY.filter((food) => food.name.toLowerCase().includes(query)).slice(0, 6);
  }, [pickerSearch]);

  const setCount = useCallback((value: string) => {
    countRef.current = value;
    setCountBuffer(value);
  }, []);
  const takeCount = useCallback(() => {
    const raw = countRef.current;
    setCount('');
    return raw;
  }, [setCount]);
  const consumeCount = useCallback(() => Number.parseInt(takeCount(), 10) || 1, [takeCount]);

  const restoreTerminalFocus = useCallback(() => {
    window.requestAnimationFrame(() => terminalRef.current?.focus({ preventScroll: true }));
  }, []);
  const flash = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(''), 1500);
  }, []);
  const markSyncing = useCallback(() => {
    setSyncState('syncing');
    if (syncTimerRef.current !== null) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(() => setSyncState('synced'), 420);
  }, []);
  const checkpoint = useCallback(() => {
    setHistory((current) => [...current.slice(-39), cloneDays(days)]);
    setFuture([]);
  }, [days]);
  const resetCommandState = useCallback(() => {
    setCount('');
    setPendingOperator(null);
    setPendingG(false);
    setVisualObjectPrefix(null);
  }, [setCount]);

  const animateHeader = useCallback((target: string) => {
    headerGenerationRef.current += 1;
    const generation = headerGenerationRef.current;
    if (headerTimerRef.current !== null) window.clearTimeout(headerTimerRef.current);
    if (headerFrameRef.current !== null) window.cancelAnimationFrame(headerFrameRef.current);
    setHeaderTyping(true);
    headerTimerRef.current = window.setTimeout(() => {
      const duration = 430;
      const startedAt = performance.now();
      const tick = (now: number) => {
        if (generation !== headerGenerationRef.current) return;
        const progress = Math.min(1, (now - startedAt) / duration);
        setDisplayedIso(target.slice(0, Math.floor(progress * target.length)));
        if (progress < 1) {
          headerFrameRef.current = window.requestAnimationFrame(tick);
          return;
        }
        setDisplayedIso(target);
        headerTimerRef.current = window.setTimeout(() => {
          if (generation === headerGenerationRef.current) setHeaderTyping(false);
        }, 180);
      };
      headerFrameRef.current = window.requestAnimationFrame(tick);
    }, 90);
  }, []);

  const exitToNormal = useCallback(() => {
    setMode('normal');
    setVisualAnchor(null);
    setQtyEditor(null);
    setTimeEditor(null);
    setAddIntent(null);
    resetCommandState();
    restoreTerminalFocus();
  }, [resetCommandState, restoreTerminalFocus]);

  const commitRows = useCallback((nextRows: FoodRow[], nextCursor: number, message: string, change: LastChange = null, keepVisual = false, nextAnchor: number | null = null) => {
    checkpoint();
    setDays((current) => current.map((item, index) => index === dayIndex ? { ...item, rows: nextRows } : item));
    setCursor(clamp(nextCursor, 0, Math.max(0, nextRows.length - 1)));
    if (keepVisual) {
      setMode('visual');
      setVisualAnchor(nextAnchor);
    } else {
      setMode('normal');
      setVisualAnchor(null);
    }
    resetCommandState();
    if (change) setLastChange(change);
    markSyncing();
    flash(message);
    restoreTerminalFocus();
  }, [checkpoint, dayIndex, flash, markSyncing, resetCommandState, restoreTerminalFocus]);

  const goToIndex = useCallback((next: number) => {
    const bounded = clamp(next, 0, days.length - 1);
    if (bounded === dayIndex) return;
    setDayIndex(bounded);
    setCursor((current) => Math.min(current, Math.max(0, days[bounded].rows.length - 1)));
    setMode('normal');
    setVisualAnchor(null);
    resetCommandState();
    setBufferRevision((revision) => revision + 1);
    animateHeader(days[bounded].iso);
  }, [animateHeader, dayIndex, days, resetCommandState]);
  const changeDay = useCallback((delta: number) => goToIndex(dayIndex + delta), [dayIndex, goToIndex]);
  const goToday = useCallback(() => {
    const index = days.findIndex((item) => item.iso === TODAY_ISO);
    if (index >= 0) goToIndex(index);
  }, [days, goToIndex]);
  const moveCursor = useCallback((delta: number) => {
    if (!rows.length) return;
    setCursor((current) => clamp(current + delta, 0, rows.length - 1));
  }, [rows.length]);

  const blockTarget = useCallback((direction: -1 | 1, count: number) => {
    if (!rows[cursor]) return cursor;
    const currentHour = hourOf(rows[cursor].time);
    const hourIndex = Math.max(0, hourOrder.indexOf(currentHour));
    const targetHour = hourOrder[clamp(hourIndex + direction * count, 0, Math.max(0, hourOrder.length - 1))];
    const index = rows.findIndex((row) => hourOf(row.time) === targetHour);
    return index >= 0 ? index : cursor;
  }, [cursor, hourOrder, rows]);
  const moveBlock = useCallback((direction: -1 | 1, count: number) => {
    const target = blockTarget(direction, count);
    setCursor(target);
  }, [blockTarget]);

  const hourIndexes = useCallback((count = 1) => {
    if (!rows[cursor]) return [] as number[];
    const currentHour = hourOf(rows[cursor].time);
    const start = Math.max(0, hourOrder.indexOf(currentHour));
    const hours = new Set(hourOrder.slice(start, start + Math.max(1, count)));
    return rows.flatMap((row, index) => hours.has(hourOf(row.time)) ? [index] : []);
  }, [cursor, hourOrder, rows]);
  const selectHour = useCallback(() => {
    const indexes = hourIndexes(1);
    if (!indexes.length) return;
    setMode('visual');
    setVisualAnchor(indexes[0]);
    setCursor(indexes[indexes.length - 1]);
    setVisualObjectPrefix(null);
  }, [hourIndexes]);

  const yankIndexes = useCallback((indexes: number[]) => {
    if (!indexes.length) return;
    setRegister({ rows: snapshotRows(indexes.map((index) => rows[index])), source: 'yank' });
    setMode('normal');
    setVisualAnchor(null);
    resetCommandState();
    flash(`${indexes.length} yanked`);
    restoreTerminalFocus();
  }, [flash, resetCommandState, restoreTerminalFocus, rows]);

  const deleteIndexes = useCallback((indexes: number[], label = 'deleted') => {
    const valid = indexes.filter((index) => index >= 0 && index < rows.length);
    if (!valid.length) return;
    const set = new Set(valid);
    const removed = valid.map((index) => rows[index]);
    const nextRows = rows.filter((_, index) => !set.has(index));
    setRegister({ rows: snapshotRows(removed), source: 'delete' });
    commitRows(nextRows, Math.min(valid[0], Math.max(0, nextRows.length - 1)), `${removed.length} ${label}`);
  }, [commitRows, rows]);

  const rangeBetween = useCallback((target: number) => {
    const from = Math.min(cursor, target);
    const to = Math.max(cursor, target);
    return Array.from({ length: to - from + 1 }, (_, index) => from + index);
  }, [cursor]);

  const normalizeIndexes = useCallback((indexes: number[], record = true) => {
    if (!indexes.length || !rows[cursor]) return;
    const anchorTime = rows[cursor].time;
    const ids = new Set(indexes.map((index) => rows[index]?.id).filter(Boolean));
    const cursorId = rows[cursor].id;
    const nextRows = sortByTime(rows.map((row) => ids.has(row.id) ? { ...row, time: anchorTime } : row));
    const nextCursor = Math.max(0, nextRows.findIndex((row) => row.id === cursorId));
    commitRows(nextRows, nextCursor, `${indexes.length} timestamps → ${anchorTime}`, record ? { kind: 'normalize' } : null);
  }, [commitRows, cursor, rows]);

  const applyOperatorIndexes = useCallback((op: Operator, indexes: number[]) => {
    if (op === 'y') yankIndexes(indexes);
    else if (op === 'd') deleteIndexes(indexes);
    else normalizeIndexes(indexes);
  }, [deleteIndexes, normalizeIndexes, yankIndexes]);

  const startOperator = useCallback((op: Operator) => {
    setPendingOperator({ op, operatorCount: consumeCount(), motionCount: '', objectPrefix: null, awaitingG: false });
  }, [consumeCount]);

  const paste = useCallback((before: boolean, count: number) => {
    if (!register?.rows.length) {
      flash('register empty');
      return;
    }
    const copies = Array.from({ length: Math.max(1, count) }, () => register.rows.map((row) => ({ ...row, id: crypto.randomUUID() } as FoodRow))).flat();
    if (mode === 'visual' && selectedIndexes.length) {
      const displaced = selectedIndexes.map((index) => rows[index]);
      const from = selectedIndexes[0];
      const selected = new Set(selectedIndexes);
      const nextRows = rows.filter((_, index) => !selected.has(index));
      nextRows.splice(from, 0, ...copies);
      setRegister({ rows: snapshotRows(displaced), source: 'visual-paste' });
      commitRows(nextRows, Math.min(from, Math.max(0, nextRows.length - 1)), `replaced ${displaced.length} with ${copies.length}`);
      return;
    }
    const position = rows.length ? clamp(cursor + (before ? 0 : 1), 0, rows.length) : 0;
    const nextRows = [...rows];
    nextRows.splice(position, 0, ...copies);
    commitRows(nextRows, position, `${copies.length} pasted`);
  }, [commitRows, cursor, flash, mode, register, rows, selectedIndexes]);

  const moveSelection = useCallback((direction: -1 | 1, count: number, record = true) => {
    if (!rows.length) return;
    const indexes = mode === 'visual' ? selectedIndexes : [cursor];
    if (!indexes.length) return;
    const start = indexes[0];
    const block = rows.slice(start, indexes[indexes.length - 1] + 1);
    const nextRows = [...rows];
    nextRows.splice(start, block.length);
    const nextStart = clamp(start + direction * Math.max(1, count), 0, nextRows.length);
    nextRows.splice(nextStart, 0, ...block);
    if (mode === 'visual' && visualAnchor !== null) {
      const anchorOffset = visualAnchor - start;
      const cursorOffset = cursor - start;
      commitRows(nextRows, nextStart + cursorOffset, `moved ${block.length} ${direction > 0 ? 'down' : 'up'}`, record ? { kind: 'move', direction, count } : null, true, nextStart + anchorOffset);
    } else {
      commitRows(nextRows, nextStart, `moved ${block.length} ${direction > 0 ? 'down' : 'up'}`, record ? { kind: 'move', direction, count } : null);
    }
  }, [commitRows, cursor, mode, rows, selectedIndexes, visualAnchor]);

  const undo = useCallback((count = 1) => {
    if (!history.length) {
      flash('nothing to undo');
      return;
    }
    let current = cloneDays(days);
    const past = [...history];
    const nextFuture = [...future];
    let applied = 0;
    while (applied < count && past.length) {
      const previous = past.pop();
      if (!previous) break;
      nextFuture.push(current);
      current = cloneDays(previous);
      applied += 1;
    }
    setDays(current);
    setHistory(past);
    setFuture(nextFuture);
    setMode('normal');
    setVisualAnchor(null);
    resetCommandState();
    setCursor((currentCursor) => Math.min(currentCursor, Math.max(0, current[dayIndex].rows.length - 1)));
    markSyncing();
    flash(`${applied} undo${applied === 1 ? '' : 's'}`);
    restoreTerminalFocus();
  }, [dayIndex, days, flash, future, history, markSyncing, resetCommandState, restoreTerminalFocus]);

  const redo = useCallback((count = 1) => {
    if (!future.length) {
      flash('nothing to redo');
      return;
    }
    let current = cloneDays(days);
    const past = [...history];
    const nextFuture = [...future];
    let applied = 0;
    while (applied < count && nextFuture.length) {
      const next = nextFuture.pop();
      if (!next) break;
      past.push(current);
      current = cloneDays(next);
      applied += 1;
    }
    setDays(current);
    setHistory(past);
    setFuture(nextFuture);
    setMode('normal');
    setVisualAnchor(null);
    resetCommandState();
    setCursor((currentCursor) => Math.min(currentCursor, Math.max(0, current[dayIndex].rows.length - 1)));
    markSyncing();
    flash(`${applied} redo${applied === 1 ? '' : 's'}`);
    restoreTerminalFocus();
  }, [dayIndex, days, flash, future, history, markSyncing, resetCommandState, restoreTerminalFocus]);

  const openPicker = useCallback((intent: AddIntent) => {
    resetCommandState();
    setAddIntent(intent);
    setMode('insert');
    setPickerSearch('');
    setResultIndex(0);
    window.setTimeout(() => pickerRef.current?.focus(), 0);
  }, [resetCommandState]);
  const closePicker = useCallback(() => {
    setPickerSearch('');
    setResultIndex(0);
    setAddIntent(null);
    exitToNormal();
  }, [exitToNormal]);

  const chooseFood = useCallback((food: (typeof LIBRARY)[number], record = true) => {
    if (!addIntent) return;
    if (addIntent.kind === 'replace') {
      const original = rows[addIntent.index];
      if (!original) return;
      const replacement = fitLibraryFoodToQuantity(food, original.quantity, original.time, original.id);
      const nextRows = [...rows];
      nextRows[addIntent.index] = replacement;
      commitRows(nextRows, addIntent.index, `${original.name} → ${food.name}`, record ? { kind: 'replace', foodName: food.name } : null);
      setAddIntent(null);
      setPickerSearch('');
      return;
    }
    const next: FoodRow = { ...food, id: crypto.randomUUID(), time: addIntent.time };
    let nextRows = [...rows];
    let position = 0;
    if (addIntent.position === 'chronological') {
      nextRows.push(next);
      nextRows = sortByTime(nextRows);
      position = nextRows.findIndex((row) => row.id === next.id);
    } else {
      position = rows.length ? clamp(cursor + (addIntent.position === 'before' ? 0 : 1), 0, rows.length) : 0;
      nextRows.splice(position, 0, next);
    }
    commitRows(nextRows, position, `${food.name} added`);
    setAddIntent(null);
    setPickerSearch('');
  }, [addIntent, commitRows, cursor, rows]);

  const openQtyEditor = useCallback((index = cursor) => {
    const row = rows[index];
    if (!row) return;
    const parsed = parseQuantity(row.quantity);
    const units = unitOptionsFor(row.name, parsed.unit);
    setQtyEditor({ index, value: String(parsed.value), unitIndex: Math.max(0, units.findIndex((unit) => unit.label === parsed.unit)), units, original: { ...row } });
    setMode('edit-qty');
    resetCommandState();
    window.setTimeout(() => qtyRef.current?.focus(), 0);
  }, [cursor, resetCommandState, rows]);
  const cycleQtyUnit = useCallback((direction: -1 | 1) => {
    setQtyEditor((editor) => {
      if (!editor || !editor.units.length) return editor;
      const currentUnit = editor.units[editor.unitIndex];
      const currentValue = Number(editor.value) || 0;
      const grams = currentValue * currentUnit.grams;
      const unitIndex = (editor.unitIndex + direction + editor.units.length) % editor.units.length;
      const nextUnit = editor.units[unitIndex];
      return { ...editor, unitIndex, value: formatQuantityValue(grams / nextUnit.grams) };
    });
    window.setTimeout(() => qtyRef.current?.focus(), 0);
  }, []);
  const commitQty = useCallback((record = true) => {
    if (!qtyEditor) return;
    const value = Number(qtyEditor.value);
    if (!Number.isFinite(value) || value <= 0) {
      flash('invalid quantity');
      return;
    }
    const unit = qtyEditor.units[qtyEditor.unitIndex]?.label ?? parseQuantity(qtyEditor.original.quantity).unit;
    const next = scaleRowQuantity(qtyEditor.original, value, unit, qtyEditor.units);
    const nextRows = [...rows];
    nextRows[qtyEditor.index] = next;
    commitRows(nextRows, qtyEditor.index, `${next.name} → ${next.quantity}`, record ? { kind: 'quantity', value, unit } : null);
    setQtyEditor(null);
  }, [commitRows, flash, qtyEditor, rows]);

  const openTimeEditor = useCallback((indexes = selectedIndexes) => {
    const valid = indexes.filter((index) => rows[index]);
    if (!valid.length) return;
    setTimeEditor({ indexes: valid, buffer: '', originalTimes: valid.map((index) => rows[index].time) });
    setMode('edit-time');
    resetCommandState();
    window.setTimeout(() => timeRef.current?.focus(), 0);
  }, [resetCommandState, rows, selectedIndexes]);
  const applyTimeExpression = useCallback((indexes: number[], expression: { kind: 'absolute'; time: string } | { kind: 'relative'; delta: number }, record = true) => {
    const targetIds = new Set(indexes.map((index) => rows[index]?.id).filter(Boolean));
    if (!targetIds.size) return;
    const cursorId = rows[cursor]?.id;
    const nextRows = sortByTime(rows.map((row) => {
      if (!targetIds.has(row.id)) return row;
      if (expression.kind === 'absolute') return { ...row, time: expression.time };
      return { ...row, time: minutesToTime(timeToMinutes(row.time) + expression.delta) };
    }));
    const nextCursor = cursorId ? Math.max(0, nextRows.findIndex((row) => row.id === cursorId)) : 0;
    const message = expression.kind === 'absolute'
      ? `${targetIds.size} timestamp${targetIds.size === 1 ? '' : 's'} → ${expression.time}`
      : `${targetIds.size} timestamp${targetIds.size === 1 ? '' : 's'} ${expression.delta >= 0 ? '+' : ''}${expression.delta}m`;
    commitRows(nextRows, nextCursor, message, record ? (expression.kind === 'absolute' ? { kind: 'set-time', time: expression.time } : { kind: 'shift-time', delta: expression.delta }) : null);
  }, [commitRows, cursor, rows]);
  const commitTime = useCallback((record = true) => {
    if (!timeEditor) return;
    const expression = parseTimeExpression(timeEditor.buffer);
    if (!expression) {
      flash(`${timeEditor.buffer || 'empty'} · invalid time`);
      return;
    }
    applyTimeExpression(timeEditor.indexes, expression, record);
    setTimeEditor(null);
  }, [applyTimeExpression, flash, timeEditor]);

  const openDaySearch = useCallback(() => {
    setMode('search');
    setDaySearchInput(lastSearch);
    resetCommandState();
    window.setTimeout(() => searchRef.current?.focus(), 0);
  }, [lastSearch, resetCommandState]);
  const findMatch = useCallback((query: string, direction: -1 | 1, includeCurrent = false) => {
    const needle = query.trim().toLowerCase();
    if (!needle || !rows.length) return -1;
    for (let step = includeCurrent ? 0 : 1; step <= rows.length; step += 1) {
      const index = (cursor + direction * step + rows.length * 2) % rows.length;
      if (rows[index].name.toLowerCase().includes(needle)) return index;
    }
    return -1;
  }, [cursor, rows]);
  const commitSearch = useCallback(() => {
    const query = daySearchInput.trim();
    if (!query) {
      exitToNormal();
      return;
    }
    setLastSearch(query);
    const match = findMatch(query, 1, true);
    setMode('normal');
    if (match >= 0) {
      setCursor(match);
      flash(`/${query}`);
    } else flash(`/${query} · no match`);
    restoreTerminalFocus();
  }, [daySearchInput, exitToNormal, findMatch, flash, restoreTerminalFocus]);
  const nextSearchMatch = useCallback((direction: -1 | 1) => {
    if (!lastSearch) {
      flash('no search');
      return;
    }
    const match = findMatch(lastSearch, direction);
    if (match >= 0) setCursor(match);
    else flash(`/${lastSearch} · no match`);
  }, [findMatch, flash, lastSearch]);

  const repeatLast = useCallback(() => {
    if (!lastChange) {
      flash('nothing to repeat');
      return;
    }
    if (lastChange.kind === 'move') {
      moveSelection(lastChange.direction, lastChange.count, false);
      return;
    }
    if (lastChange.kind === 'normalize') {
      normalizeIndexes(mode === 'visual' ? selectedIndexes : hourIndexes(1), false);
      return;
    }
    if (lastChange.kind === 'set-time' || lastChange.kind === 'shift-time') {
      const indexes = mode === 'visual' ? selectedIndexes : [cursor];
      applyTimeExpression(indexes, lastChange.kind === 'set-time'
        ? { kind: 'absolute', time: lastChange.time }
        : { kind: 'relative', delta: lastChange.delta }, false);
      return;
    }
    if (lastChange.kind === 'quantity') {
      const row = rows[cursor];
      if (!row) return;
      const parsed = parseQuantity(row.quantity);
      const units = unitOptionsFor(row.name, parsed.unit);
      const unitIndex = units.findIndex((unit) => unit.label === lastChange.unit);
      if (unitIndex < 0) {
        flash(`${lastChange.unit} unavailable`);
        return;
      }
      const next = scaleRowQuantity(row, lastChange.value, lastChange.unit, units);
      const nextRows = [...rows];
      nextRows[cursor] = next;
      commitRows(nextRows, cursor, `repeat · ${next.quantity}`);
      return;
    }
    if (lastChange.kind === 'replace') {
      const food = LIBRARY.find((item) => item.name === lastChange.foodName);
      const original = rows[cursor];
      if (!food || !original) return;
      const nextRows = [...rows];
      nextRows[cursor] = fitLibraryFoodToQuantity(food, original.quantity, original.time, original.id);
      commitRows(nextRows, cursor, `repeat · ${food.name}`);
    }
  }, [applyTimeExpression, commitRows, cursor, flash, hourIndexes, lastChange, mode, moveSelection, normalizeIndexes, rows, selectedIndexes]);

  const handlePendingOperator = useCallback((event: KeyboardEvent) => {
    const pending = pendingOperator;
    if (!pending) return false;
    const key = event.key;
    event.preventDefault();
    if (key === 'Escape') {
      setPendingOperator(null);
      return true;
    }
    if (/^\d$/.test(key)) {
      setPendingOperator({ ...pending, motionCount: `${pending.motionCount}${key}`.slice(0, 3) });
      return true;
    }
    if (pending.awaitingG) {
      if (key === 'g') applyOperatorIndexes(pending.op, rangeBetween(0));
      else setPendingOperator(null);
      return true;
    }
    if ((key === 'i' || key === 'a') && !pending.objectPrefix) {
      setPendingOperator({ ...pending, objectPrefix: key });
      return true;
    }
    const motionCount = Number.parseInt(pending.motionCount, 10) || 1;
    const combined = Math.max(1, pending.operatorCount * motionCount);
    if (pending.objectPrefix && (key === 'w' || key === 'b')) {
      applyOperatorIndexes(pending.op, hourIndexes(combined));
      return true;
    }
    if (key === pending.op && (pending.op === 'd' || pending.op === 'y')) {
      const indexes = Array.from({ length: combined }, (_, offset) => cursor + offset).filter((index) => index < rows.length);
      applyOperatorIndexes(pending.op, indexes);
      return true;
    }
    if (key === 'j' || key === 'k') {
      const target = clamp(cursor + (key === 'j' ? 1 : -1) * combined, 0, Math.max(0, rows.length - 1));
      applyOperatorIndexes(pending.op, rangeBetween(target));
      return true;
    }
    if (key === 'G') {
      applyOperatorIndexes(pending.op, rangeBetween(Math.max(0, rows.length - 1)));
      return true;
    }
    if (key === 'g') {
      setPendingOperator({ ...pending, awaitingG: true });
      return true;
    }
    if (key === '[' || key === ']') {
      applyOperatorIndexes(pending.op, rangeBetween(blockTarget(key === ']' ? 1 : -1, combined)));
      return true;
    }
    setPendingOperator(null);
    return true;
  }, [applyOperatorIndexes, blockTarget, cursor, hourIndexes, pendingOperator, rangeBetween, rows.length]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && !event.shiftKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'r') {
        event.preventDefault();
        if (mode === 'normal' || mode === 'visual') redo(1);
        else flash('redo unavailable while editing');
        return;
      }

      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (typing || mode === 'insert' || mode === 'edit-qty' || mode === 'edit-time' || mode === 'search' || event.metaKey || event.ctrlKey || event.altKey) return;
      if (handlePendingOperator(event)) return;

      if (pendingG) {
        event.preventDefault();
        setPendingG(false);
        if (event.key === 'g') setCursor(0);
        else if (event.key === 't') goToday();
        return;
      }

      if (/^[1-9]$/.test(event.key) || (/^[0-9]$/.test(event.key) && countRef.current.length > 0)) {
        event.preventDefault();
        setCount(`${countRef.current}${event.key}`.slice(0, 4));
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        exitToNormal();
        return;
      }
      if (event.key === ' ') {
        event.preventDefault();
        if (mode === 'visual') exitToNormal();
        else {
          setMode('visual');
          setVisualAnchor(cursor);
        }
        return;
      }
      if (event.key === 'v') {
        event.preventDefault();
        if (mode === 'visual') exitToNormal();
        else {
          setMode('visual');
          setVisualAnchor(cursor);
        }
        return;
      }
      if (mode === 'visual' && (event.key === 'i' || event.key === 'a')) {
        event.preventDefault();
        setVisualObjectPrefix(event.key);
        return;
      }
      if (mode === 'visual' && visualObjectPrefix && (event.key === 'w' || event.key === 'b')) {
        event.preventDefault();
        selectHour();
        return;
      }
      if (event.key === 'V') {
        event.preventDefault();
        selectHour();
        return;
      }

      if (event.key === 'h' || event.key === 'l' || event.key === 'H' || event.key === 'L') {
        event.preventDefault();
        const count = consumeCount();
        const direction = event.key === 'h' || event.key === 'H' ? -1 : 1;
        const unit = event.key === 'H' || event.key === 'L' ? 7 : 1;
        changeDay(direction * unit * count);
        return;
      }
      if (event.key === 'j' || event.key === 'k') {
        event.preventDefault();
        moveCursor((event.key === 'j' ? 1 : -1) * consumeCount());
        return;
      }
      if (event.key === '[' || event.key === ']') {
        event.preventDefault();
        moveBlock(event.key === ']' ? 1 : -1, consumeCount());
        return;
      }
      if (event.key === 'g') {
        event.preventDefault();
        setCount('');
        setPendingG(true);
        return;
      }
      if (event.key === 'G') {
        event.preventDefault();
        const raw = takeCount();
        setCursor(raw ? clamp(Number(raw) - 1, 0, Math.max(0, rows.length - 1)) : Math.max(0, rows.length - 1));
        return;
      }

      if (mode === 'visual') {
        if (event.key === 'd' || event.key === 'x') {
          event.preventDefault();
          deleteIndexes(selectedIndexes);
          return;
        }
        if (event.key === 'y') {
          event.preventDefault();
          yankIndexes(selectedIndexes);
          return;
        }
        if (event.key === 'p' || event.key === 'P') {
          event.preventDefault();
          paste(event.key === 'P', consumeCount());
          return;
        }
        if (event.key === '=') {
          event.preventDefault();
          normalizeIndexes(selectedIndexes);
          return;
        }
      }

      if (event.key === 'd' || event.key === 'y' || event.key === '=') {
        event.preventDefault();
        startOperator(event.key as Operator);
        return;
      }
      if (event.key === 'x') {
        event.preventDefault();
        const count = consumeCount();
        deleteIndexes(Array.from({ length: count }, (_, offset) => cursor + offset), 'deleted');
        return;
      }
      if (event.key === 'D') {
        event.preventDefault();
        const currentHour = rows[cursor] ? hourOf(rows[cursor].time) : '';
        const last = rows.reduce((result, row, index) => hourOf(row.time) === currentHour ? index : result, cursor);
        deleteIndexes(rangeBetween(last), 'deleted to block end');
        return;
      }
      if (event.key === 'p' || event.key === 'P') {
        event.preventDefault();
        paste(event.key === 'P', consumeCount());
        return;
      }
      if (event.key === '>' || event.key === '<') {
        event.preventDefault();
        moveSelection(event.key === '>' ? 1 : -1, consumeCount());
        return;
      }
      if (event.key === 'u' || event.key === 'U') {
        event.preventDefault();
        const count = consumeCount();
        if (event.key === 'u') undo(count);
        else redo(count);
        return;
      }
      if (event.key === '.') {
        event.preventDefault();
        setCount('');
        repeatLast();
        return;
      }
      if (event.key === '/') {
        event.preventDefault();
        openDaySearch();
        return;
      }
      if (event.key === 'n' || event.key === 'N') {
        event.preventDefault();
        nextSearchMatch(event.key === 'n' ? 1 : -1);
        return;
      }
      if (event.key === 'r') {
        event.preventDefault();
        openPicker({ kind: 'replace', index: cursor });
        return;
      }
      if (event.key === 'e') {
        event.preventDefault();
        openQtyEditor();
        return;
      }
      if (event.key === 't') {
        event.preventDefault();
        openTimeEditor(mode === 'visual' ? selectedIndexes : [cursor]);
        return;
      }
      if (event.key === 'o' || event.key === 'O' || event.key === 'a' || event.key === 'A') {
        event.preventDefault();
        const raw = takeCount();
        if ((event.key === 'a' || event.key === 'A') && raw) {
          const time = parseAbsoluteTime(raw);
          if (!time) {
            flash(`${raw}${event.key} · invalid time`);
            return;
          }
          openPicker({ kind: 'insert', position: 'chronological', time });
          return;
        }
        const currentTime = rows[cursor]?.time ?? currentClockTime();
        if (event.key === 'A') openPicker({ kind: 'insert', position: 'chronological', time: currentClockTime() });
        else openPicker({ kind: 'insert', position: event.key === 'O' ? 'before' : 'after', time: currentTime });
        return;
      }

      if (countRef.current) setCount('');
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [changeDay, consumeCount, cursor, deleteIndexes, exitToNormal, flash, goToday, handlePendingOperator, mode, moveBlock, moveCursor, moveSelection, nextSearchMatch, normalizeIndexes, openDaySearch, openPicker, openQtyEditor, openTimeEditor, paste, pendingG, redo, repeatLast, rows, selectHour, selectedIndexes, setCount, startOperator, takeCount, undo, visualObjectPrefix, yankIndexes]);

  useEffect(() => () => {
    if (headerTimerRef.current !== null) window.clearTimeout(headerTimerRef.current);
    if (headerFrameRef.current !== null) window.cancelAnimationFrame(headerFrameRef.current);
    if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
    if (syncTimerRef.current !== null) window.clearTimeout(syncTimerRef.current);
  }, []);

  const pendingText = pendingOperator
    ? `${pendingOperator.op}${pendingOperator.motionCount}${pendingOperator.objectPrefix ?? ''}${pendingOperator.awaitingG ? 'g' : ''}_`
    : pendingG ? 'g_' : visualObjectPrefix ? `${visualObjectPrefix}_` : '';
  const deltaLabel = deltaFromToday === 0 ? 'TODAY' : `Δ ${deltaFromToday > 0 ? '+' : ''}${deltaFromToday}d`;
  const status = notice || pendingText || (countBuffer
    ? `${countBuffer}_`
    : mode === 'visual'
      ? `${selectedIndexes.length} selected · d/y · p replace · = normalize · t time`
      : register
        ? `${register.rows.length} in register · p/P paste · ${register.source}`
        : 'j/k items · [/] blocks · gt today · Space visual · ? help');
  const syncLabel = syncState === 'syncing' ? 'syncing…' : 'synced';

  return (
    <div className="bt-root">
      <style>{styles}</style>
      <section ref={terminalRef} tabIndex={-1} className="bt-terminal" aria-label="Balance terminal food log">
        <header className="bt-topbar">
          <div className="bt-header-copy">
            <div className="bt-path" aria-label={`Current buffer ${day.iso}`}>
              <span className="bt-path-prefix">balance://</span>
              <span className="bt-path-date">{displayedIso}</span>
              <span className={`bt-block-cursor${headerTyping ? ' is-active' : ''}`} aria-hidden="true" />
            </div>
            <div className="bt-date-meta">
              <span>{labelFor(day.iso)}</span>
              <span className="bt-delta">{deltaLabel}</span>
              <span className="bt-header-hint">h/l day · H/L week · gt today · [/] blocks</span>
            </div>
          </div>
          <div className="bt-minimap-wrap" aria-label={`${monthLabelFor(day.iso)} calendar minimap`}>
            <span className="bt-minimap-month">{monthLabelFor(day.iso)}</span>
            <div className="bt-minimap" aria-hidden="true">
              {calendar.map((cell) => {
                const isToday = cell.iso === TODAY_ISO;
                const isSelected = cell.iso === day.iso;
                return <span key={cell.iso} className={`bt-mini-cell${cell.outside ? ' is-outside' : ''}${isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''}${isToday && isSelected ? ' is-both' : ''}`} />;
              })}
            </div>
          </div>
        </header>

        <section className="bt-day-summary">
          <div className="bt-day-copy"><strong>{labelFor(day.iso)}</strong><span>{relationFor(day.iso)}</span></div>
          <Metric value={totals.kcal} label="KCAL" accent />
          <Metric value={totals.protein} label="P" />
          <Metric value={totals.carbs} label="C" />
          <Metric value={totals.fat} label="F" />
        </section>

        <div className="bt-columns" aria-hidden="true">
          <span /><span>time</span><span className="bt-left">food</span><span>qty</span><span className="bt-kcal-col">kcal</span><span>P</span><span>C</span><span>F</span>
        </div>

        <main key={bufferRevision} className="bt-buffer">
          {groups.map(([hour, items]) => {
            const groupTotals = sumRows(items.map(({ row }) => row));
            return (
              <section className="bt-group" key={hour}>
                <div className="bt-group-head" onDoubleClick={() => {
                  const first = items[0]?.index;
                  if (first === undefined) return;
                  setMode('visual');
                  setVisualAnchor(first);
                  setCursor(items[items.length - 1].index);
                }}>
                  <div className="bt-group-info"><span className="bt-group-time">{hour}</span><span className="bt-group-count">{items.length} item{items.length === 1 ? '' : 's'}</span></div>
                  <span className="bt-group-stat bt-group-kcal"><span className="bt-sigma">Σ</span>{groupTotals.kcal} kcal</span>
                  <span className="bt-group-stat">{groupTotals.protein}P</span><span className="bt-group-stat">{groupTotals.carbs}C</span><span className="bt-group-stat">{groupTotals.fat}F</span>
                </div>
                {items.map(({ row, index }) => {
                  const isCursor = index === cursor;
                  const isSelected = mode === 'visual' && selectedSet.has(index);
                  const editingQty = mode === 'edit-qty' && qtyEditor?.index === index;
                  const editingTime = mode === 'edit-time' && isCursor && timeEditor?.indexes.includes(index);
                  const qtyUnit = qtyEditor?.units[qtyEditor.unitIndex]?.label;
                  return (
                    <div
                      key={row.id}
                      className={`bt-food-row${isCursor ? ' is-cursor' : ''}${isSelected ? ' is-selected' : ''}`}
                      onClick={() => {
                        if (mode.startsWith('edit')) return;
                        setCursor(index);
                        setMode('normal');
                        setVisualAnchor(null);
                        restoreTerminalFocus();
                      }}
                    >
                      <span className="bt-pointer">{isCursor ? '>' : ''}</span>
                      <span className="bt-time" onClick={(event) => { event.stopPropagation(); setCursor(index); openTimeEditor(mode === 'visual' && selectedSet.has(index) ? selectedIndexes : [index]); }}>
                        {editingTime ? (
                          <input
                            ref={timeRef}
                            className="bt-inline-input bt-time-input"
                            value={timeEditor?.buffer ?? ''}
                            placeholder={row.time}
                            onChange={(event) => setTimeEditor((editor) => editor ? { ...editor, buffer: event.target.value.replace(/[^0-9+\-hH]/g, '').slice(0, 6) } : editor)}
                            onKeyDown={(event) => {
                              if (event.key === 'Enter') { event.preventDefault(); commitTime(); }
                              else if (event.key === 'Escape') { event.preventDefault(); exitToNormal(); }
                            }}
                            aria-label="Edit food time"
                          />
                        ) : row.time}
                      </span>
                      <span className="bt-food-name">{row.name}</span>
                      <span className="bt-num bt-qty" onClick={(event) => { event.stopPropagation(); setCursor(index); openQtyEditor(index); }}>
                        {editingQty ? (
                          <span className="bt-qty-editor">
                            <input
                              ref={qtyRef}
                              className="bt-inline-input bt-qty-input"
                              inputMode="decimal"
                              value={qtyEditor?.value ?? ''}
                              onChange={(event) => setQtyEditor((editor) => editor ? { ...editor, value: event.target.value.replace(/[^0-9.]/g, '') } : editor)}
                              onKeyDown={(event) => {
                                if (event.key === 'Tab') { event.preventDefault(); cycleQtyUnit(event.shiftKey ? -1 : 1); }
                                else if (event.key === 'Enter') { event.preventDefault(); commitQty(); }
                                else if (event.key === 'Escape') { event.preventDefault(); exitToNormal(); }
                              }}
                              aria-label="Edit food quantity"
                            />
                            <b>{qtyUnit}</b>
                          </span>
                        ) : row.quantity}
                      </span>
                      <span className="bt-num bt-kcal-col">{row.kcal}</span><span className="bt-macro">{row.protein}</span><span className="bt-macro">{row.carbs}</span><span className="bt-macro">{row.fat}</span>
                    </div>
                  );
                })}
              </section>
            );
          })}
          {!rows.length && <div className="bt-empty">-- empty buffer --</div>}
        </main>

        {mode === 'insert' && (
          <section className="bt-command">
            <div className="bt-command-line">
              <span>{addIntent?.kind === 'replace' ? 'replace>' : `add${addIntent?.kind === 'insert' ? ` @ ${addIntent.time}` : ''}>`}</span>
              <input
                ref={pickerRef}
                value={pickerSearch}
                onChange={(event) => { setPickerSearch(event.target.value); setResultIndex(0); }}
                onKeyDown={(event) => {
                  const move = (delta: number) => setResultIndex((current) => filteredLibrary.length ? (current + delta + filteredLibrary.length) % filteredLibrary.length : 0);
                  if (event.key === 'Escape') { event.preventDefault(); closePicker(); }
                  else if (event.key === 'Tab') { event.preventDefault(); move(event.shiftKey ? -1 : 1); }
                  else if (event.altKey && event.code === 'KeyJ') { event.preventDefault(); move(1); }
                  else if (event.altKey && event.code === 'KeyK') { event.preventDefault(); move(-1); }
                  else if (event.key === 'ArrowDown') { event.preventDefault(); move(1); }
                  else if (event.key === 'ArrowUp') { event.preventDefault(); move(-1); }
                  else if (event.key === 'Enter' && filteredLibrary[resultIndex]) { event.preventDefault(); chooseFood(filteredLibrary[resultIndex]); }
                }}
                placeholder="search library…"
                aria-label="Search food library"
              />
            </div>
            <div className="bt-command-hint">tab/⇧tab · alt+j/k select · enter add · esc cancel</div>
            <div className="bt-results">
              {filteredLibrary.map((food, index) => (
                <button type="button" key={food.name} className={index === resultIndex ? 'is-active' : ''} onMouseEnter={() => setResultIndex(index)} onClick={() => chooseFood(food)}>
                  <span>{index === resultIndex ? '>' : ' '}</span><span>{food.name}</span><span>{food.quantity}</span><span>{food.kcal} kcal · {food.protein}P {food.carbs}C {food.fat}F</span>
                </button>
              ))}
            </div>
          </section>
        )}

        {mode === 'search' && (
          <section className="bt-command">
            <div className="bt-command-line">
              <span>/</span>
              <input ref={searchRef} value={daySearchInput} onChange={(event) => setDaySearchInput(event.target.value)} onKeyDown={(event) => {
                if (event.key === 'Enter') { event.preventDefault(); commitSearch(); }
                else if (event.key === 'Escape') { event.preventDefault(); exitToNormal(); }
              }} placeholder="search current day…" aria-label="Search current day" />
            </div>
          </section>
        )}

        <footer className="bt-statusbar">
          <div className="bt-status-left">
            <span className={`bt-mode bt-mode-${mode}`}>{mode.replace('edit-', 'edit ').toUpperCase()}</span>
            <span className={`bt-count${countBuffer || pendingText ? ' is-active' : ''}`}>{countBuffer || pendingText || '·'}</span>
            <span className="bt-status-text">{status}</span>
          </div>
          <div className="bt-status-right"><span className={`bt-sync is-${syncState}`}>{syncLabel}</span><span className="bt-buffer-id">{deltaLabel.toLowerCase()}</span></div>
        </footer>
      </section>
    </div>
  );
};

const Metric: React.FC<{ value: number; label: string; accent?: boolean }> = ({ value, label, accent }) => (
  <div className={`bt-stat${accent ? ' is-accent' : ''}`}><strong>{Math.round(value)}</strong><span>{label}</span></div>
);

const styles = `
  .bt-root {
    --bt-bg: #090d0a; --bt-panel: #0d130f; --bt-group: #101a13; --bt-row: #152019;
    --bt-text: #d9e4dc; --bt-muted: #78847b; --bt-faint: #3e4941; --bt-accent: #72f1b8; --bt-selected: #173426;
    min-height: 100%; padding: 28px; background: #070a08; color: var(--bt-text);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  }
  .bt-terminal { width: min(1020px, 100%); margin: 0 auto; overflow: hidden; border: 1px solid var(--bt-faint); border-radius: 9px; background: var(--bt-bg); outline: none; }
  .bt-topbar { height: 66px; box-sizing: border-box; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 18px; align-items: center; padding: 7px 12px; border-bottom: 1px solid var(--bt-faint); font-size: 12px; }
  .bt-header-copy { min-width: 0; }
  .bt-path { min-width: 0; display: flex; align-items: center; overflow: hidden; white-space: nowrap; }
  .bt-path-prefix { color: var(--bt-muted); } .bt-path-date { color: var(--bt-text); }
  .bt-block-cursor { display: none; width: 7px; height: 13px; margin-left: 2px; background: var(--bt-accent); }
  .bt-block-cursor.is-active { display: inline-block; animation: bt-blink 650ms steps(1) infinite; }
  @keyframes bt-blink { 50% { opacity: 0; } }
  .bt-date-meta { display: flex; align-items: baseline; gap: 10px; margin-top: 5px; color: var(--bt-muted); font-size: 10px; white-space: nowrap; }
  .bt-delta { color: var(--bt-accent); } .bt-header-hint { color: var(--bt-faint); }
  .bt-minimap-wrap { display: flex; align-items: center; gap: 7px; } .bt-minimap-month { width: 23px; color: var(--bt-muted); font-size: 8px; text-align: right; letter-spacing: .04em; }
  .bt-minimap { display: grid; grid-template-columns: repeat(7, 5px); grid-template-rows: repeat(6, 5px); gap: 3px; }
  .bt-mini-cell { box-sizing: border-box; width: 5px; height: 5px; border: 1px solid transparent; border-radius: 1px; background: #39433c; opacity: .65; }
  .bt-mini-cell.is-outside { border-color: #303832; background: transparent; opacity: .46; } .bt-mini-cell.is-today { border-color: var(--bt-accent); background: transparent; opacity: 1; }
  .bt-mini-cell.is-selected { border-color: var(--bt-accent); background: var(--bt-accent); opacity: 1; } .bt-mini-cell.is-both { outline: 1px solid var(--bt-accent); outline-offset: 2px; }
  .bt-day-summary { display: grid; grid-template-columns: minmax(0, 1fr) 72px 44px 44px 44px; gap: 8px; align-items: end; padding: 14px; border-bottom: 1px solid var(--bt-faint); font-size: 12px; font-variant-numeric: tabular-nums; }
  .bt-day-copy strong { display: block; font-weight: 500; } .bt-day-copy span { color: var(--bt-muted); font-size: 11px; }
  .bt-stat { text-align: right; } .bt-stat strong { display: block; font-weight: 500; } .bt-stat span { display: block; margin-top: 2px; color: var(--bt-faint); font-size: 9px; } .bt-stat.is-accent strong { color: var(--bt-accent); }
  .bt-columns, .bt-food-row { display: grid; grid-template-columns: 20px 54px minmax(0, 1fr) 86px 58px 40px 40px 40px; gap: 7px; align-items: center; }
  .bt-columns { padding: 6px 12px 4px; color: var(--bt-faint); font-size: 9px; text-align: right; text-transform: uppercase; }
  .bt-left { text-align: left; } .bt-buffer { min-height: 410px; padding: 4px 6px 18px; animation: bt-buffer-in 90ms ease both; } @keyframes bt-buffer-in { from { opacity: .68; } to { opacity: 1; } }
  .bt-group { margin-top: 11px; }
  .bt-group-head { display: grid; grid-template-columns: minmax(0, 1fr) auto auto auto auto; gap: 12px; align-items: center; margin: 0 5px 3px; padding: 8px 10px; border-radius: 3px; background: var(--bt-group); color: var(--bt-muted); font-size: 11px; font-variant-numeric: tabular-nums; user-select: none; }
  .bt-group-info { display: flex; align-items: baseline; gap: 8px; min-width: 0; } .bt-group-time { color: var(--bt-accent); font-weight: 600; } .bt-group-count { font-size: 10px; letter-spacing: .05em; text-transform: uppercase; }
  .bt-group-stat { color: #9daa9f; text-align: right; white-space: nowrap; } .bt-group-kcal { color: var(--bt-text); } .bt-sigma { margin-right: 3px; color: var(--bt-muted); }
  .bt-food-row { width: calc(100% - 10px); min-height: 35px; box-sizing: border-box; margin: 0 5px; padding: 3px 10px 3px 12px; border-radius: 3px; background: transparent; color: inherit; font-size: 12px; cursor: default; }
  .bt-food-row:hover { background: rgba(255,255,255,.018); }
  .bt-food-row.is-cursor { background: transparent; outline: 0; }
  .bt-food-row.is-selected { background: var(--bt-selected); color: #effff5; }
  .bt-pointer { color: var(--bt-accent); font-weight: 700; } .bt-food-name { padding-left: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bt-time, .bt-qty { cursor: text; } .bt-time { color: #9aa7b2; font-variant-numeric: tabular-nums; }
  .bt-num, .bt-macro { text-align: right; font-variant-numeric: tabular-nums; } .bt-num { color: var(--bt-muted); } .bt-macro { color: #9daa9f; }
  .bt-inline-input { box-sizing: border-box; width: 100%; min-width: 0; border: 0; border-bottom: 1px solid var(--bt-accent); outline: 0; background: transparent; color: var(--bt-text); font: inherit; font-variant-numeric: tabular-nums; }
  .bt-time-input { text-align: left; } .bt-qty-editor { display: grid; grid-template-columns: minmax(26px, 1fr) auto; gap: 5px; align-items: center; } .bt-qty-input { text-align: right; } .bt-qty-editor b { color: var(--bt-accent); font-weight: 500; }
  .bt-empty { padding: 30px 16px; color: var(--bt-muted); font-size: 12px; }
  .bt-command { border-top: 1px solid var(--bt-faint); background: #080c09; } .bt-command-line { display: flex; align-items: center; gap: 8px; min-height: 40px; padding: 7px 12px; color: var(--bt-accent); font-size: 12px; }
  .bt-command-line input { flex: 1; min-width: 0; border: 0; outline: 0; background: transparent; color: var(--bt-text); font: inherit; } .bt-command-line input::placeholder { color: var(--bt-faint); }
  .bt-command-hint { padding: 0 12px 7px; color: var(--bt-faint); font-size: 9px; }
  .bt-results { padding: 0 6px 7px; } .bt-results button { width: 100%; min-height: 32px; display: grid; grid-template-columns: 18px minmax(0, 1fr) 80px auto; gap: 8px; align-items: center; padding: 3px 7px; border: 0; border-radius: 3px; background: transparent; color: var(--bt-muted); font: inherit; font-size: 11px; text-align: left; cursor: pointer; }
  .bt-results button.is-active { background: var(--bt-row); color: var(--bt-text); } .bt-results button span:nth-child(1) { color: var(--bt-accent); } .bt-results button span:nth-child(3), .bt-results button span:nth-child(4) { text-align: right; }
  .bt-statusbar { min-height: 42px; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 7px 12px; border-top: 1px solid var(--bt-faint); background: var(--bt-panel); font-size: 11px; }
  .bt-status-left, .bt-status-right { display: flex; align-items: center; gap: 9px; min-width: 0; } .bt-mode { flex: 0 0 auto; padding: 2px 6px; background: var(--bt-accent); color: #08100b; font-weight: 700; }
  .bt-mode-visual { background: #f5d76e; color: #17160c; } .bt-mode-insert, .bt-mode-edit-qty, .bt-mode-edit-time, .bt-mode-search { background: #8cc8ff; color: #08121b; }
  .bt-count { min-width: 20px; color: var(--bt-faint); text-align: right; font-variant-numeric: tabular-nums; } .bt-count.is-active { color: var(--bt-accent); }
  .bt-status-text { min-width: 0; overflow: hidden; color: var(--bt-muted); text-overflow: ellipsis; white-space: nowrap; } .bt-buffer-id { color: var(--bt-faint); white-space: nowrap; }
  .bt-sync { white-space: nowrap; color: var(--bt-muted); } .bt-sync.is-syncing { color: var(--bt-accent); }
  @media (max-width: 680px) {
    .bt-root { padding: 12px; } .bt-topbar { gap: 9px; padding-inline: 9px; } .bt-header-hint, .bt-minimap-month { display: none; }
    .bt-food-row, .bt-columns { grid-template-columns: 16px 48px minmax(0, 1fr) 62px 36px 36px 36px; }
    .bt-food-row .bt-kcal-col, .bt-columns .bt-kcal-col { display: none; }
    .bt-group-head { grid-template-columns: minmax(0, 1fr) auto auto auto; } .bt-group-kcal { display: none; }
    .bt-day-summary { grid-template-columns: minmax(0, 1fr) 44px 44px 44px; } .bt-stat.is-accent { display: none; }
    .bt-results button { grid-template-columns: 18px minmax(0, 1fr) auto; } .bt-results button span:nth-child(4), .bt-buffer-id { display: none; }
  }
`;
