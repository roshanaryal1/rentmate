import React, { useState } from 'react';
import { signInWithGoogle, signInWithFacebook } from '../../firebase'; // Adjust the import path as necessary

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [formError, setFormError] = useState('');

  // Email validation
  const validateEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? '' : 'Please enter a valid email address';
  };

  // Password validation
  const validatePassword = (value) => {
    return value.length >= 6 ? '' : 'Password must be at least 6 characters';
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) {
      setFormError('Please fix the errors above');
      return;
    }

    // Simulate Firebase login
    console.log({ email, password, rememberMe });
    alert('Logging in...');
  };

  // Google Sign-In handler
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithGoogle();
      console.log("Google User:", result.user);
      // Redirect or update UI accordingly
    } catch (error) {
      console.error("Google Login Error:", error.message);
      setFormError("Failed to sign in with Google. Please try again.");
    }
  };

  // Facebook Sign-In handler
  const handleFacebookLogin = async () => {
    try {
      const result = await signInWithFacebook();
      console.log("Facebook User:", result.user);
      // Redirect or update UI accordingly
    } catch (error) {
      console.error("Facebook Login Error:", error.message);
      setFormError("Failed to sign in with Facebook. Please try again.");
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
                      />
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => setShowPassword(!showPassword)}
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
                      />
                      <label className="form-check-label" htmlFor="rememberMe">
                        Remember me
                      </label>
                    </div>
                    <a href="/forgot-password" className="text-decoration-none small">Forgot password?</a>
                  </div>

                  {/* Submit Button */}
                  <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold">
                    Sign In
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
                  >
                    <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg " alt="Google" width="20" height="20" className="me-2" />
                    Sign in with Google
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-primary d-flex align-items-center justify-content-center"
                    onClick={handleFacebookLogin}
                  >
                    <i className="bi bi-facebook me-2"></i>
                    Sign in with Facebook
                  </button>
                </div>

                {/* Register Link */}
                <p className="text-center mt-3 mb-0">
                  Don't have an account?{' '}
                  <a href="/register" className="text-decoration-none fw-medium">
                    Sign up
                  </a>
                </p>

                {/* Back to Home */}
                <p className="text-center mt-3">
                  <a href="/" className="text-decoration-none text-muted small">
                    ← Back to Browse Equipment
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}