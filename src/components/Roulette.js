import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Shuffle,
  Target,
  Zap,
  ArrowRight,
  RefreshCw,
  Loader,
  Flag
} from 'lucide-react';
import { getRandomSkills, getUserSkills, createMatch, createChallenge, createNotification, trackEvent } from '../firebase';
import ReportModal from './ReportModal';
import ErrorBanner from './ErrorBanner';
import { useAuth } from '../contexts/AuthContext';

function RouletteScreen({ onStartChallenge, onNavigate }) {
  const { currentUser } = useAuth();

  const [isSpinning, setIsSpinning] = useState(false);
  const [matchedSkill, setMatchedSkill] = useState(null);
  const [yourSkill, setYourSkill] = useState(null);
  const [spinStage, setSpinStage] = useState('ready');
  const [wheelRotation, setWheelRotation] = useState(0);

  const [availableSkills, setAvailableSkills] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [showReport, setShowReport] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const categories = [
    { name: 'Life Hacks', color: '#ff6b6b', emoji: '💡' },
    { name: 'Crafts', color: '#4ecdc4', emoji: '🎨' },
    { name: 'Cooking', color: '#45b7d1', emoji: '👨‍🍳' },
    { name: 'Magic', color: '#96ceb4', emoji: '🎩' },
    { name: 'Music', color: '#ffeaa7', emoji: '🎵' },
    { name: 'Sports', color: '#dda0dd', emoji: '⚽' }
  ];

  // Load skills from Firebase on mount
  useEffect(() => {
    const loadSkills = async () => {
      setLoadingSkills(true);
      setLoadError('');
      try {
        // Load skills from other users to learn
        const otherSkills = await getRandomSkills(currentUser.uid, 20);
        setAvailableSkills(otherSkills);

        // Load the current user's own skills to teach
        const mySkills = await getUserSkills(currentUser.uid);
        setUserSkills(mySkills);
      } catch (error) {
        console.error('Error loading skills:', error);
        setLoadError('Could not load skills. Please try again.');
      } finally {
        setLoadingSkills(false);
      }
    };

    loadSkills();
  }, [currentUser.uid, retryCount]);

  const handleSpin = () => {
    if (isSpinning) return;

    // Need at least one skill to learn and one to teach
    if (availableSkills.length === 0) {
      setLoadError('No skills available to learn yet. Check back soon!');
      return;
    }
    if (userSkills.length === 0) {
      setLoadError('You need to add at least one skill before spinning.');
      return;
    }

    setLoadError('');
    setIsSpinning(true);
    setSpinStage('spinning');
    trackEvent('roulette_spin');

    const randomRotation = wheelRotation + 1440 + Math.random() * 360;
    setWheelRotation(randomRotation);

    setTimeout(() => {
      const randomSkill = availableSkills[Math.floor(Math.random() * availableSkills.length)];
      const randomUserSkill = userSkills[Math.floor(Math.random() * userSkills.length)];

      setMatchedSkill(randomSkill);
      setYourSkill(randomUserSkill);
      setSpinStage('matched');
      setIsSpinning(false);
    }, 2000);
  };

  const confirmMatch = async () => {
    setSpinStage('confirmed');
    trackEvent('challenge_started', { skillTitle: matchedSkill?.title });

    try {
      // Create the challenge document first
      const challengeResult = await createChallenge({
        userId: currentUser.uid,
        skill: { learnSkill: matchedSkill, teachSkill: yourSkill },
        timeLimit: 24 * 60 * 60 * 1000
      });

      // Create a match linking this user to the skill owner
      if (challengeResult.success && matchedSkill?.userId) {
        await createMatch({
          challengeId: challengeResult.id,
          learnerId: currentUser.uid,
          learnerSkillId: yourSkill?.id || null,
          learnerSkill: yourSkill,
          teacherId: matchedSkill.userId,
          teacherSkillId: matchedSkill?.id || null,
          teacherSkill: matchedSkill,
        });

        // Notify the teacher that someone is learning their skill
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

      setTimeout(() => {
        onStartChallenge(
          { learnSkill: matchedSkill, teachSkill: yourSkill },
          challengeResult.id
        );
      }, 1000);
    } catch (error) {
      console.error('Error saving match:', error);
      // Still proceed even if saving fails
      setTimeout(() => {
        onStartChallenge({ learnSkill: matchedSkill, teachSkill: yourSkill }, null);
      }, 1000);
    }
  };

  const spinAgain = () => {
    setSpinStage('ready');
    setMatchedSkill(null);
    setYourSkill(null);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#4ecdc4';
      case 'Medium': return '#f5a623';
      case 'Hard': return '#ff6b6b';
      default: return '#4ecdc4';
    }
  };

  // Loading state
  if (loadingSkills) {
    return (
      <div className="fade-in" style={{ paddingTop: '60px', textAlign: 'center', color: 'white' }}>
        <Loader size={48} style={{ animation: 'spin 1s linear infinite', marginBottom: '20px' }} />
        <h2 style={{ fontSize: '20px', fontWeight: '600' }}>Loading skills...</h2>
      </div>
    );
  }

  // Ready to spin state
  // Gate: user must have at least one skill before they can spin
  if (spinStage === 'ready' && !loadingSkills && userSkills.length === 0) {
    return (
      <div className="fade-in" style={{ paddingTop: '60px', paddingBottom: '20px', textAlign: 'center' }}>
        <div style={{ fontSize: '72px', marginBottom: '24px' }}>🎯</div>
        <h1 style={{
          fontSize: '26px', fontWeight: '700', color: 'white',
          marginBottom: '12px'
        }}>
          Add a Skill First
        </h1>
        <p style={{
          fontSize: '16px', color: 'rgba(255,255,255,0.85)',
          marginBottom: '8px', lineHeight: '1.6'
        }}>
          Skillette is a two-way exchange.
        </p>
        <p style={{
          fontSize: '16px', color: 'rgba(255,255,255,0.85)',
          marginBottom: '36px', lineHeight: '1.6'
        }}>
          To spin and learn from someone else, you need to have at least one skill in the pool that others can learn from you.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => onNavigate('addSkill')}
          style={{
            background: '#1a1d27', color: '#667eea',
            fontSize: '16px', padding: '14px 32px',
            borderRadius: '14px', fontWeight: '700'
          }}
        >
          <ArrowRight size={18} />
          Add Your First Skill
        </button>
        <p style={{
          fontSize: '13px', color: 'rgba(255,255,255,0.6)',
          marginTop: '20px'
        }}>
          It only takes a minute — just describe what you can teach.
        </p>
      </div>
    );
  }

  if (spinStage === 'ready') {
    return (
      <div className="fade-in" style={{ paddingTop: '20px', paddingBottom: '20px' }}>

        {/* Header */}
        <div className="card" style={{ textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            Skill Roulette
          </h1>
          <p style={{ fontSize: '16px', color: '#8b8fa8', marginBottom: '8px' }}>
            Spin to get matched with someone's skill to learn!
          </p>
          <p style={{ fontSize: '13px', color: '#555870' }}>
            {availableSkills.length} skill{availableSkills.length !== 1 ? 's' : ''} available in the pool
          </p>
        </div>

        {/* Error / Warning */}
        {loadError && (
          <ErrorBanner
            message={loadError}
            onRetry={() => setRetryCount(c => c + 1)}
          />
        )}

        {/* Roulette Wheel */}
        <div className="roulette-container">
          <div 
            className={`roulette-wheel ${isSpinning ? 'spinning' : ''}`}
            style={{ 
              transform: `rotate(${wheelRotation}deg)`,
              transition: isSpinning ? 'transform 2s cubic-bezier(0.23, 1, 0.320, 1)' : 'none'
            }}
          >
            <div className="roulette-center">
              <div style={{ textAlign: 'center' }}>
                {isSpinning ? (
                  <>
                    <Shuffle size={24} style={{ marginBottom: '4px' }} />
                    <div style={{ fontSize: '12px' }}>Matching...</div>
                  </>
                ) : (
                  <>
                    <Target size={24} style={{ marginBottom: '4px' }} />
                    <div style={{ fontSize: '12px' }}>Ready</div>
                  </>
                )}
              </div>
            </div>
          </div>

          <button 
            className="btn btn-primary btn-large"
            onClick={handleSpin}
            disabled={isSpinning || availableSkills.length === 0 || userSkills.length === 0}
            style={{ 
              marginTop: '20px',
              transform: isSpinning ? 'scale(0.95)' : 'scale(1)',
              transition: 'all 0.2s ease'
            }}
          >
            {isSpinning ? (
              <>
                <RefreshCw size={20} style={{ animation: 'spin 1s linear infinite' }} />
                Finding Match...
              </>
            ) : (
              <>
                <RotateCcw size={20} />
                Spin to Match!
              </>
            )}
          </button>
        </div>



        {/* Categories Preview */}
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', textAlign: 'center' }}>
            🎯 Skill Categories
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {categories.map((category, index) => (
              <div 
                key={index}
                style={{
                  padding: '12px',
                  background: `${category.color}20`,
                  border: `2px solid ${category.color}40`,
                  borderRadius: '12px',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>{category.emoji}</div>
                <div style={{ fontSize: '12px', fontWeight: '500', color: category.color }}>
                  {category.name}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    );
  }

  // Matched state
  if (spinStage === 'matched') {
    return (
      <div className="fade-in" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
        <div className="card bounce-in" style={{ textAlign: 'center' }}>
          <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '8px', color: '#4facfe' }}>
            🎉 Perfect Match!
          </h1>

        </div>

        <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Skill to Learn */}
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#4facfe' }}>📚 You'll Learn</h3>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '16px', background: '#252838', borderRadius: '12px',
              border: '2px solid rgba(79,172,254,0.15)'
            }}>
              <div style={{
                width: '60px', height: '60px', background: '#1a1d27', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', flexShrink: 0
              }}>
                {matchedSkill?.thumbnail}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#f0f0f5' }}>
                  {matchedSkill?.title}
                </h3>
                <div style={{ fontSize: '14px', color: '#8b8fa8', marginBottom: '8px' }}>
                  by {matchedSkill?.author} • {matchedSkill?.duration}
                </div>
                <span style={{
                  background: getDifficultyColor(matchedSkill?.difficulty),
                  color: 'white', padding: '4px 8px', borderRadius: '6px',
                  fontSize: '12px', fontWeight: '500'
                }}>
                  {matchedSkill?.difficulty}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowReport(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              color: '#555870', fontSize: '13px', padding: '4px 0',
              marginTop: '8px'
            }}
          >
            <Flag size={13} />
            Report this skill
          </button>

          {/* Arrow */}
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '40px', height: '40px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '50%', color: 'white'
            }}>
              <ArrowRight size={20} style={{ transform: 'rotate(90deg)' }} />
            </div>
          </div>

          {/* Skill to Teach */}
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#f5576c' }}>🎓 You'll Teach</h3>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              padding: '16px', background: '#252838', borderRadius: '12px',
              border: '2px solid rgba(245,87,108,0.15)'
            }}>
              <div style={{
                width: '60px', height: '60px', background: '#1a1d27', borderRadius: '12px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', flexShrink: 0
              }}>
                {yourSkill?.thumbnail}
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#f0f0f5' }}>
                  {yourSkill?.title}
                </h3>
                <div style={{ fontSize: '14px', color: '#8b8fa8', marginBottom: '8px' }}>
                  Your skill • {yourSkill?.duration}
                </div>
                <span style={{
                  background: getDifficultyColor(yourSkill?.difficulty),
                  color: 'white', padding: '4px 8px', borderRadius: '6px',
                  fontSize: '12px', fontWeight: '500'
                }}>
                  {yourSkill?.difficulty}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button className="btn btn-outline" onClick={spinAgain} style={{ flex: 1 }}>
            <RotateCcw size={18} />
            Spin Again
          </button>
          <button className="btn btn-primary" onClick={confirmMatch} style={{ flex: 2 }}>
            <Zap size={18} />
            Start Challenge!
          </button>
        </div>

      {/* Report modal */}
      {showReport && (
        <ReportModal
          type="skill"
          targetId={matchedSkill?.id}
          targetTitle={matchedSkill?.title}
          onClose={() => setShowReport(false)}
        />
      )}
      </div>
    );
  }

  // Confirmed state
  if (spinStage === 'confirmed') {
    return (
      <div className="fade-in" style={{ paddingTop: '60px', paddingBottom: '20px', textAlign: 'center' }}>
        <div className="float" style={{ fontSize: '64px', marginBottom: '20px' }}>
          🚀
        </div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px', color: 'white' }}>
          Challenge Started!
        </h1>
        <p style={{ fontSize: '18px', color: 'rgba(240,240,245,0.85)', marginBottom: '20px' }}>
          Good luck learning {matchedSkill?.title}!
        </p>
      </div>
    );
  }

  return null;
}

export default RouletteScreen;
