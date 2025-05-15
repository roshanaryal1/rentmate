// src/components/auth/Signup.js
import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import "./Signup.css";
import { FaGoogle } from "react-icons/fa";

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState('renter'); // Default to renter
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { signInWithGoogle, signup } = useAuth();
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
      console.log('Attempting to create account with:', { email, fullName, role: selectedRole });
      await signup(email, password, fullName, selectedRole);
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
          // Redirect based on selected role
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
      await signInWithGoogle(selectedRole);
      
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

        {/* Role Selection */}
        <div className="role-selection" style={{ marginBottom: '20px' }}>
          <label className="role-label" style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500', 
            marginBottom: '8px',
            color: '#374151'
          }}>
            What would you like to do on RentMate?
          </label>
          <div className="role-options" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {[
              { value: 'renter', label: 'Rent Equipment', description: 'Browse and rent equipment from others' },
              { value: 'owner', label: 'List My Equipment', description: 'List your equipment for others to rent' },
              { value: 'admin', label: 'Admin Access', description: 'Manage the platform and users' }
            ].map((role) => (
              <label 
                key={role.value}
                className="role-option" 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px',
                  border: selectedRole === role.value ? '2px solid #4f46e5' : '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  backgroundColor: selectedRole === role.value ? '#f0f9ff' : '#ffffff',
                  transition: 'all 0.2s ease'
                }}
              >
                <input
                  type="radio"
                  value={role.value}
                  checked={selectedRole === role.value}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  style={{ marginRight: '12px' }}
                />
                <div>
                  <div style={{ fontWeight: '500', fontSize: '14px', color: '#111827' }}>
                    {role.label}
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                    {role.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <button 
          className="signup-btn google" 
          onClick={handleGoogleSignup}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            border: '1px solid #ddd',
            borderRadius: '8px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '16px',
            fontSize: '14px',
            fontWeight: '500'
          }}
        >
          <FaGoogle className="icon" />
          Continue with Google
        </button>

        <div className="divider" style={{
          textAlign: 'center',
          margin: '20px 0',
          position: 'relative'
        }}>
          <span style={{
            backgroundColor: '#fff',
            padding: '0 16px',
            color: '#666',
            fontSize: '14px'
          }}>or</span>
          <div style={{
            position: 'absolute',
            top: '50%',
            left: 0,
            right: 0,
            height: '1px',
            backgroundColor: '#ddd',
            zIndex: -1
          }}></div>
        </div>

        <form className="signup-form" onSubmit={handleSubmit}>
          <input 
            type="text" 
            placeholder="Full Name" 
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required 
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}
          />
          <input 
            type="email" 
            placeholder="Email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}
          />
          <input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              marginBottom: '16px',
              fontSize: '14px'
            }}
          />
          <button 
            type="submit" 
            className="signup-btn primary"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#4f46e5',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500'
            }}
          >
            {loading ? 'Signing Up...' : `Sign Up as ${selectedRole === 'renter' ? 'Renter' : selectedRole === 'owner' ? 'Equipment Owner' : 'Admin'}`}
          </button>
        </form>

        <p className="login-link" style={{
          textAlign: 'center',
          marginTop: '20px',
          fontSize: '14px',
          color: '#666'
        }}>
          Already have an account? <Link to="/login" style={{ color: '#4f46e5', textDecoration: 'none' }}>Log in</Link>
        </p>
        
        <div className="mt-4 text-center" style={{ marginTop: '16px', textAlign: 'center' }}>
          <Link to="/" className="text-blue-600 hover:text-blue-500" style={{ color: '#4f46e5', textDecoration: 'none', fontSize: '14px' }}>
            ← Back to Browse Equipment
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;