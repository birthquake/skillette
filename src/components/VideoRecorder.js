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
      
      // Very simple constraints for iOS
      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: true
      };

      // Even simpler for iOS
      if (isIOSDevice) {
        constraints.video = {
          facingMode: 'user'
        };
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera access granted, stream:', stream);
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        console.log('Setting video srcObject...');
        videoRef.current.srcObject = stream;
        
        // Force video properties for iOS
        videoRef.current.muted = true;
        videoRef.current.playsInline = true;
        videoRef.current.autoplay = true;
        
        // Listen for video events
        videoRef.current.onloadedmetadata = () => {
          console.log('Video metadata loaded');
          setVideoLoaded(true);
          
          // Force play on iOS
          videoRef.current.play().then(() => {
            console.log('Video playing successfully');
          }).catch(error => {
            console.error('Video play failed:', error);
          });
        };

        videoRef.current.onloadeddata = () => {
          console.log('Video data loaded');
        };

        videoRef.current.oncanplay = () => {
          console.log('Video can play');
        };

        videoRef.current.onerror = (e) => {
          console.error('Video element error:', e);
        };
        
        // Trigger load
        videoRef.current.load();
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
    }
    setVideoLoaded(false);
  };

  const checkMediaRecorderSupport = () => {
    if (!window.MediaRecorder) {
      return { supported: false, reason: 'MediaRecorder not supported' };
    }

    if (isIOSDevice) {
      const supportedTypes = [
        'video/mp4',
        'video/mp4;codecs=h264',
        'video/webm',
        'video/webm;codecs=vp8'
      ];

      const workingType = supportedTypes.find(type => 
        MediaRecorder.isTypeSupported(type)
      );

      console.log('iOS MediaRecorder support check:', { workingType, supportedTypes });

      return { 
        supported: !!workingType, 
        mimeType: workingType,
        reason: workingType ? null : 'No supported video formats on iOS'
      };
    }

    const preferredTypes = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];

    const workingType = preferredTypes.find(type => 
      MediaRecorder.isTypeSupported(type)
    );

    return { 
      supported: !!workingType, 
      mimeType: workingType || 'video/webm',
      reason: null
    };
  };

  const handleStartRecording = () => {
    if (!streamRef.current) {
      alert('Camera not ready. Please try again.');
      return;
    }

    const support = checkMediaRecorderSupport();
    
    if (!support.supported) {
      alert(`Video recording not supported: ${support.reason}`);
      return;
    }

    console.log('Starting recording with:', support.mimeType);
    chunksRef.current = [];
    
    try {
      const options = {};
      if (support.mimeType) {
        options.mimeType = support.mimeType;
      }

      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);

      mediaRecorderRef.current.ondataavailable = (event) => {
        console.log('Recording data available:', event.data.size);
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        console.log('Recording stopped, creating blob...');
        const mimeType = support.mimeType || 'video/webm';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        console.log('Video blob created:', blob.size, 'bytes');
        setVideoBlob(blob);
        
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        console.log('Video URL created:', url);
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        alert('Recording failed. Please try again.');
        setIsRecording(false);
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      alert(`Failed to start recording: ${error.message}`);
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

  const togglePlayback = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
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

  if (cameraAccess === 'denied') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <AlertCircle size={48} style={{ color: '#ff6b6b', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
          Camera Access Needed
        </h3>
        <p style={{ fontSize: '14px', color: '#666666', marginBottom: '20px' }}>
          Please allow camera access to record your skill demonstration.
          {isIOSDevice && (
            <><br /><strong>iOS users:</strong> Make sure to tap "Allow" when prompted.</>
          )}
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

  if (cameraAccess === 'error') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <AlertCircle size={48} style={{ color: '#ff6b6b', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
          Camera Error
        </h3>
        <p style={{ fontSize: '14px', color: '#666666', marginBottom: '20px' }}>
          Camera access failed. 
          {isIOSDevice && (
            <><br /><strong>iOS Safari:</strong> Try refreshing the page or using Chrome instead.</>
          )}
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

  if (cameraAccess === 'pending') {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
        <Loader size={48} style={{ color: '#667eea', marginBottom: '16px', animation: 'spin 1s linear infinite' }} />
        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '8px' }}>
          Setting up camera...
        </h3>
        <p style={{ fontSize: '14px', color: '#666666' }}>
          {isIOSDevice ? 'iOS detected - Please allow camera access when prompted' : 'Please allow camera access when prompted'}
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

        {/* Debug info for troubleshooting */}
        {isIOSDevice && (
          <div style={{ 
            fontSize: '10px', 
            color: '#666', 
            marginTop: '8px'
          }}>
            iOS • Camera: {cameraAccess} • Video: {videoLoaded ? 'loaded' : 'loading'}
          </div>
        )}
      </div>

      <div style={{
        position: 'relative',
        width: '100%',
        aspectRatio: '9/16',
        background: '#000',
        borderRadius: '16px',
        overflow: 'hidden',
        marginBottom: '20px'
      }}>
        {/* Show loading indicator if video not loaded */}
        {!videoLoaded && !videoBlob && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: 'white',
            textAlign: 'center'
          }}>
            <Loader size={32} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
            <div style={{ fontSize: '14px' }}>Loading camera...</div>
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
            transform: isIOSDevice ? 'scaleX(-1)' : 'none' // Mirror for iOS front camera
          }}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={() => {
            console.log('Video metadata loaded event');
            setVideoLoaded(true);
          }}
        />

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
            {isIOSDevice && <li><strong>iOS:</strong> Try Chrome if Safari has issues</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

export default VideoRecorder;
