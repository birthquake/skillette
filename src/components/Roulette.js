import React, { useState, useEffect, useMemo } from 'react';
import { 
  RotateCcw, Zap, ArrowRight, RefreshCw, Flag, Share2
} from 'lucide-react';
import { getRandomSkills, getUserSkills, createMatch, createChallenge, createNotification, trackEvent } from '../firebase';
import ReportModal from './ReportModal';
import ErrorBanner from './ErrorBanner';
import { SkillCardSkeleton } from './Skeleton';
import { useAuth } from '../contexts/AuthContext';

// ─── SVG Roulette Wheel ────────────────────────────────────────────────────
function RouletteWheel({ segments, rotation, isSpinning, centerEmoji, centerLabel }) {
  const size = 220;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const innerR = r * 0.42;
  const total = segments.length;

  const paths = segments.map((seg, i) => {
    const startAngle = (i / total) * 2 * Math.PI - Math.PI / 2;
    const endAngle = ((i + 1) / total) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = total === 1 ? 1 : 0;
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const midAngle = startAngle + (endAngle - startAngle) / 2;
    const emojiR = (r + innerR) / 2;
    const ex = cx + emojiR * Math.cos(midAngle);
    const ey = cy + emojiR * Math.sin(midAngle);
    return { d, color: seg.color, emoji: seg.emoji, ex, ey };
  });

  const fontSize = total <= 4 ? '22' : total <= 6 ? '18' : '14';

  return (
    <div style={{ position: 'relative', width: size, height: size + 14 }}>
      {/* Pointer */}
      <div style={{
        position: 'absolute', top: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft: '10px solid transparent',
        borderRight: '10px solid transparent',
        borderTop: '16px solid #7c6af7',
        zIndex: 10,
        filter: 'drop-shadow(0 2px 6px rgba(124,106,247,0.7))'
      }} />

      <svg
        width={size} height={size}
        style={{
          marginTop: 14,
          transform: `rotate(${rotation}deg)`,
          transition: isSpinning ? 'transform 2.2s cubic-bezier(0.17, 0.67, 0.12, 1)' : 'none',
          borderRadius: '50%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 3px rgba(124,106,247,0.25)',
          display: 'block'
        }}
      >
        {paths.map((p, i) => (
          <g key={i}>
            <path d={p.d} fill={p.color} stroke="#0f1117" strokeWidth="2" />
            <text
              x={p.ex} y={p.ey}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={fontSize}
              style={{ userSelect: 'none', pointerEvents: 'none' }}
            >
              {p.emoji}
            </text>
          </g>
        ))}
        <circle cx={cx} cy={cy} r={innerR} fill="#1a1d27" stroke="#0f1117" strokeWidth="3" />
      </svg>

      {/* Center label — doesn't rotate */}
      <div style={{
        position: 'absolute',
        top: size / 2 + 14, left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center', pointerEvents: 'none'
      }}>
        <div style={{
          fontSize: 26, lineHeight: 1, marginBottom: 2,
          animation: isSpinning ? 'spin 0.8s linear infinite' : 'none'
        }}>
          {centerEmoji}
        </div>
        <div style={{
          fontSize: '9px', fontWeight: '700',
          color: '#555870', letterSpacing: '0.8px', textTransform: 'uppercase'
        }}>
          {centerLabel}
        </div>
      </div>
    </div>
  );
}

// ─── Categories ────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'Life Hacks', color: '#ff6b6b', emoji: '💡' },
  { name: 'Crafts',     color: '#4ecdc4', emoji: '🎨' },
  { name: 'Cooking',    color: '#45b7d1', emoji: '👨‍🍳' },
  { name: 'Magic',      color: '#96ceb4', emoji: '🎩' },
  { name: 'Music',      color: '#a78bfa', emoji: '🎵' },
  { name: 'Sports',     color: '#f093fb', emoji: '⚽' },
];

// ─── Share helper ──────────────────────────────────────────────────────────
function shareSkill(skill) {
  const url = `${window.location.origin}?skill=${skill.id}`;
  const text = `Check out "${skill.title}" on Skillette! ${skill.thumbnail}`;
  if (navigator.share) {
    navigator.share({ title: 'Skillette', text, url }).catch(() => {});
  } else if (navigator.clipboard) {
    navigator.clipboard.writeText(url);
  }
  trackEvent('skill_shared', { skillId: skill.id });
}

