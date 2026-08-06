import React, { useState } from 'react';
import { Tabs } from '@base-ui/react';
import { LogPanel } from './nutrition/LogPanel';
import { TrendsPanel } from './nutrition/TrendsPanel';
import { Rule } from './nutrition/parts';

/* ============================================================
   App de registro nutricional.

   Dos secciones bajo una misma cabecera: Resumen (el progreso en el
   tiempo) y Registro (el detalle del dia, donde se edita).

   El selector de piel de arriba es un control del laboratorio, no
   del producto: por eso viste el cromo del sandbox y no el de la
   app. Cambia la clase del tema, y todo el estilo sale de las
   variables --sk-*, asi que la estructura no se mueve.
   ============================================================ */

const SKINS = [
  { key: 'tabla', label: 'Tabla nutricional' },
  { key: 'cocina', label: 'Riel de cocina' },
  { key: 'ficha', label: 'Expediente clinico' },
  { key: 'editorial', label: 'Sobremesa editorial' },
  { key: 'nocturno', label: 'Instrumento nocturno' }
] as const;

type SkinKey = (typeof SKINS)[number]['key'];

export const NutritionApp: React.FC = () => {
  const [skin, setSkin] = useState<SkinKey>('tabla');
  const [section, setSection] = useState('resumen');

  return (
    <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Control del laboratorio */}
      <div className="skin-picker">
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.62rem',
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--fg-faint)',
            marginRight: 4
          }}
        >
          Estilo
        </span>

        {SKINS.map(s => (
          <button
            key={s.key}
            className="skin-picker-btn"
            data-active={skin === s.key}
            aria-pressed={skin === s.key}
            onClick={() => setSkin(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div
        className={`skin skin-${skin}`}
        style={{
          flex: 1,
          background: 'var(--sk-bg)',
          color: 'var(--sk-ink)',
          padding: 'clamp(16px, 5vw, 32px) clamp(12px, 4vw, 24px) 72px',
          fontFamily: 'var(--sk-font-ui)'
        }}
      >
        <div style={{ maxWidth: 620, margin: '0 auto' }}>
          <Tabs.Root value={section} onValueChange={v => setSection(v as string)}>
            <Tabs.List className="nav-list">
              <Tabs.Tab className="nav-tab" value="resumen">
                Resumen
              </Tabs.Tab>
              <Tabs.Tab className="nav-tab" value="registro">
                Registro
              </Tabs.Tab>
            </Tabs.List>

            <Rule level="heavy" />

            <Tabs.Panel value="resumen">
              <TrendsPanel />
            </Tabs.Panel>

            <Tabs.Panel value="registro">
              <LogPanel />
            </Tabs.Panel>
          </Tabs.Root>

          <div style={{ paddingTop: 26 }}>
            <Rule level="heavy" />
          </div>
        </div>
      </div>
    </div>
  );
};
