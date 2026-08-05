import React, { useState } from 'react';
import { Dialog, Tabs, Switch, Tooltip } from '@base-ui/react';
import { Search, Command, Settings, Key, Shield, User, Terminal, Sparkles, Moon, Bell } from 'lucide-react';

export const CommandPalette: React.FC = () => {
  const [openCommand, setOpenCommand] = useState(false);
  const [query, setQuery] = useState('');

  const commands = [
    { icon: Terminal, title: 'Open Terminal Console', category: 'Developer', shortcut: '⌘ + T' },
    { icon: Settings, title: 'Manage System Preferences', category: 'Settings', shortcut: '⌘ + ,' },
    { icon: Key, title: 'Rotate API Security Tokens', category: 'Security', shortcut: '⌘ + K' },
    { icon: Sparkles, title: 'Run AI Component Generator', category: 'Design', shortcut: '⌘ + G' }
  ];

  const filtered = commands.filter(c => c.title.toLowerCase().includes(query.toLowerCase()));

  return (
    <div style={{ padding: '36px 24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Title */}
      <div style={{ marginBottom: '28px' }}>
        <span className="badge badge-primary" style={{ marginBottom: '8px' }}>
          Modal & Dialog Mockup
        </span>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>
          Command Palette & System Settings
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Press the button below or simulate <code>⌘K</code> spotlight search with Base UI Dialog.
        </p>
      </div>

      {/* Spotlight Trigger Card */}
      <div 
        onClick={() => setOpenCommand(true)}
        className="glass-panel" 
        style={{
          padding: '16px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          marginBottom: '36px',
          border: '1px solid rgba(99, 102, 241, 0.3)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', color: 'var(--text-muted)' }}>
          <Search size={20} color="var(--primary)" />
          <span style={{ fontSize: '0.95rem' }}>Type a command or search mockups...</span>
        </div>
        <kbd style={{
          background: 'rgba(255, 255, 255, 0.1)',
          border: '1px solid var(--border-color)',
          color: 'var(--text-main)',
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontFamily: 'var(--font-mono)'
        }}>
          ⌘ K
        </kbd>
      </div>

      {/* Base UI Command Dialog Modal */}
      <Dialog.Root open={openCommand} onOpenChange={setOpenCommand}>
        <Dialog.Portal>
          <Dialog.Backdrop className="base-Dialog-backdrop" />
          <Dialog.Popup className="base-Dialog-popup" style={{ maxWidth: '640px', padding: '0', overflow: 'hidden' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 20px',
              borderBottom: '1px solid var(--border-color)',
              gap: '12px'
            }}>
              <Search size={20} color="var(--text-muted)" />
              <input
                type="text"
                placeholder="Search commands, actions, or tools..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: '#fff',
                  fontSize: '1rem',
                  width: '100%',
                  fontFamily: 'var(--font-sans)'
                }}
                autoFocus
              />
              <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                ESC
              </kbd>
            </div>

            <div style={{ padding: '12px', maxHeight: '320px', overflowY: 'auto' }}>
              {filtered.map((cmd, idx) => {
                const Icon = cmd.icon;
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      alert(`Triggered: ${cmd.title}`);
                      setOpenCommand(false);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'var(--transition-fast)',
                      background: 'transparent'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99, 102, 241, 0.15)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <Icon size={18} color="var(--primary)" />
                      <span style={{ color: '#fff', fontSize: '0.9rem', fontWeight: 500 }}>{cmd.title}</span>
                    </div>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                      {cmd.shortcut}
                    </span>
                  </div>
                );
              })}
            </div>
          </Dialog.Popup>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Tabbed Settings Layout */}
      <div className="glass-panel" style={{ padding: '28px' }}>
        <h2 style={{ color: '#fff', fontSize: '1.25rem', fontWeight: 700, marginBottom: '20px' }}>
          App Settings & Governance Config
        </h2>

        <Tabs.Root defaultValue="account">
          <Tabs.List className="base-TabsList-root" style={{ marginBottom: '24px' }}>
            <Tabs.Tab value="account" className="base-Tab-root">
              <User size={14} style={{ marginRight: '6px' }} /> Account
            </Tabs.Tab>
            <Tabs.Tab value="security" className="base-Tab-root">
              <Shield size={14} style={{ marginRight: '6px' }} /> Security
            </Tabs.Tab>
            <Tabs.Tab value="notifications" className="base-Tab-root">
              <Bell size={14} style={{ marginRight: '6px' }} /> Preferences
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="account" style={{ color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', color: 'var(--text-main)', fontSize: '0.875rem', fontWeight: 600, marginBottom: '6px' }}>
                  Developer Handle
                </label>
                <input
                  type="text"
                  defaultValue="shockerqt"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    background: 'rgba(0,0,0,0.3)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="security" style={{ color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 600 }}>Two-Factor Authentication</div>
                <div style={{ fontSize: '0.85rem' }}>Secure your account using hardware keys or authenticator app.</div>
              </div>
              <Switch.Root defaultChecked className="base-Switch-root">
                <Switch.Thumb className="base-Switch-thumb" />
              </Switch.Root>
            </div>
          </Tabs.Panel>

          <Tabs.Panel value="notifications" style={{ color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <div>
                <div style={{ color: '#fff', fontWeight: 600 }}>GitHub Activity Digest</div>
                <div style={{ fontSize: '0.85rem' }}>Receive email alerts when milestones or PRs are completed.</div>
              </div>
              <Switch.Root defaultChecked className="base-Switch-root">
                <Switch.Thumb className="base-Switch-thumb" />
              </Switch.Root>
            </div>
          </Tabs.Panel>
        </Tabs.Root>
      </div>

    </div>
  );
};
