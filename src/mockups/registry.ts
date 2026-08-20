import { MockupItem } from '../types';
import { BalanceLogRedesign } from './BalanceLogRedesign';
import { NutritionApp } from './NutritionApp';
import { PrimitivesWorkbench } from './PrimitivesWorkbench';
import { BreakTimer } from './BreakTimer';
import { SaviaNutrition } from './SaviaNutrition';
import { BalanceComponentGallery } from './BalanceComponentGallery';
import { BalanceVimLogWithHelp } from './BalanceVimLogWithHelp';

export const mockupRegistry: MockupItem[] = [
  {
    id: 'balance-vim-log',
    title: 'Balance · Terminal food log',
    category: 'Dashboards',
    description:
      'Registro nutricional terminal-first con buffers por día, navegación Vim, agrupación por hora, macros por alimento y subtotal de cada bloque.',
    tags: ['Balance', 'terminal', 'Vim', 'keyboard-first', 'visual mode', 'food log'],
    version: 'v2.2.0',
    updatedAt: '2026-08-20',
    component: BalanceVimLogWithHelp
  },
  {
    id: 'balance-componentes',
    title: 'Balance · Atlas de componentes',
    category: 'Base UI Primitives',
    description:
      'Galería interactiva de las superficies, navegación, timeline horario, controles, estados, modal y drawer que definen el lenguaje visual de Balance.',
    tags: ['Balance', 'design system', 'componentes', 'modal', 'drawer', 'Base UI'],
    version: 'v1.2.0',
    updatedAt: '2026-08-08',
    component: BalanceComponentGallery
  },
  {
    id: 'savia-nutricion',
    title: 'Savia · Nutrición consciente',
    category: 'Dashboards',
    description:
      'Un pulso nutricional diario con energía, macros, hidratación, biodiversidad vegetal y lectura semanal en una interfaz editorial-botánica.',
    tags: ['nutrición', 'bienestar', 'dashboard', 'editorial', 'Base UI'],
    version: 'v1.0.0',
    updatedAt: '2026-08-06',
    component: SaviaNutrition
  },
  {
    id: 'cronometro',
    title: 'Cronómetro de Descansos',
    category: 'Dashboards',
    description:
      'Cronómetro y temporizador interactivo para medir descansos, accionable con la tecla Espacio, etiquetas de actividad, sintetizador de audio y registro de pausas activas.',
    tags: ['cronometro', 'descansos', 'espacio', 'timer', 'audio', 'base-ui'],
    version: 'v1.0.0',
    updatedAt: '2026-08-06',
    component: BreakTimer
  },
  {
    id: 'balance-registro',
    title: 'Balance · Rediseño del registro',
    category: 'Dashboards',
    description:
      'Registro de comidas como libro contable: columnas por macro, subtotales y la convencion del negro y el rojo. Dos disposiciones y dos temas.',
    tags: ['React Native', 'libro contable', 'macros', 'IBM Plex'],
    version: 'v1.0.0',
    updatedAt: '2026-08-06',
    component: BalanceLogRedesign
  },
  {
    id: 'nutricion',
    title: 'App de nutricion',
    category: 'Dashboards',
    description:
      'Dos secciones bajo una cabecera: resumen del progreso en el tiempo y registro del dia con edicion.',
    tags: ['app de comida', 'series de tiempo', 'media movil', 'papel'],
    version: 'v3.0.0',
    updatedAt: '2026-08-05',
    component: NutritionApp
  },
  {
    id: 'primitives-workbench',
    title: 'Primitivas Base UI',
    category: 'Base UI Primitives',
    description:
      'Banco de pruebas de las primitivas con un inspector que lee sus atributos reales del DOM en vivo.',
    tags: ['Base UI', 'data-attributes', 'MutationObserver', 'a11y'],
    version: 'v1.0.0',
    updatedAt: '2026-08-05',
    component: PrimitivesWorkbench
  }
];
