import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Email validation
  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? '' : 'Please enter a valid email address';
  };

  // Password validation
  const validatePassword = (value) => {
    return value.length >= 6 ? '' : 'Password must be at least 6 characters';
  };

  // Role-based redirection
  const redirectUserByRole = (role) => {
    console.log('Redirecting user with role:', role);
    switch (role) {
      case 'admin':
        navigate('/admin-dashboard');
        break;
      case 'owner':
        navigate('/owner-dashboard');
        break;
      case 'renter':
      default:
        navigate('/renter-dashboard');
        break;
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) {
      setFormError('Please fix the errors above');
      return;
    }

    setLoading(true);
    setFormError('');

    try {
      const result = await login(email, password);
      console.log('Login successful, result:', result);
      
      // Redirect based on role
      if (result.role) {
        redirectUserByRole(result.role);
      } else {
        // Fallback - redirect to renter dashboard
        navigate('/renter-dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      setFormError(error.message || 'Failed to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In handler
  const handleGoogleLogin = async () => {
    setLoading(true);
    setFormError('');

    try {
      const result = await signInWithGoogle('renter'); // Default to renter for Google login
      console.log("Google Login successful:", result);
      
      // Redirect based on role
      if (result.role) {
        redirectUserByRole(result.role);
      } else {
        navigate('/renter-dashboard');
      }
    } catch (error) {
      console.error("Google Login Error:", error.message);
      setFormError("Failed to sign in with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center min-vh-100 bg-light">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            <div className="card shadow-sm border-0 rounded-3 p-4">
              <div className="card-body">
                <h2 className="fw-bold text-center mb-4">Welcome back</h2>
                <p className="text-center text-muted mb-4">Sign in to your RentMate account</p>

                {/* Display form-level error */}
                {formError && (
                  <div className="alert alert-danger" role="alert">
                    {formError}
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                  {/* Email Field */}
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-medium">Email address</label>
                    <div className="input-group has-validation">
                      <span className="input-group-text">
                        <i className="bi bi-envelope"></i>
                      </span>
                      <input
                        type="email"
                        className={`form-control ${emailError ? 'is-invalid' : ''}`}
                        id="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setEmailError(validateEmail(e.target.value));
                        }}
                        disabled={loading}
                      />
                      {emailError && <div className="invalid-feedback">{emailError}</div>}
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-medium">Password</label>
                    <div className="input-group has-validation">
                      <span className="input-group-text">
                        <i className="bi bi-lock"></i>
                      </span>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className={`form-control ${passwordError ? 'is-invalid' : ''}`}
                        id="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setPasswordError(validatePassword(e.target.value));
                        }}
                        disabled={loading}
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <i className="bi bi-eye-slash"></i>
                        ) : (
                          <i className="bi bi-eye"></i>
                        )}
                      </button>
                      {passwordError && <div className="invalid-feedback">{passwordError}</div>}
                    </div>
                  </div>

                  {/* Remember Me & Forgot Password */}
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        disabled={loading}
                      />
                      <label className="form-check-label" htmlFor="rememberMe">
                        Remember me
                      </label>
                    </div>
                    <Link to="/forgot-password" className="text-decoration-none small">
                      Forgot password?
                    </Link>
                  </div>

                  {/* Submit Button */}
                  <button 
                    type="submit" 
                    className="btn btn-primary w-100 py-2 fw-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </button>
                </form>

                {/* Divider */}
                <hr className="my-4" />

                {/* Social Logins */}
                <div className="d-grid gap-2 mb-3">
                  <button
                    type="button"
                    className="btn btn-outline-secondary d-flex align-items-center justify-content-center"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" height="20" className="me-2" />
                    Sign in with Google
                  </button>
                </div>

                {/* Register Link */}
                <p className="text-center mt-3 mb-0">
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-decoration-none fw-medium">
                    Sign up
                  </Link>
                </p>

                {/* Back to Home */}
                <p className="text-center mt-3">
                  <Link to="/" className="text-decoration-none text-muted small">
                    ← Back to Browse Equipment
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}