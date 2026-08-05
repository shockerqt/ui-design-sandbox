import React from 'react';
import { LayoutGrid } from 'lucide-react';

interface NavbarProps {
  mockupCount: number;
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
      background: '#000000',
      borderBottom: '1px solid #1a1a1a',
      padding: '16px 32px'
    }}>
      <div style={{
        maxWidth: '1200px',
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
            width: '12px',
            height: '12px',
            borderRadius: '50%',
            background: '#ffffff'
          }} />

          <span style={{
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#ffffff',
            letterSpacing: '-0.02em'
          }}>
            UI Sandbox
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isViewingMockup && (
            <button
              onClick={onBackToGallery}
              style={{
                background: '#111111',
                border: '1px solid #222222',
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: 600,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <LayoutGrid size={14} /> Back to Gallery
            </button>
          )}

          <span style={{ fontSize: '0.8rem', color: '#666666' }}>
            Mockups: <strong style={{ color: '#ffffff' }}>{mockupCount}</strong>
          </span>
        </div>
      </div>
    </header>
  );
};
