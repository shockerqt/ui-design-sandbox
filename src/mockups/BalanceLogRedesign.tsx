import React, { useState } from 'react';

import { ChevronLeft, ChevronRight, Plus, RotateCcw } from 'lucide-react';
import { ENTRIES, sum } from './balance/data';
import { DayBalance, Rule, label } from './balance/ledger';
import { TimelineLayout } from './balance/timeline-layout';
import { MealsLayout } from './balance/meals-layout';

/* ============================================================
   Rediseño de la pantalla de registro de Balance.

   Tesis: la app se llama Balance y un registro de comidas es un libro
   contable — anotas consumos contra un presupuesto. De ahi sale todo:
   columnas por cuenta, subtotales bajo su filete, y la convencion del
   negro y el rojo para estar dentro o fuera del objetivo.

   Se ofrecen dos disposiciones para el mismo dia y los mismos datos,
   porque la eleccion entre hora exacta y comidas nombradas depende de
   como come cada persona, no de cual se ve mejor.
   ============================================================ */

const THEMES = [
  { key: 'libro', label: 'Papel' },
  { key: 'libro-noche', label: 'Noche' },
] as const;

const LAYOUTS = [
  { key: 'timeline', label: 'Por hora' },
  { key: 'meals', label: 'Por comida' },
] as const;

/* En 390 px las cuatro columnas y el nombre se pelean el ancho. Las dos
   salidas estan aqui para compararlas con el dato real, no a ojo. */
const ROWS = [
  { key: 'columnas', label: 'Columnas' },
  { key: 'amplio', label: 'Nombre amplio' },
] as const;

export const BalanceLogRedesign: React.FC = () => {
  const [theme, setTheme] = useState<string>('libro');
  const [layout, setLayout] = useState<string>('timeline');
  const [row, setRow] = useState<'columnas' | 'amplio'>('columnas');

  const totals = sum(ENTRIES);

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Controles del laboratorio, no del producto */}
      <div className="skin-picker">
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--fg-faint)',
          }}>
          Tema
        </span>
        {THEMES.map((t) => (
          <button
            key={t.key}
            className="skin-picker-btn"
            data-active={theme === t.key}
            onClick={() => setTheme(t.key)}>
            {t.label}
          </button>
        ))}

        <span style={{ width: 12 }} />

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--fg-faint)',
          }}>
          Disposición
        </span>
        {LAYOUTS.map((l) => (
          <button
            key={l.key}
            className="skin-picker-btn"
            data-active={layout === l.key}
            onClick={() => setLayout(l.key)}>
            {l.label}
          </button>
        ))}

        <span style={{ width: 12 }} />

        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--fg-faint)',
          }}>
          Fila
        </span>
        {ROWS.map((r) => (
          <button
            key={r.key}
            className="skin-picker-btn"
            data-active={row === r.key}
            onClick={() => setRow(r.key)}>
            {r.label}
          </button>
        ))}
      </div>

      {/* El mockup, a ancho de telefono sobre el lienzo */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '24px 16px 48px',
          background: 'var(--ink)',
        }}>
        <div
          className={`skin skin-${theme}`}
          style={{
            width: 390,
            maxWidth: '100%',
            background: 'var(--sk-bg)',
            color: 'var(--sk-ink)',
            fontFamily: 'var(--sk-font-ui)',
            border: '1px solid var(--sk-line)',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 720,
          }}>
          {/* Cabecera del dia */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
            }}>
            <button style={iconBtn} aria-label="Día anterior">
              <ChevronLeft size={18} />
            </button>

            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                }}>
                Jueves 6 ago
              </div>
              <div style={{ ...label('0.58rem'), marginTop: 2 }}>Hoy</div>
            </div>

            <button style={iconBtn} aria-label="Día siguiente">
              <ChevronRight size={18} />
            </button>
          </div>

          <Rule weight="heavy" />

          <DayBalance totals={totals} />

          <Rule weight="heavy" />

          <div style={{ flex: 1 }}>
            {layout === 'timeline' ? <TimelineLayout mode={row} /> : <MealsLayout mode={row} />}
          </div>

          {/* Barra de accion: registrar y repetir de ayer */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              padding: 12,
              borderTop: 'var(--sk-rule-heavy) solid var(--sk-ink)',
              background: 'var(--sk-bg)',
            }}>
            <button
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                padding: '13px',
                background: 'var(--sk-ink)',
                color: 'var(--sk-bg)',
                border: 'none',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
              <Plus size={15} /> Registrar
            </button>

            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                padding: '13px 16px',
                background: 'transparent',
                color: 'var(--sk-ink)',
                border: '1px solid var(--sk-ink)',
                cursor: 'pointer',
                font: 'inherit',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
              title="Repetir lo mismo que ayer a esta hora">
              <RotateCcw size={15} /> Ayer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const iconBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 30,
  height: 30,
  border: 'none',
  background: 'transparent',
  color: 'var(--sk-ink)',
  cursor: 'pointer',
  padding: 0,
};
