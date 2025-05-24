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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
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
    if (password.length < 8) {
      setError('Password should be at least 8 characters');
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
    setError('');

    try {
      console.log('Signing up with:', { email, fullName, selectedRole });
      const result = await signup(email, password, fullName, selectedRole);
      console.log('Signup successful, result:', result);
      
      // Redirect based on role
      if (result.role) {
        redirectUserByRole(result.role);
      } else {
        redirectUserByRole(selectedRole);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In handler
  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await signInWithGoogle(selectedRole);
      console.log('Google signup successful:', result);
      
      // Redirect based on role
      if (result.role) {
        redirectUserByRole(result.role);
      } else {
        redirectUserByRole(selectedRole);
      }
    } catch (error) {
      setError("Failed to sign up with Google. Please try again.");
      console.error("Google Sign-Up Error:", error.message);
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
              <img src="/logo192.png" alt="RentMate Logo" width="60" className="mb-3" />
              <h2 className="fw-bold">Create your RentMate Account</h2>
              <p className="text-muted">It's quick and easy</p>
            </div>

            {/* Display form-level error */}
            {error && (
              <div className="alert alert-danger d-flex align-items-center" role="alert">
                <i className="bi bi-exclamation-triangle me-2"></i>
                {error}
              </div>
            )}

            {/* Role Selection Dropdown */}
            <div className="mb-3">
              <label htmlFor="roleSelect" className="form-label fw-semibold">
                What would you like to do on RentMate?
              </label>
              <select
                id="roleSelect"
                className="form-select"
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                disabled={loading}
              >
                <option value="renter">Rent Equipment</option>
                <option value="owner">List My Equipment</option>
                <option value="admin">Admin Access</option>
              </select>
              <small className="text-muted">Choose your role to get started</small>
            </div>

            {/* Social Sign Up Buttons */}
            <button
              type="button"
              className="btn btn-outline-secondary d-flex align-items-center justify-content-center mb-3 w-100"
              onClick={handleGoogleSignUp}
              disabled={loading}
            >
              <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width="20" height="20" className="me-2" />
              Sign up with Google
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
                <input
                  type="text"
                  className="form-control rounded-3"
                  id="fullName"
                  placeholder="John Doe"
                  value={fullName}
                  autoFocus
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Email Field */}
              <div className="mb-3">
                <label htmlFor="email" className="form-label fw-semibold">
                  Email address
                </label>
                <input
                  type="email"
                  className={`form-control rounded-3 ${touchedFields.email ? (/\S+@\S+\.\S+/.test(email) ? 'is-valid' : 'is-invalid') : ''}`}
                  id="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (!touchedFields.email) handleFieldBlur('email');
                  }}
                  onBlur={() => handleFieldBlur('email')}
                  disabled={loading}
                />
                {touchedFields.email && !/\S+@\S+\.\S+/.test(email) && (
                  <div className="invalid-feedback">Please enter a valid email address</div>
                )}
              </div>

              {/* Password Field */}
              <div className="mb-3">
                <label htmlFor="password" className="form-label fw-semibold">
                  Password
                </label>
                <input
                  type="password"
                  className={`form-control rounded-3 ${touchedFields.password && password.length > 0 ? 'is-valid' : ''}`}
                  id="password"
                  placeholder="Create a password"
                  value={password}
                  autoComplete="new-password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (!touchedFields.password) handleFieldBlur('password');
                  }}
                  onBlur={() => handleFieldBlur('password')}
                  disabled={loading}
                />
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
                {/* Password Requirements */}
                <ul className="small mt-2 ps-4 text-muted mb-0">
                  <li>Password must be at least 8 characters</li>
                  <li>At least one uppercase letter</li>
                  <li>At least one number</li>
                  <li>At least one special character</li>
                </ul>
              </div>

              {/* Confirm Password Field */}
              <div className="mb-3">
                <label htmlFor="passwordConfirm" className="form-label fw-semibold">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className={`form-control rounded-3 ${
                    touchedFields.passwordConfirm && passwordConfirm.length > 0
                      ? password === passwordConfirm
                        ? 'is-valid'
                        : 'is-invalid'
                      : ''
                  }`}
                  id="passwordConfirm"
                  placeholder="Re-enter password"
                  value={passwordConfirm}
                  autoComplete="new-password"
                  onChange={(e) => {
                    setPasswordConfirm(e.target.value);
                    if (!touchedFields.passwordConfirm) handleFieldBlur('passwordConfirm');
                  }}
                  onBlur={() => handleFieldBlur('passwordConfirm')}
                  disabled={loading}
                />
                {touchedFields.passwordConfirm && password !== passwordConfirm && (
                  <div className="invalid-feedback">Passwords do not match</div>
                )}
              </div>

              {/* Terms and Privacy Checkboxes */}
              <div className="mb-3 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="termsCheck"
                  checked={termsChecked}
                  onChange={(e) => setTermsChecked(e.target.checked)}
                  required
                  disabled={loading}
                />
                <label className="form-check-label" htmlFor="termsCheck">
                  I agree to the{' '}
                  <a href="/terms" className="text-decoration-none" target="_blank" rel="noopener noreferrer">
                    Terms of Service
                  </a>
                </label>
              </div>
              <div className="mb-4 form-check">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="privacyCheck"
                  checked={privacyChecked}
                  onChange={(e) => setPrivacyChecked(e.target.checked)}
                  required
                  disabled={loading}
                />
                <label className="form-check-label" htmlFor="privacyCheck">
                  I agree to the{' '}
                  <a href="/privacy" className="text-decoration-none" target="_blank" rel="noopener noreferrer">
                    Privacy Policy
                  </a>
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
                    Signing Up...
                  </>
                ) : (
                  `Sign Up as ${selectedRole === 'renter' ? 'Renter' : selectedRole === 'owner' ? 'Equipment Owner' : 'Admin'}`
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