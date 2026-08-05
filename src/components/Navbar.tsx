import React from 'react';
import { Layers, Code2, LayoutGrid } from 'lucide-react';

interface NavbarProps {
  mockupCount: number;
  onSelectCategory: (cat: any) => void;
  activeCategory: string;
  onBackToGallery: () => void;
  isViewingMockup: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  mockupCount,
  onBackToGallery,
  isViewingMockup
}) => {
  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 100,
      background: 'rgba(9, 13, 22, 0.85)',
      backdropFilter: 'var(--glass-blur)',
      borderBottom: '1px solid var(--border-color)',
      padding: '14px 28px'
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Brand Logo & Title */}
        <div 
          onClick={onBackToGallery}
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
        >
          <div style={{
            background: 'linear-gradient(135deg, var(--primary), var(--secondary))',
            padding: '10px',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-glow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff'
          }}>
            <Layers size={22} />
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: '#fff',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.02em'
              }}>
                UI Design Sandbox
              </span>
              <span className="badge badge-primary">React 19</span>
              <span className="badge badge-secondary">Base UI</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Programmatic Mockup Laboratory & Design System Iteration Hub
            </p>
          </div>
        </div>

        {/* Stats & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isViewingMockup && (
            <button
              onClick={onBackToGallery}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-color)',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <LayoutGrid size={16} /> Back to Gallery
            </button>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid var(--border-color)',
            padding: '6px 12px',
            borderRadius: '8px',
            fontSize: '0.8rem',
            color: 'var(--text-muted)'
          }}>
            <Code2 size={14} color="var(--primary)" />
            <span>Active Mockups: <strong style={{ color: '#fff' }}>{mockupCount}</strong></span>
          </div>

          <a
            href="https://github.com/shockerqt/ui-design-sandbox"
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--text-main)',
              textDecoration: 'none',
              fontSize: '0.85rem',
              fontWeight: 600,
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '8px 14px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"></path>
              <path d="M9 18c-4.51 2-5-2-7-2"></path>
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </header>
  );
};
