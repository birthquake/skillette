import React, { useState } from 'react';
import { LogIn, Loader, AlertCircle, Star, Users, Trophy, Target } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

function LoginScreen() {
  const { signIn, loading, authError } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const result = await signIn();
      if (!result.success) {
        console.error('Sign in failed:', result.error);
      }
    } catch (error) {
      console.error('Sign in error:', error);
    } finally {
      setIsSigningIn(false);
    }
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
        textAlign: 'center',
        color: 'white'
      }}>
        {/* Logo and Title */}
        <div style={{
          marginBottom: '40px'
        }}>
          <div style={{
            fontSize: '64px',
            marginBottom: '16px',
            animation: 'bounce 2s ease-in-out infinite'
          }}>
            🎯
          </div>
          <h1 style={{
            fontSize: '36px',
            fontWeight: '700',
            marginBottom: '8px',
            textShadow: '0 2px 4px rgba(0,0,0,0.3)'
          }}>
            Skillette
          </h1>
          <p style={{
            fontSize: '18px',
            opacity: 0.9,
            marginBottom: '8px'
          }}>
            Learn and teach skills through fun challenges
          </p>
          <p style={{
            fontSize: '14px',
            opacity: 0.7
          }}>
            Skill swap roulette for everyone
          </p>
        </div>

        {/* Features Preview */}
        <div style={{
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <h3 style={{
            fontSize: '20px',
            fontWeight: '600',
            marginBottom: '20px'
          }}>
            🚀 How it works
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '16px',
            textAlign: 'left'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Target size={16} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>Spin & Match</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Get paired with skills</div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Users size={16} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>Skill Swap</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Learn & teach together</div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Star size={16} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>24h Challenge</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Record proof videos</div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Trophy size={16} />
              </div>
              <div>
                <div style={{ fontSize: '14px', fontWeight: '600' }}>Level Up</div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>Build streaks & earn XP</div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {authError && (
          <div style={{
            background: 'rgba(255,107,107,0.2)',
            border: '1px solid rgba(255,107,107,0.3)',
            borderRadius: '12px',
            padding: '12px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '14px'
          }}>
            <AlertCircle size={16} />
            <span>{authError}</span>
          </div>
        )}

        {/* Sign In Button */}
        <button
          onClick={handleSignIn}
          disabled={loading || isSigningIn}
          style={{
            width: '100%',
            padding: '16px 24px',
            background: 'white',
            color: '#667eea',
            border: 'none',
            borderRadius: '12px',
            fontSize: '18px',
            fontWeight: '600',
            cursor: loading || isSigningIn ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            transition: 'all 0.2s ease',
            opacity: loading || isSigningIn ? 0.7 : 1,
            transform: loading || isSigningIn ? 'scale(0.98)' : 'scale(1)',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
          onMouseEnter={(e) => {
            if (!loading && !isSigningIn) {
              e.target.style.transform = 'scale(1.02)';
              e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
            }
          }}
          onMouseLeave={(e) => {
            if (!loading && !isSigningIn) {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
            }
          }}
        >
          {isSigningIn ? (
            <>
              <Loader size={20} style={{ animation: 'spin 1s linear infinite' }} />
              Signing in...
            </>
          ) : (
            <>
              <LogIn size={20} />
              Continue with Google
            </>
          )}
        </button>

        {/* Privacy Note */}
        <p style={{
          fontSize: '12px',
          opacity: 0.7,
          marginTop: '20px',
          lineHeight: '1.4'
        }}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
          We only use your Google account for authentication and profile setup.
        </p>

        {/* Beta Notice */}
        <div style={{
          marginTop: '32px',
          padding: '12px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '8px',
          fontSize: '12px',
          opacity: 0.8
        }}>
          🚧 <strong>Beta Version</strong> - Help us improve by sharing feedback!
        </div>
      </div>
    </div>
  );
}

export default LoginScreen;
