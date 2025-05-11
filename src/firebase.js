// Import the functions you need from Firebase SDK
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
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

// Initialize Firebase Authentication and Firestore
export const auth = getAuth(app); // For user authentication
export const db = getFirestore(app); // For Firestore database

