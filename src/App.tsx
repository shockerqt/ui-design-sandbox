import React, { useState, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { MockupCard } from './components/MockupCard';
import { MockupViewer } from './components/MockupViewer';
import { mockupRegistry } from './mockups/registry';
import { Category, MockupItem } from './types';
import { Search, Filter, Layers, Sparkles, Plus, Code2 } from 'lucide-react';

export const App: React.FC = () => {
  const [selectedMockup, setSelectedMockup] = useState<MockupItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');

  const categories: Category[] = [
    'All',
    'Base UI Primitives',
    'Dashboards',
    'SaaS & Pricing',
    'Settings & Modals',
    'Fintech & Cards'
  ];

  const filteredMockups = useMemo(() => {
    return mockupRegistry.filter(item => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      const matchesQuery = 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, searchQuery]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        mockupCount={mockupRegistry.length}
        onSelectCategory={setActiveCategory}
        activeCategory={activeCategory}
        onBackToGallery={() => setSelectedMockup(null)}
        isViewingMockup={!!selectedMockup}
      />

      <main style={{ flex: 1 }}>
        {selectedMockup ? (
          <MockupViewer
            mockup={selectedMockup}
            onBack={() => setSelectedMockup(null)}
          />
        ) : (
          /* Gallery Hub */
          <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '40px 28px' }}>
            
            {/* Hero Section */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(6, 182, 212, 0.08))',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              borderRadius: '24px',
              padding: '36px 32px',
              marginBottom: '40px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ maxWidth: '750px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <span className="badge badge-primary">
                    <Sparkles size={12} /> React 19 + Base UI Sandbox
                  </span>
                  <span className="badge badge-secondary">Governance Standard</span>
                </div>
                <h1 style={{
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  color: '#fff',
                  fontFamily: 'var(--font-display)',
                  lineHeight: '1.25',
                  marginBottom: '14px'
                }}>
                  Iterate UI Mockups Programmatically Before App Integration
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.6' }}>
                  Select any mockup page from the laboratory grid below to test layout, dark mode colors, responsive frames, and unstyled WAI-ARIA <code>@base-ui/react</code> primitives.
                </p>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '32px',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              {/* Category Pills */}
              <div style={{
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap',
                background: 'rgba(15, 23, 42, 0.6)',
                padding: '6px',
                borderRadius: '14px',
                border: '1px solid var(--border-color)'
              }}>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      background: activeCategory === cat ? 'var(--primary)' : 'transparent',
                      color: activeCategory === cat ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(15, 23, 42, 0.8)',
                border: '1px solid var(--border-color)',
                borderRadius: '12px',
                padding: '8px 16px',
                width: '320px'
              }}>
                <Search size={18} color="var(--text-dim)" />
                <input
                  type="text"
                  placeholder="Search mockups or tags..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    outline: 'none',
                    color: '#fff',
                    fontSize: '0.875rem',
                    width: '100%'
                  }}
                />
              </div>
            </div>

            {/* Mockups Grid */}
            {filteredMockups.length > 0 ? (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                gap: '28px'
              }}>
                {filteredMockups.map(mockup => (
                  <MockupCard
                    key={mockup.id}
                    mockup={mockup}
                    onSelect={setSelectedMockup}
                  />
                ))}
              </div>
            ) : (
              <div className="glass-panel" style={{ textAlign: 'center', padding: '48px' }}>
                <Code2 size={40} color="var(--text-dim)" style={{ marginBottom: '12px' }} />
                <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700 }}>No mockups found</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '6px' }}>
                  Try adjusting your search query or switching categories.
                </p>
              </div>
            )}

          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-color)',
        padding: '24px 28px',
        textAlign: 'center',
        color: 'var(--text-dim)',
        fontSize: '0.85rem',
        marginTop: '60px'
      }}>
        UI Design Sandbox • React 19 & Base UI Mockup Laboratory • Built under Workspace Governance
      </footer>
    </div>
  );
};
