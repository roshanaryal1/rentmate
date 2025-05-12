// src/components/Signup.js
import React from "react";
import "./Signup.css";
import { FaApple, FaGoogle } from "react-icons/fa";



const Signup = () => {
  const handleAppleSignup = () => {
    // Your Apple sign-in logic
    console.log("Apple Signup Clicked");
  };

  const handleGoogleSignup = () => {
    // Your Google sign-in logic
    console.log("Google Signup Clicked");
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2 className="signup-title">Create your RentMate Account</h2>

        <button className="signup-btn apple" onClick={handleAppleSignup}>
          <FaApple className="icon" />
          Continue with Apple
        </button>

        <button className="signup-btn google" onClick={handleGoogleSignup}>
          <FaGoogle className="icon" />
          Continue with Google
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        <form className="signup-form">
          <input type="text" placeholder="Full Name" required />
          <input type="email" placeholder="Email address" required />
          <input type="password" placeholder="Password" required />
          <button type="submit" className="signup-btn primary">
            Sign Up
          </button>
        </form>

        <p className="login-link">
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>
    </div>
  );
};

export default Signup;
