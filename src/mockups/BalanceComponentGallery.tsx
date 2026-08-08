import React, { useState } from 'react';
import { Dialog, Switch } from '@base-ui/react';
import {
  AlertTriangle,
  ArrowDownToLine,
  BarChart3,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  ListChecks,
  Plus,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';

const DAYS = [
  { day: 'L', date: 3 },
  { day: 'M', date: 4 },
  { day: 'M', date: 5 },
  { day: 'J', date: 6 },
  { day: 'V', date: 7 },
  { day: 'S', date: 8 },
  { day: 'D', date: 9 },
];

const MEALS = [
  { time: '08', name: 'Yogur griego natural', portion: '170 g', kcal: 126, protein: 17 },
  { time: '08', name: 'Avena tradicional', portion: '45 g', kcal: 171, protein: 6 },
  { time: '13', name: 'Lentejas con zapallo', portion: '340 g', kcal: 412, protein: 24 },
  { time: '13', name: 'Ensalada chilena', portion: '180 g', kcal: 86, protein: 2 },
  { time: '17', name: 'Manzana fuji', portion: '1 un', kcal: 95, protein: 0 },
];

const PALETTES = {
  libro: {
    label: 'Libro',
    bg: '#F2F5EE',
    surface: '#FFFFFF',
    raised: '#E9EEE2',
    ink: '#1A1D19',
    quiet: '#6F776A',
    faint: '#9AA393',
    line: '#CFD8C6',
    danger: '#B4232A',
  },
  noche: {
    label: 'Noche',
    bg: '#12160F',
    surface: '#1A1F16',
    raised: '#232A1E',
    ink: '#EEF2E6',
    quiet: '#9AA392',
    faint: '#656E5D',
    line: '#333C2C',
    danger: '#FF6B6B',
  },
  tinta: {
    label: 'Alta tinta',
    bg: '#ECEFE8',
    surface: '#F9FAF7',
    raised: '#DDE3D7',
    ink: '#050604',
    quiet: '#454A42',
    faint: '#777E72',
    line: '#AEB8A6',
    danger: '#9C1018',
  },
} as const;

type PaletteKey = keyof typeof PALETTES;

function GalleryLabel({ children, index }: { children: React.ReactNode; index?: string }) {
  return (
    <div className="bcg-label">
      {index && <span>{index}</span>}
      {children}
    </div>
  );
}

function ProductButton({
  children,
  variant = 'primary',
  disabled = false,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  return (
    <button className={`bcg-button bcg-button--${variant}`} disabled={disabled}>
      {children}
    </button>
  );
}

function OverlayActions() {
  return (
    <div className="bcg-overlay-actions">
      <Dialog.Root>
        <Dialog.Trigger className="bcg-button bcg-button--secondary">
          <Trash2 size={15} /> Abrir modal
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className="bcg-dialog-backdrop" />
          <Dialog.Popup className="bcg-dialog-popup">
            <div className="bcg-dialog-icon"><AlertTriangle size={20} /></div>
            <Dialog.Title className="bcg-dialog-title">Eliminar 2 registros</Dialog.Title>
            <Dialog.Description className="bcg-dialog-description">
              Se quitarán del jueves 6 de agosto. Esta acción no cambia los alimentos guardados.
            </Dialog.Description>
            <div className="bcg-dialog-actions">
              <Dialog.Close className="bcg-button bcg-button--ghost">Cancelar</Dialog.Close>
              <Dialog.Close className="bcg-button bcg-button--danger">Eliminar registros</Dialog.Close>
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      <Dialog.Root>
        <Dialog.Trigger className="bcg-button bcg-button--primary">
          <ArrowDownToLine size={15} /> Abrir drawer
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Backdrop className="bcg-dialog-backdrop" />
          <Dialog.Popup className="bcg-drawer-popup">
            <div className="bcg-drawer-rule" />
            <header className="bcg-drawer-head">
              <div>
                <Dialog.Title className="bcg-dialog-title">Registrar</Dialog.Title>
                <Dialog.Description className="bcg-drawer-time">13:30</Dialog.Description>
              </div>
              <Dialog.Close className="bcg-icon-button" aria-label="Cerrar drawer"><X size={18} /></Dialog.Close>
            </header>
            <div className="bcg-drawer-body">
              <label className="bcg-field">
                <span>Buscar alimento</span>
                <span className="bcg-input-wrap"><Search size={16} /><input autoFocus placeholder="Arroz, yogur, lentejas…" /></span>
              </label>
              <div className="bcg-suggestion-head"><Sparkles size={14} /> Sugeridos para la hora</div>
              {['Lentejas cocidas', 'Pechuga de pollo', 'Ensalada chilena'].map((food, index) => (
                <button className="bcg-food-pick" key={food}>
                  <span><strong>{food}</strong><small>{[116, 165, 48][index]} kcal · 100 g</small></span>
                  <Plus size={17} />
                </button>
              ))}
            </div>
            <footer className="bcg-drawer-footer">
              <button className="bcg-button bcg-button--primary" disabled>Agregar</button>
            </footer>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}

export const BalanceComponentGallery: React.FC = () => {
  const [paletteKey, setPaletteKey] = useState<PaletteKey>('libro');
  const [selectedDay, setSelectedDay] = useState(3);
  const [activeTab, setActiveTab] = useState<'summary' | 'log'>('log');
  const [compact, setCompact] = useState(true);
  const palette = PALETTES[paletteKey];

  const paletteStyle = {
    '--bcg-bg': palette.bg,
    '--bcg-surface': palette.surface,
    '--bcg-raised': palette.raised,
    '--bcg-ink': palette.ink,
    '--bcg-quiet': palette.quiet,
    '--bcg-faint': palette.faint,
    '--bcg-line': palette.line,
    '--bcg-danger': palette.danger,
  } as React.CSSProperties;

  return (
    <main className="bcg" style={paletteStyle} data-density={compact ? 'compact' : 'comfortable'}>
      <header className="bcg-masthead">
        <div>
          <GalleryLabel>Balance / interfaz viva</GalleryLabel>
          <h1>Atlas de componentes</h1>
          <p>Superficies y estados representativos para probar el próximo lenguaje visual de Balance.</p>
        </div>
        <div className="bcg-lab-controls" aria-label="Controles del laboratorio">
          <div>
            <GalleryLabel>Paleta</GalleryLabel>
            <div className="bcg-segments">
              {(Object.keys(PALETTES) as PaletteKey[]).map((key) => (
                <button key={key} data-active={paletteKey === key} onClick={() => setPaletteKey(key)}>
                  {PALETTES[key].label}
                </button>
              ))}
            </div>
          </div>
          <label className="bcg-density-control">
            <span><GalleryLabel>Densidad</GalleryLabel>{compact ? 'Compacta' : 'Cómoda'}</span>
            <Switch.Root className="bcg-switch" checked={!compact} onCheckedChange={(checked) => setCompact(!checked)}>
              <Switch.Thumb className="bcg-switch-thumb" />
            </Switch.Root>
          </label>
        </div>
      </header>

      <div className="bcg-layout">
        <section className="bcg-composite" aria-labelledby="composite-title">
          <div className="bcg-section-head">
            <div><GalleryLabel index="A">Superficie compuesta</GalleryLabel><h2 id="composite-title">Un día en Balance</h2></div>
            <span className="bcg-status"><i /> datos de prueba</span>
          </div>

          <div className="bcg-app-surface">
            <nav className="bcg-top-nav" aria-label="Navegación de fecha">
              <button className="bcg-icon-button" aria-label="Día anterior"><ChevronLeft size={19} /></button>
              <button className="bcg-date-title"><strong>Hoy</strong><span>6 de agosto</span></button>
              <button className="bcg-icon-button" aria-label="Día siguiente"><ChevronRight size={19} /></button>
            </nav>

            <div className="bcg-week-strip">
              {DAYS.map((item, index) => (
                <button key={`${item.day}-${item.date}`} data-active={selectedDay === index} onClick={() => setSelectedDay(index)}>
                  <span>{item.day}</span><strong>{item.date}</strong>
                </button>
              ))}
            </div>

            <div className="bcg-balance-row">
              <div><span>Restantes</span><strong>1.110</strong><small>de 2.000 kcal</small></div>
              <div className="bcg-ring"><span>44%</span></div>
              <dl>
                <div><dt>Proteína</dt><dd>49 / 120 g</dd></div>
                <div><dt>Carbos</dt><dd>107 / 240 g</dd></div>
                <div><dt>Grasa</dt><dd>29 / 65 g</dd></div>
              </dl>
            </div>

            <div className="bcg-ledger-head"><span>Hora / alimento</span><span>Porción</span><span>Kcal</span></div>
            <div className="bcg-hour-ledger">
              {MEALS.map((meal, index) => (
                <div className="bcg-meal-row" key={`${meal.name}-${index}`}>
                  <div className="bcg-time-node" data-filled><span>{meal.time}</span><i><Plus size={11} /></i></div>
                  <div className="bcg-meal-name"><strong>{meal.name}</strong><small>{meal.protein} g proteína</small></div>
                  <span>{meal.portion}</span><b>{meal.kcal}</b>
                </div>
              ))}
              <div className="bcg-meal-row bcg-meal-row--empty">
                <div className="bcg-time-node"><span>20</span><i><Plus size={11} /></i></div>
                <div className="bcg-empty-copy">Toca la hora para registrar</div>
              </div>
            </div>

            <button className="bcg-fab"><Plus size={19} /> Registrar comida</button>

            <nav className="bcg-bottom-nav" aria-label="Navegación principal">
              <button data-active={activeTab === 'summary'} onClick={() => setActiveTab('summary')}><BarChart3 size={18} /><span>Resumen</span></button>
              <button data-active={activeTab === 'log'} onClick={() => setActiveTab('log')}><ListChecks size={18} /><span>Registro</span></button>
              <button><UserRound size={18} /><span>Perfil</span></button>
            </nav>
          </div>
        </section>

        <aside className="bcg-catalog" aria-label="Catálogo de componentes">
          <section className="bcg-specimen">
            <div className="bcg-section-head"><div><GalleryLabel index="B">Acciones</GalleryLabel><h2>Botones</h2></div><span className="bcg-count">04 variantes</span></div>
            <div className="bcg-button-grid">
              <ProductButton><Plus size={15} /> Registrar comida</ProductButton>
              <ProductButton variant="secondary"><Settings2 size={15} /> Ajustar meta</ProductButton>
              <ProductButton variant="ghost">Cancelar</ProductButton>
              <ProductButton disabled><Clock3 size={15} /> Guardando…</ProductButton>
            </div>
          </section>

          <section className="bcg-specimen">
            <div className="bcg-section-head"><div><GalleryLabel index="C">Entrada y selección</GalleryLabel><h2>Controles</h2></div></div>
            <div className="bcg-control-grid">
              <label className="bcg-field"><span>Buscar alimento</span><span className="bcg-input-wrap"><Search size={16} /><input placeholder="Ej. yogur griego" /></span><small>Busca en tu biblioteca y sugerencias.</small></label>
              <label className="bcg-field"><span>Porción</span><span className="bcg-input-wrap"><input defaultValue="170" inputMode="decimal" /><b>g</b></span><small>126 kcal estimadas</small></label>
              <label className="bcg-check"><input type="checkbox" defaultChecked /><span><Check size={12} /></span>Seleccionar registro</label>
              <button className="bcg-select">Almuerzo <ChevronDown size={15} /></button>
            </div>
          </section>

          <section className="bcg-specimen">
            <div className="bcg-section-head"><div><GalleryLabel index="D">Estado</GalleryLabel><h2>Feedback</h2></div></div>
            <div className="bcg-progress-card"><div><span>Proteína diaria</span><strong>49 <small>/ 120 g</small></strong></div><div className="bcg-progress"><i style={{ width: '41%' }} /></div></div>
            <div className="bcg-notice"><span className="bcg-notice-icon"><Check size={15} /></span><div><strong>Comida registrada</strong><small>Lentejas con zapallo · 13:30</small></div><button aria-label="Cerrar aviso"><X size={15} /></button></div>
            <div className="bcg-over"><AlertTriangle size={16} /><span><strong>18 g sobre la meta</strong><small>La señal roja aparece solo cuando el presupuesto se supera.</small></span></div>
          </section>

          <section className="bcg-specimen">
            <div className="bcg-section-head"><div><GalleryLabel index="E">Capas</GalleryLabel><h2>Modal y drawer</h2></div><span className="bcg-count">interactivos</span></div>
            <p className="bcg-specimen-copy">Prueba foco, cierre con Escape, scrim y jerarquía de acciones en contexto.</p>
            <OverlayActions />
          </section>
        </aside>
      </div>
    </main>
  );
};
