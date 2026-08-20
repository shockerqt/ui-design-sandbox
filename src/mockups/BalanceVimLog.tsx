import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Mode = 'normal' | 'visual' | 'insert';

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

type DayLog = {
  iso: string;
  label: string;
  relation: string;
  rows: FoodRow[];
};

type Register = {
  kind: 'copy' | 'cut';
  rows: FoodRow[];
} | null;

type Totals = Pick<FoodRow, 'kcal' | 'protein' | 'carbs' | 'fat'>;

const INITIAL_DAYS: DayLog[] = [
  {
    iso: '2026-08-17',
    label: 'MONDAY 17',
    relation: '2 days ago',
    rows: [
      { id: 'm1', time: '07:10', name: 'Avena tradicional', quantity: '80 g', kcal: 311, protein: 10, carbs: 53, fat: 6 },
      { id: 'm2', time: '12:30', name: 'Pechuga de pollo', quantity: '180 g', kcal: 298, protein: 55, carbs: 0, fat: 6 },
      { id: 'm3', time: '12:31', name: 'Arroz integral', quantity: '320 g', kcal: 416, protein: 9, carbs: 87, fat: 3 },
    ],
  },
  {
    iso: '2026-08-18',
    label: 'TUESDAY 18',
    relation: 'yesterday',
    rows: [
      { id: 't1', time: '07:00', name: 'Avena tradicional', quantity: '80 g', kcal: 311, protein: 10, carbs: 53, fat: 6 },
      { id: 't2', time: '07:12', name: 'Whey vainilla', quantity: '30 g', kcal: 118, protein: 24, carbs: 2, fat: 2 },
      { id: 't3', time: '13:05', name: 'Pechuga de pollo', quantity: '180 g', kcal: 298, protein: 55, carbs: 0, fat: 6 },
      { id: 't4', time: '13:06', name: 'Papas cocidas', quantity: '400 g', kcal: 348, protein: 8, carbs: 80, fat: 0 },
    ],
  },
  {
    iso: '2026-08-19',
    label: 'WEDNESDAY 19',
    relation: 'today',
    rows: [
      { id: 'w1', time: '07:14', name: 'Tortilla de avena', quantity: '1 porción', kcal: 620, protein: 42, carbs: 72, fat: 18 },
      { id: 'w2', time: '10:32', name: 'Whey vainilla', quantity: '30 g', kcal: 118, protein: 24, carbs: 2, fat: 2 },
      { id: 'w3', time: '13:21', name: 'Pechuga de pollo', quantity: '150 g', kcal: 248, protein: 46, carbs: 0, fat: 5 },
      { id: 'w4', time: '13:22', name: 'Arroz integral', quantity: '300 g', kcal: 390, protein: 8, carbs: 82, fat: 3 },
      { id: 'w5', time: '13:23', name: 'Aceite de oliva', quantity: '10 g', kcal: 90, protein: 0, carbs: 0, fat: 10 },
      { id: 'w6', time: '18:42', name: 'Pan integral casero', quantity: '200 g', kcal: 430, protein: 18, carbs: 74, fat: 7 },
    ],
  },
  {
    iso: '2026-08-20',
    label: 'THURSDAY 20',
    relation: 'tomorrow',
    rows: [
      { id: 'h1', time: '06:40', name: 'Avena tradicional', quantity: '100 g', kcal: 389, protein: 13, carbs: 66, fat: 7 },
      { id: 'h2', time: '06:45', name: 'Whey vainilla', quantity: '40 g', kcal: 157, protein: 32, carbs: 3, fat: 3 },
      { id: 'h3', time: '14:10', name: 'Carne molida 4%', quantity: '180 g', kcal: 310, protein: 42, carbs: 0, fat: 15 },
      { id: 'h4', time: '14:12', name: 'Arroz integral', quantity: '350 g', kcal: 455, protein: 9, carbs: 96, fat: 4 },
      { id: 'h5', time: '20:15', name: 'Palta', quantity: '80 g', kcal: 128, protein: 2, carbs: 7, fat: 12 },
    ],
  },
  {
    iso: '2026-08-21',
    label: 'FRIDAY 21',
    relation: 'in 2 days',
    rows: [
      { id: 'f1', time: '08:00', name: 'Pan integral', quantity: '200 g', kcal: 430, protein: 18, carbs: 74, fat: 7 },
      { id: 'f2', time: '08:02', name: 'Huevos', quantity: '3 u', kcal: 216, protein: 19, carbs: 1, fat: 15 },
      { id: 'f3', time: '15:00', name: 'Pechuga de pollo', quantity: '200 g', kcal: 330, protein: 62, carbs: 0, fat: 7 },
    ],
  },
  {
    iso: '2026-08-22',
    label: 'SATURDAY 22',
    relation: 'in 3 days',
    rows: [
      { id: 's1', time: '09:20', name: 'Avena tradicional', quantity: '100 g', kcal: 389, protein: 13, carbs: 66, fat: 7 },
      { id: 's2', time: '14:30', name: 'Carne molida 4%', quantity: '200 g', kcal: 344, protein: 47, carbs: 0, fat: 17 },
      { id: 's3', time: '14:31', name: 'Papas cocidas', quantity: '450 g', kcal: 392, protein: 9, carbs: 90, fat: 0 },
    ],
  },
  {
    iso: '2026-08-23',
    label: 'SUNDAY 23',
    relation: 'in 4 days',
    rows: [
      { id: 'u1', time: '10:10', name: 'Tortilla de avena', quantity: '1 porción', kcal: 620, protein: 42, carbs: 72, fat: 18 },
      { id: 'u2', time: '16:20', name: 'Pechuga de pollo', quantity: '180 g', kcal: 298, protein: 55, carbs: 0, fat: 6 },
      { id: 'u3', time: '16:22', name: 'Arroz integral', quantity: '300 g', kcal: 390, protein: 8, carbs: 82, fat: 3 },
    ],
  },
];

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

