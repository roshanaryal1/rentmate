// firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBcxPcu_CZtwWhhbBgFiJkRmgtcRW3FQs4",
  authDomain: "rentmate-c7360.firebaseapp.com",
  projectId: "rentmate-c7360",
  storageBucket: "rentmate-c7360.firebasestorage.app",
  messagingSenderId: "184718582938",
  appId: "1:184718582938:web:7990263a98ec92526aeb23",
  measurementId: "G-8W0V0Y8MJX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
export default app;