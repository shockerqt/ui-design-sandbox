import React from 'react';
import { Link } from 'wouter';
import { LayoutGrid } from 'lucide-react';

interface NavbarProps {
  mockupCount: number;
  isViewingMockup: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  mockupCount,
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
        <Link
          href="/"
          style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', textDecoration: 'none' }}
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
        </Link>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {isViewingMockup && (
            <Link
              href="/"
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
                gap: '6px',
                textDecoration: 'none'
              }}
            >
              <LayoutGrid size={14} /> Back to Gallery
            </Link>
          )}

          <span style={{ fontSize: '0.8rem', color: '#666666' }}>
            Mockups: <strong style={{ color: '#ffffff' }}>{mockupCount}</strong>
          </span>
        </div>
      </div>
    </header>
  );
};
