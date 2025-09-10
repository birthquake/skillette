import React, { useState, useEffect } from 'react';
import { Home, RotateCcw, Camera, Clock, User, Flame, Trophy, Star } from 'lucide-react';
import './App.css';

// Import components (we'll create these next)
import HomeScreen from './components/Home';
import RouletteScreen from './components/Roulette';
import ChallengeScreen from './components/Challenge';
import ProfileScreen from './components/Profile';

function App() {
  // Main app state
  const [currentScreen, setCurrentScreen] = useState('home');
  const [user, setUser] = useState({
    name: 'Alex',
    streak: 7,
    skillsLearned: 23,
    skillsTaught: 19,
    level: 5,
    avatar: '👤'
  });
  
  const [currentChallenge, setCurrentChallenge] = useState(null);
  const [appLoaded, setAppLoaded] = useState(false);

  // Initialize app
  useEffect(() => {
    // Simulate app loading
    const timer = setTimeout(() => {
      setAppLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Mock data for development
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
  const completeChallenge = () => {
    if (currentChallenge) {
      setUser(prev => ({
        ...prev,
        skillsLearned: prev.skillsLearned + 1,
        streak: prev.streak + 1
      }));
      setCurrentChallenge(null);
      setCurrentScreen('home');
    }
  };

  // Loading screen
  if (!appLoaded) {
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
            Loading your skill adventure...
          </p>
        </div>
      </div>
    );
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
            setUser={setUser}
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

export default App;
