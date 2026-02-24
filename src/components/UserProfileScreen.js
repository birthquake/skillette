import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, BookOpen, Users, Award } from 'lucide-react';
import { getUserData, getUserSkills } from '../firebase';
import { SkillCardSkeleton } from './Skeleton';
import ErrorBanner from './ErrorBanner';

function UserProfileScreen({ userId, onBack }) {
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [userData, userSkills] = await Promise.all([
          getUserData(userId),
          getUserSkills(userId)
        ]);
        setProfile(userData);
        setSkills(userSkills);
      } catch (err) {
        console.error('Error loading user profile:', err);
        setError('Could not load this profile.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [userId]);

  const getDifficultyColor = (d) => {
    if (d === 'Easy') return '#4ecdc4';
    if (d === 'Medium') return '#f7b731';
    return '#f5576c';
  };

  if (loading) return (
    <div className="fade-in" style={{ paddingTop: '20px' }}>
      {/* Header skeleton */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div className="skeleton" style={{ width: '80px', height: '80px', borderRadius: '50%', margin: '0 auto 16px' }} />
        <div className="skeleton" style={{ width: '140px', height: '22px', borderRadius: '6px', margin: '0 auto 8px' }} />
        <div className="skeleton" style={{ width: '80px', height: '14px', borderRadius: '6px', margin: '0 auto' }} />
      </div>
      <SkillCardSkeleton />
      <SkillCardSkeleton />
      <SkillCardSkeleton />
    </div>
  );

  if (error) return (
    <div style={{ paddingTop: '20px' }}>
      <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7c6af7', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '16px', fontSize: '15px', fontWeight: '600' }}>
        <ArrowLeft size={18} /> Back
      </button>
      <ErrorBanner message={error} />
    </div>
  );

  if (!profile) return null;

  return (
    <div className="fade-in" style={{ paddingTop: '20px', paddingBottom: '20px' }}>

      {/* Back button */}
      <button
        onClick={onBack}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: '#7c6af7', display: 'flex', alignItems: 'center', gap: '6px',
          marginBottom: '16px', fontSize: '15px', fontWeight: '600', padding: 0
        }}
      >
        <ArrowLeft size={18} /> Back
      </button>

      {/* Profile header */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{
          width: '80px', height: '80px', borderRadius: '50%',
          background: 'linear-gradient(135deg, #7c6af7 0%, #9c59f5 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '36px', margin: '0 auto 16px',
          boxShadow: '0 8px 24px rgba(124,106,247,0.3)'
        }}>
          {profile.avatar || '👤'}
        </div>

        <h2 style={{ fontSize: '22px', fontWeight: '700', color: '#f0f0f5', marginBottom: '4px' }}>
          {profile.name || 'Anonymous'}
        </h2>
        <p style={{ fontSize: '14px', color: '#8b8fa8', marginBottom: '20px' }}>
          Level {profile.level || 1}
        </p>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {[
            { label: 'Taught', value: profile.skillsTaught || 0, icon: <Users size={15} />, color: '#f093fb' },
            { label: 'Learned', value: profile.skillsLearned || 0, icon: <BookOpen size={15} />, color: '#4facfe' },
            { label: 'Streak', value: profile.streak || 0, icon: <Star size={15} />, color: '#ffd700' },
          ].map(s => (
            <div key={s.label} style={{
              background: '#252838', borderRadius: '12px', padding: '12px',
              border: '1px solid rgba(255,255,255,0.07)'
            }}>
              <div style={{ color: s.color, marginBottom: '4px', display: 'flex', justifyContent: 'center' }}>
                {s.icon}
              </div>
              <div style={{ fontSize: '20px', fontWeight: '700', color: '#f0f0f5' }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#8b8fa8', fontWeight: '600' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Their skills */}
      <h3 style={{ fontSize: '18px', fontWeight: '700', color: '#f0f0f5', marginBottom: '12px' }}>
        Skills they teach
      </h3>

      {skills.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <Award size={36} style={{ color: '#555870', marginBottom: '12px' }} />
          <p style={{ fontSize: '15px', color: '#8b8fa8' }}>No skills added yet</p>
        </div>
      ) : (
        <div className="stagger-children">
          {skills.map(skill => (
            <div key={skill.id} className="card card-interactive" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '52px', height: '52px', background: '#252838',
                  borderRadius: '12px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '24px', flexShrink: 0,
                  border: '1px solid rgba(255,255,255,0.07)'
                }}>
                  {skill.thumbnail}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ fontSize: '16px', fontWeight: '600', color: '#f0f0f5', marginBottom: '4px' }}>
                    {skill.title}
                  </h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{
                      fontSize: '12px', fontWeight: '600', padding: '2px 8px',
                      borderRadius: '20px', color: 'white',
                      background: getDifficultyColor(skill.difficulty)
                    }}>
                      {skill.difficulty}
                    </span>
                    <span style={{ fontSize: '12px', color: '#8b8fa8' }}>
                      {skill.duration}
                    </span>
                  </div>
                </div>
              </div>
              {skill.description && (
                <p style={{
                  fontSize: '13px', color: '#8b8fa8', marginTop: '10px',
                  lineHeight: '1.5', overflow: 'hidden',
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical'
                }}>
                  {skill.description}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserProfileScreen;
