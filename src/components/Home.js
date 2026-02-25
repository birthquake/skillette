import React, { useState, useEffect, useCallback } from 'react';
import { 
  RotateCcw, 
  Camera, 
  Play, 
  Users, 
  Trophy, 
  TrendingUp,
  Zap,
  Medal
} from 'lucide-react';
import { getRandomSkills, getRecentActivity, getLeaderboard, trackEvent } from '../firebase';
import usePullToRefresh from './usePullToRefresh';
import PullToRefreshIndicator from './PullToRefreshIndicator';
import { SkillCardSkeleton } from './Skeleton';
import ErrorBanner from './ErrorBanner';
import { useAuth } from '../contexts/AuthContext';

function HomeScreen({ user, onNavigate }) {
  const { currentUser } = useAuth();

  const [greeting, setGreeting] = useState('');
  const [featuredSkills, setFeaturedSkills] = useState([]);
  const [skillsLoading, setSkillsLoading] = useState(true);

  const [recentActivity, setRecentActivity] = useState([]);
  const [activityError, setActivityError] = useState('');
  const [skillsError, setSkillsError] = useState('');
  const [retryCount, setRetryCount] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);

  const handleRefresh = useCallback(async () => {
    setRetryCount(c => c + 1);
    trackEvent('pull_to_refresh', { screen: 'home' });
  }, []);

  const { isRefreshing, pullDistance, handlers } = usePullToRefresh(handleRefresh);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');
  }, []);

  // Fetch real activity from Firebase
  useEffect(() => {
    const loadActivity = async () => {
      if (!currentUser) return;
      setActivityError('');
      try {
        const activity = await getRecentActivity(currentUser.uid, 5);
        setRecentActivity(activity);
      } catch (error) {
        console.error('Error loading activity:', error);
        setActivityError('Could not load recent activity.');
      }
    };
    loadActivity();
  }, [currentUser, retryCount]);

  // Fetch real trending skills from Firebase
  useEffect(() => {
    const loadFeaturedSkills = async () => {
      setSkillsLoading(true);
      setSkillsError('');
      try {
        const skills = await getRandomSkills(currentUser?.uid, 3);
        setFeaturedSkills(hackSkills);
      } catch (error) {
        console.error('Error loading featured skills:', error);
        setSkillsError('Could not load featured skills.');
      } finally {
        setSkillsLoading(false);
      }
    };

    if (currentUser) {
      loadFeaturedSkills();
    }
  }, [currentUser, retryCount]);

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
      case 'Medium': return '#f5a623';
      case 'Hard': return '#ff6b6b';
      default: return '#4ecdc4';
    }
  };

  // Daily challenge progress based on real skills learned today
  const dailyGoal = 3;
  const dailyProgress = Math.min(user.skillsLearned % dailyGoal || 0, dailyGoal);
  const dailyProgressPercent = Math.round((dailyProgress / dailyGoal) * 100);

  return (
    <div {...handlers} style={{ paddingTop: '20px', paddingBottom: '20px' }}>
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />

      {/* Welcome Section */}
      <div className="card fade-in">
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
            color: '#8b8fa8',
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
              onClick={() => onNavigate('addSkill')}
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

      {/* Trending Skills */}
      <div className="card">
        <div className="card-header">
          <div>
            <h2 className="card-title">🔥 Trending Skills</h2>
            <p className="card-subtitle">Popular skills others are learning</p>
          </div>
          <TrendingUp size={20} style={{ color: '#f5576c' }} />
        </div>
        
        {skillsError ? (
          <ErrorBanner message={skillsError} onRetry={() => setRetryCount(c => c + 1)} />
        ) : skillsLoading ? (
          <div>
            <SkillCardSkeleton />
            <SkillCardSkeleton />
            <SkillCardSkeleton />
          </div>
        ) : featuredSkills.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <p style={{ fontSize: '14px', color: '#8b8fa8', marginBottom: '16px' }}>
              No skills in the pool yet. Be the first to add one!
            </p>
            <button
              className="btn btn-primary"
              onClick={() => onNavigate('addSkill')}
            >
              <Camera size={16} />
              Add a Skill
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {featuredSkills.map((skill) => (
                <div 
                  key={skill.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px',
                    background: '#212436',
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
                    background: '#1a1d27',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '20px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    flexShrink: 0
                  }}>
                    {skill.thumbnail}
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      fontSize: '16px', 
                      fontWeight: '600', 
                      marginBottom: '4px',
                      color: '#f0f0f5'
                    }}>
                      {skill.title}
                    </h3>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px',
                      fontSize: '14px',
                      color: '#8b8fa8'
                    }}>
                      <span>by {skill.author}</span>
                      <span>•</span>
                      <span>{skill.duration}</span>
                      {skill.rating > 0 && <>
                        <span>•</span>
                        <span style={{ color: '#ffd700' }}>★ {skill.rating.toFixed(1)}</span>
                        <span style={{ color: '#555870', fontSize: '11px' }}>({skill.ratingCount || 0})</span>
                      </>}
                      <span style={{
                        background: getDifficultyColor(skill.difficulty),
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {skill.difficulty}
                      </span>
                    </div>
                  </div>
                  
                  <Play size={16} style={{ color: '#667eea', flexShrink: 0 }} />
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
          </>
        )}
      </div>

      {/* Recent Activity */}
      {activityError && (
        <ErrorBanner message={activityError} onRetry={() => setRetryCount(c => c + 1)} />
      )}
      {recentActivity.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">📈 Recent Activity</h2>
            </div>
          </div>

          <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {recentActivity.map((activity) => (
              <div
                key={activity.id}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px', background: '#252838', borderRadius: '10px'
                }}
              >
                <div style={{
                  width: '40px', height: '40px', background: '#252838',
                  borderRadius: '10px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '18px',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.08)', flexShrink: 0
                }}>
                  {activity.thumbnail}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: '14px', fontWeight: '600', color: '#f0f0f5',
                    marginBottom: '2px', overflow: 'hidden',
                    textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {activity.skill}
                  </p>
                  <p style={{ fontSize: '12px', color: '#555870' }}>
                    Completed · {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Daily Challenge */}
      <div className="card" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white'
      }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '8px' }}>
            🎯 Daily Challenge
          </h2>
          <p style={{ fontSize: '16px', marginBottom: '20px', opacity: 0.9 }}>
            Learn {dailyGoal} new skills today to unlock a bonus!
          </p>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center',
            gap: '8px',
            marginBottom: '20px'
          }}>
            <div style={{
              flex: 1,
              height: '8px',
              background: 'rgba(255,255,255,0.3)',
              borderRadius: '4px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${dailyProgressPercent}%`,
                height: '100%',
                background: '#1a1d27',
                borderRadius: '4px',
                transition: 'width 0.5s ease'
              }} />
            </div>
            <span style={{ fontSize: '14px', fontWeight: '600', flexShrink: 0 }}>
              {dailyProgress}/{dailyGoal}
            </span>
          </div>
          <button 
            className="btn"
            onClick={() => onNavigate('roulette')}
            style={{ background: '#1a1d27', color: '#667eea', fontWeight: '600' }}
          >
            Start Challenge
          </button>
        </div>
      </div>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">🏆 Top Teachers</h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {leaderboard.map((teacher, i) => (
              <div key={teacher.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px', background: i === 0 ? 'rgba(255,215,0,0.08)' : '#252838', borderRadius: '10px', border: i === 0 ? '1px solid rgba(255,215,0,0.2)' : '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ width: '28px', textAlign: 'center', fontSize: i < 3 ? '18px' : '13px', fontWeight: '700', color: i === 0 ? '#ffd700' : i === 1 ? '#c0c0c0' : i === 2 ? '#cd7f32' : '#555870', flexShrink: 0 }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                </div>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #7c6af7, #9c59f5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>
                  {teacher.avatar || '👤'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '14px', fontWeight: '600', color: '#f0f0f5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {teacher.name || 'Anonymous'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#555870' }}>
                    {teacher.skillsTaught || 0} swaps
                    {teacher.teacherRating > 0 && <span style={{ marginLeft: '6px', color: '#ffd700' }}>★ {teacher.teacherRating.toFixed(1)}</span>}
                  </p>
                </div>
                <Medal size={14} style={{ color: '#555870', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

export default HomeScreen;
