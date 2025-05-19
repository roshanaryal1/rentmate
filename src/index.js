import React from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';  // Keep if you need Bootstrap
import 'bootstrap-icons/font/bootstrap-icons.css';  // Keep if you need Bootstrap icons
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { ThemeProvider } from './theme/ThemeContext';  // Use your ThemeContext

console.log('index.js loading...');
const rootElement = document.getElementById('root');
console.log('Root element found:', rootElement);

// Create a root using the new React 18 API
const root = createRoot(rootElement);

// Render your app into the root
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

console.log('App rendered!');

reportWebVitals();