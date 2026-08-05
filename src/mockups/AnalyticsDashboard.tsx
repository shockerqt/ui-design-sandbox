import React, { useState } from 'react';
import { Tooltip } from '@base-ui/react';
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Activity, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  Download, 
  Filter,
  Zap,
  CheckCircle2,
  Clock
} from 'lucide-react';

export const AnalyticsDashboard: React.FC = () => {
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  const stats = [
    {
      title: 'Total Revenue',
      value: '$128,450.00',
      change: '+14.2%',
      isPositive: true,
      icon: DollarSign,
      color: '#6366f1',
      sparkline: [40, 55, 60, 52, 78, 85, 95]
    },
    {
      title: 'Active Users',
      value: '24,890',
      change: '+8.7%',
      isPositive: true,
      icon: Users,
      color: '#06b6d4',
      sparkline: [30, 45, 50, 65, 60, 75, 88]
    },
    {
      title: 'Conversion Rate',
      value: '3.42%',
      change: '-0.4%',
      isPositive: false,
      icon: TrendingUp,
      color: '#ec4899',
      sparkline: [65, 60, 55, 50, 48, 45, 42]
    },
    {
      title: 'Avg. Latency',
      value: '24.5 ms',
      change: '-18.1%',
      isPositive: true, // latency decrease is positive
      icon: Activity,
      color: '#10b981',
      sparkline: [90, 80, 70, 60, 45, 30, 24]
    }
  ];

  const recentEvents = [
    { id: 1, user: 'Elena Rostova', action: 'Upgraded to Enterprise Tier', time: '2 mins ago', amount: '+$499.00' },
    { id: 2, user: 'Devon Lane', action: 'Deployed New API Gateway', time: '15 mins ago', status: 'Success' },
    { id: 3, user: 'Sarah Jenkins', action: 'Generated Monthly Audit Report', time: '42 mins ago', status: 'Completed' },
    { id: 4, user: 'Marcus Vance', action: 'Renewed Annual Subscription', time: '1 hr ago', amount: '+$1,200.00' }
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '28px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span className="badge badge-primary">Analytics V2</span>
            <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Live Telemetry</span>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fff', fontFamily: 'var(--font-display)' }}>
            System Telemetry & Performance
          </h1>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.8)',
            border: '1px solid var(--border-color)',
            borderRadius: '10px',
            padding: '4px',
            display: 'flex',
            gap: '4px'
          }}>
            {(['7d', '30d', '90d'] as const).map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                style={{
                  background: timeRange === range ? 'var(--primary)' : 'transparent',
                  color: timeRange === range ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '6px 12px',
                  fontWeight: 600,
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  transition: 'var(--transition-fast)'
                }}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>

          <Tooltip.Root>
            <Tooltip.Trigger style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid var(--border-color)',
              color: '#fff',
              padding: '8px 14px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}>
              <Download size={15} /> Export PDF
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Positioner sideOffset={8}>
                <Tooltip.Popup className="base-Tooltip-popup">
                  Download metrics summary as encrypted PDF report
                </Tooltip.Popup>
              </Tooltip.Positioner>
            </Tooltip.Portal>
          </Tooltip.Root>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '20px',
        marginBottom: '28px'
      }}>
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx} 
              className="glass-panel" 
              style={{
                padding: '20px',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: '80px',
                height: '80px',
                background: `radial-gradient(circle at 100% 0%, ${stat.color}25 0%, transparent 70%)`
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: 500 }}>
                  {stat.title}
                </span>
                <div style={{
                  background: `${stat.color}20`,
                  color: stat.color,
                  padding: '8px',
                  borderRadius: '10px'
                }}>
                  <Icon size={18} />
                </div>
              </div>

              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fff', marginBottom: '8px', fontFamily: 'var(--font-display)' }}>
                {stat.value}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem' }}>
                <span style={{
                  color: stat.isPositive ? 'var(--success)' : '#ef4444',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  {stat.isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                  {stat.change}
                </span>
                <span style={{ color: 'var(--text-dim)' }}>vs previous period</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Chart & Telemetry Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' }}>
        
        {/* Visual Simulated Chart Panel */}
        <div className="glass-panel" style={{ padding: '24px', gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>Real-Time Throughput</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Requests per second across global edge nodes</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 10px var(--success)' }} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600 }}>Live Feed</span>
            </div>
          </div>

          {/* SVG Visual Chart */}
          <div style={{ height: '220px', width: '100%', position: 'relative' }}>
            <svg width="100%" height="100%" viewBox="0 0 600 200" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="50" x2="600" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="0" y1="100" x2="600" y2="100" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <line x1="0" y1="150" x2="600" y2="150" stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />

              {/* Area fill */}
              <path
                d="M 0 160 Q 100 80, 200 130 T 400 60 T 600 90 L 600 200 L 0 200 Z"
                fill="url(#chartGradient)"
              />

              {/* Line */}
              <path
                d="M 0 160 Q 100 80, 200 130 T 400 60 T 600 90"
                fill="none"
                stroke="var(--primary)"
                strokeWidth="3"
              />

              {/* Glowing Pulse Dot */}
              <circle cx="400" cy="60" r="6" fill="#fff" stroke="var(--primary)" strokeWidth="3" />
            </svg>
          </div>
        </div>

        {/* Activity Stream */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h3 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px' }}>
            System Audit Stream
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {recentEvents.map(event => (
              <div 
                key={event.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)'
                }}
              >
                <div>
                  <div style={{ color: '#fff', fontSize: '0.875rem', fontWeight: 600 }}>{event.user}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{event.action}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  {event.amount && (
                    <div style={{ color: 'var(--success)', fontWeight: 700, fontSize: '0.85rem' }}>
                      {event.amount}
                    </div>
                  )}
                  <div style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>{event.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};
