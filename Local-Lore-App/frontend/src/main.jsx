import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Suppress extension-related JSON parsing errors in development
const originalError = console.error;
console.error = (...args) => {
  // Filter out browser extension JSON parsing errors
  const message = args.join(' ');
  if (message.includes('content.js') && message.includes('not valid JSON')) {
    return; // Suppress these specific errors
  }
  originalError.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)