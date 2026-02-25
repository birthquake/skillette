import React, { useState, useEffect } from 'react';
import { X, Zap, User } from 'lucide-react';
import { getSkillById, trackEvent } from '../firebase';
import { Skeleton } from './Skeleton';

function SkillDeepLink({ skillId, onDismiss, onSpin }) {
  const [skill, setSkill] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!skillId) return;
    const load = async () => {
      const data = await getSkillById(skillId);
      if (data) {
        setSkill(data);
        trackEvent('deep_link_opened', { skillId });
      } else {
        setNotFound(true);
      }
      setLoading(false);
    };
    load();
  }, [skillId]);

  // Clear the ?skill= param from URL without a page reload
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('skill');
    window.history.replaceState({}, '', url.toString());
  }, []);

  const getDifficultyColor = (d) =>
    ({ Easy: '#4ecdc4', Medium: '#f5a623', Hard: '#ff6b6b' }[d] || '#4ecdc4');

  return (
    // Backdrop
    <div
      onClick={onDismiss}
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,0.7)',
        zIndex: 500,
        display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
      }}
    >
      {/* Sheet */}
      <div
        onClick={e => e.stopPropagation()}
        className="slide-up"
        style={{
          width: '100%', maxWidth: 430,
          background: '#1a1d27',
          borderRadius: '24px 24px 0 0',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '20px 20px 36px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)'
        }}
      >
        {/* Handle + close */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)', margin: '0 auto' }} />
          <button
            onClick={onDismiss}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8b8fa8', padding: 4 }}
          >
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div>
            <Skeleton width="40%" height="14px" style={{ marginBottom: '16px' }} />
            <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
              <Skeleton width="64px" height="64px" borderRadius="14px" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <Skeleton width="70%" height="18px" style={{ marginBottom: '8px' }} />
                <Skeleton width="45%" height="13px" />
              </div>
            </div>
            <Skeleton width="100%" height="44px" borderRadius="12px" />
          </div>
        ) : notFound ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤔</div>
            <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f0f0f5', marginBottom: '8px' }}>Skill not found</h3>
            <p style={{ fontSize: '14px', color: '#8b8fa8', marginBottom: '20px' }}>This skill may have been removed.</p>
            <button className="btn btn-outline btn-full" onClick={onDismiss}>Close</button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '12px', fontWeight: '700', color: '#7c6af7', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '14px' }}>
              Shared with you
            </p>

            {/* Skill card */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', background: '#252838', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.07)', marginBottom: '16px' }}>
              <div style={{ width: '64px', height: '64px', background: '#1a1d27', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '30px', flexShrink: 0 }}>
                {skill.thumbnail}
              </div>
              <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#f0f0f5', marginBottom: '4px' }}>
                  {skill.title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                  <User size={12} style={{ color: '#8b8fa8' }} />
                  <span style={{ fontSize: '13px', color: '#8b8fa8' }}>{skill.author}</span>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <span style={{ background: getDifficultyColor(skill.difficulty), color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>
                    {skill.difficulty}
                  </span>
                  <span style={{ background: 'rgba(255,255,255,0.07)', color: '#8b8fa8', padding: '2px 8px', borderRadius: '6px', fontSize: '12px' }}>
                    {skill.duration}
                  </span>
                </div>
              </div>
            </div>

            {skill.description && (
              <p style={{ fontSize: '14px', color: '#8b8fa8', lineHeight: '1.6', marginBottom: '20px' }}>
                {skill.description}
              </p>
            )}

            {/* CTA */}
            <button
              className="btn btn-primary btn-full"
              onClick={() => { onSpin(); onDismiss(); }}
              style={{ marginBottom: '10px' }}
            >
              <Zap size={18} /> Spin to Learn This
            </button>
            <button className="btn btn-outline btn-full" onClick={onDismiss}>
              Maybe Later
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default SkillDeepLink;
