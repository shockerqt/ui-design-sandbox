import React, { useState } from 'react';
import { Accordion, Dialog, Popover } from '@base-ui/react';
import { ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  FoodItem,
  Meal,
  RECENT_MEALS,
  TARGET,
  mealTotals,
  shortDate,
  weekday
} from './nutrition/data';
import { Rule, RuleMeter, condensed } from './nutrition/parts';

/* ============================================================
   Registro del dia.

   Aqui se ve el detalle de lo comido, se edita y se agrega. El
   resumen del dia esta arriba como contexto, no como protagonista:
   la vista existe para operar sobre las comidas.
   ============================================================ */

const TODAY = new Date(2026, 7, 5);
const OFFSETS = [2, 1, 0]; // del mas antiguo al mas reciente

const dateFor = (offset: number) => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - offset);
  return d;
};

const iconBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 26,
  height: 26,
  border: 'none',
  background: 'transparent',
  color: 'var(--paper-quiet)',
  cursor: 'pointer',
  padding: 0
};

const ItemRow: React.FC<{ item: FoodItem }> = ({ item }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      padding: '6px 0',
      fontSize: '0.85rem'
    }}
  >
    <span style={{ minWidth: 0 }}>
      {item.name}
      <span style={{ color: 'var(--paper-quiet)' }}> · {item.detail}</span>
    </span>

    <span style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 'none' }}>
      <span style={{ ...condensed(600, '0.85rem'), whiteSpace: 'nowrap' }}>{item.kcal} kcal</span>

      <Popover.Root>
        <Popover.Trigger style={iconBtn} aria-label={`Opciones de ${item.name}`}>
          <MoreHorizontal size={15} />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={6} align="end">
            <Popover.Popup className="base-Popover-popup" style={{ padding: 6, minWidth: 150 }}>
              {[
                { icon: <Pencil size={13} />, label: 'Editar porcion' },
                { icon: <Trash2 size={13} />, label: 'Quitar del dia' }
              ].map(action => (
                <button
                  key={action.label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '7px 8px',
                    border: 'none',
                    background: 'transparent',
                    color: 'inherit',
                    font: 'inherit',
                    fontSize: '0.82rem',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  {action.icon}
                  {action.label}
                </button>
              ))}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </span>
  </div>
);

const MealBlock: React.FC<{ meal: Meal }> = ({ meal }) => {
  const kcal = meal.items.reduce((s, i) => s + i.kcal, 0);

  if (meal.time === null) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '13px 2px',
          borderBottom: '1px solid var(--paper-tint)'
        }}
      >
        <span
          style={{
            ...condensed(700, '0.95rem'),
            textTransform: 'uppercase',
            color: 'var(--paper-quiet)'
          }}
        >
          {meal.slot}
        </span>
        <button
          style={{
            ...condensed(700, '0.8rem'),
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            border: '1.5px solid var(--paper-ink)',
            background: 'transparent',
            color: 'var(--paper-ink)',
            padding: '5px 10px',
            cursor: 'pointer'
          }}
        >
          <Plus size={13} /> Agregar
        </button>
      </div>
    );
  }

  return (
    <Accordion.Item className="base-Accordion-item">
      <Accordion.Header>
        <Accordion.Trigger className="base-Accordion-trigger" style={{ padding: '13px 2px' }}>
          <span style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <span style={{ ...condensed(700, '0.95rem'), textTransform: 'uppercase' }}>
              {meal.slot}
            </span>
            <span style={{ ...condensed(400, '0.8rem'), color: 'var(--paper-quiet)' }}>
              {meal.time}
            </span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={condensed(700, '1rem')}>{kcal} kcal</span>
            <ChevronDown className="base-Accordion-chevron" size={15} />
          </span>
        </Accordion.Trigger>
      </Accordion.Header>

      <Accordion.Panel className="base-Accordion-panel">
        {meal.items.map(item => (
          <ItemRow key={item.name} item={item} />
        ))}

        <button
          style={{
            ...condensed(700, '0.8rem'),
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
            border: 'none',
            background: 'transparent',
            color: 'var(--paper-ink)',
            padding: '4px 0',
            cursor: 'pointer'
          }}
        >
          <Plus size={14} /> Agregar alimento a {meal.slot.toLowerCase()}
        </button>
      </Accordion.Panel>
    </Accordion.Item>
  );
};

