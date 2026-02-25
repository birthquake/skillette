import React, { useState, useEffect, useCallback } from 'react';
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
  Trash2
} from 'lucide-react';
import { getUserSkills, getRecentActivity, deleteSkill, trackEvent } from '../firebase';
import { usePullToRefresh } from './usePullToRefresh';
import PullToRefreshIndicator from './PullToRefreshIndicator';
import { SkillCardSkeleton, ActivityRowSkeleton } from './Skeleton';
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
  const [deletingSkillId, setDeletingSkillId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [activityError, setActivityError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  const handleRefresh = useCallback(async () => {
    setRetryCount(c => c + 1);
    trackEvent('pull_to_refresh', { screen: 'profile' });
  }, []);

  const { isRefreshing, pullDistance, handlers } = usePullToRefresh(handleRefresh);

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
          background: 'linear-gradient(135deg, #7c6af7 0%, #9c59f5 100%)',
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
          color: '#f0f0f5'
        }}>
          {user.name}
        </h1>
        
        <p style={{ 
          fontSize: '16px', 
          color: '#8b8fa8',
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
          <div style={{ fontSize: '12px', color: '#8b8fa8', textTransform: 'uppercase' }}>
            Skills Learned
          </div>
        </div>
        
        <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
          <Users size={24} style={{ color: '#f5576c', marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: '700', color: '#f5576c' }}>
            {user.skillsTaught}
          </div>
          <div style={{ fontSize: '12px', color: '#8b8fa8', textTransform: 'uppercase' }}>
            Skills Taught
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <span style={{ fontSize: '16px', fontWeight: '600' }}>Level Progress</span>
          <span style={{ fontSize: '14px', color: '#8b8fa8' }}>Level {user.level}</span>
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
            background: 'linear-gradient(135deg, #7c6af7 0%, #9c59f5 100%)',
            borderRadius: '6px',
            transition: 'width 0.5s ease'
          }} />
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#8b8fa8'
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

          {/* Admin link — only visible in dev or for admin UIDs */}
          {process.env.NODE_ENV === 'development' && (
            <button 
              className="btn btn-outline"
              onClick={() => onNavigate('admin')}
              style={{ justifyContent: 'space-between', textAlign: 'left', marginTop: '8px', borderColor: 'rgba(124,106,247,0.3)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span>🛡️</span>
                <span style={{ color: '#a594f9' }}>Admin Panel</span>
              </div>
              <ChevronRight size={18} style={{ color: '#a594f9' }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const handleDeleteSkill = async (skillId) => {
    setDeletingSkillId(skillId);
    const result = await deleteSkill(skillId);
    if (result.success) {
      setUserSkills(prev => prev.filter(s => s.id !== skillId));
      trackEvent('skill_deleted');
    }
    setDeletingSkillId(null);
    setConfirmDeleteId(null);
  };

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
        <div>
          <SkillCardSkeleton />
          <SkillCardSkeleton />
          <SkillCardSkeleton />
        </div>
      ) : skillsError ? (
        <ErrorBanner message={skillsError} onRetry={() => setRetryCount(c => c + 1)} />
      ) : userSkills.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎯</div>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#f0f0f5', marginBottom: '8px' }}>No skills yet</p>
          <p style={{ fontSize: '14px', color: '#8b8fa8', marginBottom: '16px' }}>Add your first skill to get started!</p>
          <button className="btn btn-primary" onClick={() => onNavigate('addSkill')}>Add a Skill</button>
        </div>
      ) : null}

      {!skillsLoading && !skillsError && userSkills.map((skill) => (
        <div key={skill.id} className="card" style={{ marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '50px', height: '50px', background: '#252838',
              borderRadius: '12px', display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '20px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
            }}>
              {skill.thumbnail}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: '#f0f0f5' }}>
                {skill.title}
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#8b8fa8', marginBottom: '4px' }}>
                <span>{skill.category}</span>
                <span>•</span>
                <span>{skill.timesShared} swaps</span>
              </div>
              <span style={{
                background: getDifficultyColor(skill.difficulty), color: 'white',
                padding: '2px 6px', borderRadius: '4px', fontSize: '12px', fontWeight: '500'
              }}>
                {skill.difficulty}
              </span>
            </div>
            <button
              onClick={() => setConfirmDeleteId(skill.id)}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: '#555870', padding: '8px', borderRadius: '8px',
                transition: 'all 0.15s ease'
              }}
              onMouseOver={e => e.currentTarget.style.color = '#f5576c'}
              onMouseOut={e => e.currentTarget.style.color = '#555870'}
            >
              <Trash2 size={16} />
            </button>
          </div>

          {/* Confirm delete */}
          {confirmDeleteId === skill.id && (
            <div style={{
              marginTop: '12px', padding: '12px', borderRadius: '10px',
              background: 'rgba(245,87,108,0.1)', border: '1px solid rgba(245,87,108,0.3)'
            }}>
              <p style={{ fontSize: '13px', color: '#ff8097', marginBottom: '10px', fontWeight: '600' }}>
                Remove "{skill.title}" from the pool?
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)',
                    background: '#252838', color: '#8b8fa8', fontSize: '13px', fontWeight: '600', cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteSkill(skill.id)}
                  disabled={deletingSkillId === skill.id}
                  style={{
                    flex: 1, padding: '8px', borderRadius: '8px', border: 'none',
                    background: 'linear-gradient(135deg, #f5576c 0%, #f093fb 100%)',
                    color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                    opacity: deletingSkillId === skill.id ? 0.6 : 1
                  }}
                >
                  {deletingSkillId === skill.id ? 'Removing...' : 'Remove'}
                </button>
              </div>
            </div>
          )}
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
                color: '#8b8fa8',
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
                  color: '#8b8fa8',
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
        <div>
          <ActivityRowSkeleton />
          <ActivityRowSkeleton />
          <ActivityRowSkeleton />
          <ActivityRowSkeleton />
        </div>
      ) : recentActivity.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎯</div>
          <p style={{ fontSize: '16px', fontWeight: '600', color: '#f0f0f5', marginBottom: '8px' }}>
            No activity yet
          </p>
          <p style={{ fontSize: '14px', color: '#8b8fa8' }}>
            Complete your first skill swap to see it here!
          </p>
        </div>
      ) : (
        recentActivity.map((activity) => (
          <div key={activity.id} className="card" style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '44px', height: '44px', background: '#1a1d27',
                borderRadius: '10px', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '20px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)', flexShrink: 0
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
                <p style={{ fontSize: '12px', color: '#8b8fa8' }}>
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
    <div {...handlers} className="fade-in">
      <PullToRefreshIndicator pullDistance={pullDistance} isRefreshing={isRefreshing} />
      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        background: 'rgba(255,255,255,0.05)',
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
              color: activeTab === tab.id ? '#1a1a1a' : 'rgba(240,240,245,0.6)',
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
