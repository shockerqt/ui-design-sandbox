import { MockupItem } from '../types';
import { ApartmentFloorPlan, DiningRoomBase } from './ApartmentFloorPlan';
import { BedroomFloorPlan } from './BedroomFloorPlan';
import { BalanceLogRedesign } from './BalanceLogRedesign';
import { NutritionApp } from './NutritionApp';
import { PrimitivesWorkbench } from './PrimitivesWorkbench';
import { BreakTimer } from './BreakTimer';
import { SaviaNutrition } from './SaviaNutrition';
import { BalanceComponentGallery } from './BalanceComponentGallery';
import { BalanceVimLogWithHelp } from './BalanceVimLogWithHelp';
import { BalanceVimLogStudio } from './BalanceVimLogStudio';
import { BaseUIColorSystem } from './BaseUIColorSystem';
import { BalanceStyleStudies } from './BalanceStyleStudies';
import { BalanceMaterialExpressive } from './BalanceMaterialExpressive';
import { BalanceAndroidMaterial } from './BalanceAndroidMaterial';
import { BalanceLogWireframes } from './BalanceLogWireframes';
import { BalanceCleanRedesign } from './BalanceCleanRedesign';
import { BalanceDiaryGestures } from './BalanceDiaryGestures';
import { ZachControlPanel } from './ZachControlPanel';
import { ZachLiveMap } from './ZachLiveMap';

