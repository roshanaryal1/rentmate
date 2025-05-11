import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider
} from 'firebase/auth';
import { setDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import './Signup.css';

function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isFormValid = () => {
    return (
      formData.name.trim() !== '' &&
      formData.email.trim() !== '' &&
      formData.password.length >= 6 &&
      formData.password === formData.confirmPassword
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      return setError('Passwords do not match');
    }

    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        email: formData.email,
        role: 'renter',
        verified: false,
        createdAt: new Date().toISOString()
      });

      await sendEmailVerification(user);

      setSuccess('Account created! Please check your email to verify your account.');
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });

      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      console.error('Signup error:', err);
      setError(getUserFriendlyError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();

    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userRef);
      if (!userSnapshot.exists()) {
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          role: 'renter',
          verified: user.emailVerified,
          createdAt: new Date().toISOString()
        });
      }

      navigate('/dashboard'); // Redirect after successful login
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    const provider = new OAuthProvider('apple.com');
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const userRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userRef);
      if (!userSnapshot.exists()) {
        await setDoc(userRef, {
          name: user.displayName,
          email: user.email,
          role: 'renter',
          verified: user.emailVerified,
          createdAt: new Date().toISOString()
        });
      }

      navigate('/dashboard'); // Redirect after successful login
    } catch (err) {
      setError('Apple sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getUserFriendlyError = (errorCode) => {
    switch (errorCode) {
      case 'auth/email-already-in-use':
        return 'Email already in use';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      default:
        return 'Signup failed. Please try again.';
    }
  };

  return (
    <div className="signup-container">
      <h2>Create Your Account</h2>

      {error && <div className="error">{error}</div>}
      {success && <div className="success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={handleChange}
          required
        />
        <div className="password-field">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Password (min 6 characters)"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}>
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        <div className="password-field">
          <input
            type={showPassword ? 'text' : 'password'}
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading || !isFormValid()}
          style={loading ? { opacity: 0.7 } : {}}
        >
          {loading ? 'Creating Account...' : 'Sign Up'}
        </button>
      </form>

      <button
        className="google-signin-btn"
        onClick={handleGoogleSignIn}
        disabled={loading}
      >
        Sign in with Google
      </button>

      <button
        className="apple-signin-btn"
        onClick={handleAppleSignIn}
        disabled={loading}
      >
        Sign in with Apple
      </button>

      <p className="redirect-text">
        Already have an account?{' '}
        <span className="link-text" onClick={() => navigate('/login')}>
          Log in here
        </span>
      </p>
    </div>
  );
}

export default Signup;
