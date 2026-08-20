import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Clipboard, Copy, Plus, RotateCcw, Scissors, Trash2 } from 'lucide-react';

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

const cloneDays = (days: DayLog[]) => days.map((day) => ({ ...day, rows: day.rows.map((row) => ({ ...row })) }));

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
    () =>
      rows.reduce(
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
    return LIBRARY.filter((item) => item.name.toLowerCase().includes(query)).slice(0, 5);
  }, [search]);

  const checkpoint = useCallback(() => {
    setHistory((previous) => [...previous.slice(-19), cloneDays(days)]);
  }, [days]);

  const flash = useCallback((message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 1300);
  }, []);

  const changeDay = useCallback(
    (delta: number) => {
      setDayIndex((current) => {
        const next = Math.max(0, Math.min(days.length - 1, current + delta));
        const nextLength = days[next].rows.length;
        setCursor((value) => Math.min(value, Math.max(0, nextLength - 1)));
        setMode('normal');
        setVisualAnchor(null);
        return next;
      });
    },
    [days]
  );

  const moveCursor = useCallback(
    (delta: number) => {
      if (!rows.length) return;
      setCursor((current) => Math.max(0, Math.min(rows.length - 1, current + delta)));
    },
    [rows.length]
  );

  const copyOrCut = useCallback(
    (kind: 'copy' | 'cut') => {
      if (!selectedIndexes.length) return;
      const picked = selectedIndexes.map((index) => ({ ...rows[index] }));
      setRegister({ kind, rows: picked });

      if (kind === 'cut') {
        checkpoint();
        setDays((current) =>
          current.map((item, index) =>
            index === dayIndex
              ? { ...item, rows: item.rows.filter((_, rowIndex) => !selected.has(rowIndex)) }
              : item
          )
        );
        setCursor(Math.min(selectedIndexes[0], Math.max(0, rows.length - selectedIndexes.length - 1)));
      }

      setMode('normal');
      setVisualAnchor(null);
      flash(`${picked.length} registro${picked.length === 1 ? '' : 's'} ${kind === 'copy' ? 'copiado' : 'cortado'}`);
    }, [checkpoint, dayIndex, flash, rows, selected, selectedIndexes]);

  const remove = useCallback(() => {
    if (!selectedIndexes.length) return;
    checkpoint();
    setDays((current) =>
      current.map((item, index) =>
        index === dayIndex
          ? { ...item, rows: item.rows.filter((_, rowIndex) => !selected.has(rowIndex)) }
          : item
      )
    );
    setCursor(Math.min(selectedIndexes[0], Math.max(0, rows.length - selectedIndexes.length - 1)));
    setMode('normal');
    setVisualAnchor(null);
    flash(`${selectedIndexes.length} registro${selectedIndexes.length === 1 ? '' : 's'} eliminado`);
  }, [checkpoint, dayIndex, flash, rows.length, selected, selectedIndexes]);

  const paste = useCallback(() => {
    if (!register?.rows.length) {
      flash('El registro está vacío');
      return;
    }

    checkpoint();
    const position = rows.length ? Math.min(cursor + 1, rows.length) : 0;
    const pasted = register.rows.map((row) => ({
      ...row,
      id: register.kind === 'cut' ? row.id : `${row.id}-${Date.now()}-${Math.random()}`,
    }));

    setDays((current) =>
      current.map((item, index) => {
        if (index !== dayIndex) return item;
        const nextRows = [...item.rows];
        nextRows.splice(position, 0, ...pasted);
        return { ...item, rows: nextRows };
      })
    );
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

  const addFood = useCallback(
    (food: (typeof LIBRARY)[number]) => {
      checkpoint();
      const position = rows.length ? Math.min(cursor + 1, rows.length) : 0;
      const currentTime = rows[cursor]?.time ?? '12:00';
      const next: FoodRow = {
        ...food,
        id: `new-${Date.now()}`,
        time: currentTime,
      };
      setDays((current) =>
        current.map((item, index) => {
          if (index !== dayIndex) return item;
          const nextRows = [...item.rows];
          nextRows.splice(position, 0, next);
          return { ...item, rows: nextRows };
        })
      );
      setCursor(position);
      setMode('normal');
      setSearch('');
      flash(`${food.name} agregado`);
    }, [checkpoint, cursor, dayIndex, flash, rows]
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA';

      if (mode === 'insert') {
        if (event.key === 'Escape') {
          event.preventDefault();
          setMode('normal');
          setSearch('');
        }
        return;
      }

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
        a: () => {
          setMode('insert');
          window.setTimeout(() => document.getElementById('balance-vim-search')?.focus(), 0);
        },
        Escape: () => {
          setMode('normal');
          setVisualAnchor(null);
        },
      };

      const command = commands[event.key];
      if (command) {
        event.preventDefault();
        command();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [changeDay, copyOrCut, cursor, mode, moveCursor, paste, remove, undo]);

  return (
    <div className="skin skin-tabla" style={pageStyle}>
      <div style={appStyle}>
        <header style={headerStyle}>
          <div>
            <div style={eyebrowStyle}>BALANCE / DAILY BUFFER</div>
            <div style={brandStyle}>registro.</div>
          </div>
          <div style={headerHelpStyle}>
            <Key>j</Key><Key>k</Key> mover&nbsp;&nbsp; <Key>v</Key> seleccionar&nbsp;&nbsp; <Key>a</Key> agregar
          </div>
        </header>

        <section style={dateNavStyle}>
          <button type="button" style={navButtonStyle} onClick={() => changeDay(-1)} disabled={dayIndex === 0}>
            <span style={navHintStyle}>h</span>
            {days[Math.max(0, dayIndex - 1)].label}
          </button>

          <div style={{ textAlign: 'center' }}>
            <div style={relationStyle}>{day.relation}</div>
            <div style={dateStyle}>{day.label}</div>
            <div style={markerStyle} />
          </div>

          <button type="button" style={navButtonStyle} onClick={() => changeDay(1)} disabled={dayIndex === days.length - 1}>
            {days[Math.min(days.length - 1, dayIndex + 1)].label}
            <span style={navHintStyle}>l</span>
          </button>
        </section>

        <section style={macroGridStyle}>
          <Macro value={totals.kcal} label="kcal" />
          <Macro value={totals.protein} label="protein" />
          <Macro value={totals.carbs} label="carbs" />
          <Macro value={totals.fat} label="fat" />
        </section>

        <main style={timelineStyle}>
          {groupByMoment(rows).map((group) => (
            <section key={`${group.time}-${group.rows[0]?.row.id}`} style={momentStyle}>
              <div style={timeStyle}>{group.time}</div>
              <div>
                {group.rows.map(({ row, index }) => {
                  const isCursor = index === cursor;
                  const isSelected = mode === 'visual' && selected.has(index);
                  return (
                    <button
                      type="button"
                      key={row.id}
                      onClick={() => {
                        setCursor(index);
                        setMode('normal');
                        setVisualAnchor(null);
                      }}
                      style={{
                        ...rowStyle,
                        ...(isCursor ? cursorRowStyle : {}),
                        ...(isSelected ? selectedRowStyle : {}),
                      }}>
                      <span style={{ ...gutterStyle, opacity: isCursor || isSelected ? 1 : 0.18 }} />
                      <span style={{ minWidth: 0 }}>
                        <span style={foodNameStyle}>{row.name}</span>
                        <span style={foodMetaStyle}>{row.protein}P · {row.carbs}C · {row.fat}F</span>
                      </span>
                      <span style={quantityStyle}>{row.quantity}</span>
                      <span style={calorieStyle}>{row.kcal}</span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}

          {!rows.length && (
            <button type="button" style={emptyStyle} onClick={() => setMode('insert')}>
              Día vacío. Presiona <Key>a</Key> para agregar el primer alimento.
            </button>
          )}
        </main>

        {mode === 'insert' && (
          <section style={paletteStyle}>
            <div style={paletteLabelStyle}>ADD FOOD</div>
            <input
              id="balance-vim-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="buscar biblioteca…"
              style={searchStyle}
            />
            <div style={resultsStyle}>
              {filteredLibrary.map((food, index) => (
                <button type="button" key={food.name} style={resultStyle} onClick={() => addFood(food)}>
                  <span><span style={resultNumberStyle}>{index + 1}</span>{food.name}</span>
                  <span style={resultMetaStyle}>{food.quantity} · {food.kcal} kcal</span>
                </button>
              ))}
            </div>
            <div style={paletteFooterStyle}><Key>esc</Key> cancelar · click para agregar</div>
          </section>
        )}

        <footer style={statusStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <span style={{ ...modeStyle, ...(mode === 'visual' ? visualModeStyle : {}) }}>{mode.toUpperCase()}</span>
            <span style={statusTextStyle}>
              {notice || (mode === 'visual'
                ? `${selectedIndexes.length} items · ${selectedIndexes.reduce((sum, index) => sum + (rows[index]?.kcal ?? 0), 0)} kcal`
                : register
                  ? `${register.rows.length} item${register.rows.length === 1 ? '' : 's'} en register · p para pegar`
                  : 'j/k navegar · h/l día · v visual · y copiar · d cortar · x eliminar · p pegar')}
            </span>
          </div>

          <div style={actionStripStyle}>
            <Action icon={<Copy size={14} />} label="y copy" onClick={() => copyOrCut('copy')} />
            <Action icon={<Scissors size={14} />} label="d cut" onClick={() => copyOrCut('cut')} />
            <Action icon={<Trash2 size={14} />} label="x delete" onClick={remove} />
            <Action icon={<Clipboard size={14} />} label="p paste" onClick={paste} />
            <Action icon={<RotateCcw size={14} />} label="u undo" onClick={undo} />
            <Action icon={<Plus size={14} />} label="a add" onClick={() => setMode('insert')} />
          </div>
        </footer>
      </div>
    </div>
  );
};

const Key: React.FC<React.PropsWithChildren> = ({ children }) => (
  <kbd style={keyStyle}>{children}</kbd>
);

const Macro: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div style={macroStyle}>
    <strong style={macroValueStyle}>{Math.round(value)}</strong>
    <span style={macroLabelStyle}>{label}</span>
  </div>
);

const Action: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void }> = ({ icon, label, onClick }) => (
  <button type="button" onClick={onClick} style={actionStyle}>{icon}{label}</button>
);

const pageStyle: React.CSSProperties = {
  minHeight: '100%',
  background: 'var(--sk-bg)',
  color: 'var(--sk-ink)',
  fontFamily: 'var(--sk-font-ui)',
};

const appStyle: React.CSSProperties = {
  minHeight: 'calc(100vh - 48px)',
  display: 'flex',
  flexDirection: 'column',
  backgroundImage: 'linear-gradient(var(--sk-line) 1px, transparent 1px)',
  backgroundSize: '100% 46px',
};

const headerStyle: React.CSSProperties = {
  minHeight: 70,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 20,
  padding: '14px 28px',
  borderBottom: 'var(--sk-rule-heavy) solid var(--sk-ink)',
  background: 'var(--sk-bg)',
};

const eyebrowStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.16em', color: 'var(--sk-quiet)' };
const brandStyle: React.CSSProperties = { fontFamily: 'var(--sk-font-display)', fontSize: '1.55rem', fontWeight: 800, letterSpacing: '-0.04em' };
const headerHelpStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--sk-quiet)', textAlign: 'right' };

const dateNavStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr minmax(220px, 320px) 1fr', alignItems: 'center', gap: 22, padding: '24px 28px 16px', background: 'var(--sk-bg)' };
const navButtonStyle: React.CSSProperties = { border: 0, background: 'transparent', color: 'var(--sk-quiet)', font: 'inherit', fontSize: '0.78rem', cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' };
const navHintStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '0.62rem', border: '1px solid var(--sk-line)', padding: '2px 6px' };
const relationStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--sk-accent)' };
const dateStyle: React.CSSProperties = { marginTop: 3, fontFamily: 'var(--sk-font-display)', fontSize: '2rem', fontWeight: 760, letterSpacing: '-0.045em' };
const markerStyle: React.CSSProperties = { width: 126, height: 6, margin: '4px auto 0', borderTop: '3px solid var(--sk-accent)', borderRadius: '48% 54% 44% 56%', transform: 'rotate(-1deg)' };

const macroGridStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', borderTop: 'var(--sk-rule-mid) solid var(--sk-line)', borderBottom: 'var(--sk-rule-heavy) solid var(--sk-ink)', background: 'var(--sk-bg)' };
const macroStyle: React.CSSProperties = { padding: '14px 18px', textAlign: 'center', borderRight: '1px solid var(--sk-line)' };
const macroValueStyle: React.CSSProperties = { display: 'block', fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 800 };
const macroLabelStyle: React.CSSProperties = { display: 'block', marginTop: 2, fontFamily: 'var(--font-mono)', color: 'var(--sk-quiet)', fontSize: '0.59rem', textTransform: 'uppercase', letterSpacing: '0.11em' };

const timelineStyle: React.CSSProperties = { width: 'min(920px, calc(100% - 48px))', margin: '0 auto', flex: 1, padding: '26px 0 120px' };
const momentStyle: React.CSSProperties = { display: 'grid', gridTemplateColumns: '68px minmax(0, 1fr)', gap: 14, marginBottom: 18 };
const timeStyle: React.CSSProperties = { paddingTop: 13, fontFamily: 'var(--font-mono)', fontSize: '0.64rem', color: 'var(--sk-quiet)', textAlign: 'right' };
const rowStyle: React.CSSProperties = { width: '100%', display: 'grid', gridTemplateColumns: '7px minmax(0, 1fr) 92px 64px', gap: 12, alignItems: 'center', minHeight: 54, padding: '7px 12px 7px 8px', border: '1px solid transparent', borderBottomColor: 'var(--sk-line)', background: 'var(--sk-bg)', color: 'var(--sk-ink)', textAlign: 'left', cursor: 'pointer', font: 'inherit' };
const cursorRowStyle: React.CSSProperties = { borderColor: 'var(--sk-ink)', boxShadow: 'inset 0 0 0 1px var(--sk-bg)' };
const selectedRowStyle: React.CSSProperties = { background: 'var(--sk-tint)', borderColor: 'var(--sk-accent)' };
const gutterStyle: React.CSSProperties = { display: 'block', width: 5, height: 30, background: 'var(--sk-accent)' };
const foodNameStyle: React.CSSProperties = { display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 690, letterSpacing: '-0.015em' };
const foodMetaStyle: React.CSSProperties = { display: 'block', marginTop: 3, fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--sk-faint)' };
const quantityStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '0.72rem', textAlign: 'right', color: 'var(--sk-quiet)' };
const calorieStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '0.78rem', textAlign: 'right', fontWeight: 700 };
const emptyStyle: React.CSSProperties = { width: '100%', padding: 30, border: '1px dashed var(--sk-line)', background: 'var(--sk-bg)', color: 'var(--sk-quiet)', font: 'inherit', cursor: 'pointer' };

const paletteStyle: React.CSSProperties = { position: 'fixed', left: '50%', top: 112, transform: 'translateX(-50%)', width: 'min(620px, calc(100vw - 48px))', zIndex: 10, border: 'var(--sk-rule-heavy) solid var(--sk-ink)', background: 'var(--sk-panel)', boxShadow: '10px 10px 0 color-mix(in srgb, var(--sk-ink) 14%, transparent)' };
const paletteLabelStyle: React.CSSProperties = { padding: '10px 13px', borderBottom: '1px solid var(--sk-line)', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', letterSpacing: '0.14em', color: 'var(--sk-quiet)' };
const searchStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', border: 0, borderBottom: 'var(--sk-rule-mid) solid var(--sk-ink)', background: 'var(--sk-bg)', color: 'var(--sk-ink)', padding: '15px 16px', outline: 'none', font: 'inherit', fontSize: '1rem' };
const resultsStyle: React.CSSProperties = { padding: 6 };
const resultStyle: React.CSSProperties = { width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, border: 0, borderBottom: '1px solid var(--sk-line)', background: 'transparent', color: 'var(--sk-ink)', padding: '11px 10px', textAlign: 'left', cursor: 'pointer', font: 'inherit' };
const resultNumberStyle: React.CSSProperties = { display: 'inline-block', width: 24, fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--sk-faint)' };
const resultMetaStyle: React.CSSProperties = { fontFamily: 'var(--font-mono)', fontSize: '0.66rem', color: 'var(--sk-quiet)' };
const paletteFooterStyle: React.CSSProperties = { padding: '8px 12px', borderTop: '1px solid var(--sk-line)', color: 'var(--sk-faint)', fontFamily: 'var(--font-mono)', fontSize: '0.6rem' };

const statusStyle: React.CSSProperties = { position: 'sticky', bottom: 0, zIndex: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, minHeight: 48, padding: '7px 12px', borderTop: 'var(--sk-rule-heavy) solid var(--sk-ink)', background: 'var(--sk-panel)' };
const modeStyle: React.CSSProperties = { flexShrink: 0, padding: '5px 8px', background: 'var(--sk-ink)', color: 'var(--sk-bg)', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.09em' };
const visualModeStyle: React.CSSProperties = { background: 'var(--sk-accent)', color: 'var(--sk-bg)' };
const statusTextStyle: React.CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--sk-quiet)' };
const actionStripStyle: React.CSSProperties = { display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 4 };
const actionStyle: React.CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 5, border: '1px solid var(--sk-line)', background: 'var(--sk-bg)', color: 'var(--sk-ink)', padding: '6px 8px', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: '0.61rem' };
const keyStyle: React.CSSProperties = { display: 'inline-block', minWidth: 18, padding: '1px 4px', border: '1px solid var(--sk-line)', background: 'var(--sk-panel)', color: 'var(--sk-ink)', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', textAlign: 'center' };
