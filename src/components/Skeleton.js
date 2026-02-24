import React from 'react';

// Base shimmer block
export function Skeleton({ width = '100%', height = '16px', borderRadius = '6px', style = {} }) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius, ...style }} />
  );
}

// Skill card skeleton — matches the layout of a skill card row
export function SkillCardSkeleton() {
  return (
    <div className="card" style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div className="skeleton" style={{ width: '50px', height: '50px', borderRadius: '12px', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <Skeleton width="60%" height="16px" borderRadius="6px" style={{ marginBottom: '8px' }} />
          <Skeleton width="40%" height="12px" borderRadius="6px" />
        </div>
      </div>
    </div>
  );
}

// Activity row skeleton
export function ActivityRowSkeleton() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '12px', background: '#252838', borderRadius: '10px',
      marginBottom: '8px'
    }}>
      <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <Skeleton width="55%" height="14px" borderRadius="6px" style={{ marginBottom: '6px' }} />
        <Skeleton width="30%" height="11px" borderRadius="6px" />
      </div>
    </div>
  );
}

// Notification row skeleton
export function NotificationSkeleton() {
  return (
    <div style={{
      background: '#1a1d27', borderRadius: '14px', padding: '16px',
      border: '1px solid rgba(255,255,255,0.07)',
      display: 'flex', alignItems: 'flex-start', gap: '14px',
      marginBottom: '10px'
    }}>
      <div className="skeleton" style={{ width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <Skeleton width="70%" height="15px" borderRadius="6px" style={{ marginBottom: '8px' }} />
        <Skeleton width="90%" height="12px" borderRadius="6px" style={{ marginBottom: '4px' }} />
        <Skeleton width="50%" height="12px" borderRadius="6px" style={{ marginBottom: '8px' }} />
        <Skeleton width="25%" height="11px" borderRadius="6px" />
      </div>
    </div>
  );
}

// Stat card skeleton — for the 3-up stats grid
export function StatsSkeleton() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' }}>
      {[1, 2, 3].map(i => (
        <div key={i} className="card" style={{ padding: '16px', marginBottom: 0, textAlign: 'center' }}>
          <Skeleton width="40px" height="24px" borderRadius="6px" style={{ margin: '0 auto 6px' }} />
          <Skeleton width="60px" height="11px" borderRadius="6px" style={{ margin: '0 auto' }} />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
