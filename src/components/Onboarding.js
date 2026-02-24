import React, { useState } from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';

const slides = [
  {
    emoji: '🎯',
    title: 'Welcome to Skillette',
    body: 'Skillette is a skill swap platform. You teach someone something you know, and in return you learn something new from someone else.',
    cta: 'Sounds good →'
  },
  {
    emoji: '🔄',
    title: 'How it works',
    body: 'Add a skill you can teach. Spin the roulette to get matched with someone else\'s skill. Record a short video proving you learned it. That\'s the whole loop.',
    cta: 'Got it →'
  },
  {
    emoji: '🚀',
    title: 'Ready to start?',
    body: 'Before you can spin, you need to add at least one skill to the pool. It only takes a minute — just describe something you can teach others.',
    cta: 'Add my first skill'
  }
];

function Onboarding({ onComplete }) {
  const [current, setCurrent] = useState(0);

  const slide = slides[current];
  const isLast = current === slides.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrent(prev => prev + 1);
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px 24px'
    }}>

      {/* Progress dots */}
      <div style={{
        display: 'flex', gap: '8px', marginBottom: '48px'
      }}>
        {slides.map((_, i) => (
          <div key={i} style={{
            width: i === current ? '24px' : '8px',
            height: '8px', borderRadius: '4px',
            background: i === current ? 'white' : 'rgba(255,255,255,0.35)',
            transition: 'all 0.3s ease'
          }} />
        ))}
      </div>

      {/* Slide content */}
      <div key={current} style={{ textAlign: 'center', maxWidth: '340px' }}
        className="fade-in"
      >
        <div style={{ fontSize: '80px', marginBottom: '32px', lineHeight: 1 }}>
          {slide.emoji}
        </div>
        <h1 style={{
          fontSize: '28px', fontWeight: '800', color: 'white',
          marginBottom: '16px', lineHeight: '1.2'
        }}>
          {slide.title}
        </h1>
        <p style={{
          fontSize: '17px', color: 'rgba(255,255,255,0.85)',
          lineHeight: '1.65', marginBottom: '48px'
        }}>
          {slide.body}
        </p>
      </div>

      {/* CTA button */}
      <button
        onClick={handleNext}
        style={{
          background: 'white',
          color: '#667eea',
          border: 'none',
          borderRadius: '16px',
          padding: '16px 36px',
          fontSize: '17px',
          fontWeight: '700',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
        }}
      >
        {isLast ? <CheckCircle size={20} /> : <ArrowRight size={20} />}
        {slide.cta}
      </button>

      {/* Skip */}
      {!isLast && (
        <button
          onClick={onComplete}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'rgba(255,255,255,0.55)', fontSize: '14px',
            marginTop: '20px', textDecoration: 'underline'
          }}
        >
          Skip
        </button>
      )}
    </div>
  );
}

export default Onboarding;
