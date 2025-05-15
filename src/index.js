import React from 'react';
import ReactDOM from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';  // Add this line
import 'bootstrap-icons/font/bootstrap-icons.css';  // Add this line for icons
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

console.log('index.js loading...');
const root = ReactDOM.createRoot(document.getElementById('root'));
console.log('Root element found:', document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
console.log('App rendered!');

reportWebVitals();