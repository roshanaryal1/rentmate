// src/components/Signup.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Signup.css";
import { FaApple, FaGoogle } from "react-icons/fa";

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signInWithGoogle, signInWithApple, signup } = useAuth();
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

    if (password.length < 6) {
      setError('Password should be at least 6 characters');
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting to create account with:', { email, fullName });
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

  const handleGoogleSignup = async () => {
    setError('');
    setLoading(true);
    
    try {
      await signInWithGoogle();
      
      // Check if there was a pending rental
      const pendingRental = localStorage.getItem('pendingRental');
      if (pendingRental) {
        localStorage.removeItem('pendingRental');
        navigate(`/rent/${pendingRental}`);
      } else {
        navigate('/my-dashboard');
      }
    } catch (error) {
      setError('Failed to sign up with Google');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignup = async () => {
    setError('');
    setLoading(true);
    
    try {
      await signInWithApple();
      
      // Check if there was a pending rental
      const pendingRental = localStorage.getItem('pendingRental');
      if (pendingRental) {
        localStorage.removeItem('pendingRental');
        navigate(`/rent/${pendingRental}`);
      } else {
        navigate('/my-dashboard');
      }
    } catch (error) {
      setError('Failed to sign up with Apple');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <h2 className="signup-title">Create your RentMate Account</h2>

        {error && (
          <div className="signup-error" style={{
            backgroundColor: '#fdecea',
            color: '#d32f2f',
            border: '1px solid #f5c2c7',
            padding: '10px',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <button 
          className="signup-btn apple" 
          onClick={handleAppleSignup}
          disabled={loading}
        >
          <FaApple className="icon" />
          Continue with Apple
        </button>

        <button 
          className="signup-btn google" 
          onClick={handleGoogleSignup}
          disabled={loading}
        >
          <FaGoogle className="icon" />
          Continue with Google
        </button>

        <div className="divider">
          <span>or</span>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Full Name" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required 
          />
          <input 
            type="email" 
            placeholder="Email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          <button 
            type="submit" 
            className="signup-btn primary"
            disabled={loading}
          >
            {loading ? 'Signing Up...' : 'Sign Up'}
          </button>
        </form>

        <p className="login-link">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
        
        <div className="mt-4 text-center">
          <Link to="/" className="text-blue-600 hover:text-blue-500">
            ← Back to Browse Equipment
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;