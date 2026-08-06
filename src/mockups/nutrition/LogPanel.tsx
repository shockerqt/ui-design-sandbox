import React, { useState } from 'react';
import { Accordion, Dialog, Popover } from '@base-ui/react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2
} from 'lucide-react';
import { FoodItem, Meal, RECENT_MEALS, TARGET, mealTotals, shortDate, weekday } from './data';
import { Rule, RuleMeter, SK, display, plain } from './parts';

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
  color: SK.quiet,
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
      <span style={{ color: SK.quiet }}> · {item.detail}</span>
    </span>

    <span style={{ display: 'flex', alignItems: 'center', gap: 4, flex: 'none' }}>
      <span style={{ ...plain('0.85rem', 600), whiteSpace: 'nowrap' }}>{item.kcal} kcal</span>

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
          borderBottom: '1px solid var(--sk-tint)'
        }}
      >
        <span
          style={{
            ...display('0.95rem', 700),
            color: SK.quiet
          }}
        >
          {meal.slot}
        </span>
        <button
          style={{
            ...display('0.8rem', 700),
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            border: 'var(--sk-border) solid var(--sk-ink)',
            background: 'transparent',
            color: SK.ink,
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
            <span style={{ ...display('0.95rem', 700) }}>
              {meal.slot}
            </span>
            <span style={{ ...plain('0.8rem', 400), color: SK.quiet }}>
              {meal.time}
            </span>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={display('1rem', 700)}>{kcal} kcal</span>
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
            ...display('0.8rem', 700),
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 8,
            border: 'none',
            background: 'transparent',
            color: SK.ink,
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

export const LogPanel: React.FC = () => {
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
    <>
      {/* Navegacion por dia */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 0'
        }}
      >
        <button
          onClick={() => setPos(p => Math.max(0, p - 1))}
          disabled={pos === 0}
          aria-label="Dia anterior"
          style={{
            ...iconBtn,
            color: SK.ink,
            cursor: pos === 0 ? 'default' : 'pointer',
            opacity: pos === 0 ? 0.25 : 1
          }}
        >
          <ChevronLeft size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
          <span style={{ ...display('1.05rem', 800) }}>
            {offset === 0 ? 'Hoy' : weekday(date)}
          </span>
          <span style={{ ...plain('0.85rem', 400), color: SK.quiet }}>
            {shortDate(date)}
          </span>
        </div>

        <button
          onClick={() => setPos(p => Math.min(OFFSETS.length - 1, p + 1))}
          disabled={pos === OFFSETS.length - 1}
          aria-label="Dia siguiente"
          style={{
            ...iconBtn,
            color: SK.ink,
            cursor: pos === OFFSETS.length - 1 ? 'default' : 'pointer',
            opacity: pos === OFFSETS.length - 1 ? 0.25 : 1
          }}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <Rule level="mid" />

      {/* Resumen del dia: contexto, no protagonista */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          padding: '14px 0 10px'
        }}
      >
        <div>
          <div
            style={{
              ...plain('0.72rem', 400),
              color: SK.quiet
            }}
          >
            Calorias del dia
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
            <span style={display('2.4rem', 800)}>{totals.kcal.toLocaleString('es-CL')}</span>
            <span style={{ ...plain('0.95rem', 400), color: SK.quiet }}>
              / {TARGET.kcal.toLocaleString('es-CL')}
            </span>
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              ...plain('0.72rem', 400),
              color: SK.quiet
            }}
          >
            {over ? 'Sobre el objetivo' : 'Quedan'}
          </div>
          <div
            style={{
              ...display('1.6rem', 800),
              color: over ? SK.signal : SK.ink
            }}
          >
            {Math.abs(remaining).toLocaleString('es-CL')} kcal
          </div>
        </div>
      </div>

      <RuleMeter ratio={totals.kcal / TARGET.kcal} tall />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, paddingTop: 14 }}>
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
              <span style={{ ...display('0.75rem', 700) }}>
                {m.name}
              </span>
              <span style={{ ...plain('0.72rem', 400), color: SK.quiet }}>
                {m.value}/{m.target} g
              </span>
            </div>
            <div style={{ paddingTop: 6 }}>
              <RuleMeter ratio={m.value / m.target} />
            </div>
          </div>
        ))}
      </div>

      <div style={{ paddingTop: 22 }}>
        <Rule level="mid" />
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
        <span style={{ ...display('1rem', 800) }}>Comidas</span>
        <span style={{ ...plain('0.8rem', 400), color: SK.quiet }}>
          {logged} de 4 registradas
        </span>
      </div>

      <Rule />

      <Accordion.Root>
        {meals.map(meal => (
          <MealBlock key={meal.slot} meal={meal} />
        ))}
      </Accordion.Root>

      {/* Registrar */}
      <Dialog.Root>
        <Dialog.Trigger
          style={{
            ...display('1rem', 800),
            width: '100%',
            marginTop: 24,
            padding: '15px',
            background: SK.ink,
            color: SK.bg,
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
            <Dialog.Title style={{ ...display('1.35rem', 800) }}>
              Registrar comida
            </Dialog.Title>

            <div style={{ margin: '12px 0' }}>
              <Rule level="mid" />
            </div>

            <Dialog.Description
              style={{ fontSize: '0.9rem', color: SK.quiet, marginBottom: 20 }}
            >
              Elige el momento del dia y busca el alimento. Las porciones se guardan para la
              proxima vez.
            </Dialog.Description>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Dialog.Close
                style={{
                  ...display('0.9rem', 700),
                  padding: '10px 18px',
                  background: 'none',
                  border: 'var(--sk-border) solid var(--sk-ink)',
                  color: SK.ink,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </Dialog.Close>
              <Dialog.Close
                style={{
                  ...display('0.9rem', 700),
                  padding: '10px 18px',
                  background: SK.ink,
                  border: 'var(--sk-border) solid var(--sk-ink)',
                  color: SK.bg,
                  cursor: 'pointer'
                }}
              >
                Continuar
              </Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};
