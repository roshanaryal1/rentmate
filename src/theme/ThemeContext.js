// src/theme/ThemeContext.js
import React, { createContext, useState, useContext } from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { themes, GlobalStyle } from './index';

// Create a context for theme management
const ThemeContext = createContext();

// Custom hook for accessing the theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Get theme from localStorage or default to 'light'
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem('rentmate-theme');
    return savedTheme && themes[savedTheme] ? savedTheme : 'light';
  });

  // Change theme function
  const changeTheme = (themeName) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
      localStorage.setItem('rentmate-theme', themeName);
    } else {
      console.error(`Theme "${themeName}" not found.`);
    }
  };

  // Toggle between light and dark
  const toggleDarkMode = () => {
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    changeTheme(newTheme);
  };

  // Value provided by context
  const value = {
    theme: themes[currentTheme],
    themeName: currentTheme,
    availableThemes: Object.keys(themes),
    changeTheme,
    toggleDarkMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      <StyledThemeProvider theme={themes[currentTheme]}>
        <GlobalStyle />
        {children}
      </StyledThemeProvider>
    </ThemeContext.Provider>
  );
};

export default ThemeProvider;
