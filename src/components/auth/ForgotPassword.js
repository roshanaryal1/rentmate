import React, { useState, useEffect } from 'react';

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
    return { isValid: true, message: 'Email looks good' };
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
  };

  const handleSuggestionClick = (suggestion) => {
    setEmail(suggestion);
    setValidation(validateEmail(suggestion));
    setSuggestions([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      handleSubmit({ preventDefault: () => {} });
    }
  };

  const handleBackToLogin = () => {
    console.log('Navigate back to login page'); // Implement with router
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-xl shadow-lg">
        {/* Logo */}
        <div className="text-center flex justify-center">
          <h1 className="text-3xl font-bold text-gray-800">
            <span className="text-orange-500">Rent</span>Mate
          </h1>
        </div>

        {/* State: Success */}
        {success ? (
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-green-100 p-4 rounded-full">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Check your email</h2>
            <p className="text-sm text-gray-600">
              A password reset link has been sent to: <span className="text-blue-600">{email}</span>
            </p>

            <div className="text-sm text-gray-500">
              <ul className="list-disc list-inside space-y-1 mt-2 text-left">
                <li>Check your spam/junk folder if it doesn't arrive.</li>
                <li>The link will expire in 15 minutes.</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={handleResend}
                disabled={resendCountdown > 0 || loading}
                className={`w-full py-2 px-4 border rounded-md text-sm font-medium ${
                  resendCountdown > 0 || loading
                    ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                    : 'text-gray-700 border-gray-300 hover:bg-gray-100'
                }`}
              >
                {resendCountdown > 0 ? `Resend in ${resendCountdown}s` : 'Resend Email'}
              </button>
              <button
                onClick={handleBackToLogin}
                className="w-full py-2 px-4 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Back to Login
              </button>
            </div>

            {resendAttempts > 0 && (
              <p className="text-xs text-gray-500">
                Email sent {resendAttempts} {resendAttempts === 1 ? 'time' : 'times'}
              </p>
            )}
          </div>
        ) : (
          // Form
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-900">Forgot Password?</h2>
              <p className="text-sm text-gray-600">No problem! Enter your email and we’ll send a reset link.</p>
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm p-3 rounded-md">
                {error}
              </div>
            )}

            {/* Input */}
            <div className="relative">
              <input
                type="email"
                className={`w-full border ${
                  validation.isValid ? 'border-green-400' : 'border-gray-300'
                } rounded-md py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500`}
                placeholder="you@example.com"
                value={email}
                onChange={handleEmailChange}
              />
              {validation.message && (
                <p className={`text-sm mt-1 ${validation.isValid ? 'text-green-600' : 'text-red-500'}`}>
                  {validation.message}
                </p>
              )}
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="bg-blue-50 p-2 rounded-md text-sm space-y-1">
                <p className="text-gray-600 font-medium">Did you mean?</p>
                {suggestions.map((s, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSuggestionClick(s)}
                    className="cursor-pointer hover:underline text-blue-600"
                  >
                    {s}
                  </div>
                ))}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 transition"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
