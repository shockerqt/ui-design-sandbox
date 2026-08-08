import React, { useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, RotateCw } from 'lucide-react';
import { MockupItem, ViewportMode } from '../types';

const VIEWPORTS: Array<{ mode: ViewportMode; label: string }> = [
  { mode: '100%', label: 'Full' },
  { mode: '1440px', label: '1440' },
  { mode: '768px', label: '768' },
  { mode: '375px', label: '375' }
];

export const MockupViewer: React.FC<{ mockup: MockupItem }> = ({ mockup }) => {
  const [viewport, setViewport] = useState<ViewportMode>('100%');
  const [nonce, setNonce] = useState(0);

  const Component = mockup.component;
  const isFull = viewport === '100%';

  return (
    <div className="mockup-viewer">
      {/* Todo el cromo cabe en el riel, para que el mockup se quede con el resto */}
      <div className="rail">
        <Link href="/" className="rail-btn" aria-label="Volver al registro">
          <ArrowLeft size={15} />
        </Link>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', minWidth: 0 }}>
          <span
            style={{
              fontFamily: 'var(--font-display)',
              fontVariationSettings: "'wdth' 112, 'wght' 650",
              fontSize: '0.9rem',
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
          >
            {mockup.title}
          </span>
          <span className="mono" style={{ color: 'var(--fg-faint)' }}>
            {mockup.version}
          </span>
        </div>

        <div style={{ flex: 1 }} />

        <div className="rail-group">
          {VIEWPORTS.map(v => (
            <button
              key={v.mode}
              className="rail-btn"
              data-active={viewport === v.mode}
              onClick={() => setViewport(v.mode)}
              aria-pressed={viewport === v.mode}
            >
              {v.label}
            </button>
          ))}
        </div>

        <button
          className="rail-btn"
          onClick={() => setNonce(n => n + 1)}
          title="Reiniciar el mockup"
          aria-label="Reiniciar el mockup"
        >
          <RotateCw size={14} />
        </button>
      </div>

      <div className="mockup-viewer-scroll">
        <div
          className="mockup-viewer-canvas"
          style={{
            width: isFull ? '100%' : viewport,
            maxWidth: '100%',
            minHeight: isFull ? '100%' : undefined,
            margin: isFull ? 0 : '28px 0 8px',
            /* Sin caja ni sombra a ancho completo: el mockup ES la pagina */
            ...(isFull ? {} : { border: '1px solid #000' }),
            transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          <div key={nonce}>
            <Component />
          </div>
        </div>

        {/* Pie de lamina montada */}
        {!isFull && (
          <div className="mono" style={{ padding: '0 0 32px', color: 'var(--fg-faint)' }}>
            {viewport}
          </div>
        )}
      </div>
    </div>
  );
};