const cloneDays = (days: DayLog[]) => days.map((day) => ({
  ...day,
  rows: day.rows.map((row) => ({ ...row })),
}));

const sumRows = (rows: FoodRow[]): Totals => rows.reduce(
  (acc, row) => ({
    kcal: acc.kcal + row.kcal,
    protein: acc.protein + row.protein,
    carbs: acc.carbs + row.carbs,
    fat: acc.fat + row.fat,
  }),
  { kcal: 0, protein: 0, carbs: 0, fat: 0 }
);

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

export const BalanceVimLog: React.FC = () => {
  const [days, setDays] = useState(() => cloneDays(INITIAL_DAYS));
  const [dayIndex, setDayIndex] = useState(2);
  const [cursor, setCursor] = useState(2);
  const [mode, setMode] = useState<Mode>('normal');
  const [visualAnchor, setVisualAnchor] = useState<number | null>(null);
  const [register, setRegister] = useState<Register>(null);
  const [history, setHistory] = useState<DayLog[][]>([]);
  const [notice, setNotice] = useState('');
  const [displayedIso, setDisplayedIso] = useState(INITIAL_DAYS[2].iso);
  const [headerTyping, setHeaderTyping] = useState(false);
  const [bufferRevision, setBufferRevision] = useState(0);
  const [search, setSearch] = useState('');
  const [resultIndex, setResultIndex] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const headerTimerRef = useRef<number | null>(null);
  const headerFrameRef = useRef<number | null>(null);
  const headerGenerationRef = useRef(0);
  const noticeTimerRef = useRef<number | null>(null);

  const day = days[dayIndex];
  const rows = day.rows;
  const totals = useMemo(() => sumRows(rows), [rows]);
  const groups = useMemo(() => groupByHour(rows), [rows]);

  const selectedIndexes = useMemo(() => {
    if (!rows.length) return [];
    if (mode !== 'visual' || visualAnchor === null) return [cursor];
    const from = Math.min(visualAnchor, cursor);
    const to = Math.max(visualAnchor, cursor);
    return Array.from({ length: to - from + 1 }, (_, index) => from + index);
  }, [cursor, mode, rows.length, visualAnchor]);

  const selectedSet = useMemo(() => new Set(selectedIndexes), [selectedIndexes]);

  const filteredLibrary = useMemo(() => {
    const query = search.trim().toLowerCase();
    return LIBRARY.filter((food) => food.name.toLowerCase().includes(query)).slice(0, 6);
  }, [search]);

  const flash = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(''), 1300);
  }, []);

  const checkpoint = useCallback(() => {
    setHistory((current) => [...current.slice(-19), cloneDays(days)]);
  }, [days]);

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
        const visibleCharacters = Math.floor(progress * target.length);
        setDisplayedIso(target.slice(0, visibleCharacters));

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

  const changeDay = useCallback((delta: number) => {
    const next = Math.max(0, Math.min(days.length - 1, dayIndex + delta));
    if (next === dayIndex) return;

    setDayIndex(next);
    setCursor((current) => Math.min(current, Math.max(0, days[next].rows.length - 1)));
    setMode('normal');
    setVisualAnchor(null);
    setBufferRevision((revision) => revision + 1);
    animateHeader(days[next].iso);
  }, [animateHeader, dayIndex, days]);

  const moveCursor = useCallback((delta: number) => {
    if (!rows.length) return;
    setCursor((current) => Math.max(0, Math.min(rows.length - 1, current + delta)));
  }, [rows.length]);

  const selectHour = useCallback(() => {
    if (!rows[cursor]) return;
    const hour = hourOf(rows[cursor].time);
    const indexes = rows.flatMap((row, index) => hourOf(row.time) === hour ? [index] : []);
    if (!indexes.length) return;
    setMode('visual');
    setVisualAnchor(indexes[0]);
    setCursor(indexes[indexes.length - 1]);
  }, [cursor, rows]);

  const copyOrCut = useCallback((kind: 'copy' | 'cut') => {
    if (!selectedIndexes.length) return;
    const picked = selectedIndexes.map((index) => ({ ...rows[index] }));
    setRegister({ kind, rows: picked });

    if (kind === 'cut') {
      checkpoint();
      setDays((current) => current.map((item, index) => index === dayIndex
        ? { ...item, rows: item.rows.filter((_, rowIndex) => !selectedSet.has(rowIndex)) }
        : item
      ));
      setCursor(Math.min(selectedIndexes[0], Math.max(0, rows.length - selectedIndexes.length - 1)));
    }

    setMode('normal');
    setVisualAnchor(null);
    flash(`${picked.length} ${kind === 'copy' ? 'copied' : 'cut'}`);
  }, [checkpoint, dayIndex, flash, rows, selectedIndexes, selectedSet]);

  const remove = useCallback(() => {
    if (!selectedIndexes.length) return;
    checkpoint();
    setDays((current) => current.map((item, index) => index === dayIndex
      ? { ...item, rows: item.rows.filter((_, rowIndex) => !selectedSet.has(rowIndex)) }
      : item
    ));
    setCursor(Math.min(selectedIndexes[0], Math.max(0, rows.length - selectedIndexes.length - 1)));
    setMode('normal');
    setVisualAnchor(null);
    flash(`${selectedIndexes.length} deleted`);
  }, [checkpoint, dayIndex, flash, rows.length, selectedIndexes, selectedSet]);

  const paste = useCallback(() => {
    if (!register?.rows.length) {
      flash('register empty');
      return;
    }

    checkpoint();
    const position = rows.length ? Math.min(cursor + 1, rows.length) : 0;
    const pasted = register.rows.map((row) => ({
      ...row,
      id: register.kind === 'cut' ? row.id : crypto.randomUUID(),
    }));

    setDays((current) => current.map((item, index) => {
      if (index !== dayIndex) return item;
      const nextRows = [...item.rows];
      nextRows.splice(position, 0, ...pasted);
      return { ...item, rows: nextRows };
    }));

    setCursor(position);
    if (register.kind === 'cut') setRegister(null);
    flash(`${pasted.length} pasted`);
  }, [checkpoint, cursor, dayIndex, flash, register, rows.length]);

  const undo = useCallback(() => {
    const previous = history.at(-1);
    if (!previous) {
      flash('nothing to undo');
      return;
    }

    setDays(cloneDays(previous));
    setHistory((current) => current.slice(0, -1));
    setMode('normal');
    setVisualAnchor(null);
    setCursor((current) => Math.min(current, Math.max(0, previous[dayIndex].rows.length - 1)));
    flash('undone');
  }, [dayIndex, flash, history]);

  const openAdd = useCallback(() => {
    setMode('insert');
    setSearch('');
    setResultIndex(0);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const closeAdd = useCallback(() => {
    setMode('normal');
    setSearch('');
    setResultIndex(0);
  }, []);

  const addFood = useCallback((food: (typeof LIBRARY)[number]) => {
    checkpoint();
    const position = rows.length ? Math.min(cursor + 1, rows.length) : 0;
    const time = rows[cursor]?.time ?? '12:00';
    const next: FoodRow = { ...food, id: crypto.randomUUID(), time };

    setDays((current) => current.map((item, index) => {
      if (index !== dayIndex) return item;
      const nextRows = [...item.rows];
      nextRows.splice(position, 0, next);
      return { ...item, rows: nextRows };
    }));

    setCursor(position);
    closeAdd();
    flash(`${food.name} added`);
  }, [checkpoint, closeAdd, cursor, dayIndex, flash, rows]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';
      if (mode === 'insert' || typing || event.metaKey || event.ctrlKey || event.altKey) return;

      const commands: Record<string, () => void> = {
        j: () => moveCursor(1),
        k: () => moveCursor(-1),
        h: () => changeDay(-1),
        l: () => changeDay(1),
        v: () => {
          if (mode === 'visual') {
            setMode('normal');
            setVisualAnchor(null);
          } else {
            setMode('visual');
            setVisualAnchor(cursor);
          }
        },
        V: selectHour,
        y: () => copyOrCut('copy'),
        d: () => copyOrCut('cut'),
        x: remove,
        p: paste,
        u: undo,
        a: openAdd,
        Escape: () => {
          setMode('normal');
          setVisualAnchor(null);
        },
      };

      const command = commands[event.key];
      if (!command) return;
      event.preventDefault();
      command();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [changeDay, copyOrCut, cursor, mode, moveCursor, openAdd, paste, remove, selectHour, undo]);

  useEffect(() => () => {
    if (headerTimerRef.current !== null) window.clearTimeout(headerTimerRef.current);
    if (headerFrameRef.current !== null) window.cancelAnimationFrame(headerFrameRef.current);
    if (noticeTimerRef.current !== null) window.clearTimeout(noticeTimerRef.current);
  }, []);

  const status = notice || (mode === 'visual'
    ? `${selectedIndexes.length} selected · y copy · d cut · x delete · esc cancel`
    : register
      ? `${register.rows.length} in register · p paste · j/k move · h/l day · a add`
      : 'j/k move · h/l day · v visual · V hour · y copy · d cut · x delete · p paste · a add');

  return (
    <div className="bt-root">
      <style>{styles}</style>

      <section className="bt-terminal" aria-label="Balance terminal food log">
        <header className="bt-topbar">
          <div className="bt-path" aria-label={`Current buffer ${day.iso}`}>
            <span className="bt-path-prefix">balance://</span>
            <span className="bt-path-date">{displayedIso}</span>
            <span className={`bt-block-cursor${headerTyping ? ' is-active' : ''}`} aria-hidden="true" />
          </div>

          <div className="bt-day-nav">
            <button type="button" onClick={() => changeDay(-1)} disabled={dayIndex === 0}>h</button>
            <span>{dayIndex + 1}/{days.length}</span>
            <button type="button" onClick={() => changeDay(1)} disabled={dayIndex === days.length - 1}>l</button>
          </div>
        </header>

        <section className="bt-day-summary">
          <div className="bt-day-copy">
            <strong>{day.label}</strong>
            <span>{day.relation}</span>
          </div>
          <Metric value={totals.kcal} label="KCAL" accent />
          <Metric value={totals.protein} label="P" />
          <Metric value={totals.carbs} label="C" />
          <Metric value={totals.fat} label="F" />
        </section>

        <div className="bt-columns" aria-hidden="true">
          <span />
          <span className="bt-left">food</span>
          <span>qty</span>
          <span className="bt-kcal-col">kcal</span>
          <span>P</span>
          <span>C</span>
          <span>F</span>
        </div>

        <main key={bufferRevision} className="bt-buffer">
          {groups.map(([hour, items]) => {
            const groupTotals = sumRows(items.map(({ row }) => row));
            return (
              <section className="bt-group" key={hour}>
                <div className="bt-group-head">
                  <div className="bt-group-info">
                    <span className="bt-group-time">{hour}</span>
                    <span className="bt-group-count">{items.length} item{items.length === 1 ? '' : 's'}</span>
                  </div>
                  <span className="bt-group-stat bt-group-kcal"><span className="bt-sigma">Σ</span>{groupTotals.kcal} kcal</span>
                  <span className="bt-group-stat">{groupTotals.protein}P</span>
                  <span className="bt-group-stat">{groupTotals.carbs}C</span>
                  <span className="bt-group-stat">{groupTotals.fat}F</span>
                </div>

                {items.map(({ row, index }) => {
                  const isCursor = index === cursor;
                  const isSelected = mode === 'visual' && selectedSet.has(index);
                  return (
                    <button
                      type="button"
                      key={row.id}
                      className={`bt-food-row${isCursor ? ' is-cursor' : ''}${isSelected ? ' is-selected' : ''}`}
                      onClick={() => {
                        setCursor(index);
                        setMode('normal');
                        setVisualAnchor(null);
                      }}>
                      <span className="bt-pointer">{isCursor ? '>' : ''}</span>
                      <span className="bt-food-name">{row.name}</span>
                      <span className="bt-num">{row.quantity}</span>
                      <span className="bt-num bt-kcal-col">{row.kcal}</span>
                      <span className="bt-macro">{row.protein}</span>
                      <span className="bt-macro">{row.carbs}</span>
                      <span className="bt-macro">{row.fat}</span>
                    </button>
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
              <span>add&gt;</span>
              <input
                ref={inputRef}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setResultIndex(0);
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    closeAdd();
                  } else if (event.key === 'ArrowDown') {
                    event.preventDefault();
                    setResultIndex((current) => Math.min(filteredLibrary.length - 1, current + 1));
                  } else if (event.key === 'ArrowUp') {
                    event.preventDefault();
                    setResultIndex((current) => Math.max(0, current - 1));
                  } else if (event.key === 'Enter' && filteredLibrary[resultIndex]) {
                    event.preventDefault();
                    addFood(filteredLibrary[resultIndex]);
                  }
                }}
                placeholder="search library…"
                aria-label="Search food library"
              />
            </div>

            <div className="bt-results">
              {filteredLibrary.map((food, index) => (
                <button
                  type="button"
                  key={food.name}
                  className={index === resultIndex ? 'is-active' : ''}
                  onMouseEnter={() => setResultIndex(index)}
                  onClick={() => addFood(food)}>
                  <span>{index === resultIndex ? '>' : ' '}</span>
                  <span>{food.name}</span>
                  <span>{food.quantity}</span>
                  <span>{food.kcal} kcal · {food.protein}P {food.carbs}C {food.fat}F</span>
                </button>
              ))}
            </div>
          </section>
        )}

        <footer className="bt-statusbar">
          <div className="bt-status-left">
            <span className={`bt-mode bt-mode-${mode}`}>{mode.toUpperCase()}</span>
            <span className="bt-status-text">{status}</span>
          </div>
          <span className="bt-buffer-id">buffer {dayIndex + 1}/{days.length}</span>
        </footer>
      </section>
    </div>
  );
};

const Metric: React.FC<{ value: number; label: string; accent?: boolean }> = ({ value, label, accent }) => (
  <div className={`bt-stat${accent ? ' is-accent' : ''}`}>
    <strong>{Math.round(value)}</strong>
    <span>{label}</span>
  </div>
);

const styles = `
  .bt-root {
    --bt-bg: #090d0a;
    --bt-panel: #0d130f;
    --bt-group: #101a13;
    --bt-row: #152019;
    --bt-text: #d9e4dc;
    --bt-muted: #78847b;
    --bt-faint: #3e4941;
    --bt-accent: #72f1b8;
    --bt-selected: #173426;
    min-height: 100%;
    padding: 28px;
    background: #070a08;
    color: var(--bt-text);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
  }

  .bt-terminal {
    width: min(1020px, 100%);
    margin: 0 auto;
    overflow: hidden;
    border: 1px solid var(--bt-faint);
    border-radius: 9px;
    background: var(--bt-bg);
  }

  .bt-topbar,
  .bt-statusbar {
    min-height: 42px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 7px 12px;
    font-size: 12px;
  }

  .bt-topbar { border-bottom: 1px solid var(--bt-faint); }

  .bt-path {
    min-width: 0;
    display: flex;
    align-items: center;
    overflow: hidden;
    white-space: nowrap;
  }

  .bt-path-prefix { color: var(--bt-muted); }
  .bt-path-date { color: var(--bt-text); }

  .bt-block-cursor {
    display: none;
    width: 7px;
    height: 13px;
    margin-left: 2px;
    background: var(--bt-accent);
  }

  .bt-block-cursor.is-active {
    display: inline-block;
    animation: bt-blink 650ms steps(1) infinite;
  }

  @keyframes bt-blink { 50% { opacity: 0; } }

  .bt-day-nav {
    display: flex;
    align-items: center;
    gap: 8px;
    color: var(--bt-muted);
  }

  .bt-day-nav button {
    min-width: 28px;
    min-height: 25px;
    border: 1px solid var(--bt-faint);
    border-radius: 4px;
    background: transparent;
    color: inherit;
    font: inherit;
    cursor: pointer;
  }

  .bt-day-nav button:hover:not(:disabled) {
    border-color: var(--bt-accent);
    color: var(--bt-text);
  }

  .bt-day-nav button:disabled { opacity: 0.24; cursor: default; }

  .bt-day-summary {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 72px 44px 44px 44px;
    gap: 8px;
    align-items: end;
    padding: 14px;
    border-bottom: 1px solid var(--bt-faint);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  .bt-day-copy strong { display: block; font-weight: 500; }
  .bt-day-copy span { color: var(--bt-muted); font-size: 11px; }

  .bt-stat { text-align: right; }
  .bt-stat strong { display: block; font-weight: 500; }
  .bt-stat span { display: block; margin-top: 2px; color: var(--bt-faint); font-size: 9px; }
  .bt-stat.is-accent strong { color: var(--bt-accent); }

  .bt-columns,
  .bt-food-row {
    display: grid;
    grid-template-columns: 20px minmax(0, 1fr) 70px 58px 40px 40px 40px;
    gap: 7px;
    align-items: center;
  }

  .bt-columns {
    padding: 6px 12px 4px;
    color: var(--bt-faint);
    font-size: 9px;
    text-align: right;
    text-transform: uppercase;
  }

  .bt-left { text-align: left; }

  .bt-buffer {
    min-height: 410px;
    padding: 4px 6px 18px;
    animation: bt-buffer-in 90ms ease both;
  }

  @keyframes bt-buffer-in { from { opacity: 0.68; } to { opacity: 1; } }

  .bt-group { margin-top: 11px; }

  .bt-group-head {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto auto auto auto;
    gap: 12px;
    align-items: center;
    margin: 0 5px 3px;
    padding: 8px 10px;
    border-left: 2px solid var(--bt-accent);
    border-radius: 3px;
    background: var(--bt-group);
    color: var(--bt-muted);
    font-size: 11px;
    font-variant-numeric: tabular-nums;
  }

  .bt-group-info { display: flex; align-items: baseline; gap: 8px; min-width: 0; }
  .bt-group-time { color: var(--bt-accent); font-weight: 600; }
  .bt-group-count { font-size: 10px; letter-spacing: 0.05em; text-transform: uppercase; }
  .bt-group-stat { color: #9daa9f; text-align: right; white-space: nowrap; }
  .bt-group-kcal { color: var(--bt-text); }
  .bt-sigma { margin-right: 3px; color: var(--bt-muted); }

  .bt-food-row {
    width: calc(100% - 10px);
    min-height: 35px;
    margin: 0 5px;
    padding: 3px 10px 3px 12px;
    border: 0;
    border-radius: 3px;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 12px;
    text-align: left;
    cursor: pointer;
  }

  .bt-food-row:hover { background: #101712; }
  .bt-food-row.is-cursor { background: var(--bt-row); }
  .bt-food-row.is-selected { background: var(--bt-selected); color: #effff5; }
  .bt-pointer { color: var(--bt-accent); font-weight: 700; }
  .bt-food-name { padding-left: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .bt-num, .bt-macro { text-align: right; font-variant-numeric: tabular-nums; }
  .bt-num { color: var(--bt-muted); }
  .bt-macro { color: #9daa9f; }
  .bt-empty { padding: 30px 16px; color: var(--bt-muted); font-size: 12px; }

  .bt-command {
    border-top: 1px solid var(--bt-faint);
    background: #080c09;
  }

  .bt-command-line {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 40px;
    padding: 7px 12px;
    color: var(--bt-accent);
    font-size: 12px;
  }

  .bt-command-line input {
    flex: 1;
    min-width: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--bt-text);
    font: inherit;
  }

  .bt-command-line input::placeholder { color: var(--bt-faint); }

  .bt-results {
    padding: 0 6px 7px;
  }

  .bt-results button {
    width: 100%;
    min-height: 32px;
    display: grid;
    grid-template-columns: 18px minmax(0, 1fr) 80px auto;
    gap: 8px;
    align-items: center;
    padding: 3px 7px;
    border: 0;
    border-radius: 3px;
    background: transparent;
    color: var(--bt-muted);
    font: inherit;
    font-size: 11px;
    text-align: left;
    cursor: pointer;
  }

  .bt-results button.is-active { background: var(--bt-row); color: var(--bt-text); }
  .bt-results button span:nth-child(1) { color: var(--bt-accent); }
  .bt-results button span:nth-child(3),
  .bt-results button span:nth-child(4) { text-align: right; }

  .bt-statusbar {
    border-top: 1px solid var(--bt-faint);
    background: var(--bt-panel);
    font-size: 11px;
  }

  .bt-status-left { display: flex; align-items: center; gap: 9px; min-width: 0; }

  .bt-mode {
    flex: 0 0 auto;
    padding: 2px 6px;
    background: var(--bt-accent);
    color: #08100b;
    font-weight: 700;
  }

  .bt-mode-visual { background: #f5d76e; color: #17160c; }
  .bt-mode-insert { background: #8cc8ff; color: #08121b; }

  .bt-status-text {
    min-width: 0;
    overflow: hidden;
    color: var(--bt-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .bt-buffer-id { color: var(--bt-faint); white-space: nowrap; }

  @media (max-width: 680px) {
    .bt-root { padding: 12px; }
    .bt-food-row, .bt-columns { grid-template-columns: 18px minmax(0, 1fr) 54px 38px 38px 38px; }
    .bt-food-row .bt-kcal-col, .bt-columns .bt-kcal-col { display: none; }
    .bt-group-head { grid-template-columns: minmax(0, 1fr) auto auto auto; }
    .bt-group-kcal { display: none; }
    .bt-day-summary { grid-template-columns: minmax(0, 1fr) 44px 44px 44px; }
    .bt-stat.is-accent { display: none; }
    .bt-results button { grid-template-columns: 18px minmax(0, 1fr) auto; }
    .bt-results button span:nth-child(4) { display: none; }
    .bt-buffer-id { display: none; }
  }
`;
