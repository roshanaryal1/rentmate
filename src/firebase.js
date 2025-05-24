// src/firebase.js

import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  connectAuthEmulator
} from "firebase/auth";
import {
  getFirestore,
  connectFirestoreEmulator,
  enableNetwork
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBcxPcu_CZtwWhhbBgFiJkRmgtcRW3FQs4",
  authDomain: "rentmate-c7360.firebaseapp.com",
  projectId: "rentmate-c7360",
  storageBucket: "rentmate-c7360.firebasestorage.app",
  messagingSenderId: "184718582938",
  appId: "1:184718582938:web:7990263a98ec92526aeb23",
  measurementId: "G-8W0V0Y8MJX"
};

let app;
try {
  app = initializeApp(firebaseConfig);
  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

const auth = getAuth(app);
const db = getFirestore(app);

// Set up providers
export const googleProvider = new GoogleAuthProvider();
export const facebookProvider = new FacebookAuthProvider();

// Sign-In Methods
export const signInWithGoogle = () => signInWithPopup(auth, googleProvider);
export const signInWithFacebook = () => signInWithPopup(auth, facebookProvider);

// Enable offline persistence
enableNetwork(db).catch((err) => {
  console.log("Failed to enable network persistence:", err);
});

// Optional: Connect to emulators
if (process.env.NODE_ENV === 'development' && window.location.hostname === 'localhost') {
  // connectAuthEmulator(auth, "http://localhost:9099");
  // connectFirestoreEmulator(db, 'localhost', 8080);
}

export { auth, db };