import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, 
  Camera, 
  Play, 
  Clock, 
  Users, 
  Star, 
  Trophy, 
  TrendingUp,
  Zap,
  Target,
  Award
} from 'lucide-react';

function HomeScreen({ user, onNavigate, mockSkills }) {
  const [greeting, setGreeting] = useState('');
  const [featuredSkills, setFeaturedSkills] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good morning');
    } else if (hour < 18) {
      setGreeting('Good afternoon');
    } else {
      setGreeting('Good evening');
    }

    // Set featured skills (first 3 from mock data)
    setFeaturedSkills(mockSkills.slice(0, 3));

    // Mock recent activity
    setRecentActivity([
      { type: 'completed', skill: 'Paper Airplane', time: '2 hours ago' },
      { type: 'taught', skill: 'Card Trick', time: '1 day ago' },
      { type: 'learned', skill: 'Origami Crane', time: '2 days ago' }
    ]);
  }, [mockSkills]);

  // Quick stats for the user
  const quickStats = [
    {
      label: 'Skills Learned',
      value: user.skillsLearned,
      icon: <Trophy size={16} />,
      color: '#4facfe'
    },
    {
      label: 'Skills Taught',
      value: user.skillsTaught,
      icon: <Users size={16} />,
      color: '#f093fb'
    },
    {
      label: 'Current Streak',
      value: user.streak,
      icon: <Zap size={16} />,
      color: '#ffeaa7'
    }
  ];

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#4ecdc4';
      case 'Medium': return '#ffeaa7';
      case 'Hard': return '#ff6b6b';
      default: return '#4ecdc4';
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'completed': return <Target size={16} />;
      case 'taught': return <Users size={16} />;
      case 'learned': return <Award size={16} />;
      default: return <Star size={16} />;
    }
  };

  return (
    <div className="fade-in" style={{ paddingTop: '20px', paddingBottom: '20px' }}>
      {/* Welcome Section */}
      <div className="card">
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: '700', 
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {greeting}, {user.name}!
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: '#666666',
            marginBottom: '24px'
          }}>
            Ready to learn something new today?
          </p>
          
          {/* Quick Action Buttons */}
          <div style={{ 
            display: 'flex', 
            gap: '12px', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button 
              className="btn btn-primary"
              onClick={() => onNavigate('roulette')}
              style={{ flex: '1', minWidth: '140px' }}
            >
              <RotateCcw size={18} />
              Spin to Learn
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => onNavigate('profile')}
              style={{ flex: '1', minWidth: '140px' }}
            >
              <Camera size={18} />
              Teach a Skill
            </button>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="stats-grid">
        {quickStats.map((stat, index) => (
          <div key={index} className="stat-item">
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              marginBottom: '8px',
              color: stat.color
            }}>
              {stat.icon}
            </div>
            <span className="stat-number" style={{ color: stat.color }}>
              {stat.value}
            </span>
            <span className="stat-label">{stat.label}</span>
          </div>
        ))}
      </div>

      {/* Today's Featured Skills */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">🔥 Trending Skills</h2>
            <p className="card-subtitle">Popular skills others are learning</p>
          </div>
          <TrendingUp size={20} style={{ color: '#f5576c' }} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {featuredSkills.map((skill) => (
            <div 
              key={skill.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => onNavigate('roulette')}
              onMouseEnter={(e) => {
  e.currentTarget.style.transform = 'translateY(-2px)';
  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = 'translateY(0)';
  e.currentTarget.style.boxShadow = 'none';
}}
            >
              <div style={{
                width: '48px',
                height: '48px',
                background: 'white',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                {skill.thumbnail}
              </div>
              
              <div style={{ flex: 1 }}>
                <h3 style={{ 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  marginBottom: '4px',
                  color: '#1a1a1a'
                }}>
                  {skill.title}
                </h3>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px',
                  fontSize: '14px',
                  color: '#666666'
                }}>
                  <span>by {skill.author}</span>
                  <span>•</span>
                  <span>{skill.duration}</span>
                  <span 
                    style={{
                      background: getDifficultyColor(skill.difficulty),
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}
                  >
                    {skill.difficulty}
                  </span>
                </div>
              </div>
              
              <Play size={16} style={{ color: '#667eea' }} />
            </div>
          ))}
        </div>
        
        <button 
          className="btn btn-outline btn-full"
          onClick={() => onNavigate('roulette')}
          style={{ marginTop: '16px' }}
        >
          Explore All Skills
        </button>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">📈 Recent Activity</h2>
            <p className="card-subtitle">Your learning journey</p>
          </div>
          <Clock size={20} style={{ color: '#4facfe' }} />
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {recentActivity.map((activity, index) => (
            <div 
              key={index}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px',
                background: '#f8fafc',
                borderRadius: '8px'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                background: 'white',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#667eea',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                {getActivityIcon(activity.type)}
              </div>
              
              <div style={{ flex: 1 }}>
                <p style={{ 
                  fontSize: '14px', 
                  fontWeight: '500',
                  color: '#1a1a1a',
                  marginBottom: '2px'
                }}>
                  {activity.type === 'completed' && 'Completed challenge: '}
                  {activity.type === 'taught' && 'Taught skill: '}
                  {activity.type === 'learned' && 'Learned skill: '}
                  <span style={{ fontWeight: '600' }}>{activity.skill}</span>
                </p>
                <p style={{ 
                  fontSize: '12px', 
                  color: '#666666'
                }}>
                  {activity.time}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Challenge of the Day */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ 
            fontSize: '20px', 
            fontWeight: '700', 
            marginBottom: '8px'
          }}>
            🎯 Daily Challenge
          </h2>
          <p style={{ 
            fontSize: '16px', 
            marginBottom: '20px',
            opacity: 0.9
          }}>
            Learn 3 new skills today to unlock a bonus!
          </p>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px'
          }}>
            <div style={{
              width: '100%',
              height: '8px',
              background: 'rgba(255,255,255,0.3)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '33%',
                height: '100%',
                background: 'white',
                borderRadius: '4px'
              }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: '600' }}>1/3</span>
          </div>
          <button 
            className="btn"
            onClick={() => onNavigate('roulette')}
            style={{
              background: 'white',
              color: '#667eea',
              fontWeight: '600'
            }}
          >
            Start Challenge
          </button>
        </div>
      </div>
    </div>
  );
}

export default HomeScreen;
