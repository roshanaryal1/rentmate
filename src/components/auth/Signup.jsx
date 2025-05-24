import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState('renter');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [touchedFields, setTouchedFields] = useState({
    email: false,
    password: false,
    passwordConfirm: false,
  });
  const [termsChecked, setTermsChecked] = useState(false);
  const [privacyChecked, setPrivacyChecked] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const { signup, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  // Password strength calculation
  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  const handleFieldBlur = (field) => {
    setTouchedFields((prev) => ({ ...prev, [field]: true }));
  };

  // Handle role-based redirect
  const redirectToDashboard = (userRole) => {
    console.log('Redirecting user with role:', userRole);
    switch (userRole) {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Form validation
    if (!fullName.trim()) {
      setError('Please enter your full name');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password.trim()) {
      setError('Please enter a password');
      return;
    }
    if (password.length < 6) {
      setError('Password should be at least 6 characters');
      return;
    }
    if (password !== passwordConfirm) {
      setError('Passwords do not match');
      return;
    }
    if (!termsChecked || !privacyChecked) {
      setError('You must accept the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);
    try {
      console.log('Signing up with role:', selectedRole);
      const result = await signup(email, password, fullName, selectedRole);
      console.log('Signup successful:', result);
      
      // Small delay to ensure role is set in context
      setTimeout(() => {
        // Navigate to root and let App.js handle the redirect
        navigate('/');
      }, 100);
      
    } catch (err) {
      console.error('Signup error:', err);
      
      // Handle specific Firebase auth errors
      let errorMessage = 'Failed to create account. Please try again.';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address format.';
      } else if (err.code === 'auth/operation-not-allowed') {
        errorMessage = 'Email/password accounts are not enabled.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-Up handler
  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);
    
    try {
      console.log('Google signup with role:', selectedRole);
      const result = await signInWithGoogle(selectedRole);
      console.log('Google signup successful:', result);
      
      // Small delay to ensure role is set
      setTimeout(() => {
        navigate('/');
      }, 100);
      
    } catch (error) {
      console.error("Google Sign-Up Error:", error);
      
      let errorMessage = "Failed to sign up with Google. Please try again.";
      
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Google sign-up was cancelled.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup was blocked. Please allow popups and try again.';
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with this email using a different sign-in method.';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ minHeight: '100vh' }}>
      <div className="row justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="col-md-6 col-lg-5">
          <div className="card shadow-sm border-0 rounded-4 p-4">
            <div className="text-center mb-4">
              <h1 className="h3 fw-bold text-primary mb-3">RentMate</h1>
              <h2 className="h4 fw-bold">Create your account</h2>
              <p className="text-muted">Join the RentMate community</p>
            </div>

            {/* Display form-level error */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center" role="alert">
                <i className="bi bi-exclamation-circle me-2"></i>
                {error}
              </div>
            )}

            {/* Role Selection Dropdown */}
            <div className="mb-4">
              <label htmlFor="roleSelect" className="form-label fw-semibold">
                <i className="bi bi-person-badge me-2"></i>
                What would you like to do on RentMate?
              </label>
              <select
                id="roleSelect"
                className="form-select"
                value={selectedRole}
                disabled={loading}
                onChange={(e) => setSelectedRole(e.target.value)}
              >
                <option value="renter">🏠 Rent Equipment (I need tools/equipment)</option>
                <option value="owner">🔧 List My Equipment (I want to rent out my tools)</option>
                <option value="admin">👑 Admin Access (Platform management)</option>
              </select>
              <small className="text-muted">
                {selectedRole === 'renter' && 'Browse and rent equipment from verified owners'}
                {selectedRole === 'owner' && 'List your equipment and earn rental income'}
                {selectedRole === 'admin' && 'Full platform access with management features'}
              </small>
            </div>

            {/* Social Sign Up Buttons */}
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center justify-content-center mb-3 w-100"
              onClick={handleGoogleSignUp}
              disabled={loading}
            >
              <img 
                src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" 
                alt="Google" 
                width="20" 
                height="20" 
                className="me-2" 
              />
              Sign up with Google as {selectedRole === 'renter' ? 'Renter' : selectedRole === 'owner' ? 'Owner' : 'Admin'}
            </button>

            {/* Divider */}
            <div className="d-flex align-items-center my-3">
              <hr className="flex-grow-1" />
              <span className="mx-2 text-muted">or</span>
              <hr className="flex-grow-1" />
            </div>

            {/* Email Sign-Up Form */}
            <form onSubmit={handleSubmit} autoComplete="off">
              {/* Full Name Field */}
              <div className="mb-3">
                <label htmlFor="fullName" className="form-label fw-semibold">
                  Full Name
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-person"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control rounded-end"
                    id="fullName"
                    placeholder="John Doe"
                    value={fullName}
                    disabled={loading}
                    autoFocus
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="mb-3">
                <label htmlFor="email" className="form-label fw-semibold">
                  Email address
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-envelope"></i>
                  </span>
                  <input
                    type="email"
                    className={`form-control rounded-end ${touchedFields.email ? (/\S+@\S+\.\S+/.test(email) ? 'is-valid' : 'is-invalid') : ''}`}
                    id="email"
                    placeholder="you@example.com"
                    value={email}
                    disabled={loading}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (!touchedFields.email) handleFieldBlur('email');
                      setError('');
                    }}
                    onBlur={() => handleFieldBlur('email')}
                  />
                  {touchedFields.email && !/\S+@\S+\.\S+/.test(email) && (
                    <div className="invalid-feedback">Please enter a valid email address</div>
                  )}
                </div>
              </div>

              {/* Password Field */}
              <div className="mb-3">
                <label htmlFor="password" className="form-label fw-semibold">
                  Password
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-lock"></i>
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control ${touchedFields.password && password.length > 0 ? 'is-valid' : ''}`}
                    id="password"
                    placeholder="Create a password"
                    value={password}
                    disabled={loading}
                    autoComplete="new-password"
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (!touchedFields.password) handleFieldBlur('password');
                      setError('');
                    }}
                    onBlur={() => handleFieldBlur('password')}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={loading}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <i className="bi bi-eye-slash"></i>
                    ) : (
                      <i className="bi bi-eye"></i>
                    )}
                  </button>
                </div>
                {/* Password Strength Indicator */}
                {touchedFields.password && password.length > 0 && (
                  <div className="mt-2">
                    <div className="progress" style={{ height: '5px' }}>
                      <div
                        className={`progress-bar ${
                          getPasswordStrength(password) <= 1
                            ? 'bg-danger'
                            : getPasswordStrength(password) <= 2
                            ? 'bg-warning'
                            : 'bg-success'
                        }`}
                        role="progressbar"
                        style={{
                          width: `${Math.max(20, getPasswordStrength(password) * 20)}%`,
                        }}
                      ></div>
                    </div>
                    <small className="text-muted mt-1 d-block">
                      {getPasswordStrength(password) <= 1
                        ? 'Very weak'
                        : getPasswordStrength(password) <= 2
                        ? 'Weak'
                        : getPasswordStrength(password) <= 3
                        ? 'Good'
                        : 'Strong'}{' '}
                      password
                    </small>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="mb-3">
                <label htmlFor="passwordConfirm" className="form-label fw-semibold">
                  Confirm Password
                </label>
                <div className="input-group">
                  <span className="input-group-text">
                    <i className="bi bi-lock-fill"></i>
                  </span>
                  <input
                    type={showPasswordConfirm ? 'text' : 'password'}
                    className={`form-control ${
                      touchedFields.passwordConfirm && passwordConfirm.length > 0
                        ? password === passwordConfirm
                          ? 'is-valid'
                          : 'is-invalid'
                        : ''
                    }`}
                    id="passwordConfirm"
                    placeholder="Re-enter password"
                    value={passwordConfirm}
                    disabled={loading}
                    autoComplete="new-password"
                    onChange={(e) => {
                      setPasswordConfirm(e.target.value);
                      if (!touchedFields.passwordConfirm) handleFieldBlur('passwordConfirm');
                      setError('');
                    }}
                    onBlur={() => handleFieldBlur('passwordConfirm')}
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    disabled={loading}
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                  >
                    {showPasswordConfirm ? (
                      <i className="bi bi-eye-slash"></i>
                    ) : (
                      <i className="bi bi-eye"></i>
                    )}
                  </button>
                  {touchedFields.passwordConfirm && password !== passwordConfirm && (
                    <div className="invalid-feedback">Passwords do not match</div>
                  )}
                </div>
              </div>

              {/* Terms and Privacy Checkboxes */}
              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="termsCheck"
                  checked={termsChecked}
                  disabled={loading}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                  required
                />
                <label className="form-check-label small" htmlFor="termsCheck">
                  I agree to the{' '}
                  <Link to="/terms" className="text-decoration-none" target="_blank" rel="noopener noreferrer">
                    Terms of Service
                  </Link>
                </label>
              </div>
              <div className="mb-4 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="privacyCheck"
                  checked={privacyChecked}
                  disabled={loading}
                  onChange={(e) => setPrivacyChecked(e.target.checked)}
                  required
                />
                <label className="form-check-label small" htmlFor="privacyCheck">
                  I agree to the{' '}
                  <Link to="/privacy" className="text-decoration-none" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary w-100 fw-semibold rounded-3"
                disabled={loading}
                style={{ minHeight: '44px' }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating Account...
                  </>
                ) : (
                  `Create ${selectedRole === 'renter' ? 'Renter' : selectedRole === 'owner' ? 'Owner' : 'Admin'} Account`
                )}
              </button>
            </form>

            {/* Login Link */}
            <div className="mt-3 text-center">
              <p className="mb-0 text-muted">
                Already have an account?{' '}
                <Link to="/login" className="text-primary text-decoration-none fw-semibold">
                  Log in
                </Link>
              </p>
            </div>
            <div className="mt-3 text-center">
              <Link to="/" className="text-secondary text-decoration-none">
                <i className="bi bi-arrow-left me-1"></i>Back to Browse Equipment
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}