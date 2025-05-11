import React, { useContext, useState, useEffect } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  sendPasswordResetEmail,
  onAuthStateChanged,
  updateEmail,
  updatePassword,
  updateProfile
} from "firebase/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, name, role) {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // Store user role in Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        email,
        name,
        role,
        createdAt: new Date().toISOString()
      });
      
      return userCredential;
    } catch (error) {
      throw error;
    }
  }
  
  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }
  
  function logout() {
    return signOut(auth);
  }
  
  function resetPassword(email) {
    return sendPasswordResetEmail(auth, email);
  }
  
  function updateUserEmail(email) {
    return updateEmail(currentUser, email);
  }
  
  function updateUserPassword(password) {
    return updatePassword(currentUser, password);
  }

  async function fetchUserRole(uid) {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        return userDoc.data().role;
      }
      return null;
    } catch (error) {
      console.error("Error fetching user role:", error);
      return null;
    }
  }
  
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user role when user logs in
        const role = await fetchUserRole(user.uid);
        setUserRole(role);
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
    login,
    signup,
    logout,
    resetPassword,
    updateUserEmail,
    updateUserPassword
  };
  
  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}