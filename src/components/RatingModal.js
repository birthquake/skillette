import React, { useState } from 'react';
import { Star, Send } from 'lucide-react';
import { submitRating, trackEvent } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

function StarPicker({ value, onChange, size = 32 }) {
  const [hovered, setHovered] = useState(null);
  const active = hovered ?? value;

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(null)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '4px',
            transition: 'transform 0.1s ease',
            transform: active >= n ? 'scale(1.15)' : 'scale(1)'
          }}
        >
          <Star
            size={size}
            fill={active >= n ? '#ffd700' : 'none'}
            stroke={active >= n ? '#ffd700' : '#555870'}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  );
}

const RATING_LABELS = {
  1: 'Not helpful',
  2: 'Could be better',
  3: 'Pretty good',
  4: 'Really useful',
  5: 'Absolutely loved it!',
};

function RatingModal({ challenge, matchId, onDone }) {
  const { currentUser } = useAuth();
  const [skillRating, setSkillRating]       = useState(0);
  const [teacherRating, setTeacherRating]   = useState(0);
  const [comment, setComment]               = useState('');
  const [submitting, setSubmitting]         = useState(false);
  const [submitted, setSubmitted]           = useState(false);

  const skill = challenge?.skill?.learnSkill;
  const canSubmit = skillRating > 0;

  const handleSubmit = async () => {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    try {
      await submitRating({
        raterId: currentUser.uid,
        skillId: skill?.id,
        skillTitle: skill?.title,
        teacherId: skill?.userId,
        matchId,
        skillRating,
        teacherRating: teacherRating || null,
        comment: comment.trim() || null,
      });
      trackEvent('rating_submitted', { skillRating, teacherRating });
      setSubmitted(true);
      setTimeout(onDone, 1400);
    } catch (err) {
      console.error('Rating error:', err);
      onDone(); // don't block the user
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      zIndex: 500,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center'
    }}>
      <div
        className="slide-up"
        style={{
          width: '100%', maxWidth: 430,
          background: '#1a1d27',
          borderRadius: '24px 24px 0 0',
          border: '1px solid rgba(255,255,255,0.1)',
          padding: '24px 24px 40px',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.5)'
        }}
      >
        {/* Handle */}
        <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'rgba(255,255,255,0.15)', margin: '0 auto 24px' }} />

        {submitted ? (
          /* Success state */
          <div className="bounce-in" style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: '56px', marginBottom: '16px' }}>🙏</div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#f0f0f5', marginBottom: '8px' }}>Thanks for the feedback!</h3>
            <p style={{ fontSize: '14px', color: '#8b8fa8' }}>It helps everyone find great skills.</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>{skill?.thumbnail}</div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#f0f0f5', marginBottom: '4px' }}>
                How was "{skill?.title}"?
              </h2>
              <p style={{ fontSize: '13px', color: '#8b8fa8' }}>
                Taught by {skill?.author}
              </p>
            </div>

            {/* Skill rating */}
            <div style={{ marginBottom: '24px' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#8b8fa8', textAlign: 'center', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Rate this skill
              </p>
              <StarPicker value={skillRating} onChange={setSkillRating} size={36} />
              {skillRating > 0 && (
                <p className="fade-in-fast" style={{ textAlign: 'center', marginTop: '8px', fontSize: '14px', color: '#a594f9', fontWeight: '600' }}>
                  {RATING_LABELS[skillRating]}
                </p>
              )}
            </div>

            {/* Teacher rating */}
            <div style={{ marginBottom: '20px', padding: '16px', background: '#252838', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.07)' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#8b8fa8', textAlign: 'center', marginBottom: '12px' }}>
                Rate the teacher (optional)
              </p>
              <StarPicker value={teacherRating} onChange={setTeacherRating} size={28} />
            </div>

            {/* Comment */}
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Leave a comment (optional)..."
              maxLength={200}
              rows={2}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: '#252838', color: '#f0f0f5',
                fontSize: '14px', fontFamily: 'inherit',
                resize: 'none', outline: 'none',
                marginBottom: '4px', boxSizing: 'border-box'
              }}
            />
            <p style={{ fontSize: '11px', color: '#555870', textAlign: 'right', marginBottom: '16px' }}>
              {comment.length}/200
            </p>

            {/* Submit */}
            <button
              className="btn btn-primary btn-full"
              onClick={handleSubmit}
              disabled={!canSubmit || submitting}
            >
              <Send size={16} />
              {submitting ? 'Submitting...' : 'Submit Rating'}
            </button>

            <button
              onClick={onDone}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', color: '#555870', fontSize: '13px', marginTop: '12px', padding: '8px' }}
            >
              Skip
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default RatingModal;
