import React, { useContext, useState, useEffect } from "react";
import { 
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = React.createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  console.log('AuthProvider rendering...');

  // Create user document in Firestore
  async function createUserDocument(user, additionalData = {}) {
    const userDocRef = doc(db, "users", user.uid);
    
    try {
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        const { displayName, email } = user;
        const userData = {
          displayName,
          email,
          createdAt: serverTimestamp(),
          ...additionalData
        };
        
        await setDoc(userDocRef, userData);
        console.log("User document created:", userData);
        return userData;
      } else {
        return userDoc.data();
      }
    } catch (error) {
      console.error("Error creating user document:", error);
      throw error;
    }
  }

  // Get user role from Firestore
  async function getUserRole(uid) {
    try {
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.role || 'renter'; // Default to renter if no role is set
      }
      return 'renter';
    } catch (error) {
      console.error("Error getting user role:", error);
      return 'renter';
    }
  }

  // Simple signup function with role
  async function signup(email, password, fullName, role = 'renter') {
    try {
      console.log('Signup attempt:', { email, fullName, role });
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the display name
      await updateProfile(result.user, {
        displayName: fullName
      });
      
      // Create user document with role
      await createUserDocument(result.user, {
        role: role,
        fullName: fullName
      });
      
      console.log('Signup successful:', result.user.uid);
      setUserRole(role);
      return result;
    } catch (error) {
      console.error("Signup Error:", error);
      throw error;
    }
  }

  // Google sign-in with role
  async function signInWithGoogle(role = 'renter') {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Create or update user document with role
      await createUserDocument(result.user, { role });
      
      const userRole = await getUserRole(result.user.uid);
      setUserRole(userRole);
      
      return result;
    } catch (error) {
      console.error("Google Sign-in Error:", error);
      throw error;
    }
  }

  // Apple sign-in (placeholder - would need additional setup)
  async function signInWithApple(role = 'renter') {
    // This would require setting up Apple Sign-In
    // For now, throw an error
    throw new Error('Apple Sign-In not yet implemented');
  }

  // Simple login function
  async function login(email, password) {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Get user role after login
      const role = await getUserRole(result.user.uid);
      setUserRole(role);
      
      return result;
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    }
  }

  // Reset password function
  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error("Reset Password Error:", error);
      throw error;
    }
  }

  // Logout function
  async function logout() {
    try {
      await signOut(auth);
      setUserRole(null);
    } catch (error) {
      console.error("Logout Error:", error);
      throw error;
    }
  }

  // Auth State Observer
  useEffect(() => {
    console.log('Setting up auth state listener...');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? user.email : 'No user');
      setCurrentUser(user);
      
      if (user) {
        // Get user role when user is authenticated
        const role = await getUserRole(user.uid);
        setUserRole(role);
        console.log('User role:', role);
      } else {
        setUserRole(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    signup,
    login,
    logout,
    signInWithGoogle,
    signInWithApple,
    resetPassword
  };

  console.log('AuthProvider value:', value);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}