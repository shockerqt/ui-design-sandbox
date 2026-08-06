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
    component: NutritionSummary,
    codeSnippet: `/**
 * El avance no es una barra sobrepuesta al diseño: es el filete de
 * la tabla nutricional, partido en la proporcion consumida. Cuando
 * se pasa del objetivo, el filete cambia a la señal roja.
 */
const RuleMeter: React.FC<{ ratio: number; weight?: number }> = ({ ratio, weight = 6 }) => {
  const pct = Math.min(ratio, 1) * 100;
  const over = ratio > 1;
  return (
    <div style={{ display: 'flex', height: weight, background: 'var(--paper-tint)' }}>
      <div
        style={{
          width: \`\${pct}%\`,
          background: over ? 'var(--paper-signal)' : 'var(--paper-ink)',
          transition: 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      />
    </div>
  );
};

// Archivo en su eje condensado: misma familia que el shell,
// extremo opuesto del eje wdth. Coherencia sin repetir la voz.
const condensed = (weight: number, size: string): React.CSSProperties => ({
  fontFamily: 'var(--font-display)',
  fontVariationSettings: \`'wdth' 80, 'wght' \${weight}\`,
  fontSize: size,
  letterSpacing: '0.01em',
  lineHeight: 1.05
});`
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
    component: PrimitivesWorkbench,
    previewGradient: 'linear-gradient(90deg, #8395d5, #4b5d9e)',
    codeSnippet: `/**
 * Observa los atributos data-* y aria-* reales de un elemento del DOM.
 * No refleja el estado de React: lee lo que Base UI escribe en el nodo,
 * que es exactamente contra lo que se escriben los selectores CSS.
 */
function useAttrSpy<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [attrs, setAttrs] = useState<Record<string, string>>({});

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    let previous = '';
    const read = () => {
      const next: Record<string, string> = {};
      for (const attr of Array.from(el.attributes)) {
        if (attr.name.startsWith('data-') || attr.name.startsWith('aria-')) {
          next[attr.name] = attr.value === '' ? 'true' : attr.value;
        }
      }
      const serialized = JSON.stringify(next);
      if (serialized !== previous) {
        previous = serialized;
        setAttrs(next);
      }
    };

    read();
    const observer = new MutationObserver(read);
    observer.observe(el, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return [ref, attrs] as const;
}

// El switch resuelve su apariencia en CSS, no en React:
//   .base-Switch-root[data-checked] { background-color: #fff; }
<Switch.Root ref={switchRef} className="base-Switch-root"
             checked={checked} onCheckedChange={setChecked}>
  <Switch.Thumb className="base-Switch-thumb" />
</Switch.Root>`
  }
];
