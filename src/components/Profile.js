import React, { useState, useEffect } from 'react';
import { 
  User, 
  Camera, 
  Edit3, 
  Trophy, 
  Star, 
  Users,
  Flame,
  Plus,
  Clock,
  ChevronRight,
  Medal,
  Zap,
  Loader
} from 'lucide-react';
import { getUserSkills, getRecentActivity } from '../firebase';
import ErrorBanner from './ErrorBanner';
import { useAuth } from '../contexts/AuthContext';

function ProfileScreen({ user, userProfile, onNavigate }) {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [userSkills, setUserSkills] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  const [skillsLoading, setSkillsLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [skillsError, setSkillsError] = useState('');
  const [activityError, setActivityError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // Load real skills from Firebase
  useEffect(() => {
    const loadSkills = async () => {
      if (!currentUser) return;
      setSkillsLoading(true);
      setSkillsError('');
      try {
        const skills = await getUserSkills(currentUser.uid);
        setUserSkills(skills);
      } catch (error) {
        console.error('Error loading skills:', error);
        setSkillsError('Could not load your skills.');
      } finally {
        setSkillsLoading(false);
      }
    };
    loadSkills();
  }, [currentUser, retryCount]);

  // Load real activity from Firebase
  useEffect(() => {
    const loadActivity = async () => {
      if (!currentUser) return;
      setActivityLoading(true);
      setActivityError('');
      try {
        const activity = await getRecentActivity(currentUser.uid, 10);
        setRecentActivity(activity);
      } catch (error) {
        console.error('Error loading activity:', error);
        setActivityError('Could not load recent activity.');
      } finally {
        setActivityLoading(false);
      }
    };
    loadActivity();
  }, [currentUser, retryCount]);

  // Achievements are derived from real user stats
  useEffect(() => {
    setAchievements([
      {
        id: 1,
        title: 'First Swap',
        description: 'Complete your first skill swap',
        icon: '🎯',
        unlocked: user.skillsLearned >= 1,
        date: user.skillsLearned >= 1 ? 'Unlocked' : null
      },
      {
        id: 2,
        title: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        icon: '🔥',
        unlocked: user.streak >= 7,
        date: user.streak >= 7 ? 'Unlocked' : null
      },
      {
        id: 3,
        title: 'Teacher',
        description: 'Have 10 people learn your skills',
        icon: '👨‍🏫',
        unlocked: user.skillsTaught >= 10,
        date: user.skillsTaught >= 10 ? 'Unlocked' : null
      },
      {
        id: 4,
        title: 'Master Learner',
        description: 'Learn 25 skills',
        icon: '🎓',
        unlocked: user.skillsLearned >= 25,
        progress: user.skillsLearned >= 25 ? null : user.skillsLearned / 25
      }
    ]);
  }, [user.skillsLearned, user.skillsTaught, user.streak]);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return '#4ecdc4';
      case 'Medium': return '#ffeaa7';
      case 'Hard': return '#ff6b6b';
      default: return '#4ecdc4';
    }
  };

  // Calculate XP progress within current level
  const xpIntoLevel = user.xp % 500;
  const xpProgressPercent = (xpIntoLevel / 500) * 100;

  const renderOverview = () => (
    <div style={{ paddingTop: '20px', paddingBottom: '20px' }}>
      {/* Profile Header */}
      <div className="card" style={{ textAlign: 'center' }}>
        <div style={{
          width: '80px',
          height: '80px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          color: 'white',
          margin: '0 auto 16px',
          boxShadow: '0 8px 32px rgba(102, 126, 234, 0.3)'
        }}>
          {user.avatar}
        </div>
        
        <h1 style={{ 
          fontSize: '24px', 
          fontWeight: '700', 
          marginBottom: '4px',
          color: '#1a1a1a'
        }}>
          {user.name}
        </h1>
        
        <p style={{ 
          fontSize: '16px', 
          color: '#666666',
          marginBottom: '20px'
        }}>
          Level {user.level} Skill Swapper
        </p>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            <Flame size={14} />
            {user.streak} day streak
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
            color: 'white',
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            <Star size={14} />
            {user.xp} XP total
          </div>
        </div>

        <button 
          className="btn btn-outline"
          style={{ width: '100%' }}
        >
          <Edit3 size={16} />
          Edit Profile
        </button>
      </div>

      {/* Stats Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(2, 1fr)', 
        gap: '12px',
        marginBottom: '20px'
      }}>
        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
          <Trophy size={24} style={{ color: '#4facfe', marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#4facfe' }}>
            {user.skillsLearned}
          </div>
          <div style={{ fontSize: '12px', color: '#666666', textTransform: 'uppercase' }}>
            Skills Learned
          </div>
        </div>
        
        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
          <Users size={24} style={{ color: '#f5576c', marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#f5576c' }}>
            {user.skillsTaught}
          </div>
          <div style={{ fontSize: '12px', color: '#666666', textTransform: 'uppercase' }}>
            Skills Taught
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '16px', fontWeight: '600' }}>Level Progress</span>
          <span style={{ fontSize: '14px', color: '#666666' }}>Level {user.level}</span>
        </div>
        <div style={{
          width: '100%',
          height: '12px',
          background: '#e2e8f0',
          borderRadius: '6px',
          overflow: 'hidden',
          marginBottom: '8px'
        }}>
          <div style={{
            width: `${xpProgressPercent}%`,
            height: '100%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            borderRadius: '6px',
            transition: 'width 0.5s ease'
          }} />
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#666666'
        }}>
          <span>{xpIntoLevel} XP</span>
          <span>500 XP to Level {user.level + 1}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
          Quick Actions
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            className="btn btn-outline"
            onClick={() => onNavigate('addSkill')}
            style={{ 
              justifyContent: 'space-between',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Camera size={18} />
              <span>Add New Skill</span>
            </div>
            <ChevronRight size={18} />
          </button>
          
          <button 
            className="btn btn-outline"
            onClick={() => onNavigate('roulette')}
            style={{ 
              justifyContent: 'space-between',
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Zap size={18} />
              <span>Start New Challenge</span>
            </div>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );

  const renderSkills = () => (
    <div style={{ paddingTop: '20px', paddingBottom: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'white' }}>
          Your Skills
        </h2>
        <button className="btn btn-primary" onClick={() => onNavigate('addSkill')}>
          <Plus size={18} />
          Add Skill
        </button>
      </div>

      {skillsLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: 'white' }} />
        </div>
      ) : skillsError ? (
        <ErrorBanner message={skillsError} onRetry={() => setRetryCount(c => c + 1)} />
      ) : userSkills.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎯</div>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>No skills yet</p>
          <p style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}>Add your first skill to get started!</p>
          <button className="btn btn-primary" onClick={() => onNavigate('addSkill')}>Add a Skill</button>
        </div>
      ) : null}

      {!skillsLoading && !skillsError && userSkills.map((skill) => (
        <div key={skill.id} className="card" style={{ marginBottom: '12px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: 'white',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
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
                color: '#666666',
                marginBottom: '4px'
              }}>
                <span>{skill.category}</span>
                <span>•</span>
                <span>{skill.timesShared} swaps</span>
                <span>•</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Star size={12} style={{ color: '#ffeaa7' }} />
                  <span>{skill.rating}</span>
                </div>
              </div>
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
            
            <ChevronRight size={18} style={{ color: '#666666' }} />
          </div>
        </div>
      ))}
    </div>
  );

  const renderAchievements = () => (
    <div style={{ paddingTop: '20px', paddingBottom: '20px' }}>
      <h2 style={{ 
        fontSize: '24px', 
        fontWeight: '700', 
        color: 'white',
        marginBottom: '20px'
      }}>
        Achievements
      </h2>

      {achievements.map((achievement) => (
        <div 
          key={achievement.id} 
          className="card" 
          style={{ 
            marginBottom: '12px',
            opacity: achievement.unlocked ? 1 : 0.6,
            background: achievement.unlocked ? 'white' : '#f8fafc'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: achievement.unlocked ? 'linear-gradient(135deg, #ffeaa7 0%, #fcb69f 100%)' : '#e2e8f0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px'
            }}>
              {achievement.unlocked ? achievement.icon : '🔒'}
            </div>
            
            <div style={{ flex: 1 }}>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                marginBottom: '4px',
                color: achievement.unlocked ? '#1a1a1a' : '#666666'
              }}>
                {achievement.title}
              </h3>
              <p style={{ 
                fontSize: '14px',
                color: '#666666',
                marginBottom: achievement.progress ? '8px' : '0'
              }}>
                {achievement.description}
              </p>
              
              {achievement.progress && (
                <div style={{
                  width: '100%',
                  height: '6px',
                  background: '#e2e8f0',
                  borderRadius: '3px',
                  overflow: 'hidden'
                }}>
                  <div style={{
                    width: `${Math.min(achievement.progress * 100, 100)}%`,
                    height: '100%',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    borderRadius: '3px'
                  }} />
                </div>
              )}
              
              {achievement.unlocked && achievement.date && (
                <p style={{ 
                  fontSize: '12px',
                  color: '#666666',
                  marginTop: '4px'
                }}>
                  Unlocked {achievement.date}
                </p>
              )}
            </div>
            
            {achievement.unlocked && (
              <Medal size={18} style={{ color: '#ffeaa7' }} />
            )}
          </div>
        </div>
      ))}
    </div>
  );

  const renderActivity = () => (
    <div style={{ paddingTop: '20px', paddingBottom: '20px' }}>
      <h2 style={{ fontSize: '24px', fontWeight: '700', color: 'white', marginBottom: '20px' }}>
        Recent Activity
      </h2>

      {activityError ? (
        <ErrorBanner message={activityError} onRetry={() => setRetryCount(c => c + 1)} />
      ) : activityLoading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Loader size={28} style={{ animation: 'spin 1s linear infinite', color: 'white' }} />
        </div>
      ) : recentActivity.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎯</div>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#1a1a1a', marginBottom: '8px' }}>
            No activity yet
          </p>
          <p style={{ fontSize: '14px', color: '#666' }}>
            Complete your first skill swap to see it here!
          </p>
        </div>
      ) : (
        recentActivity.map((activity) => (
          <div key={activity.id} className="card" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '44px', height: '44px', background: 'white',
                borderRadius: '10px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)', flexShrink: 0
              }}>
                {activity.thumbnail}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: '14px', fontWeight: '600', color: '#1a1a1a',
                  marginBottom: '2px', overflow: 'hidden',
                  textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                }}>
                  {activity.skill}
                </p>
                <p style={{ fontSize: '12px', color: '#666666' }}>
                  Completed · {activity.time}
                </p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="fade-in">
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        background: 'rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        padding: '4px',
        margin: '20px 0',
        backdropFilter: 'blur(10px)'
      }}>
        {[
          { id: 'overview', label: 'Overview', icon: <User size={16} /> },
          { id: 'skills', label: 'Skills', icon: <Camera size={16} /> },
          { id: 'achievements', label: 'Awards', icon: <Trophy size={16} /> },
          { id: 'activity', label: 'Activity', icon: <Clock size={16} /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '12px 8px',
              background: activeTab === tab.id ? 'white' : 'transparent',
              color: activeTab === tab.id ? '#1a1a1a' : 'rgba(255,255,255,0.8)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '12px',
              fontWeight: '500'
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'skills' && renderSkills()}
        {activeTab === 'achievements' && renderAchievements()}
        {activeTab === 'activity' && renderActivity()}
      </div>
    </div>
  );
}

export default ProfileScreen;
