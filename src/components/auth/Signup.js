// src/components/auth/Signup.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Signup.css";

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user was trying to rent something before signup
    const pendingRental = localStorage.getItem('pendingRental');
    if (pendingRental) {
      setError('Please sign up to rent this equipment');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validate input fields
    if (!fullName.trim()) {
      setError('Please enter your full name');
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setError('Please enter your email');
      setLoading(false);
      return;
    }

    if (!password.trim()) {
      setError('Please enter a password');
      setLoading(false);
      return;
    }

    if (!confirmPassword.trim()) {
      setError('Please confirm your password');
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters');
      setLoading(false);
      return;
    }

    if (!role) {
      setError('Please select a role');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to create account with:', { email, fullName, role });
      await signup(email, password, fullName);
      console.log('Account created successfully!');
      
      // Wait a bit for auth state to update
      setTimeout(() => {
        console.log('Attempting navigation...');
        // Check if there was a pending rental
        const pendingRental = localStorage.getItem('pendingRental');
        if (pendingRental) {
          localStorage.removeItem('pendingRental');
          navigate(`/rent/${pendingRental}`);
        } else {
          navigate('/my-dashboard');
        }
      }, 1000);
      
    } catch (err) {
      console.error('Full signup error:', err);
      let errorMessage = 'Failed to create account';
      
      switch (err.code) {
        case 'auth/weak-password':
          errorMessage = 'Password should be at least 6 characters';
          break;
        case 'auth/email-already-in-use':
          errorMessage = 'Email is already registered';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password authentication is not enabled';
          break;
        case 'auth/missing-email':
          errorMessage = 'Email is required';
          break;
        case 'auth/missing-password':
          errorMessage = 'Password is required';
          break;
        default:
          console.error('Unknown signup error:', err);
          errorMessage = `Failed to create account: ${err.message || err.code || 'Unknown error'}`;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="logo-section">
          <div className="logo">
            <div className="house-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2L26 12V26H20V18H12V26H6V12L16 2Z" fill="#4285F4"/>
                <circle cx="8" cy="10" r="2" fill="#4285F4"/>
                <rect x="7" y="8" width="2" height="2" fill="white"/>
              </svg>
            </div>
            <h1>RentMate</h1>
          </div>
        </div>

        <h2 className="signup-title">Sign up</h2>

        {error && (
          <div className="signup-error">
            {error}
          </div>
        )}

        <form className="signup-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="fullName">Full name</label>
            <input 
              id="fullName"
              type="text" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email address</label>
            <input 
              id="email"
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required 
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input 
                id="password"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required 
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input 
                id="confirmPassword"
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required 
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="role">Role</label>
            <div className="select-wrapper">
              <select 
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="">Select role</option>
                <option value="renter">Renter</option>
                <option value="owner">Equipment Owner</option>
                <option value="both">Both</option>
              </select>
              <svg className="select-arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 6L8 10L12 6" stroke="#666" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>

          <button 
            type="submit" 
            className="signup-btn primary"
            disabled={loading}
          >
            {loading ? 'Signing Up...' : 'Sign up'}
          </button>
        </form>

        <div className="login-link">
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;