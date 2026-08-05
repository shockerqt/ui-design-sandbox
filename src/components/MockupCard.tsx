import React from 'react';
import { Link } from 'wouter';
import { MockupItem } from '../types';
import { ArrowRight, Clock } from 'lucide-react';

interface MockupCardProps {
  mockup: MockupItem;
}

export const MockupCard: React.FC<MockupCardProps> = ({ mockup }) => {
  return (
    <Link
      href={`/m/${mockup.id}`}
      className="glass-panel mockup-card"
      style={{
        padding: '24px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
        textDecoration: 'none',
        color: 'inherit'
      }}
    >
      {/* Top Gradient Accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: mockup.previewGradient || 'var(--primary)'
      }} />

      <div>
        {/* Category & Version */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <span className="badge badge-primary">{mockup.category}</span>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
            {mockup.version}
          </span>
        </div>

        {/* Title */}
        <h3 style={{
          fontSize: '1.25rem',
          fontWeight: 700,
          color: '#fff',
          fontFamily: 'var(--font-display)',
          marginBottom: '8px'
        }}>
          {mockup.title}
        </h3>

        {/* Description */}
        <p style={{
          color: 'var(--text-muted)',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          marginBottom: '20px',
          minHeight: '42px'
        }}>
          {mockup.description}
        </p>

        {/* Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '24px' }}>
          {mockup.tags.map((tag, idx) => (
            <span
              key={idx}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: 'var(--text-main)',
                fontSize: '0.75rem',
                padding: '3px 8px',
                borderRadius: '6px'
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderTop: '1px solid var(--border-color)',
        paddingTop: '16px',
        marginTop: '8px'
      }}>
        <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} /> {mockup.updatedAt}
        </span>

        <span style={{
          color: 'var(--primary)',
          fontWeight: 700,
          fontSize: '0.85rem',
          display: 'flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          Explore Mockup <ArrowRight size={14} />
        </span>
      </div>
    </Link>
  );
};
