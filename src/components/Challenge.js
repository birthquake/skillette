import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Camera, 
  Play, 
  CheckCircle, 
  AlertCircle,
  Upload,
  Star,
  Timer,
  Target,
  Award,
  Users,
  ArrowRight,
  RefreshCw,
  Zap
} from 'lucide-react';

function ChallengeScreen({ challenge, onComplete, onNavigate }) {
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [challengeStatus, setChallengeStatus] = useState('active'); // active, recording, submitted, completed
  const [videoBlob, setVideoBlob] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);
  
  // Calculate time remaining
  useEffect(() => {
    if (!challenge) return;

    const updateTimer = () => {
      const now = new Date().getTime();
      const challengeEnd = new Date(challenge.startTime).getTime() + challenge.timeLimit;
      const remaining = challengeEnd - now;
      
      if (remaining <= 0) {
        setTimeRemaining(0);
        setChallengeStatus('expired');
      } else {
        setTimeRemaining(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    
    return () => clearInterval(interval);
  }, [challenge]);

  // Recording timer
  useEffect(() => {
    let interval;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    
    return () => clearInterval(interval);
  }, [isRecording]);

  // Format time display
  const formatTime = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimeColor = () => {
    if (!timeRemaining) return '#ff6b6b';
    const hoursLeft = timeRemaining / (1000 * 60 * 60);
    if (hoursLeft < 2) return '#ff6b6b';
    if (hoursLeft < 6) return '#ffeaa7';
    return '#4ecdc4';
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setChallengeStatus('recording');
    setShowInstructions(false);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    setChallengeStatus('submitted');
    // Mock video blob creation
    setVideoBlob(new Blob(['mock video data'], { type: 'video/mp4' }));
  };

  const handleSubmitProof = () => {
    setChallengeStatus('completed');
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  // No active challenge
  if (!challenge) {
    return (
      <div className="fade-in" style={{ paddingTop: '60px', textAlign: 'center' }}>
        <div style={{
          fontSize: '64px',
          marginBottom: '20px',
          opacity: 0.5
        }}>
          🎯
        </div>
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '600', 
          marginBottom: '12px',
          color: 'white'
        }}>
          No Active Challenge
        </h1>
        <p style={{ 
          fontSize: '16px', 
          color: 'rgba(255,255,255,0.8)',
          marginBottom: '32px'
        }}>
          Start a skill swap to see your challenge here!
        </p>
        <button 
          className="btn btn-primary"
          onClick={() => onNavigate('roulette')}
        >
          <Target size={18} />
          Find a Challenge
        </button>
      </div>
    );
  }

  // Challenge completed successfully
  if (challengeStatus === 'completed') {
    return (
      <div className="fade-in" style={{ 
        paddingTop: '60px', 
        textAlign: 'center',
        color: 'white'
      }}>
        <div style={{
          fontSize: '64px',
          marginBottom: '20px',
          animation: 'bounce 1s ease-in-out'
        }}>
          🎉
        </div>
        <h1 style={{ 
          fontSize: '28px', 
          fontWeight: '700', 
          marginBottom: '12px'
        }}>
          Challenge Complete!
        </h1>
        <p style={{ 
          fontSize: '18px', 
          opacity: 0.9,
          marginBottom: '32px'
        }}>
          Amazing work! You've mastered<br />
          <strong>{challenge.skill?.learnSkill?.title}</strong>
        </p>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '12px 20px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <Award size={20} style={{ marginBottom: '4px' }} />
            <div style={{ fontSize: '14px' }}>+50 XP</div>
          </div>
          <div style={{
            background: 'rgba(255,255,255,0.2)',
            padding: '12px 20px',
            borderRadius: '12px',
            backdropFilter: 'blur(10px)'
          }}>
            <Star size={20} style={{ marginBottom: '4px' }} />
            <div style={{ fontSize: '14px' }}>Streak +1</div>
          </div>
        </div>
      </div>
    );
  }

  // Main challenge interface
  return (
    <div className="fade-in" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
      {/* Challenge Header */}
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ 
            fontSize: '24px', 
            fontWeight: '700', 
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🚀 Active Challenge
          </h1>
          
          {/* Time Remaining */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '16px'
          }}>
            <Clock size={18} style={{ color: getTimeColor() }} />
            <span style={{ 
              fontSize: '18px', 
              fontWeight: '600',
              color: getTimeColor()
            }}>
              {timeRemaining ? formatTime(timeRemaining) : '0s'} remaining
            </span>
          </div>

          {/* Progress Ring */}
          <div style={{
            width: '100px',
            height: '100px',
            margin: '0 auto 20px',
            position: 'relative'
          }}>
            <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={getTimeColor()}
                strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (timeRemaining ? (challenge.timeLimit - timeRemaining) / challenge.timeLimit : 1)}`}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '14px',
              fontWeight: '600',
              color: '#1a1a1a'
            }}>
              {timeRemaining ? Math.round((timeRemaining / challenge.timeLimit) * 100) : 0}%
            </div>
          </div>
        </div>
      </div>

      {/* Skill to Learn */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">📚 Learn This Skill</h2>
            <p className="card-subtitle">Master this and post your proof</p>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px',
          background: '#f8fafc',
          borderRadius: '12px',
          marginBottom: '16px'
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
            {challenge.skill?.learnSkill?.thumbnail}
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              marginBottom: '4px',
              color: '#1a1a1a'
            }}>
              {challenge.skill?.learnSkill?.title}
            </h3>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              fontSize: '14px',
              color: '#666666',
              marginBottom: '8px'
            }}>
              <span>by {challenge.skill?.learnSkill?.author}</span>
              <span>•</span>
              <span>{challenge.skill?.learnSkill?.duration}</span>
            </div>
            <span style={{
              background: '#4facfe',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {challenge.skill?.learnSkill?.difficulty}
            </span>
          </div>
          
          <Play size={20} style={{ color: '#4facfe' }} />
        </div>

        {/* Watch Tutorial Button */}
        <button 
          className="btn btn-outline btn-full"
          style={{ marginBottom: '16px' }}
        >
          <Play size={18} />
          Watch Tutorial Video
        </button>
      </div>

      {/* Instructions */}
      {showInstructions && (
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #ffeaa7 0%, #fcb69f 100%)',
          color: '#8b4513' 
        }}>
          <div style={{ textAlign: 'center' }}>
            <AlertCircle size={24} style={{ marginBottom: '12px' }} />
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600',
              marginBottom: '12px'
            }}>
              📋 Challenge Instructions
            </h3>
            <ul style={{ 
              textAlign: 'left',
              fontSize: '14px',
              lineHeight: '1.6',
              paddingLeft: '20px'
            }}>
              <li>Watch the tutorial video above</li>
              <li>Practice the skill until you can do it</li>
              <li>Record a 30-second proof video</li>
              <li>Submit before the timer runs out!</li>
            </ul>
          </div>
        </div>
      )}

      {/* Recording Interface */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">📹 Record Your Proof</h2>
            <p className="card-subtitle">Show that you've mastered the skill</p>
          </div>
          {isRecording && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: '#ff6b6b'
            }}>
              <div style={{
                width: '8px',
                height: '8px',
                background: '#ff6b6b',
                borderRadius: '50%',
                animation: 'pulse 1s infinite'
              }} />
              <span style={{ fontSize: '14px', fontWeight: '600' }}>
                {formatRecordingTime(recordingTime)}
              </span>
            </div>
          )}
        </div>

        {challengeStatus === 'active' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '200px',
              height: '300px',
              background: '#000',
              borderRadius: '12px',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '48px'
            }}>
              📱
            </div>
            <button 
              className="btn btn-secondary btn-full"
              onClick={handleStartRecording}
            >
              <Camera size={18} />
              Start Recording
            </button>
          </div>
        )}

        {challengeStatus === 'recording' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '200px',
              height: '300px',
              background: '#ff6b6b',
              borderRadius: '12px',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '48px',
              animation: 'pulse 1s infinite'
            }}>
              🎥
            </div>
            <button 
              className="btn btn-primary btn-full"
              onClick={handleStopRecording}
            >
              <CheckCircle size={18} />
              Stop & Review
            </button>
          </div>
        )}

        {challengeStatus === 'submitted' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              width: '200px',
              height: '300px',
              background: '#4ecdc4',
              borderRadius: '12px',
              margin: '0 auto 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '48px'
            }}>
              ✅
            </div>
            <p style={{ 
              fontSize: '14px', 
              color: '#666666',
              marginBottom: '16px'
            }}>
              Great! Your proof video is ready to submit.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                className="btn btn-outline"
                onClick={() => setChallengeStatus('active')}
                style={{ flex: 1 }}
              >
                <RefreshCw size={18} />
                Re-record
              </button>
              <button 
                className="btn btn-primary"
                onClick={handleSubmitProof}
                style={{ flex: 2 }}
              >
                <Upload size={18} />
                Submit Proof
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Your Teaching Skill */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">🎓 You're Teaching</h2>
            <p className="card-subtitle">Someone else is learning this from you</p>
          </div>
        </div>
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          padding: '16px',
          background: '#f8fafc',
          borderRadius: '12px'
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
            {challenge.skill?.teachSkill?.thumbnail}
          </div>
          
          <div style={{ flex: 1 }}>
            <h3 style={{ 
              fontSize: '18px', 
              fontWeight: '600', 
              marginBottom: '4px',
              color: '#1a1a1a'
            }}>
              {challenge.skill?.teachSkill?.title}
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
              <span>{challenge.skill?.teachSkill?.duration}</span>
            </div>
            <span style={{
              background: '#f5576c',
              color: 'white',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '500'
            }}>
              {challenge.skill?.teachSkill?.difficulty}
            </span>
          </div>
          
          <Users size={20} style={{ color: '#f5576c' }} />
        </div>
      </div>
    </div>
  );
}

export default ChallengeScreen;
