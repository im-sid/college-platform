import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useNavigate } from 'react-router-dom';
import './Notifications.css';

const socket = io('http://localhost:5000');

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('all');
  const userId = localStorage.getItem('userId');
  const navigate = useNavigate();

  useEffect(() => {
    if (userId) {
      socket.emit('join', userId);

      // Fetch existing notifications
      axios.get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
        .then(res => {
          console.log('Fetched notifications:', res.data);
          setNotifications(res.data);
        })
        .catch(err => console.error('Error fetching notifications:', err));

      // Listen for new notifications
      socket.on('newNotification', (notification) => {
        console.log('Received new notification:', notification);
        setNotifications(prev => [notification, ...prev]);
      });

      // Listen for deleted notifications
      socket.on('notificationDeleted', (data) => {
        console.log('Notification deleted:', data);
        setNotifications(prev => prev.filter(n => n._id !== data.notificationId));
      });

      return () => {
        socket.off('newNotification');
        socket.off('notificationDeleted');
      };
    }
  }, [userId]);

  const handleNotificationClick = (notification) => {
    if (notification.type === 'new_message') {
      navigate(`/messages`, { state: { selectedUserId: notification.relatedId } });
    }
    // Mark notification as read
    axios.put(`http://localhost:5000/api/notifications/${notification._id}/read`, {}, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(() => {
        setNotifications(prev =>
          prev.map(n =>
            n._id === notification._id ? { ...n, read: true } : n
          )
        );
      })
      .catch(err => console.error('Error marking notification as read:', err));
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'unread') return !notification.read;
    if (filter === 'read') return notification.read;
    return true;
  });

  return (
    <div className="notifications">
      <h2>Notifications</h2>
      <div className="filter-controls">
        <label>Filter: </label>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          <option value="unread">Unread</option>
          <option value="read">Read</option>
        </select>
      </div>
      {filteredNotifications.length > 0 ? (
        <ul>
          {filteredNotifications.map(notification => (
            <li
              key={notification._id}
              onClick={() => handleNotificationClick(notification)}
              className={notification.read ? 'read' : 'unread'}
            >
              {notification.message}
            </li>
          ))}
        </ul>
      ) : (
        <p>No notifications to display</p>
      )}
    </div>
  );
};

export default Notifications;