import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      return setError('Please enter your email address');
    }

    try {
      setLoading(true);
      await resetPassword(email);
      setError('✅ Check your email for password reset instructions.');
    } catch (error) {
      setError('❌ Failed to reset password. Please check your email and try again.');
      console.error(error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-4 bg-white p-8 rounded-lg shadow-sm">
        {/* Logo Section */}
        <div className="flex justify-center">
          <img
            src="/rentmate-logo.png" // Make sure this path is correct
            alt="RentMate Logo"
            className="h-12" // Adjust size as needed
          />
        </div>

        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-800 mt-2">
            Forgot your password?
          </h2>
          <p className="mt-1 text-gray-600">
            No worries! We'll help you reset it.
          </p>
        </div>

        {/* Error/Success Message */}
        {error && (
          <div className={`p-3 rounded-md ${error.includes('❌') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="text-center pt-2">
          <Link
            to="/login"
            className="text-sm text-blue-600 hover:text-blue-500"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;