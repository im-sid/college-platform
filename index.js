import React from 'react';
import ReactDOM from 'react-dom/client'; // Note the change in import
import { BrowserRouter } from 'react-router-dom';
import App from './App';

// Create a root
const root = ReactDOM.createRoot(document.getElementById('root'));

// Render the app
root.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
);