import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  Camera, 
  Play, 
  CheckCircle, 
  AlertCircle,
  Upload,
  Target,
  Award,
  Users,
  RefreshCw,
  Zap,
  Loader
} from 'lucide-react';
import VideoRecorder from './VideoRecorder';
import { uploadVideo } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

function ChallengeScreen({ challenge, onComplete, onNavigate }) {
  const { currentUser } = useAuth();

  const [timeRemaining, setTimeRemaining] = useState(null);
  const [challengeStatus, setChallengeStatus] = useState('active');
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showVideoRecorder, setShowVideoRecorder] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

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

  const formatTime = (milliseconds) => {
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  };

  const getTimeColor = () => {
    if (!timeRemaining) return '#ff6b6b';
    const hoursLeft = timeRemaining / (1000 * 60 * 60);
    if (hoursLeft < 2) return '#ff6b6b';
    if (hoursLeft < 6) return '#ffeaa7';
    return '#4ecdc4';
  };

  const handleStartRecording = () => {
    setShowVideoRecorder(true);
    setShowInstructions(false);
  };

  const handleVideoReady = (blob, url) => {
    setVideoBlob(blob);
    setVideoUrl(url);
    setShowVideoRecorder(false);
    setChallengeStatus('submitted');
  };

  const handleCancelRecording = () => {
    setShowVideoRecorder(false);
  };

  const handleSubmitProof = async () => {
    if (!videoBlob || !currentUser) return;

    setIsUploading(true);
    setUploadError('');
    setUploadProgress(0);

    try {
      const challengeId = `${currentUser.uid}_${Date.now()}`;
      const result = await uploadVideo(
        videoBlob,
        currentUser.uid,
        challengeId,
        (progress) => setUploadProgress(progress)
      );

      if (result.success) {
        setChallengeStatus('completed');
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setUploadError('Upload failed. Please try again.');
      }
    } catch (error) {
      setUploadError('Something went wrong. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRetake = () => {
    setChallengeStatus('active');
    setVideoBlob(null);
    setUploadError('');
    setUploadProgress(0);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
  };

  // No active challenge
  if (!challenge) {
    return (
      <div className="fade-in" style={{ paddingTop: '60px', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.5 }}>🎯</div>
        <h1 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '12px', color: 'white' }}>
          No Active Challenge
        </h1>
        <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.8)', marginBottom: '32px' }}>
          Start a skill swap to see your challenge here!
        </p>
        <button className="btn btn-primary" onClick={() => onNavigate('roulette')}>
          <Target size={18} />
          Find a Challenge
        </button>
      </div>
    );
  }

  // Challenge completed
  if (challengeStatus === 'completed') {
    return (
      <div className="fade-in" style={{ paddingTop: '60px', textAlign: 'center', color: 'white' }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>
          Challenge Complete!
        </h1>
        <p style={{ fontSize: '18px', opacity: 0.9, marginBottom: '32px' }}>
          Amazing work! You've mastered<br />
          <strong>{challenge.skill?.learnSkill?.title}</strong>
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginBottom: '32px' }}>
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
            <Zap size={20} style={{ marginBottom: '4px' }} />
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
            <span style={{ fontSize: '18px', fontWeight: '600', color: getTimeColor() }}>
              {timeRemaining ? formatTime(timeRemaining) : '0s'} remaining
            </span>
          </div>

          {/* Progress Ring */}
          <div style={{ width: '100px', height: '100px', margin: '0 auto 20px', position: 'relative' }}>
            <svg width="100" height="100" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="50" cy="50" r="45" fill="none" stroke="#e2e8f0" strokeWidth="8" />
              <circle
                cx="50" cy="50" r="45" fill="none"
                stroke={getTimeColor()} strokeWidth="8"
                strokeDasharray={`${2 * Math.PI * 45}`}
                strokeDashoffset={`${2 * Math.PI * 45 * (timeRemaining ? (challenge.timeLimit - timeRemaining) / challenge.timeLimit : 1)}`}
                style={{ transition: 'stroke-dashoffset 1s ease' }}
              />
            </svg>
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '14px', fontWeight: '600', color: '#1a1a1a'
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
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '16px', background: '#f8fafc', borderRadius: '12px', marginBottom: '16px'
        }}>
          <div style={{
            width: '60px', height: '60px', background: 'white', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', flexShrink: 0
          }}>
            {challenge.skill?.learnSkill?.thumbnail}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#1a1a1a' }}>
              {challenge.skill?.learnSkill?.title}
            </h3>
            <div style={{ fontSize: '14px', color: '#666666', marginBottom: '8px' }}>
              by {challenge.skill?.learnSkill?.author} • {challenge.skill?.learnSkill?.duration}
            </div>
            <span style={{
              background: '#4facfe', color: 'white',
              padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '500'
            }}>
              {challenge.skill?.learnSkill?.difficulty}
            </span>
          </div>
          <Play size={20} style={{ color: '#4facfe' }} />
        </div>

        <button className="btn btn-outline btn-full" style={{ marginBottom: '16px' }}>
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
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '12px' }}>
              📋 Challenge Instructions
            </h3>
            <ul style={{ textAlign: 'left', fontSize: '14px', lineHeight: '1.6', paddingLeft: '20px' }}>
              <li>Watch the tutorial video above</li>
              <li>Practice the skill until you can do it</li>
              <li>Record a 30-second proof video</li>
              <li>Submit before the timer runs out!</li>
            </ul>
          </div>
        </div>
      )}

      {/* Recording / Upload Interface */}
      {showVideoRecorder ? (
        <VideoRecorder
          onVideoReady={handleVideoReady}
          onCancel={handleCancelRecording}
          maxDuration={30}
          skillTitle={challenge.skill?.learnSkill?.title}
        />
      ) : (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">📹 Record Your Proof</h2>
              <p className="card-subtitle">Show that you've mastered the skill</p>
            </div>
          </div>

          {/* Active — no video yet */}
          {challengeStatus === 'active' && !videoBlob && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '200px', height: '300px', background: '#000',
                borderRadius: '12px', margin: '0 auto 20px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '48px'
              }}>
                📱
              </div>
              <button className="btn btn-secondary btn-full" onClick={handleStartRecording}>
                <Camera size={18} />
                Start Recording
              </button>
            </div>
          )}

          {/* Video recorded — ready to submit */}
          {challengeStatus === 'submitted' && videoBlob && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: '200px', height: '300px',
                borderRadius: '12px', margin: '0 auto 20px',
                overflow: 'hidden', position: 'relative'
              }}>
                {videoUrl ? (
                  <video
                    src={videoUrl}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
                    controls
                    playsInline
                  />
                ) : (
                  <div style={{
                    width: '100%', height: '100%', background: '#4ecdc4',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '48px', color: 'white'
                  }}>✅</div>
                )}
              </div>

              {/* Upload progress */}
              {isUploading && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Loader size={16} style={{ animation: 'spin 1s linear infinite', color: '#667eea' }} />
                    <span style={{ fontSize: '14px', color: '#666' }}>Uploading... {uploadProgress}%</span>
                  </div>
                  <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${uploadProgress}%`, height: '100%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      borderRadius: '3px', transition: 'width 0.3s ease'
                    }} />
                  </div>
                </div>
              )}

              {/* Upload error */}
              {uploadError && (
                <div style={{
                  background: '#fff5f5', border: '1px solid #ff6b6b',
                  borderRadius: '8px', padding: '12px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  color: '#ff6b6b', fontSize: '14px', marginBottom: '16px'
                }}>
                  <AlertCircle size={16} />
                  {uploadError}
                </div>
              )}

              {!isUploading && (
                <p style={{ fontSize: '14px', color: '#666666', marginBottom: '16px' }}>
                  Great! Your proof video is ready to submit.
                </p>
              )}

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  className="btn btn-outline"
                  onClick={handleRetake}
                  disabled={isUploading}
                  style={{ flex: 1 }}
                >
                  <RefreshCw size={18} />
                  Re-record
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSubmitProof}
                  disabled={isUploading}
                  style={{ flex: 2, opacity: isUploading ? 0.7 : 1 }}
                >
                  {isUploading ? (
                    <>
                      <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      Submit Proof
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Your Teaching Skill */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">🎓 You're Teaching</h2>
            <p className="card-subtitle">Someone else is learning this from you</p>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: '16px',
          padding: '16px', background: '#f8fafc', borderRadius: '12px'
        }}>
          <div style={{
            width: '60px', height: '60px', background: 'white', borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', flexShrink: 0
          }}>
            {challenge.skill?.teachSkill?.thumbnail}
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#1a1a1a' }}>
              {challenge.skill?.teachSkill?.title}
            </h3>
            <div style={{ fontSize: '14px', color: '#666666', marginBottom: '8px' }}>
              Your skill • {challenge.skill?.teachSkill?.duration}
            </div>
            <span style={{
              background: '#f5576c', color: 'white',
              padding: '4px 8px', borderRadius: '6px', fontSize: '12px', fontWeight: '500'
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
