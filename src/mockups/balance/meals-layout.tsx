import React from 'react';
import { Plus } from 'lucide-react';
import { ENTRIES, byMeal, sum, timeRange } from './data';
import { ColumnHead, EntryRow, GroupSummary, Rule, RowMode, label } from './ledger';

/* ============================================================
   Disposicion B — Comidas nombradas.

   Bloques por comida, con la hora como metadato a la derecha. Lo que
   cae fuera de una ventana se vuelve "Colacion", que es el parche que
   esta disposicion necesita para no perder los picoteos: se ve claro
   en el bloque de las 16:20.
   ============================================================ */

export const MealsLayout: React.FC<{ mode: RowMode }> = ({ mode }) => {
  const blocks = byMeal(ENTRIES);

  return (
    <div>
      <ColumnHead mode={mode} />
      <Rule weight="mid" />

      {blocks.map((block, index) => {
        const totals = sum(block.entries);

        return (
          <div key={`${block.name}-${index}`}>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                justifyContent: 'space-between',
                padding: '12px 16px 6px',
                gap: 12,
              }}>
              <span
                style={{
                  fontFamily: 'var(--sk-font-ui)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: block.isSnack ? 'var(--sk-quiet)' : 'var(--sk-ink)',
                }}>
                {block.name}
              </span>
              <span style={{ ...label('0.62rem'), letterSpacing: '0.04em' }}>
                {timeRange(block.entries)}
              </span>
            </div>

            {block.entries.length > 1 ? <GroupSummary totals={totals} mode={mode} /> : null}

            {block.entries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} mode={mode} showTime />
            ))}

            <div style={{ height: 8 }} />
          </div>
        );
      })}

      {/* Una comida sin registrar es una invitacion, no un vacio */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderTop: '1px solid var(--sk-line)',
          gap: 12,
        }}>
        <span style={{ ...label('0.78rem'), color: 'var(--sk-faint)' }}>Cena</span>
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 12px',
            background: 'transparent',
            border: '1px solid var(--sk-ink)',
            color: 'var(--sk-ink)',
            cursor: 'pointer',
            font: 'inherit',
          }}>
          <Plus size={13} />
          <span style={{ ...label('0.6rem'), color: 'var(--sk-ink)' }}>Agregar</span>
        </button>
      </div>

      <Rule weight="mid" />

      <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={label()}>
          {ENTRIES.length} registros · {blocks.length} bloques
        </span>
        <span style={{ ...label(), letterSpacing: '0.04em' }}>
          {blocks.filter((b) => b.isSnack).length} colaciones
        </span>
      </div>
    </div>
  );
};
