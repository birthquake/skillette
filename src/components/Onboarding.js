import React, { useState } from 'react';
import { ArrowRight, X } from 'lucide-react';

const slides = [
  {
    emoji: '🎯',
    title: 'Welcome to Skillette',
    body: 'A two-way skill swap. You teach someone something you know — they teach you something you want to learn.',
    cta: 'How does it work?',
    accent: '#7c6af7'
  },
  {
    emoji: '🎰',
    title: 'Spin to get matched',
    body: 'Hit spin and you\'ll be matched with a random skill from the pool. Accept the challenge and you have 24 hours to learn it.',
    cta: 'What do I need to do?',
    accent: '#f093fb'
  },
  {
    emoji: '🎥',
    title: 'Prove you learned it',
    body: 'Record a short video showing off your new skill. Your partner does the same. Both complete — both level up.',
    cta: 'Sounds good!',
    accent: '#4facfe'
  },
  {
    emoji: '🚀',
    title: 'Add your first skill',
    body: 'You need at least one skill in the pool before you can spin. It takes less than a minute — just describe something you can teach.',
    cta: 'Add my first skill →',
    accent: '#4ecdc4',
    isFinal: true
  }
];

function Onboarding({ onComplete }) {
  const [current, setCurrent] = useState(0);
  const [touchStart, setTouchStart] = useState(null);

  const slide = slides[current];
  const isLast = current === slides.length - 1;

  const next = () => {
    if (isLast) onComplete();
    else setCurrent(c => c + 1);
  };

  const handleTouchStart = (e) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (diff > 50 && !isLast) setCurrent(c => c + 1);
    if (diff < -50 && current > 0) setCurrent(c => c - 1);
    setTouchStart(null);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: '#0f1117',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 24px'
      }}
    >
      {/* Skip button */}
      {!isLast && (
        <button
          onClick={onComplete}
          style={{
            position: 'absolute', top: '20px', right: '20px',
            background: 'rgba(255,255,255,0.08)', border: 'none',
            borderRadius: '50%', width: '36px', height: '36px',
            cursor: 'pointer', color: '#8b8fa8',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <X size={16} />
        </button>
      )}

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '48px' }}>
        {slides.map((_, i) => (
          <div
            key={i}
            onClick={() => setCurrent(i)}
            style={{
              width: i === current ? '28px' : '8px',
              height: '8px', borderRadius: '4px',
              background: i === current ? slide.accent : 'rgba(255,255,255,0.15)',
              transition: 'all 0.3s ease', cursor: 'pointer'
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="fade-in" key={current} style={{ textAlign: 'center', maxWidth: '340px' }}>
        {/* Emoji with glow */}
        <div style={{
          fontSize: '80px', marginBottom: '32px', lineHeight: 1,
          filter: `drop-shadow(0 0 24px ${slide.accent}60)`
        }}>
          {slide.emoji}
        </div>

        <h1 style={{
          fontSize: '26px', fontWeight: '800', marginBottom: '16px',
          color: '#f0f0f5', lineHeight: 1.2
        }}>
          {slide.title}
        </h1>

        <p style={{
          fontSize: '16px', color: '#8b8fa8', lineHeight: '1.7',
          marginBottom: '48px'
        }}>
          {slide.body}
        </p>

        <button
          onClick={next}
          style={{
            width: '100%', padding: '16px 24px',
            background: `linear-gradient(135deg, ${slide.accent}, ${slide.accent}bb)`,
            border: 'none', borderRadius: '16px',
            color: 'white', fontSize: '17px', fontWeight: '700',
            cursor: 'pointer',
            boxShadow: `0 8px 24px ${slide.accent}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          {slide.cta}
          {!isLast && <ArrowRight size={18} />}
        </button>

        {/* Swipe hint on first slide */}
        {current === 0 && (
          <p style={{ fontSize: '12px', color: '#555870', marginTop: '16px' }}>
            Swipe to navigate
          </p>
        )}
      </div>
    </div>
  );
}

export default Onboarding;
