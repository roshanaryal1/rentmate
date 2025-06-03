import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Footer.css';

const Footer = () => {
  const { currentUser, userRole } = useAuth();

  // Get current year
  const currentYear = new Date().getFullYear();

  // Navigation links based on user role
  const getFooterLinks = () => {
    const commonLinks = [
      { label: 'Browse Equipment', path: '/', section: 'explore' },
      { label: 'How It Works', path: '/how-it-works', section: 'explore' },
      { label: 'About Us', path: '/about', section: 'explore' },
    ];

    if (!currentUser) {
      return {
        explore: commonLinks,
        account: [
          { label: 'Sign Up', path: '/signup', section: 'account' },
          { label: 'Log In', path: '/login', section: 'account' },
        ],
      };
    }

    const accountLinks = [
      { label: 'My Profile', path: '/profile', section: 'account' },
      { label: 'Settings', path: '/settings', section: 'account' },
    ];

    if (userRole === 'admin') {
      return {
        explore: commonLinks,
        account: [
          ...accountLinks,
          { label: 'Admin Dashboard', path: '/admin-dashboard', section: 'account' },
          { label: 'User Management', path: '/admin-users', section: 'account' },
        ],
      };
    }

    if (userRole === 'owner') {
      return {
        explore: commonLinks,
        account: [
          ...accountLinks,
          { label: 'Owner Dashboard', path: '/owner-dashboard', section: 'account' },
          { label: 'My Equipment', path: '/my-equipment', section: 'account' },
          { label: 'Add Equipment', path: '/add-equipment', section: 'account' },
        ],
      };
    }

    // Renter links
    return {
      explore: commonLinks,
      account: [
        ...accountLinks,
        { label: 'My Dashboard', path: '/renter-dashboard', section: 'account' },
        { label: 'My Rentals', path: '/rental-history', section: 'account' },
        { label: 'Favorites', path: '/favorites', section: 'account' },
      ],
    };
  };

  const footerLinks = getFooterLinks();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          {/* Brand Section */}
          <div className="footer-section footer-brand">
            <Link to="/" className="footer-logo">
              <i className="bi bi-tools fs-3 text-primary me-2" />
              <span>
                <span className="text-primary">Rent</span>
                <span className="text-dark">Mate</span>
              </span>
            </Link>
            <p className="footer-tagline">
              Your trusted platform for equipment rental. Connect with local equipment owners and find everything you need for your projects.
            </p>
            <div className="social-links">
              <a href="#" aria-label="Facebook" className="social-link">
                <i className="bi bi-facebook"></i>
              </a>
              <a href="#" aria-label="Twitter" className="social-link">
                <i className="bi bi-twitter"></i>
              </a>
              <a href="#" aria-label="Instagram" className="social-link">
                <i className="bi bi-instagram"></i>
              </a>
              <a href="#" aria-label="LinkedIn" className="social-link">
                <i className="bi bi-linkedin"></i>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h3 className="footer-title">Explore</h3>
            <ul className="footer-links">
              {footerLinks.explore?.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link to="/categories" className="footer-link">
                  Categories
                </Link>
              </li>
            </ul>
          </div>

          {/* Account Links */}
          <div className="footer-section">
            <h3 className="footer-title">
              {currentUser ? 'My Account' : 'Get Started'}
            </h3>
            <ul className="footer-links">
              {footerLinks.account?.map((link) => (
                <li key={link.path}>
                  <Link to={link.path} className="footer-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div className="footer-section">
            <h3 className="footer-title">Support</h3>
            <ul className="footer-links">
              <li>
                <Link to="/help" className="footer-link">
                  Help Center
                </Link>
              </li>
              <li>
                <Link to="/contact" className="footer-link">
                  Contact Us
                </Link>
              </li>
              <li>
                <Link to="/faq" className="footer-link">
                  FAQ
                </Link>
              </li>
              <li>
                <Link to="/safety" className="footer-link">
                  Safety Guidelines
                </Link>
              </li>
              <li>
                <Link to="/community-guidelines" className="footer-link">
                  Community Guidelines
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h3 className="footer-title">Contact</h3>
            <div className="contact-info">
              <div className="contact-item">
                <i className="bi bi-envelope-fill contact-icon"></i>
                <span>support@rentmate.com</span>
              </div>
              <div className="contact-item">
                <i className="bi bi-telephone-fill contact-icon"></i>
                <span>1-800-RENTMATE</span>
              </div>
              <div className="contact-item">
                <i className="bi bi-geo-alt-fill contact-icon"></i>
                <span>Available Nationwide</span>
              </div>
              <div className="contact-item">
                <i className="bi bi-clock-fill contact-icon"></i>
                <span>24/7 Customer Support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              © {currentYear} RentMate. All rights reserved.
            </p>
            <div className="footer-legal-links">
              <Link to="/privacy-policy" className="legal-link">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="legal-link">
                Terms of Service
              </Link>
              <Link to="/cookie-policy" className="legal-link">
                Cookie Policy
              </Link>
              <Link to="/accessibility" className="legal-link">
                Accessibility
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;