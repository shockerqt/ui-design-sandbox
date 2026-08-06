import React, { useState } from 'react';
import { Accordion, Dialog, Tabs } from '@base-ui/react';
import { ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

/* ============================================================
   Resumen diario de un registro nutricional.

   El lenguaje visual es el de la tabla nutricional: filetes
   horizontales de peso variable, grotesca condensada en caja alta
   y datos alineados con jerarquia estricta. El avance de cada
   macro no se dibuja como barra encima del diseño: se lee en los
   mismos filetes que estructuran el panel.
   ============================================================ */

type Meal = {
  slot: string;
  time: string | null;
  kcal: number;
  items: Array<{ name: string; detail: string; kcal: number }>;
};

type Day = {
  label: string;
  date: string;
  kcal: number;
  meals: Meal[];
  macros: { protein: number; carbs: number; fat: number };
};

const TARGET = { kcal: 2200, protein: 120, carbs: 245, fat: 73 };

const DAYS: Day[] = [
  {
    label: 'Domingo',
    date: '3 agosto',
    kcal: 2410,
    macros: { protein: 104, carbs: 288, fat: 89 },
    meals: [
      {
        slot: 'Desayuno',
        time: '09:20',
        kcal: 520,
        items: [
          { name: 'Huevos revueltos', detail: '3 unidades', kcal: 310 },
          { name: 'Pan amasado', detail: '1 unidad', kcal: 210 }
        ]
      },
      {
        slot: 'Almuerzo',
        time: '14:10',
        kcal: 980,
        items: [
          { name: 'Pastel de choclo', detail: '1 porcion', kcal: 720 },
          { name: 'Ensalada chilena', detail: '1 taza', kcal: 90 },
          { name: 'Jugo natural', detail: '350 ml', kcal: 170 }
        ]
      },
      {
        slot: 'Once',
        time: '19:00',
        kcal: 410,
        items: [{ name: 'Marraqueta con palta', detail: '1/2 unidad', kcal: 410 }]
      },
      {
        slot: 'Cena',
        time: '22:15',
        kcal: 500,
        items: [{ name: 'Cazuela de vacuno', detail: '1 plato', kcal: 500 }]
      }
    ]
  },
  {
    label: 'Lunes',
    date: '4 agosto',
    kcal: 2085,
    macros: { protein: 128, carbs: 210, fat: 66 },
    meals: [
      {
        slot: 'Desayuno',
        time: '07:45',
        kcal: 385,
        items: [
          { name: 'Avena con leche', detail: '1 taza', kcal: 240 },
          { name: 'Platano', detail: '1 unidad', kcal: 145 }
        ]
      },
      {
        slot: 'Almuerzo',
        time: '13:30',
        kcal: 760,
        items: [
          { name: 'Pollo a la plancha', detail: '180 g', kcal: 340 },
          { name: 'Arroz integral', detail: '1 taza', kcal: 220 },
          { name: 'Zapallo italiano salteado', detail: '1 taza', kcal: 200 }
        ]
      },
      {
        slot: 'Once',
        time: '18:20',
        kcal: 320,
        items: [{ name: 'Yogurt con granola', detail: '200 g', kcal: 320 }]
      },
      {
        slot: 'Cena',
        time: '21:00',
        kcal: 620,
        items: [
          { name: 'Salmon al horno', detail: '150 g', kcal: 380 },
          { name: 'Pure de papas', detail: '1 taza', kcal: 240 }
        ]
      }
    ]
  },
  {
    label: 'Martes',
    date: '5 agosto',
    kcal: 1840,
    macros: { protein: 112, carbs: 186, fat: 61 },
    meals: [
      {
        slot: 'Desayuno',
        time: '08:05',
        kcal: 420,
        items: [
          { name: 'Tostadas integrales', detail: '2 rebanadas', kcal: 180 },
          { name: 'Palta', detail: '1/2 unidad', kcal: 160 },
          { name: 'Cafe con leche', detail: '250 ml', kcal: 80 }
        ]
      },
      {
        slot: 'Almuerzo',
        time: '13:40',
        kcal: 680,
        items: [
          { name: 'Merluza al vapor', detail: '160 g', kcal: 220 },
          { name: 'Quinoa', detail: '1 taza', kcal: 280 },
          { name: 'Brocoli', detail: '1 taza', kcal: 180 }
        ]
      },
      {
        slot: 'Once',
        time: '18:30',
        kcal: 340,
        items: [
          { name: 'Queso fresco', detail: '60 g', kcal: 160 },
          { name: 'Galletas de arroz', detail: '4 unidades', kcal: 180 }
        ]
      },
      { slot: 'Cena', time: null, kcal: 0, items: [] }
    ]
  }
];

/* --- Escala tipografica del panel --- */

const condensed = (weight: number, size: string): React.CSSProperties => ({
  fontFamily: 'var(--font-display)',
  fontVariationSettings: `'wdth' 80, 'wght' ${weight}`,
  fontSize: size,
  letterSpacing: '0.01em',
  lineHeight: 1.05
});

const Rule: React.FC<{ weight: number; tint?: boolean }> = ({ weight, tint }) => (
  <div
    style={{
      height: weight,
      background: tint ? 'var(--paper-tint)' : 'var(--paper-ink)',
      flex: 'none'
    }}
  />
);

/**
 * El avance no es una barra sobrepuesta: es el filete de la tabla,
 * partido en la proporcion consumida.
 */
const RuleMeter: React.FC<{ ratio: number; weight?: number }> = ({ ratio, weight = 6 }) => {
  const pct = Math.min(ratio, 1) * 100;
  const over = ratio > 1;
  return (
    <div style={{ display: 'flex', height: weight, background: 'var(--paper-tint)' }}>
      <div
        style={{
          width: `${pct}%`,
          background: over ? 'var(--paper-signal)' : 'var(--paper-ink)',
          transition: 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      />
    </div>
  );
};

const MacroRow: React.FC<{
  name: string;
  grams: number;
  target: number;
  unit: 'g' | 'pct';
}> = ({ name, grams, target, unit }) => {
  const ratio = grams / target;
  return (
    <div style={{ paddingTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
        <span style={{ ...condensed(700, '0.95rem'), textTransform: 'uppercase' }}>{name}</span>
        <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={condensed(700, '1.15rem')}>
            {unit === 'g' ? `${grams} g` : `${Math.round(ratio * 100)}%`}
          </span>
          <span
            style={{
              ...condensed(400, '0.8rem'),
              color: 'var(--paper-quiet)',
              minWidth: 62,
              textAlign: 'right'
            }}
          >
            {unit === 'g' ? `de ${target} g` : `${grams} g`}
          </span>
        </span>
      </div>
      <div style={{ paddingTop: 7 }}>
        <RuleMeter ratio={ratio} />
      </div>
    </div>
  );
};

export const NutritionSummary: React.FC = () => {
  const [index, setIndex] = useState(DAYS.length - 1);
  const [unit, setUnit] = useState<'g' | 'pct'>('g');

  const day = DAYS[index];
  const remaining = TARGET.kcal - day.kcal;
  const over = remaining < 0;
  const logged = day.meals.filter(m => m.time !== null).length;

  return (
    <div
      className="paper"
      style={{
        background: 'var(--paper-bg)',
        color: 'var(--paper-ink)',
        minHeight: '100%',
        padding: '40px 24px 72px',
        fontFamily: 'var(--font-ui)'
      }}
    >
      <div style={{ maxWidth: 620, margin: '0 auto' }}>
        {/* Navegacion por dia */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 18
          }}
        >
          <button
            onClick={() => setIndex(i => Math.max(0, i - 1))}
            disabled={index === 0}
            aria-label="Dia anterior"
            style={{
              background: 'none',
              border: 'none',
              cursor: index === 0 ? 'default' : 'pointer',
              opacity: index === 0 ? 0.25 : 1,
              color: 'inherit',
              padding: 4
            }}
          >
            <ChevronLeft size={20} />
          </button>

          <div style={{ textAlign: 'center' }}>
            <div style={{ ...condensed(800, '1.05rem'), textTransform: 'uppercase' }}>
              {day.label}
            </div>
            <div style={{ ...condensed(400, '0.8rem'), color: 'var(--paper-quiet)' }}>
              {day.date}
            </div>
          </div>

          <button
            onClick={() => setIndex(i => Math.min(DAYS.length - 1, i + 1))}
            disabled={index === DAYS.length - 1}
            aria-label="Dia siguiente"
            style={{
              background: 'none',
              border: 'none',
              cursor: index === DAYS.length - 1 ? 'default' : 'pointer',
              opacity: index === DAYS.length - 1 ? 0.25 : 1,
              color: 'inherit',
              padding: 4
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* ---------- El panel ---------- */}

        <Rule weight={10} />

        <div style={{ padding: '10px 0 4px' }}>
          <h1 style={{ ...condensed(800, '2rem'), textTransform: 'uppercase' }}>
            Resumen del dia
          </h1>
        </div>

        <Rule weight={1} />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            padding: '7px 0'
          }}
        >
          <span style={{ ...condensed(400, '0.85rem') }}>Comidas registradas</span>
          <span style={{ ...condensed(700, '0.85rem') }}>{logged} de 4</span>
        </div>

        <Rule weight={7} />

        {/* Calorias: la cifra que manda */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', paddingTop: 10 }}>
          <span style={{ ...condensed(800, '1.3rem'), textTransform: 'uppercase' }}>Calorias</span>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={condensed(800, '3.4rem')}>{day.kcal.toLocaleString('es-CL')}</span>
            <span style={{ ...condensed(400, '1rem'), color: 'var(--paper-quiet)' }}>
              / {TARGET.kcal.toLocaleString('es-CL')}
            </span>
          </span>
        </div>

        <div style={{ paddingTop: 10 }}>
          <RuleMeter ratio={day.kcal / TARGET.kcal} weight={10} />
        </div>

        <div
          style={{
            ...condensed(600, '0.9rem'),
            color: over ? 'var(--paper-signal)' : 'var(--paper-quiet)',
            paddingTop: 8,
            textTransform: 'uppercase'
          }}
        >
          {over
            ? `${Math.abs(remaining).toLocaleString('es-CL')} kcal sobre el objetivo`
            : `Quedan ${remaining.toLocaleString('es-CL')} kcal`}
        </div>

        <div style={{ paddingTop: 18 }}>
          <Rule weight={4} />
        </div>

        {/* Macros, con el conmutador de unidad */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0 4px'
          }}
        >
          <span style={{ ...condensed(800, '1rem'), textTransform: 'uppercase' }}>Macros</span>

          <Tabs.Root value={unit} onValueChange={v => setUnit(v as 'g' | 'pct')}>
            <Tabs.List className="base-Tabs-list">
              <Tabs.Tab className="base-Tabs-tab" value="g">
                Gramos
              </Tabs.Tab>
              <Tabs.Tab className="base-Tabs-tab" value="pct">
                % objetivo
              </Tabs.Tab>
              <Tabs.Indicator className="base-Tabs-indicator" />
            </Tabs.List>
          </Tabs.Root>
        </div>

        <Rule weight={1} />

        <MacroRow name="Proteina" grams={day.macros.protein} target={TARGET.protein} unit={unit} />
        <MacroRow name="Carbohidratos" grams={day.macros.carbs} target={TARGET.carbs} unit={unit} />
        <MacroRow name="Grasas" grams={day.macros.fat} target={TARGET.fat} unit={unit} />

        <div style={{ paddingTop: 22 }}>
          <Rule weight={7} />
        </div>

        {/* Comidas del dia */}
        <div style={{ padding: '12px 0 6px' }}>
          <span style={{ ...condensed(800, '1rem'), textTransform: 'uppercase' }}>Comidas</span>
        </div>

        <Rule weight={1} />

        <Accordion.Root>
          {day.meals.map(meal =>
            meal.time === null ? (
              <div
                key={meal.slot}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 2px',
                  borderBottom: '1px solid var(--paper-tint)',
                  color: 'var(--paper-quiet)'
                }}
              >
                <span style={{ ...condensed(700, '0.95rem'), textTransform: 'uppercase' }}>
                  {meal.slot}
                </span>
                <span style={{ ...condensed(400, '0.85rem') }}>Sin registrar</span>
              </div>
            ) : (
              <Accordion.Item key={meal.slot} className="base-Accordion-item">
                <Accordion.Header>
                  <Accordion.Trigger className="base-Accordion-trigger" style={{ padding: '14px 2px' }}>
                    <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span style={{ ...condensed(700, '0.95rem'), textTransform: 'uppercase' }}>
                        {meal.slot}
                      </span>
                      <span style={{ ...condensed(400, '0.8rem'), color: 'var(--paper-quiet)' }}>
                        {meal.time}
                      </span>
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={condensed(700, '1rem')}>{meal.kcal} kcal</span>
                      <ChevronDown className="base-Accordion-chevron" size={15} />
                    </span>
                  </Accordion.Trigger>
                </Accordion.Header>

                <Accordion.Panel className="base-Accordion-panel">
                  {meal.items.map(item => (
                    <div
                      key={item.name}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 16,
                        padding: '5px 0',
                        fontSize: '0.85rem'
                      }}
                    >
                      <span>
                        {item.name}
                        <span style={{ color: 'var(--paper-quiet)' }}> · {item.detail}</span>
                      </span>
                      <span style={{ ...condensed(600, '0.85rem'), whiteSpace: 'nowrap' }}>
                        {item.kcal} kcal
                      </span>
                    </div>
                  ))}
                </Accordion.Panel>
              </Accordion.Item>
            )
          )}
        </Accordion.Root>

        {/* Registrar */}
        <Dialog.Root>
          <Dialog.Trigger
            style={{
              ...condensed(800, '1rem'),
              textTransform: 'uppercase',
              width: '100%',
              marginTop: 24,
              padding: '15px',
              background: 'var(--paper-ink)',
              color: 'var(--paper-bg)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <Plus size={17} /> Registrar comida
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Backdrop className="base-Dialog-backdrop" />
            <Dialog.Popup className="base-Dialog-popup">
              <Dialog.Title style={{ ...condensed(800, '1.35rem'), textTransform: 'uppercase' }}>
                Registrar comida
              </Dialog.Title>

              <div style={{ margin: '12px 0' }}>
                <Rule weight={4} />
              </div>

              <Dialog.Description style={{ fontSize: '0.9rem', color: 'var(--paper-quiet)', marginBottom: 20 }}>
                Elige el momento del dia y busca el alimento. Las porciones se guardan
                para la proxima vez.
              </Dialog.Description>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <Dialog.Close
                  style={{
                    ...condensed(700, '0.9rem'),
                    textTransform: 'uppercase',
                    padding: '10px 18px',
                    background: 'none',
                    border: '1.5px solid var(--paper-ink)',
                    color: 'var(--paper-ink)',
                    cursor: 'pointer'
                  }}
                >
                  Cancelar
                </Dialog.Close>
                <Dialog.Close
                  style={{
                    ...condensed(700, '0.9rem'),
                    textTransform: 'uppercase',
                    padding: '10px 18px',
                    background: 'var(--paper-ink)',
                    border: '1.5px solid var(--paper-ink)',
                    color: 'var(--paper-bg)',
                    cursor: 'pointer'
                  }}
                >
                  Continuar
                </Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>

        <div style={{ paddingTop: 26 }}>
          <Rule weight={10} />
        </div>
      </div>
    </div>
  );
};
