import React, { useState } from 'react';
import { MockupItem, ViewportMode } from '../types';
import { 
  Monitor, 
  Tablet, 
  Smartphone, 
  Maximize2, 
  Code, 
  Eye, 
  Copy, 
  Check, 
  Sparkles,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { Tooltip, Tabs } from '@base-ui/react';

interface MockupViewerProps {
  mockup: MockupItem;
  onBack: () => void;
}

export const MockupViewer: React.FC<MockupViewerProps> = ({ mockup, onBack }) => {
  const [viewport, setViewport] = useState<ViewportMode>('100%');
  const [activeTab, setActiveTab] = useState<'canvas' | 'code'>('canvas');
  const [copied, setCopied] = useState(false);
  const [key, setKey] = useState(0); // for refresh re-render

  const Component = mockup.component;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(mockup.codeSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '24px 20px' }}>
      {/* Navigation & Controls Bar */}
      <div className="glass-panel" style={{
        padding: '14px 24px',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        {/* Left: Title & Back Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-color)',
              color: '#fff',
              padding: '8px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            <ArrowLeft size={16} /> Gallery
          </button>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>
                {mockup.title}
              </h2>
              <span className="badge badge-primary">{mockup.category}</span>
            </div>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
              {mockup.description}
            </span>
          </div>
        </div>

        {/* Center: Viewport Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {activeTab === 'canvas' && (
            <div style={{
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid var(--border-color)',
              borderRadius: '10px',
              padding: '4px',
              display: 'flex',
              gap: '4px'
            }}>
              <Tooltip.Root>
                <Tooltip.Trigger
                  onClick={() => setViewport('100%')}
                  style={{
                    background: viewport === '100%' ? 'var(--primary)' : 'transparent',
                    color: viewport === '100%' ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                >
                  <Maximize2 size={14} /> Full
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Positioner sideOffset={8}>
                    <Tooltip.Popup className="base-Tooltip-popup">100% Responsive Viewport</Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger
                  onClick={() => setViewport('1440px')}
                  style={{
                    background: viewport === '1440px' ? 'var(--primary)' : 'transparent',
                    color: viewport === '1440px' ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                >
                  <Monitor size={14} /> Desktop (1440px)
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Positioner sideOffset={8}>
                    <Tooltip.Popup className="base-Tooltip-popup">Desktop Canvas Frame</Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger
                  onClick={() => setViewport('768px')}
                  style={{
                    background: viewport === '768px' ? 'var(--primary)' : 'transparent',
                    color: viewport === '768px' ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                >
                  <Tablet size={14} /> Tablet (768px)
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Positioner sideOffset={8}>
                    <Tooltip.Popup className="base-Tooltip-popup">Tablet Canvas Frame</Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </Tooltip.Root>

              <Tooltip.Root>
                <Tooltip.Trigger
                  onClick={() => setViewport('375px')}
                  style={{
                    background: viewport === '375px' ? 'var(--primary)' : 'transparent',
                    color: viewport === '375px' ? '#fff' : 'var(--text-muted)',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                >
                  <Smartphone size={14} /> Mobile (375px)
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Positioner sideOffset={8}>
                    <Tooltip.Popup className="base-Tooltip-popup">Mobile Device Frame</Tooltip.Popup>
                  </Tooltip.Positioner>
                </Tooltip.Portal>
              </Tooltip.Root>
            </div>
          )}

          {/* Canvas / Code Mode Toggle */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '3px' }}>
            <button
              onClick={() => setActiveTab('canvas')}
              style={{
                background: activeTab === 'canvas' ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: activeTab === 'canvas' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Eye size={14} /> Preview Canvas
            </button>
            <button
              onClick={() => setActiveTab('code')}
              style={{
                background: activeTab === 'code' ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: activeTab === 'code' ? '#fff' : 'var(--text-muted)',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Code size={14} /> Source Code
            </button>
          </div>

          <Tooltip.Root>
            <Tooltip.Trigger
              onClick={() => setKey(k => k + 1)}
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid var(--border-color)',
                color: '#fff',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={15} />
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner sideOffset={8}>
                <Tooltip.Popup className="base-Tooltip-popup">Reload Mockup State</Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      </div>

      {/* Main Viewport Content Area */}
      {activeTab === 'canvas' ? (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-start',
          minHeight: '680px',
          width: '100%',
          overflowX: 'auto',
          paddingBottom: '40px'
        }}>
          <div style={{
            width: viewport,
            maxWidth: '100%',
            transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            background: 'rgba(15, 23, 42, 0.75)',
            border: viewport !== '100%' ? '2px solid rgba(99, 102, 241, 0.4)' : '1px solid var(--border-color)',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Viewport Width Badge when scaled */}
            {viewport !== '100%' && (
              <div style={{
                background: 'rgba(99, 102, 241, 0.9)',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '4px 12px',
                textAlign: 'center',
                letterSpacing: '0.05em'
              }}>
                SIMULATED VIEWPORT: {viewport}
              </div>
            )}

            <div key={key}>
              <Component />
            </div>
          </div>
        </div>
      ) : (
        /* Source Code Tab */
        <div className="glass-panel" style={{ padding: '24px', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontFamily: 'var(--font-mono)' }}>
              Source implementation snippet ({mockup.id}.tsx)
            </span>
            <button
              onClick={handleCopyCode}
              style={{
                background: copied ? 'var(--success)' : 'var(--primary)',
                color: '#fff',
                border: 'none',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied to Clipboard!' : 'Copy Code'}
            </button>
          </div>

          <pre style={{
            background: 'rgba(4, 7, 13, 0.9)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            padding: '20px',
            color: '#a5b4fc',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.9rem',
            overflowX: 'auto',
            lineHeight: '1.6'
          }}>
            <code>{mockup.codeSnippet}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
