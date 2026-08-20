import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { Clipboard, Copy, Plus, RotateCcw, Scissors, Search, Trash2 } from 'lucide-react';

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
  label: string;
  relation: string;
  rows: FoodRow[];
};

type Register = {
  kind: 'copy' | 'cut';
  rows: FoodRow[];
} | null;

const INITIAL_DAYS: DayLog[] = [
  {
    label: 'Martes 18',
    relation: 'Ayer',
    rows: [
      { id: 't1', time: '07:20', name: 'Avena tradicional', quantity: '80 g', kcal: 311, protein: 10, carbs: 53, fat: 6 },
      { id: 't2', time: '07:20', name: 'Whey vainilla', quantity: '30 g', kcal: 118, protein: 24, carbs: 2, fat: 2 },
      { id: 't3', time: '13:18', name: 'Pechuga de pollo', quantity: '150 g', kcal: 248, protein: 46, carbs: 0, fat: 5 },
      { id: 't4', time: '13:18', name: 'Arroz integral', quantity: '300 g', kcal: 390, protein: 8, carbs: 82, fat: 3 },
    ],
  },
  {
    label: 'Miércoles 19',
    relation: 'Hoy',
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
    label: 'Jueves 20',
    relation: 'Mañana',
    rows: [
      { id: 'h1', time: '07:10', name: 'Avena tradicional', quantity: '80 g', kcal: 311, protein: 10, carbs: 53, fat: 6 },
      { id: 'h2', time: '13:30', name: 'Pechuga de pollo', quantity: '150 g', kcal: 248, protein: 46, carbs: 0, fat: 5 },
    ],
  },
];

