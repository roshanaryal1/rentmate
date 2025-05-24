import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signInWithGoogle, currentUser, userRole } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (currentUser && userRole) {
      console.log('🔄 User already logged in, redirecting...', { userRole });
      redirectUserByRole(userRole);
    }
  }, [currentUser, userRole, navigate]);

  // Role-based redirection
  const redirectUserByRole = (role) => {
    console.log('🎯 Redirecting user with role:', role);
    switch (role) {
      case 'admin':
        navigate('/admin-dashboard', { replace: true });
        break;
      case 'owner':
        navigate('/owner-dashboard', { replace: true });
        break;
      case 'renter':
      default:
        navigate('/renter-dashboard', { replace: true });
        break;
    }
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔑 Attempting login for:', email);
      const result = await login(email, password);
      console.log('✅ Login successful:', result);
      
      // The redirection will be handled by the useEffect hook
      // when currentUser and userRole are updated
    } catch (error) {
      console.error('❌ Login error:', error);
      setError(error.message || 'Failed to log in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In handler
  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      console.log('🔍 Attempting Google login...');
      const result = await signInWithGoogle('renter'); // Default to renter
      console.log('✅ Google login successful:', result);
      
      // The redirection will be handled by the useEffect hook
    } catch (error) {
      console.error('❌ Google login error:', error);
      setError("Failed to sign in with Google. Please try again.");
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
                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit}>
                  {/* Email Field */}
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label fw-medium">Email address</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-envelope"></i>
                      </span>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  {/* Password Field */}
                  <div className="mb-3">
                    <label htmlFor="password" className="form-label fw-medium">Password</label>
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="bi bi-lock"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>

                  {/* Forgot Password */}
                  <div className="d-flex justify-content-end mb-4">
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

                {/* Google Login */}
                <div className="d-grid mb-3">
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

                {/* Debug Info (only in development) */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-3 p-2 bg-info bg-opacity-10 rounded text-small">
                    <strong>Debug:</strong> currentUser: {currentUser?.email || 'None'}, 
                    userRole: {userRole || 'None'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}