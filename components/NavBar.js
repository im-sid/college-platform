import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import './NavBar.css';

const socket = io('http://localhost:5000');

const Navbar = ({ token, setToken }) => { // Receive setToken as a prop
  const [notificationCount, setNotificationCount] = useState(0);
  const [user, setUser] = useState(null);
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  useEffect(() => {
    if (userId && token) {
      // Fetch the logged-in user's profile to get their role
      axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          setUser(res.data);
        })
        .catch(err => {
          console.error('Error fetching user profile:', err);
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
          setToken(null); // Update token state on error
          navigate('/auth'); // Redirect to /auth
        });

      socket.emit('join', userId);

      const fetchNotificationCount = () => {
        axios.get('http://localhost:5000/api/notifications/unread-count', {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => {
            console.log('Unread notification count:', res.data.count);
            setNotificationCount(res.data.count);
          })
          .catch(err => console.error('Error fetching notification count:', err));
      };

      fetchNotificationCount();

      socket.on('newNotification', () => {
        fetchNotificationCount();
      });

      socket.on('notificationRead', () => {
        fetchNotificationCount();
      });

      socket.on('notificationDeleted', () => {
        fetchNotificationCount();
      });

      return () => {
        socket.off('newNotification');
        socket.off('notificationRead');
        socket.off('notificationDeleted');
      };
    }
  }, [userId, token, navigate, setToken]); // Add setToken to dependencies

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setToken(null); // Update the token state in App.js
    navigate('/auth'); // Redirect to /auth (not /login)
  };

  return (
    <nav>
      <Link to="/home">Home</Link> {/* Fixed capitalization */}
      <Link to="/profile">Profile</Link>
      <Link to="/create-post">Create Post</Link>
      <Link to="/search">Search</Link>
      <Link to="/messages">Messages</Link>
      <Link to="/groups">Groups</Link>
      <Link to="/notifications">
        Notifications {notificationCount > 0 && <span>({notificationCount})</span>}
      </Link>
      <button onClick={handleLogout}>Logout</button>
    </nav>
  );
};

export default Navbar;