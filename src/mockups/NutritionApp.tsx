import React, { useState } from 'react';
import { Tabs } from '@base-ui/react';
import { LogPanel } from './nutrition/LogPanel';
import { TrendsPanel } from './nutrition/TrendsPanel';
import { Rule } from './nutrition/parts';

/* ============================================================
   App de registro nutricional.

   Dos secciones bajo una misma cabecera: Resumen (el progreso en el
   tiempo) y Registro (el detalle del dia, donde se edita).

   La navegacion usa Tabs de Base UI para heredar el manejo de
   teclado, pero se viste con el lenguaje de la tabla nutricional: la
   seccion activa lleva su filete debajo, no una pastilla.
   ============================================================ */

export const NutritionApp: React.FC = () => {
  const [section, setSection] = useState('resumen');

  return (
    <div
      className="paper"
      style={{
        background: 'var(--paper-bg)',
        color: 'var(--paper-ink)',
        minHeight: '100%',
        padding: '32px 24px 72px',
        fontFamily: 'var(--font-ui)'
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

          <Rule weight={10} />

          <Tabs.Panel value="resumen">
            <TrendsPanel />
          </Tabs.Panel>

          <Tabs.Panel value="registro">
            <LogPanel />
          </Tabs.Panel>
        </Tabs.Root>

        <div style={{ paddingTop: 26 }}>
          <Rule weight={10} />
        </div>
      </div>
    </div>
  );
};
