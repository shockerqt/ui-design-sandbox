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
export const ColumnHead: React.FC<{ mode: RowMode }> = ({ mode }) =>
  mode === 'amplio' ? null : (
  <div style={{ display: 'flex', alignItems: 'flex-end', padding: '0 16px 6px', gap: 8 }}>
    <span style={{ flex: 1 }} />
    {COLUMNS.map((c) => (
      <span key={c.key} style={{ ...label('0.58rem'), width: NUM_W, textAlign: 'right' }}>
        {c.label}
      </span>
    ))}
  </div>
);

export type RowMode = 'columnas' | 'amplio';

/**
 * Un asiento. Dos formas para el mismo dato, porque en 390 px las
 * cuatro columnas y el nombre se pelean el ancho:
 *
 * - `columnas`: las cuatro cifras alineadas. Comparable de un vistazo,
 *   pero el nombre queda con ~170 px y la marca no cabe.
 * - `amplio`: el nombre y la marca toman la linea entera, las kcal se
 *   alinean a la derecha y los macros bajan como linea subordinada.
 */
export const EntryRow: React.FC<{ entry: Entry; mode: RowMode; showTime?: boolean }> = ({
  entry,
  mode,
  showTime,
}) => {
  const meta = [showTime ? entry.time : null, entry.brand, entry.portion]
    .filter(Boolean)
    .join(' · ');

  if (mode === 'amplio') {
    return (
      <div className="ledger-band" style={{ padding: '8px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span
            style={{
              flex: 1,
              minWidth: 0,
              fontFamily: 'var(--sk-font-ui)',
              fontSize: '0.88rem',
              color: ink,
            }}>
            {entry.name}
          </span>
          <span style={{ ...num('0.85rem', 600), color: ink, flex: 'none' }}>{entry.kcal}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 2 }}>
          <span style={{ ...label('0.6rem'), letterSpacing: '0.04em', flex: 1, minWidth: 0 }}>
            {meta}
          </span>
          <span
            style={{
              ...num('0.68rem'),
              color: quiet,
              flex: 'none',
              letterSpacing: '0.02em',
            }}>
            {entry.protein} P · {entry.carbs} C · {entry.fat} G
          </span>
        </div>
      </div>
    );
  }

  return (
    <div
      className="ledger-band"
      style={{ display: 'flex', alignItems: 'baseline', padding: '7px 16px', gap: 8 }}>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            fontFamily: 'var(--sk-font-ui)',
            fontSize: '0.82rem',
            color: ink,
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
          {entry.name}
        </span>
        <span
          style={{
            ...label('0.56rem'),
            letterSpacing: '0.04em',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
          {meta}
        </span>
      </span>

      <span style={{ ...num('0.8rem', 500), width: NUM_W, color: ink }}>{entry.kcal}</span>
      <span style={{ ...num('0.78rem'), width: NUM_W, color: quiet }}>{entry.protein}</span>
      <span style={{ ...num('0.78rem'), width: NUM_W, color: quiet }}>{entry.carbs}</span>
      <span style={{ ...num('0.78rem'), width: NUM_W, color: quiet }}>{entry.fat}</span>
    </div>
  );
};

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
 * Balance del dia en una sola franja. Cada cuenta se pone en rojo por
 * su cuenta, asi que se puede ir en negro en calorias y en rojo en
 * grasas. Antes ocupaba el triple de alto
 * con una barra y una etiqueta por columna; aqui la cifra sobre el
 * objetivo ya dice todo, y el filete de avance va bajo la franja
 * entera en vez de repetirse cuatro veces.
 */
export const DayBalance: React.FC<{ totals: Totals }> = ({ totals }) => {
  const values = [
    { key: 'kcal', value: totals.kcal, target: TARGETS.kcal, label: 'kcal' },
    { key: 'protein', value: totals.protein, target: TARGETS.protein, label: 'P' },
    { key: 'carbs', value: totals.carbs, target: TARGETS.carbs, label: 'C' },
    { key: 'fat', value: totals.fat, target: TARGETS.fat, label: 'G' },
  ];

  return (
    <div style={{ padding: '8px 16px 0' }}>
      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
        {values.map((v) => {
          const over = v.value > v.target;
          return (
            <div key={v.key} style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 3 }}>
              <span
                style={{
                  ...num(v.key === 'kcal' ? '1.05rem' : '0.95rem', 600),
                  textAlign: 'left',
                  color: over ? red : ink,
                }}>
                {v.value.toLocaleString('es-CL')}
              </span>
              <span style={{ ...num('0.62rem'), color: faint }}>/{v.target}</span>
              <span style={{ ...label('0.54rem'), marginLeft: 1 }}>{v.label}</span>
            </div>
          );
        })}
      </div>

      {/* Un solo filete de avance, el de calorias, bajo la franja */}
      <div style={{ height: 3, background: line, marginTop: 7 }}>
        <div
          style={{
            width: `${Math.min(totals.kcal / TARGETS.kcal, 1) * 100}%`,
            height: '100%',
            background: totals.kcal > TARGETS.kcal ? red : ink,
          }}
        />
      </div>
      <div style={{ height: 8 }} />
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
