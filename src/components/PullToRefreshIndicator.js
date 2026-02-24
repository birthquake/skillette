import React from 'react';
import { RefreshCw } from 'lucide-react';

function PullToRefreshIndicator({ pullDistance, isRefreshing, threshold = 72 }) {
  const progress = Math.min(pullDistance / threshold, 1);
  const visible = pullDistance > 4 || isRefreshing;

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '64px', // below nav bar
      left: '50%',
      transform: `translateX(-50%) translateY(${isRefreshing ? 0 : pullDistance * 0.6}px)`,
      zIndex: 200,
      transition: isRefreshing ? 'transform 0.2s ease' : 'none',
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '50%',
        background: '#1a1d27', border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: Math.max(progress, isRefreshing ? 1 : 0),
        transition: 'opacity 0.15s ease'
      }}>
        <RefreshCw
          size={16}
          style={{
            color: '#7c6af7',
            transform: `rotate(${isRefreshing ? 0 : progress * 180}deg)`,
            animation: isRefreshing ? 'spin 0.7s linear infinite' : 'none',
            transition: isRefreshing ? 'none' : 'transform 0.1s ease'
          }}
        />
      </div>
    </div>
  );
}

export default PullToRefreshIndicator;
