import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Header.css';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [avatarError, setAvatarError] = useState(false);
  const dropdownRef = useRef(null);
  const { currentUser, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [location]);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }
    if (isProfileOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileOpen]);

  // Esc key closes mobile/profile menu
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsMenuOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      alert('Logout failed!');
    }
  };

  // Navbar items
  const getNavItems = () => {
    if (!currentUser) {
      return [
        { label: 'Browse Equipment', path: '/', icon: 'bi-search' },
        { label: 'How It Works', path: '/how-it-works', icon: 'bi-question-circle' },
        { label: 'About', path: '/about', icon: 'bi-info-circle' },
      ];
    }
    const common = [{ label: 'Browse', path: '/', icon: 'bi-search' }];
    if (userRole === 'admin') {
      return [
        ...common,
        { label: 'Dashboard', path: '/admin-dashboard', icon: 'bi-speedometer2' },
        { label: 'Users', path: '/admin-users', icon: 'bi-people' },
        { label: 'Reports', path: '/admin-reports', icon: 'bi-graph-up' },
      ];
    }
    if (userRole === 'owner') {
      return [
        ...common,
        { label: 'My Dashboard', path: '/owner-dashboard', icon: 'bi-house' },
        { label: 'Add Equipment', path: '/add-equipment', icon: 'bi-plus-circle' },
        { label: 'My Equipment', path: '/my-equipment', icon: 'bi-tools' },
        { label: 'Rentals', path: '/owner-rentals', icon: 'bi-calendar-check' },
      ];
    }
    // Default: renter
    return [
      ...common,
      { label: 'My Dashboard', path: '/renter-dashboard', icon: 'bi-house' },
      { label: 'My Rentals', path: '/rental-history', icon: 'bi-clock-history' },
      { label: 'Favorites', path: '/favorites', icon: 'bi-heart' },
    ];
  };

  // Highlight nav
  const isActivePath = (path) => location.pathname === path;

  const getRoleBadge = () => {
    const badges = {
      admin: { label: 'Admin', color: 'danger' },
      owner: { label: 'Owner', color: 'success' },
      renter: { label: 'Renter', color: 'primary' },
    };
    return badges[userRole] || badges.renter;
  };

  return (
    <>
      <nav
        className={`navbar navbar-expand-lg fixed-top navbarCustom ${scrolled ? 'navbarScrolled' : ''}`}
        aria-label="Main Navigation"
      >
        <div className="container">
          {/* Brand */}
          <Link className="navbar-brand fw-bold d-flex align-items-center brand" to="/">
            <i className="bi bi-tools fs-3 text-primary me-2" />
            <span>
              <span className="text-primary">Rent</span>
              <span className="text-dark">Mate</span>
            </span>
          </Link>

          {/* Hamburger */}
          <button
            className="navbar-toggler border-0 p-0 hamburgerToggler"
            type="button"
            aria-label="Toggle menu"
            aria-controls="navbarNav"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((v) => !v)}
          >
            <span className={`hamburger ${isMenuOpen ? 'active' : ''}`}>
              <span />
              <span />
              <span />
            </span>
          </button>

          {/* Nav Menu */}
          <div className={`collapse navbar-collapse ${isMenuOpen ? 'show' : ''}`} id="navbarNav">
            <ul className="navbar-nav me-auto">
              {getNavItems().map((item) => (
                <li key={item.label} className="nav-item">
                  <Link
                    className={`nav-link fw-medium px-3 py-2 d-flex align-items-center ${isActivePath(item.path) ? 'active' : ''}`}
                    to={item.path}
                  >
                    <i className={`${item.icon} me-2 d-lg-none`}></i>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>

            {/* Auth/Profile */}
            <div className="navbar-nav">
              {currentUser ? (
                <div className="nav-item dropdown profileDropdown" ref={dropdownRef}>
                  <button
                    className="nav-link dropdown-toggle border-0 bg-transparent d-flex align-items-center profileButton"
                    onClick={() => setIsProfileOpen((v) => !v)}
                    aria-expanded={isProfileOpen}
                    aria-haspopup="true"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') setIsProfileOpen((v) => !v); }}
                  >
                    <div className="userAvatar">
                      {!avatarError && currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt="Profile"
                          className="avatarImg"
                          onError={() => setAvatarError(true)}
                        />
                      ) : (
                        <div className="avatarPlaceholder">
                          <i className="bi bi-person-fill" />
                        </div>
                      )}
                    </div>
                    <div className="user-info d-none d-lg-block text-start ms-2">
                      <div className="userName">
                        {currentUser.displayName || currentUser.email?.split('@')[0]}
                      </div>
                      <div className="userRole">
                        <span className={`badge bg-${getRoleBadge().color} badgeSm`}>
                          {getRoleBadge().label}
                        </span>
                      </div>
                    </div>
                  </button>
                  <ul
                    className={`dropdown-menu dropdown-menu-end ${isProfileOpen ? 'show' : ''} dropdownMenuCustom`}
                    role="menu"
                  >
                    <li className="dropdown-header d-lg-none">
                      <div className="fw-semibold">{currentUser.displayName || 'User'}</div>
                      <div className="small text-muted">{currentUser.email}</div>
                    </li>
                    <li><hr className="dropdown-divider d-lg-none" /></li>
                    <li>
                      <Link className="dropdown-item" to="/profile">
                        <i className="bi bi-person me-2"></i> My Profile
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item" to="/settings">
                        <i className="bi bi-gear me-2"></i> Settings
                      </Link>
                    </li>
                    {userRole === 'owner' && (
                      <li>
                        <Link className="dropdown-item" to="/analytics">
                          <i className="bi bi-graph-up me-2"></i> Analytics
                        </Link>
                      </li>
                    )}
                    <li>
                      <Link className="dropdown-item" to="/help">
                        <i className="bi bi-question-circle me-2"></i> Help & Support
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button className="dropdown-item text-danger" onClick={handleLogout}>
                        <i className="bi bi-box-arrow-right me-2"></i> Sign Out
                      </button>
                    </li>
                  </ul>
                </div>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <Link to="/login" className="btn btn-outline-primary btn-sm fw-medium">
                    <i className="bi bi-box-arrow-in-right me-1 d-lg-none"></i> Log In
                  </Link>
                  <Link to="/signup" className="btn btn-primary btn-sm fw-medium">
                    <i className="bi bi-person-plus me-1 d-lg-none"></i> Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      {isMenuOpen && (
        <div className="navbarOverlay" onClick={() => setIsMenuOpen(false)} tabIndex={-1} aria-hidden="true"></div>
      )}
      <div className="navbarSpacer"></div>
    </>
  );
};

export default Header;
