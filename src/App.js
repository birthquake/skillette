import React, { useState, useEffect } from 'react';
import { Home, RotateCcw, Clock, User, Flame, Loader, Bell } from 'lucide-react';
import './App.css';

// Import Firebase context and functions
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { createChallenge, getActiveChallenge, updateChallenge, getMatchByChallenge, updateMatch, getUnreadNotifications } from './firebase';

// Import components
import LoginScreen from './components/Login';
import HomeScreen from './components/Home';
import RouletteScreen from './components/Roulette';
import ChallengeScreen from './components/Challenge';
import ProfileScreen from './components/Profile';
import AddSkillScreen from './components/AddSkill';
import NotificationsScreen from './components/Notifications';

// Main App Component (inside AuthProvider)
function AppContent() {
  const { 
    currentUser,
    userProfile, 
    loading, 
    isAuthenticated, 
    getUserDisplayData,
    incrementSkillsLearned,
    updateStreak 
  } = useAuth();
  
  // App state
  const [currentScreen, setCurrentScreen] = useState('home');
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [currentChallengeId, setCurrentChallengeId] = useState(null);
  const [currentMatchId, setCurrentMatchId] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [appLoaded, setAppLoaded] = useState(false);
  const [challengeLoading, setChallengeLoading] = useState(false);

  // Get user display data
  const user = getUserDisplayData();

  // Initialize app after auth loads
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setAppLoaded(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Poll unread notification count every 30s
  useEffect(() => {
    if (!currentUser) return;
    const checkUnread = async () => {
      const unread = await getUnreadNotifications(currentUser.uid);
      setUnreadCount(unread.length);
    };
    checkUnread();
    const interval = setInterval(checkUnread, 30000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Restore any active challenge from Firestore on login
  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    const restoreChallenge = async () => {
      setChallengeLoading(true);
      try {
        const saved = await getActiveChallenge(currentUser.uid);
        if (saved) {
          // Convert Firestore timestamps back to plain objects
          const restored = {
            skill: saved.skill,
            startTime: saved.startTime?.toDate
              ? saved.startTime.toDate()
              : new Date(saved.startTime),
            timeLimit: saved.timeLimit,
            status: saved.status
          };

          // Check if the challenge has already expired
          const now = new Date().getTime();
          const challengeEnd = new Date(restored.startTime).getTime() + restored.timeLimit;
          if (now < challengeEnd) {
            setCurrentChallenge(restored);
            setCurrentChallengeId(saved.id);
          } else {
            // Mark expired in Firestore
            await updateChallenge(saved.id, { status: 'expired' });
          }
        }
      } catch (error) {
        console.error('Error restoring challenge:', error);
      } finally {
        setChallengeLoading(false);
      }
    };

    restoreChallenge();
  }, [isAuthenticated, currentUser]);

  // Navigation handler
  const navigateToScreen = (screen) => {
    setCurrentScreen(screen);
  };

  // Start a new challenge — challengeId may already exist if Roulette created it
  const startChallenge = async (skill, existingChallengeId = null) => {
    const challenge = {
      skill,
      startTime: new Date(),
      timeLimit: 24 * 60 * 60 * 1000,
      status: 'active'
    };

    setCurrentChallenge(challenge);
    setCurrentScreen('challenge');

    try {
      let challengeId = existingChallengeId;

      // Only create a new challenge doc if Roulette didn't already create one
      if (!challengeId) {
        const result = await createChallenge({
          userId: currentUser.uid,
          skill,
          timeLimit: challenge.timeLimit
        });
        if (result.success) challengeId = result.id;
      }

      if (challengeId) {
        setCurrentChallengeId(challengeId);
        // Look up any match linked to this challenge
        const match = await getMatchByChallenge(challengeId);
        if (match) setCurrentMatchId(match.id);
      }
    } catch (error) {
      console.error('Error setting up challenge:', error);
    }
  };

  // Abandon a challenge — marks it as abandoned in Firestore and clears state
  const abandonChallenge = async () => {
    try {
      if (currentChallengeId) {
        await updateChallenge(currentChallengeId, { status: 'abandoned' });
      }
      if (currentMatchId) {
        await updateMatch(currentMatchId, { status: 'abandoned' });
      }
    } catch (error) {
      console.error('Error abandoning challenge:', error);
    } finally {
      setCurrentChallenge(null);
      setCurrentChallengeId(null);
      setCurrentMatchId(null);
      setCurrentScreen('home');
    }
  };

  // Expire a challenge — called when the timer hits zero
  const expireChallenge = async () => {
    try {
      if (currentChallengeId) {
        await updateChallenge(currentChallengeId, { status: 'expired' });
      }
      if (currentMatchId) {
        await updateMatch(currentMatchId, { status: 'expired' });
      }
    } catch (error) {
      console.error('Error expiring challenge:', error);
    } finally {
      setCurrentChallenge(null);
      setCurrentChallengeId(null);
      setCurrentMatchId(null);
      setCurrentScreen('home');
    }
  };

  // Complete a challenge — only valid if a proof video URL is provided
  const completeChallenge = async (proofVideoUrl = null) => {
    if (!currentChallenge || !isAuthenticated) return;

    // Require proof — no URL means no completion
    if (!proofVideoUrl) {
      console.warn('completeChallenge called without proof video URL — ignoring');
      return;
    }

    try {
      if (currentChallengeId) {
        await updateChallenge(currentChallengeId, {
          status: 'completed',
          proofVideoUrl
        });
      }

      // Mark the learner's side of the match as done
      if (currentMatchId) {
        await updateMatch(currentMatchId, {
          learnerCompleted: true,
          proofVideoUrl
        });
      }

      await incrementSkillsLearned();
      await updateStreak();
    } catch (error) {
      console.error('Error completing challenge:', error);
    } finally {
      setCurrentChallenge(null);
      setCurrentChallengeId(null);
      setCurrentMatchId(null);
      setCurrentScreen('home');
    }
  };

  // Show loading screen while Firebase initializes
  if (loading || !appLoaded || challengeLoading) {
    return (
      <div className="App">
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          color: 'white',
          textAlign: 'center'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px',
            animation: 'spin 2s linear infinite'
          }}>
            🎯
          </div>
          <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '10px' }}>
            Skillette
          </h1>
          <p style={{ fontSize: '16px', opacity: 0.8 }}>
            {loading ? 'Connecting...' : 'Loading your skill adventure...'}
          </p>
          <div style={{ marginTop: '20px' }}>
            <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
          </div>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Render current screen
  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen 
            user={user}
            onNavigate={navigateToScreen}
          />
        );
      case 'roulette':
        return (
          <RouletteScreen 
            onStartChallenge={startChallenge}
            onNavigate={navigateToScreen}
          />
        );
      case 'challenge':
        return (
          <ChallengeScreen 
            challenge={currentChallenge}
            onComplete={completeChallenge}
            onAbandon={abandonChallenge}
            onExpire={expireChallenge}
            onNavigate={navigateToScreen}
          />
        );
      case 'profile':
        return (
          <ProfileScreen 
            user={user}
            userProfile={userProfile}
            onNavigate={navigateToScreen}
          />
        );
      case 'notifications':
      return (
        <NotificationsScreen
          onClose={() => {
            setUnreadCount(0);
            navigateToScreen('home');
          }}
        />
      );
    case 'addSkill':
        return (
          <AddSkillScreen
            onNavigate={navigateToScreen}
            onSkillAdded={() => navigateToScreen('profile')}
          />
        );
      default:
        return (
          <HomeScreen 
            user={user}
            onNavigate={navigateToScreen}
          />
        );
    }
  };

  return (
    <div className="App">
      {/* Top Navigation Bar */}
      <nav className="nav-bar">
        <div className="nav-logo">
          Skillette
        </div>
        <div className="nav-profile">
          <div className="streak-indicator">
            <Flame size={12} />
            {user.streak}
          </div>
          <span>Level {user.level}</span>
          <button
            onClick={() => navigateToScreen('notifications')}
            style={{
              position: 'relative', background: 'none', border: 'none',
              cursor: 'pointer', padding: '4px', display: 'flex',
              alignItems: 'center', color: '#666'
            }}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <div style={{
                position: 'absolute', top: '-2px', right: '-2px',
                width: '16px', height: '16px', borderRadius: '50%',
                background: '#f5576c', color: 'white',
                fontSize: '10px', fontWeight: '700',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </div>
            )}
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <main className="main-content">
        <div className="container">
          {renderCurrentScreen()}
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="bottom-nav">
        <div className="bottom-nav-content">
          <button
            className={`nav-item ${currentScreen === 'home' ? 'active' : ''}`}
            onClick={() => navigateToScreen('home')}
          >
            <Home size={20} />
            <span className="nav-item-label">Home</span>
          </button>
          
          <button
            className={`nav-item ${currentScreen === 'roulette' ? 'active' : ''}`}
            onClick={() => navigateToScreen('roulette')}
          >
            <RotateCcw size={20} />
            <span className="nav-item-label">Spin</span>
          </button>
          
          <button
            className={`nav-item ${currentScreen === 'challenge' ? 'active' : ''}`}
            onClick={() => navigateToScreen('challenge')}
            style={{ position: 'relative' }}
          >
            <Clock size={20} />
            <span className="nav-item-label">Challenge</span>
            {currentChallenge && (
              <div style={{
                position: 'absolute',
                top: '0',
                right: '0',
                width: '8px',
                height: '8px',
                background: '#f5576c',
                borderRadius: '50%'
              }} />
            )}
          </button>
          
          <button
            className={`nav-item ${currentScreen === 'profile' ? 'active' : ''}`}
            onClick={() => navigateToScreen('profile')}
          >
            <User size={20} />
            <span className="nav-item-label">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

// Main App component with AuthProvider wrapper
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
