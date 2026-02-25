import React, { useState, useEffect } from 'react';
import { ArrowLeft, CheckCircle, XCircle, Clock, Zap } from 'lucide-react';
import { getUserChallenges, trackEvent } from '../firebase';
import { SkillCardSkeleton } from './Skeleton';
import { useAuth } from '../contexts/AuthContext';

const STATUS_CONFIG = {
  completed:  { icon: <CheckCircle size={14} />, color: '#4ecdc4', label: 'Completed',  bg: 'rgba(78,205,196,0.1)'  },
  abandoned:  { icon: <XCircle    size={14} />, color: '#f5576c', label: 'Abandoned',  bg: 'rgba(245,87,108,0.1)'  },
  expired:    { icon: <Clock      size={14} />, color: '#f5a623', label: 'Expired',    bg: 'rgba(245,166,35,0.1)'  },
  active:     { icon: <Zap        size={14} />, color: '#7c6af7', label: 'In Progress', bg: 'rgba(124,106,247,0.1)' },
};

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60)   return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return d.toLocaleDateString();
}

function ChallengeHistoryScreen({ onBack }) {
  const { currentUser } = useAuth();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState('all');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getUserChallenges(currentUser.uid);
        setChallenges(data);
        trackEvent('history_viewed');
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [currentUser.uid]);

  const filters = ['all', 'completed', 'active', 'expired', 'abandoned'];

  const filtered = filter === 'all'
    ? challenges
    : challenges.filter(c => c.status === filter);

  // Stats summary
  const stats = {
    completed: challenges.filter(c => c.status === 'completed').length,
    abandoned: challenges.filter(c => c.status === 'abandoned').length,
    active:    challenges.filter(c => c.status === 'active').length,
  };

  return (
    <div className="fade-in" style={{ paddingTop: '20px', paddingBottom: '32px' }}>

      {/* Back */}
      <button
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#8b8fa8', fontSize: '14px', fontWeight: '600', marginBottom: '16px', padding: 0 }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f0f0f5', marginBottom: '16px' }}>
        Challenge History
      </h1>

      {/* Stats row */}
      {!loading && challenges.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '16px' }}>
          {[
            { label: 'Completed', value: stats.completed, color: '#4ecdc4' },
            { label: 'Active',    value: stats.active,    color: '#7c6af7' },
            { label: 'Abandoned', value: stats.abandoned, color: '#f5576c' },
          ].map(s => (
            <div key={s.label} style={{ background: '#1a1d27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '12px', textAlign: 'center' }}>
              <p style={{ fontSize: '22px', fontWeight: '700', color: s.color, marginBottom: '2px' }}>{s.value}</p>
              <p style={{ fontSize: '11px', color: '#555870', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px', marginBottom: '16px' }}>
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 14px', borderRadius: '20px', border: 'none',
              cursor: 'pointer', fontSize: '12px', fontWeight: '700',
              whiteSpace: 'nowrap', flexShrink: 0,
              background: filter === f ? 'linear-gradient(135deg, #7c6af7, #9c59f5)' : '#252838',
              color: filter === f ? 'white' : '#8b8fa8',
              textTransform: 'capitalize'
            }}
          >
            {f === 'all' ? `All (${challenges.length})` : `${f} (${challenges.filter(c => c.status === f).length})`}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <><SkillCardSkeleton /><SkillCardSkeleton /><SkillCardSkeleton /></>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#8b8fa8' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>📭</div>
          <p style={{ fontSize: '16px' }}>
            {challenges.length === 0 ? 'No challenges yet — go spin!' : 'No challenges with this filter'}
          </p>
        </div>
      ) : (
        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {filtered.map(challenge => {
            const status = STATUS_CONFIG[challenge.status] || STATUS_CONFIG.expired;
            const learnSkill  = challenge.skill?.learnSkill;
            const teachSkill  = challenge.skill?.teachSkill;

            return (
              <div key={challenge.id} style={{ background: '#1a1d27', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '14px' }}>
                {/* Status + date */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '3px 10px', borderRadius: '20px', background: status.bg, color: status.color, fontSize: '12px', fontWeight: '700' }}>
                    {status.icon} {status.label}
                  </span>
                  <span style={{ fontSize: '12px', color: '#555870' }}>
                    {formatDate(challenge.createdAt)}
                  </span>
                </div>

                {/* Skills */}
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  {/* Learn side */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#252838', borderRadius: '10px' }}>
                    <span style={{ fontSize: '22px' }}>{learnSkill?.thumbnail || '🎯'}</span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '12px', color: '#4facfe', fontWeight: '700', marginBottom: '2px' }}>Learned</p>
                      <p style={{ fontSize: '13px', color: '#f0f0f5', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {learnSkill?.title || 'Unknown skill'}
                      </p>
                    </div>
                  </div>

                  <span style={{ color: '#555870', fontSize: '16px', flexShrink: 0 }}>⇄</span>

                  {/* Teach side */}
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', background: '#252838', borderRadius: '10px' }}>
                    <span style={{ fontSize: '22px' }}>{teachSkill?.thumbnail || '🎓'}</span>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontSize: '12px', color: '#f5576c', fontWeight: '700', marginBottom: '2px' }}>Taught</p>
                      <p style={{ fontSize: '13px', color: '#f0f0f5', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {teachSkill?.title || 'Unknown skill'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Proof video badge */}
                {challenge.proofVideoUrl && (
                  <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '11px', color: '#4ecdc4', fontWeight: '600' }}>✓ Proof submitted</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ChallengeHistoryScreen;
