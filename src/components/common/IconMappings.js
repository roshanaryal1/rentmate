
import React from 'react';

// Custom loader component using CSS animation
export const LoaderIcon = ({ size = 16, className = "" }) => (
  <div 
    className={`spinner-border ${className}`} 
    role="status" 
    style={{ width: size, height: size, fontSize: '0.75rem' }}
  >
    <span className="visually-hidden">Loading...</span>
  </div>
);

// Alternative loader using CSS-only animation
export const SpinnerIcon = ({ size = 16, className = "" }) => (
  <div 
    className={className}
    style={{
      width: size,
      height: size,
      border: '2px solid #f3f3f3',
      borderTop: '2px solid #3498db',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite',
    }}
  >
    <style jsx>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Map missing icons to available alternatives
export const IconMappings = {
  // Use ExclamationCircle instead of AlertCircle
  AlertCircle: 'ExclamationCircle',
  
  // Use Envelope instead of Mail
  Mail: 'Envelope',
  
  // Use EyeSlash instead of EyeOff
  EyeOff: 'EyeSlash',
  
  // For Loader, we'll use a custom component or Bootstrap spinner
  Loader: 'Spinner'
};

// Helper function to get the correct icon
export const getIcon = (iconName) => {
  return IconMappings[iconName] || iconName;
};

// Export common icon alternatives
export { 
  ExclamationCircle as AlertCircle,
  Envelope as Mail,
  EyeSlash as EyeOff
} from 'react-bootstrap-icons';

export default IconMappings;