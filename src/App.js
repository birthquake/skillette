import React, { useState, useEffect } from 'react';
import { Home, RotateCcw, Camera, Clock, User, Flame, Trophy, Star, Loader } from 'lucide-react';
import './App.css';

// Import Firebase context
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import components
import LoginScreen from './components/Login';
import HomeScreen from './components/Home';
import RouletteScreen from './components/Roulette';
import ChallengeScreen from './components/Challenge';
import ProfileScreen from './components/Profile';

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
  const [appLoaded, setAppLoaded] = useState(false);

  // Get user display data for compatibility with existing components
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

  // Mock data for development (will be replaced with Firebase data later)
  const mockSkills = [
    {
      id: 1,
      title: "Perfect Paper Airplane",
      author: "Sarah",
      difficulty: "Easy",
      duration: "2 min",
      category: "Crafts",
      thumbnail: "✈️"
    },
    {
      id: 2,
      title: "Whistle with Your Fingers",
      author: "Mike",
      difficulty: "Medium",
      duration: "5 min",
      category: "Life Hacks",
      thumbnail: "👌"
    },
    {
      id: 3,
      title: "Basic Origami Crane",
      author: "Emma",
      difficulty: "Medium",
      duration: "4 min",
      category: "Crafts",
      thumbnail: "🕊️"
    },
    {
      id: 4,
      title: "Tie a Tie Perfectly",
      author: "David",
      difficulty: "Easy",
      duration: "3 min",
      category: "Life Skills",
      thumbnail: "👔"
    },
    {
      id: 5,
      title: "Card Trick - The Four Aces",
      author: "Lisa",
      difficulty: "Hard",
      duration: "8 min",
      category: "Magic",
      thumbnail: "🃏"
    }
  ];
  // Navigation handler
  const navigateToScreen = (screen) => {
    setCurrentScreen(screen);
  };

  // Challenge management
  const startChallenge = (skill) => {
    const challenge = {
      skill: skill,
      startTime: new Date(),
      timeLimit: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      status: 'active'
    };
    setCurrentChallenge(challenge);
    setCurrentScreen('challenge');
  };

  // Complete challenge
  const completeChallenge = async () => {
    if (currentChallenge && isAuthenticated) {
      try {
        // Update user stats in Firebase
        await incrementSkillsLearned();
        await updateStreak();
        
        // Clear challenge
        setCurrentChallenge(null);
        setCurrentScreen('home');
      } catch (error) {
        console.error('Error completing challenge:', error);
        // Still clear challenge on error
        setCurrentChallenge(null);
        setCurrentScreen('home');
      }
    }
  };

  // Show loading screen while Firebase initializes
  if (loading || !appLoaded) {
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
          {loading && (
            <div style={{ marginTop: '20px' }}>
              <Loader size={24} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}
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
            mockSkills={mockSkills}
          />
        );
      case 'roulette':
        return (
          <RouletteScreen 
            mockSkills={mockSkills}
            onStartChallenge={startChallenge}
            onNavigate={navigateToScreen}
          />
        );
      case 'challenge':
        return (
          <ChallengeScreen 
            challenge={currentChallenge}
            onComplete={completeChallenge}
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
      default:
        return (
          <HomeScreen 
            user={user}
            onNavigate={navigateToScreen}
            mockSkills={mockSkills}
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
