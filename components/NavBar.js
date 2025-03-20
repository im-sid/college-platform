import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import './NavBar.css';

const socket = io('http://localhost:5000');

const Navbar = () => {
  const [notificationCount, setNotificationCount] = useState(0);
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    if (userId) {
      socket.emit('join', userId);

      const fetchNotificationCount = () => {
        axios.get('http://localhost:5000/api/notifications/unread-count', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
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
  }, [userId]);

  return (
    <nav>
      <Link to="/Home">Home</Link>
      <Link to="/profile">Profile</Link>
      <Link to="/create-post">Create Post</Link>
      <Link to="/search">Search</Link>
      <Link to="/messages">Messages</Link>
      <Link to="/notifications">
        Notifications {notificationCount > 0 && <span>({notificationCount})</span>}
      </Link>
      <button onClick={() => {
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        window.location.href = '/login';
      }}>Logout</button>
    </nav>
  );
};

export default Navbar;