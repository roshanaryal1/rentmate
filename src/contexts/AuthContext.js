import React, { useContext, useState, useEffect } from "react";
import {
  onAuthStateChanged,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

const AuthContext = React.createContext();
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  async function createUserDocument(user, additionalData = {}) {
    const ref = doc(db, "users", user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const data = {
        displayName: user.displayName,
        email: user.email,
        createdAt: serverTimestamp(),
        ...additionalData,
      };
      await setDoc(ref, data);
      return data;
    }
    return snap.data();
  }

  async function getUserRole(uid) {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      return snap.exists() ? snap.data().role : "renter";
    } catch {
      return "renter";
    }
  }

  // ——— SIGNUP ———
  async function signup(email, password, fullName, role = "renter") {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: fullName });
    await createUserDocument(result.user, { role, fullName });
    setUserRole(role);
    return { user: result.user, role };
  }

  // ——— GOOGLE ———
  async function signInWithGoogle(role = "renter") {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await createUserDocument(result.user, { role });
    const resolvedRole = await getUserRole(result.user.uid);
    setUserRole(resolvedRole);
    return { user: result.user, role: resolvedRole };
  }

  // ——— LOGIN ———
  async function login(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    const role = await getUserRole(result.user.uid);
    setUserRole(role);
    return { user: result.user, role };
  }

  // ——— LOGOUT / RESET ———
  async function logout() {
    await signOut(auth);
    setUserRole(null);
  }
  async function resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const role = await getUserRole(user.uid);
        setUserRole(role);
      } else {
        setUserRole(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  const value = {
    currentUser,
    userRole,
    loading,
    signup,
    signInWithGoogle,
    login,
    logout,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
