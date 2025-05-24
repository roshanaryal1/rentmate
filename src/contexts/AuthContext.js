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

  console.log('🔥 AuthProvider State:', { 
    currentUser: currentUser?.email, 
    userRole, 
    loading, 
    authChecked,
    timestamp: new Date().toISOString()
  });

  // Create user document in Firestore
  async function createUserDocument(user, additionalData = {}) {
    if (!user) return null;
    
    const userDocRef = doc(db, "users", user.uid);
    
    try {
      console.log('📄 Checking user document for UID:', user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        const userData = {
          displayName: user.displayName || additionalData.fullName || user.email.split('@')[0],
          email: user.email,
          role: additionalData.role || 'renter',
          createdAt: serverTimestamp(),
          ...additionalData
        };
        
        console.log('✍️ Creating new user document:', userData);
        await setDoc(userDocRef, userData);
        console.log('✅ User document created successfully');
        return userData.role;
      } else {
        const existingData = userDoc.data();
        console.log('📋 Existing user document found:', existingData);
        return existingData.role || 'renter';
      }
    } catch (error) {
      console.error('❌ Error with user document:', error);
      return additionalData.role || 'renter';
    }
  }

  // Get user role from Firestore
  async function getUserRole(uid) {
    if (!uid) return 'renter';
    
    try {
      console.log('🔍 Getting user role for UID:', uid);
      
      const userDocRef = doc(db, "users", uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role || 'renter';
        console.log('👤 User role found:', role);
        return role;
      } else {
        console.log('⚠️ No user document found, defaulting to renter');
        return 'renter';
      }
    } catch (error) {
      console.error('❌ Error getting user role:', error);
      return 'renter';
    }
  }

  // Signup function
  async function signup(email, password, fullName, role = 'renter') {
    console.log('🚀 Starting signup process:', { email, fullName, role });
    
    try {
      setLoading(true);
      
      // Create Firebase user
      const result = await createUserWithEmailAndPassword(auth, email, password);
      console.log('✅ Firebase user created:', result.user.uid);
      
      // Update display name
      if (fullName) {
        await updateProfile(result.user, { displayName: fullName });
        console.log('✅ Display name updated');
      }
      
      // Create user document and get role
      const actualRole = await createUserDocument(result.user, { role, fullName });
      console.log('✅ User document created with role:', actualRole);
      
      // The auth state observer will handle setting the user and role
      // Don't set loading to false here, let the observer handle it
      
      return { user: result.user, role: actualRole };
    } catch (error) {
      console.error('❌ Signup error:', error);
      setLoading(false);
      throw error;
    }
  }

  // Login function
  async function login(email, password) {
    console.log('🔑 Starting login process for:', email);
    
    try {
      setLoading(true);
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      console.log('✅ Login successful:', result.user.uid);
      
      // Get user role
      const role = await getUserRole(result.user.uid);
      console.log('✅ Role retrieved:', role);
      
      // The auth state observer will handle setting the user and role
      // Don't set loading to false here, let the observer handle it
      
      return { user: result.user, role };
    } catch (error) {
      console.error('❌ Login error:', error);
      setLoading(false);
      throw error;
    }
  }

  // Google sign-in
  async function signInWithGoogle(role = 'renter') {
    console.log('🔍 Starting Google signin with role:', role);
    
    try {
      setLoading(true);
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Google signin successful:', result.user.uid);
      
      // Create or get user document
      const actualRole = await createUserDocument(result.user, { role });
      console.log('✅ Google user role:', actualRole);
      
      // The auth state observer will handle setting the user and role
      // Don't set loading to false here, let the observer handle it
      
      return { user: result.user, role: actualRole };
    } catch (error) {
      console.error('❌ Google signin error:', error);
      setLoading(false);
      throw error;
    }
  }

  // Reset password
  async function resetPassword(email) {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('❌ Reset password error:', error);
      throw error;
    }
  }

  // Logout
  async function logout() {
    try {
      console.log('🚪 Logging out...');
      await signOut(auth);
      setUserRole(null);
      setCurrentUser(null);
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      throw error;
    }
  }

  // Auth state observer
  useEffect(() => {
    console.log('👂 Setting up auth state listener...');
    
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔄 Auth state changed:', user ? `${user.email} (${user.uid})` : 'No user');
      
      try {
        if (user) {
          console.log('👤 User authenticated, getting role...');
          setCurrentUser(user);
          
          const role = await getUserRole(user.uid);
          console.log('✅ Role set:', role);
          setUserRole(role);
        } else {
          console.log('👤 No user, clearing state...');
          setCurrentUser(null);
          setUserRole(null);
        }
      } catch (error) {
        console.error('❌ Error in auth state observer:', error);
        if (user) {
          setCurrentUser(user);
          setUserRole('renter'); // Fallback
        }
      } finally {
        setLoading(false);
        setAuthChecked(true);
        console.log('✅ Auth check completed');
      }
    });

    // Cleanup timeout after 10 seconds
    const timeout = setTimeout(() => {
      if (!authChecked) {
        console.log('⏰ Auth timeout, setting checked to true');
        setLoading(false);
        setAuthChecked(true);
      }
    }, 10000);

    return () => {
      clearTimeout(timeout);
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

  console.log('🎯 AuthProvider final state:', { 
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