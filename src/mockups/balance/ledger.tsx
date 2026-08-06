import React from 'react';
import { Entry, TARGETS, Totals } from './data';

/* ============================================================
   Piezas del libro contable.

   La idea que ordena todo: cada alimento es un asiento que aporta a
   cuatro cuentas, cada cuenta suma su subtotal y cada una tiene su
   propio balance. Por eso los macros quedan al mismo nivel que las
   calorias, y no como un pie de pagina.
   ============================================================ */

export const COLUMNS = [
  { key: 'kcal', label: 'KCAL', target: TARGETS.kcal },
  { key: 'protein', label: 'P', target: TARGETS.protein },
  { key: 'carbs', label: 'C', target: TARGETS.carbs },
  { key: 'fat', label: 'G', target: TARGETS.fat },
] as const;

const NUM_W = 46;
const ink = 'var(--sk-ink)';
const quiet = 'var(--sk-quiet)';
const faint = 'var(--sk-faint)';
const line = 'var(--sk-line)';
const red = 'var(--sk-signal)';

export const label = (size = '0.62rem'): React.CSSProperties => ({
  fontFamily: 'var(--sk-font-ui)',
  fontSize: size,
  fontWeight: 600,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: faint,
});

export const num = (size = '0.8rem', weight = 400): React.CSSProperties => ({
  fontFamily: 'var(--sk-font-num)',
  fontVariantNumeric: 'tabular-nums',
  fontSize: size,
  fontWeight: weight,
  textAlign: 'right',
});

/** Cabecera de columnas. Se repite arriba de la hoja, como en un libro. */
export const ColumnHead: React.FC = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', padding: '0 16px 6px', gap: 8 }}>
    <span style={{ flex: 1 }} />
    {COLUMNS.map((c) => (
      <span key={c.key} style={{ ...label('0.58rem'), width: NUM_W, textAlign: 'right' }}>
        {c.label}
      </span>
    ))}
  </div>
);

/** Un asiento: el alimento y sus cuatro cifras. */
export const EntryRow: React.FC<{ entry: Entry; showTime?: boolean }> = ({ entry, showTime }) => (
  <div
    className="ledger-band"
    style={{ display: 'flex', alignItems: 'baseline', padding: '7px 16px', gap: 8 }}>
    <span style={{ flex: 1, minWidth: 0 }}>
      <span
        style={{
          fontFamily: 'var(--sk-font-ui)',
          fontSize: '0.85rem',
          color: ink,
          display: 'block',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
        {entry.name}
      </span>
      <span style={{ ...label('0.58rem'), letterSpacing: '0.04em' }}>
        {showTime ? `${entry.time} · ` : ''}
        {entry.portion}
      </span>
    </span>

    <span style={{ ...num('0.82rem', 500), width: NUM_W, color: ink }}>{entry.kcal}</span>
    <span style={{ ...num(), width: NUM_W, color: quiet }}>{entry.protein}</span>
    <span style={{ ...num(), width: NUM_W, color: quiet }}>{entry.carbs}</span>
    <span style={{ ...num(), width: NUM_W, color: quiet }}>{entry.fat}</span>
  </div>
);

/** Subtotal del bloque, bajo su filete. Es lo que lo hace leerse como cuenta. */
export const Subtotal: React.FC<{ totals: Totals }> = ({ totals }) => (
  <div style={{ padding: '0 16px' }}>
    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingBottom: 4 }}>
      {COLUMNS.map((c) => (
        <span key={c.key} style={{ width: NUM_W, height: 1, background: line }} />
      ))}
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, paddingBottom: 10 }}>
      <span style={{ flex: 1 }} />
      <span style={{ ...num('0.82rem', 700), width: NUM_W, color: ink }}>{totals.kcal}</span>
      <span style={{ ...num('0.8rem', 600), width: NUM_W, color: ink }}>{totals.protein}</span>
      <span style={{ ...num('0.8rem', 600), width: NUM_W, color: ink }}>{totals.carbs}</span>
      <span style={{ ...num('0.8rem', 600), width: NUM_W, color: ink }}>{totals.fat}</span>
    </div>
  </div>
);

/**
 * Balance del dia: consumido sobre objetivo, columna por columna.
 * Cada cuenta se pone en rojo por su cuenta, asi que se puede ir en
 * negro en calorias y en rojo en grasas.
 */
export const DayBalance: React.FC<{ totals: Totals }> = ({ totals }) => {
  const values = [
    { key: 'kcal', value: totals.kcal, target: TARGETS.kcal, label: 'kcal' },
    { key: 'protein', value: totals.protein, target: TARGETS.protein, label: 'P' },
    { key: 'carbs', value: totals.carbs, target: TARGETS.carbs, label: 'C' },
    { key: 'fat', value: totals.fat, target: TARGETS.fat, label: 'G' },
  ];

  return (
    <div style={{ padding: '14px 16px 12px' }}>
      <div style={{ ...label(), marginBottom: 10 }}>Consumido</div>

      <div style={{ display: 'flex', gap: 8 }}>
        {values.map((v) => {
          const over = v.value > v.target;
          const ratio = Math.min(v.value / v.target, 1);
          return (
            <div key={v.key} style={{ flex: 1 }}>
              <div
                style={{
                  ...num(v.key === 'kcal' ? '1.35rem' : '1.15rem', 600),
                  textAlign: 'left',
                  color: over ? red : ink,
                  lineHeight: 1.1,
                }}>
                {v.value.toLocaleString('es-CL')}
              </div>
              <div style={{ ...num('0.72rem'), textAlign: 'left', color: faint }}>
                /{v.target.toLocaleString('es-CL')}
              </div>

              {/* El avance tambien es un filete, no una barra sobrepuesta */}
              <div style={{ height: 3, background: line, marginTop: 6 }}>
                <div style={{ width: `${ratio * 100}%`, height: '100%', background: over ? red : ink }} />
              </div>

              <div style={{ ...label('0.56rem'), marginTop: 5 }}>{v.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Rule: React.FC<{ weight?: 'heavy' | 'mid' | 'hair' }> = ({ weight = 'hair' }) => (
  <div
    style={{
      height:
        weight === 'heavy' ? 'var(--sk-rule-heavy)' : weight === 'mid' ? 'var(--sk-rule-mid)' : 1,
      background: weight === 'hair' ? line : ink,
    }}
  />
);
