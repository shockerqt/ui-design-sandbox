import { MockupItem } from '../types';
import { NutritionLog } from './NutritionLog';
import { NutritionTrends } from './NutritionTrends';
import { PrimitivesWorkbench } from './PrimitivesWorkbench';

export const mockupRegistry: MockupItem[] = [
  {
    id: 'nutricion-resumen',
    title: 'Nutricion · Resumen',
    category: 'Dashboards',
    description:
      'Peso con tendencia, calorias y macros en el tiempo, contra el objetivo. Rango de 1 semana a 3 meses.',
    tags: ['app de comida', 'series de tiempo', 'media movil', 'papel'],
    version: 'v2.0.0',
    updatedAt: '2026-08-05',
    component: NutritionTrends
  },
  {
    id: 'nutricion-registro',
    title: 'Nutricion · Registro',
    category: 'Dashboards',
    description:
      'Detalle de lo comido en el dia, con edicion y navegacion entre dias. El resumen va como contexto.',
    tags: ['app de comida', 'registro diario', 'edicion', 'papel'],
    version: 'v2.0.0',
    updatedAt: '2026-08-05',
    component: NutritionLog
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
