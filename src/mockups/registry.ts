import { MockupItem } from '../types';
import { NutritionSummary } from './NutritionSummary';
import { PrimitivesWorkbench } from './PrimitivesWorkbench';

export const mockupRegistry: MockupItem[] = [
  {
    id: 'nutricion-resumen',
    title: 'Nutricion · Resumen diario',
    category: 'Dashboards',
    description:
      'Tablero del dia de una app de registro nutricional, con el lenguaje visual de la tabla nutricional.',
    tags: ['app de comida', 'tabla nutricional', 'papel', 'Archivo condensed'],
    version: 'v1.0.0',
    updatedAt: '2026-08-05',
    component: NutritionSummary
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
