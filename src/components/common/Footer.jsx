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

    