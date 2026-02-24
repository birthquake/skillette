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
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [streamReady, setStreamReady] = useState(false);
  const [currentCamera, setCurrentCamera] = useState('user');
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setVideoLoaded(false);
    setStreamReady(false);
  }, []);

  const requestCameraAccess = useCallback(async () => {
    try {
      const constraints = {
        video: { facingMode: currentCamera },
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      setStreamReady(true);
      setCameraAccess('granted');
    } catch (error) {
      console.error('Camera access error:', error);
      if (error.name === 'NotAllowedError') {
        setCameraAccess('denied');
      } else {
        setCameraAccess('error');
      }
    }
  }, [currentCamera]);

  const handleStopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }, [isRecording]);

  // Request camera access when component mounts or camera switches
  useEffect(() => {
    requestCameraAccess();
    return () => {
      stopCamera();
    };
  }, [requestCameraAccess, stopCamera]);

  // Set up video element once stream is ready
  useEffect(() => {
    if (streamReady && videoRef.current && !videoLoaded) {
      setupVideoElement();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamReady, videoLoaded]);

  // Recording timer — auto-stops when maxDuration is reached
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
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording, maxDuration, handleStopRecording]);

  const setupVideoElement = () => {
    if (!videoRef.current || !streamRef.current) return;

    const video = videoRef.current;
    const stream = streamRef.current;

    // Fully reset the video element before assigning a new stream
    video.pause();
    video.srcObject = null;
    video.load();

    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;

    const onReady = () => {
      setVideoLoaded(true);
      video.removeEventListener('loadedmetadata', onReady);
      video.removeEventListener('canplay', onReady);
    };

    video.addEventListener('loadedmetadata', onReady);
    video.addEventListener('canplay', onReady);

    try {
      video.srcObject = stream;
      video.play().catch(err => console.log('Play failed:', err));
    } catch (error) {
      console.error('Failed to assign stream to video:', error);
    }
  };

  const handleStartRecording = () => {
    if (!streamRef.current) {
      alert('Camera not ready. Please try again.');
      return;
    }

    chunksRef.current = [];
    
    try {
      mediaRecorderRef.current = new MediaRecorder(streamRef.current);

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setVideoBlob(blob);
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        alert('Recording failed. Please try again.');
        setIsRecording(false);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert(`Recording failed: ${error.message}`);
    }
  };

  const handleRetake = () => {
    setVideoBlob(null);
    setRecordingTime(0);
    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
    }
    setVideoUrl(null);
    setVideoLoaded(false);
    requestCameraAccess();
  };

  const handleSubmit = () => {
    if (videoBlob && onVideoReady) {
      onVideoReady(videoBlob, videoUrl);
    }
  };

  const switchCamera = () => {
    // Stop the existing stream first
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setVideoLoaded(false);
    setStreamReady(false);
    // Changing currentCamera triggers the useEffect which calls
    // requestCameraAccess — don't call it directly here or you get two
    // simultaneous requests racing each other
    setCurrentCamera(prev => prev === 'user' ? 'environment' : 'user');
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (cameraAccess === 'denied') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <AlertCircle size={48} style={{ color: '#ff6b6b', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
          Camera Access Needed
        </h3>
        <p style={{ fontSize: '14px', color: '#666666', marginBottom: '20px' }}>
          Please allow camera access to record your skill demonstration.
        </p>
        <button className="btn btn-primary" onClick={requestCameraAccess}>
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

  if (cameraAccess === 'error') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <AlertCircle size={48} style={{ color: '#ff6b6b', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
          Camera Error
        </h3>
        <p style={{ fontSize: '14px', color: '#666666', marginBottom: '20px' }}>
          Unable to access camera. Please check permissions and try again.
        </p>
        <button className="btn btn-primary" onClick={requestCameraAccess}>
          <RefreshCw size={16} />
          Try Again
        </button>
      </div>
    );
  }

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
      </div>

      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '9/16',
        background: '#000',
        borderRadius: '16px',
        overflow: 'hidden',
        marginBottom: '20px',
        border: videoLoaded ? '2px solid #4facfe' : '2px solid #ff6b6b'
      }}>
        {(!streamReady || !videoLoaded) && !videoBlob && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            textAlign: 'center'
          }}>
            <Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
            <div style={{ fontSize: '14px' }}>
              {!streamReady ? 'Getting camera...' : 'Loading video...'}
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={!videoBlob}
          src={videoBlob ? videoUrl : undefined}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: videoLoaded || videoBlob ? 'block' : 'none'
          }}
        />

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

        {streamReady && videoLoaded && !isRecording && (
          <button
            onClick={switchCamera}
            style={{
              position: 'absolute',
              top: '12px',
              right: '12px',
              width: '40px',
              height: '40px',
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
            <RefreshCw size={20} />
          </button>
        )}
      </div>

      {!videoBlob ? (
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
            disabled={!streamReady || !videoLoaded}
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
                {streamReady && videoLoaded ? 'Start Recording' : 'Loading...'}
              </>
            )}
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
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
      )}
    </div>
  );
}

export default VideoRecorder;
