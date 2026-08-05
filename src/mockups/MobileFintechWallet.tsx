import React, { useState } from 'react';
import { Dialog, Tooltip } from '@base-ui/react';
import { CreditCard, Send, Plus, ArrowUpRight, ArrowDownLeft, Lock, Wifi, Smartphone, CheckCircle } from 'lucide-react';

export const MobileFintechWallet: React.FC = () => {
  const [sentSuccess, setSentSuccess] = useState(false);

  return (
    <div style={{ padding: '32px 16px', maxWidth: '480px', margin: '0 auto' }}>
      {/* Mobile Card Container */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px', background: 'rgba(15, 23, 42, 0.9)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 600 }}>AVAILABLE BALANCE</span>
            <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>
              $34,580.42
            </div>
          </div>
          <div style={{
            background: 'rgba(99, 102, 241, 0.2)',
            color: 'var(--primary)',
            padding: '10px',
            borderRadius: '50%'
          }}>
            <Smartphone size={20} />
          </div>
        </div>

        {/* Cyber Neon Credit Card Mockup */}
        <div style={{
          background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)',
          borderRadius: '20px',
          padding: '24px',
          color: '#fff',
          boxShadow: '0 15px 35px -5px rgba(124, 58, 237, 0.5)',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: '24px'
        }}>
          {/* Card background overlay */}
          <div style={{
            position: 'absolute',
            top: '-50%',
            right: '-50%',
            width: '200px',
            height: '200px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)',
            borderRadius: '50%'
          }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <span style={{ fontWeight: 800, letterSpacing: '0.1em', fontSize: '0.9rem' }}>NEXUS CARD</span>
            <Wifi size={20} style={{ opacity: 0.8 }} />
          </div>

          <div style={{ fontSize: '1.2rem', letterSpacing: '0.25em', fontFamily: 'var(--font-mono)', marginBottom: '24px' }}>
            •••• •••• •••• 8842
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.8rem' }}>
            <div>
              <div style={{ opacity: 0.7, fontSize: '0.65rem' }}>CARD HOLDER</div>
              <div style={{ fontWeight: 700, letterSpacing: '0.05em' }}>ALEXANDER VANCE</div>
            </div>
            <div>
              <div style={{ opacity: 0.7, fontSize: '0.65rem' }}>EXPIRES</div>
              <div style={{ fontWeight: 700 }}>09/28</div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
          <Dialog.Root>
            <Dialog.Trigger style={{
              background: 'var(--primary)',
              color: '#fff',
              border: 'none',
              borderRadius: '14px',
              padding: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              boxShadow: 'var(--shadow-glow)'
            }}>
              <Send size={16} /> Transfer
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Backdrop className="base-Dialog-backdrop" />
              <Dialog.Popup className="base-Dialog-popup">
                <h3 style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 800, marginBottom: '12px' }}>
                  Instant Money Transfer
                </h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
                  Send funds securely with zero fees.
                </p>

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Recipient Address / ENS
                  </label>
                  <input
                    type="text"
                    defaultValue="elena.eth"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-color)',
                      color: '#fff'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ color: '#fff', fontSize: '0.8rem', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Amount (USD)
                  </label>
                  <input
                    type="number"
                    defaultValue="250.00"
                    style={{
                      width: '100%',
                      padding: '10px',
                      borderRadius: '8px',
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid var(--border-color)',
                      color: '#fff',
                      fontSize: '1.2rem',
                      fontWeight: 700
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                  <Dialog.Close style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid var(--border-color)',
                    color: '#fff',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}>
                    Cancel
                  </Dialog.Close>
                  <button className="btn-glow" onClick={() => {
                    setSentSuccess(true);
                    setTimeout(() => setSentSuccess(false), 3000);
                  }}>
                    Confirm Transfer
                  </button>
                </div>
              </Dialog.Popup>
            </Dialog.Portal>
          </Dialog.Root>

          <button style={{
            background: 'rgba(255,255,255,0.08)',
            color: '#fff',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '12px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}>
            <Plus size={16} /> Top Up
          </button>
        </div>

        {sentSuccess && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: 'var(--success)',
            padding: '12px',
            borderRadius: '12px',
            marginBottom: '20px',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <CheckCircle size={16} /> Transfer executed successfully!
          </div>
        )}

        {/* Transaction History */}
        <div>
          <h4 style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '12px' }}>
            RECENT TRANSACTIONS
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--success)', padding: '8px', borderRadius: '10px' }}>
                  <ArrowDownLeft size={16} />
                </div>
                <div>
                  <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 600 }}>Stripe Deposit</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Today, 10:45 AM</div>
                </div>
              </div>
              <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.9rem' }}>+$1,200.00</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'rgba(236, 72, 153, 0.15)', color: 'var(--accent)', padding: '8px', borderRadius: '10px' }}>
                  <ArrowUpRight size={16} />
                </div>
                <div>
                  <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 600 }}>GitHub Copilot</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Yesterday</div>
                </div>
              </div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem' }}>-$19.00</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
