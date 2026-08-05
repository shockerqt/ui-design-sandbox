import React, { useState } from 'react';
import { Dialog, Switch, Tooltip } from '@base-ui/react';
import { Check, Zap, Crown, Shield, ArrowRight, HelpCircle } from 'lucide-react';

export const SaaSPricing: React.FC = () => {
  const [isYearly, setIsYearly] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      name: 'Starter',
      icon: Zap,
      monthlyPrice: 19,
      yearlyPrice: 15,
      description: 'Perfect for indie hackers & side projects testing React 19 UI prototypes.',
      features: [
        'Up to 5 Active Projects',
        'Base UI Component Access',
        'Standard Community Support',
        '10GB Storage & CDN Assets'
      ],
      popular: false,
      gradient: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))'
    },
    {
      name: 'Pro Developer',
      icon: Crown,
      monthlyPrice: 49,
      yearlyPrice: 39,
      description: 'Ideal for full-stack developers and fast-moving design teams.',
      features: [
        'Unlimited Mockup Sandboxes',
        'All Base UI Headless Components',
        'Automated Figma to React Sync',
        'Priority SLA Support',
        'Custom Design System Tokens'
      ],
      popular: true,
      gradient: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(236, 72, 153, 0.15))'
    },
    {
      name: 'Enterprise Studio',
      icon: Shield,
      monthlyPrice: 149,
      yearlyPrice: 119,
      description: 'Full governance compliance, SSO, dedicated infrastructure, and 24/7 support.',
      features: [
        'Dedicated VPS Deployment',
        'Custom CI/CD Pipelines',
        'On-Premise Vault Security',
        'Dedicated Solutions Architect',
        'Custom Component Engineering'
      ],
      popular: false,
      gradient: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15), rgba(99, 102, 241, 0.1))'
    }
  ];

  return (
    <div style={{ padding: '40px 24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Title & Header */}
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <span className="badge badge-accent" style={{ marginBottom: '12px' }}>
          Flexible Pricing Mockup
        </span>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)', marginBottom: '12px' }}>
          Simple, Transparent Plans for Builders
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto 24px' }}>
          Scale your design system programmatically without unexpected hidden usage fees.
        </p>

        {/* Monthly / Yearly Switch */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
          background: 'rgba(15, 23, 42, 0.8)',
          border: '1px solid var(--border-color)',
          padding: '8px 16px',
          borderRadius: '9999px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)'
        }}>
          <span style={{ fontSize: '0.9rem', color: !isYearly ? '#fff' : 'var(--text-muted)', fontWeight: !isYearly ? 700 : 400 }}>
            Monthly Billing
          </span>
          <Switch.Root
            checked={isYearly}
            onCheckedChange={setIsYearly}
            className="base-Switch-root"
          >
            <Switch.Thumb className="base-Switch-thumb" />
          </Switch.Root>
          <span style={{ fontSize: '0.9rem', color: isYearly ? '#fff' : 'var(--text-muted)', fontWeight: isYearly ? 700 : 400 }}>
            Yearly Billing
          </span>
          <span className="badge badge-primary" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
            Save 20%
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px' }}>
        {plans.map((plan, idx) => {
          const Icon = plan.icon;
          const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice;

          return (
            <div
              key={idx}
              className="glass-panel"
              style={{
                padding: '32px 28px',
                position: 'relative',
                background: plan.gradient,
                borderColor: plan.popular ? 'var(--primary)' : 'var(--border-color)',
                boxShadow: plan.popular ? 'var(--shadow-glow)' : 'none',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              {plan.popular && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'linear-gradient(90deg, var(--primary), var(--accent))',
                  color: '#fff',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  padding: '4px 14px',
                  borderRadius: '9999px',
                  letterSpacing: '0.05em',
                  boxShadow: '0 4px 15px var(--primary-glow)'
                }}>
                  MOST POPULAR
                </div>
              )}

              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                  <div style={{
                    background: plan.popular ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    padding: '10px',
                    borderRadius: '12px'
                  }}>
                    <Icon size={22} />
                  </div>
                  <h3 style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 800 }}>{plan.name}</h3>
                </div>

                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '24px', minHeight: '40px' }}>
                  {plan.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', marginBottom: '24px' }}>
                  <span style={{ fontSize: '2.8rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>
                    ${price}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>/ month</span>
                </div>

                {/* Features List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
                  {plan.features.map((feat, fIdx) => (
                    <div key={fIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        background: 'rgba(16, 185, 129, 0.15)',
                        color: 'var(--success)',
                        borderRadius: '50%',
                        padding: '2px',
                        display: 'flex'
                      }}>
                        <Check size={14} />
                      </div>
                      <span style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Checkout Trigger */}
              <Dialog.Root>
                <Dialog.Trigger
                  onClick={() => setSelectedPlan(plan.name)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '12px',
                    background: plan.popular ? 'var(--primary)' : 'rgba(255,255,255,0.08)',
                    color: '#fff',
                    border: plan.popular ? 'none' : '1px solid var(--border-color)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    transition: 'var(--transition-fast)'
                  }}
                >
                  Choose {plan.name} <ArrowRight size={16} />
                </Dialog.Trigger>

                <Dialog.Portal>
                  <Dialog.Backdrop className="base-Dialog-backdrop" />
                  <Dialog.Popup className="base-Dialog-popup">
                    <h2 style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 800, marginBottom: '8px' }}>
                      Confirm Subscription
                    </h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
                      You are subscribing to <strong>{selectedPlan}</strong> plan billed {isYearly ? 'annually' : 'monthly'} at ${price}/mo.
                    </p>

                    <div style={{
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      padding: '16px',
                      marginBottom: '20px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', color: 'var(--text-main)' }}>
                        <span>Subtotal</span>
                        <span>${price * (isYearly ? 12 : 1)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', fontWeight: 700 }}>
                        <span>Yearly Discount</span>
                        <span>{isYearly ? '-20%' : '$0'}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                      <Dialog.Close style={{
                        background: 'rgba(255,255,255,0.08)',
                        border: '1px solid var(--border-color)',
                        color: '#fff',
                        padding: '10px 18px',
                        borderRadius: '8px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}>
                        Cancel
                      </Dialog.Close>
                      <button className="btn-glow" onClick={() => alert(`Subscribed to ${selectedPlan}!`)}>
                        Proceed to Checkout
                      </button>
                    </div>
                  </Dialog.Popup>
                </Dialog.Portal>
              </Dialog.Root>

            </div>
          );
        })}
      </div>
    </div>
  );
};
