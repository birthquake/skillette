import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChange, 
  signInWithEmail,
  signUpWithEmail, 
  signOutUser, 
  getUserData,
  updateUserData,
  createUserDocument 
} from '../firebase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setLoading(true);
      setAuthError(null);
      
      if (user) {
        try {
          // Set the current user
          setCurrentUser(user);
          
          // Get or create user profile data
          const profile = await createUserDocument(user);
          setUserProfile(profile);
          
        } catch (error) {
          console.error('Error setting up user:', error);
          setAuthError(error.message);
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  // Sign in with email
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const result = await signInWithEmail(email, password);
      
      if (!result.success) {
        setAuthError(result.error);
        return { success: false, error: result.error };
      }
      
      return { success: true };
    } catch (error) {
      setAuthError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign up with email
  const signUp = async (email, password, displayName) => {
    try {
      setLoading(true);
      setAuthError(null);
      
      const result = await signUpWithEmail(email, password, displayName);
      
      if (!result.success) {
        setAuthError(result.error);
        return { success: false, error: result.error };
      }
      
      return { success: true };
    } catch (error) {
      setAuthError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      setLoading(true);
      const result = await signOutUser();
      
      if (result.success) {
        setCurrentUser(null);
        setUserProfile(null);
      }
      
      return result;
    } catch (error) {
      setAuthError(error.message);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (updates) => {
    if (!currentUser) {
      return { success: false, error: 'No user logged in' };
    }

    try {
      const result = await updateUserData(currentUser.uid, updates);
      
      if (result.success) {
        // Update local state
        setUserProfile(prev => ({
          ...prev,
          ...updates,
          updatedAt: new Date()
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Error updating profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Increment skill counters
  const incrementSkillsLearned = async () => {
    if (!userProfile) return;
    
    const newCount = (userProfile.skillsLearned || 0) + 1;
    const newXP = (userProfile.xp || 0) + 50;
    const newLevel = Math.floor(newXP / 500) + 1;
    
    return await updateProfile({
      skillsLearned: newCount,
      xp: newXP,
      level: newLevel,
      totalChallenges: (userProfile.totalChallenges || 0) + 1,
      completedChallenges: (userProfile.completedChallenges || 0) + 1
    });
  };

  const incrementSkillsTaught = async () => {
    if (!userProfile) return;
    
    const newCount = (userProfile.skillsTaught || 0) + 1;
    const newXP = (userProfile.xp || 0) + 30;
    const newLevel = Math.floor(newXP / 500) + 1;
    
    return await updateProfile({
      skillsTaught: newCount,
      xp: newXP,
      level: newLevel
    });
  };

  // Update streak
  const updateStreak = async () => {
    if (!userProfile) return;
    
    const today = new Date();
    const lastActive = userProfile.lastActiveDate?.toDate?.() || new Date(userProfile.lastActiveDate);
    const daysSinceActive = Math.floor((today - lastActive) / (1000 * 60 * 60 * 24));
    
    let newStreak = userProfile.streak || 0;
    
    if (daysSinceActive === 0) {
      // Same day, don't change streak
      return;
    } else if (daysSinceActive === 1) {
      // Consecutive day, increment streak
      newStreak += 1;
    } else {
      // Missed days, reset streak
      newStreak = 1;
    }
    
    return await updateProfile({
      streak: newStreak,
      lastActiveDate: today
    });
  };

  // Refresh user data
  const refreshUserData = async () => {
    if (!currentUser) return;
    
    try {
      const updatedProfile = await getUserData(currentUser.uid);
      setUserProfile(updatedProfile);
      return { success: true };
    } catch (error) {
      console.error('Error refreshing user data:', error);
      return { success: false, error: error.message };
    }
  };

  // Check if user is premium (placeholder for future feature)
  const isPremium = () => {
    return userProfile?.premium || false;
  };

  // Get user display data (for compatibility with existing components)
  const getUserDisplayData = () => {
    if (!userProfile) {
      return {
        name: 'Anonymous',
        avatar: '👤',
        level: 1,
        streak: 0,
        skillsLearned: 0,
        skillsTaught: 0,
        xp: 0
      };
    }

    return {
      name: userProfile.name || 'Anonymous',
      avatar: userProfile.avatar || '👤',
      level: userProfile.level || 1,
      streak: userProfile.streak || 0,
      skillsLearned: userProfile.skillsLearned || 0,
      skillsTaught: userProfile.skillsTaught || 0,
      xp: userProfile.xp || 0
    };
  };

  const value = {
    // State
    currentUser,
    userProfile,
    loading,
    authError,
    
    // Auth functions
    signIn,
    signUp,
    signOut,
    
    // Profile functions
    updateProfile,
    refreshUserData,
    incrementSkillsLearned,
    incrementSkillsTaught,
    updateStreak,
    
    // Utility functions
    isPremium,
    getUserDisplayData,
    
    // Computed values
    isAuthenticated: !!currentUser,
    hasProfile: !!userProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