export const NutritionLog: React.FC = () => {
  const [pos, setPos] = useState(OFFSETS.length - 1);

  const offset = OFFSETS[pos];
  const date = dateFor(offset);
  const meals = RECENT_MEALS[offset];
  const totals = mealTotals(meals);

  const remaining = TARGET.kcal - totals.kcal;
  const over = remaining < 0;
  const logged = meals.filter(m => m.time !== null).length;

  const macros = [
    { name: 'Proteina', value: totals.protein, target: TARGET.protein },
    { name: 'Carbohidratos', value: totals.carbs, target: TARGET.carbs },
    { name: 'Grasas', value: totals.fat, target: TARGET.fat }
  ];

  return (
    <div
      className="paper"
      style={{
        background: 'var(--paper-bg)',
        color: 'var(--paper-ink)',
        minHeight: '100%',
        padding: '36px 24px 72px',
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
            marginBottom: 16
          }}
        >
          <button
            onClick={() => setPos(p => Math.max(0, p - 1))}
            disabled={pos === 0}
            aria-label="Dia anterior"
            style={{
              ...iconBtn,
              color: 'var(--paper-ink)',
              cursor: pos === 0 ? 'default' : 'pointer',
              opacity: pos === 0 ? 0.25 : 1
            }}
          >
            <ChevronLeft size={20} />
          </button>

          <div style={{ textAlign: 'center' }}>
            <div style={{ ...condensed(800, '1.05rem'), textTransform: 'uppercase' }}>
              {offset === 0 ? 'Hoy' : weekday(date)}
            </div>
            <div style={{ ...condensed(400, '0.8rem'), color: 'var(--paper-quiet)' }}>
              {shortDate(date)}
            </div>
          </div>

          <button
            onClick={() => setPos(p => Math.min(OFFSETS.length - 1, p + 1))}
            disabled={pos === OFFSETS.length - 1}
            aria-label="Dia siguiente"
            style={{
              ...iconBtn,
              color: 'var(--paper-ink)',
              cursor: pos === OFFSETS.length - 1 ? 'default' : 'pointer',
              opacity: pos === OFFSETS.length - 1 ? 0.25 : 1
            }}
          >
            <ChevronRight size={20} />
          </button>
        </div>

        <Rule weight={10} />

        <div style={{ padding: '10px 0 4px' }}>
          <h1 style={{ ...condensed(800, '2rem'), textTransform: 'uppercase' }}>Registro</h1>
        </div>

        <Rule weight={1} />

        {/* Resumen del dia: contexto, no protagonista */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 16,
            padding: '12px 0 10px'
          }}
        >
          <div>
            <div
              style={{
                ...condensed(400, '0.72rem'),
                color: 'var(--paper-quiet)',
                textTransform: 'uppercase'
              }}
            >
              Calorias del dia
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <span style={condensed(800, '2.4rem')}>{totals.kcal.toLocaleString('es-CL')}</span>
              <span style={{ ...condensed(400, '0.95rem'), color: 'var(--paper-quiet)' }}>
                / {TARGET.kcal.toLocaleString('es-CL')}
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                ...condensed(400, '0.72rem'),
                color: 'var(--paper-quiet)',
                textTransform: 'uppercase'
              }}
            >
              {over ? 'Sobre el objetivo' : 'Quedan'}
            </div>
            <div
              style={{
                ...condensed(800, '1.6rem'),
                color: over ? 'var(--paper-signal)' : 'var(--paper-ink)'
              }}
            >
              {Math.abs(remaining).toLocaleString('es-CL')} kcal
            </div>
          </div>
        </div>

        <RuleMeter ratio={totals.kcal / TARGET.kcal} weight={8} />

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 16,
            paddingTop: 14
          }}
        >
          {macros.map(m => (
            <div key={m.name}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 6
                }}
              >
                <span style={{ ...condensed(700, '0.75rem'), textTransform: 'uppercase' }}>
                  {m.name}
                </span>
                <span style={{ ...condensed(400, '0.72rem'), color: 'var(--paper-quiet)' }}>
                  {m.value}/{m.target} g
                </span>
              </div>
              <div style={{ paddingTop: 6 }}>
                <RuleMeter ratio={m.value / m.target} weight={4} />
              </div>
            </div>
          ))}
        </div>

        <div style={{ paddingTop: 22 }}>
          <Rule weight={7} />
        </div>

        {/* Comidas */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0 8px'
          }}
        >
          <span style={{ ...condensed(800, '1rem'), textTransform: 'uppercase' }}>Comidas</span>
          <span style={{ ...condensed(400, '0.8rem'), color: 'var(--paper-quiet)' }}>
            {logged} de 4 registradas
          </span>
        </div>

        <Rule weight={1} />

        <Accordion.Root>
          {meals.map(meal => (
            <MealBlock key={meal.slot} meal={meal} />
          ))}
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

              <Dialog.Description
                style={{ fontSize: '0.9rem', color: 'var(--paper-quiet)', marginBottom: 20 }}
              >
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
