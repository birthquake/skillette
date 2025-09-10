import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA5RalEsFol5QqO8ihPuUmj822n_vPyqqU",
  authDomain: "skillette-455bf.firebaseapp.com",
  projectId: "skillette-455bf",
  storageBucket: "skillette-455bf.firebasestorage.app",
  messagingSenderId: "572364086216",
  appId: "1:572364086216:web:f8afacf3e5db7de373fefd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Auth functions
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Create user document if it doesn't exist
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
      avatar: user.photoURL || '👤',
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
        difficulty: 'mixed', // easy, medium, hard, mixed
        categories: [] // preferred skill categories
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
      // Exclude current user's skills if specified
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
      status: 'active', // active, completed, expired, cancelled
      startTime: new Date(),
      timeLimit: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
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

// Video upload function
export const uploadVideo = async (videoBlob, userId, challengeId) => {
  try {
    const timestamp = new Date().getTime();
    const fileName = `videos/${userId}/${challengeId}/${timestamp}.webm`;
    const videoRef = ref(storage, fileName);
    
    // Upload video
    const snapshot = await uploadBytes(videoRef, videoBlob);
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    return { success: true, url: downloadURL, path: fileName };
  } catch (error) {
    console.error('Error uploading video:', error);
    return { success: false, error: error.message };
  }
};

// Auth state listener
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
