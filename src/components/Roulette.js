import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Play, 
  Clock, 
  Users, 
  Star, 
  Shuffle,
  Target,
  Zap,
  ArrowRight,
  RefreshCw
} from 'lucide-react';

function RouletteScreen({ mockSkills, onStartChallenge, onNavigate }) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [matchedSkill, setMatchedSkill] = useState(null);
  const [yourSkill, setYourSkill] = useState(null);
  const [spinStage, setSpinStage] = useState('ready'); // ready, spinning, matched, confirmed
  const [wheelRotation, setWheelRotation] = useState(0);

  // Mock user skills they could teach
  const userSkills = [
    {
      id: 'user1',
      title: 'Speed Cube Solving',
      difficulty: 'Hard',
      duration: '6 min',
      category: 'Puzzles',
      thumbnail: '🧩'
    },
    {
      id: 'user2', 
      title: 'Perfect Coffee Pour',
      difficulty: 'Medium',
      duration: '3 min',
      category: 'Cooking',
      thumbnail: '☕'
    },
    {
      id: 'user3',
      title: 'Quick Meditation',
      difficulty: 'Easy',
      duration: '2 min',
      category: 'Wellness',
      thumbnail: '🧘'
    }
  ];

  const categories = [
    { name: 'Life Hacks', color: '#ff6b6b', emoji: '💡' },
    { name: 'Crafts', color: '#4ecdc4', emoji: '🎨' },
    { name: 'Cooking', color: '#45b7d1', emoji: '👨‍🍳' },
    { name: 'Magic', color: '#96ceb4', emoji: '🎩' },
    { name: 'Music', color: '#ffeaa7', emoji: '🎵' },
    { name: 'Sports', color: '#dda0dd', emoji: '⚽' }
  ];

  const handleSpin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setSpinStage('spinning');
    
    // Generate random rotation (multiple full spins + random angle)
    const randomRotation = wheelRotation + 1440 + Math.random() * 360;
    setWheelRotation(randomRotation);
    
    // After spin animation, show matched skills
    setTimeout(() => {
      const randomSkill = mockSkills[Math.floor(Math.random() * mockSkills.length)];
      const randomUserSkill = userSkills[Math.floor(Math.random() * userSkills.length)];
      
      setMatchedSkill(randomSkill);
      setYourSkill(randomUserSkill);
      setSpinStage('matched');
      setIsSpinning(false);
    }, 2000);
  };

  const confirmMatch = () => {
    setSpinStage('confirmed');
    setTimeout(() => {
      onStartChallenge({
        learnSkill: matchedSkill,
        teachSkill: yourSkill
      });
    }, 1000);
  };

  const spinAgain = () => {
    setSpinStage('ready');
    setMatchedSkill(null);
    setYourSkill(null);
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#4ecdc4';
      case 'Medium': return '#ffeaa7';
      case 'Hard': return '#ff6b6b';
      default: return '#4ecdc4';
    }
  };

  // Ready to spin state
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
          <p style={{ 
            fontSize: '16px', 
            color: '#666666',
            marginBottom: '20px'
          }}>
            Spin to get matched with someone's skill to learn!
          </p>
        </div>

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
                    <div style={{ fontSize: '12px' }}>Ready to Spin</div>
                  </>
                )}
              </div>
            </div>
          </div>

          <button 
            className="btn btn-primary btn-large"
            onClick={handleSpin}
            disabled={isSpinning}
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
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '16px',
            textAlign: 'center'
          }}>
            🎯 Skill Categories
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '12px' 
          }}>
            {categories.map((category, index) => (
              <div 
                key={index}
                style={{
                  padding: '12px',
                  background: `${category.color}20`,
                  border: `2px solid ${category.color}40`,
                  borderRadius: '12px',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '24px', marginBottom: '4px' }}>
                  {category.emoji}
                </div>
                <div style={{ 
                  fontSize: '12px', 
                  fontWeight: '500',
                  color: category.color
                }}>
                  {category.name}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* How It Works */}
        <div className="card">
          <h3 style={{ 
            fontSize: '18px', 
            fontWeight: '600', 
            marginBottom: '16px'
          }}>
            ⚡ How It Works
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                1
              </div>
              <p style={{ fontSize: '14px', color: '#1a1a1a' }}>
                <strong>Spin the wheel</strong> to get matched with someone's skill
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                2
              </div>
              <p style={{ fontSize: '14px', color: '#1a1a1a' }}>
                <strong>Learn their skill</strong> in 24 hours and post proof
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '14px',
                fontWeight: '600'
              }}>
                3
              </div>
              <p style={{ fontSize: '14px', color: '#1a1a1a' }}>
                <strong>They learn yours too</strong> - it's a skill swap!
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Matched state - show the skills that were matched
  if (spinStage === 'matched') {
    return (
      <div className="fade-in" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            marginBottom: '8px',
            color: '#4facfe'
          }}>
            🎉 Perfect Match!
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: '#666666',
            marginBottom: '24px'
          }}>
            You've been matched for a skill swap!
          </p>
        </div>

        {/* Skills Exchange */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Skill to Learn */}
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600',
                color: '#4facfe',
                marginBottom: '4px'
              }}>
                📚 You'll Learn
              </h3>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '2px solid #4facfe20'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'white',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                {matchedSkill?.thumbnail}
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  marginBottom: '4px',
                  color: '#1a1a1a'
                }}>
                  {matchedSkill?.title}
                </h3>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '14px',
                  color: '#666666',
                  marginBottom: '8px'
                }}>
                  <span>by {matchedSkill?.author}</span>
                  <span>•</span>
                  <span>{matchedSkill?.duration}</span>
                </div>
                <span 
                  style={{
                    background: getDifficultyColor(matchedSkill?.difficulty),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  {matchedSkill?.difficulty}
                </span>
              </div>
            </div>
          </div>

          {/* Exchange Arrow */}
          <div style={{ textAlign: 'center', margin: '8px 0' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '40px',
              height: '40px',
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
              borderRadius: '50%',
              color: 'white'
            }}>
              <ArrowRight size={20} style={{ transform: 'rotate(90deg)' }} />
            </div>
            <p style={{ 
              fontSize: '14px', 
              color: '#666666',
              marginTop: '8px',
              fontWeight: '500'
            }}>
              In exchange, you'll teach
            </p>
          </div>

          {/* Skill to Teach */}
          <div className="card">
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h3 style={{ 
                fontSize: '18px', 
                fontWeight: '600',
                color: '#f5576c',
                marginBottom: '4px'
              }}>
                🎓 You'll Teach
              </h3>
            </div>
            
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '12px',
              border: '2px solid #f5576c20'
            }}>
              <div style={{
                width: '60px',
                height: '60px',
                background: 'white',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                {yourSkill?.thumbnail}
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ 
                  fontSize: '18px', 
                  fontWeight: '600', 
                  marginBottom: '4px',
                  color: '#1a1a1a'
                }}>
                  {yourSkill?.title}
                </h3>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '14px',
                  color: '#666666',
                  marginBottom: '8px'
                }}>
                  <span>Your skill</span>
                  <span>•</span>
                  <span>{yourSkill?.duration}</span>
                </div>
                <span 
                  style={{
                    background: getDifficultyColor(yourSkill?.difficulty),
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: '500'
                  }}
                >
                  {yourSkill?.difficulty}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          gap: '12px', 
          marginTop: '24px' 
        }}>
          <button 
            className="btn btn-outline"
            onClick={spinAgain}
            style={{ flex: 1 }}
          >
            <RotateCcw size={18} />
            Spin Again
          </button>
          <button 
            className="btn btn-primary"
            onClick={confirmMatch}
            style={{ flex: 2 }}
          >
            <Zap size={18} />
            Start Challenge!
          </button>
        </div>
      </div>
    );
  }

  // Confirmed state
  if (spinStage === 'confirmed') {
    return (
      <div className="fade-in" style={{ 
        paddingTop: '60px', 
        paddingBottom: '20px',
        textAlign: 'center'
      }}>
        <div style={{
          fontSize: '64px',
          marginBottom: '20px',
          animation: 'spin 1s ease-in-out'
        }}>
          🚀
        </div>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          marginBottom: '12px',
          color: 'white'
        }}>
          Challenge Started!
        </h1>
        <p style={{ 
          fontSize: '18px', 
          color: 'rgba(255,255,255,0.9)',
          marginBottom: '20px'
        }}>
          Good luck learning {matchedSkill?.title}!
        </p>
      </div>
    );
  }

  return null;
}

export default RouletteScreen;
