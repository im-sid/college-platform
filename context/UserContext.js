import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';

// Create the context
export const UserContext = createContext();

// Create the provider component
export const UserProvider = ({ children }) => {
  const [currentUserId, setCurrentUserId] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          setCurrentUserId(res.data._id);
        })
        .catch(err => {
          console.error('Error fetching current user:', err);
          if (err.response?.status === 401) {
            localStorage.removeItem('token');
            window.location.href = '/login';
          }
        });
    }
  }, [token]);

  return (
    <UserContext.Provider value={{ currentUserId }}>
      {children}
    </UserContext.Provider>
  );
};