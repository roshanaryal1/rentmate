import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { TermsModal, PrivacyModal } from './LegalModals';

export default function Signup() {
  // Form data state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    passwordConfirm: '',
    role: 'renter', // Default role
    termsChecked: false,
    privacyChecked: false,
  });

  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [touched, setTouched] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const { signup, signInWithGoogle, currentUser } = useAuth();
  const navigate = useNavigate();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    setFormData(prev => ({
      ...prev,
      [name]: newValue,
    }));
  };

  // Mark field as touched
  const handleBlur = (field) => {
    setTouched(prev => ({
      ...prev,
      [field]: true,
    }));
  };

  // Password strength calculation
  const getPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    return strength;
  };

  // Get password strength info
  const getStrengthInfo = (strength) => {
    if (strength <= 1) return { text: 'Very weak', color: 'danger', width: '25%' };
    if (strength === 2) return { text: 'Weak', color: 'warning', width: '50%' };
    if (strength === 3) return { text: 'Good', color: 'info', width: '75%' };
    return { text: 'Strong', color: 'success', width: '100%' };
  };

  // Form validation
  useEffect(() => {
    const errors = {};
    if (touched.fullName && !formData.fullName.trim()) {
      errors.fullName = 'Name is required';
    }
    if (touched.email) {
      if (!formData.email) {
        errors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'Please enter a valid email address';
      }
    }
    if (touched.password) {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        errors.password = 'Password must be at least 8 characters';
      } else if (!/[A-Z]/.test(formData.password)) {
        errors.password = 'Password must contain at least one uppercase letter';
      } else if (!/[0-9]/.test(formData.password)) {
        errors.password = 'Password must contain at least one number';
      } else if (!/[^A-Za-z0-9]/.test(formData.password)) {
        errors.password = 'Password must contain at least one special character';
      }
    }
    if (touched.passwordConfirm) {
      if (!formData.passwordConfirm) {
        errors.passwordConfirm = 'Please confirm your password';
      } else if (formData.password !== formData.passwordConfirm) {
        errors.passwordConfirm = 'Passwords do not match';
      }
    }
    setFormErrors(errors);
  }, [formData, touched]);

  // Role-based redirection
  const redirectUserByRole = (role) => {
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

  // Continue to next step
  const handleContinue = (e) => {
    e.preventDefault();
    // Mark all fields in current step as touched
    const stepFields = step === 1
      ? ['fullName', 'email']
      : ['password', 'passwordConfirm', 'termsChecked', 'privacyChecked'];
    const newTouched = { ...touched };
    stepFields.forEach(field => {
      newTouched[field] = true;
    });
    setTouched(newTouched);

    // Check for errors in current step
    const hasErrors = stepFields.some(field => {
      if (field === 'termsChecked' && !formData.termsChecked) return true;
      if (field === 'privacyChecked' && !formData.privacyChecked) return true;
      return formErrors[field];
    });

    // For step 1, check if terms/privacy would be valid
    if (step === 1 && !hasErrors) {
      setStep(2);
    }

    // For final step, submit the form
    if (step === 2 && !hasErrors) {
      handleSubmit(e);
    }
  };

  // Go back to previous step
  const handleBack = () => {
    setStep(1);
  };

  // Form submission
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    // Check terms and privacy
    if (!formData.termsChecked || !formData.privacyChecked) {
      setError('You must accept the Terms of Service and Privacy Policy');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await signup(
        formData.email,
        formData.password,
        formData.fullName,
        formData.role
      );

      // Redirect based on role
      if (result.role) {
        redirectUserByRole(result.role);
      } else {
        redirectUserByRole(formData.role);
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account');
      window.scrollTo(0, 0); // Scroll to top to show error
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In handler
  const handleGoogleSignUp = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithGoogle(formData.role);
      // Redirect based on role
      if (result.role) {
        redirectUserByRole(result.role);
      } else {
        redirectUserByRole(formData.role);
      }
    } catch (error) {
      setError("Failed to sign up with Google. Please try again.");
      console.error("Google Sign-Up Error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // Password strength data
  const strengthInfo = getStrengthInfo(getPasswordStrength(formData.password));

  return (
    <div className="bg-light min-vh-100 d-flex align-items-center py-5">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-5 col-md-8">
            <div className="card border-0 shadow-lg rounded-4 overflow-hidden">
              {/* Card Header */}
              <div className="card-header bg-primary text-white p-4 border-0">
                <div className="text-center">
                  <img
                    src="/logo192.png"
                    alt="RentMate Logo"
                    width="60"
                    className="mb-3 bg-white p-2 rounded-circle shadow-sm"
                  />
                  <h2 className="fw-bold mb-1">Create your account</h2>
                  <p className="mb-0 opacity-75 small">Join RentMate today to start renting equipment</p>
                </div>
              </div>
              <div className="card-body p-4">
                {/* Progress Steps */}
                <div className="d-flex justify-content-center mb-4">
                  <div className="position-relative d-flex align-items-center w-75">
                    <div className={`position-relative rounded-circle bg-${step >= 1 ? 'primary' : 'secondary'} text-white d-flex align-items-center justify-content-center`} style={{ width: '36px', height: '36px', zIndex: 1 }}>
                      <i className="bi bi-person-fill"></i>
                    </div>
                    <div className={`flex-grow-1 mx-3 progress`} style={{ height: '4px' }}>
                      <div className={`progress-bar bg-${step >= 2 ? 'primary' : 'secondary'}`} style={{ width: step >= 2 ? '100%' : '0%', transition: 'width 0.5s' }}></div>
                    </div>
                    <div className={`position-relative rounded-circle bg-${step >= 2 ? 'primary' : 'secondary'} text-white d-flex align-items-center justify-content-center`} style={{ width: '36px', height: '36px', zIndex: 1 }}>
                      <i className="bi bi-shield-lock-fill"></i>
                    </div>
                  </div>
                </div>
                {/* Error Display */}
                {error && (
                  <div className="alert alert-danger d-flex align-items-center mb-4" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2 flex-shrink-0"></i>
                    <div>{error}</div>
                  </div>
                )}
                {/* Step 1: Account Info */}
                {step === 1 && (
                  <>
                    {/* Role Selection */}
                    <div className="mb-4">
                      <label htmlFor="role" className="form-label fw-semibold">
                        I want to:
                      </label>
                      <select
                        id="role"
                        name="role"
                        className="form-select form-select-lg"
                        value={formData.role}
                        onChange={handleChange}
                        disabled={loading}
                      >
                        <option value="renter">Rent Equipment</option>
                        <option value="owner">List My Equipment</option>
                        {/* Restrict Admin Access to logged-in admins */}
                        {currentUser && currentUser.role === 'admin' && (
                          <option value="admin">Admin Access</option>
                        )}
                      </select>
                    </div>
                    {/* Social Sign Up */}
                    <div className="d-grid gap-2 mb-4">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-lg d-flex align-items-center justify-content-center gap-2"
                        onClick={handleGoogleSignUp}
                        disabled={loading}
                      >
                        <img
                          src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg "
                          alt="Google"
                          width="22"
                          height="22"
                        />
                        <span>Sign up with Google</span>
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-dark btn-lg d-flex align-items-center justify-content-center gap-2"
                        disabled={loading}
                      >
                        <i className="bi bi-apple fs-5"></i>
                        <span>Sign up with Apple</span>
                      </button>
                    </div>
                    {/* Divider */}
                    <div className="position-relative my-4">
                      <hr />
                      <div className="position-absolute top-50 start-50 translate-middle bg-white px-3 text-secondary">
                        or with email
                      </div>
                    </div>
                    {/* Form */}
                    <form onSubmit={handleContinue}>
                      {/* Full Name Field */}
                      <div className="mb-3">
                        <label htmlFor="fullName" className="form-label fw-semibold">
                          Full Name
                        </label>
                        <div className="input-group mb-1">
                          <span className="input-group-text bg-light">
                            <i className="bi bi-person"></i>
                          </span>
                          <input
                            type="text"
                            className={`form-control form-control-lg ${touched.fullName ? (formErrors.fullName ? 'is-invalid' : 'is-valid') : ''}`}
                            id="fullName"
                            name="fullName"
                            placeholder="John Doe"
                            value={formData.fullName}
                            onChange={handleChange}
                            onBlur={() => handleBlur('fullName')}
                            disabled={loading}
                            autoFocus
                          />
                          {touched.fullName && formErrors.fullName && (
                            <div className="invalid-feedback">
                              {formErrors.fullName}
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Email Field */}
                      <div className="mb-4">
                        <label htmlFor="email" className="form-label fw-semibold">
                          Email Address
                        </label>
                        <div className="input-group mb-1">
                          <span className="input-group-text bg-light">
                            <i className="bi bi-envelope"></i>
                          </span>
                          <input
                            type="email"
                            className={`form-control form-control-lg ${touched.email ? (formErrors.email ? 'is-invalid' : 'is-valid') : ''}`}
                            id="email"
                            name="email"
                            placeholder="you@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            onBlur={() => handleBlur('email')}
                            disabled={loading}
                          />
                          {touched.email && formErrors.email && (
                            <div className="invalid-feedback">
                              {formErrors.email}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="d-grid">
                        <button
                          type="submit"
                          className="btn btn-primary btn-lg fw-semibold"
                          disabled={loading}
                        >
                          Continue
                        </button>
                      </div>
                    </form>
                  </>
                )}
                {/* Step 2: Password and Terms */}
                {step === 2 && (
                  <form onSubmit={handleContinue}>
                    {/* Password Field */}
                    <div className="mb-3">
                      <label htmlFor="password" className="form-label fw-semibold">
                        Create Password
                      </label>
                      <div className="input-group mb-1">
                        <span className="input-group-text bg-light">
                          <i className="bi bi-lock"></i>
                        </span>
                        <input
                          type={showPassword ? "text" : "password"}
                          className={`form-control form-control-lg ${touched.password ? (formErrors.password ? 'is-invalid' : 'is-valid') : ''}`}
                          id="password"
                          name="password"
                          placeholder="Create a secure password"
                          value={formData.password}
                          onChange={handleChange}
                          onBlur={() => handleBlur('password')}
                          disabled={loading}
                          autoComplete="new-password"
                        />
                        <button
                          className="input-group-text bg-light"
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          tabIndex="-1"
                        >
                          <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                        </button>
                        {touched.password && formErrors.password && (
                          <div className="invalid-feedback">
                            {formErrors.password}
                          </div>
                        )}
                      </div>
                      {/* Password Strength Meter */}
                      {formData.password && (
                        <div className="mt-2 mb-3">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <small>Password strength:</small>
                            <small className={`text-${strengthInfo.color}`}>{strengthInfo.text}</small>
                          </div>
                          <div className="progress" style={{ height: '6px' }}>
                            <div
                              className={`progress-bar bg-${strengthInfo.color}`}
                              role="progressbar"
                              style={{ width: strengthInfo.width }}
                              aria-valuenow="25"
                              aria-valuemin="0"
                              aria-valuemax="100"
                            ></div>
                          </div>
                        </div>
                      )}
                      {/* Password Requirements */}
                      <div className="card bg-light border-0 p-3 mb-3">
                        <small className="text-muted mb-2">Password requirements:</small>
                        <div className="d-flex flex-wrap gap-2">
                          <span className={`badge ${formData.password.length >= 8 ? 'bg-success' : 'bg-secondary'}`}>
                            <i className={`bi bi-${formData.password.length >= 8 ? 'check-circle' : 'x-circle'} me-1`}></i>
                            8+ characters
                          </span>
                          <span className={`badge ${/[A-Z]/.test(formData.password) ? 'bg-success' : 'bg-secondary'}`}>
                            <i className={`bi bi-${/[A-Z]/.test(formData.password) ? 'check-circle' : 'x-circle'} me-1`}></i>
                            Uppercase
                          </span>
                          <span className={`badge ${/[0-9]/.test(formData.password) ? 'bg-success' : 'bg-secondary'}`}>
                            <i className={`bi bi-${/[0-9]/.test(formData.password) ? 'check-circle' : 'x-circle'} me-1`}></i>
                            Number
                          </span>
                          <span className={`badge ${/[^A-Za-z0-9]/.test(formData.password) ? 'bg-success' : 'bg-secondary'}`}>
                            <i className={`bi bi-${/[^A-Za-z0-9]/.test(formData.password) ? 'check-circle' : 'x-circle'} me-1`}></i>
                            Special character
                          </span>
                        </div>
                      </div>
                    </div>
                    {/* Confirm Password Field */}
                    <div className="mb-4">
                      <label htmlFor="passwordConfirm" className="form-label fw-semibold">
                        Confirm Password
                      </label>
                      <div className="input-group mb-1">
                        <span className="input-group-text bg-light">
                          <i className="bi bi-shield-lock"></i>
                        </span>
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          className={`form-control form-control-lg ${touched.passwordConfirm ? (formErrors.passwordConfirm ? 'is-invalid' : 'is-valid') : ''}`}
                          id="passwordConfirm"
                          name="passwordConfirm"
                          placeholder="Re-enter your password"
                          value={formData.passwordConfirm}
                          onChange={handleChange}
                          onBlur={() => handleBlur('passwordConfirm')}
                          disabled={loading}
                          autoComplete="new-password"
                        />
                        <button
                          className="input-group-text bg-light"
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          tabIndex="-1"
                        >
                          <i className={`bi bi-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                        </button>
                        {touched.passwordConfirm && formErrors.passwordConfirm && (
                          <div className="invalid-feedback">
                            {formErrors.passwordConfirm}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Terms and Privacy */}
                    <div className="mb-4">
                      <div className="form-check mb-2">
                        <input
                          type="checkbox"
                          className={`form-check-input ${touched.termsChecked && !formData.termsChecked ? 'is-invalid' : ''}`}
                          id="termsChecked"
                          name="termsChecked"
                          checked={formData.termsChecked}
                          onChange={handleChange}
                          onBlur={() => handleBlur('termsChecked')}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor="termsChecked">
                          I agree to the{' '}
                          <button
                            type="button"
                            className="btn btn-link p-0 text-decoration-none fw-semibold"
                            onClick={() => setShowTermsModal(true)}
                          >
                            Terms of Service
                          </button>
                        </label>
                      </div>
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className={`form-check-input ${touched.privacyChecked && !formData.privacyChecked ? 'is-invalid' : ''}`}
                          id="privacyChecked"
                          name="privacyChecked"
                          checked={formData.privacyChecked}
                          onChange={handleChange}
                          onBlur={() => handleBlur('privacyChecked')}
                          disabled={loading}
                        />
                        <label className="form-check-label" htmlFor="privacyChecked">
                          I agree to the{' '}
                          <button
                            type="button"
                            className="btn btn-link p-0 text-decoration-none fw-semibold"
                            onClick={() => setShowPrivacyModal(true)}
                          >
                            Privacy Policy
                          </button>
                        </label>
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="d-grid gap-2">
                      <button
                        type="submit"
                        className="btn btn-primary btn-lg fw-semibold"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Creating Account...
                          </>
                        ) : (
                          `Create Account`
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={handleBack}
                        disabled={loading}
                      >
                        Back
                      </button>
                    </div>
                  </form>
                )}
                {/* Login Link */}
                <div className="mt-4 text-center">
                  <p className="mb-0 text-muted">
                    Already have an account?{' '}
                    <Link to="/login" className="text-primary text-decoration-none fw-semibold">
                      Log in
                    </Link>
                  </p>
                </div>
              </div>
              {/* Card Footer */}
              <div className="card-footer bg-white p-3 text-center border-0">
                <Link to="/" className="text-secondary text-decoration-none d-inline-flex align-items-center">
                  <i className="bi bi-arrow-left me-1"></i>
                  <span>Back to Browse Equipment</span>
                </Link>
              </div>
            </div>
            {/* Security Notice */}
            <div className="text-center mt-3">
              <small className="text-muted d-flex align-items-center justify-content-center">
                <i className="bi bi-shield-lock me-1"></i>
                <span>Your information is secured with industry-standard encryption</span>
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Legal Document Modals */}
      <TermsModal 
        show={showTermsModal} 
        onHide={() => setShowTermsModal(false)} 
      />
      <PrivacyModal 
        show={showPrivacyModal} 
        onHide={() => setShowPrivacyModal(false)} 
      />
    </div>
  );
}