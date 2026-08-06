import { MockupItem } from '../types';
import { BalanceLogRedesign } from './BalanceLogRedesign';
import { NutritionApp } from './NutritionApp';
import { PrimitivesWorkbench } from './PrimitivesWorkbench';
import { BreakTimer } from './BreakTimer';

export const mockupRegistry: MockupItem[] = [
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

