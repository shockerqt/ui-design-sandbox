import React, { useState } from 'react';
import { 
  Tooltip, 
  Dialog, 
  Tabs, 
  Switch, 
  Accordion
} from '@base-ui/react';
import { Info, Sparkles, Layers, Sliders, Eye, ChevronDown, Bell } from 'lucide-react';

export const BaseUIShowcase: React.FC = () => {
  const [switchChecked, setSwitchChecked] = useState(true);
  const [notifications, setNotifications] = useState(true);

  return (
    <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(6, 182, 212, 0.15))',
        border: '1px solid rgba(99, 102, 241, 0.3)',
        borderRadius: '16px',
        padding: '28px',
        marginBottom: '32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.2)'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span className="badge badge-primary">
              <Sparkles size={12} /> React 19 + Base UI 1.7
            </span>
            <span className="badge badge-secondary">Headless Primitives</span>
          </div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>
            Base UI Unstyled Primitives Laboratory
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginTop: '4px' }}>
            Test accessibility, keyboard navigation, and custom CSS design tokens on unstyled React components.
          </p>
        </div>
        <Dialog.Root>
          <Dialog.Trigger className="btn-glow">
            <Eye size={16} /> Open Test Dialog
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Backdrop className="base-Dialog-backdrop" />
            <Dialog.Popup className="base-Dialog-popup">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: 'var(--primary)',
                  padding: '10px',
                  borderRadius: '12px'
                }}>
                  <Sparkles size={24} />
                </div>
                <div>
                  <Dialog.Title style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700 }}>
                    Base UI Dialog Modal
                  </Dialog.Title>
                  <Dialog.Description style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    Fully accessible, focus-trapped, backdrop-blurred popover powered by @base-ui/react.
                  </Dialog.Description>
                </div>
              </div>

              <div style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <p style={{ color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: '1.6' }}>
                  Base UI provides unstyled headless building blocks so you retain 100% control over design systems, CSS variables, and animation states.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                <Dialog.Close style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid var(--border-color)',
                  color: '#fff',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}>
                  Close Modal
                </Dialog.Close>
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Grid of Interactive Primitive Showcase */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        
        {/* Card 1: Tooltips & Info Triggers */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Info size={20} color="var(--primary)" />
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>Base UI Tooltip</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Hover or focus buttons below to inspect styled floating tooltips.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Tooltip.Root>
              <Tooltip.Trigger style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid var(--border-color)',
                color: '#fff',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}>
                Hover Me
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner sideOffset={8}>
                  <Tooltip.Popup className="base-Tooltip-popup">
                    ✨ Accessible tooltip content with CSS blur backdrop
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>

            <Tooltip.Root>
              <Tooltip.Trigger style={{
                background: 'rgba(236, 72, 153, 0.15)',
                border: '1px solid rgba(236, 72, 153, 0.3)',
                color: '#f472b6',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}>
                Accent Tooltip
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Positioner sideOffset={8}>
                  <Tooltip.Popup className="base-Tooltip-popup" style={{ borderColor: 'rgba(236, 72, 153, 0.4)' }}>
                    🔥 Highlighting feature details in mockups
                  </Tooltip.Popup>
                </Tooltip.Positioner>
              </Tooltip.Portal>
            </Tooltip.Root>
          </div>
        </div>

        {/* Card 2: Switches & Toggles */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Sliders size={20} color="var(--secondary)" />
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>Base UI Switch</h3>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
            Fully accessible binary toggles with state indicator.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>Enable Dark Glass FX</span>
              <Switch.Root 
                checked={switchChecked} 
                onCheckedChange={setSwitchChecked}
                className="base-Switch-root"
              >
                <Switch.Thumb className="base-Switch-thumb" />
              </Switch.Root>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Bell size={14} /> Push Notifications
              </span>
              <Switch.Root 
                checked={notifications} 
                onCheckedChange={setNotifications}
                className="base-Switch-root"
              >
                <Switch.Thumb className="base-Switch-thumb" />
              </Switch.Root>
            </div>
          </div>
        </div>

        {/* Card 3: Tabs Navigation */}
        <div className="glass-panel" style={{ padding: '24px', gridColumn: 'span 1' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <Layers size={20} color="var(--accent)" />
            <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>Base UI Tabs</h3>
          </div>

          <Tabs.Root defaultValue="tab1">
            <Tabs.List className="base-TabsList-root">
              <Tabs.Tab value="tab1" className="base-Tab-root">Design Tokens</Tabs.Tab>
              <Tabs.Tab value="tab2" className="base-Tab-root">CSS Variables</Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="tab1" style={{ paddingTop: '16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Tailored colors, HSL gradients, glassmorphism overlays, and micro-animations defined in <code>index.css</code>.
            </Tabs.Panel>
            <Tabs.Panel value="tab2" style={{ paddingTop: '16px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              <code>--primary: #6366f1;</code><br />
              <code>--secondary: #06b6d4;</code><br />
              <code>--accent: #ec4899;</code>
            </Tabs.Panel>
          </Tabs.Root>
        </div>

      </div>

      {/* Accordion Component Showcase */}
      <div className="glass-panel" style={{ padding: '28px', marginTop: '32px' }}>
        <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>
          Base UI Accordion Primitive
        </h3>

        <Accordion.Root defaultValue={['item-1']} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Accordion.Item value="item-1">
            <Accordion.Header className="base-Accordion-header">
              <Accordion.Trigger className="base-Accordion-trigger">
                <span>Why build mockups programmatically in a sandbox?</span>
                <ChevronDown size={18} />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel className="base-Accordion-panel">
              Building mockups in React 19 lets you validate layout responsive behaviors, micro-interactions, dark mode colors, and component state before integrating them into production applications.
            </Accordion.Panel>
          </Accordion.Item>

          <Accordion.Item value="item-2">
            <Accordion.Header className="base-Accordion-header">
              <Accordion.Trigger className="base-Accordion-trigger">
                <span>What are the benefits of Base UI over rigid UI kits?</span>
                <ChevronDown size={18} />
              </Accordion.Trigger>
            </Accordion.Header>
            <Accordion.Panel className="base-Accordion-panel">
              Base UI offers 100% unstyled, accessible WAI-ARIA primitives. You don't have to fight default styles or override complex theme systems; you just bring your own custom CSS design system.
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion.Root>
      </div>

    </div>
  );
};
