import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader,
  Type,
  Tag,
  Clock,
  BarChart2,
  Video,
  Upload,
  X,
  Play
  Pencil
} from 'lucide-react';
import { createSkill, updateSkill, uploadVideo, trackEvent } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import VideoRecorder from './VideoRecorder';

const CATEGORIES = [
  { name: 'Life Hacks', emoji: '💡' },
  { name: 'Crafts', emoji: '🎨' },
  { name: 'Cooking', emoji: '👨‍🍳' },
  { name: 'Magic', emoji: '🎩' },
  { name: 'Music', emoji: '🎵' },
  { name: 'Sports', emoji: '⚽' },
  { name: 'Wellness', emoji: '🧘' },
  { name: 'Puzzles', emoji: '🧩' },
  { name: 'Life Skills', emoji: '🛠️' },
  { name: 'Other', emoji: '⭐' }
];

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];
const DURATIONS = ['1 min', '2 min', '3 min', '5 min', '8 min', '10 min'];
const THUMBNAILS = [
  '✈️', '👌', '🕊️', '👔', '🃏', '🧩', '☕', '🧘',
  '🎸', '🎯', '🍕', '🌱', '📚', '🎭', '🏆', '💫'
];

function AddSkillScreen({ onNavigate, onSkillAdded, skillToEdit }) {
  const { currentUser, incrementSkillsTaught } = useAuth();
  const fileInputRef = useRef(null);

  const isEditMode = !!skillToEdit;

  const [formData, setFormData] = useState({
    title:       skillToEdit?.title       || '',
    description: skillToEdit?.description || '',
    category:    skillToEdit?.category    || '',
    difficulty:  skillToEdit?.difficulty  || '',
    duration:    skillToEdit?.duration    || '',
    thumbnail:   skillToEdit?.thumbnail   || '',
    tips:        skillToEdit?.tips        || ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Video state
  const [showRecorder, setShowRecorder] = useState(false);
  const [videoBlob, setVideoBlob] = useState(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Called when VideoRecorder finishes
  const handleVideoRecorded = (blob, url) => {
    setVideoBlob(blob);
    setVideoPreviewUrl(url);
    setShowRecorder(false);
  };

  // Called when user picks a file from camera roll
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setSubmitError('Please select a video file.');
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setSubmitError('Video must be under 50MB.');
      return;
    }

    setSubmitError('');
    const blob = new Blob([file], { type: file.type });
    const url = URL.createObjectURL(file);
    setVideoBlob(blob);
    setVideoPreviewUrl(url);
  };

  const handleRemoveVideo = () => {
    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoBlob(null);
    setVideoPreviewUrl(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Skill name is required';
    else if (formData.title.trim().length < 3) errors.title = 'Name must be at least 3 characters';
    if (!formData.description.trim()) errors.description = 'Description is required';
    if (!formData.category) errors.category = 'Please select a category';
    if (!formData.difficulty) errors.difficulty = 'Please select a difficulty';
    if (!formData.duration) errors.duration = 'Please select a duration';
    if (!formData.thumbnail) errors.thumbnail = 'Please pick an emoji for your skill';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      // Scroll to top so user sees the validation errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      let tutorialVideoUrl = null;

      // Upload tutorial video first if one was provided
      if (videoBlob) {
        const videoResult = await uploadVideo(
          videoBlob,
          currentUser.uid,
          `tutorial_${Date.now()}`,
          (progress) => setUploadProgress(progress)
        );
        if (videoResult.success) {
          tutorialVideoUrl = videoResult.url;
        } else {
          setSubmitError('Video upload failed. Please try again.');
          setIsSubmitting(false);
          return;
        }
      }

      const skillData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        difficulty: formData.difficulty,
        duration: formData.duration,
        thumbnail: formData.thumbnail,
        tips: formData.tips.trim(),
        author: currentUser.displayName || 'Anonymous',
        tutorialVideoUrl
      };

      let result;
      if (isEditMode) {
        result = await updateSkill(skillToEdit.id, skillData);
        if (result.success) {
          setSubmitSuccess(true);
          trackEvent('skill_edited', { category: formData.category });
          if (onSkillAdded) onSkillAdded({ ...skillToEdit, ...skillData });
        } else {
          setSubmitError('Something went wrong. Please try again.');
        }
      } else {
        result = await createSkill(currentUser.uid, skillData);
        if (result.success) {
          await incrementSkillsTaught();
          setSubmitSuccess(true);
          trackEvent('skill_added', { category: formData.category, difficulty: formData.difficulty });
          if (onSkillAdded) onSkillAdded(result.skill);
        } else {
          setSubmitError('Something went wrong. Please try again.');
        }
      }
    } catch (error) {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show inline video recorder
  if (showRecorder) {
    return (
      <div className="fade-in" style={{ paddingTop: '20px', paddingBottom: '40px' }}>
        <div className="card">
          <button
            onClick={() => setShowRecorder(false)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '8px',
              color: '#667eea', fontSize: '14px', fontWeight: '600',
              marginBottom: '16px', padding: '0'
            }}
          >
            <ArrowLeft size={16} />
            Back to Form
          </button>
          <h2 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '4px', color: '#f0f0f5' }}>
            Record Tutorial Video
          </h2>
          <p style={{ fontSize: '13px', color: '#8b8fa8' }}>
            Keep it under 30 seconds — show the key steps clearly.
          </p>
        </div>
        <VideoRecorder
          onVideoReady={handleVideoRecorded}
          onCancel={() => setShowRecorder(false)}
          maxDuration={30}
          skillTitle={formData.title || 'Your Skill'}
        />
      </div>
    );
  }

  // Success screen
  if (submitSuccess) {
    return (
      <div className="fade-in" style={{
        paddingTop: '60px', paddingBottom: '20px',
        textAlign: 'center', color: 'white'
      }}>
        <div style={{ fontSize: '64px', marginBottom: '20px' }}>🎉</div>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '12px' }}>
          Skill Added!
        </h1>
        <p style={{ fontSize: '16px', opacity: 0.9, marginBottom: '32px' }}>
          <strong>{formData.title}</strong> is now in the pool for others to learn.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxWidth: '300px', margin: '0 auto' }}>
          <button
            className="btn btn-primary"
            onClick={() => onNavigate('roulette')}
            style={{ background: '#1a1d27', color: '#667eea' }}
          >
            Spin the Roulette
          </button>
          <button
            className="btn btn-outline"
            onClick={() => onNavigate('profile')}
            style={{ borderColor: 'white', color: 'white' }}
          >
            Back to Profile
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ paddingTop: '20px', paddingBottom: '40px' }}>

      {/* Validation summary — shown when submit is tapped with missing fields */}
      {Object.keys(formErrors).length > 0 && (
        <div style={{
          background: '#2a1a1f', border: '1px solid #ff6b6b',
          borderRadius: '12px', padding: '14px 16px', marginBottom: '16px',
          display: 'flex', alignItems: 'center', gap: '10px'
        }}>
          <AlertCircle size={18} style={{ color: '#ff6b6b', flexShrink: 0 }} />
          <p style={{ fontSize: '14px', color: '#ff6b6b', margin: 0 }}>
            Please fill in all required fields before submitting.
          </p>
        </div>
      )}

      {/* Header */}
      <div className="card">
        <button
          onClick={() => onNavigate('profile')}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px',
            color: '#667eea', fontSize: '14px', fontWeight: '600',
            marginBottom: '16px', padding: '0'
          }}
        >
          <ArrowLeft size={16} />
          Back to Profile
        </button>
        <h1 style={{
          fontSize: '24px', fontWeight: '700', marginBottom: '8px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
        }}>
          Add a Skill
        </h1>

      </div>

      {/* Skill Name */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Type size={16} style={{ color: '#667eea' }} />
          <label style={{ fontSize: '16px', fontWeight: '600', color: '#f0f0f5' }}>Skill Name</label>
        </div>
        <input
          type="text"
          placeholder="e.g. How to fold a paper crane"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          maxLength={60}
          style={{
            width: '100%', padding: '12px', borderRadius: '8px',
            border: formErrors.title ? '2px solid #ff6b6b' : '1px solid #e2e8f0',
            fontSize: '16px', outline: 'none', boxSizing: 'border-box'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          {formErrors.title
            ? <span style={{ color: '#ff6b6b', fontSize: '12px' }}>{formErrors.title}</span>
            : <span />}
          <span style={{ fontSize: '12px', color: '#555870' }}>{formData.title.length}/60</span>
        </div>
      </div>

      {/* Description */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Tag size={16} style={{ color: '#667eea' }} />
          <label style={{ fontSize: '16px', fontWeight: '600', color: '#f0f0f5' }}>Description</label>
        </div>
        <textarea
          placeholder="Briefly describe what people will learn to do..."
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          maxLength={200}
          rows={3}
          style={{
            width: '100%', padding: '12px', borderRadius: '8px',
            border: formErrors.description ? '2px solid #ff6b6b' : '1px solid #e2e8f0',
            fontSize: '16px', outline: 'none', resize: 'none',
            fontFamily: 'inherit', boxSizing: 'border-box'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          {formErrors.description
            ? <span style={{ color: '#ff6b6b', fontSize: '12px' }}>{formErrors.description}</span>
            : <span />}
          <span style={{ fontSize: '12px', color: '#555870' }}>{formData.description.length}/200</span>
        </div>
      </div>

      {/* Category */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Tag size={16} style={{ color: '#667eea' }} />
          <label style={{ fontSize: '16px', fontWeight: '600', color: '#f0f0f5' }}>Category</label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => handleChange('category', cat.name)}
              style={{
                padding: '10px 12px', borderRadius: '8px',
                border: formData.category === cat.name ? '2px solid #667eea' : '1px solid #e2e8f0',
                background: formData.category === cat.name ? '#667eea10' : 'white',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
                fontSize: '14px',
                fontWeight: formData.category === cat.name ? '600' : '400',
                color: formData.category === cat.name ? '#667eea' : '#1a1a1a',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{cat.emoji}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
        {formErrors.category && (
          <span style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '8px', display: 'block' }}>
            {formErrors.category}
          </span>
        )}
      </div>

      {/* Difficulty */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <BarChart2 size={16} style={{ color: '#667eea' }} />
          <label style={{ fontSize: '16px', fontWeight: '600', color: '#f0f0f5' }}>Difficulty</label>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {DIFFICULTIES.map((level) => {
            const colors = { Easy: '#4ecdc4', Medium: '#f5a623', Hard: '#ff6b6b' };
            const selected = formData.difficulty === level;
            return (
              <button
                key={level}
                onClick={() => handleChange('difficulty', level)}
                style={{
                  flex: 1, padding: '12px', borderRadius: '8px',
                  border: selected ? `2px solid ${colors[level]}` : '1px solid #e2e8f0',
                  background: selected ? `${colors[level]}20` : 'white',
                  cursor: 'pointer', fontSize: '14px',
                  fontWeight: selected ? '600' : '400',
                  color: selected ? colors[level] : '#666666',
                  transition: 'all 0.15s ease'
                }}
              >
                {level}
              </button>
            );
          })}
        </div>
        {formErrors.difficulty && (
          <span style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '8px', display: 'block' }}>
            {formErrors.difficulty}
          </span>
        )}
      </div>

      {/* Duration */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Clock size={16} style={{ color: '#667eea' }} />
          <label style={{ fontSize: '16px', fontWeight: '600', color: '#f0f0f5' }}>How long to learn?</label>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => handleChange('duration', d)}
              style={{
                padding: '10px', borderRadius: '8px',
                border: formData.duration === d ? '2px solid #667eea' : '1px solid #e2e8f0',
                background: formData.duration === d ? '#667eea10' : 'white',
                cursor: 'pointer', fontSize: '14px',
                fontWeight: formData.duration === d ? '600' : '400',
                color: formData.duration === d ? '#667eea' : '#1a1a1a',
                transition: 'all 0.15s ease'
              }}
            >
              {d}
            </button>
          ))}
        </div>
        {formErrors.duration && (
          <span style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '8px', display: 'block' }}>
            {formErrors.duration}
          </span>
        )}
      </div>

      {/* Thumbnail Emoji */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <label style={{ fontSize: '16px', fontWeight: '600', color: '#f0f0f5' }}>Pick an Emoji</label>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '6px' }}>
          {THUMBNAILS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleChange('thumbnail', emoji)}
              style={{
                width: '100%', aspectRatio: '1 / 1', borderRadius: '8px',
                border: formData.thumbnail === emoji ? '2px solid #7c6af7' : '1px solid rgba(255,255,255,0.1)',
                background: formData.thumbnail === emoji ? 'rgba(124,106,247,0.2)' : '#252838',
                cursor: 'pointer', fontSize: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s ease', padding: 0
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
        {formErrors.thumbnail && (
          <span style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '8px', display: 'block' }}>
            {formErrors.thumbnail}
          </span>
        )}
      </div>

      {/* Tips */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <label style={{ fontSize: '16px', fontWeight: '600', color: '#f0f0f5' }}>
            Tips <span style={{ fontWeight: '400', color: '#555870' }}>(optional)</span>
          </label>
        </div>

        <textarea
          placeholder="e.g. Start slowly, the key is wrist rotation not arm strength..."
          value={formData.tips}
          onChange={(e) => handleChange('tips', e.target.value)}
          maxLength={300}
          rows={3}
          style={{
            width: '100%', padding: '12px', borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.07)', fontSize: '16px', outline: 'none',
            resize: 'none', fontFamily: 'inherit', background: '#252838', color: '#f0f0f5', boxSizing: 'border-box'
          }}
        />
        <div style={{ textAlign: 'right', marginTop: '6px' }}>
          <span style={{ fontSize: '12px', color: '#555870' }}>{formData.tips.length}/300</span>
        </div>
      </div>

      {/* Tutorial Video */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Video size={16} style={{ color: '#667eea' }} />
          <label style={{ fontSize: '16px', fontWeight: '600', color: '#f0f0f5' }}>
            Tutorial Video <span style={{ fontWeight: '400', color: '#555870' }}>(optional)</span>
          </label>
        </div>
        <p style={{ fontSize: '12px', color: '#555870', marginBottom: '16px' }}>
          Max 30 seconds
        </p>

        {!videoBlob && (
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              className="btn btn-outline"
              onClick={() => setShowRecorder(true)}
              style={{ flex: 1, flexDirection: 'column', gap: '6px', padding: '16px 8px', height: 'auto' }}
            >
              <Video size={22} style={{ color: '#667eea' }} />
              <span style={{ fontSize: '13px' }}>Record Now</span>
            </button>
            <button
              className="btn btn-outline"
              onClick={() => fileInputRef.current?.click()}
              style={{ flex: 1, flexDirection: 'column', gap: '6px', padding: '16px 8px', height: 'auto' }}
            >
              <Upload size={22} style={{ color: '#667eea' }} />
              <span style={{ fontSize: '13px' }}>Upload File</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </div>
        )}

        {videoBlob && videoPreviewUrl && (
          <div>
            <div style={{
              position: 'relative', borderRadius: '12px', overflow: 'hidden',
              background: '#000', marginBottom: '12px',
              aspectRatio: '9/16', maxHeight: '280px'
            }}>
              <video
                src={videoPreviewUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                controls
                playsInline
              />
              <button
                onClick={handleRemoveVideo}
                style={{
                  position: 'absolute', top: '8px', right: '8px',
                  width: '32px', height: '32px',
                  background: 'rgba(0,0,0,0.7)', border: 'none',
                  borderRadius: '50%', color: 'white', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              color: '#4ecdc4', fontSize: '14px', fontWeight: '600'
            }}>
              <Play size={14} />
              Video ready — will upload when you submit
            </div>

            {isSubmitting && uploadProgress > 0 && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ fontSize: '12px', color: '#8b8fa8' }}>Uploading video...</span>
                  <span style={{ fontSize: '12px', color: '#8b8fa8' }}>{uploadProgress}%</span>
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
          </div>
        )}
      </div>

      {/* Error Message */}
      {submitError && (
        <div style={{
          background: '#2a1a1f', border: '1px solid #ff6b6b',
          borderRadius: '8px', padding: '12px 16px',
          display: 'flex', alignItems: 'center', gap: '8px',
          color: '#ff6b6b', fontSize: '14px', margin: '0 0 16px'
        }}>
          <AlertCircle size={16} />
          {submitError}
        </div>
      )}

      {/* Submit */}
      <button
        className="btn btn-primary btn-full"
        onClick={handleSubmit}
        disabled={isSubmitting}
        style={{ opacity: isSubmitting ? 0.7 : 1 }}
      >
        {isSubmitting ? (
          <>
            <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
            {uploadProgress > 0 && uploadProgress < 100
              ? `Uploading Video... ${uploadProgress}%`
              : 'Saving Skill...'}
          </>
        ) : (
          <>
            <CheckCircle size={18} />
            Add Skill to Pool
          </>
        )}
      </button>

    </div>
  );
}

export default AddSkillScreen;
