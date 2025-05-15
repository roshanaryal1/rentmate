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
  const [authChecked, setAuthChecked] = useState(false);

  console.log('AuthProvider rendering...', { currentUser: currentUser?.email, userRole, loading });

  // Create user document in Firestore with retry logic
  async function createUserDocument(user, additionalData = {}, retries = 3) {
    const userDocRef = doc(db, "users", user.uid);
    
    for (let i = 0; i < retries; i++) {
      try {
        console.log('Checking if user document exists...');
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
          const { displayName, email } = user;
          const userData = {
            displayName,
            email,
            createdAt: serverTimestamp(),
            ...additionalData
          };
          
          console.log('Creating user document with data:', userData);
          await setDoc(userDocRef, userData);
          console.log("User document created successfully:", userData);
          return userData;
        } else {
          const existingData = userDoc.data();
          console.log("User document already exists:", existingData);
          return existingData;
        }
      } catch (error) {
        console.error(`Error creating user document (attempt ${i + 1}):`, error);
        if (i === retries - 1) throw error;
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }

  // Get user role from Firestore with caching
  async function getUserRole(uid) {
    try {
      console.log('Getting user role for UID:', uid);
      
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role || 'renter';
        console.log('User data from Firestore:', userData);
        console.log('Extracted role:', role);
        
        // Cache the role
        localStorage.setItem(`userRole_${uid}`, role);
        return role;
      } else {
        console.log('User document does not exist, defaulting to renter');
        return 'renter';
      }
    } catch (error) {
      console.error("Error getting user role:", error);
      // Return cached role if available
      const cachedRole = localStorage.getItem(`userRole_${uid}`);
      console.log('Returning cached role:', cachedRole);
      return cachedRole || 'renter';
    }
  }

  // Simple signup function with role
  async function signup(email, password, fullName, role = 'renter') {
    try {
      console.log('Signup attempt with role:', { email, fullName, role });
      setLoading(true);
      
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('Firebase user created:', result.user.uid);
      
      // Update the display name
      await updateProfile(result.user, {
        displayName: fullName
      });
      console.log('Display name updated');
      
      // Create user document with role
      await createUserDocument(result.user, {
        role: role,
        fullName: fullName
      });
      
      console.log('User document created, setting role to:', role);
      setUserRole(role);
      
      // Cache the role
      localStorage.setItem(`userRole_${result.user.uid}`, role);
      console.log('Role cached:', role);
      
      return result;
    } catch (error) {
      console.error("Signup Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Google sign-in with role
  async function signInWithGoogle(role = 'renter') {
    try {
      console.log('Google signin with role:', role);
      setLoading(true);
      const provider = new GoogleAuthProvider();
      // Add prompt to force account selection
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      console.log('Google signin successful:', result.user.uid);
      
      // Create or update user document with role
      await createUserDocument(result.user, { role });
      
      const userRole = await getUserRole(result.user.uid);
      setUserRole(userRole);
      console.log('Final role set after Google signin:', userRole);
      
      return result;
    } catch (error) {
      console.error("Google Sign-in Error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Simple login function
  async function login(email, password) {
    try {
      console.log('Login attempt for:', email);
      setLoading(true);
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('Login successful:', result.user.uid);
      
      // Get user role after login
      const role = await getUserRole(result.user.uid);
      setUserRole(role);
      console.log('Role set after login:', role);
      
      return result;
    } catch (error) {
      console.error("Login Error:", error);
      throw error;
    } finally {
      setLoading(false);
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
      // Clear cached role
      if (currentUser) {
        localStorage.removeItem(`userRole_${currentUser.uid}`);
      }
    } catch (error) {
      console.error("Logout Error:", error);
      throw error;
    }
  }

  // Auth State Observer with timeout
  useEffect(() => {
    console.log('Setting up auth state listener...');
    
    // Set a timeout for auth initialization
    const authTimeout = setTimeout(() => {
      if (!authChecked) {
        console.log('Auth check timeout - proceeding without auth');
        setLoading(false);
        setAuthChecked(true);
      }
    }, 5000); // 5 second timeout

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? user.email : 'No user');
      
      clearTimeout(authTimeout);
      setCurrentUser(user);
      
      if (user) {
        try {
          // Get user role when user is authenticated
          console.log('User authenticated, getting role...');
          const role = await getUserRole(user.uid);
          setUserRole(role);
          console.log('User role set in auth state observer:', role);
        } catch (error) {
          console.error('Error getting user role:', error);
          setUserRole('renter'); // Fallback role
        }
      } else {
        setUserRole(null);
        console.log('No user, role set to null');
      }
      
      setLoading(false);
      setAuthChecked(true);
    });

    return () => {
      clearTimeout(authTimeout);
      unsubscribe();
    };
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    authChecked,
    signup,
    login,
    logout,
    signInWithGoogle,
    resetPassword
  };

  console.log('AuthProvider final state:', { 
    currentUser: currentUser?.email, 
    userRole, 
    loading, 
    authChecked 
  });

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}