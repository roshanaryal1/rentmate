// src/components/common/Header.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [location]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const toggleProfileMenu = () => {
    setIsProfileOpen(!isProfileOpen);
  };

  // Navigation items based on user role
  const getNavItems = () => {
    if (!currentUser) {
      return [
        { label: 'Browse Equipment', path: '/', icon: 'bi-search' },
        { label: 'How It Works', path: '/how-it-works', icon: 'bi-question-circle' },
        { label: 'About', path: '/about', icon: 'bi-info-circle' }
      ];
    }

    const commonItems = [
      { label: 'Browse', path: '/', icon: 'bi-search' }
    ];

    switch (userRole) {
      case 'admin':
        return [
          ...commonItems,
          { label: 'Admin Dashboard', path: '/admin-dashboard', icon: 'bi-speedometer2' },
          { label: 'Users', path: '/admin-dashboard', icon: 'bi-people' },
          { label: 'Reports', path: '/admin-dashboard', icon: 'bi-graph-up' }
        ];
      
      case 'owner':
        return [
          ...commonItems,
          { label: 'My Dashboard', path: '/owner-dashboard', icon: 'bi-house' },
          { label: 'Add Equipment', path: '/add-equipment', icon: 'bi-plus-circle' },
          { label: 'My Equipment', path: '/owner-dashboard', icon: 'bi-tools' },
          { label: 'Rentals', path: '/owner-dashboard', icon: 'bi-calendar-check' }
        ];
      
      case 'renter':
      default:
        return [
          ...commonItems,
          { label: 'My Dashboard', path: '/renter-dashboard', icon: 'bi-house' },
          { label: 'My Rentals', path: '/rental-history', icon: 'bi-clock-history' },
          { label: 'Favorites', path: '/favorites', icon: 'bi-heart' }
        ];
    }
  };

  const isActivePath = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  const getRoleBadge = () => {
    const badges = {
      admin: { label: 'Admin', color: 'danger' },
      owner: { label: 'Owner', color: 'success' },
      renter: { label: 'Renter', color: 'primary' }
    };
    return badges[userRole] || badges.renter;
  };

  return (
    <>
      <nav className={`navbar navbar-expand-lg fixed-top transition-all ${
        scrolled ? 'navbar-scrolled shadow-lg' : 'navbar-transparent'
      }`}>
        <div className="container">
          {/* Brand/Logo */}
          <Link className="navbar-brand fw-bold d-flex align-items-center" to="/">
            <div className="brand-logo me-2">
              <i className="bi bi-tools fs-3 text-primary"></i>
            </div>
            <span className="brand-text">
              <span className="text-primary">Rent</span>
              <span className="text-dark">Mate</span>
            </span>
          </Link>

          {/* Mobile menu toggle */}
          <button
            className="navbar-toggler border-0 p-0"
            type="button"
            onClick={toggleMobileMenu}
            aria-controls="navbarNav"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
          >
            <div className={`hamburger ${isMenuOpen ? 'active' : ''}`}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </button>

          {/* Navigation menu */}
          <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
            <ul className="navbar-nav me-auto">
              {getNavItems().map((item, index) => (
                <li key={index} className="nav-item">
                  <Link
                    className={`nav-link fw-medium px-3 py-2 d-flex align-items-center ${
                      isActivePath(item.path) ? 'active' : ''
                    }`}
                    to={item.path}
                  >
                    <i className={`${item.icon} me-2 d-lg-none`}></i>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Right side navigation */}
            <div className="navbar-nav">
              {currentUser ? (
                // Authenticated user menu
                <div className="nav-item dropdown">
                  <button
                    className="nav-link dropdown-toggle border-0 bg-transparent d-flex align-items-center"
                    onClick={toggleProfileMenu}
                    aria-expanded={isProfileOpen}
                  >
                    <div className="user-avatar me-2">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt="Profile"
                          className="avatar-img"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className="avatar-placeholder"
                        style={{ display: currentUser.photoURL ? 'none' : 'flex' }}
                      >
                        <i className="bi bi-person-fill"></i>
                      </div>
                    </div>
                    <div className="user-info d-none d-lg-block text-start">
                      <div className="user-name">
                        {currentUser.displayName || currentUser.email?.split('@')[0]}
                      </div>
                      <div className="user-role">
                        <span className={`badge bg-${getRoleBadge().color} badge-sm`}>
                          {getRoleBadge().label}
                        </span>
                      </div>
                    </div>
                  </button>

                  <ul className={`dropdown-menu dropdown-menu-end ${isProfileOpen ? 'show' : ''}`}>
                    <li className="dropdown-header d-lg-none">
                      <div className="fw-semibold">{currentUser.displayName || 'User'}</div>
                      <div className="small text-muted">{currentUser.email}</div>
                    </li>
                    <li><hr className="dropdown-divider d-lg-none" /></li>
                    
                    <li>
                      <Link className="dropdown-item" to="/profile">
                        <i className="bi bi-person me-2"></i>
                        My Profile
                      </Link>
                    </li>
                    
                    <li>
                      <Link className="dropdown-item" to="/settings">
                        <i className="bi bi-gear me-2"></i>
                        Settings
                      </Link>
                    </li>
                    
                    {userRole === 'owner' && (
                      <li>
                        <Link className="dropdown-item" to="/analytics">
                          <i className="bi bi-graph-up me-2"></i>
                          Analytics
                        </Link>
                      </li>
                    )}
                    
                    <li>
                      <Link className="dropdown-item" to="/help">
                        <i className="bi bi-question-circle me-2"></i>
                        Help & Support
                      </Link>
                    </li>
                    
                    <li><hr className="dropdown-divider" /></li>
                    
                    <li>
                      <button className="dropdown-item text-danger" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i>
                        Sign Out
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                // Guest user buttons
                <div className="d-flex align-items-center gap-2">
                  <Link
                    to="/login"
                    className="btn btn-outline-primary btn-sm fw-medium"
                  >
                    <i className="bi bi-box-arrow-in-right me-1 d-lg-none"></i>
                    Log In
                  </Link>
                  <Link
                    to="/signup"
                    className="btn btn-primary btn-sm fw-medium"
                  >
                    <i className="bi bi-person-plus me-1 d-lg-none"></i>
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Overlay for mobile menu */}
      {isMenuOpen && (
        <div 
          className="navbar-overlay" 
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      {/* Add padding to body content to account for fixed navbar */}
      <div className="navbar-spacer"></div>

      <style jsx>{`
        /* Navbar Styles */
        .navbar {
          backdrop-filter: blur(10px);
          transition: all 0.3s ease;
          z-index: 1030;
        }

        .navbar-transparent {
          background-color: rgba(255, 255, 255, 0.95);
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        }

        .navbar-scrolled {
          background-color: rgba(255, 255, 255, 0.98);
          border-bottom: 1px solid rgba(0, 0, 0, 0.15);
        }

        /* Brand Styles */
        .navbar-brand {
          font-size: 1.5rem;
          padding: 0.5rem 0;
          text-decoration: none !important;
        }

        .brand-logo {
          transition: transform 0.3s ease;
        }

        .navbar-brand:hover .brand-logo {
          transform: rotate(15deg);
        }

        .brand-text {
          font-weight: 800;
          letter-spacing: -0.5px;
        }

        /* Navigation Links */
        .nav-link {
          border-radius: 8px;
          margin: 0 2px;
          transition: all 0.3s ease;
          position: relative;
          text-decoration: none !important;
        }

        .nav-link:hover {
          background-color: rgba(13, 110, 253, 0.1);
          color: #0d6efd !important;
          transform: translateY(-1px);
        }

        .nav-link.active {
          background-color: rgba(13, 110, 253, 0.1);
          color: #0d6efd !important;
          font-weight: 600;
        }

        .nav-link.active::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 20px;
          height: 2px;
          background-color: #0d6efd;
          border-radius: 1px;
        }

        /* User Avatar */
        .user-avatar {
          position: relative;
          width: 36px;
          height: 36px;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid #e9ecef;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 1.1rem;
        }

        /* User Info */
        .user-info {
          line-height: 1.2;
        }

        .user-name {
          font-size: 0.9rem;
          font-weight: 600;
          color: #212529;
        }

        .user-role {
          font-size: 0.75rem;
        }

        .badge-sm {
          font-size: 0.65rem;
          padding: 0.25em 0.5em;
        }

        /* Dropdown Menu */
        .dropdown-menu {
          border: 0;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          border-radius: 12px;
          padding: 0.5rem 0;
          margin-top: 0.5rem;
          min-width: 220px;
        }

        .dropdown-item {
          padding: 0.6rem 1.2rem;
          font-size: 0.9rem;
          border-radius: 8px;
          margin: 0 0.5rem;
          transition: all 0.2s ease;
        }

        .dropdown-item:hover {
          background-color: #f8f9fa;
          transform: translateX(4px);
        }

        .dropdown-item i {
          width: 16px;
          opacity: 0.7;
        }

        /* Hamburger Menu */
        .navbar-toggler {
          width: 30px;
          height: 30px;
          position: relative;
          cursor: pointer;
        }

        .hamburger {
          width: 24px;
          height: 18px;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        .hamburger span {
          display: block;
          height: 2px;
          width: 100%;
          background-color: #212529;
          border-radius: 1px;
          transition: all 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
        }

        .hamburger.active span:nth-child(1) {
          transform: rotate(45deg) translate(5px, 5px);
        }

        .hamburger.active span:nth-child(2) {
          opacity: 0;
        }

        .hamburger.active span:nth-child(3) {
          transform: rotate(-45deg) translate(7px, -6px);
        }

        /* Mobile Overlay */
        .navbar-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 1020;
        }

        /* Spacer for fixed navbar */
        .navbar-spacer {
          height: 76px;
        }

        /* Mobile Responsive */
        @media (max-width: 991.98px) {
          .navbar-collapse {
            background: white;
            border-radius: 12px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
            margin-top: 1rem;
            padding: 1rem;
          }

          .nav-link {
            padding: 0.8rem 1rem !important;
            margin: 0.2rem 0;
          }

          .navbar-nav:last-child {
            border-top: 1px solid #e9ecef;
            padding-top: 1rem;
            margin-top: 1rem;
          }
        }

        /* Smooth transitions */
        .transition-all {
          transition: all 0.3s ease;
        }

        /* Button hover effects */
        .btn {
          transition: all 0.3s ease;
        }

        .btn:hover {
          transform: translateY(-1px);
        }

        /* Focus states for accessibility */
        .nav-link:focus,
        .dropdown-item:focus,
        .btn:focus {
          outline: 2px solid #0d6efd;
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
};

export default Header;