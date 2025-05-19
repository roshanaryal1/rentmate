// src/theme/index.js
import { createGlobalStyle } from 'styled-components';

/**
 * RentMate Theme System
 * 
 * A comprehensive theming system that provides:
 * - Multiple theme options (light, dark, blue)
 * - Consistent color palettes
 * - Spacing system
 * - Typography settings
 * - Shadows and elevation
 * - Border radius utilities
 * - Transition presets
 * - Z-index scale
 */

// Define color palettes for different themes
export const lightTheme = {
  name: 'light',
  colors: {
    primary: '#3b82f6', // blue-500
    secondary: '#8b5cf6', // violet-500
    success: '#10b981', // emerald-500
    warning: '#f59e0b', // amber-500
    danger: '#ef4444', // red-500
    info: '#06b6d4', // cyan-500
    
    // Background colors
    background: {
      main: '#f9fafb', // gray-50
      paper: '#ffffff',
      card: '#ffffff',
      sidebar: '#ffffff',
    },
    
    // Text colors
    text: {
      primary: '#1f2937', // gray-800
      secondary: '#4b5563', // gray-600
      disabled: '#9ca3af', // gray-400
      hint: '#6b7280', // gray-500
    },
    
    // Border colors
    border: {
      light: '#e5e7eb', // gray-200
      main: '#d1d5db', // gray-300
      dark: '#9ca3af', // gray-400
    },
    
    // Status indicators
    status: {
      online: '#34d399', // emerald-400
      offline: '#f87171', // red-400
      away: '#fbbf24', // amber-400
    },
    
    // Alert colors
    alert: {
      success: {
        light: '#d1fae5', // emerald-100
        main: '#10b981', // emerald-500
        dark: '#065f46', // emerald-800
      },
      warning: {
        light: '#fef3c7', // amber-100
        main: '#f59e0b', // amber-500
        dark: '#92400e', // amber-800
      },
      error: {
        light: '#fee2e2', // red-100
        main: '#ef4444', // red-500
        dark: '#991b1b', // red-800
      },
      info: {
        light: '#e0f2fe', // sky-100
        main: '#0ea5e9', // sky-500
        dark: '#075985', // sky-800
      },
    },
    
    // Gradients
    gradients: {
      primary: 'linear-gradient(to right, #3b82f6, #60a5fa)',
      secondary: 'linear-gradient(to right, #8b5cf6, #a78bfa)',
      success: 'linear-gradient(to right, #10b981, #34d399)',
      danger: 'linear-gradient(to right, #ef4444, #f87171)',
    }
  },
  
  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },
  
  // Spacing system
  spacing: (multiplier = 1) => `${4 * multiplier}px`,
  
  // Typography
  typography: {
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif",
    fontSize: {
      xs: '0.75rem',   // 12px
      sm: '0.875rem',  // 14px
      md: '1rem',      // 16px
      lg: '1.125rem',  // 18px
      xl: '1.25rem',   // 20px
      '2xl': '1.5rem', // 24px
      '3xl': '1.875rem', // 30px
      '4xl': '2.25rem',  // 36px
    },
    fontWeight: {
      light: 300,
      regular: 400,
      medium: 500,
      semiBold: 600,
      bold: 700,
    },
  },
  
  // Border radius
  borderRadius: {
    sm: '0.25rem',  // 4px
    md: '0.375rem', // 6px
    lg: '0.5rem',   // 8px
    xl: '0.75rem',  // 12px
    '2xl': '1rem',  // 16px
    full: '9999px',
  },
  
  // Transitions
  transitions: {
    fast: '150ms ease-in-out',
    normal: '300ms ease-in-out',
    slow: '500ms ease-in-out',
  },
  
  // Z-index scale
  zIndex: {
    zero: 0,
    low: 10,
    medium: 100,
    high: 1000,
    highest: 10000,
  },
};

// Dark theme variant - inherits from light theme and overrides specific properties
export const darkTheme = {
  ...lightTheme,
  name: 'dark',
  colors: {
    ...lightTheme.colors,
    primary: '#60a5fa', // blue-400 (slightly lighter for dark mode)
    
    // Background colors
    background: {
      main: '#1f2937', // gray-800
      paper: '#111827', // gray-900
      card: '#374151', // gray-700
      sidebar: '#111827', // gray-900
    },
    
    // Text colors
    text: {
      primary: '#f9fafb', // gray-50
      secondary: '#e5e7eb', // gray-200
      disabled: '#6b7280', // gray-500
      hint: '#9ca3af', // gray-400
    },
    
    // Border colors
    border: {
      light: '#374151', // gray-700
      main: '#4b5563', // gray-600
      dark: '#6b7280', // gray-500
    },
    
    // Alert colors adjusted for dark theme
    alert: {
      success: {
        light: '#064e3b', // emerald-900
        main: '#10b981', // emerald-500
        dark: '#d1fae5', // emerald-100
      },
      warning: {
        light: '#78350f', // amber-900
        main: '#f59e0b', // amber-500
        dark: '#fef3c7', // amber-100
      },
      error: {
        light: '#7f1d1d', // red-900
        main: '#ef4444', // red-500
        dark: '#fee2e2', // red-100
      },
      info: {
        light: '#0c4a6e', // sky-900
        main: '#0ea5e9', // sky-500
        dark: '#e0f2fe', // sky-100
      },
    },
  },
  
  // Darker shadows for dark theme
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.2)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.2)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)',
  },
};

// Create a "blue" theme
export const blueTheme = {
  ...lightTheme,
  name: 'blue',
  colors: {
    ...lightTheme.colors,
    primary: '#2563eb', // blue-600
    secondary: '#4f46e5', // indigo-600
    
    background: {
      ...lightTheme.colors.background,
      sidebar: '#1e40af', // blue-800
    },
    
    gradients: {
      ...lightTheme.colors.gradients,
      primary: 'linear-gradient(to right, #1e40af, #3b82f6)', // blue-800 to blue-500
    }
  },
};

// Create a GlobalStyle component for base styling
export const GlobalStyle = createGlobalStyle`
  body {
    background-color: ${props => props.theme.colors.background.main};
    color: ${props => props.theme.colors.text.primary};
    font-family: ${props => props.theme.typography.fontFamily};
    margin: 0;
    padding: 0;
    transition: all ${props => props.theme.transitions.normal};
  }
  
  * {
    box-sizing: border-box;
  }
  
  h1, h2, h3, h4, h5, h6 {
    margin-top: 0;
    color: ${props => props.theme.colors.text.primary};
  }
  
  a {
    color: ${props => props.theme.colors.primary};
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
  
  button, input, select, textarea {
    font-family: inherit;
  }
`;

// Export the available themes
export const themes = {
  light: lightTheme,
  dark: darkTheme,
  blue: blueTheme,
};

// Default theme
export default lightTheme;