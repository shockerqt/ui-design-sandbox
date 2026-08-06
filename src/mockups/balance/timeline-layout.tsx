import React from 'react';
import { ENTRIES, byHour, sum } from './data';
import { ColumnHead, EntryRow, Rule, RowMode, Subtotal, label, num } from './ledger';

/* ============================================================
   Disposicion A — Riel por hora.

   Una sola regla, sin casos especiales: cada hora del dia es un nodo
   del riel. Lleno si tiene comida, apagado si no, y todos son
   tocables. Tocar un nodo registra a esa hora, tenga o no algo ya.

   Asi "agregar a una hora que ya existe" deja de necesitar un boton
   aparte perdido entre las filas —que era invisible en la version
   anterior— y pasa a ser el mismo gesto que agregar en una hora
   vacia.
   ============================================================ */

const RAIL_W = 54;
const DOT = 9;

/** Nodo del riel: el punto y su hora. Es el boton de registrar. */
const HourNode: React.FC<{ hour: string; filled: boolean }> = ({ hour, filled }) => {
  const title = filled ? `Agregar otro a las ${hour}` : `Registrar a las ${hour}`;

  return (
    <button
      title={title}
      aria-label={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 8,
        width: RAIL_W,
        padding: 0,
        paddingRight: RAIL_W / 2 - DOT / 2 - 4,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        font: 'inherit',
      }}>
      <span
        style={{
          ...num('0.68rem', filled ? 600 : 400),
          color: filled ? 'var(--sk-ink)' : 'var(--sk-faint)',
        }}>
        {hour.slice(0, 2)}
      </span>

      <span
        style={{
          width: DOT,
          height: DOT,
          borderRadius: '50%',
          flex: 'none',
          background: filled ? 'var(--sk-ink)' : 'var(--sk-bg)',
          border: filled ? 'none' : '1px solid var(--sk-line)',
        }}
      />
    </button>
  );
};

export const TimelineLayout: React.FC<{ mode: RowMode }> = ({ mode }) => {
  const groups = new Map(byHour(ENTRIES));

  const hours = [...groups.keys()];
  const first = Number(hours[0].slice(0, 2));
  const last = Number(hours[hours.length - 1].slice(0, 2));

  // El riel corre continuo entre el primer y el ultimo registro: las
  // horas sin comida no se saltan, se muestran apagadas y tocables.
  const rail = Array.from({ length: last - first + 1 }, (_, i) =>
    `${String(first + i).padStart(2, '0')}:00`
  );

  return (
    <div>
      <ColumnHead mode={mode} />
      <Rule weight="mid" />

      {rail.map((hour) => {
        const entries = groups.get(hour);
        const filled = !!entries?.length;

        return (
          <div key={hour} style={{ display: 'flex', minHeight: filled ? undefined : 32 }}>
            <div style={{ width: RAIL_W, position: 'relative', flex: 'none' }}>
              {/* La linea del dia, continua tras los puntos */}
              <div
                style={{
                  position: 'absolute',
                  left: RAIL_W / 2 - 4,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: 'var(--sk-line)',
                }}
              />
              <div style={{ position: 'absolute', left: 0, top: filled ? 9 : 11 }}>
                <HourNode hour={hour} filled={filled} />
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              {filled ? (
                <div style={{ paddingTop: 4 }}>
                  {entries!.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} mode={mode} showTime />
                  ))}
                  {entries!.length > 1 ? (
                    <Subtotal totals={sum(entries!)} />
                  ) : (
                    <div style={{ height: 6 }} />
                  )}
                </div>
              ) : null}
            </div>
          </div>
        );
      })}

      <Rule weight="mid" />

      <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={label()}>
          {ENTRIES.length} registros · {groups.size} horas
        </span>
        <span style={{ ...label(), letterSpacing: '0.04em' }}>Toca una hora para registrar</span>
      </div>
    </div>
  );
};
