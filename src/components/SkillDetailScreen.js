import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, Play, User, Clock, Zap, MessageSquare, Share2 } from 'lucide-react';
import { getSkillById, getSkillRatings, trackEvent } from '../firebase';
import { Skeleton } from './Skeleton';

const getDifficultyColor = (d) =>
  ({ Easy: '#4ecdc4', Medium: '#f5a623', Hard: '#ff6b6b' }[d] || '#8b8fa8');

function StarDisplay({ rating, count, size = 14 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
      {[1,2,3,4,5].map(n => (
        <Star
          key={n}
          size={size}
          fill={rating >= n ? '#ffd700' : rating >= n - 0.5 ? 'url(#half)' : 'none'}
          stroke={rating >= n - 0.5 ? '#ffd700' : '#555870'}
          strokeWidth={1.5}
        />
      ))}
      {count > 0 && (
        <span style={{ fontSize: size, color: '#8b8fa8', marginLeft: '4px' }}>
          {rating.toFixed(1)} ({count})
        </span>
      )}
    </div>
  );
}

function SkillDetailScreen({ skillId, onBack, onViewProfile, onSpin }) {
  const [skill, setSkill]     = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videoOpen, setVideoOpen] = useState(false);

  useEffect(() => {
    if (!skillId) return;
    const load = async () => {
      setLoading(true);
      try {
        const [skillData, reviewData] = await Promise.all([
          getSkillById(skillId),
          getSkillRatings(skillId, 5),
        ]);
        setSkill(skillData);
        setReviews(reviewData);
        trackEvent('skill_detail_viewed', { skillId });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [skillId]);

  const handleShare = () => {
    const url = `${window.location.origin}?skill=${skillId}`;
    if (navigator.share) {
      navigator.share({ title: skill?.title, text: `Check out "${skill?.title}" on Skillette!`, url });
    } else {
      navigator.clipboard?.writeText(url);
    }
    trackEvent('skill_shared', { skillId });
  };

  return (
    <div className="fade-in" style={{ paddingTop: '20px', paddingBottom: '32px' }}>

      {/* Back button */}
      <button
        onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: '#8b8fa8', fontSize: '14px', fontWeight: '600', marginBottom: '16px', padding: 0 }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      {loading ? (
        <>
          <Skeleton width="100%" height="180px" borderRadius="16px" style={{ marginBottom: '16px' }} />
          <Skeleton width="60%" height="24px" style={{ marginBottom: '8px' }} />
          <Skeleton width="40%" height="16px" style={{ marginBottom: '16px' }} />
          <Skeleton width="100%" height="80px" borderRadius="12px" />
        </>
      ) : !skill ? (
        <div style={{ textAlign: 'center', padding: '48px 0', color: '#8b8fa8' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤔</div>
          <p>Skill not found.</p>
        </div>
      ) : (
        <>
          {/* Hero */}
          <div className="card" style={{ textAlign: 'center', marginBottom: '12px', padding: '28px 20px' }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>{skill.thumbnail}</div>
            <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#f0f0f5', marginBottom: '8px' }}>
              {skill.title}
            </h1>

            {/* Rating */}
            {skill.rating > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <StarDisplay rating={skill.rating} count={skill.ratingCount} size={16} />
              </div>
            )}

            {/* Badges */}
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '16px' }}>
              <span style={{ background: getDifficultyColor(skill.difficulty), color: 'white', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '700' }}>
                {skill.difficulty}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.07)', color: '#8b8fa8', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={11} /> {skill.duration}
              </span>
              <span style={{ background: 'rgba(255,255,255,0.07)', color: '#8b8fa8', padding: '4px 12px', borderRadius: '20px', fontSize: '12px' }}>
                {skill.category}
              </span>
            </div>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                className="btn btn-primary"
                onClick={onSpin}
                style={{ flex: 2 }}
              >
                <Zap size={16} /> Learn This
              </button>
              <button
                onClick={handleShare}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', background: 'rgba(124,106,247,0.12)', border: '1px solid rgba(124,106,247,0.25)', borderRadius: '12px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#a594f9' }}
              >
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>

          {/* Teacher */}
          <div
            className="card card-interactive"
            onClick={() => skill.userId && onViewProfile && onViewProfile(skill.userId)}
            style={{ marginBottom: '12px', cursor: skill.userId ? 'pointer' : 'default' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c6af7, #9c59f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>
                {skill.authorAvatar || '👤'}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: '15px', fontWeight: '600', color: '#f0f0f5', marginBottom: '2px' }}>
                  {skill.author}
                </p>
                <p style={{ fontSize: '12px', color: '#8b8fa8' }}>Tap to view profile</p>
              </div>
              <User size={16} style={{ color: '#555870' }} />
            </div>
          </div>

          {/* Description */}
          {skill.description && (
            <div className="card" style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#555870', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>About</h3>
              <p style={{ fontSize: '15px', color: '#c8c8d4', lineHeight: '1.6' }}>
                {skill.description}
              </p>
            </div>
          )}

          {/* Tips */}
          {skill.tips && (
            <div className="card" style={{ marginBottom: '12px', background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.2)' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#a594f9', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '10px' }}>💡 Pro Tips</h3>
              <p style={{ fontSize: '15px', color: '#c8c8d4', lineHeight: '1.6' }}>
                {skill.tips}
              </p>
            </div>
          )}

          {/* Tutorial video */}
          {skill.tutorialVideoUrl && (
            <div className="card" style={{ marginBottom: '12px' }}>
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#555870', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '12px' }}>Tutorial Video</h3>
              {videoOpen ? (
                <video
                  src={skill.tutorialVideoUrl}
                  controls
                  autoPlay
                  style={{ width: '100%', borderRadius: '12px', background: '#0f1117', maxHeight: '300px' }}
                />
              ) : (
                <button
                  onClick={() => setVideoOpen(true)}
                  style={{
                    width: '100%', height: '140px', borderRadius: '12px',
                    background: 'linear-gradient(135deg, #1a1d27, #252838)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px'
                  }}
                >
                  <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c6af7, #9c59f5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Play size={20} color="white" fill="white" style={{ marginLeft: '3px' }} />
                  </div>
                  <span style={{ fontSize: '13px', color: '#8b8fa8', fontWeight: '600' }}>Play Tutorial</span>
                </button>
              )}
            </div>
          )}

          {/* Reviews */}
          {reviews.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#555870', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '14px' }}>
                <MessageSquare size={13} style={{ display: 'inline', marginRight: '6px' }} />
                Reviews ({reviews.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {reviews.map(review => (
                  <div key={review.id} style={{ padding: '12px', background: '#252838', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <StarDisplay rating={review.skillRating} count={0} size={12} />
                      <span style={{ fontSize: '11px', color: '#555870', marginLeft: 'auto' }}>
                        {review.createdAt?.toDate
                          ? review.createdAt.toDate().toLocaleDateString()
                          : 'Recently'}
                      </span>
                    </div>
                    {review.comment && (
                      <p style={{ fontSize: '13px', color: '#c8c8d4', lineHeight: '1.5' }}>
                        "{review.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default SkillDetailScreen;
