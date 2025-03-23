import React, { useState, useEffect } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useNavigate, Link } from 'react-router-dom';
import './Notifications.css';

const socket = io('http://localhost:5000');

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [typeFilter, setTypeFilter] = useState('all');
  const [viewedFilter, setViewedFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token || !userId) {
      navigate('/auth');
      return;
    }

    setLoading(true);
    setError(null);

    socket.emit('join', userId);

    axios
      .get('http://localhost:5000/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setNotifications(res.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching notifications:', err.response?.data || err.message);
        setError('Failed to load notifications. Please try again later.');
        setLoading(false);
      });

    socket.on('newNotification', (notification) => {
      setNotifications((prev) => {
        const existingIndex = prev.findIndex(
          (n) =>
            n.type === notification.type &&
            n.relatedId.toString() === notification.relatedId.toString()
        );
        if (existingIndex !== -1) {
          const updatedNotifications = [...prev];
          updatedNotifications[existingIndex] = notification;
          return updatedNotifications;
        }
        return [notification, ...prev];
      });
    });

    socket.on('notificationDeleted', (data) => {
      setNotifications((prev) => prev.filter((n) => n._id !== data.notificationId));
    });

    socket.on('notificationViewed', (data) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === data.notificationId ? { ...n, viewed: true } : n
        )
      );
    });

    socket.on('notificationRead', (data) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === data.notificationId ? { ...n, read: true } : n
        )
      );
    });

    return () => {
      socket.off('newNotification');
      socket.off('notificationDeleted');
      socket.off('notificationViewed');
      socket.off('notificationRead');
    };
  }, [userId, token, navigate]);

  const handleNotificationClick = async (notification) => {
    try {
      if (!notification.read) {
        await axios.put(
          `http://localhost:5000/api/notifications/${notification._id}/read`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, read: true } : n
          )
        );
      }

      if (!notification.viewed) {
        await axios.put(
          `http://localhost:5000/api/notifications/${notification._id}/viewed`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setNotifications((prev) =>
          prev.map((n) =>
            n._id === notification._id ? { ...n, viewed: true } : n
          )
        );
      }

      if (notification.type === 'new_message') {
        navigate(`/messages`, {
          state: {
            selectedUserId: notification.relatedId,
            scrollToMessageId: notification.messageId,
          },
          replace: true,
        });
      } else if (notification.type === 'new_group_message') {
        navigate(`/group-chat/${notification.relatedId}`, {
          state: { scrollToMessageId: notification.messageId },
          replace: true,
        });
      } else if (
        notification.type === 'friend_request_accepted' ||
        notification.type === 'friend_request_declined'
      ) {
        navigate(`/user/${notification.relatedId}`, { replace: true });
      } else if (notification.type === 'like' && notification.postId) {
        navigate('/home', {
          state: { scrollToPostId: notification.postId },
          replace: true,
        });
      } else if (notification.type === 'comment' && notification.postId) {
        navigate('/home', {
          state: {
            scrollToPostId: notification.postId,
            scrollToCommentId: notification.commentId,
          },
          replace: true,
        });
      }
    } catch (err) {
      console.error('Error handling notification click:', err);
      alert('Failed to process notification. Please try again.');
    }
  };

  const handleMarkAsViewed = async (notification) => {
    try {
      await axios.put(
        `http://localhost:5000/api/notifications/${notification._id}/viewed`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id ? { ...n, viewed: true } : n
        )
      );
    } catch (err) {
      console.error('Error marking notification as viewed:', err);
      alert('Failed to mark as viewed. Please try again.');
    }
  };

  const handleMarkAllAsViewed = async () => {
    try {
      await axios.put(
        'http://localhost:5000/api/notifications/viewed',
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, viewed: true })));
    } catch (err) {
      console.error('Error marking all notifications as viewed:', err);
      alert('Failed to mark all notifications as viewed. Please try again.');
    }
  };

  const handleAcceptRequest = async (requestId, notificationId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/users/requests/${requestId}/accept`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      alert('Friend request accepted!');
    } catch (err) {
      console.error('Error accepting request:', err);
      alert(err.response?.data?.message || 'Failed to accept request');
    }
  };

  const handleDeclineRequest = async (requestId, notificationId) => {
    try {
      await axios.put(
        `http://localhost:5000/api/users/requests/${requestId}/decline`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
      alert('Friend request declined!');
    } catch (err) {
      console.error('Error declining request:', err);
      alert(err.response?.data?.message || 'Failed to decline request');
    }
  };

  const filteredNotifications = notifications.filter((notification) => {
    const matchesViewedFilter =
      viewedFilter === 'unviewed'
        ? !notification.viewed
        : viewedFilter === 'viewed'
        ? notification.viewed
        : true;

    const matchesTypeFilter =
      typeFilter === 'likes'
        ? notification.type === 'like'
        : typeFilter === 'comments'
        ? notification.type === 'comment'
        : typeFilter === 'messages'
        ? ['new_message', 'new_group_message'].includes(notification.type)
        : typeFilter === 'friend_requests'
        ? ['friend_request', 'friend_request_accepted', 'friend_request_declined'].includes(
            notification.type
          )
        : true;

    return matchesViewedFilter && matchesTypeFilter;
  });

  const hasUnviewed = notifications.some((n) => !n.viewed);

  const formatTimestamp = (date) => {
    return new Date(date).toLocaleString();
  };

  const renderNotificationMessage = (notification) => {
    if (notification.type === 'friend_request') {
      const [senderName, ...rest] = notification.message.split(' sent you a friend request');
      return (
        <span>
          <Link
            to={`/user/${notification.relatedId}`}
            style={{ color: '#007bff', textDecoration: 'none' }}
          >
            {senderName}
          </Link>
          {` sent you a friend request${
            notification.count > 1 ? ` (${notification.count} times)` : ''
          }`}
        </span>
      );
    }
    return <span onClick={() => handleNotificationClick(notification)}>{notification.message}</span>;
  };

  if (loading) {
    return <div>Loading notifications...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="notifications">
      <h2>Notifications</h2>
      <div
        className="filter-controls"
        style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '20px' }}
      >
        <div>
          <label>Type Filter: </label>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="likes">Likes</option>
            <option value="comments">Comments</option>
            <option value="messages">Messages</option>
            <option value="friend_requests">Friend Requests</option>
          </select>
        </div>
        <div>
          <label>Viewed Filter: </label>
          <select value={viewedFilter} onChange={(e) => setViewedFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="unviewed">Unviewed</option>
            <option value="viewed">Viewed</option>
          </select>
        </div>
        <button
          onClick={handleMarkAllAsViewed}
          disabled={!hasUnviewed}
          style={{
            padding: '8px 16px',
            backgroundColor: hasUnviewed ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: hasUnviewed ? 'pointer' : 'not-allowed',
          }}
        >
          Mark All as Viewed
        </button>
      </div>
      {filteredNotifications.length > 0 ? (
        <ul>
          {filteredNotifications.map((notification) => (
            <li
              key={notification._id}
              className={`${notification.read ? 'read' : 'unread'} ${
                notification.viewed ? 'viewed' : ''
              }`}
            >
              <div className="notification-content">
                <div className="notification-message">
                  {renderNotificationMessage(notification)}
                  <div className="notification-timestamp">
                    {formatTimestamp(notification.createdAt)}
                  </div>
                </div>
                {notification.type === 'friend_request' && (
                  <div className="friend-request-actions" style={{ marginTop: '10px' }}>
                    <button
                      onClick={() =>
                        handleAcceptRequest(notification.relatedId, notification._id)
                      }
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        marginRight: '10px',
                      }}
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() =>
                        handleDeclineRequest(notification.relatedId, notification._id)
                      }
                      style={{
                        padding: '5px 10px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                      }}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {!notification.viewed && notification.type !== 'friend_request' && (
                  <button
                    onClick={() => handleMarkAsViewed(notification)}
                    className="mark-viewed-btn"
                    style={{
                      padding: '5px 10px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                    }}
                  >
                    Mark as Viewed
                  </button>
                )}
              </div>
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