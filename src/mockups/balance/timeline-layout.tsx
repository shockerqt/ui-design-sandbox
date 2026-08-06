import React from 'react';
import { Plus } from 'lucide-react';
import { ENTRIES, byTime, sum } from './data';
import { ColumnHead, EntryRow, Rule, Subtotal, label, num } from './ledger';

/* ============================================================
   Disposicion A — Timeline por hora.

   La hora exacta se conserva tal cual se registro. El riel vertical
   es la linea del dia y cada nodo es un momento de consumo; los
   picoteos no necesitan categoria, son un nodo mas.

   El hueco entre nodos es tocable: ahi se registra a esa hora, que
   es la parte que hace barato agregar entre medio.
   ============================================================ */

const RAIL_W = 58;

/** Minutos entre dos "HH:MM". */
const gapMinutes = (a: string, b: string) => {
  const [ah, am] = a.split(':').map(Number);
  const [bh, bm] = b.split(':').map(Number);
  return bh * 60 + bm - (ah * 60 + am);
};

const InsertSlot: React.FC<{ from: string; to: string }> = ({ from, to }) => {
  const minutes = gapMinutes(from, to);
  // Solo se ofrece insertar donde hay hueco real
  if (minutes < 45) return null;

  const [h, m] = from.split(':').map(Number);
  const mid = new Date(0, 0, 0, h, m + Math.floor(minutes / 2));
  const midLabel = `${String(mid.getHours()).padStart(2, '0')}:${String(mid.getMinutes()).padStart(2, '0')}`;

  return (
    <div style={{ display: 'flex', minHeight: 44 }}>
      <div style={{ width: RAIL_W, position: 'relative', flex: 'none' }}>
        <div
          style={{
            position: 'absolute',
            left: RAIL_W - 13,
            top: 0,
            bottom: 0,
            width: 1,
            borderLeft: '1px dashed var(--sk-line)',
          }}
        />
      </div>

      <button
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          margin: '4px 16px 4px 0',
          padding: '7px 10px',
          background: 'transparent',
          border: '1px dashed var(--sk-line)',
          color: 'var(--sk-faint)',
          cursor: 'pointer',
          font: 'inherit',
        }}>
        <Plus size={13} />
        <span style={{ ...label('0.6rem'), letterSpacing: '0.06em' }}>
          Registrar a las {midLabel}
        </span>
      </button>
    </div>
  );
};

export const TimelineLayout: React.FC = () => {
  const groups = byTime(ENTRIES);

  return (
    <div>
      <ColumnHead />
      <Rule weight="mid" />

      {groups.map(([time, entries], index) => {
        const next = groups[index + 1];
        const totals = sum(entries);

        return (
          <React.Fragment key={time}>
            <div style={{ display: 'flex' }}>
              {/* Riel: la linea del dia */}
              <div style={{ width: RAIL_W, position: 'relative', flex: 'none' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: RAIL_W - 13,
                    top: 0,
                    bottom: 0,
                    width: 1,
                    background: 'var(--sk-line)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left: RAIL_W - 16,
                    top: 14,
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: 'var(--sk-ink)',
                  }}
                />
                <div
                  style={{
                    ...num('0.72rem', 600),
                    color: 'var(--sk-ink)',
                    position: 'absolute',
                    left: 0,
                    top: 9,
                    width: RAIL_W - 22,
                  }}>
                  {time}
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
                {entries.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} />
                ))}
                {entries.length > 1 ? <Subtotal totals={totals} /> : <div style={{ height: 8 }} />}
              </div>
            </div>

            {next ? <InsertSlot from={time} to={next[0]} /> : null}
          </React.Fragment>
        );
      })}

      <div style={{ height: 8 }} />
      <Rule weight="mid" />

      <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={label()}>
          {ENTRIES.length} registros · {groups.length} momentos
        </span>
        <span style={{ ...label(), letterSpacing: '0.04em' }}>
          {groups[0][0]} — {groups[groups.length - 1][0]}
        </span>
      </div>
    </div>
  );
};
