/* ============================================================
   Datos compartidos por los mockups de nutricion.

   Deterministas a proposito: no se usa Math.random para que el
   mockup se vea identico en cada render y entre sesiones.

   Los tres dias mas recientes tienen detalle de comidas, y los
   totales de la serie salen de ese detalle: asi el resumen y el
   registro no se contradicen.
   ============================================================ */

export const TARGET = { kcal: 2200, protein: 120, carbs: 245, fat: 73 };

export type FoodItem = {
  name: string;
  detail: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type Meal = {
  slot: string;
  time: string | null;
  items: FoodItem[];
};

/** Detalle de los 3 dias mas recientes. La clave es el desfase en dias desde hoy. */
export const RECENT_MEALS: Record<number, Meal[]> = {
  0: [
    {
      slot: 'Desayuno',
      time: '08:05',
      items: [
        { name: 'Tostadas integrales', detail: '2 rebanadas', kcal: 180, protein: 7, carbs: 30, fat: 3 },
        { name: 'Palta', detail: '1/2 unidad', kcal: 160, protein: 2, carbs: 9, fat: 15 },
        { name: 'Cafe con leche', detail: '250 ml', kcal: 80, protein: 6, carbs: 9, fat: 2 }
      ]
    },
    {
      slot: 'Almuerzo',
      time: '13:40',
      items: [
        { name: 'Merluza al vapor', detail: '160 g', kcal: 220, protein: 40, carbs: 0, fat: 6 },
        { name: 'Quinoa', detail: '1 taza', kcal: 280, protein: 10, carbs: 48, fat: 5 },
        { name: 'Brocoli salteado', detail: '1 taza', kcal: 180, protein: 5, carbs: 14, fat: 12 }
      ]
    },
    {
      slot: 'Once',
      time: '18:30',
      items: [
        { name: 'Queso fresco', detail: '60 g', kcal: 160, protein: 12, carbs: 2, fat: 11 },
        { name: 'Galletas de arroz', detail: '4 unidades', kcal: 180, protein: 3, carbs: 38, fat: 1 }
      ]
    },
    { slot: 'Cena', time: null, items: [] }
  ],
  1: [
    {
      slot: 'Desayuno',
      time: '07:45',
      items: [
        { name: 'Avena con leche', detail: '1 taza', kcal: 240, protein: 12, carbs: 38, fat: 5 },
        { name: 'Platano', detail: '1 unidad', kcal: 145, protein: 2, carbs: 34, fat: 1 }
      ]
    },
    {
      slot: 'Almuerzo',
      time: '13:30',
      items: [
        { name: 'Pollo a la plancha', detail: '180 g', kcal: 340, protein: 54, carbs: 0, fat: 13 },
        { name: 'Arroz integral', detail: '1 taza', kcal: 220, protein: 5, carbs: 46, fat: 2 },
        { name: 'Zapallo italiano', detail: '1 taza', kcal: 200, protein: 3, carbs: 12, fat: 15 }
      ]
    },
    {
      slot: 'Once',
      time: '18:20',
      items: [{ name: 'Yogurt con granola', detail: '200 g', kcal: 320, protein: 14, carbs: 44, fat: 9 }]
    },
    {
      slot: 'Cena',
      time: '21:00',
      items: [
        { name: 'Salmon al horno', detail: '150 g', kcal: 380, protein: 38, carbs: 0, fat: 24 },
        { name: 'Pure de papas', detail: '1 taza', kcal: 240, protein: 4, carbs: 36, fat: 8 }
      ]
    }
  ],
  2: [
    {
      slot: 'Desayuno',
      time: '09:20',
      items: [
        { name: 'Huevos revueltos', detail: '3 unidades', kcal: 310, protein: 21, carbs: 2, fat: 23 },
        { name: 'Pan amasado', detail: '1 unidad', kcal: 210, protein: 6, carbs: 40, fat: 3 }
      ]
    },
    {
      slot: 'Almuerzo',
      time: '14:10',
      items: [
        { name: 'Pastel de choclo', detail: '1 porcion', kcal: 720, protein: 28, carbs: 82, fat: 30 },
        { name: 'Ensalada chilena', detail: '1 taza', kcal: 90, protein: 2, carbs: 10, fat: 5 },
        { name: 'Jugo natural', detail: '350 ml', kcal: 170, protein: 1, carbs: 40, fat: 0 }
      ]
    },
    {
      slot: 'Once',
      time: '19:00',
      items: [{ name: 'Marraqueta con palta', detail: '1/2 unidad', kcal: 410, protein: 9, carbs: 48, fat: 19 }]
    },
    {
      slot: 'Cena',
      time: '22:15',
      items: [{ name: 'Cazuela de vacuno', detail: '1 plato', kcal: 500, protein: 34, carbs: 42, fat: 20 }]
    }
  ]
};

export const mealTotals = (meals: Meal[]) =>
  meals
    .flatMap(m => m.items)
    .reduce(
      (acc, i) => ({
        kcal: acc.kcal + i.kcal,
        protein: acc.protein + i.protein,
        carbs: acc.carbs + i.carbs,
        fat: acc.fat + i.fat
      }),
      { kcal: 0, protein: 0, carbs: 0, fat: 0 }
    );

/** Ruido reproducible en 0..1 a partir del indice del dia. */
const noise = (i: number): number => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export type DayPoint = {
  /** 0 = el mas antiguo, DAYS-1 = hoy */
  index: number;
  date: Date;
  weight: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

const DAYS = 90;
const TODAY = new Date(2026, 7, 5); // 5 de agosto de 2026

const round1 = (n: number) => Math.round(n * 10) / 10;

export const SERIES: DayPoint[] = Array.from({ length: DAYS }, (_, i) => {
  const date = new Date(TODAY);
  const offset = DAYS - 1 - i;
  date.setDate(date.getDate() - offset);

  // Baja sostenida con variacion diaria: el motivo de tener tendencia
  const weight = round1(84.2 - i * 0.04 + (noise(i) - 0.5) * 1.6);

  const detailed = RECENT_MEALS[offset];
  if (detailed) {
    return { index: i, date, weight, ...mealTotals(detailed) };
  }

  return {
    index: i,
    date,
    weight,
    kcal: Math.round(2200 + (noise(i + 100) - 0.44) * 760),
    protein: Math.round(112 + (noise(i + 200) - 0.5) * 34),
    carbs: Math.round(228 + (noise(i + 300) - 0.5) * 90),
    fat: Math.round(70 + (noise(i + 400) - 0.5) * 28)
  };
});

/**
 * Media movil de los ultimos `window` dias. El peso diario oscila
 * demasiado para leer progreso: la tendencia es la cifra que importa.
 */
export const trendAt = (points: DayPoint[], i: number, window = 7): number => {
  const from = Math.max(0, i - window + 1);
  const slice = points.slice(from, i + 1);
  return round1(slice.reduce((s, p) => s + p.weight, 0) / slice.length);
};

export const RANGES = [
  { key: '7', label: '1 semana', days: 7 },
  { key: '30', label: '1 mes', days: 30 },
  { key: '90', label: '3 meses', days: 90 }
] as const;

export type RangeKey = (typeof RANGES)[number]['key'];

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

export const shortDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;

export const weekday = (d: Date) =>
  ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'][d.getDay()];
