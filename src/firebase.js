import { initializeApp } from 'firebase/app';
import { getAnalytics, logEvent as firebaseLogEvent } from 'firebase/analytics';
import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile 
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc, collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase configuration — values loaded from environment variables
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

// Analytics — only initializes in browser environments
let analytics = null;
try {
  analytics = getAnalytics(app);
} catch (e) {
  // Analytics not available (e.g. SSR or blocked by browser)
}

// Track an event — safe to call anywhere, silently no-ops if analytics unavailable
export const trackEvent = (eventName, params = {}) => {
  try {
    if (analytics) firebaseLogEvent(analytics, eventName, params);
  } catch (e) {
    // Never let analytics errors surface to the user
  }
};
export const storage = getStorage(app);

// Firebase Cloud Messaging
let messaging = null;
try {
  messaging = getMessaging(app);
} catch (e) {
  // Messaging not available in all environments (e.g. Safari without permission)
}
export { messaging };


// ─── Push Notification functions ──────────────────────────────────────────

// Request push permission and save the FCM token to the user's doc
export const requestPushPermission = async (userId) => {
  try {
    if (!messaging) return null;
    if (!('Notification' in window)) return null;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return null;

    const token = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js')
    });

    if (token && userId) {
      // Save token to user doc so other clients can send notifications to this device
      await updateDoc(doc(db, 'users', userId), {
        fcmToken: token,
        fcmTokenUpdatedAt: new Date()
      });
    }

    return token;
  } catch (error) {
    console.error('Push permission error:', error);
    return null;
  }
};

// Listen for foreground messages (app is open)
export const onForegroundMessage = (callback) => {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    callback(payload);
  });
};

