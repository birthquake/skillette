import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Square, 
  Play, 
  RotateCcw, 
  Download,
  Upload,
  CheckCircle,
  AlertCircle,
  Loader,
  RefreshCw,
  Maximize2,
  Volume2,
  VolumeX
} from 'lucide-react';

function VideoRecorder({ onVideoReady, onCancel, maxDuration = 30, skillTitle = "Your Skill" }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [cameraAccess, setCameraAccess] = useState('pending'); // pending, granted, denied, error
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Request camera access on component mount
  useEffect(() => {
    requestCameraAccess();
    return () => {
      stopCamera();
    };
  }, []);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          if (newTime >= maxDuration) {
            handleStopRecording();
          }
          return newTime;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, maxDuration]);

  const requestCameraAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 720 },
          height: { ideal: 1280 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraAccess('granted');
    } catch (error) {
      console.error('Camera access error:', error);
      if (error.name === 'NotAllowedError') {
        setCameraAccess('denied');
      } else {
        setCameraAccess('error');
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const handleStartRecording = () => {
    if (!streamRef.current) return;

    chunksRef.current = [];
    
    try {
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, {
        mimeType: 'video/webm;codecs=vp9'
      });
    } catch (error) {
      // Fallback to default codec
      mediaRecorderRef.current = new MediaRecorder(streamRef.current);
    }

    mediaRecorderRef.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setVideoBlob(blob);
      setVideoUrl(URL.createObjectURL(blob));
      stopCamera();
    };

    mediaRecorderRef.current.start();
    setIsRecording(true);
    setRecordingTime(0);
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleRetake = () => {
    setVideoBlob(null);
    setVideoUrl(null);
    setRecordingTime(0);
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    requestCameraAccess();
  };

  const handleSubmit = () => {
    if (videoBlob && onVideoReady) {
      onVideoReady(videoBlob, videoUrl);
    }
  };

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Camera access denied
  if (cameraAccess === 'denied') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <AlertCircle size={48} style={{ color: '#ff6b6b', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
          Camera Access Needed
        </h3>
        <p style={{ fontSize: '14px', color: '#666666', marginBottom: '20px' }}>
          Please allow camera access to record your skill demonstration. 
          You can change this in your browser settings.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={requestCameraAccess}>
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Camera access error
  if (cameraAccess === 'error') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <AlertCircle size={48} style={{ color: '#ff6b6b', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
          Camera Error
        </h3>
        <p style={{ fontSize: '14px', color: '#666666', marginBottom: '20px' }}>
          We couldn't access your camera. Please check that it's not being used by another app.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={requestCameraAccess}>
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Loading camera
  if (cameraAccess === 'pending') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <Loader size={48} style={{ color: '#667eea', marginBottom: '16px', animation: 'spin 1s linear infinite' }} />
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
          Setting up camera...
        </h3>
        <p style={{ fontSize: '14px', color: '#666666' }}>
          Please allow camera access when prompted
        </p>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h2 style={{ 
          fontSize: '20px', 
          fontWeight: '600', 
          marginBottom: '4px',
          color: '#1a1a1a'
        }}>
          Record Your Skill
        </h2>
        <p style={{ fontSize: '14px', color: '#666666', marginBottom: '12px' }}>
          Show us how you do: <strong>{skillTitle}</strong>
        </p>
        
        {/* Recording Timer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          marginBottom: '8px'
        }}>
          {isRecording && (
            <div style={{
              width: '8px',
              height: '8px',
              background: '#ff6b6b',
              borderRadius: '50%',
              animation: 'pulse 1s infinite'
            }} />
          )}
          <span style={{ 
            fontSize: '18px', 
            fontWeight: '600',
            color: isRecording ? '#ff6b6b' : '#4facfe'
          }}>
            {formatTime(recordingTime)} / {formatTime(maxDuration)}
          </span>
        </div>

        {/* Progress Bar */}
        <div style={{
          width: '100%',
          height: '4px',
          background: '#e2e8f0',
          borderRadius: '2px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${(recordingTime / maxDuration) * 100}%`,
            height: '100%',
            background: isRecording ? '#ff6b6b' : '#4facfe',
            transition: 'width 0.3s ease'
          }} />
        </div>
      </div>

      {/* Video Container */}
      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '9/16',
        background: '#000',
        borderRadius: '16px',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={videoBlob ? isMuted : true}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        />

        {/* Video Controls Overlay (only for playback) */}
        {videoBlob && (
          <>
            <div 
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                cursor: 'pointer',
                opacity: isPlaying ? 0 : 1,
                transition: 'opacity 0.3s ease'
              }}
              onClick={togglePlayback}
            >
              <div style={{
                width: '60px',
                height: '60px',
                background: 'rgba(0,0,0,0.7)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white'
              }}>
                <Play size={24} />
              </div>
            </div>

            {/* Video Controls */}
            <div style={{
              position: 'absolute',
              bottom: '12px',
              right: '12px',
              display: 'flex',
              gap: '8px'
            }}>
              <button
                onClick={toggleMute}
                style={{
                  width: '36px',
                  height: '36px',
                  background: 'rgba(0,0,0,0.7)',
                  border: 'none',
                  borderRadius: '50%',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
              </button>
            </div>
          </>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <div style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            background: 'rgba(255, 107, 107, 0.9)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              background: 'white',
              borderRadius: '50%',
              animation: 'pulse 1s infinite'
            }} />
            REC
          </div>
        )}
      </div>

      {/* Controls */}
      {!videoBlob ? (
        // Recording Controls
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            className="btn btn-outline"
            onClick={onCancel}
            style={{ flex: 1 }}
          >
            Cancel
          </button>
          
          <button 
            className="btn btn-primary"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={cameraAccess !== 'granted'}
            style={{ flex: 2 }}
          >
            {isRecording ? (
              <>
                <Square size={18} />
                Stop Recording
              </>
            ) : (
              <>
                <Camera size={18} />
                Start Recording
              </>
            )}
          </button>
        </div>
      ) : (
        // Playback Controls
        <div>
          <div style={{ 
            display: 'flex', 
            gap: '12px',
            marginBottom: '16px'
          }}>
            <button 
              className="btn btn-outline"
              onClick={handleRetake}
              style={{ flex: 1 }}
            >
              <RotateCcw size={18} />
              Retake
            </button>
            
            <button 
              className="btn btn-primary"
              onClick={handleSubmit}
              style={{ flex: 2 }}
            >
              <CheckCircle size={18} />
              Use This Video
            </button>
          </div>

          {/* Video Info */}
          <div className="card" style={{ 
            background: '#f8fafc',
            padding: '12px',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '14px', color: '#666666', marginBottom: '4px' }}>
              Video recorded successfully!
            </p>
            <p style={{ fontSize: '12px', color: '#666666' }}>
              Duration: {formatTime(recordingTime)} • Size: {(videoBlob.size / 1024 / 1024).toFixed(1)}MB
            </p>
          </div>
        </div>
      )}

      {/* Tips */}
      {!videoBlob && !isRecording && (
        <div className="card" style={{ 
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          textAlign: 'center',
          marginTop: '16px'
        }}>
          <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>
            💡 Recording Tips
          </h4>
          <ul style={{ 
            fontSize: '14px',
            textAlign: 'left',
            paddingLeft: '20px',
            lineHeight: '1.5'
          }}>
            <li>Make sure you're well-lit</li>
            <li>Demonstrate the skill clearly</li>
            <li>Speak while you demonstrate</li>
            <li>Maximum {maxDuration} seconds</li>
          </ul>
        </div>
      )}
    </div>
  );
}

export default VideoRecorder;