// ─── Screen ────────────────────────────────────────────────────────────────
function RouletteScreen({ onStartChallenge, onNavigate }) {
  const { currentUser } = useAuth();

  const [isSpinning, setIsSpinning]       = useState(false);
  const [matchedSkill, setMatchedSkill]   = useState(null);
  const [yourSkill, setYourSkill]         = useState(null);
  const [spinStage, setSpinStage]         = useState('ready');
  const [wheelRotation, setWheelRotation] = useState(0);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [userSkills, setUserSkills]           = useState([]);
  const [loadingSkills, setLoadingSkills]     = useState(true);
  const [loadError, setLoadError]             = useState('');
  const [showReport, setShowReport]           = useState(false);
  const [retryCount, setRetryCount]           = useState(0);

  const wheelSegments = useMemo(() => {
    if (availableSkills.length === 0) return CATEGORIES;
    const counts = {};
    availableSkills.forEach(s => { if (s.category) counts[s.category] = (counts[s.category] || 0) + 1; });
    const present = CATEGORIES.filter(c => counts[c.name]);
    return present.length >= 2 ? present : CATEGORIES;
  }, [availableSkills]);

  useEffect(() => {
    const load = async () => {
      setLoadingSkills(true);
      setLoadError('');
      try {
        const [otherSkills, mySkills] = await Promise.all([
          getRandomSkills(currentUser.uid, 20),
          getUserSkills(currentUser.uid),
        ]);
        setAvailableSkills(otherSkills);
        setUserSkills(mySkills);
      } catch (err) {
        console.error(err);
        setLoadError('Could not load skills. Please try again.');
      } finally {
        setLoadingSkills(false);
      }
    };
    load();
  }, [currentUser.uid, retryCount]);

  const handleSpin = () => {
    if (isSpinning) return;
    if (availableSkills.length === 0) { setLoadError('No skills in the pool yet — check back soon!'); return; }
    if (userSkills.length === 0)      { setLoadError('Add a skill first so you have something to offer.'); return; }
    setLoadError('');
    setIsSpinning(true);
    setSpinStage('spinning');
    trackEvent('roulette_spin');
    setWheelRotation(prev => prev + 1440 + Math.random() * 360);
    setTimeout(() => {
      const picked = availableSkills[Math.floor(Math.random() * availableSkills.length)];
      const mine   = userSkills[Math.floor(Math.random() * userSkills.length)];
      setMatchedSkill(picked);
      setYourSkill(mine);
      setSpinStage('matched');
      setIsSpinning(false);
    }, 2300);
  };

  const confirmMatch = async () => {
    setSpinStage('confirmed');
    trackEvent('challenge_started', { skillTitle: matchedSkill?.title });
    try {
      const result = await createChallenge({
        userId: currentUser.uid,
        skill: { learnSkill: matchedSkill, teachSkill: yourSkill },
        timeLimit: 24 * 60 * 60 * 1000
      });
      if (result.success && matchedSkill?.userId) {
        await createMatch({
          challengeId: result.id,
          learnerId: currentUser.uid,
          learnerSkillId: yourSkill?.id || null,
          learnerSkill: yourSkill,
          teacherId: matchedSkill.userId,
          teacherSkillId: matchedSkill?.id || null,
          teacherSkill: matchedSkill,
        });
        await createNotification(matchedSkill.userId, {
          type: 'new_learner',
          title: 'Someone is learning your skill! 🎉',
          body: `${currentUser.displayName || 'Someone'} is learning "${matchedSkill.title}" from you.`,
          learnerName: currentUser.displayName || 'Anonymous',
          learnerId: currentUser.uid,
          skillTitle: matchedSkill.title,
          skillThumbnail: matchedSkill.thumbnail || '🎯',
        });
      }
      setTimeout(() => onStartChallenge({ learnSkill: matchedSkill, teachSkill: yourSkill }, result.id), 1000);
    } catch (err) {
      console.error(err);
      setTimeout(() => onStartChallenge({ learnSkill: matchedSkill, teachSkill: yourSkill }, null), 1000);
    }
  };

  const spinAgain = () => { setSpinStage('ready'); setMatchedSkill(null); setYourSkill(null); };
  const dc = (d) => ({ Easy: '#4ecdc4', Medium: '#f5a623', Hard: '#ff6b6b' }[d] || '#4ecdc4');

  // Loading
  if (loadingSkills) return (
    <div className="fade-in" style={{ paddingTop: '20px' }}>
      <SkillCardSkeleton /><SkillCardSkeleton /><SkillCardSkeleton />
    </div>
  );

  // No skills gate
  if (spinStage === 'ready' && userSkills.length === 0) return (
    <div className="fade-in" style={{ paddingTop: '60px', paddingBottom: '20px', textAlign: 'center' }}>
      <div style={{ fontSize: '72px', marginBottom: '24px' }}>🎯</div>
      <h1 style={{ fontSize: '26px', fontWeight: '700', color: 'white', marginBottom: '12px' }}>Add a Skill First</h1>
      <p style={{ fontSize: '16px', color: '#8b8fa8', marginBottom: '36px', lineHeight: '1.6' }}>
        Skillette is a two-way exchange. Add something you can teach before you spin.
      </p>
      <button className="btn btn-primary" onClick={() => onNavigate('addSkill')} style={{ fontSize: '16px', padding: '14px 32px' }}>
        <ArrowRight size={18} /> Add Your First Skill
      </button>
    </div>
  );

  // Ready
  if (spinStage === 'ready') return (
    <div className="fade-in" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
      <div className="card" style={{ textAlign: 'center', marginBottom: '8px' }}>
        <h1 style={{
          fontSize: '28px', fontWeight: '700', marginBottom: '8px',
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          Skill Roulette
        </h1>
        <p style={{ fontSize: '13px', color: '#555870' }}>
          {availableSkills.length} skill{availableSkills.length !== 1 ? 's' : ''} in the pool
        </p>
      </div>

      {loadError && <ErrorBanner message={loadError} onRetry={() => setRetryCount(c => c + 1)} />}

      <div className="roulette-container">
        <RouletteWheel
          segments={wheelSegments}
          rotation={wheelRotation}
          isSpinning={isSpinning}
          centerEmoji={isSpinning ? '🔀' : '🎯'}
          centerLabel={isSpinning ? 'Matching' : 'Ready'}
        />
        <button
          className="btn btn-primary btn-large"
          onClick={handleSpin}
          disabled={isSpinning || availableSkills.length === 0}
          style={{ marginTop: '24px' }}
        >
          {isSpinning
            ? <><RefreshCw size={20} style={{ animation: 'spin 0.7s linear infinite' }} /> Finding Match...</>
            : <><RotateCcw size={20} /> Spin to Match!</>
          }
        </button>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '12px', fontWeight: '700', marginBottom: '12px', color: '#555870', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>
          Categories in the pool
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
          {wheelSegments.map((cat, i) => (
            <div key={i} style={{ padding: '10px 8px', background: `${cat.color}18`, border: `1px solid ${cat.color}40`, borderRadius: '10px', textAlign: 'center' }}>
              <div style={{ fontSize: '20px', marginBottom: '3px' }}>{cat.emoji}</div>
              <div style={{ fontSize: '11px', fontWeight: '600', color: cat.color }}>{cat.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Matched
  if (spinStage === 'matched') return (
    <div className="fade-in" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
      <div className="card bounce-in" style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#4facfe' }}>🎉 Perfect Match!</h1>
      </div>

      <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* Learn */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#4facfe', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📚 You'll Learn</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: '#252838', borderRadius: '12px', border: '1px solid rgba(79,172,254,0.2)' }}>
            <div style={{ width: '56px', height: '56px', background: '#1a1d27', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>
              {matchedSkill?.thumbnail}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '17px', fontWeight: '600', color: '#f0f0f5', marginBottom: '4px' }}>{matchedSkill?.title}</h3>
              <div style={{ fontSize: '13px', color: '#8b8fa8', marginBottom: '6px' }}>by {matchedSkill?.author} · {matchedSkill?.duration}</div>
              <span style={{ background: dc(matchedSkill?.difficulty), color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>{matchedSkill?.difficulty}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <button onClick={() => shareSkill(matchedSkill)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', background: 'rgba(124,106,247,0.12)', border: '1px solid rgba(124,106,247,0.25)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', color: '#a594f9' }}>
              <Share2 size={14} /> Share
            </button>
            <button onClick={() => setShowReport(true)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px', background: 'none', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#555870' }}>
              <Flag size={14} /> Report
            </button>
          </div>
        </div>

        {/* Arrow */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderRadius: '50%', color: 'white' }}>
            <ArrowRight size={18} style={{ transform: 'rotate(90deg)' }} />
          </div>
        </div>

        {/* Teach */}
        <div className="card">
          <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#f5576c', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎓 You'll Teach</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px', background: '#252838', borderRadius: '12px', border: '1px solid rgba(245,87,108,0.2)' }}>
            <div style={{ width: '56px', height: '56px', background: '#1a1d27', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', flexShrink: 0 }}>
              {yourSkill?.thumbnail}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '17px', fontWeight: '600', color: '#f0f0f5', marginBottom: '4px' }}>{yourSkill?.title}</h3>
              <div style={{ fontSize: '13px', color: '#8b8fa8', marginBottom: '6px' }}>Your skill · {yourSkill?.duration}</div>
              <span style={{ background: dc(yourSkill?.difficulty), color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '600' }}>{yourSkill?.difficulty}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={spinAgain} style={{ flex: 1 }}>
            <RotateCcw size={18} /> Spin Again
          </button>
          <button className="btn btn-primary" onClick={confirmMatch} style={{ flex: 2 }}>
            <Zap size={18} /> Start Challenge!
          </button>
        </div>
      </div>

      {showReport && <ReportModal type="skill" targetId={matchedSkill?.id} targetTitle={matchedSkill?.title} onClose={() => setShowReport(false)} />}
    </div>
  );

  // Confirmed
  if (spinStage === 'confirmed') return (
    <div className="fade-in" style={{ paddingTop: '60px', paddingBottom: '20px', textAlign: 'center' }}>
      <div className="float" style={{ fontSize: '64px', marginBottom: '20px' }}>🚀</div>
      <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px', color: 'white' }}>Challenge Started!</h1>
      <p style={{ fontSize: '18px', color: '#8b8fa8' }}>Good luck learning {matchedSkill?.title}!</p>
    </div>
  );

  return null;
}

export default RouletteScreen;
