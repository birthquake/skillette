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

// Cloudinary configuration - Replace with your actual values
const CLOUDINARY_CLOUD_NAME = 'your-cloud-name';
const CLOUDINARY_UPLOAD_PRESET = 'your-upload-preset'; // Create this in Cloudinary dashboard

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
      avatar: '👤', // Default avatar for email users
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
