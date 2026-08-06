import React from 'react';
import { Plus } from 'lucide-react';
import { ENTRIES, byHour, sum } from './data';
import { ColumnHead, EntryRow, Rule, RowMode, Subtotal, label, num } from './ledger';

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

/** Boton de la hora. Cada nodo del riel ofrece registrar ahi mismo. */
const AddAtHour: React.FC<{ hour: string; subdued?: boolean }> = ({ hour, subdued }) => (
  <button
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 5,
      padding: '4px 9px',
      background: 'transparent',
      border: `1px ${subdued ? 'dashed' : 'solid'} var(--sk-line)`,
      color: subdued ? 'var(--sk-faint)' : 'var(--sk-quiet)',
      cursor: 'pointer',
      font: 'inherit',
    }}
    title={`Registrar a las ${hour}`}>
    <Plus size={11} />
    <span style={{ ...label('0.55rem'), letterSpacing: '0.06em' }}>{hour}</span>
  </button>
);

/** Horas vacias entre dos registros, para poder intercalar. */
const emptyHoursBetween = (from: string, to: string): string[] => {
  const a = Number(from.slice(0, 2));
  const b = Number(to.slice(0, 2));
  const out: string[] = [];
  for (let h = a + 1; h < b; h++) out.push(`${String(h).padStart(2, '0')}:00`);
  // Solo se ofrecen si el hueco es de verdad, no cada hora del dia
  return out.length >= 2 ? [out[Math.floor(out.length / 2)]] : out;
};

export const TimelineLayout: React.FC<{ mode: RowMode }> = ({ mode }) => {
  const groups = byHour(ENTRIES);

  return (
    <div>
      <ColumnHead mode={mode} />
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
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    padding: '0 16px 2px',
                  }}>
                  <AddAtHour hour={time} />
                </div>

                {entries.map((entry) => (
                  <EntryRow key={entry.id} entry={entry} mode={mode} showTime />
                ))}
                {entries.length > 1 ? <Subtotal totals={totals} /> : <div style={{ height: 6 }} />}
              </div>
            </div>

            {next
              ? emptyHoursBetween(time, next[0]).map((hour) => (
                  <div key={hour} style={{ display: 'flex', minHeight: 34 }}>
                    <div style={{ width: RAIL_W, position: 'relative', flex: 'none' }}>
                      <div
                        style={{
                          position: 'absolute',
                          left: RAIL_W - 13,
                          top: 0,
                          bottom: 0,
                          borderLeft: '1px dashed var(--sk-line)',
                        }}
                      />
                    </div>
                    <div
                      style={{
                        flex: 1,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        padding: '5px 16px 0',
                      }}>
                      <AddAtHour hour={hour} subdued />
                    </div>
                  </div>
                ))
              : null}
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
