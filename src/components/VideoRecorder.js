import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  Square, 
  RotateCcw, 
  CheckCircle,
  AlertCircle,
  Loader,
  RefreshCw
} from 'lucide-react';

function VideoRecorder({ onVideoReady, onCancel, maxDuration = 30, skillTitle = "Your Skill" }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [cameraAccess, setCameraAccess] = useState('pending');
  const [streamReady, setStreamReady] = useState(false);
  const [currentCamera, setCurrentCamera] = useState('user');

  // Two separate refs — one for live camera, one for recorded preview
  const liveVideoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (liveVideoRef.current) {
      liveVideoRef.current.srcObject = null;
    }
    setStreamReady(false);
  }, []);

  const startStream = useCallback(async () => {
    try {
      setCameraAccess('pending');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: currentCamera },
        audio: true
      });
      streamRef.current = stream;

      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play().catch(() => {});
      }

      setStreamReady(true);
      setCameraAccess('granted');
    } catch (error) {
      console.error('Camera error:', error);
      setCameraAccess(error.name === 'NotAllowedError' ? 'denied' : 'error');
    }
  }, [currentCamera]);

  // Start stream on mount and when camera switches
  useEffect(() => {
    startStream();
    return () => stopStream();
  }, [startStream, stopStream]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          const next = prev + 1;
          if (next >= maxDuration) handleStopRecording();
          return next;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isRecording, maxDuration, handleStopRecording]);

  const handleStartRecording = () => {
    if (!streamRef.current) {
      alert('Camera not ready. Please try again.');
      return;
    }

    chunksRef.current = [];

    try {
      mediaRecorderRef.current = new MediaRecorder(streamRef.current);

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        // Stop the live stream — no more audio feedback
        stopStream();

        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        setVideoBlob(blob);
        setVideoUrl(url);
      };

      mediaRecorderRef.current.onerror = () => {
        alert('Recording failed. Please try again.');
        setIsRecording(false);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      alert(`Recording failed: ${error.message}`);
    }
  };

  const switchCamera = () => {
    stopStream();
    setCurrentCamera(prev => prev === 'user' ? 'environment' : 'user');
  };

  const handleRetake = () => {
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoBlob(null);
    setVideoUrl(null);
    setRecordingTime(0);
    // startStream will be called by the useEffect since currentCamera didn't change,
    // so call it directly here
    startStream();
  };

  const handleSubmit = () => {
    if (videoBlob && onVideoReady) {
      onVideoReady(videoBlob, videoUrl);
    }
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    return `${m}:${String(s % 60).padStart(2, '0')}`;
  };

  if (cameraAccess === 'denied') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <AlertCircle size={48} style={{ color: '#ff6b6b', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Camera Access Needed</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          Please allow camera access to record your skill demonstration.
        </p>
        <button className="btn btn-primary" onClick={startStream}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  if (cameraAccess === 'error') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <AlertCircle size={48} style={{ color: '#ff6b6b', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>Camera Error</h3>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '20px' }}>
          Unable to access camera. Please check permissions and try again.
        </p>
        <button className="btn btn-primary" onClick={startStream}>
          <RefreshCw size={16} /> Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="card" style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '4px', color: '#1a1a1a' }}>
          {videoBlob ? 'Preview' : 'Record Your Skill'}
        </h2>
        <p style={{ fontSize: '14px', color: '#666', marginBottom: '12px' }}>
          {videoBlob
            ? 'Happy with it? Tap "Use This Video" to continue.'
            : <>Show us how you do: <strong>{skillTitle}</strong></>
          }
        </p>

        {!videoBlob && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {isRecording && (
              <div style={{
                width: '8px', height: '8px', background: '#ff6b6b',
                borderRadius: '50%', animation: 'pulse 1s infinite'
              }} />
            )}
            <span style={{ fontSize: '18px', fontWeight: '600', color: isRecording ? '#ff6b6b' : '#4facfe' }}>
              {formatTime(recordingTime)} / {formatTime(maxDuration)}
            </span>
          </div>
        )}
      </div>

      {/* Video area */}
      <div style={{
        position: 'relative', width: '100%', aspectRatio: '9/16',
        background: '#000', borderRadius: '16px', overflow: 'hidden',
        marginBottom: '20px',
        border: videoBlob ? '2px solid #4ecdc4' : streamReady ? '2px solid #4facfe' : '2px solid #ff6b6b'
      }}>

        {/* Live camera — shown when not in preview mode */}
        {!videoBlob && (
          <>
            {cameraAccess === 'pending' && (
              <div style={{
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)', color: 'white', textAlign: 'center'
              }}>
                <Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                <div style={{ fontSize: '14px' }}>Setting up camera...</div>
              </div>
            )}
            <video
              ref={liveVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                display: streamReady ? 'block' : 'none'
              }}
            />
            {isRecording && (
              <div style={{
                position: 'absolute', top: '12px', left: '12px',
                background: 'rgba(255,107,107,0.9)', color: 'white',
                padding: '6px 12px', borderRadius: '20px',
                fontSize: '12px', fontWeight: '600',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}>
                <div style={{
                  width: '6px', height: '6px', background: 'white',
                  borderRadius: '50%', animation: 'pulse 1s infinite'
                }} />
                REC
              </div>
            )}
            {streamReady && !isRecording && (
              <button
                onClick={switchCamera}
                style={{
                  position: 'absolute', top: '12px', right: '12px',
                  width: '40px', height: '40px', background: 'rgba(0,0,0,0.7)',
                  border: 'none', borderRadius: '50%', color: 'white',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <RefreshCw size={20} />
              </button>
            )}
          </>
        )}

        {/* Recorded preview — completely separate video element, plain src, no srcObject ever */}
        {videoBlob && videoUrl && (
          <video
            src={videoUrl}
            controls
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        )}
      </div>

      {/* Buttons */}
      {!videoBlob ? (
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={onCancel} style={{ flex: 1 }}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            disabled={!streamReady}
            style={{ flex: 2, opacity: streamReady ? 1 : 0.6 }}
          >
            {isRecording ? (
              <><Square size={18} /> Stop Recording</>
            ) : (
              <><Camera size={18} /> {streamReady ? 'Start Recording' : 'Loading...'}</>
            )}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '12px' }}>
          <button className="btn btn-outline" onClick={handleRetake} style={{ flex: 1 }}>
            <RotateCcw size={18} /> Retake
          </button>
          <button className="btn btn-primary" onClick={handleSubmit} style={{ flex: 2 }}>
            <CheckCircle size={18} /> Use This Video
          </button>
        </div>
      )}
    </div>
  );
}

export default VideoRecorder;
