// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile
} from 'firebase/auth';
import app from '../Firebae/Firebase__config__';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();

  // Configure Google provider
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });

  // Save user to backend
  const saveUserToBackend = async (userData) => {
    try {
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to save user to database');
      }

      return result.user;
    } catch (error) {
      console.error('Error saving user to backend:', error);
      throw error;
    }
  };

  // Get user from backend
  const getUserFromBackend = async (uid) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${uid}`);
      
      if (!response.ok) {
        // If user not found (404), return null
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch user from backend');
      }
      
      const result = await response.json();

      if (result.success) {
        return result.user;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user from backend:', error);
      return null;
    }
  };

  // Check if user exists in backend
  const checkUserExistsInBackend = async (uid) => {
    try {
      const user = await getUserFromBackend(uid);
      return user !== null;
    } catch (error) {
      console.error('Error checking user existence:', error);
      return false;
    }
  };

  // Sign up with email and password
  const signUp = async (email, password, userData) => {
    try {
      setError('');
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update user profile with additional data
      if (userData) {
        await updateProfile(user, {
          displayName: userData.fullName,
          photoURL: userData.photoURL
        });
      }

      // Prepare user data for backend
      const backendUserData = {
        uid: user.uid,
        email: user.email,
        displayName: userData?.fullName || '',
        photoURL: userData?.photoURL || '',
        location: userData?.location || '',
        profession: userData?.profession || '',
        userType: userData?.userType || '',
        profileCompleted: false,
        package: userData?.package || 'Basic',
        createdAt: new Date().toISOString(),
      };

      // Save user to backend
      const savedUser = await saveUserToBackend(backendUserData);
      setUserProfile(savedUser);

      return userCredential;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Sign in with email and password
  const logIn = async (email, password) => {
    try {
      setError('');
      
      // First, sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Check if user exists in backend database
      const backendUser = await getUserFromBackend(firebaseUser.uid);
      
      if (!backendUser) {
        // User doesn't exist in backend, sign them out from Firebase
        await signOut(auth);
        
        // Clear user state
        setUser(null);
        setUserProfile(null);
        
        throw new Error('Account not found. Please sign up first.');
      }

      // User exists in backend, set the profile
      setUserProfile(backendUser);
      setUser(firebaseUser);

      return userCredential;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if user already exists in backend
      let backendUser = await getUserFromBackend(user.uid);
      
      if (!backendUser) {
        // Prepare user data for backend
        const userData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          package: 'Basic',
          packageExpiry: null,
          createdAt: new Date().toISOString(),
          profileCompleted: false
        };

        // Save user in backend
        backendUser = await saveUserToBackend(userData);
      }

      setUserProfile(backendUser);
      return result;
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    try {
      setError('');
      await signOut(auth);
      setUserProfile(null);
      setUser(null);
    } catch (error) {
      setError(error.message);
      throw error;
    }
  };

  // Clear error
  const clearError = () => setError('');

  // Update user profile
  const updateUserProfile = async (uid, updateData) => {
    try {
      const response = await fetch(`http://localhost:5000/api/users/${uid}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        setUserProfile(result.user);
        return result.user;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };

  // Handle auth state change
  const handleAuthStateChange = async (currentUser) => {
    setUser(currentUser);

    if (currentUser) {
      try {
        // Fetch user profile from backend
        const userProfile = await getUserFromBackend(currentUser.uid);
        
        if (userProfile) {
          setUserProfile(userProfile);
        } else {
          // User exists in Firebase but not in backend
          // This can happen if backend was reset or user was deleted from backend
          console.warn('User exists in Firebase but not in backend database');
          // Optionally, you can sign them out here
          // await logout();
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    } else {
      setUserProfile(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);
    return unsubscribe;
  }, [auth]);

  const value = {
    user,
    userProfile,
    signUp,
    logIn,
    signInWithGoogle,
    logout,
    updateUserProfile,
    error,
    clearError,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};