/* ============================================================
   Un dia real de registro, con picoteos entre comidas.

   El caso dificil a proposito: 7 momentos de consumo, dos de ellos
   fuera de cualquier comida nombrada. Es lo que decide cual de las
   dos disposiciones funciona.
   ============================================================ */

export const TARGETS = { kcal: 2200, protein: 150, carbs: 220, fat: 65 };

export interface Entry {
  id: string;
  /** "HH:MM" */
  time: string;
  name: string;
  portion: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export const ENTRIES: Entry[] = [
  { id: 'e1', time: '08:05', name: 'Tostadas integrales', portion: '2 reb', kcal: 180, protein: 7, carbs: 30, fat: 3 },
  { id: 'e2', time: '08:05', name: 'Palta', portion: '1/2 un', kcal: 175, protein: 2, carbs: 9, fat: 17 },
  { id: 'e3', time: '08:20', name: 'Café con leche', portion: '250 ml', kcal: 80, protein: 6, carbs: 9, fat: 2 },

  { id: 'e4', time: '11:10', name: 'Manzana', portion: '1 un', kcal: 80, protein: 0, carbs: 21, fat: 0 },

  { id: 'e5', time: '13:40', name: 'Merluza al vapor', portion: '160 g', kcal: 220, protein: 40, carbs: 0, fat: 6 },
  { id: 'e6', time: '13:40', name: 'Quinoa', portion: '1 taza', kcal: 280, protein: 10, carbs: 48, fat: 5 },
  { id: 'e7', time: '13:45', name: 'Ensalada chilena', portion: '1 taza', kcal: 90, protein: 2, carbs: 10, fat: 5 },

  { id: 'e8', time: '16:20', name: 'Almendras', portion: '25 g', kcal: 145, protein: 5, carbs: 5, fat: 13 },
  { id: 'e9', time: '17:05', name: 'Yogurt natural', portion: '150 g', kcal: 95, protein: 9, carbs: 11, fat: 2 },

  { id: 'e10', time: '19:30', name: 'Marraqueta con quesillo', portion: '1/2 un', kcal: 260, protein: 14, carbs: 38, fat: 6 },
  { id: 'e11', time: '19:30', name: 'Té', portion: '250 ml', kcal: 5, protein: 0, carbs: 1, fat: 0 },

  { id: 'e12', time: '21:50', name: 'Pollo a la plancha', portion: '150 g', kcal: 280, protein: 45, carbs: 0, fat: 11 },
];

export type Totals = { kcal: number; protein: number; carbs: number; fat: number };

export const sum = (entries: Entry[]): Totals =>
  entries.reduce(
    (acc, e) => ({
      kcal: acc.kcal + e.kcal,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

/** Agrupa por hora exacta, respetando el registro tal cual se hizo. */
export const byTime = (entries: Entry[]) => {
  const map = new Map<string, Entry[]>();
  entries.forEach((e) => map.set(e.time, [...(map.get(e.time) ?? []), e]));
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
};

/* --- Ventanas de comida, para la disposicion por nombre --- */

const WINDOWS: Array<{ name: string; from: string; to: string }> = [
  { name: 'Desayuno', from: '05:00', to: '10:30' },
  { name: 'Almuerzo', from: '12:00', to: '15:30' },
  { name: 'Once', from: '18:00', to: '20:30' },
  { name: 'Cena', from: '20:30', to: '23:59' },
];

/**
 * Todo lo que cae fuera de una ventana se vuelve "Colacion". Es el
 * parche que necesita esta disposicion para no perder los picoteos.
 */
export const byMeal = (entries: Entry[]) => {
  const blocks: Array<{ name: string; entries: Entry[]; isSnack: boolean }> = [];

  const sorted = [...entries].sort((a, b) => a.time.localeCompare(b.time));

  for (const entry of sorted) {
    const window = WINDOWS.find((w) => entry.time >= w.from && entry.time <= w.to);
    const name = window?.name ?? 'Colación';
    const last = blocks[blocks.length - 1];

    // Las colaciones no se fusionan si estan separadas por otra comida
    if (last && last.name === name) last.entries.push(entry);
    else blocks.push({ name, entries: [entry], isSnack: !window });
  }

  return blocks;
};

export const timeRange = (entries: Entry[]) =>
  entries.length ? `${entries[0].time}–${entries[entries.length - 1].time}` : '';