const LIBRARY: Omit<FoodRow, 'id' | 'time'>[] = [
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

const groupByMoment = (rows: FoodRow[]) => {
  const groups: Array<{ time: string; rows: Array<{ row: FoodRow; index: number }> }> = [];
  let lastMinutes: number | null = null;
  let current: (typeof groups)[number] | null = null;

  rows.forEach((row, index) => {
    const [hour, minute] = row.time.split(':').map(Number);
    const minutes = hour * 60 + minute;

    if (lastMinutes === null || minutes - lastMinutes > 20) {
      current = { time: row.time, rows: [] };
      groups.push(current);
    }

    current?.rows.push({ row, index });
    lastMinutes = minutes;
  });

  return groups;
};

export const BalanceVimLog: React.FC = () => {
  const [days, setDays] = useState(() => cloneDays(INITIAL_DAYS));
  const [dayIndex, setDayIndex] = useState(1);
  const [cursor, setCursor] = useState(2);
  const [mode, setMode] = useState<Mode>('normal');
  const [visualAnchor, setVisualAnchor] = useState<number | null>(null);
  const [register, setRegister] = useState<Register>(null);
  const [history, setHistory] = useState<DayLog[][]>([]);
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const day = days[dayIndex];
  const rows = day.rows;

  const selectedIndexes = useMemo(() => {
    if (!rows.length) return [];
    if (mode !== 'visual' || visualAnchor === null) return [cursor];

    const from = Math.min(visualAnchor, cursor);
    const to = Math.max(visualAnchor, cursor);
    return Array.from({ length: to - from + 1 }, (_, index) => from + index);
  }, [cursor, mode, rows.length, visualAnchor]);

  const selected = useMemo(() => new Set(selectedIndexes), [selectedIndexes]);

  const totals = useMemo(
    () => rows.reduce(
      (acc, row) => ({
        kcal: acc.kcal + row.kcal,
        protein: acc.protein + row.protein,
        carbs: acc.carbs + row.carbs,
        fat: acc.fat + row.fat,
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    ),
    [rows]
  );

  const filteredLibrary = useMemo(() => {
    const query = search.trim().toLowerCase();
    return LIBRARY.filter((item) => item.name.toLowerCase().includes(query)).slice(0, 6);
  }, [search]);

  const checkpoint = useCallback(() => {
    setHistory((previous) => [...previous.slice(-19), cloneDays(days)]);
  }, [days]);

  const flash = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 1400);
  }, []);

  const changeDay = useCallback((delta: number) => {
    setDayIndex((current) => {
      const next = Math.max(0, Math.min(days.length - 1, current + delta));
      const nextLength = days[next].rows.length;
      setCursor((value) => Math.min(value, Math.max(0, nextLength - 1)));
      setMode('normal');
      setVisualAnchor(null);
      return next;
    });
  }, [days]);

  const moveCursor = useCallback((delta: number) => {
    if (!rows.length) return;
    setCursor((current) => Math.max(0, Math.min(rows.length - 1, current + delta)));
  }, [rows.length]);

  const copyOrCut = useCallback((kind: 'copy' | 'cut') => {
    if (!selectedIndexes.length) return;

    const picked = selectedIndexes.map((index) => ({ ...rows[index] }));
    setRegister({ kind, rows: picked });

    if (kind === 'cut') {
      checkpoint();
      setDays((current) => current.map((item, index) =>
        index === dayIndex
          ? { ...item, rows: item.rows.filter((_, rowIndex) => !selected.has(rowIndex)) }
          : item
      ));
      setCursor(Math.min(selectedIndexes[0], Math.max(0, rows.length - selectedIndexes.length - 1)));
    }

    setMode('normal');
    setVisualAnchor(null);
    flash(`${picked.length} registro${picked.length === 1 ? '' : 's'} ${kind === 'copy' ? 'copiado' : 'cortado'}`);
  }, [checkpoint, dayIndex, flash, rows, selected, selectedIndexes]);

  const remove = useCallback(() => {
    if (!selectedIndexes.length) return;

    checkpoint();
    setDays((current) => current.map((item, index) =>
      index === dayIndex
        ? { ...item, rows: item.rows.filter((_, rowIndex) => !selected.has(rowIndex)) }
        : item
    ));
    setCursor(Math.min(selectedIndexes[0], Math.max(0, rows.length - selectedIndexes.length - 1)));
    setMode('normal');
    setVisualAnchor(null);
    flash(`${selectedIndexes.length} registro${selectedIndexes.length === 1 ? '' : 's'} eliminado`);
  }, [checkpoint, dayIndex, flash, rows.length, selected, selectedIndexes]);

  const paste = useCallback(() => {
    if (!register?.rows.length) {
      flash('El register está vacío');
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
    flash(`${pasted.length} registro${pasted.length === 1 ? '' : 's'} pegado`);
  }, [checkpoint, cursor, dayIndex, flash, register, rows.length]);

  const undo = useCallback(() => {
    const previous = history.at(-1);
    if (!previous) {
      flash('Nada que deshacer');
      return;
    }

    setDays(cloneDays(previous));
    setHistory((items) => items.slice(0, -1));
    setMode('normal');
    setVisualAnchor(null);
    setCursor((value) => Math.min(value, Math.max(0, previous[dayIndex].rows.length - 1)));
    flash('Deshecho');
  }, [dayIndex, flash, history]);

  const addFood = useCallback((food: (typeof LIBRARY)[number]) => {
    checkpoint();
    const position = rows.length ? Math.min(cursor + 1, rows.length) : 0;
    const currentTime = rows[cursor]?.time ?? '12:00';
    const next: FoodRow = {
      ...food,
      id: crypto.randomUUID(),
      time: currentTime,
    };

    setDays((current) => current.map((item, index) => {
      if (index !== dayIndex) return item;
      const nextRows = [...item.rows];
      nextRows.splice(position, 0, next);
      return { ...item, rows: nextRows };
    }));

    setCursor(position);
    setMode('normal');
    setSearch('');
    flash(`${food.name} agregado`);
  }, [checkpoint, cursor, dayIndex, flash, rows]);

  const openAdd = useCallback(() => {
    setMode('insert');
    setSearch('');
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (mode === 'insert') return;
      if (typing || event.metaKey || event.ctrlKey || event.altKey) return;

      const commands: Record<string, () => void> = {
        j: () => moveCursor(1),
        k: () => moveCursor(-1),
        h: () => changeDay(-1),
        l: () => changeDay(1),
        v: () => {
          setMode((current) => {
            if (current === 'visual') {
              setVisualAnchor(null);
              return 'normal';
            }
            setVisualAnchor(cursor);
            return 'visual';
          });
        },
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
  }, [changeDay, copyOrCut, cursor, mode, moveCursor, openAdd, paste, remove, undo]);

  return (
    <div className="bvl-root">
      <style>{styles}</style>

      <div className="bvl-app">
        <header className="bvl-topbar">
          <div className="bvl-brand">balance/food-log</div>
          <div className="bvl-top-hints" aria-label="Atajos principales">
            <span><Key>/</Key> buscar</span>
            <span><Key>:</Key> comandos</span>
            <span><Key>?</Key> ayuda</span>
          </div>
        </header>

        <section className="bvl-day-nav">
          <button
            type="button"
            className="bvl-day-side bvl-day-prev"
            onClick={() => changeDay(-1)}
            disabled={dayIndex === 0}>
            <Key>h</Key>
            <span>{days[Math.max(0, dayIndex - 1)].label}</span>
          </button>

          <div className="bvl-day-main">
            <div className="bvl-relation">{day.relation}</div>
            <h2>{day.label}</h2>
            <div className="bvl-scribble" />
          </div>

          <button
            type="button"
            className="bvl-day-side bvl-day-next"
            onClick={() => changeDay(1)}
            disabled={dayIndex === days.length - 1}>
            <span>{days[Math.min(days.length - 1, dayIndex + 1)].label}</span>
            <Key>l</Key>
          </button>
        </section>

        <section className="bvl-summary" aria-label="Resumen nutricional">
          <Macro value={totals.kcal} label="kcal" />
          <Macro value={totals.protein} label="protein" />
          <Macro value={totals.carbs} label="carbs" />
          <Macro value={totals.fat} label="fat" />
        </section>

        <main className="bvl-timeline">
          {groupByMoment(rows).map((group) => (
            <section key={`${group.time}-${group.rows[0]?.row.id}`} className="bvl-moment">
              <div className="bvl-time">{group.time}</div>

              <div className="bvl-moment-rows">
                {group.rows.map(({ row, index }) => {
                  const isCursor = index === cursor;
                  const isSelected = mode === 'visual' && selected.has(index);

                  return (
                    <button
                      type="button"
                      key={row.id}
                      className={`bvl-row${isCursor ? ' is-cursor' : ''}${isSelected ? ' is-selected' : ''}`}
                      onClick={() => {
                        setCursor(index);
                        setMode('normal');
                        setVisualAnchor(null);
                      }}>
                      <span className="bvl-gutter" />
                      <span className="bvl-food-copy">
                        <span className="bvl-food-name">{row.name}</span>
                        <span className="bvl-food-meta">{row.protein}P · {row.carbs}C · {row.fat}F</span>
                      </span>
                      <span className="bvl-quantity">{row.quantity}</span>
                      <span className="bvl-kcal">{row.kcal} kcal</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          {!rows.length && (
            <button type="button" className="bvl-empty" onClick={openAdd}>
              Día vacío. Presiona <Key>a</Key> para agregar el primer alimento.
            </button>
          )}
        </main>

        <footer className="bvl-statusbar">
          <div className="bvl-status-left">
            <span className={`bvl-mode bvl-mode-${mode}`}>{mode.toUpperCase()}</span>
            <span className="bvl-status-text">
              {notice || (mode === 'visual'
                ? `${selectedIndexes.length} items · ${selectedIndexes.reduce((sum, index) => sum + (rows[index]?.kcal ?? 0), 0)} kcal seleccionadas`
                : register
                  ? `${register.rows.length} item${register.rows.length === 1 ? '' : 's'} en register · p para pegar`
                  : 'j/k navegar · h/l día · v visual · y copiar · d cortar · x eliminar · p pegar')}
            </span>
          </div>

          <div className="bvl-actions">
            <Action icon={<Copy size={13} />} label="y copy" onClick={() => copyOrCut('copy')} />
            <Action icon={<Scissors size={13} />} label="d cut" onClick={() => copyOrCut('cut')} />
            <Action icon={<Trash2 size={13} />} label="x delete" onClick={remove} />
            <Action icon={<Clipboard size={13} />} label="p paste" onClick={paste} />
            <Action icon={<RotateCcw size={13} />} label="u undo" onClick={undo} />
            <Action icon={<Plus size={13} />} label="a add" onClick={openAdd} />
          </div>
        </footer>
      </div>

      <Dialog.Root
        open={mode === 'insert'}
        onOpenChange={(open) => {
          if (!open) {
            setMode('normal');
            setSearch('');
          }
        }}>
        <Dialog.Portal>
          <Dialog.Backdrop className="bvl-dialog-backdrop" />
          <Dialog.Viewport className="bvl-dialog-viewport">
            <Dialog.Popup className="bvl-dialog" initialFocus={searchRef}>
              <div className="bvl-dialog-heading">
                <div>
                  <Dialog.Title className="bvl-dialog-title">Add food</Dialog.Title>
                  <Dialog.Description className="bvl-dialog-description">
                    Busca en tu biblioteca y agrega un alimento al registro actual.
                  </Dialog.Description>
                </div>
                <Key>esc</Key>
              </div>

              <div className="bvl-search-wrap">
                <Search size={16} />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="avena, pollo, arroz…"
                  className="bvl-search"
                />
              </div>

              <div className="bvl-results">
                <div className="bvl-result-section">RECENT / MATCHES</div>
                {filteredLibrary.map((food, index) => (
                  <button
                    type="button"
                    key={food.name}
                    className="bvl-result"
                    onClick={() => addFood(food)}>
                    <span className="bvl-result-index">{index + 1}</span>
                    <span className="bvl-result-name">{food.name}</span>
                    <span className="bvl-result-meta">{food.quantity} · {food.kcal} kcal</span>
                  </button>
                ))}
              </div>

              <div className="bvl-dialog-footer">
                <span><Key>↑</Key><Key>↓</Key> seleccionar</span>
                <span><Key>↵</Key> agregar</span>
                <span><Key>esc</Key> cancelar</span>
              </div>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
};

const Key: React.FC<React.PropsWithChildren> = ({ children }) => (
  <kbd className="bvl-key">{children}</kbd>
);

const Macro: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="bvl-macro">
    <strong>{Math.round(value)}</strong>
    <span>{label}</span>
  </div>
);

const Action: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button type="button" className="bvl-action" onClick={onClick}>
    {icon}
    <span>{label}</span>
  </button>
);

const styles = `
  .bvl-root {
    --bvl-bg: #f3f4f6;
    --bvl-panel: #ffffff;
    --bvl-panel-soft: #fafbfc;
    --bvl-text: #17191d;
    --bvl-muted: #7b808a;
    --bvl-faint: #a9afb8;
    --bvl-line: #e2e5e9;
    --bvl-line-strong: #cfd4db;
    --bvl-accent: #4f7cff;
    --bvl-accent-soft: #edf2ff;
    --bvl-accent-line: #a9bcff;
    min-height: 100%;
    padding: 34px;
    background: var(--bvl-bg);
    color: var(--bvl-text);
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }

  .bvl-app {
    width: min(1080px, 100%);
    min-height: calc(100vh - 116px);
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid var(--bvl-line-strong);
    border-radius: 18px;
    background: var(--bvl-panel);
    box-shadow: 0 18px 55px rgba(21, 28, 38, 0.08);
  }

  .bvl-topbar {
    min-height: 52px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    padding: 0 18px;
    border-bottom: 1px solid var(--bvl-line);
    background: var(--bvl-panel-soft);
  }

  .bvl-brand,
  .bvl-key,
  .bvl-top-hints,
  .bvl-relation,
  .bvl-time,
  .bvl-food-meta,
  .bvl-quantity,
  .bvl-kcal,
  .bvl-statusbar,
  .bvl-dialog,
  .bvl-macro {
    font-family: "JetBrains Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace;
  }

  .bvl-brand {
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: -0.02em;
  }

  .bvl-top-hints {
    display: flex;
    align-items: center;
    gap: 16px;
    color: var(--bvl-muted);
    font-size: 0.66rem;
  }

  .bvl-top-hints > span {
    display: inline-flex;
    align-items: center;
    gap: 5px;
  }

  .bvl-key {
    display: inline-flex;
    min-width: 22px;
    height: 22px;
    align-items: center;
    justify-content: center;
    padding: 0 6px;
    border: 1px solid var(--bvl-line-strong);
    border-bottom-width: 2px;
    border-radius: 6px;
    background: #fff;
    color: #616772;
    font-size: 0.64rem;
    line-height: 1;
    box-shadow: 0 1px 0 rgba(20, 25, 32, 0.03);
  }

  .bvl-day-nav {
    display: grid;
    grid-template-columns: 1fr minmax(250px, 330px) 1fr;
    align-items: center;
    gap: 24px;
    padding: 34px 34px 23px;
  }

  .bvl-day-side {
    display: flex;
    align-items: center;
    gap: 10px;
    border: 0;
    background: transparent;
    color: var(--bvl-muted);
    font: inherit;
    font-size: 0.78rem;
    cursor: pointer;
  }

  .bvl-day-side:disabled {
    opacity: 0.28;
    cursor: default;
  }

  .bvl-day-prev { justify-content: flex-end; }
  .bvl-day-next { justify-content: flex-start; }

  .bvl-day-main {
    text-align: center;
  }

  .bvl-relation {
    color: var(--bvl-accent);
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  .bvl-day-main h2 {
    margin: 4px 0 0;
    font-size: clamp(1.55rem, 3vw, 2.05rem);
    font-weight: 760;
    letter-spacing: -0.05em;
  }

  .bvl-scribble {
    width: 132px;
    height: 7px;
    margin: 5px auto 0;
    border-top: 3px solid var(--bvl-accent);
    border-radius: 52% 41% 58% 44%;
    transform: rotate(-1.2deg);
    opacity: 0.86;
  }

  .bvl-summary {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 0;
    padding: 0 30px 22px;
  }

  .bvl-macro {
    padding: 12px 16px 11px;
    border-top: 1px solid var(--bvl-line);
    text-align: center;
  }

  .bvl-macro + .bvl-macro {
    border-left: 1px solid transparent;
  }

  .bvl-macro strong {
    display: block;
    font-size: 1.18rem;
    font-weight: 750;
    letter-spacing: -0.045em;
  }

  .bvl-macro span {
    display: block;
    margin-top: 3px;
    color: var(--bvl-muted);
    font-size: 0.61rem;
    letter-spacing: 0.09em;
    text-transform: uppercase;
  }

  .bvl-timeline {
    width: min(900px, calc(100% - 52px));
    flex: 1;
    margin: 0 auto;
    padding: 18px 0 82px;
  }

  .bvl-moment {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 14px;
    margin-bottom: 17px;
  }

  .bvl-time {
    padding-top: 17px;
    color: var(--bvl-muted);
    font-size: 0.67rem;
    text-align: right;
  }

  .bvl-moment-rows {
    min-width: 0;
  }

  .bvl-row {
    width: 100%;
    min-height: 54px;
    display: grid;
    grid-template-columns: 6px minmax(0, 1fr) 96px 82px;
    align-items: center;
    gap: 12px;
    padding: 7px 11px 7px 8px;
    border: 1px solid transparent;
    border-radius: 11px;
    background: transparent;
    color: var(--bvl-text);
    font: inherit;
    text-align: left;
    cursor: pointer;
    transition: background 100ms ease, border-color 100ms ease;
  }

  .bvl-row:hover {
    background: #fafbfc;
  }

  .bvl-row.is-cursor {
    border-color: var(--bvl-line-strong);
    background: var(--bvl-panel-soft);
  }

  .bvl-row.is-selected {
    border-color: var(--bvl-accent-line);
    background: var(--bvl-accent-soft);
  }

  .bvl-gutter {
    width: 5px;
    height: 29px;
    justify-self: center;
    border-radius: 99px;
    background: transparent;
  }

  .bvl-row.is-cursor .bvl-gutter,
  .bvl-row.is-selected .bvl-gutter {
    background: var(--bvl-accent);
  }

  .bvl-food-copy {
    min-width: 0;
  }

  .bvl-food-name {
    display: block;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 0.88rem;
    font-weight: 650;
    letter-spacing: -0.018em;
  }

  .bvl-food-meta {
    display: block;
    margin-top: 4px;
    color: var(--bvl-faint);
    font-size: 0.61rem;
  }

  .bvl-quantity,
  .bvl-kcal {
    color: #5f6570;
    font-size: 0.7rem;
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .bvl-kcal {
    color: var(--bvl-muted);
  }

  .bvl-empty {
    width: 100%;
    padding: 42px 20px;
    border: 1px dashed var(--bvl-line-strong);
    border-radius: 12px;
    background: transparent;
    color: var(--bvl-muted);
    cursor: pointer;
  }

  .bvl-statusbar {
    min-height: 48px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 8px 11px;
    border-top: 1px solid var(--bvl-line);
    background: var(--bvl-panel-soft);
    font-size: 0.65rem;
  }

  .bvl-status-left {
    min-width: 0;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .bvl-mode {
    flex: 0 0 auto;
    padding: 5px 8px;
    border-radius: 6px;
    background: #1f2329;
    color: #fff;
    font-weight: 750;
    letter-spacing: 0.06em;
  }

  .bvl-mode-visual,
  .bvl-mode-insert {
    background: var(--bvl-accent);
  }

  .bvl-status-text {
    overflow: hidden;
    color: var(--bvl-muted);
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .bvl-actions {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .bvl-action {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    min-height: 29px;
    padding: 0 7px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: var(--bvl-muted);
    font: inherit;
    cursor: pointer;
  }

  .bvl-action:hover {
    background: #eef0f3;
    color: var(--bvl-text);
  }

  .bvl-dialog-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    background: rgba(20, 24, 31, 0.28);
    backdrop-filter: blur(3px);
  }

  .bvl-dialog-viewport {
    position: fixed;
    inset: 0;
    z-index: 101;
    display: grid;
    place-items: start center;
    padding: 110px 20px 30px;
  }

  .bvl-dialog {
    width: min(560px, 100%);
    overflow: hidden;
    border: 1px solid var(--bvl-line-strong);
    border-radius: 15px;
    background: #fff;
    color: var(--bvl-text);
    box-shadow: 0 28px 80px rgba(16, 21, 29, 0.2);
  }

  .bvl-dialog-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    padding: 17px 17px 12px;
  }

  .bvl-dialog-title {
    margin: 0;
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: -0.025em;
  }

  .bvl-dialog-description {
    margin: 4px 0 0;
    color: var(--bvl-muted);
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    font-size: 0.73rem;
  }

  .bvl-search-wrap {
    display: flex;
    align-items: center;
    gap: 9px;
    margin: 0 12px;
    padding: 0 11px;
    border: 1px solid var(--bvl-line-strong);
    border-radius: 10px;
    color: var(--bvl-muted);
  }

  .bvl-search-wrap:focus-within {
    border-color: var(--bvl-accent);
    box-shadow: 0 0 0 3px var(--bvl-accent-soft);
  }

  .bvl-search {
    width: 100%;
    min-width: 0;
    height: 42px;
    padding: 0;
    border: 0;
    outline: 0;
    background: transparent;
    color: var(--bvl-text);
    font: inherit;
    font-size: 0.82rem;
  }

  .bvl-search::placeholder {
    color: var(--bvl-faint);
  }

  .bvl-results {
    padding: 9px 7px 8px;
  }

  .bvl-result-section {
    padding: 5px 10px 7px;
    color: var(--bvl-faint);
    font-size: 0.58rem;
    letter-spacing: 0.09em;
  }

  .bvl-result {
    width: 100%;
    min-height: 42px;
    display: grid;
    grid-template-columns: 28px minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
    padding: 6px 9px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--bvl-text);
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .bvl-result:hover,
  .bvl-result:focus-visible {
    outline: 0;
    background: var(--bvl-accent-soft);
  }

  .bvl-result-index {
    color: var(--bvl-faint);
    font-size: 0.62rem;
  }

  .bvl-result-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: Inter, ui-sans-serif, system-ui, sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
  }

  .bvl-result-meta {
    color: var(--bvl-muted);
    font-size: 0.62rem;
  }

  .bvl-dialog-footer {
    display: flex;
    flex-wrap: wrap;
    gap: 13px;
    padding: 9px 12px;
    border-top: 1px solid var(--bvl-line);
    background: var(--bvl-panel-soft);
    color: var(--bvl-muted);
    font-size: 0.6rem;
  }

  .bvl-dialog-footer > span {
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }

  @media (max-width: 760px) {
    .bvl-root { padding: 14px; }
    .bvl-app { min-height: calc(100vh - 76px); border-radius: 13px; }
    .bvl-top-hints { display: none; }
    .bvl-day-nav { grid-template-columns: 1fr; gap: 8px; padding: 25px 18px 17px; }
    .bvl-day-side { display: none; }
    .bvl-summary { grid-template-columns: repeat(2, 1fr); padding-inline: 16px; }
    .bvl-timeline { width: calc(100% - 24px); }
    .bvl-moment { grid-template-columns: 45px minmax(0, 1fr); gap: 7px; }
    .bvl-row { grid-template-columns: 5px minmax(0, 1fr) 68px; gap: 8px; padding-inline: 5px 8px; }
    .bvl-kcal { display: none; }
    .bvl-actions { display: none; }
    .bvl-status-text { white-space: normal; }
    .bvl-dialog-viewport { padding-top: 70px; }
  }
`;
