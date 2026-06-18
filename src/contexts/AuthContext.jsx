import React, { createContext, useContext, useState, useEffect } from "react";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import app from "../Firebae/Firebase__config__";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const auth = getAuth(app);
  const googleProvider = new GoogleAuthProvider();

  googleProvider.setCustomParameters({
    prompt: "select_account",
  });

  const getErrorMessage = (error) => {
    if (!error) return "Something went wrong";

    if (error.code === "auth/email-already-in-use") {
      return "This email already exists in Firebase. If this was created before, login with the same password and the missing database profile will be restored.";
    }

    if (
      error.code === "auth/invalid-credential" ||
      error.code === "auth/wrong-password" ||
      error.code === "auth/user-not-found"
    ) {
      return "Invalid email or password.";
    }

    if (error.code === "auth/popup-closed-by-user") {
      return "Google sign in was cancelled.";
    }

    return error.message || "Something went wrong";
  };

  const parseApiResponse = async (response, fallbackMessage) => {
    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (!response.ok || data?.success === false) {
      throw new Error(data?.message || fallbackMessage);
    }

    return data;
  };

  const buildBackendUserData = (firebaseUser, userData = {}) => {
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName:
        userData?.fullName || firebaseUser.displayName || userData?.displayName || "",
      photoURL: userData?.photoURL || firebaseUser.photoURL || "",
      location: userData?.location || "",
      profession: userData?.profession || "",
      userType: userData?.userType || "jobSeeker",
      profileCompleted: false,
      package: userData?.package || "Basic",
      packageExpiry: userData?.packageExpiry || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  };

  const saveUserToBackend = async (userData) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        }
      );

      const result = await parseApiResponse(
        response,
        "Failed to save user to database"
      );

      return result.user;
    } catch (error) {
      console.error("Error saving user to backend:", error);
      throw error;
    }
  };

  const getUserFromBackend = async (uid) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/${uid}`
      );

      if (response.status === 404) {
        return null;
      }

      const result = await parseApiResponse(
        response,
        "Failed to fetch user from backend"
      );

      return result.user || null;
    } catch (error) {
      console.error("Error fetching user from backend:", error);
      return null;
    }
  };

  const checkEmailExists = async (email) => {
    const cleanEmail = String(email || "").trim().toLowerCase();

    if (!cleanEmail) return false;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/check-email?email=${encodeURIComponent(
          cleanEmail
        )}`
      );

      const data = await parseApiResponse(response, "Failed to check email");

      return !!data.exists;
    } catch (error) {
      console.warn("Backend email check failed:", error.message);
      return false;
    }
  };

  const refreshUserProfile = async () => {
    if (!user) return;

    try {
      const profile = await getUserFromBackend(user.uid);

      if (profile) {
        setUserProfile(profile);
      }
    } catch (error) {
      console.error("Error refreshing profile:", error);
    }
  };

  const sendVerificationCode = async (email, type, userData = null) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/send-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, type, userData }),
        }
      );

      const data = await parseApiResponse(
        response,
        "Failed to send verification code"
      );

      return data;
    } catch (error) {
      console.error("Error sending verification code:", error);
      throw error;
    }
  };

  const verifyCode = async (email, code, type) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/verify-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, code, type }),
        }
      );

      const data = await parseApiResponse(response, "Verification failed");

      return data;
    } catch (error) {
      console.error("Error verifying code:", error);
      throw error;
    }
  };

  const consumeVerificationCode = async (email, code, type) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/auth/consume-code`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email, code, type }),
        }
      );

      const data = await parseApiResponse(
        response,
        "Failed to consume verification code"
      );

      return data;
    } catch (error) {
      console.error("Error consuming verification code:", error);
      throw error;
    }
  };

  const signUp = async (email, password, userData) => {
    try {
      setError("");

      let userCredential;

      try {
        userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
      } catch (firebaseError) {
        if (firebaseError.code !== "auth/email-already-in-use") {
          throw firebaseError;
        }

        try {
          userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password
          );
        } catch {
          throw new Error(
            "This email already exists in Firebase, but the password did not match. Please login with the correct password or reset your Firebase account password."
          );
        }

        const alreadySavedUser = await getUserFromBackend(userCredential.user.uid);

        if (alreadySavedUser) {
          setUser(userCredential.user);
          setUserProfile(alreadySavedUser);

          throw new Error("This email already has an account. Please login instead.");
        }
      }

      const firebaseUser = userCredential.user;

      if (userData) {
        await updateProfile(firebaseUser, {
          displayName: userData.fullName || firebaseUser.displayName || "",
          photoURL: userData.photoURL || firebaseUser.photoURL || "",
        });
      }

      const backendUserData = buildBackendUserData(firebaseUser, userData);
      const savedUser = await saveUserToBackend(backendUserData);

      setUser(firebaseUser);
      setUserProfile(savedUser);

      return userCredential;
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
      throw new Error(message);
    }
  };

  const logIn = async (email, password) => {
    try {
      setError("");

      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const firebaseUser = userCredential.user;

      let backendUser = await getUserFromBackend(firebaseUser.uid);

      if (!backendUser) {
        const backendUserData = buildBackendUserData(firebaseUser);
        backendUser = await saveUserToBackend(backendUserData);
      }

      setUser(firebaseUser);
      setUserProfile(backendUser);

      return userCredential;
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
      throw new Error(message);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError("");

      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      let backendUser = await getUserFromBackend(firebaseUser.uid);

      if (!backendUser) {
        const userData = buildBackendUserData(firebaseUser, {
          displayName: firebaseUser.displayName || "",
          photoURL: firebaseUser.photoURL || "",
          userType: "jobSeeker",
          package: "Basic",
        });

        backendUser = await saveUserToBackend(userData);
      }

      setUser(firebaseUser);
      setUserProfile(backendUser);

      return result;
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
      throw new Error(message);
    }
  };

  const logout = async () => {
    try {
      setError("");

      await signOut(auth);

      setUser(null);
      setUserProfile(null);
    } catch (error) {
      const message = getErrorMessage(error);
      setError(message);
      throw new Error(message);
    }
  };

  const clearError = () => setError("");

  const updateUserProfile = async (uid, updateData) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/users/${uid}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      const result = await parseApiResponse(response, "Failed to update user");

      setUserProfile(result.user);

      return result.user;
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  };

  const handleAuthStateChange = async (currentUser) => {
    setUser(currentUser);

    if (currentUser) {
      try {
        let profile = await getUserFromBackend(currentUser.uid);

        if (!profile) {
          const backendUserData = buildBackendUserData(currentUser);
          profile = await saveUserToBackend(backendUserData);
        }

        setUserProfile(profile);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
      }
    } else {
      setUserProfile(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, handleAuthStateChange);
    return unsubscribe;
  }, []);

  const value = {
    user,
    userProfile,
    signUp,
    logIn,
    signInWithGoogle,
    logout,
    updateUserProfile,
    sendVerificationCode,
    verifyCode,
    consumeVerificationCode,
    checkEmailExists,
    refreshUserProfile,
    error,
    clearError,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};