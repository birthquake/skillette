import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader,
  Type,
  Tag,
  Clock,
  BarChart2
} from 'lucide-react';
import { createSkill } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

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

function AddSkillScreen({ onNavigate, onSkillAdded }) {
  const { currentUser, incrementSkillsTaught } = useAuth();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: '',
    duration: '',
    thumbnail: '',
    tips: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
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
    if (!validate()) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const skillData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category: formData.category,
        difficulty: formData.difficulty,
        duration: formData.duration,
        thumbnail: formData.thumbnail,
        tips: formData.tips.trim(),
        author: currentUser.displayName || 'Anonymous'
      };

      const result = await createSkill(currentUser.uid, skillData);

      if (result.success) {
        await incrementSkillsTaught();
        setSubmitSuccess(true);
        if (onSkillAdded) onSkillAdded(result.skill);
      } else {
        setSubmitError('Something went wrong. Please try again.');
      }
    } catch (error) {
      setSubmitError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (submitSuccess) {
    return (
      <div className="fade-in" style={{
        paddingTop: '60px',
        paddingBottom: '20px',
        textAlign: 'center',
        color: 'white'
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
            style={{ background: 'white', color: '#667eea' }}
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

      {/* Header */}
      <div className="card">
        <button
          onClick={() => onNavigate('profile')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: '#667eea',
            fontSize: '14px',
            fontWeight: '600',
            marginBottom: '16px',
            padding: '0'
          }}
        >
          <ArrowLeft size={16} />
          Back to Profile
        </button>
        <h1 style={{
          fontSize: '24px',
          fontWeight: '700',
          marginBottom: '8px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Add a Skill
        </h1>
        <p style={{ fontSize: '14px', color: '#666666' }}>
          Share something you know — others will learn it and teach you something back.
        </p>
      </div>

      {/* Skill Name */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Type size={16} style={{ color: '#667eea' }} />
          <label style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
            Skill Name
          </label>
        </div>
        <input
          type="text"
          placeholder="e.g. How to fold a paper crane"
          value={formData.title}
          onChange={(e) => handleChange('title', e.target.value)}
          maxLength={60}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: formErrors.title ? '2px solid #ff6b6b' : '1px solid #e2e8f0',
            fontSize: '16px',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          {formErrors.title
            ? <span style={{ color: '#ff6b6b', fontSize: '12px' }}>{formErrors.title}</span>
            : <span />
          }
          <span style={{ fontSize: '12px', color: '#999' }}>{formData.title.length}/60</span>
        </div>
      </div>

      {/* Description */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Tag size={16} style={{ color: '#667eea' }} />
          <label style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
            Description
          </label>
        </div>
        <textarea
          placeholder="Briefly describe what people will learn to do..."
          value={formData.description}
          onChange={(e) => handleChange('description', e.target.value)}
          maxLength={200}
          rows={3}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: formErrors.description ? '2px solid #ff6b6b' : '1px solid #e2e8f0',
            fontSize: '16px',
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box'
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
          {formErrors.description
            ? <span style={{ color: '#ff6b6b', fontSize: '12px' }}>{formErrors.description}</span>
            : <span />
          }
          <span style={{ fontSize: '12px', color: '#999' }}>{formData.description.length}/200</span>
        </div>
      </div>

      {/* Category */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
          <Tag size={16} style={{ color: '#667eea' }} />
          <label style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
            Category
          </label>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '8px'
        }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => handleChange('category', cat.name)}
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                border: formData.category === cat.name
                  ? '2px solid #667eea'
                  : '1px solid #e2e8f0',
                background: formData.category === cat.name ? '#667eea10' : 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
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
          <label style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
            Difficulty
          </label>
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
                  flex: 1,
                  padding: '12px',
                  borderRadius: '8px',
                  border: selected ? `2px solid ${colors[level]}` : '1px solid #e2e8f0',
                  background: selected ? `${colors[level]}20` : 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
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
          <label style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
            How long to learn?
          </label>
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '8px'
        }}>
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => handleChange('duration', d)}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: formData.duration === d
                  ? '2px solid #667eea'
                  : '1px solid #e2e8f0',
                background: formData.duration === d ? '#667eea10' : 'white',
                cursor: 'pointer',
                fontSize: '14px',
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
          <label style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
            Pick an Emoji
          </label>
        </div>
        <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
          This will be your skill's icon in the app.
        </p>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1fr)',
          gap: '8px'
        }}>
          {THUMBNAILS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleChange('thumbnail', emoji)}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                border: formData.thumbnail === emoji
                  ? '2px solid #667eea'
                  : '1px solid #e2e8f0',
                background: formData.thumbnail === emoji ? '#667eea10' : 'white',
                cursor: 'pointer',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease'
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

      {/* Tips (optional) */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <label style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a' }}>
            Tips <span style={{ fontWeight: '400', color: '#999' }}>(optional)</span>
          </label>
        </div>
        <p style={{ fontSize: '13px', color: '#666', marginBottom: '12px' }}>
          Any advice to help others master this faster?
        </p>
        <textarea
          placeholder="e.g. Start slowly, the key is wrist rotation not arm strength..."
          value={formData.tips}
          onChange={(e) => handleChange('tips', e.target.value)}
          maxLength={300}
          rows={3}
          style={{
            width: '100%',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            fontSize: '16px',
            outline: 'none',
            resize: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box'
          }}
        />
        <div style={{ textAlign: 'right', marginTop: '6px' }}>
          <span style={{ fontSize: '12px', color: '#999' }}>{formData.tips.length}/300</span>
        </div>
      </div>

      {/* Error Message */}
      {submitError && (
        <div style={{
          background: '#fff5f5',
          border: '1px solid #ff6b6b',
          borderRadius: '8px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: '#ff6b6b',
          fontSize: '14px',
          margin: '0 0 16px'
        }}>
          <AlertCircle size={16} />
          {submitError}
        </div>
      )}

      {/* Submit Button */}
      <button
        className="btn btn-primary btn-full"
        onClick={handleSubmit}
        disabled={isSubmitting}
        style={{ opacity: isSubmitting ? 0.7 : 1 }}
      >
        {isSubmitting ? (
          <>
            <Loader size={18} style={{ animation: 'spin 1s linear infinite' }} />
            Saving Skill...
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
