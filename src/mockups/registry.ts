import { MockupItem } from '../types';
import { NutritionApp } from './NutritionApp';
import { PrimitivesWorkbench } from './PrimitivesWorkbench';

export const mockupRegistry: MockupItem[] = [
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