// Send a push notification to a user via their saved FCM token
// Uses Firebase's REST API — no Cloud Functions needed
export const sendPushNotification = async (toUserId, { title, body, data = {} }) => {
  try {
    // Get the target user's FCM token
    const userSnap = await getDoc(doc(db, 'users', toUserId));
    if (!userSnap.exists()) return;

    const fcmToken = userSnap.data()?.fcmToken;
    if (!fcmToken) return; // User hasn't granted push permission

    // Call FCM REST API via a Firestore trigger document
    // We write to a pushQueue collection; a Cloud Function (or this client) delivers it
    await addDoc(collection(db, 'pushQueue'), {
      to: fcmToken,
      toUserId,
      notification: { title, body },
      data,
      createdAt: new Date(),
      delivered: false
    });
  } catch (error) {
    console.error('Error queuing push notification:', error);
  }
};

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
      
      // Onboarding
      hasSeenOnboarding: false,

      // Preferences
      preferences: {
        notifications: true,
        difficulty: 'mixed',
        categories: []
      }
    };
    
    try {
      await setDoc(userRef, userData);
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

// Video upload using Firebase Storage
export const uploadVideo = async (videoBlob, userId, challengeId, onProgress) => {
  try {
    // Derive extension from blob mime type so iOS mp4 and Android webm both work
    const ext = videoBlob.type.includes('mp4') ? 'mp4' : 'webm';
    const path = `videos/${userId}/${challengeId}_${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, videoBlob);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = Math.round(
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          );
          if (onProgress) onProgress(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          reject({ success: false, error: error.message });
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ success: true, url, path });
        }
      );
    });
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
    const q = query(
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

    // Shuffle the results so it feels random each time
    for (let i = skills.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [skills[i], skills[j]] = [skills[j], skills[i]];
    }
    
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

export const getActiveChallenge = async (userId) => {
  try {
    const q = query(
      collection(db, 'challenges'),
      where('userId', '==', userId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('Error getting active challenge:', error);
    return null;
  }
};

export const getUserChallenges = async (userId) => {
  try {
    const q = query(
      collection(db, 'challenges'),
      where('userId', '==', userId),
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

// Get recent activity for a user formatted for display
export const getRecentActivity = async (userId, limitNum = 10) => {
  try {
    const q = query(
      collection(db, 'challenges'),
      where('userId', '==', userId),
      where('status', '==', 'completed'),
      orderBy('updatedAt', 'desc'),
      limit(limitNum)
    );

    const querySnapshot = await getDocs(q);
    const activity = [];

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const updatedAt = data.updatedAt?.toDate?.() || new Date(data.updatedAt);

      // Format relative time
      const now = new Date();
      const diffMs = now - updatedAt;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      let timeLabel;
      if (diffMins < 60) timeLabel = `${diffMins}m ago`;
      else if (diffHours < 24) timeLabel = `${diffHours}h ago`;
      else if (diffDays === 1) timeLabel = 'Yesterday';
      else timeLabel = `${diffDays} days ago`;

      activity.push({
        id: docSnap.id,
        type: 'completed',
        skill: data.skill?.learnSkill?.title || 'Unknown Skill',
        thumbnail: data.skill?.learnSkill?.thumbnail || '🎯',
        time: timeLabel,
        updatedAt
      });
    });

    return activity;
  } catch (error) {
    console.error('Error getting recent activity:', error);
    return [];
  }
};


// Match functions
export const createMatch = async (matchData) => {
  try {
    const match = {
      ...matchData,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
      // Track completion for each side independently
      learnerCompleted: false,
      teacherCompleted: false,
    };
    const docRef = await addDoc(collection(db, 'matches'), match);
    return { success: true, id: docRef.id, match };
  } catch (error) {
    console.error('Error creating match:', error);
    return { success: false, error: error.message };
  }
};

export const getMatchByChallenge = async (challengeId) => {
  try {
    const q = query(
      collection(db, 'matches'),
      where('challengeId', '==', challengeId),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('Error getting match:', error);
    return null;
  }
};

export const updateMatch = async (matchId, updates) => {
  try {
    const matchRef = doc(db, 'matches', matchId);
    await updateDoc(matchRef, {
      ...updates,
      updatedAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating match:', error);
    return { success: false, error: error.message };
  }
};

export const getActiveMatchForUser = async (userId) => {
  try {
    const q = query(
      collection(db, 'matches'),
      where('learnerId', '==', userId),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const docSnap = querySnapshot.docs[0];
    return { id: docSnap.id, ...docSnap.data() };
  } catch (error) {
    console.error('Error getting active match:', error);
    return null;
  }
};

export const getUserBySkillId = async (skillId) => {
  try {
    const skillRef = doc(db, 'skills', skillId);
    const skillDoc = await getDoc(skillRef);
    if (!skillDoc.exists()) return null;
    const skillData = skillDoc.data();
    const userRef = doc(db, 'users', skillData.userId);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return null;
    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    console.error('Error getting skill owner:', error);
    return null;
  }
};


// Delete a skill
export const deleteSkill = async (skillId) => {
  try {
    await deleteDoc(doc(db, 'skills', skillId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting skill:', error);
    return { success: false };
  }
};

// Upload a profile photo and update the user's avatar URL
export const uploadAvatar = async (userId, imageBlob) => {
  try {
    const storageRef = ref(storage, `avatars/${userId}/avatar.jpg`);
    const uploadTask = uploadBytesResumable(storageRef, imageBlob);
    return new Promise((resolve, reject) => {
      uploadTask.on('state_changed', null,
        (error) => reject(error),
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          await updateDoc(doc(db, 'users', userId), { avatarUrl: url });
          resolve({ success: true, url });
        }
      );
    });
  } catch (error) {
    console.error('Error uploading avatar:', error);
    return { success: false };
  }
};

// Update an existing skill
export const updateSkill = async (skillId, updates) => {
  try {
    const skillRef = doc(db, 'skills', skillId);
    await updateDoc(skillRef, { ...updates, updatedAt: new Date() });
    return { success: true };
  } catch (error) {
    console.error('Error updating skill:', error);
    return { success: false };
  }
};

// Notification functions
export const createNotification = async (userId, notification) => {
  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      userId,
      ...notification,
      read: false,
      createdAt: new Date()
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('Error creating notification:', error);
    return { success: false };
  }
};

export const getUnreadNotifications = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

export const getAllNotifications = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(30)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting all notifications:', error);
    return [];
  }
};

export const markNotificationRead = async (notificationId) => {
  try {
    const ref = doc(db, 'notifications', notificationId);
    await updateDoc(ref, { read: true });
    return { success: true };
  } catch (error) {
    console.error('Error marking notification read:', error);
    return { success: false };
  }
};

export const markAllNotificationsRead = async (userId) => {
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    const updates = snapshot.docs.map(d => updateDoc(doc(db, 'notifications', d.id), { read: true }));
    await Promise.all(updates);
    return { success: true };
  } catch (error) {
    console.error('Error marking all read:', error);
    return { success: false };
  }
};

// Reporting
export const createReport = async (reportData) => {
  try {
    await addDoc(collection(db, 'reports'), {
      ...reportData,
      status: 'pending',
      createdAt: new Date()
    });
    return { success: true };
  } catch (error) {
    console.error('Error creating report:', error);
    return { success: false };
  }
};


// Get a single skill by ID (for deep links)
export const getSkillById = async (skillId) => {
  try {
    const skillRef = doc(db, 'skills', skillId);
    const skillDoc = await getDoc(skillRef);
    if (skillDoc.exists()) {
      return { id: skillDoc.id, ...skillDoc.data() };
    }
    return null;
  } catch (error) {
    console.error('Error getting skill:', error);
    return null;
  }
};

// ─── Rating functions ──────────────────────────────────────────────────────

export const submitRating = async ({ raterId, skillId, skillTitle, teacherId, matchId, skillRating, teacherRating, comment }) => {
  try {
    // Write the rating document
    const ratingRef = await addDoc(collection(db, 'ratings'), {
      raterId,
      skillId,
      skillTitle,
      teacherId,
      matchId: matchId || null,
      skillRating,
      teacherRating: teacherRating || null,
      comment: comment || null,
      createdAt: new Date(),
    });

    // Update skill's aggregate rating
    if (skillId) {
      const skillRef = doc(db, 'skills', skillId);
      const skillSnap = await getDoc(skillRef);
      if (skillSnap.exists()) {
        const data = skillSnap.data();
        const prevCount = data.ratingCount || 0;
        const prevAvg   = data.rating || 0;
        const newCount  = prevCount + 1;
        const newAvg    = parseFloat(((prevAvg * prevCount + skillRating) / newCount).toFixed(1));
        await updateDoc(skillRef, { rating: newAvg, ratingCount: newCount });
      }
    }

    // Update teacher's aggregate rating
    if (teacherId && teacherRating) {
      const teacherRef = doc(db, 'users', teacherId);
      const teacherSnap = await getDoc(teacherRef);
      if (teacherSnap.exists()) {
        const data = teacherSnap.data();
        const prevCount = data.teacherRatingCount || 0;
        const prevAvg   = data.teacherRating || 0;
        const newCount  = prevCount + 1;
        const newAvg    = parseFloat(((prevAvg * prevCount + teacherRating) / newCount).toFixed(1));
        await updateDoc(teacherRef, { teacherRating: newAvg, teacherRatingCount: newCount });
      }
    }

    return { success: true, id: ratingRef.id };
  } catch (error) {
    console.error('Error submitting rating:', error);
    return { success: false };
  }
};

export const getSkillRatings = async (skillId, limitNum = 10) => {
  try {
    const q = query(
      collection(db, 'ratings'),
      where('skillId', '==', skillId),
      orderBy('createdAt', 'desc'),
      limit(limitNum)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting ratings:', error);
    return [];
  }
};


// Leaderboard — top teachers by skillsTaught
export const getLeaderboard = async (limitNum = 10) => {
  try {
    const q = query(
      collection(db, 'users'),
      orderBy('skillsTaught', 'desc'),
      limit(limitNum)
    );
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error getting leaderboard:', error);
    return [];
  }
};
// Admin functions
export const getAdminData = async () => {
  try {
    // Get pending and recent reports
    const reportsQ = query(
      collection(db, 'reports'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const reportsSnap = await getDocs(reportsQ);
    const reports = reportsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    // Get aggregate stats
    const [usersSnap, skillsSnap] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'skills')),
    ]);

    return {
      reports,
      stats: {
        totalUsers: usersSnap.size,
        totalSkills: skillsSnap.size,
      }
    };
  } catch (error) {
    console.error('Error loading admin data:', error);
    return { reports: [], stats: {} };
  }
};

export const resolveReport = async (reportId, status) => {
  try {
    const ref = doc(db, 'reports', reportId);
    await updateDoc(ref, { status, resolvedAt: new Date() });
    return { success: true };
  } catch (error) {
    console.error('Error resolving report:', error);
    return { success: false };
  }
};
// Auth state listener
export const onAuthStateChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};
