import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Footer.css';

const Footer = () => {
  const { currentUser, userRole } = useAuth();
  const currentYear = new Date().getFullYear();

  // Get footer links based on user role
  const getFooterLinks = () => {
    const commonLinks = [
      { label: 'Browse Equipment', path: '/' },
      { label: 'How It Works', path: '/how-it-works' },
      { label: 'About Us', path: '/about' },
      { label: 'Categories', path: '/categories' },
    ];

    if (!currentUser) {
      return {
        explore: commonLinks,
        account: [
          { label: 'Sign Up', path: '/signup' },
          { label: 'Log In', path: '/login' },
        ],
      };
    }

    const accountLinks = [
      { label: 'My Profile', path: '/profile' },
      { label: 'Settings', path: '/settings' },
    ];

    switch (userRole) {
      case 'admin':
        return {
          explore: commonLinks,
          account: [
            ...accountLinks,
            { label: 'Admin Dashboard', path: '/admin-dashboard' },
            { label: 'User Management', path: '/admin-users' },
          ],
        };
      case 'owner':
        return {
          explore: commonLinks,
          account: [
            ...accountLinks,
            { label: 'Owner Dashboard', path: '/owner-dashboard' },
            { label: 'My Equipment', path: '/my-equipment' },
            { label: 'Add Equipment', path: '/add-equipment' },
          ],
        };
      default: // renter
        return {
          explore: commonLinks,
          account: [
            ...accountLinks,
            { label: 'My Dashboard', path: '/renter-dashboard' },
            { label: 'My Rentals', path: '/rental-history' },
            { label: 'Favorites', path: '/favorites' },
          ],
        };
    }
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
              Your trusted platform for equipment rental. Connect with local equipment owners 
              and find everything you need for your projects.
            </p>
            <div className="social-links">
              <a 
                href="https://facebook.com/rentmate" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Follow us on Facebook"
                className="social-link"
              >
                <i className="bi bi-facebook"></i>
              </a>
              <a 
                href="https://twitter.com/rentmate" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Follow us on Twitter"
                className="social-link"
              >
                <i className="bi bi-twitter"></i>
              </a>
              <a 
                href="https://instagram.com/rentmate" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Follow us on Instagram"
                className="social-link"
              >
                <i className="bi bi-instagram"></i>
              </a>
              <a 
                href="https://linkedin.com/company/rentmate" 
                target="_blank" 
                rel="noopener noreferrer" 
                aria-label="Follow us on LinkedIn"
                className="social-link"
              >
                <i className="bi bi-linkedin"></i>
              </a>
            </div>
          </div>

          {/* Explore Links */}
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

          {/* Support Links */}
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

          {/* Contact Information */}
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


      </div>
    </footer>
  );
};

export default Footer;