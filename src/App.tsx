import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { MockupCard } from './components/MockupCard';
import { MockupViewer } from './components/MockupViewer';
import { mockupRegistry } from './mockups/registry';
import { MockupItem } from './types';

export const App: React.FC = () => {
  const [selectedMockup, setSelectedMockup] = useState<MockupItem | null>(null);

  return (
    <div style={{ minHeight: '100vh', background: '#000000', color: '#ffffff', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        mockupCount={mockupRegistry.length}
        onBackToGallery={() => setSelectedMockup(null)}
        isViewingMockup={!!selectedMockup}
      />

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {selectedMockup ? (
          <MockupViewer
            mockup={selectedMockup}
            onBack={() => setSelectedMockup(null)}
          />
        ) : (
          /* Pure Black Clean Index Landing */
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
            <div style={{
              display: 'inline-block',
              background: '#111111',
              border: '1px solid #222222',
              color: '#888888',
              borderRadius: '999px',
              padding: '4px 12px',
              fontSize: '0.75rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              marginBottom: '24px'
            }}>
              REACT 19 • BASE UI
            </div>

            <h1 style={{
              fontSize: '3rem',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.04em',
              lineHeight: '1.1',
              marginBottom: '16px'
            }}>
              UI Design Sandbox
            </h1>

            <p style={{
              color: '#666666',
              fontSize: '1.05rem',
              maxWidth: '500px',
              margin: '0 auto 48px',
              lineHeight: '1.6'
            }}>
              Laboratorio limpio listo para generar e iterar mockups guiados por agentes de IA.
            </p>

            {mockupRegistry.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '20px',
                textAlign: 'left'
              }}>
                {mockupRegistry.map(mockup => (
                  <MockupCard
                    key={mockup.id}
                    mockup={mockup}
                    onSelect={setSelectedMockup}
                  />
                ))}
              </div>
            ) : (
              <div style={{
                border: '1px dashed #222222',
                borderRadius: '12px',
                padding: '40px 24px',
                color: '#444444',
                fontSize: '0.875rem'
              }}>
                Esperando la creación del primer mockup guiado por agente...
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
