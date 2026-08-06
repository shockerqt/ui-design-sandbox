import React from 'react';

/** Escala tipografica del panel: Archivo en su eje condensado. */
export const condensed = (weight: number, size: string): React.CSSProperties => ({
  fontFamily: 'var(--font-display)',
  fontVariationSettings: `'wdth' 80, 'wght' ${weight}`,
  fontSize: size,
  letterSpacing: '0.01em',
  lineHeight: 1.05
});

/** Filete de la tabla nutricional. El peso codifica la jerarquia. */
export const Rule: React.FC<{ weight: number; tint?: boolean }> = ({ weight, tint }) => (
  <div
    style={{
      height: weight,
      background: tint ? 'var(--paper-tint)' : 'var(--paper-ink)',
      flex: 'none'
    }}
  />
);

/**
 * El avance no es una barra sobrepuesta al diseño: es el filete de la
 * tabla, partido en la proporcion consumida. Al pasarse del objetivo
 * cambia a la señal, que siempre va acompañada de texto.
 */
export const RuleMeter: React.FC<{ ratio: number; weight?: number }> = ({ ratio, weight = 6 }) => {
  const pct = Math.min(ratio, 1) * 100;
  const over = ratio > 1;
  return (
    <div style={{ display: 'flex', height: weight, background: 'var(--paper-tint)' }}>
      <div
        style={{
          width: `${pct}%`,
          background: over ? 'var(--paper-signal)' : 'var(--paper-ink)',
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
    <span style={{ ...condensed(800, '1rem'), textTransform: 'uppercase' }}>{title}</span>
    {children}
  </div>
);
