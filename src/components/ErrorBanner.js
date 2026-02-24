import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

function ErrorBanner({ message, onRetry }) {
  return (
    <div style={{
      background: '#fff5f5',
      border: '1px solid #ff6b6b',
      borderRadius: '12px',
      padding: '14px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      margin: '0 0 16px'
    }}>
      <AlertCircle size={18} style={{ color: '#ff6b6b', flexShrink: 0 }} />
      <p style={{ fontSize: '14px', color: '#cc0000', flex: 1, margin: 0 }}>
        {message || 'Something went wrong. Please try again.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            background: 'none', border: '1px solid #ff6b6b',
            borderRadius: '8px', padding: '6px 12px',
            color: '#ff6b6b', fontSize: '13px', fontWeight: '600',
            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px',
            flexShrink: 0
          }}
        >
          <RefreshCw size={13} />
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorBanner;
