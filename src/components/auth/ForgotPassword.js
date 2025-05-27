import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const emailDomains = ['gmail.com', 'yahoo.com', 'outlook.com', 'icloud.com', 'hotmail.com'];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [validation, setValidation] = useState({ isValid: false, message: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [resendAttempts, setResendAttempts] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);

  const navigate = useNavigate();

  useEffect(() => {
    let timer;
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(prev => prev - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [resendCountdown]);

  const validateEmail = (email) => {
    if (!email) return { isValid: false, message: '' };
    if (!emailRegex.test(email)) return { isValid: false, message: 'Invalid email format' };
    return { isValid: true, message: 'Valid email address' };
  };

  const suggestEmails = (email) => {
    if (!email.includes('@')) return [];
    const [local, domain] = email.split('@');
    if (!domain) return [];

    return emailDomains
      .filter(d => d.includes(domain) || domain.includes(d.slice(0, -4)))
      .map(d => `${local}@${d}`)
      .slice(0, 3);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    setError('');
    const val = validateEmail(value);
    setValidation(val);
    setSuggestions(value.includes('@') && !val.isValid ? suggestEmails(value) : []);
    setSelectedSuggestionIndex(-1);
  };

  const handleKeyDown = (e) => {
    if (suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        setSelectedSuggestionIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        setSelectedSuggestionIndex(prev => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(suggestions[selectedSuggestionIndex]);
        }
        break;
      default:
        break;
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setEmail(suggestion);
    setValidation(validateEmail(suggestion));
    setSuggestions([]);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!validation.isValid) {
      setError('Please enter a valid email.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Simulate sending reset link
      await new Promise(resolve => setTimeout(resolve, 1500));
      setSuccess(true);
      setResendCountdown(60);
      setResendAttempts(prev => prev + 1);
    } catch {
      setError('Something went wrong. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (resendCountdown === 0) {
      handleSubmit();
    }
  };

  const handleBackToLogin = () => {
    navigate('/login'); // Change '/login' if your route is different
  };

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center py-5 px-3 bg-light">
      <div className="card shadow-lg border-0 rounded-4 p-4 p-md-5" style={{ maxWidth: '450px', width: '100%' }}>
        
        {/* Logo */}
        <div className="text-center mb-4">
          <h1 className="h2 fw-bold text-orange">
            <span className="text-primary">Rent</span>Mate
          </h1>
        </div>

        {/* Success State */}
        {success ? (
          <div className="text-center">
            <div className="mb-3 d-flex justify-content-center">
              <div className="bg-success bg-opacity-10 rounded-circle d-flex align-items-center justify-content-center" style={{ width: '60px', height: '60px' }}>
                <i className="bi bi-check2 fs-1 text-success"></i>
              </div>
            </div>
            <h2 className="h5 fw-bold mb-3">Check your email</h2>
            <p className="text-muted small">
              A password reset link has been sent to: <strong>{email}</strong>
            </p>
            <ul className="list-unstyled text-start small text-muted mt-3">
              <li className="mb-1"><i className="bi bi-exclamation-circle me-1"></i> Check spam/junk folder</li>
              <li><i className="bi bi-clock me-1"></i> Link expires in 15 minutes</li>
            </ul>

            <div className="d-grid gap-2 mt-4">
              <button
                onClick={handleResend}
                disabled={resendCountdown > 0 || loading}
                className={`btn btn-outline-secondary ${resendCountdown > 0 || loading ? 'disabled' : ''}`}
              >
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Email'}
              </button>
              <button onClick={handleBackToLogin} className="btn btn-primary">
                Back to Login
              </button>
            </div>

            {resendAttempts > 0 && (
              <p className="mt-3 text-muted small">
                Email sent {resendAttempts} {resendAttempts === 1 ? 'time' : 'times'}
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="position-relative">
            <h2 className="h5 fw-bold text-center mb-4">Forgot Password?</h2>
            <p className="text-center text-muted small mb-4">
              Enter your email and we'll send you a reset link.
            </p>

            {/* Error Message */}
            {error && (
              <div className="alert alert-danger p-2 small" role="alert">
                {error}
              </div>
            )}

            {/* Email Input */}
            <div className="position-relative mb-3">
              <input
                type="email"
                className={`form-control ${validation.isValid ? 'is-valid' : validation.message ? 'is-invalid' : ''}`}
                placeholder="you@example.com"
                value={email}
                onChange={handleEmailChange}
                onKeyDown={handleKeyDown}
                required
              />
              {validation.message && (
                <div className={`form-text ${validation.isValid ? 'text-success' : 'text-danger'}`}>
                  {validation.message}
                </div>
              )}
            </div>

            {/* Suggestions Dropdown */}
            {suggestions.length > 0 && (
              <ul className="list-group position-absolute w-100 z-10 border rounded shadow-sm bg-white mt-n2" style={{ top: '70px', zIndex: 10 }}>
                <li className="list-group-item small fw-medium text-muted">Did you mean?</li>
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className={`list-group-item list-group-item-action cursor-pointer ${
                      selectedSuggestionIndex === index ? 'active' : ''
                    }`}
                    role="button"
                    tabIndex="0"
                    aria-label={`Suggestion: ${suggestion}`}
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-100 mt-3"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Sending...
                </>
              ) : (
                'Send Reset Link'
              )}
            </button>

            {/* Back to login link button */}
            <button
              type="button"
              onClick={handleBackToLogin}
              className="btn btn-link w-100 mt-2 text-decoration-none text-secondary"
            >
              &larr; Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
