import React, { useState } from 'react';
import { Link } from 'wouter';
import { ArrowLeft, Check, Copy, RotateCw } from 'lucide-react';
import { MockupItem, MountTone, ViewportMode } from '../types';

const VIEWPORTS: Array<{ mode: ViewportMode; label: string }> = [
  { mode: '100%', label: 'Full' },
  { mode: '1440px', label: '1440' },
  { mode: '768px', label: '768' },
  { mode: '375px', label: '375' }
];

const MOUNTS: Array<{ tone: MountTone; color: string; label: string }> = [
  { tone: 'ink', color: 'var(--mount-ink)', label: 'Montaje tinta' },
  { tone: 'gray', color: 'var(--mount-gray)', label: 'Montaje gris neutro' },
  { tone: 'paper', color: 'var(--mount-paper)', label: 'Montaje papel' }
];

export const MockupViewer: React.FC<{ mockup: MockupItem }> = ({ mockup }) => {
  const [viewport, setViewport] = useState<ViewportMode>('100%');
  const [mount, setMount] = useState<MountTone>('ink');
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [nonce, setNonce] = useState(0);

  const Component = mockup.component;
  const isFull = viewport === '100%';
  const mountColor = MOUNTS.find(m => m.tone === mount)!.color;

  const copy = () => {
    navigator.clipboard?.writeText(mockup.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}>
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

        {!showCode && (
          <>
            {/* Firma: el fondo contra el que se juzga el trabajo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {MOUNTS.map(m => (
                <button
                  key={m.tone}
                  className="mount-swatch"
                  style={{ background: m.color }}
                  data-active={mount === m.tone}
                  onClick={() => setMount(m.tone)}
                  title={m.label}
                  aria-label={m.label}
                  aria-pressed={mount === m.tone}
                />
              ))}
            </div>

            <div className="rail-sep" />

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

            <div className="rail-sep" />
          </>
        )}

        <button className="rail-btn" data-active={showCode} onClick={() => setShowCode(v => !v)}>
          {showCode ? 'Vista' : 'Codigo'}
        </button>
      </div>

      {showCode ? (
        <div style={{ flex: 1, overflow: 'auto', background: 'var(--ink)' }}>
          <div style={{ maxWidth: '980px', margin: '0 auto', padding: '32px 24px 64px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px'
              }}
            >
              <span className="label">{mockup.id}.tsx</span>
              <button className="rail-btn" onClick={copy} style={{ border: '1px solid var(--line)' }}>
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            <pre
              style={{
                background: 'var(--rail)',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '22px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.8rem',
                lineHeight: '1.75',
                color: '#c8c8c8',
                overflowX: 'auto'
              }}
            >
              <code>{mockup.codeSnippet}</code>
            </pre>

            <p style={{ color: 'var(--fg-quiet)', fontSize: '0.85rem', marginTop: '20px' }}>
              {mockup.description}
            </p>
          </div>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            background: mountColor,
            transition: 'background-color 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div
            style={{
              width: isFull ? '100%' : viewport,
              maxWidth: '100%',
              minHeight: isFull ? '100%' : undefined,
              margin: isFull ? 0 : '28px 0 8px',
              /* Sin caja ni sombra a ancho completo: el mockup ES la pagina */
              ...(isFull ? {} : { border: '1px solid rgba(0, 0, 0, 0.3)' }),
              background: 'var(--ink)',
              transition: 'width 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
          >
            <div key={nonce}>
              <Component />
            </div>
          </div>

          {/* Pie de lamina montada */}
          {!isFull && (
            <div
              className="mono"
              style={{
                padding: '0 0 32px',
                color: mount === 'paper' ? '#7a7a7a' : 'rgba(255, 255, 255, 0.5)'
              }}
            >
              {viewport}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
