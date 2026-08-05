import React from 'react';
import { Link, Route, Switch } from 'wouter';
import { Index } from './components/Index';
import { MockupViewer } from './components/MockupViewer';
import { mockupRegistry } from './mockups/registry';

/**
 * No hay cromo global a proposito: el indice trae su propia cabecera y el
 * visor su riel. Asi el mockup dispone de toda la pagina bajo 48px de riel.
 */

const NotFound: React.FC<{ id?: string }> = ({ id }) => (
  <div style={{ maxWidth: '1180px', margin: '0 auto', padding: '110px 44px' }}>
    <div className="label" style={{ marginBottom: '18px' }}>
      404
    </div>

    <h1 className="display" style={{ fontSize: 'clamp(2rem, 6vw, 3.6rem)', marginBottom: '20px' }}>
      No esta
      <br />
      en el registro
    </h1>

    <p style={{ color: 'var(--fg-quiet)', fontSize: '0.95rem', marginBottom: '32px', maxWidth: '44ch' }}>
      {id ? (
        <>
          Ningun mockup responde al id{' '}
          <span className="mono" style={{ color: 'var(--signal)' }}>
            {id}
          </span>
          .
        </>
      ) : (
        'Esta ruta no corresponde a ninguna vista del sandbox.'
      )}
    </p>

    <Link href="/" className="rail-btn" style={{ border: '1px solid var(--line)', color: 'var(--fg)' }}>
      Ver el registro
    </Link>
  </div>
);

const MockupRoute: React.FC<{ id: string }> = ({ id }) => {
  const mockup = mockupRegistry.find(m => m.id === id);
  return mockup ? <MockupViewer mockup={mockup} /> : <NotFound id={id} />;
};

export const App: React.FC = () => (
  <Switch>
    <Route path="/" component={Index} />
    <Route path="/m/:id">{params => <MockupRoute id={params.id} />}</Route>
    <Route>{() => <NotFound />}</Route>
  </Switch>
);
