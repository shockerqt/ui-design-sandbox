import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Terminal,
  Search,
  Sparkles,
  HelpCircle,
  Clock,
  Flame,
  ChevronRight,
  Sliders,
  RotateCcw,
  Plus,
  Trash2,
  Copy,
  Check,
  Zap,
  Activity,
  Calendar,
  Layers,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

type Mode = 'normal' | 'visual' | 'insert' | 'edit-qty' | 'edit-time' | 'search';
type Totals = Pick<FoodRow, 'kcal' | 'protein' | 'carbs' | 'fat'>;
type Operator = 'd' | 'y' | '=';
type ThemeMode = 'emerald' | 'amber' | 'tokyo' | 'monochrome';

type FoodRow = {
  id: string;
  time: string;
  name: string;
  quantity: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  category?: 'protein' | 'carb' | 'fat' | 'mix';
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

// Daily Nutrition Targets
const DAILY_TARGET = {
  kcal: 2250,
  protein: 165,
  carbs: 220,
  fat: 65,
};

const KNOWN_ROWS: Record<string, FoodRow[]> = {
  '2026-08-17': [
    { id: 'm1', time: '07:10', name: 'Avena tradicional', quantity: '80 g', kcal: 311, protein: 10, carbs: 53, fat: 6, category: 'carb' },
    { id: 'm2', time: '12:30', name: 'Pechuga de pollo', quantity: '180 g', kcal: 298, protein: 55, carbs: 0, fat: 6, category: 'protein' },
    { id: 'm3', time: '12:31', name: 'Arroz integral', quantity: '320 g', kcal: 416, protein: 9, carbs: 87, fat: 3, category: 'carb' },
  ],
  '2026-08-18': [
    { id: 't1', time: '07:00', name: 'Avena tradicional', quantity: '80 g', kcal: 311, protein: 10, carbs: 53, fat: 6, category: 'carb' },
    { id: 't2', time: '07:12', name: 'Whey vainilla', quantity: '30 g', kcal: 118, protein: 24, carbs: 2, fat: 2, category: 'protein' },
    { id: 't3', time: '13:05', name: 'Pechuga de pollo', quantity: '180 g', kcal: 298, protein: 55, carbs: 0, fat: 6, category: 'protein' },
    { id: 't4', time: '13:06', name: 'Papas cocidas', quantity: '400 g', kcal: 348, protein: 8, carbs: 80, fat: 0, category: 'carb' },
  ],
  '2026-08-19': [
    { id: 'w1', time: '07:14', name: 'Tortilla de avena con claras', quantity: '1 porción', kcal: 620, protein: 42, carbs: 72, fat: 18, category: 'mix' },
    { id: 'w2', time: '10:32', name: 'Whey Isolate vainilla', quantity: '30 g', kcal: 118, protein: 24, carbs: 2, fat: 2, category: 'protein' },
    { id: 'w3', time: '13:21', name: 'Pechuga de pollo al horno', quantity: '150 g', kcal: 248, protein: 46, carbs: 0, fat: 5, category: 'protein' },
    { id: 'w4', time: '13:22', name: 'Arroz basmati jazmín', quantity: '300 g', kcal: 390, protein: 8, carbs: 82, fat: 3, category: 'carb' },
    { id: 'w5', time: '13:23', name: 'Aceite de oliva extra virgen', quantity: '10 g', kcal: 90, protein: 0, carbs: 0, fat: 10, category: 'fat' },
    { id: 'w6', time: '18:42', name: 'Pan integral de masa madre', quantity: '200 g', kcal: 430, protein: 18, carbs: 74, fat: 7, category: 'carb' },
  ],
  '2026-08-20': [
    { id: 'h1', time: '06:40', name: 'Avena tradicional', quantity: '100 g', kcal: 389, protein: 13, carbs: 66, fat: 7, category: 'carb' },
    { id: 'h2', time: '06:45', name: 'Whey vainilla', quantity: '40 g', kcal: 157, protein: 32, carbs: 3, fat: 3, category: 'protein' },
    { id: 'h3', time: '14:10', name: 'Carne molida magra 4%', quantity: '180 g', kcal: 310, protein: 42, carbs: 0, fat: 15, category: 'protein' },
    { id: 'h4', time: '14:12', name: 'Arroz integral', quantity: '350 g', kcal: 455, protein: 9, carbs: 96, fat: 4, category: 'carb' },
    { id: 'h5', time: '20:15', name: 'Palta Hass', quantity: '80 g', kcal: 128, protein: 2, carbs: 7, fat: 12, category: 'fat' },
  ],
  '2026-08-21': [
    { id: 'f1', time: '08:00', name: 'Pan integral', quantity: '200 g', kcal: 430, protein: 18, carbs: 74, fat: 7, category: 'carb' },
    { id: 'f2', time: '08:02', name: 'Huevos de campo', quantity: '3 u', kcal: 216, protein: 19, carbs: 1, fat: 15, category: 'mix' },
    { id: 'f3', time: '15:00', name: 'Pechuga de pollo', quantity: '200 g', kcal: 330, protein: 62, carbs: 0, fat: 7, category: 'protein' },
  ],
};

const LIBRARY: Array<Omit<FoodRow, 'id' | 'time'>> = [
  { name: 'Avena tradicional', quantity: '80 g', kcal: 311, protein: 10, carbs: 53, fat: 6, category: 'carb' },
  { name: 'Whey Isolate vainilla', quantity: '30 g', kcal: 118, protein: 24, carbs: 2, fat: 2, category: 'protein' },
  { name: 'Pechuga de pollo al horno', quantity: '150 g', kcal: 248, protein: 46, carbs: 0, fat: 5, category: 'protein' },
  { name: 'Arroz basmati jazmín', quantity: '300 g', kcal: 390, protein: 8, carbs: 82, fat: 3, category: 'carb' },
  { name: 'Aceite de oliva extra virgen', quantity: '10 g', kcal: 90, protein: 0, carbs: 0, fat: 10, category: 'fat' },
  { name: 'Pan integral de masa madre', quantity: '200 g', kcal: 430, protein: 18, carbs: 74, fat: 7, category: 'carb' },
  { name: 'Papas cocidas al vapor', quantity: '400 g', kcal: 348, protein: 8, carbs: 80, fat: 0, category: 'carb' },
  { name: 'Palta Hass', quantity: '80 g', kcal: 128, protein: 2, carbs: 7, fat: 12, category: 'fat' },
  { name: 'Huevos de campo', quantity: '3 u', kcal: 216, protein: 19, carbs: 1, fat: 15, category: 'mix' },
  { name: 'Carne molida magra 4%', quantity: '180 g', kcal: 310, protein: 42, carbs: 0, fat: 15, category: 'protein' },
  { name: 'Salmón fresco a la plancha', quantity: '160 g', kcal: 332, protein: 34, carbs: 0, fat: 21, category: 'mix' },
  { name: 'Yogurt griego natural sin grasa', quantity: '200 g', kcal: 118, protein: 20, carbs: 8, fat: 0, category: 'protein' },
  { name: 'Almendras naturales tostadas', quantity: '30 g', kcal: 174, protein: 6, carbs: 6, fat: 15, category: 'fat' },
  { name: 'Plátano maduro', quantity: '120 g', kcal: 107, protein: 1.3, carbs: 27, fat: 0.4, category: 'carb' },
];

const UNIT_MAP: Record<string, UnitOption[]> = {
  'Avena tradicional': [{ label: 'g', grams: 1 }, { label: 'porción', grams: 80 }, { label: 'taza', grams: 90 }],
  'Whey Isolate vainilla': [{ label: 'g', grams: 1 }, { label: 'scoop', grams: 30 }, { label: 'porción', grams: 30 }],
  'Pechuga de pollo al horno': [{ label: 'g', grams: 1 }, { label: 'porción', grams: 150 }, { label: 'filete', grams: 180 }],
  'Arroz basmati jazmín': [{ label: 'g', grams: 1 }, { label: 'porción', grams: 300 }, { label: 'taza cocida', grams: 160 }],
  'Aceite de oliva extra virgen': [{ label: 'g', grams: 1 }, { label: 'ml', grams: 0.92 }, { label: 'cda (15ml)', grams: 13.8 }, { label: 'cdta (5ml)', grams: 4.6 }],
  'Pan integral de masa madre': [{ label: 'g', grams: 1 }, { label: 'rebanada', grams: 50 }, { label: 'porción', grams: 200 }],
  'Papas cocidas al vapor': [{ label: 'g', grams: 1 }, { label: 'unidad mediana', grams: 150 }, { label: 'porción', grams: 400 }],
  'Palta Hass': [{ label: 'g', grams: 1 }, { label: 'media unidad', grams: 75 }, { label: 'porción', grams: 80 }],
  'Huevos de campo': [{ label: 'u', grams: 50 }, { label: 'claras (u)', grams: 33 }, { label: 'g', grams: 1 }],
  'Carne molida magra 4%': [{ label: 'g', grams: 1 }, { label: 'porción', grams: 180 }, { label: 'hamburguesa', grams: 150 }],
  'Salmón fresco a la plancha': [{ label: 'g', grams: 1 }, { label: 'filete', grams: 160 }],
  'Yogurt griego natural sin grasa': [{ label: 'g', grams: 1 }, { label: 'pote', grams: 150 }, { label: 'taza', grams: 200 }],
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
  if (delta === 0) return 'Today';
  if (delta === -1) return 'Yesterday';
  if (delta === 1) return 'Tomorrow';
  return delta < 0 ? `${Math.abs(delta)}d ago` : `in ${delta}d`;
};
const labelFor = (iso: string) => parseIso(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).toUpperCase();
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

const mealNameForHour = (hourStr: string) => {
  const hour = parseInt(hourStr.slice(0, 2), 10);
  if (hour < 10) return 'BREAKFAST · DESAYUNO';
  if (hour < 12) return 'MID-MORNING · COLACIÓN';
  if (hour < 16) return 'LUNCH · ALMUERZO';
  if (hour < 19) return 'SNACK / PRE-WORKOUT';
  return 'DINNER · CENA';
};

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

export const BalanceVimLogStudio: React.FC = () => {
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
  const [syncState, setSyncState] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [theme, setTheme] = useState<ThemeMode>('emerald');
  const [showWhichKey, setShowWhichKey] = useState(false);
  const [lastKeys, setLastKeys] = useState<string[]>([]);

  const terminalRef = useRef<HTMLElement>(null);
  const pickerRef = useRef<HTMLInputElement>(null);
  const qtyRef = useRef<HTMLInputElement>(null);
  const timeRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const headerFrameRef = useRef<number | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const syncTimerRef = useRef<number | null>(null);

  const day = days[dayIndex] ?? { iso: TODAY_ISO, rows: [] };
  const rows = day.rows;
  const groups = useMemo(() => groupByHour(rows), [rows]);
  const totals = useMemo(() => sumRows(rows), [rows]);
  const calendar = useMemo(() => monthGrid(day.iso), [day.iso]);
  const deltaFromToday = useMemo(() => dayDelta(day.iso), [day.iso]);

  // Macro Energy percentages
  const macroEnergy = useMemo(() => {
    const pKcal = totals.protein * 4;
    const cKcal = totals.carbs * 4;
    const fKcal = totals.fat * 9;
    const sum = pKcal + cKcal + fKcal || 1;
    return {
      pPct: Math.round((pKcal / sum) * 100),
      cPct: Math.round((cKcal / sum) * 100),
      fPct: Math.round((fKcal / sum) * 100),
      totalKcalRatio: Math.min(100, Math.round((totals.kcal / DAILY_TARGET.kcal) * 100)),
      remainingKcal: DAILY_TARGET.kcal - totals.kcal,
    };
  }, [totals]);

  const selectedIndexes = useMemo(() => {
    if (mode !== 'visual' || visualAnchor === null) return [];
    const [start, end] = visualAnchor <= cursor ? [visualAnchor, cursor] : [cursor, visualAnchor];
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [cursor, mode, visualAnchor]);

  const selectedSet = useMemo(() => new Set(selectedIndexes), [selectedIndexes]);

  const filteredLibrary = useMemo(() => {
    const q = pickerSearch.trim().toLowerCase();
    if (!q) return LIBRARY;
    return LIBRARY.filter((food) => food.name.toLowerCase().includes(q));
  }, [pickerSearch]);

  const restoreTerminalFocus = useCallback(() => {
    window.requestAnimationFrame(() => terminalRef.current?.focus());
  }, []);

  const pushNotice = useCallback((message: string, duration = 2800) => {
    setNotice(message);
    if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(''), duration);
  }, []);

  const logKey = useCallback((key: string) => {
    setLastKeys((prev) => [...prev.slice(-4), key]);
  }, []);

  const triggerSync = useCallback(() => {
    setSyncState('syncing');
    if (syncTimerRef.current !== null) window.clearTimeout(syncTimerRef.current);
    syncTimerRef.current = window.setTimeout(() => setSyncState('idle'), 420);
  }, []);

  const saveHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-30), cloneDays(days)]);
    setFuture([]);
    triggerSync();
  }, [days, triggerSync]);

  const updateCurrentDayRows = useCallback((mutator: (currentRows: FoodRow[]) => FoodRow[]) => {
    saveHistory();
    setDays((prev) => {
      const next = cloneDays(prev);
      const target = next[dayIndex];
      if (target) {
        target.rows = mutator(target.rows);
      }
      return next;
    });
  }, [dayIndex, saveHistory]);

  const exitToNormal = useCallback(() => {
    setMode('normal');
    setVisualAnchor(null);
    setQtyEditor(null);
    setTimeEditor(null);
    setAddIntent(null);
    setPendingOperator(null);
    setPendingG(false);
    setVisualObjectPrefix(null);
    setCountBuffer('');
    restoreTerminalFocus();
  }, [restoreTerminalFocus]);

  const openPicker = useCallback((intent: AddIntent) => {
    setAddIntent(intent);
    setPickerSearch('');
    setResultIndex(0);
    setMode('insert');
    window.requestAnimationFrame(() => pickerRef.current?.focus());
  }, []);

  const closePicker = useCallback(() => {
    setAddIntent(null);
    setMode('normal');
    restoreTerminalFocus();
  }, [restoreTerminalFocus]);

  const chooseFood = useCallback((food: (typeof LIBRARY)[number]) => {
    if (!addIntent) return;
    const newId = `row-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    if (addIntent.kind === 'replace') {
      const target = rows[addIntent.index];
      if (!target) return;
      const updated = fitLibraryFoodToQuantity(food, target.quantity, target.time, target.id);
      updateCurrentDayRows((curr) => curr.map((r, i) => (i === addIntent.index ? updated : r)));
      pushNotice(`Replaced with: ${food.name}`);
      setLastChange({ kind: 'replace', foodName: food.name });
    } else {
      const newItem: FoodRow = { ...food, id: newId, time: addIntent.time || currentClockTime() };
      updateCurrentDayRows((curr) => {
        const next = [...curr];
        if (addIntent.position === 'before') next.splice(cursor, 0, newItem);
        else if (addIntent.position === 'after') next.splice(cursor + 1, 0, newItem);
        else next.push(newItem);
        return sortByTime(next);
      });
      pushNotice(`Added: ${food.name} (${food.kcal} kcal)`);
    }
    closePicker();
  }, [addIntent, closePicker, cursor, pushNotice, rows, updateCurrentDayRows]);

  const openQtyEditor = useCallback((index: number) => {
    const target = rows[index];
    if (!target) return;
    const parsed = parseQuantity(target.quantity);
    const units = unitOptionsFor(target.name, parsed.unit);
    const unitIndex = Math.max(0, units.findIndex((u) => u.label === parsed.unit));
    setQtyEditor({ index, value: String(parsed.value), unitIndex, units, original: target });
    setMode('edit-qty');
    window.requestAnimationFrame(() => qtyRef.current?.focus());
  }, [rows]);

  const cycleQtyUnit = useCallback((delta: number) => {
    setQtyEditor((curr) => {
      if (!curr) return null;
      const nextIndex = (curr.unitIndex + delta + curr.units.length) % curr.units.length;
      return { ...curr, unitIndex: nextIndex };
    });
  }, []);

  const commitQty = useCallback(() => {
    if (!qtyEditor) return;
    const val = parseFloat(qtyEditor.value) || 1;
    const unit = qtyEditor.units[qtyEditor.unitIndex]?.label || 'g';
    const updated = scaleRowQuantity(qtyEditor.original, val, unit, qtyEditor.units);
    updateCurrentDayRows((curr) => curr.map((r, i) => (i === qtyEditor.index ? updated : r)));
    setLastChange({ kind: 'quantity', value: val, unit });
    pushNotice(`Updated quantity: ${updated.quantity} (${updated.kcal} kcal)`);
    exitToNormal();
  }, [exitToNormal, pushNotice, qtyEditor, updateCurrentDayRows]);

  const openTimeEditor = useCallback((indexes: number[]) => {
    if (!indexes.length) return;
    const originalTimes = indexes.map((i) => rows[i]?.time || '12:00');
    setTimeEditor({ indexes, buffer: '', originalTimes });
    setMode('edit-time');
    window.requestAnimationFrame(() => timeRef.current?.focus());
  }, [rows]);

  const commitTime = useCallback(() => {
    if (!timeEditor || !timeEditor.buffer.trim()) {
      exitToNormal();
      return;
    }
    const expr = parseTimeExpression(timeEditor.buffer);
    if (!expr) {
      pushNotice('Invalid time expression. Use HH:MM or +15, -30m');
      exitToNormal();
      return;
    }
    updateCurrentDayRows((curr) => {
      const next = [...curr];
      timeEditor.indexes.forEach((idx, i) => {
        const orig = timeEditor.originalTimes[i];
        let nextTime = orig;
        if (expr.kind === 'absolute') {
          nextTime = expr.time;
        } else {
          nextTime = minutesToTime(timeToMinutes(orig) + expr.delta);
        }
        if (next[idx]) next[idx] = { ...next[idx], time: nextTime };
      });
      return sortByTime(next);
    });
    pushNotice(`Time adjusted for ${timeEditor.indexes.length} item(s)`);
    exitToNormal();
  }, [exitToNormal, pushNotice, timeEditor, updateCurrentDayRows]);

  const deleteRows = useCallback((indexes: number[]) => {
    if (!indexes.length) return;
    const deleted = indexes.map((i) => rows[i]).filter(Boolean);
    setRegister({ rows: deleted.map(({ id, ...rest }) => rest), source: 'delete' });
    updateCurrentDayRows((curr) => curr.filter((_, i) => !indexes.includes(i)));
    setCursor((c) => Math.max(0, Math.min(c, rows.length - indexes.length - 1)));
    pushNotice(`Deleted ${indexes.length} row(s) (yanked to register)`);
    exitToNormal();
  }, [exitToNormal, pushNotice, rows, updateCurrentDayRows]);

  const yankRows = useCallback((indexes: number[]) => {
    if (!indexes.length) return;
    const yanked = indexes.map((i) => rows[i]).filter(Boolean);
    setRegister({ rows: yanked.map(({ id, ...rest }) => rest), source: 'yank' });
    pushNotice(`Yanked ${indexes.length} row(s) to register`);
    exitToNormal();
  }, [exitToNormal, pushNotice, rows]);

  const pasteRegister = useCallback((position: 'before' | 'after') => {
    if (!register || !register.rows.length) {
      pushNotice('Register is empty');
      return;
    }
    const targetTime = rows[cursor]?.time || currentClockTime();
    const newItems: FoodRow[] = register.rows.map((r, i) => ({
      ...r,
      id: `p-${Date.now()}-${i}`,
      time: targetTime,
    }));
    updateCurrentDayRows((curr) => {
      const next = [...curr];
      const insertAt = position === 'after' ? Math.min(curr.length, cursor + 1) : cursor;
      next.splice(insertAt, 0, ...newItems);
      return sortByTime(next);
    });
    pushNotice(`Pasted ${newItems.length} item(s) from register`);
  }, [cursor, pushNotice, register, rows, updateCurrentDayRows]);

  const normalizeRowTimes = useCallback((indexes: number[]) => {
    if (!indexes.length) return;
    const baseTime = rows[indexes[0]]?.time || '12:00';
    updateCurrentDayRows((curr) => curr.map((r, i) => (indexes.includes(i) ? { ...r, time: baseTime } : r)));
    pushNotice(`Normalized ${indexes.length} row(s) to ${baseTime}`);
    exitToNormal();
  }, [exitToNormal, pushNotice, rows, updateCurrentDayRows]);

  const undo = useCallback(() => {
    if (!history.length) {
      pushNotice('Already at oldest change');
      return;
    }
    const previous = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setFuture((f) => [cloneDays(days), ...f]);
    setDays(previous);
    pushNotice('1 change undone');
  }, [days, history, pushNotice]);

  const redo = useCallback(() => {
    if (!future.length) {
      pushNotice('Already at newest change');
      return;
    }
    const next = future[0];
    setFuture((f) => f.slice(1));
    setHistory((h) => [...h, cloneDays(days)]);
    setDays(next);
    pushNotice('1 change redone');
  }, [days, future, pushNotice]);

  const commitSearch = useCallback(() => {
    if (!daySearchInput.trim()) {
      exitToNormal();
      return;
    }
    const query = daySearchInput.toLowerCase();
    setLastSearch(query);
    const foundIdx = rows.findIndex((r, i) => i >= cursor && r.name.toLowerCase().includes(query));
    const finalIdx = foundIdx !== -1 ? foundIdx : rows.findIndex((r) => r.name.toLowerCase().includes(query));
    if (finalIdx !== -1) {
      setCursor(finalIdx);
      pushNotice(`Match: ${rows[finalIdx].name}`);
    } else {
      pushNotice(`Pattern not found: ${query}`);
    }
    exitToNormal();
  }, [cursor, daySearchInput, exitToNormal, pushNotice, rows]);

  const nextSearchResult = useCallback((reverse = false) => {
    if (!lastSearch || !rows.length) return;
    const matches: number[] = [];
    rows.forEach((r, i) => {
      if (r.name.toLowerCase().includes(lastSearch)) matches.push(i);
    });
    if (!matches.length) return;
    if (!reverse) {
      const next = matches.find((i) => i > cursor) ?? matches[0];
      setCursor(next);
    } else {
      const prev = [...matches].reverse().find((i) => i < cursor) ?? matches[matches.length - 1];
      setCursor(prev);
    }
  }, [cursor, lastSearch, rows]);

  // Main Keydown Handler
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isInput = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable;
      if (isInput) return;

      logKey(event.key);

      // Global Keybindings
      if (event.key === '?') {
        event.preventDefault();
        setShowWhichKey((prev) => !prev);
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        setShowWhichKey(false);
        exitToNormal();
        return;
      }

      // Theme toggle (Shift+T)
      if (event.shiftKey && event.key === 'T') {
        event.preventDefault();
        const themes: ThemeMode[] = ['emerald', 'amber', 'tokyo', 'monochrome'];
        const nextTheme = themes[(themes.indexOf(theme) + 1) % themes.length];
        setTheme(nextTheme);
        pushNotice(`Theme: ${nextTheme.toUpperCase()}`);
        return;
      }

      // Numeric count buffering (e.g. 3j, 2d)
      if (mode === 'normal' || mode === 'visual') {
        if (/^[1-9]$/.test(event.key) || (/^0$/.test(event.key) && countBuffer.length > 0)) {
          event.preventDefault();
          setCountBuffer((c) => `${c}${event.key}`);
          return;
        }
      }

      const count = parseInt(countBuffer, 10) || 1;

      // NORMAL & VISUAL NAVIGATION
      if (mode === 'normal' || mode === 'visual') {
        if (event.key === 'j' || event.key === 'ArrowDown') {
          event.preventDefault();
          setCountBuffer('');
          setCursor((c) => Math.min(rows.length - 1, c + count));
          return;
        }
        if (event.key === 'k' || event.key === 'ArrowUp') {
          event.preventDefault();
          setCountBuffer('');
          setCursor((c) => Math.max(0, c - count));
          return;
        }
        if (event.key === 'h' || event.key === 'ArrowLeft') {
          event.preventDefault();
          setCountBuffer('');
          setDayIndex((idx) => Math.max(0, idx - count));
          return;
        }
        if (event.key === 'l' || event.key === 'ArrowRight') {
          event.preventDefault();
          setCountBuffer('');
          setDayIndex((idx) => Math.min(days.length - 1, idx + count));
          return;
        }
        if (event.key === 'H') {
          event.preventDefault();
          setDayIndex((idx) => Math.max(0, idx - 7 * count));
          return;
        }
        if (event.key === 'L') {
          event.preventDefault();
          setDayIndex((idx) => Math.min(days.length - 1, idx + 7 * count));
          return;
        }
        if (event.key === 'g') {
          event.preventDefault();
          if (pendingG) {
            setCursor(0);
            setPendingG(false);
          } else {
            setPendingG(true);
          }
          return;
        }
        if (event.key === 'G') {
          event.preventDefault();
          setCursor(Math.max(0, rows.length - 1));
          return;
        }
        if (event.key === '[') {
          event.preventDefault();
          const currentHour = hourOf(rows[cursor]?.time || '00:00');
          const prevHourGroup = [...groups].reverse().find(([h]) => timeToMinutes(h) < timeToMinutes(currentHour));
          if (prevHourGroup && prevHourGroup[1][0]) setCursor(prevHourGroup[1][0].index);
          return;
        }
        if (event.key === ']') {
          event.preventDefault();
          const currentHour = hourOf(rows[cursor]?.time || '00:00');
          const nextHourGroup = groups.find(([h]) => timeToMinutes(h) > timeToMinutes(currentHour));
          if (nextHourGroup && nextHourGroup[1][0]) setCursor(nextHourGroup[1][0].index);
          return;
        }
      }

      // NORMAL MODE ACTIONS
      if (mode === 'normal') {
        if (event.key === 'v') {
          event.preventDefault();
          setMode('visual');
          setVisualAnchor(cursor);
          return;
        }
        if (event.key === 'V') {
          event.preventDefault();
          setMode('visual');
          setVisualAnchor(cursor);
          return;
        }
        if (event.key === 'o') {
          event.preventDefault();
          const currentTime = rows[cursor]?.time || currentClockTime();
          openPicker({ kind: 'insert', position: 'after', time: currentTime });
          return;
        }
        if (event.key === 'O') {
          event.preventDefault();
          const currentTime = rows[cursor]?.time || currentClockTime();
          openPicker({ kind: 'insert', position: 'before', time: currentTime });
          return;
        }
        if (event.key === 'a' || event.key === 'A') {
          event.preventDefault();
          if (rows[cursor]) openQtyEditor(cursor);
          return;
        }
        if (event.key === 't') {
          event.preventDefault();
          if (rows[cursor]) openTimeEditor([cursor]);
          return;
        }
        if (event.key === 'd') {
          event.preventDefault();
          if (pendingOperator?.op === 'd') {
            const deleteCount = pendingOperator.operatorCount * count;
            const targetIndexes = Array.from({ length: deleteCount }, (_, i) => cursor + i).filter((i) => i < rows.length);
            deleteRows(targetIndexes);
            setPendingOperator(null);
          } else {
            setPendingOperator({ op: 'd', operatorCount: count, motionCount: '', objectPrefix: null, awaitingG: false });
          }
          return;
        }
        if (event.key === 'y') {
          event.preventDefault();
          if (pendingOperator?.op === 'y') {
            const yankCount = pendingOperator.operatorCount * count;
            const targetIndexes = Array.from({ length: yankCount }, (_, i) => cursor + i).filter((i) => i < rows.length);
            yankRows(targetIndexes);
            setPendingOperator(null);
          } else {
            setPendingOperator({ op: 'y', operatorCount: count, motionCount: '', objectPrefix: null, awaitingG: false });
          }
          return;
        }
        if (event.key === 'p') {
          event.preventDefault();
          pasteRegister('after');
          return;
        }
        if (event.key === 'P') {
          event.preventDefault();
          pasteRegister('before');
          return;
        }
        if (event.key === 'u') {
          event.preventDefault();
          undo();
          return;
        }
        if (event.key === 'U' || (event.ctrlKey && event.key === 'r')) {
          event.preventDefault();
          redo();
          return;
        }
        if (event.key === '/') {
          event.preventDefault();
          setMode('search');
          setDaySearchInput('');
          window.requestAnimationFrame(() => searchRef.current?.focus());
          return;
        }
        if (event.key === 'n') {
          event.preventDefault();
          nextSearchResult(false);
          return;
        }
        if (event.key === 'N') {
          event.preventDefault();
          nextSearchResult(true);
          return;
        }
        if (event.key === '=') {
          event.preventDefault();
          normalizeRowTimes([cursor]);
          return;
        }
      }

      // VISUAL MODE ACTIONS
      if (mode === 'visual') {
        if (event.key === 'd' || event.key === 'x') {
          event.preventDefault();
          deleteRows(selectedIndexes);
          return;
        }
        if (event.key === 'y') {
          event.preventDefault();
          yankRows(selectedIndexes);
          return;
        }
        if (event.key === '=') {
          event.preventDefault();
          normalizeRowTimes(selectedIndexes);
          return;
        }
        if (event.key === 't') {
          event.preventDefault();
          openTimeEditor(selectedIndexes);
          return;
        }
        if (event.key === 'p') {
          event.preventDefault();
          if (register?.rows.length) {
            deleteRows(selectedIndexes);
            pasteRegister('before');
          }
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    countBuffer,
    cursor,
    days.length,
    deleteRows,
    exitToNormal,
    groups,
    history.length,
    logKey,
    mode,
    nextSearchResult,
    normalizeRowTimes,
    openPicker,
    openQtyEditor,
    openTimeEditor,
    pasteRegister,
    pendingG,
    pendingOperator,
    pushNotice,
    redo,
    register?.rows.length,
    rows,
    selectedIndexes,
    theme,
    undo,
    yankRows,
  ]);

  const pendingText = pendingOperator
    ? `${pendingOperator.op}${countBuffer || ''}_`
    : pendingG
    ? 'g_'
    : countBuffer
    ? `${countBuffer}_`
    : '';

  const deltaLabel = deltaFromToday === 0 ? 'TODAY' : `Δ ${deltaFromToday > 0 ? '+' : ''}${deltaFromToday}d`;

  return (
    <div className={`bt-root theme-${theme}`}>
      <style>{styles}</style>

      {/* Background Ambient Glow */}
      <div className="bt-ambient-glow" aria-hidden="true" />

      {/* Main Terminal Window Frame */}
      <section
        ref={terminalRef}
        tabIndex={-1}
        className="bt-terminal"
        aria-label="Balance High-Precision Vim Nutrition Log"
      >
        {/* Topbar Bezel */}
        <header className="bt-topbar">
          <div className="bt-header-left">
            <div className="bt-brand">
              <Terminal size={14} className="bt-brand-icon" />
              <span className="bt-brand-title">BALANCE</span>
              <span className="bt-brand-ver">v4.0.0-PRO</span>
            </div>
            <div className="bt-path">
              <span className="bt-path-prefix">buffer://</span>
              <span className="bt-path-date">{displayedIso}</span>
              <span className="bt-cursor-indicator" />
            </div>
            <div className="bt-date-badge">
              <span className="bt-date-day">{labelFor(day.iso)}</span>
              <span className="bt-date-rel">{relationFor(day.iso)}</span>
            </div>
          </div>

          <div className="bt-header-right">
            {/* Theme switcher pill */}
            <button
              type="button"
              className="bt-theme-pill"
              onClick={() => {
                const themes: ThemeMode[] = ['emerald', 'amber', 'tokyo', 'monochrome'];
                setTheme(themes[(themes.indexOf(theme) + 1) % themes.length]);
              }}
              title="Switch Palette (Shift+T)"
            >
              <Zap size={11} />
              <span>{theme.toUpperCase()}</span>
            </button>

            {/* Minimap matrix */}
            <div className="bt-minimap-block">
              <span className="bt-minimap-label">{monthLabelFor(day.iso)}</span>
              <div className="bt-minimap">
                {calendar.map((cell) => {
                  const isToday = cell.iso === TODAY_ISO;
                  const isSelected = cell.iso === day.iso;
                  return (
                    <span
                      key={cell.iso}
                      className={`bt-mini-cell${cell.outside ? ' is-outside' : ''}${isToday ? ' is-today' : ''}${isSelected ? ' is-selected' : ''}`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Help Button */}
            <button
              type="button"
              className={`bt-btn-help${showWhichKey ? ' is-active' : ''}`}
              onClick={() => setShowWhichKey((v) => !v)}
              aria-label="Show Vim Keybindings"
              title="Vim Shortcut HUD (?)"
            >
              <HelpCircle size={14} />
              <span>?</span>
            </button>
          </div>
        </header>

        {/* Nutrition Target Calibration HUD */}
        <section className="bt-hud">
          <div className="bt-hud-metric bt-hud-kcal">
            <div className="bt-hud-label">
              <Flame size={12} className="bt-flame-icon" />
              <span>DAILY ENERGY</span>
            </div>
            <div className="bt-hud-val">
              <strong>{totals.kcal}</strong>
              <span className="bt-hud-target">/ {DAILY_TARGET.kcal} kcal</span>
            </div>
            <div className="bt-progress-track">
              <div
                className="bt-progress-fill"
                style={{ transform: `scaleX(${Math.min(1, macroEnergy.totalKcalRatio / 100)})`, transformOrigin: 'left' }}
              />
            </div>
            <div className="bt-hud-sub">
              {macroEnergy.remainingKcal >= 0 ? (
                <span className="bt-sub-rem">{macroEnergy.remainingKcal} kcal remaining</span>
              ) : (
                <span className="bt-sub-over">+{Math.abs(macroEnergy.remainingKcal)} kcal surplus</span>
              )}
            </div>
          </div>

          <div className="bt-hud-metric bt-hud-macro bt-macro-p">
            <div className="bt-hud-label"><span>PROTEIN (4kcal)</span></div>
            <div className="bt-hud-val">
              <strong>{totals.protein}g</strong>
              <span className="bt-hud-target">/ {DAILY_TARGET.protein}g</span>
            </div>
            <div className="bt-macro-bar"><div className="bt-macro-bar-fill p-fill" style={{ transform: `scaleX(${Math.min(1, totals.protein / DAILY_TARGET.protein)})`, transformOrigin: 'left' }} /></div>
            <div className="bt-macro-pct">{macroEnergy.pPct}% of cals</div>
          </div>

          <div className="bt-hud-metric bt-hud-macro bt-macro-c">
            <div className="bt-hud-label"><span>CARBS (4kcal)</span></div>
            <div className="bt-hud-val">
              <strong>{totals.carbs}g</strong>
              <span className="bt-hud-target">/ {DAILY_TARGET.carbs}g</span>
            </div>
            <div className="bt-macro-bar"><div className="bt-macro-bar-fill c-fill" style={{ transform: `scaleX(${Math.min(1, totals.carbs / DAILY_TARGET.carbs)})`, transformOrigin: 'left' }} /></div>
            <div className="bt-macro-pct">{macroEnergy.cPct}% of cals</div>
          </div>

          <div className="bt-hud-metric bt-hud-macro bt-macro-f">
            <div className="bt-hud-label"><span>FAT (9kcal)</span></div>
            <div className="bt-hud-val">
              <strong>{totals.fat}g</strong>
              <span className="bt-hud-target">/ {DAILY_TARGET.fat}g</span>
            </div>
            <div className="bt-macro-bar"><div className="bt-macro-bar-fill f-fill" style={{ transform: `scaleX(${Math.min(1, totals.fat / DAILY_TARGET.fat)})`, transformOrigin: 'left' }} /></div>
            <div className="bt-macro-pct">{macroEnergy.fPct}% of cals</div>
          </div>
        </section>

        {/* Table Column Header */}
        <div className="bt-columns" aria-hidden="true">
          <span className="col-num">#</span>
          <span className="col-ptr" />
          <span className="col-time">TIME</span>
          <span className="col-food">FOOD ITEM</span>
          <span className="col-qty">QUANTITY</span>
          <span className="col-kcal">KCAL</span>
          <span className="col-m col-p">P (g)</span>
          <span className="col-m col-c">C (g)</span>
          <span className="col-m col-f">F (g)</span>
        </div>

        {/* Main Food Rows Buffer */}
        <main key={bufferRevision} className="bt-buffer">
          {groups.map(([hour, items]) => {
            const groupTotals = sumRows(items.map(({ row }) => row));
            const mealLabel = mealNameForHour(hour);
            return (
              <section className="bt-group" key={hour}>
                {/* Section Header */}
                <div
                  className="bt-group-head"
                  onDoubleClick={() => {
                    const first = items[0]?.index;
                    if (first === undefined) return;
                    setMode('visual');
                    setVisualAnchor(first);
                    setCursor(items[items.length - 1].index);
                  }}
                >
                  <div className="bt-group-info">
                    <span className="bt-group-time">{hour}</span>
                    <span className="bt-group-title">{mealLabel}</span>
                    <span className="bt-group-count">[{items.length}]</span>
                  </div>
                  <div className="bt-group-stats">
                    <span className="bt-grp-stat bt-grp-kcal">Σ {groupTotals.kcal} kcal</span>
                    <span className="bt-grp-stat bt-grp-p">{groupTotals.protein}P</span>
                    <span className="bt-grp-stat bt-grp-c">{groupTotals.carbs}C</span>
                    <span className="bt-grp-stat bt-grp-f">{groupTotals.fat}F</span>
                  </div>
                </div>

                {/* Individual Food Rows */}
                {items.map(({ row, index }) => {
                  const isCursor = index === cursor;
                  const isSelected = mode === 'visual' && selectedSet.has(index);
                  const editingQty = mode === 'edit-qty' && qtyEditor?.index === index;
                  const editingTime = mode === 'edit-time' && isCursor && timeEditor?.indexes.includes(index);
                  const qtyUnit = qtyEditor?.units[qtyEditor.unitIndex]?.label;
                  const relNumber = isCursor ? index + 1 : Math.abs(index - cursor);

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
                      {/* Vim Relative Number Gutter */}
                      <span className={`bt-gutter-num${isCursor ? ' is-active' : ''}`}>
                        {relNumber}
                      </span>

                      {/* Cursor Pointer */}
                      <span className="bt-pointer">
                        {isCursor ? '▸' : isSelected ? '▪' : ''}
                      </span>

                      {/* Time */}
                      <span
                        className="bt-time"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCursor(index);
                          openTimeEditor(mode === 'visual' && selectedSet.has(index) ? selectedIndexes : [index]);
                        }}
                      >
                        {editingTime ? (
                          <input
                            ref={timeRef}
                            className="bt-inline-input bt-time-input"
                            value={timeEditor?.buffer ?? ''}
                            placeholder={row.time}
                            onChange={(e) =>
                              setTimeEditor((ed) =>
                                ed ? { ...ed, buffer: e.target.value.replace(/[^0-9+\-hH]/g, '').slice(0, 6) } : ed
                              )
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                commitTime();
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                exitToNormal();
                              }
                            }}
                            aria-label="Edit food time"
                          />
                        ) : (
                          row.time
                        )}
                      </span>

                      {/* Food Name */}
                      <span className="bt-food-name">
                        <span className="bt-name-text">{row.name}</span>
                        {row.category && <span className={`bt-cat-pill cat-${row.category}`}>{row.category}</span>}
                      </span>

                      {/* Quantity */}
                      <span
                        className="bt-num bt-qty"
                        onClick={(e) => {
                          e.stopPropagation();
                          setCursor(index);
                          openQtyEditor(index);
                        }}
                      >
                        {editingQty ? (
                          <span className="bt-qty-editor">
                            <input
                              ref={qtyRef}
                              className="bt-inline-input bt-qty-input"
                              inputMode="decimal"
                              value={qtyEditor?.value ?? ''}
                              onChange={(e) =>
                                setQtyEditor((ed) =>
                                  ed ? { ...ed, value: e.target.value.replace(/[^0-9.]/g, '') } : ed
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Tab') {
                                  e.preventDefault();
                                  cycleQtyUnit(e.shiftKey ? -1 : 1);
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  commitQty();
                                } else if (e.key === 'Escape') {
                                  e.preventDefault();
                                  exitToNormal();
                                }
                              }}
                              aria-label="Edit food quantity"
                            />
                            <b className="bt-unit-badge">{qtyUnit}</b>
                          </span>
                        ) : (
                          row.quantity
                        )}
                      </span>

                      {/* Macros */}
                      <span className="bt-num bt-kcal-col">{row.kcal}</span>
                      <span className="bt-macro bt-macro-p">{row.protein}</span>
                      <span className="bt-macro bt-macro-c">{row.carbs}</span>
                      <span className="bt-macro bt-macro-f">{row.fat}</span>
                    </div>
                  );
                })}
              </section>
            );
          })}

          {!rows.length && (
            <div className="bt-empty-buffer">
              <Terminal size={24} className="bt-empty-icon" />
              <span>-- EMPTY BUFFER --</span>
              <p>Press <code>o</code> to add item or <code>P</code> to paste register</p>
            </div>
          )}
        </main>

        {/* Telescope-Style Fuzzy Food Picker Overlay */}
        {mode === 'insert' && (
          <section className="bt-telescope-modal">
            <div className="bt-telescope-box">
              <div className="bt-telescope-head">
                <Search size={14} className="bt-search-icon" />
                <span className="bt-prompt-label">
                  {addIntent?.kind === 'replace' ? 'REPLACE FOOD' : 'INSERT FOOD'}
                </span>
                <input
                  ref={pickerRef}
                  value={pickerSearch}
                  onChange={(e) => {
                    setPickerSearch(e.target.value);
                    setResultIndex(0);
                  }}
                  onKeyDown={(e) => {
                    const move = (delta: number) =>
                      setResultIndex((curr) =>
                        filteredLibrary.length ? (curr + delta + filteredLibrary.length) % filteredLibrary.length : 0
                      );
                    if (e.key === 'Escape') {
                      e.preventDefault();
                      closePicker();
                    } else if (e.key === 'Tab' || e.key === 'ArrowDown') {
                      e.preventDefault();
                      move(e.shiftKey ? -1 : 1);
                    } else if (e.key === 'ArrowUp') {
                      e.preventDefault();
                      move(-1);
                    } else if (e.key === 'Enter' && filteredLibrary[resultIndex]) {
                      e.preventDefault();
                      chooseFood(filteredLibrary[resultIndex]);
                    }
                  }}
                  placeholder="Type to search foods... (Tab to navigate, Enter to select)"
                  aria-label="Search food library"
                />
              </div>

              <div className="bt-telescope-split">
                {/* Left: Search Results List */}
                <div className="bt-results-list">
                  {filteredLibrary.map((food, idx) => {
                    const isSelected = idx === resultIndex;
                    return (
                      <button
                        type="button"
                        key={food.name}
                        className={`bt-res-row${isSelected ? ' is-active' : ''}`}
                        onMouseEnter={() => setResultIndex(idx)}
                        onClick={() => chooseFood(food)}
                      >
                        <span className="bt-res-ptr">{isSelected ? '▸' : ' '}</span>
                        <span className="bt-res-name">{food.name}</span>
                        <span className="bt-res-qty">{food.quantity}</span>
                        <span className="bt-res-kcal">{food.kcal} kcal</span>
                      </button>
                    );
                  })}
                </div>

                {/* Right: Nutrition Inspector Preview */}
                {filteredLibrary[resultIndex] && (
                  <div className="bt-preview-pane">
                    <div className="bt-prev-title">{filteredLibrary[resultIndex].name}</div>
                    <div className="bt-prev-qty">Default: {filteredLibrary[resultIndex].quantity}</div>
                    <div className="bt-prev-kcal-big">{filteredLibrary[resultIndex].kcal} <span>kcal</span></div>

                    <div className="bt-prev-macro-grid">
                      <div className="bt-prev-card p">
                        <span>PROTEIN</span>
                        <strong>{filteredLibrary[resultIndex].protein}g</strong>
                      </div>
                      <div className="bt-prev-card c">
                        <span>CARBS</span>
                        <strong>{filteredLibrary[resultIndex].carbs}g</strong>
                      </div>
                      <div className="bt-prev-card f">
                        <span>FAT</span>
                        <strong>{filteredLibrary[resultIndex].fat}g</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="bt-telescope-foot">
                <span>[↑/↓] or [Tab] Navigate</span>
                <span>[Enter] Select Item</span>
                <span>[Esc] Cancel</span>
              </div>
            </div>
          </section>
        )}

        {/* Quick Search Line */}
        {mode === 'search' && (
          <section className="bt-searchbar">
            <Search size={13} />
            <span className="bt-search-slash">/</span>
            <input
              ref={searchRef}
              value={daySearchInput}
              onChange={(e) => setDaySearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  commitSearch();
                } else if (e.key === 'Escape') {
                  e.preventDefault();
                  exitToNormal();
                }
              }}
              placeholder="Search in day buffer... (Enter to find, Esc to cancel)"
              aria-label="Search day food items"
            />
          </section>
        )}

        {/* WhichKey Keyboard Shortcuts HUD Popup */}
        {showWhichKey && (
          <section className="bt-whichkey-hud">
            <div className="bt-whichkey-card">
              <div className="bt-whichkey-header">
                <div className="bt-wk-title">
                  <Zap size={13} />
                  <span>VIM GRAMMAR & SHORTCUT CHEAT SHEET</span>
                </div>
                <button
                  type="button"
                  className="bt-wk-close"
                  onClick={() => setShowWhichKey(false)}
                >
                  ✕
                </button>
              </div>

              <div className="bt-whichkey-grid">
                <div className="bt-wk-col">
                  <h4>MOTION</h4>
                  <ul>
                    <li><kbd>j</kbd>/<kbd>k</kbd> <span>Down / Up line</span></li>
                    <li><kbd>h</kbd>/<kbd>l</kbd> <span>Prev / Next day</span></li>
                    <li><kbd>H</kbd>/<kbd>L</kbd> <span>Jump 1 week</span></li>
                    <li><kbd>[</kbd>/<kbd>]</kbd> <span>Prev / Next meal</span></li>
                    <li><kbd>gg</kbd>/<kbd>G</kbd> <span>Top / Bottom of day</span></li>
                  </ul>
                </div>

                <div className="bt-wk-col">
                  <h4>OPERATORS</h4>
                  <ul>
                    <li><kbd>o</kbd>/<kbd>O</kbd> <span>Insert food after/before</span></li>
                    <li><kbd>a</kbd>/<kbd>A</kbd> <span>Edit quantity (Tab cycles unit)</span></li>
                    <li><kbd>t</kbd> <span>Edit time (+15, -30, HH:MM)</span></li>
                    <li><kbd>dd</kbd> <span>Delete row to register</span></li>
                    <li><kbd>yy</kbd> <span>Yank row to register</span></li>
                    <li><kbd>p</kbd>/<kbd>P</kbd> <span>Paste register after/before</span></li>
                  </ul>
                </div>

                <div className="bt-wk-col">
                  <h4>SELECTION & POWER</h4>
                  <ul>
                    <li><kbd>v</kbd>/<kbd>V</kbd> <span>Visual block mode</span></li>
                    <li><kbd>=</kbd> <span>Normalize meal times</span></li>
                    <li><kbd>/</kbd> <span>Fuzzy search buffer</span></li>
                    <li><kbd>u</kbd>/<kbd>U</kbd> <span>Undo / Redo</span></li>
                    <li><kbd>Shift+T</kbd> <span>Switch color theme</span></li>
                    <li><kbd>?</kbd> <span>Toggle this cheat sheet</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Vim Airline / Powerline Statusbar */}
        <footer className="bt-statusbar">
          <div className="bt-status-left">
            {/* Mode Badge */}
            <span className={`bt-mode-badge mode-${mode}`}>
              {mode.replace('edit-', 'EDIT ').toUpperCase()}
            </span>

            {/* Buffer info */}
            <span className="bt-status-buffer">
              {day.iso} [{rows.length} items]
            </span>

            {/* Keystroke Buffer Indicator */}
            {pendingText && <span className="bt-status-keybuf">{pendingText}</span>}

            {/* Feedback Notice */}
            {notice && <span className="bt-status-notice">{notice}</span>}

            {!notice && !pendingText && (
              <span className="bt-status-hint">
                {mode === 'visual'
                  ? `${selectedIndexes.length} lines selected · d delete · y yank · = normalize`
                  : register
                  ? `[reg: ${register.rows.length} items from ${register.source}] · p paste`
                  : 'Press ? for keymap · o add food · a edit qty · t time'}
              </span>
            )}
          </div>

          <div className="bt-status-right">
            {/* Last Keystroke Feed */}
            {lastKeys.length > 0 && (
              <div className="bt-key-feed">
                {lastKeys.map((k, i) => (
                  <span key={i} className="bt-key-pill">{k === ' ' ? 'SPC' : k}</span>
                ))}
              </div>
            )}

            {/* Sync State */}
            <span className={`bt-sync-state is-${syncState}`}>
              <Check size={11} />
              <span>{syncState === 'syncing' ? 'WRITING...' : 'SAVED'}</span>
            </span>

            {/* Delta pill */}
            <span className="bt-delta-pill">{deltaLabel}</span>
          </div>
        </footer>
      </section>
    </div>
  );
};

const styles = `
  /* Master Reset & Scoping */
  .bt-root {
    --bt-font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', Menlo, Consolas, monospace;
    position: relative;
    width: 100%;
    min-height: 100dvh;
    padding: clamp(14px, 2.5vw, 36px);
    box-sizing: border-box;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    font-family: var(--bt-font-mono);
    font-size: 12px;
    line-height: 1.5;
    letter-spacing: -0.01em;
    font-feature-settings: 'tnum' 1, 'zero' 1;
    transition: background 300ms ease, color 300ms ease;
    overflow-x: hidden;
  }

  /* Color Themes */
  .theme-emerald {
    --bt-bg: #070a0e;
    --bt-panel: #0b1017;
    --bt-surface: #0f1722;
    --bt-border: rgba(56, 189, 248, 0.12);
    --bt-border-subtle: rgba(255, 255, 255, 0.06);
    --bt-text: #e2e8f0;
    --bt-text-muted: #8899ac;
    --bt-text-dim: #475569;
    --bt-accent: #10b981;
    --bt-accent-glow: rgba(16, 185, 129, 0.25);
    --bt-accent-subtle: rgba(16, 185, 129, 0.12);
    --bt-cursor: rgba(16, 185, 129, 0.18);
    --bt-selected: rgba(16, 185, 129, 0.22);
    --bt-p-color: #34d399;
    --bt-c-color: #38bdf8;
    --bt-f-color: #fbbf24;
    background: #040609;
    color: var(--bt-text);
  }

  .theme-amber {
    --bt-bg: #0d0a05;
    --bt-panel: #141008;
    --bt-surface: #1c170d;
    --bt-border: rgba(245, 158, 11, 0.18);
    --bt-border-subtle: rgba(255, 255, 255, 0.06);
    --bt-text: #fef3c7;
    --bt-text-muted: #b4a383;
    --bt-text-dim: #63553f;
    --bt-accent: #f59e0b;
    --bt-accent-glow: rgba(245, 158, 11, 0.28);
    --bt-accent-subtle: rgba(245, 158, 11, 0.12);
    --bt-cursor: rgba(245, 158, 11, 0.18);
    --bt-selected: rgba(245, 158, 11, 0.24);
    --bt-p-color: #fbbf24;
    --bt-c-color: #f97316;
    --bt-f-color: #eab308;
    background: #080603;
    color: var(--bt-text);
  }

  .theme-tokyo {
    --bt-bg: #090c15;
    --bt-panel: #0f1322;
    --bt-surface: #171d33;
    --bt-border: rgba(129, 140, 248, 0.16);
    --bt-border-subtle: rgba(255, 255, 255, 0.06);
    --bt-text: #e0e7ff;
    --bt-text-muted: #8e9bb8;
    --bt-text-dim: #4f5875;
    --bt-accent: #818cf8;
    --bt-accent-glow: rgba(129, 140, 248, 0.28);
    --bt-accent-subtle: rgba(129, 140, 248, 0.14);
    --bt-cursor: rgba(129, 140, 248, 0.2);
    --bt-selected: rgba(129, 140, 248, 0.26);
    --bt-p-color: #a78bfa;
    --bt-c-color: #38bdf8;
    --bt-f-color: #f472b6;
    background: #05070c;
    color: var(--bt-text);
  }

  .theme-monochrome {
    --bt-bg: #0c0d0e;
    --bt-panel: #141618;
    --bt-surface: #1e2023;
    --bt-border: rgba(255, 255, 255, 0.15);
    --bt-border-subtle: rgba(255, 255, 255, 0.05);
    --bt-text: #f1f3f5;
    --bt-text-muted: #949a9f;
    --bt-text-dim: #54595e;
    --bt-accent: #ffffff;
    --bt-accent-glow: rgba(255, 255, 255, 0.2);
    --bt-accent-subtle: rgba(255, 255, 255, 0.08);
    --bt-cursor: rgba(255, 255, 255, 0.12);
    --bt-selected: rgba(255, 255, 255, 0.18);
    --bt-p-color: #e2e8f0;
    --bt-c-color: #cbd5e1;
    --bt-f-color: #94a3b8;
    background: #060708;
    color: var(--bt-text);
  }

  /* Ambient Glow Background */
  .bt-ambient-glow {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    background: radial-gradient(circle at 50% 12%, var(--bt-accent-glow), transparent 55%);
    opacity: 0.45;
  }

  /* Terminal Window Shell */
  .bt-terminal {
    position: relative;
    z-index: 1;
    width: min(1080px, 100%);
    background: var(--bt-panel);
    border: 1px solid var(--bt-border);
    border-radius: 10px;
    box-shadow: 0 28px 80px -16px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.04);
    outline: none;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  /* Topbar */
  .bt-topbar {
    height: 56px;
    padding: 0 16px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--bt-border-subtle);
    background: var(--bt-bg);
  }

  .bt-header-left {
    display: flex;
    align-items: center;
    gap: 16px;
    min-width: 0;
  }

  .bt-brand {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--bt-accent);
    font-weight: 700;
  }

  .bt-brand-icon {
    color: var(--bt-accent);
  }

  .bt-brand-title {
    letter-spacing: 0.08em;
  }

  .bt-brand-ver {
    font-size: 9px;
    padding: 1px 4px;
    border-radius: 3px;
    background: var(--bt-accent-subtle);
    color: var(--bt-accent);
    font-weight: 600;
  }

  .bt-path {
    display: flex;
    align-items: center;
    font-size: 11px;
    color: var(--bt-text-muted);
  }

  .bt-path-prefix {
    color: var(--bt-text-dim);
  }

  .bt-path-date {
    color: var(--bt-text);
    font-weight: 600;
  }

  .bt-cursor-indicator {
    display: inline-block;
    width: 6px;
    height: 12px;
    margin-left: 4px;
    background: var(--bt-accent);
    animation: bt-blink 1s infinite steps(1);
  }

  @keyframes bt-blink {
    50% { opacity: 0; }
  }

  .bt-date-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
  }

  .bt-date-day {
    color: var(--bt-accent);
    font-weight: 600;
  }

  .bt-date-rel {
    color: var(--bt-text-dim);
  }

  .bt-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .bt-theme-pill {
    display: flex;
    align-items: center;
    gap: 5px;
    background: var(--bt-surface);
    border: 1px solid var(--bt-border-subtle);
    color: var(--bt-text-muted);
    font-family: inherit;
    font-size: 10px;
    font-weight: 600;
    padding: 4px 8px;
    border-radius: 4px;
    cursor: pointer;
    transition: all 150ms ease;
  }

  .bt-theme-pill:hover {
    border-color: var(--bt-accent);
    color: var(--bt-text);
  }

  .bt-minimap-block {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .bt-minimap-label {
    font-size: 9px;
    color: var(--bt-text-dim);
    font-weight: 600;
  }

  .bt-minimap {
    display: grid;
    grid-template-columns: repeat(7, 5px);
    grid-template-rows: repeat(6, 5px);
    gap: 2px;
  }

  .bt-mini-cell {
    width: 5px;
    height: 5px;
    border-radius: 1px;
    background: var(--bt-text-dim);
    opacity: 0.3;
  }

  .bt-mini-cell.is-outside {
    opacity: 0.08;
  }

  .bt-mini-cell.is-today {
    outline: 1px solid var(--bt-accent);
    opacity: 0.9;
  }

  .bt-mini-cell.is-selected {
    background: var(--bt-accent);
    opacity: 1;
  }

  .bt-btn-help {
    width: 26px;
    height: 26px;
    border-radius: 4px;
    background: var(--bt-surface);
    border: 1px solid var(--bt-border-subtle);
    color: var(--bt-text-muted);
    font-family: inherit;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
  }

  .bt-btn-help.is-active, .bt-btn-help:hover {
    border-color: var(--bt-accent);
    color: var(--bt-accent);
  }

  /* HUD Energy Section */
  .bt-hud {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 1fr;
    gap: 12px;
    padding: 14px 16px;
    background: var(--bt-surface);
    border-bottom: 1px solid var(--bt-border-subtle);
  }

  .bt-hud-metric {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .bt-hud-label {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 9px;
    font-weight: 700;
    color: var(--bt-text-muted);
    letter-spacing: 0.05em;
  }

  .bt-flame-icon {
    color: var(--bt-accent);
  }

  .bt-hud-val {
    display: flex;
    align-items: baseline;
    gap: 5px;
  }

  .bt-hud-val strong {
    font-size: 16px;
    font-weight: 700;
    color: var(--bt-text);
  }

  .bt-hud-target {
    font-size: 11px;
    color: var(--bt-text-dim);
  }

  .bt-progress-track {
    width: 100%;
    height: 4px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 99px;
    overflow: hidden;
    margin-top: 2px;
  }

  .bt-progress-fill {
    width: 100%;
    height: 100%;
    background: var(--bt-accent);
    border-radius: 99px;
    transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .bt-hud-sub {
    font-size: 10px;
    font-weight: 600;
  }

  .bt-sub-rem {
    color: var(--bt-accent);
  }

  .bt-sub-over {
    color: #f43f5e;
  }

  .bt-macro-bar {
    width: 100%;
    height: 3px;
    background: rgba(255, 255, 255, 0.06);
    border-radius: 99px;
    overflow: hidden;
  }

  .bt-macro-bar-fill {
    width: 100%;
    height: 100%;
    border-radius: 99px;
    transition: transform 300ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  .p-fill { background: var(--bt-p-color); }
  .c-fill { background: var(--bt-c-color); }
  .f-fill { background: var(--bt-f-color); }

  .bt-macro-pct {
    font-size: 9px;
    color: var(--bt-text-dim);
  }

  /* Table Headers */
  .bt-columns {
    display: grid;
    grid-template-columns: 28px 18px 58px minmax(0, 1fr) 92px 64px 44px 44px 44px;
    gap: 8px;
    padding: 8px 16px;
    font-size: 10px;
    font-weight: 700;
    color: var(--bt-text-dim);
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--bt-border-subtle);
  }

  .col-food { text-align: left; }
  .col-qty, .col-kcal, .col-m { text-align: right; }
  .col-p { color: var(--bt-p-color); opacity: 0.8; }
  .col-c { color: var(--bt-c-color); opacity: 0.8; }
  .col-f { color: var(--bt-f-color); opacity: 0.8; }

  /* Buffer Content */
  .bt-buffer {
    min-height: 420px;
    padding: 8px 10px 24px;
  }

  .bt-group {
    margin-top: 14px;
  }

  .bt-group-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 6px 10px;
    margin: 0 4px 4px;
    background: var(--bt-surface);
    border-radius: 4px;
    border-left: 2px solid var(--bt-accent);
    cursor: default;
    user-select: none;
  }

  .bt-group-info {
    display: flex;
    align-items: baseline;
    gap: 8px;
  }

  .bt-group-time {
    color: var(--bt-accent);
    font-weight: 700;
  }

  .bt-group-title {
    font-size: 10px;
    font-weight: 700;
    color: var(--bt-text-muted);
    letter-spacing: 0.04em;
  }

  .bt-group-count {
    font-size: 10px;
    color: var(--bt-text-dim);
  }

  .bt-group-stats {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 11px;
  }

  .bt-grp-stat {
    font-weight: 600;
  }

  .bt-grp-kcal { color: var(--bt-text); }
  .bt-grp-p { color: var(--bt-p-color); }
  .bt-grp-c { color: var(--bt-c-color); }
  .bt-grp-f { color: var(--bt-f-color); }

  /* Food Rows */
  .bt-food-row {
    display: grid;
    grid-template-columns: 28px 18px 58px minmax(0, 1fr) 92px 64px 44px 44px 44px;
    gap: 8px;
    align-items: center;
    padding: 5px 10px;
    margin: 1px 4px;
    border-radius: 4px;
    background: transparent;
    transition: background 80ms ease;
    cursor: default;
  }

  .bt-food-row:hover {
    background: rgba(255, 255, 255, 0.025);
  }

  .bt-food-row.is-cursor {
    background: var(--bt-cursor);
    outline: 1px solid var(--bt-accent-glow);
  }

  .bt-food-row.is-selected {
    background: var(--bt-selected);
    color: #ffffff;
  }

  .bt-gutter-num {
    text-align: right;
    color: var(--bt-text-dim);
    font-size: 11px;
  }

  .bt-gutter-num.is-active {
    color: var(--bt-accent);
    font-weight: 700;
  }

  .bt-pointer {
    color: var(--bt-accent);
    font-weight: 700;
    text-align: center;
  }

  .bt-time {
    color: var(--bt-text-muted);
    font-size: 11px;
    cursor: text;
  }

  .bt-food-name {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .bt-name-text {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--bt-text);
  }

  .bt-cat-pill {
    font-size: 8px;
    text-transform: uppercase;
    font-weight: 700;
    padding: 1px 4px;
    border-radius: 3px;
    opacity: 0.75;
  }

  .cat-protein { background: rgba(52, 211, 153, 0.15); color: var(--bt-p-color); }
  .cat-carb { background: rgba(56, 189, 248, 0.15); color: var(--bt-c-color); }
  .cat-fat { background: rgba(251, 191, 36, 0.15); color: var(--bt-f-color); }
  .cat-mix { background: rgba(168, 85, 247, 0.15); color: #c084fc; }

  .bt-num {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .bt-qty {
    color: var(--bt-text-muted);
    cursor: text;
  }

  .bt-kcal-col {
    color: var(--bt-text);
    font-weight: 600;
  }

  .bt-macro {
    text-align: right;
    font-size: 11px;
  }

  .bt-macro-p { color: var(--bt-p-color); }
  .bt-macro-c { color: var(--bt-c-color); }
  .bt-macro-f { color: var(--bt-f-color); }

  .bt-inline-input {
    background: transparent;
    border: 0;
    border-bottom: 1px solid var(--bt-accent);
    color: var(--bt-text);
    font: inherit;
    outline: 0;
    padding: 0;
    width: 100%;
  }

  .bt-qty-editor {
    display: flex;
    align-items: center;
    gap: 4px;
    justify-content: flex-end;
  }

  .bt-qty-input {
    width: 48px;
    text-align: right;
  }

  .bt-unit-badge {
    color: var(--bt-accent);
    font-size: 10px;
  }

  .bt-empty-buffer {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: var(--bt-text-dim);
    gap: 8px;
  }

  .bt-empty-icon {
    color: var(--bt-text-dim);
    opacity: 0.5;
  }

  .bt-empty-buffer code {
    color: var(--bt-accent);
    background: var(--bt-surface);
    padding: 2px 5px;
    border-radius: 3px;
  }

  /* Telescope Modal */
  .bt-telescope-modal {
    position: absolute;
    inset: 0;
    z-index: 20;
    background: rgba(0, 0, 0, 0.75);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  }

  .bt-telescope-box {
    width: min(720px, 100%);
    background: var(--bt-panel);
    border: 1px solid var(--bt-border);
    border-radius: 8px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.85);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .bt-telescope-head {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: var(--bt-bg);
    border-bottom: 1px solid var(--bt-border-subtle);
  }

  .bt-search-icon {
    color: var(--bt-accent);
  }

  .bt-prompt-label {
    font-size: 10px;
    font-weight: 700;
    color: var(--bt-accent);
    background: var(--bt-accent-subtle);
    padding: 2px 6px;
    border-radius: 3px;
  }

  .bt-telescope-head input {
    flex: 1;
    background: transparent;
    border: 0;
    outline: 0;
    color: var(--bt-text);
    font: inherit;
    font-size: 13px;
  }

  .bt-telescope-split {
    display: grid;
    grid-template-columns: 1.4fr 1fr;
    min-height: 260px;
    max-height: 380px;
  }

  .bt-results-list {
    overflow-y: auto;
    padding: 6px;
    border-right: 1px solid var(--bt-border-subtle);
  }

  .bt-res-row {
    width: 100%;
    display: grid;
    grid-template-columns: 16px minmax(0, 1fr) auto auto;
    gap: 8px;
    align-items: center;
    padding: 6px 8px;
    border-radius: 4px;
    border: 0;
    background: transparent;
    color: var(--bt-text-muted);
    font: inherit;
    font-size: 11px;
    text-align: left;
    cursor: pointer;
  }

  .bt-res-row.is-active, .bt-res-row:hover {
    background: var(--bt-surface);
    color: var(--bt-text);
  }

  .bt-res-ptr {
    color: var(--bt-accent);
    font-weight: 700;
  }

  .bt-res-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 500;
  }

  .bt-res-qty {
    font-size: 10px;
    color: var(--bt-text-dim);
  }

  .bt-res-kcal {
    color: var(--bt-accent);
    font-weight: 600;
  }

  .bt-preview-pane {
    padding: 16px;
    background: var(--bt-surface);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .bt-prev-title {
    font-size: 13px;
    font-weight: 700;
    color: var(--bt-text);
  }

  .bt-prev-qty {
    font-size: 11px;
    color: var(--bt-text-muted);
  }

  .bt-prev-kcal-big {
    font-size: 28px;
    font-weight: 700;
    color: var(--bt-accent);
    margin: 8px 0;
  }

  .bt-prev-kcal-big span {
    font-size: 12px;
    color: var(--bt-text-dim);
  }

  .bt-prev-macro-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }

  .bt-prev-card {
    padding: 8px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.25);
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .bt-prev-card span { font-size: 9px; font-weight: 700; }
  .bt-prev-card strong { font-size: 13px; margin-top: 2px; }

  .bt-prev-card.p span { color: var(--bt-p-color); }
  .bt-prev-card.c span { color: var(--bt-c-color); }
  .bt-prev-card.f span { color: var(--bt-f-color); }

  .bt-telescope-foot {
    display: flex;
    justify-content: space-between;
    padding: 6px 12px;
    background: var(--bt-bg);
    border-top: 1px solid var(--bt-border-subtle);
    font-size: 10px;
    color: var(--bt-text-dim);
  }

  /* Quick Search */
  .bt-searchbar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 14px;
    background: var(--bt-bg);
    border-top: 1px solid var(--bt-border-subtle);
    color: var(--bt-accent);
  }

  .bt-search-slash {
    font-weight: 700;
  }

  .bt-searchbar input {
    flex: 1;
    background: transparent;
    border: 0;
    outline: 0;
    color: var(--bt-text);
    font: inherit;
  }

  /* WhichKey HUD */
  .bt-whichkey-hud {
    position: absolute;
    bottom: 42px;
    left: 0;
    right: 0;
    z-index: 15;
    background: rgba(11, 16, 23, 0.96);
    backdrop-filter: blur(12px);
    border-top: 1px solid var(--bt-border);
    padding: 16px;
    box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.5);
  }

  .bt-whichkey-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .bt-wk-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-weight: 700;
    color: var(--bt-accent);
    letter-spacing: 0.05em;
  }

  .bt-wk-close {
    background: transparent;
    border: 0;
    color: var(--bt-text-dim);
    font-size: 13px;
    cursor: pointer;
  }

  .bt-whichkey-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .bt-wk-col h4 {
    margin: 0 0 8px;
    font-size: 10px;
    color: var(--bt-text-muted);
    font-weight: 700;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--bt-border-subtle);
    padding-bottom: 4px;
  }

  .bt-wk-col ul {
    list-style: none;
    padding: 0;
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .bt-wk-col li {
    display: flex;
    align-items: baseline;
    gap: 8px;
    font-size: 11px;
    color: var(--bt-text-muted);
  }

  .bt-wk-col kbd {
    background: var(--bt-surface);
    border: 1px solid var(--bt-border-subtle);
    color: var(--bt-accent);
    padding: 1px 5px;
    border-radius: 3px;
    font-weight: 700;
    font-size: 10px;
    min-width: 16px;
    text-align: center;
  }

  /* Statusbar Powerline */
  .bt-statusbar {
    min-height: 38px;
    padding: 0 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: var(--bt-bg);
    border-top: 1px solid var(--bt-border-subtle);
    font-size: 11px;
  }

  .bt-status-left {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
  }

  .bt-mode-badge {
    padding: 2px 8px;
    font-weight: 800;
    font-size: 10px;
    border-radius: 3px;
    letter-spacing: 0.05em;
  }

  .mode-normal { background: var(--bt-accent); color: #050b08; }
  .mode-visual { background: #f59e0b; color: #0d0a05; }
  .mode-insert, .mode-search, .mode-edit-qty, .mode-edit-time { background: #38bdf8; color: #050d14; }

  .bt-status-buffer {
    color: var(--bt-text-dim);
  }

  .bt-status-keybuf {
    color: var(--bt-accent);
    background: var(--bt-accent-subtle);
    padding: 1px 5px;
    border-radius: 3px;
    font-weight: 700;
  }

  .bt-status-notice {
    color: var(--bt-accent);
    font-weight: 600;
  }

  .bt-status-hint {
    color: var(--bt-text-muted);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .bt-status-right {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .bt-key-feed {
    display: flex;
    gap: 3px;
  }

  .bt-key-pill {
    font-size: 9px;
    background: var(--bt-surface);
    color: var(--bt-text-dim);
    padding: 1px 4px;
    border-radius: 2px;
  }

  .bt-sync-state {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 600;
    color: var(--bt-text-dim);
  }

  .bt-sync-state.is-syncing {
    color: var(--bt-accent);
  }

  .bt-delta-pill {
    color: var(--bt-accent);
    font-weight: 700;
    font-size: 10px;
  }

  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .bt-root { padding: 8px; }
    .bt-hud { grid-template-columns: 1fr 1fr; }
    .bt-food-row, .bt-columns {
      grid-template-columns: 20px 14px 44px minmax(0, 1fr) 60px 48px;
    }
    .col-m, .bt-macro { display: none; }
    .bt-minimap-block { display: none; }
    .bt-whichkey-grid { grid-template-columns: 1fr; }
    .bt-telescope-split { grid-template-columns: 1fr; }
    .bt-preview-pane { display: none; }
  }
`;
