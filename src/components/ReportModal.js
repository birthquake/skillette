import React, { useState } from 'react';
import { Flag, X, CheckCircle, Loader } from 'lucide-react';
import { createReport } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const REASONS = [
  'Inappropriate content',
  'Spam or misleading',
  'Offensive or hateful',
  'Fake or scam',
  'Other',
];

function ReportModal({ type, targetId, targetTitle, onClose }) {
  const { currentUser } = useAuth();
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!reason) return;
    setSubmitting(true);
    await createReport({
      reportedBy: currentUser.uid,
      type,           // 'skill' or 'user'
      targetId,       // skill ID or user ID
      targetTitle,    // skill title or username for context
      reason,
      details: details.trim(),
    });
    setSubmitting(false);
    setSubmitted(true);
    setTimeout(onClose, 2000);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      padding: '0'
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: 'white', borderRadius: '24px 24px 0 0',
        padding: '28px 24px 40px', width: '100%', maxWidth: '480px',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.2)'
      }}>

        {/* Handle bar */}
        <div style={{
          width: '40px', height: '4px', borderRadius: '2px',
          background: '#e2e8f0', margin: '0 auto 24px'
        }} />

        {submitted ? (
          <div style={{ textAlign: 'center', paddingBottom: '16px' }}>
            <CheckCircle size={48} style={{ color: '#4ecdc4', marginBottom: '16px' }} />
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
              Report Submitted
            </h3>
            <p style={{ fontSize: '15px', color: '#666' }}>
              Thanks for keeping Skillette safe. We'll review this shortly.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Flag size={20} style={{ color: '#f5576c' }} />
                <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#1a1a1a' }}>
                  Report {type === 'skill' ? 'Skill' : 'User'}
                </h3>
              </div>
              <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#999' }}>
                <X size={22} />
              </button>
            </div>

            {targetTitle && (
              <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
                Reporting: <strong>"{targetTitle}"</strong>
              </p>
            )}

            {/* Reason selector */}
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a', marginBottom: '10px' }}>
              Why are you reporting this?
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
              {REASONS.map(r => (
                <button
                  key={r}
                  onClick={() => setReason(r)}
                  style={{
                    padding: '12px 16px', borderRadius: '10px', textAlign: 'left',
                    fontSize: '15px', cursor: 'pointer', fontWeight: reason === r ? '600' : '400',
                    background: reason === r ? 'linear-gradient(135deg, #667eea10, #764ba220)' : '#f8fafc',
                    border: reason === r ? '2px solid #667eea' : '2px solid transparent',
                    color: reason === r ? '#667eea' : '#333',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {r}
                </button>
              ))}
            </div>

            {/* Optional details */}
            <textarea
              placeholder="Additional details (optional)"
              value={details}
              onChange={e => setDetails(e.target.value)}
              maxLength={300}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: '1px solid #e2e8f0', fontSize: '14px',
                resize: 'none', height: '80px', marginBottom: '20px',
                fontFamily: 'inherit', color: '#333', boxSizing: 'border-box'
              }}
            />

            <button
              className="btn btn-primary btn-full"
              onClick={handleSubmit}
              disabled={!reason || submitting}
              style={{ opacity: !reason || submitting ? 0.6 : 1 }}
            >
              {submitting ? (
                <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</>
              ) : (
                <><Flag size={16} /> Submit Report</>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default ReportModal;
