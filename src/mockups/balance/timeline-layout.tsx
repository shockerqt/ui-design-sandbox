import React from 'react';
import { Plus } from 'lucide-react';
import { DEFAULT_HOUR_RANGE, ENTRIES, HourRange, buildRail, sum } from './data';
import { ColumnHead, EntryRow, GroupSummary, Rule, RowMode, label, num } from './ledger';

/* ============================================================
   Disposicion A — Riel por hora.

   Una sola regla, sin casos especiales: cada hora del tramo es un
   nodo. Lleno si tiene comida, apagado si no, y todos son tocables.

   El riel cubre siempre el rango configurado, asi que las horas
   posteriores a la ultima comida siguen a un toque y un dia vacio
   muestra el dia entero listo para anotar.
   ============================================================ */

const RAIL_W = 56;
const DOT = 20;
const PAD_RIGHT = 8;

/**
 * El eje del riel. La linea y el punto se derivan de aqui en vez de
 * calcularse por separado: es lo que los mantiene centrados.
 */
const AXIS = RAIL_W - PAD_RIGHT - DOT / 2;

const HourNode: React.FC<{ hour: string; filled: boolean }> = ({ hour, filled }) => {
  const title = filled ? `Agregar otro a las ${hour}` : `Registrar a las ${hour}`;

  return (
    <button
      title={title}
      aria-label={title}
      style={{
        position: 'absolute',
        right: PAD_RIGHT,
        top: 6,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: 0,
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: filled ? 'var(--sk-ink)' : 'var(--sk-bg)',
          border: filled ? 'none' : '1px solid var(--sk-line)',
          color: filled ? 'var(--sk-bg)' : 'var(--sk-faint)',
        }}>
        <Plus size={12} strokeWidth={filled ? 2.5 : 2} />
      </span>
    </button>
  );
};

export const TimelineLayout: React.FC<{ mode: RowMode; hourRange?: HourRange }> = ({
  mode,
  hourRange = DEFAULT_HOUR_RANGE,
}) => {
  const rail = buildRail(ENTRIES, hourRange);
  const conComida = rail.filter((s) => s.entries.length).length;

  return (
    <div>
      <ColumnHead mode={mode} />
      <Rule weight="mid" />

      {rail.map(({ hour, entries }) => {
        const filled = entries.length > 0;

        return (
          <div key={hour} style={{ display: 'flex', minHeight: filled ? undefined : 34 }}>
            <div style={{ width: RAIL_W, position: 'relative', flex: 'none' }}>
              {/* Ambos cuelgan del mismo eje: por eso quedan centrados */}
              <div
                style={{
                  position: 'absolute',
                  left: AXIS - 0.5,
                  top: 0,
                  bottom: 0,
                  width: 1,
                  background: 'var(--sk-line)',
                }}
              />
              <HourNode hour={hour} filled={filled} />
            </div>

            <div style={{ flex: 1, minWidth: 0, paddingTop: 6 }}>
              {filled ? (
                <>
                  {entries.length > 1 ? (
                    <GroupSummary totals={sum(entries)} mode={mode} />
                  ) : null}
                  {entries.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} mode={mode} showTime />
                  ))}
                  <div style={{ height: 6 }} />
                </>
              ) : null}
            </div>
          </div>
        );
      })}

      <Rule weight="mid" />

      <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between' }}>
        <span style={label()}>
          {ENTRIES.length} registros · {conComida} horas
        </span>
        <span style={{ ...label(), letterSpacing: '0.04em' }}>
          {rail[0].hour.slice(0, 2)}–{rail[rail.length - 1].hour.slice(0, 2)} h
        </span>
      </div>
    </div>
  );
};
