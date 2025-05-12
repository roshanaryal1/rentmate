import React, { useContext, useState, useEffect } from "react";
import { 
  GoogleAuthProvider, 
  OAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Google Sign In Implementation
  async function signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Create/update user document in Firestore
      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        photoURL: result.user.photoURL,
        authProvider: "google",
        lastLogin: new Date().toISOString()
      }, { merge: true });

      return result;
    } catch (error) {
      console.error("Google Sign In Error:", error);
      throw error;
    }
  }

  // Apple Sign In Implementation
  async function signInWithApple() {
    try {
      const provider = new OAuthProvider('apple.com');
      provider.addScope('email');
      provider.addScope('name');
      
      const result = await signInWithPopup(auth, provider);
      
      await setDoc(doc(db, "users", result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName || 'Apple User',
        photoURL: result.user.photoURL,
        authProvider: "apple",
        lastLogin: new Date().toISOString()
      }, { merge: true });

      return result;
    } catch (error) {
      console.error("Apple Sign In Error:", error);
      throw error;
    }
  }

  // Logout Implementation
  async function logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout Error:", error);
      throw error;
    }
  }

  // Auth State Observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (user) {
          await setDoc(doc(db, "users", user.uid), {
            lastLogin: new Date().toISOString()
          }, { merge: true });
        }
        setCurrentUser(user);
      } catch (error) {
        console.error("Auth State Change Error:", error);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    signInWithGoogle,
    signInWithApple,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}