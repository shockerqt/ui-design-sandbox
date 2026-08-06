import React from 'react';

/* Piezas compartidas por los paneles. Todo sale de las variables
   --sk-*, asi que cambiar de piel no toca la estructura. */

/** Colores del tema, para usar en SVG y estilos en linea. */
export const SK = {
  bg: 'var(--sk-bg)',
  panel: 'var(--sk-panel)',
  ink: 'var(--sk-ink)',
  quiet: 'var(--sk-quiet)',
  faint: 'var(--sk-faint)',
  tint: 'var(--sk-tint)',
  line: 'var(--sk-line)',
  accent: 'var(--sk-accent)',
  signal: 'var(--sk-signal)'
} as const;

/**
 * Tipografia de display del tema. El peso viaja por el eje wght
 * cuando la fuente es variable, y por font-weight cuando no lo es.
 */
export const display = (size: string, wght = 800): React.CSSProperties => ({
  fontFamily: 'var(--sk-font-display)',
  fontVariationSettings: `'wdth' var(--sk-wdth), 'wght' ${wght}`,
  fontWeight: wght,
  fontSize: size,
  letterSpacing: 'var(--sk-tracking)',
  textTransform: 'var(--sk-case)' as React.CSSProperties['textTransform'],
  lineHeight: 1.05
});

/** Igual que display pero sin forzar la caja alta: para cifras y fechas. */
export const plain = (size: string, wght = 400): React.CSSProperties => ({
  ...display(size, wght),
  textTransform: 'none'
});

export type RuleLevel = 'heavy' | 'mid' | 'hair';

const RULE_HEIGHT: Record<RuleLevel, string> = {
  heavy: 'var(--sk-rule-heavy)',
  mid: 'var(--sk-rule-mid)',
  hair: '1px'
};

/** Filete estructural. Su peso lo define el tema, no el componente. */
export const Rule: React.FC<{ level?: RuleLevel; tint?: boolean }> = ({
  level = 'hair',
  tint
}) => (
  <div
    style={{
      height: RULE_HEIGHT[level],
      background: tint ? SK.tint : SK.line,
      flex: 'none'
    }}
  />
);

/**
 * El avance no es una barra sobrepuesta al diseño: es el filete de la
 * tabla, partido en la proporcion consumida. Al pasarse del objetivo
 * cambia a la señal, que siempre va acompañada de texto.
 */
export const RuleMeter: React.FC<{ ratio: number; tall?: boolean }> = ({ ratio, tall }) => {
  const pct = Math.min(ratio, 1) * 100;
  const over = ratio > 1;
  return (
    <div
      style={{
        display: 'flex',
        height: tall ? 'calc(var(--sk-meter) * 1.4)' : 'var(--sk-meter)',
        background: SK.tint,
        borderRadius: 'var(--sk-radius)',
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          width: `${pct}%`,
          background: over ? SK.signal : SK.ink,
          transition: 'width 0.35s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      />
    </div>
  );
};

/** Cabecera de seccion del panel. */
export const SectionHead: React.FC<{ title: string; children?: React.ReactNode }> = ({
  title,
  children
}) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
      padding: '12px 0 8px',
      minHeight: 42
    }}
  >
    <span style={display('1rem')}>{title}</span>
    {children}
  </div>
);
