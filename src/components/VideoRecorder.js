import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  Square, 
  Play, 
  RotateCcw, 
  CheckCircle,
  AlertCircle,
  Loader,
  RefreshCw,
  Volume2,
  VolumeX
} from 'lucide-react';

function VideoRecorder({ onVideoReady, onCancel, maxDuration = 30, skillTitle = "Your Skill" }) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [cameraAccess, setCameraAccess] = useState('pending');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [streamReady, setStreamReady] = useState(false);
  
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Detect iOS device
  useEffect(() => {
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
                (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    setIsIOSDevice(iOS);
    console.log('Device detection - iOS:', iOS);
  }, []);

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
      console.log('Requesting camera access...');
      
      // Minimal constraints for iOS compatibility
      const constraints = isIOSDevice ? {
        video: true,
        audio: false // Start without audio for iOS
      } : {
        video: { facingMode: 'user' },
        audio: true
      };

      console.log('Using constraints:', constraints);

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera access granted, stream:', stream);
      console.log('Video tracks:', stream.getVideoTracks());
      console.log('Audio tracks:', stream.getAudioTracks());
      
      streamRef.current = stream;
      setStreamReady(true);
      
      console.log('Stream ready, checking video element...');
      console.log('videoRef.current:', videoRef.current);
      
      // Set up video element with stream
      if (videoRef.current) {
        console.log('Setting up video element...');
        
        // Clear any existing source
        videoRef.current.srcObject = null;
        videoRef.current.src = '';
        
        // Set properties before assigning stream
        videoRef.current.muted = true;
        videoRef.current.autoplay = true;
        videoRef.current.playsInline = true;
        
        // For iOS, try using URL.createObjectURL as fallback
        if (isIOSDevice) {
          try {
            // Method 1: Direct srcObject assignment
            videoRef.current.srcObject = stream;
            console.log('iOS: Set srcObject directly');
          } catch (error) {
            console.log('iOS: srcObject failed, trying createObjectURL fallback');
            // This is deprecated but sometimes works on older iOS
            try {
              const url = URL.createObjectURL(stream);
              videoRef.current.src = url;
              console.log('iOS: Using createObjectURL fallback');
            } catch (urlError) {
              console.error('Both methods failed:', error, urlError);
            }
          }
        } else {
          videoRef.current.srcObject = stream;
        }
        
        // Add comprehensive event listeners
        const handleLoadedMetadata = () => {
          console.log('✅ Video metadata loaded');
          console.log('Video dimensions:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
          console.log('Video ready state:', videoRef.current.readyState);
          setVideoLoaded(true);
        };
        
        const handleCanPlay = () => {
          console.log('✅ Video can play');
          setVideoLoaded(true);
          // Force play
          videoRef.current.play().then(() => {
            console.log('✅ Video playing');
          }).catch(err => {
            console.log('❌ Play failed:', err);
          });
        };
        
        const handleLoadedData = () => {
          console.log('✅ Video data loaded');
          setVideoLoaded(true);
        };
        
        const handleError = (e) => {
          console.error('❌ Video error:', e);
          console.error('Video error details:', videoRef.current.error);
        };
        
        const handleLoadStart = () => {
          console.log('Video load started');
        };
        
        videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
        videoRef.current.addEventListener('canplay', handleCanPlay);
        videoRef.current.addEventListener('loadeddata', handleLoadedData);
        videoRef.current.addEventListener('error', handleError);
        videoRef.current.addEventListener('loadstart', handleLoadStart);
        
        // Clean up listeners function (but don't call it here)
        const cleanupListeners = () => {
          if (videoRef.current) {
            videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
            videoRef.current.removeEventListener('canplay', handleCanPlay);
            videoRef.current.removeEventListener('loadeddata', handleLoadedData);
            videoRef.current.removeEventListener('error', handleError);
            videoRef.current.removeEventListener('loadstart', handleLoadStart);
          }
        };
        
        // Store cleanup function for later use
        videoRef.current.cleanupListeners = cleanupListeners;
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
    console.log('Stopping camera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log('Stopping track:', track.kind);
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.src = '';
    }
    setVideoLoaded(false);
    setStreamReady(false);
  };

  const handleStartRecording = () => {
    if (!streamRef.current) {
      alert('Camera not ready. Please try again.');
      return;
    }

    // Simple recording for iOS - no codec specification
    console.log('Starting recording...');
    chunksRef.current = [];
    
    try {
      // Use minimal options for iOS compatibility
      const options = {};
      
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('Recording data available:', event.data.size);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('Recording stopped, creating blob...');
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        console.log('Video blob created:', blob.size, 'bytes');
        setVideoBlob(blob);
        
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        console.log('Video URL created for playback');
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        alert('Recording failed. Please try again.');
        setIsRecording(false);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      console.log('Recording started successfully');
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert(`Recording failed: ${error.message}`);
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      console.log('Stopping recording...');
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

        {/* Debug info */}
        <div style={{ 
          fontSize: '10px', 
          color: '#666', 
          marginTop: '8px'
        }}>
          Stream: {streamReady ? '✅' : '❌'} • Video: {videoLoaded ? '✅' : '❌'} • {isIOSDevice ? 'iOS' : 'Desktop'}
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
        {/* Show different messages based on state */}
        {!streamReady && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            textAlign: 'center'
          }}>
            <Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
            <div style={{ fontSize: '14px' }}>Connecting to camera...</div>
          </div>
        )}

        {streamReady && !videoLoaded && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            textAlign: 'center'
          }}>
            <AlertCircle size={32} style={{ marginBottom: '8px' }} />
            <div style={{ fontSize: '14px' }}>Video loading issue</div>
            <div style={{ fontSize: '12px', marginTop: '4px' }}>Check console for details</div>
          </div>
        )}

        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={videoBlob ? isMuted : true}
          src={videoBlob ? videoUrl : undefined}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: videoLoaded || videoBlob ? 'block' : 'none'
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
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
            disabled={!streamReady}
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
                {streamReady ? 'Start Recording' : 'Camera Loading...'}
              </>
            )}
          </button>
        </div>
      ) : (
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
        </div>
      )}
    </div>
  );
}

export default VideoRecorder;
