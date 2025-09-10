import React, { useState } from 'react';
import { LogIn, Loader, AlertCircle, Star, Users, Trophy, Target, Mail, Lock, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function LoginScreen() {
  const { signIn, signUp, loading, authError } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Please enter a valid email';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (isSignUp) {
      if (!formData.displayName) {
        errors.displayName = 'Name is required';
      }
      
      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      let result;
      
      if (isSignUp) {
        result = await signUp(formData.email, formData.password, formData.displayName);
      } else {
        result = await signIn(formData.email, formData.password);
      }
      
      if (!result.success) {
        console.error('Auth failed:', result.error);
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setFormErrors({});
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      displayName: ''
    });
  };

  return (
    <div style={{
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{
        maxWidth: '400px',
        width: '100%',
        color: 'white'
      }}>
        {/* Logo and Title */}
        <div style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            🎯
          </div>
          <h1 style={{
            fontSize: '32px',
            fontWeight: '700',
            marginBottom: '8px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            Skillette
          </h1>
          <p style={{
            fontSize: '16px',
            opacity: 0.9
          }}>
            Learn and teach skills through fun challenges
          </p>
        </div>

        {/* Auth Form */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '20px',
            textAlign: 'center'
          }}>
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Display Name (Sign Up Only) */}
            {isSignUp && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <User size={16} />
                  <label style={{ fontSize: '14px', fontWeight: '500' }}>
                    Name
                  </label>
                </div>
                <input
                  type="text"
                  name="displayName"
                  value={formData.displayName}
                  onChange={handleInputChange}
                  placeholder="Enter your name"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: formErrors.displayName ? '2px solid #ff6b6b' : '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
                {formErrors.displayName && (
                  <p style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>
                    {formErrors.displayName}
                  </p>
                )}
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <Mail size={16} />
                <label style={{ fontSize: '14px', fontWeight: '500' }}>
                  Email
                </label>
              </div>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: formErrors.email ? '2px solid #ff6b6b' : '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
              {formErrors.email && (
                <p style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div style={{ marginBottom: isSignUp ? '16px' : '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '8px'
              }}>
                <Lock size={16} />
                <label style={{ fontSize: '14px', fontWeight: '500' }}>
                  Password
                </label>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Enter your password"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: formErrors.password ? '2px solid #ff6b6b' : '1px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.1)',
                  color: 'white',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
              {formErrors.password && (
                <p style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Confirm Password (Sign Up Only) */}
            {isSignUp && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '8px'
                }}>
                  <Lock size={16} />
                  <label style={{ fontSize: '14px', fontWeight: '500' }}>
                    Confirm Password
                  </label>
                </div>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '8px',
                    border: formErrors.confirmPassword ? '2px solid #ff6b6b' : '1px solid rgba(255,255,255,0.3)',
                    background: 'rgba(255,255,255,0.1)',
                    color: 'white',
                    fontSize: '16px',
                    outline: 'none'
                  }}
                />
                {formErrors.confirmPassword && (
                  <p style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '4px' }}>
                    {formErrors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* Error Message */}
            {authError && (
              <div style={{
                background: 'rgba(255,107,107,0.2)',
                border: '1px solid rgba(255,107,107,0.3)',
                borderRadius: '8px',
                padding: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '14px'
              }}>
                <AlertCircle size={16} />
                <span>{authError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || isSubmitting}
              style={{
                width: '100%',
                padding: '12px 24px',
                background: 'white',
                color: '#667eea',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading || isSubmitting ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.2s ease',
                opacity: loading || isSubmitting ? 0.7 : 1,
                marginBottom: '16px'
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  {isSignUp ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                <>
                  <LogIn size={16} />
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </>
              )}
            </button>

            {/* Toggle Mode */}
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '14px', opacity: 0.8 }}>
                {isSignUp ? 'Already have an account?' : "Don't have an account?"}
              </span>
              <button
                type="button"
                onClick={toggleMode}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'white',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginLeft: '4px',
                  textDecoration: 'underline'
                }}
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
              </button>
            </div>
          </form>
        </div>

        {/* Features Preview */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '16px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px',
            fontSize: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Target size={14} />
              <span>Skill Matching</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Users size={14} />
              <span>Video Challenges</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Star size={14} />
              <span>Level System</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Trophy size={14} />
              <span>Achievements</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
