import React from 'react';
import { MockupRow } from './MockupRow';
import { mockupRegistry } from '../mockups/registry';

const lastUpdate = (): string =>
  mockupRegistry.reduce((latest, m) => (m.updatedAt > latest ? m.updatedAt : latest), '');

export const Index: React.FC = () => {
  const count = mockupRegistry.length;

  return (
    <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '0 24px 96px' }}>
      <header style={{ padding: '84px 20px 40px' }}>
        <h1
          className="display"
          style={{ fontSize: 'clamp(2.75rem, 9vw, 6rem)', marginBottom: '22px' }}
        >
          Design
          <br />
          Sandbox
        </h1>

        <p
          style={{
            color: 'var(--fg-quiet)',
            fontSize: '0.95rem',
            maxWidth: '44ch',
            marginBottom: '18px'
          }}
        >
          Mockups de interfaz generados e iterados por agentes. Cada uno vive en su
          propia URL, lista para compartir.
        </p>

        <div className="mono" style={{ color: 'var(--fg-faint)' }}>
          {count === 0
            ? 'registro vacio'
            : `${count} ${count === 1 ? 'mockup' : 'mockups'} · ultimo ${lastUpdate()}`}
        </div>
      </header>

      {count === 0 ? (
        <div
          style={{
            borderTop: '1px solid var(--line)',
            padding: '56px 20px',
            color: 'var(--fg-faint)',
            fontSize: '0.9rem'
          }}
        >
          Pide el primer mockup describiendo la pantalla que quieres ver.
        </div>
      ) : (
        <div className="register">
          <div className="register-head">
            <span className="label">Mockup</span>
            <span className="label">Ruta</span>
            <span className="label">Categoria</span>
            <span className="label">Version</span>
            <span className="label">Actualizado</span>
          </div>

          {mockupRegistry.map(mockup => (
            <MockupRow key={mockup.id} mockup={mockup} />
          ))}
        </div>
      )}
    </div>
  );
};