export const mockupRegistry: MockupItem[] = [
  {
    id: 'balance-diary-gestures',
    title: 'Balance · Diario compacto, radial ascendente y macros',
    category: 'Dashboards',
    description: 'Diario sin fila de peso y guard de scroll corto (BAL-067), botón + dual con tríada al toque y swipe ← peso / → ahora / ↑ radial ascendente (BAL-066), más comparador en vivo de vistas limpias para macros.',
    tags: ['Balance', 'mobile', 'scroll', 'sticky header', 'gesture', 'radial', 'macros'],
    version: 'v1.2.0',
    updatedAt: '2026-11-12',
    component: BalanceDiaryGestures
  },
  {
    id: 'zach-live-map',
    title: 'Zach · Mapa de telemetría en vivo',
    category: 'Dashboards',
    description: 'Mapa radial vivo inspirado en lot-map y command-mesh: radios desgastados por uso, estela de 5 estaciones, pulsos entrantes de caché, múltiples proveedores, drill-down por worker y línea de tiempo metadata-only.',
    tags: ['Zach', 'telemetry', 'lot-map', 'command-mesh', 'SVG', 'Base UI', 'dark'],
    version: 'v1.0.0',
    updatedAt: '2026-11-12',
    component: ZachLiveMap
  },
  {
    id: 'balance-clean-redesign',
    title: 'Balance · Rediseño limpio (claro y oscuro)',
    category: 'Dashboards',
    description: 'Papel neutro, tinta y tres colores de macros. Diario, agregar con selección múltiple, resumen y diario web, con tema oscuro por tokens.',
    tags: ['Balance', 'redesign', 'dark mode', 'mobile', 'web', 'tokens'],
    version: 'v1.0.0',
    updatedAt: '2026-11-12',
    component: BalanceCleanRedesign
  },
  {
    id: 'zach-control-panel',
    title: 'Zach · Panel de control',
    category: 'Dashboards',
    description: 'Decisión pendiente, etapas por tarea, cola de merge y eventos; vista de teléfono y los siete estados de la mascota.',
    tags: ['Zach', 'daemon', 'dashboard', 'mascot', 'dark'],
    version: 'v1.0.0',
    updatedAt: '2026-11-12',
    component: ZachControlPanel
  },
  {
    id: 'dining-room-base',
    title: 'Comedor · Bici, sofá y escritorio',
    category: 'Espacios',
    description: 'Distribución elegida y base vacía: refri a la izquierda, juegos sobre arenero, sofá al ventanal, mesa y escritorio a la derecha y bici horizontal al centro.',
    tags: ['plano', 'comedor', 'distribución', 'medidas', 'SVG'],
    version: 'v1.3.0',
    updatedAt: '2026-10-23',
    component: DiningRoomBase
  },
  {
    id: 'bedroom-floor-plan',
    title: 'Pieza · SID y cama',
    category: 'Espacios',
    description: 'SID al ventanal o pared izquierda con press en ganchos delanteros, caucho entero de 200 × 200 y dos camas; pilar de 60 × 60 y puerta de 70 cm.',
    tags: ['plano', 'pieza', 'SID', 'cama', 'caucho'],
    version: 'v1.4.1',
    updatedAt: '2026-10-22',
    component: BedroomFloorPlan
  },
  {
    id: 'apartment-floor-plan',
    title: 'Departamento · Plano de distribución',
    category: 'Espacios',
    description: 'Planos SID/G3 con barra de 2 m, sofá GLOSTAD, caucho compartido y estudio de distancia y apertura del refrigerador en C.',
    tags: ['plano', 'departamento', 'distribución', 'medidas', 'SVG'],
    version: 'v1.20.0',
    updatedAt: '2026-10-20',
    component: ApartmentFloorPlan
  },
  {
    id: 'balance-style-studies',
    title: 'Balance · Comparador de estilos',
    category: 'Dashboards',
    description: 'Orgánico en las pantallas vigentes: diario, peso, resumen, biblioteca, fichas, cuenta, acceso e importación. Cuatro paletas claro/oscuro y estados de revisión.',
    tags: ['Balance', 'styles', 'gradients', 'mobile', 'comparison'],
    version: 'v1.3.0',
    updatedAt: '2026-10-27',
    component: BalanceStyleStudies
  },
  {
    id: 'balance-material-expressive',
    title: 'Balance · Material Expressive',
    category: 'Dashboards',
    description: 'Cabecera compacta con fecha, totales y semana; más espacio para alimentos, + sin texto y transiciones con movimiento reducido.',
    tags: ['Balance', 'Material 3', 'Expressive', 'motion', 'Compose', 'mobile'],
    version: 'v1.2.0',
    updatedAt: '2026-10-20',
    component: BalanceMaterialExpressive
  },
  {
    id: 'balance-android-material',
    title: 'Balance · Android Material',
    category: 'Dashboards',
    description: 'Exploración Material 3 Expressive sobre los flujos de Balance: superficies tonales, formas suaves y modos oscuro y claro.',
    tags: ['Balance', 'Android', 'Material 3', 'Compose', 'mobile'],
    version: 'v1.0.0',
    updatedAt: '2026-10-20',
    component: BalanceAndroidMaterial
  },
  {
    id: 'balance-log-wireframes',
    title: 'Balance · Wireframes multivista',
    category: 'Dashboards',
    description: 'Registro y análisis separados, lectura de alimentos en dos líneas, etiquetas por secciones y guardado de mediciones parciales siempre visible.',
    tags: ['Balance', 'wireframes', 'mobile', 'measurements', 'charts', 'Base UI'],
    version: 'v1.8.0',
    updatedAt: '2026-10-19',
    component: BalanceLogWireframes
  },
  {
    id: 'base-ui-color-system',
    title: 'Base UI · Sistema de color',
    category: 'Base UI Primitives',
    description:
      'Specimen de sistema de color con superficies azuladas profundas, una sola familia de accent, tonos pastel intensos y variantes solid, soft, outline y ghost sobre primitivas reales de Base UI.',
    tags: ['Base UI', 'design system', 'tokens', 'OKLCH', 'button', 'chip', 'input'],
    version: 'v1.0.0',
    updatedAt: '2026-09-07',
    component: BaseUIColorSystem
  },
  {
    id: 'balance-vim-log-redesign',
    title: 'Balance · Terminal food log (Rediseño Impeccable)',
    category: 'Dashboards',
    description:
      'Nueva iteración y rediseño visual de Balance Vim Food Log con dirección de arte mejorada, tipografía de alta fidelidad, microinteracciones y acabado terminal.',
    tags: ['Balance', 'terminal', 'Vim', 'redesign', 'impeccable', 'food log'],
    version: 'v1.0.0',
    updatedAt: '2026-08-22',
    component: BalanceVimLogStudio
  },
  {
    id: 'balance-vim-log',
    title: 'Balance · Terminal food log',
    category: 'Dashboards',
    description:
      'Registro nutricional terminal-first con gramática Vim, selección por bloques, register persistente, edición inline de cantidad/hora, búsqueda, historial y sync status.',
    tags: ['Balance', 'terminal', 'Vim', 'keyboard-first', 'visual mode', 'register', 'food log'],
    version: 'v3.0.0',
    updatedAt: '2026-08-20',
    component: BalanceVimLogWithHelp
  },
  {
    id: 'balance-componentes',
    title: 'Balance · Pantallas',
    category: 'Dashboards',
    description:
      'Las pantallas de Balance a ancho de teléfono para iterarlas de a una: el registro del día sobre el riel horario y el resumen de la semana. Full width en móvil.',
    tags: ['Balance', 'pantallas', 'teléfono', 'container queries', 'Base UI'],
    version: 'v2.0.0',
    updatedAt: '2026-08-17',
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
