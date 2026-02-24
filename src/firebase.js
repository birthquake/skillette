import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Auth functions
export const signUpWithEmail = async (email, password, displayName) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Update the user's display name
    if (displayName) {
      await updateProfile(user, { displayName });
    }
    
    // Create user document
    await createUserDocument({
      ...user,
      displayName: displayName || user.displayName
    });
    
    return { success: true, user };
  } catch (error) {
    console.error('Sign up error:', error);
    return { success: false, error: error.message };
  }
};

export const signInWithEmail = async (email, password) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const user = result.user;
    
    // Update user document if it exists
    await createUserDocument(user);
    
    return { success: true, user };
  } catch (error) {
    console.error('Sign in error:', error);
    return { success: false, error: error.message };
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: error.message };
  }
};

// User document functions
export const createUserDocument = async (user) => {
  if (!user) return;
  
  const userRef = doc(db, 'users', user.uid);
  const userDoc = await getDoc(userRef);
  
  if (!userDoc.exists()) {
    const userData = {
      uid: user.uid,
      name: user.displayName || 'Anonymous',
      email: user.email,
      avatar: '👤',
      createdAt: new Date(),
      updatedAt: new Date(),
      
      // Skillette-specific data
      level: 1,
      xp: 0,
      streak: 0,
      lastActiveDate: new Date(),
      skillsLearned: 0,
      skillsTaught: 0,
      totalChallenges: 0,
      completedChallenges: 0,
      
      // Preferences
      preferences: {
        notifications: true,
        difficulty: 'mixed',
        categories: []
      }
    };
    
    try {
      await setDoc(userRef, userData);
      console.log('User document created');
      return userData;
    } catch (error) {
      console.error('Error creating user document:', error);
      throw error;
    }
  } else {
    // Update last active date
    await updateDoc(userRef, {
      lastActiveDate: new Date()
    });
    return userDoc.data();
  }
};

export const getUserData = async (uid) => {
  try {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      return userDoc.data();
    } else {
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Error getting user data:', error);
    throw error;
  }
};

export const updateUserData = async (uid, updates) => {
  try {
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      ...updates,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user data:', error);
    return { success: false, error: error.message };
  }
};

// Cloudinary upload function (will add environment variables later)
export const uploadVideo = async (videoBlob, userId, challengeId) => {
  try {
    // For now, create a mock URL until we set up Cloudinary
    const mockUrl = URL.createObjectURL(videoBlob);
    
    // TODO: Replace with actual Cloudinary upload when environment variables are set
    console.log('Video uploaded (mock):', mockUrl);
    
    return { 
      success: true, 
      url: mockUrl, 
      path: `videos/${userId}/${challengeId}/${Date.now()}.webm` 
    };
  } catch (error) {
    console.error('Error uploading video:', error);
    return { success: false, error: error.message };
  }
};

// Skills functions
export const createSkill = async (userId, skillData) => {
  try {
    const skill = {
      ...skillData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
      timesShared: 0,
      ratings: [],
      averageRating: 0,
      isActive: true
    };
    
    const docRef = await addDoc(collection(db, 'skills'), skill);
    return { success: true, id: docRef.id, skill };
  } catch (error) {
    console.error('Error creating skill:', error);
    return { success: false, error: error.message };
  }
};

export const getUserSkills = async (userId) => {
  try {
    const q = query(
      collection(db, 'skills'),
      where('userId', '==', userId),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const skills = [];
    
    querySnapshot.forEach((doc) => {
      skills.push({ id: doc.id, ...doc.data() });
    });
    
    return skills;
  } catch (error) {
    console.error('Error getting user skills:', error);
    return [];
  }
};

export const getRandomSkills = async (excludeUserId = null, limitNum = 10) => {
  try {
    let q = query(
      collection(db, 'skills'),
      where('isActive', '==', true),
      orderBy('createdAt', 'desc'),
      limit(limitNum)
    );
    
    const querySnapshot = await getDocs(q);
    const skills = [];
    
    querySnapshot.forEach((doc) => {
      const skillData = { id: doc.id, ...doc.data() };
      if (!excludeUserId || skillData.userId !== excludeUserId) {
        skills.push(skillData);
      }
    });
    
    return skills;
  } catch (error) {
    console.error('Error getting random skills:', error);
    return [];
  }
};

// Challenge functions
export const createChallenge = async (challengeData) => {
  try {
    const challenge = {
      ...challengeData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      startTime: new Date(),
      timeLimit: 24 * 60 * 60 * 1000,
    };
    
    const docRef = await addDoc(collection(db, 'challenges'), challenge);
    return { success: true, id: docRef.id, challenge };
  } catch (error) {
    console.error('Error creating challenge:', error);
    return { success: false, error: error.message };
  }
};

export const getUserChallenges = async (userId) => {
  try {
    const q = query(
      collection(db, 'challenges'),
      where('participants', 'array-contains', userId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    const querySnapshot = await getDocs(q);
    const challenges = [];
    
    querySnapshot.forEach((doc) => {
      challenges.push({ id: doc.id, ...doc.data() });
    });
    
    return challenges;
  } catch (error) {
    console.error('Error getting user challenges:', error);
    return [];
  }
};

export const updateChallenge = async (challengeId, updates) => {
  try {
    const challengeRef = doc(db, 'challenges', challengeId);
    await updateDoc(challengeRef, {
      ...updates,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating challenge:', error);
    return { success: false, error: error.message };
  }
};

// Auth state listener
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
