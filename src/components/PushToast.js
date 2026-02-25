import React from 'react';
import { Bell } from 'lucide-react';

function PushToast({ toast }) {
  if (!toast) return null;

  return (
    <div
      className="slide-up"
      style={{
        position: 'fixed',
        top: '16px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 600,
        width: 'calc(100% - 32px)',
        maxWidth: 390,
        background: '#252838',
        border: '1px solid rgba(124,106,247,0.3)',
        borderRadius: '14px',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        pointerEvents: 'none'
      }}
    >
      <div style={{
        width: '34px', height: '34px', borderRadius: '10px', flexShrink: 0,
        background: 'linear-gradient(135deg, #7c6af7, #9c59f5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Bell size={16} color="white" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '14px', fontWeight: '700', color: '#f0f0f5', marginBottom: '2px' }}>
          {toast.title}
        </p>
        {toast.body && (
          <p style={{ fontSize: '13px', color: '#8b8fa8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {toast.body}
          </p>
        )}
      </div>
    </div>
  );
}

export default PushToast;
