import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useLocation, useNavigate } from 'react-router-dom';
import './Messages.css';

const socket = io('http://localhost:5000');

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const currentUserId = localStorage.getItem('userId');
  const token = localStorage.getItem('token');
  const location = useLocation();
  const navigate = useNavigate();
  const messagesEndRef = useRef(null);

  const fetchConversations = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConversations(res.data);
      return res.data;
    } catch (err) {
      console.error('Error fetching conversations:', err.response?.data || err.message);
      setError('Failed to load conversations. Please try again later.');
      return [];
    }
  };

  useEffect(() => {
    if (!token || !currentUserId) {
      navigate('/auth');
      return;
    }

    setLoading(true);
    setError(null);

    socket.emit('join', currentUserId);

    fetchConversations()
      .then((conversationsData) => {
        const { selectedUserId } = location.state || {};
        if (selectedUserId) {
          const user = conversationsData.find(
            (conv) => conv.acquaintance._id === selectedUserId
          )?.acquaintance;
          if (user) {
            setSelectedUser(user);
          } else {
            axios
              .get(`http://localhost:5000/api/users/${selectedUserId}`, {
                headers: { Authorization: `Bearer ${token}` },
              })
              .then((userRes) => {
                setSelectedUser(userRes.data);
                setConversations((prev) => {
                  if (!prev.some((conv) => conv.acquaintance._id === userRes.data._id)) {
                    return [
                      ...prev,
                      {
                        acquaintance: userRes.data,
                        latestMessage: null,
                      },
                    ];
                  }
                  return prev;
                });
              })
              .catch((err) => {
                console.error('Error fetching user:', err.response?.data || err.message);
                navigate('/home', { replace: true });
              });
          }
        }
      })
      .finally(() => setLoading(false));

    socket.on('receiveMessage', (message) => {
      if (
        (message.sender._id === currentUserId && message.receiver?._id === selectedUser?._id) ||
        (message.sender._id === selectedUser?._id && message.receiver?._id === currentUserId)
      ) {
        setMessages((prev) => {
          const messageExists = prev.some((msg) => msg._id === message._id);
          if (messageExists) return prev;
          return [...prev, message];
        });
      }
      fetchConversations();
    });

    socket.on('newNotification', (notification) => {
      if (notification.type === 'new_message') {
        fetchConversations();
      }
    });

    return () => {
      socket.off('receiveMessage');
      socket.off('newNotification');
    };
  }, [currentUserId, location.state, token, navigate]);

  useEffect(() => {
    if (selectedUser) {
      axios
        .get(`http://localhost:5000/api/messages/history/${selectedUser._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setMessages(res.data);
        })
        .catch((err) => {
          console.error('Error fetching message history:', err.response?.data || err.message);
          setMessages([]);
        });
    } else {
      setMessages([]);
    }
  }, [selectedUser, token]);

  useEffect(() => {
    if (messages.length > 0 && location.state?.scrollToMessageId) {
      const messageElement = document.getElementById(
        `message-${location.state.scrollToMessageId}`
      );
      if (messageElement) {
        messageElement.scrollIntoView({ behavior: 'smooth' });
      }
    } else if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, location.state]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedUser) {
      alert('Please select a user to chat with.');
      return;
    }
    if (!newMessage.trim()) return;

    try {
      const res = await axios.post(
        'http://localhost:5000/api/messages',
        {
          receiverId: selectedUser._id,
          content: newMessage,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setMessages((prev) => [...prev, res.data]);
      await fetchConversations();
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert(err.response?.data?.message || 'Error sending message');
    }
  };

  if (loading) {
    return <div>Loading conversations...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="messages-container">
      <div className="sidebar">
        <h2>Conversations</h2>
        <ul>
          {conversations.length > 0 ? (
            conversations.map((conversation) => (
              <li
                key={conversation.acquaintance._id}
                onClick={() => setSelectedUser(conversation.acquaintance)}
                className={selectedUser?._id === conversation.acquaintance._id ? 'active' : ''}
              >
                <div>
                  <span>
                    {conversation.acquaintance.name ||
                      conversation.acquaintance.email ||
                      'Unknown User'}
                  </span>
                  {conversation.latestMessage && (
                    <p className="latest-message">{conversation.latestMessage.content}</p>
                  )}
                </div>
              </li>
            ))
          ) : (
            <li>No conversations available</li>
          )}
        </ul>
      </div>
      <div className="chat-area">
        {selectedUser ? (
          <>
            <h2>
              Chat with {selectedUser.name || selectedUser.email || 'Unknown User'}
            </h2>
            <div className="messages">
              {messages.length > 0 ? (
                messages.map((msg) => (
                  <div
                    key={msg._id}
                    id={`message-${msg._id}`}
                    className={`message ${msg.isSentByMe ? 'sent' : 'received'}`}
                  >
                    <p>{msg.content}</p>
                    <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))
              ) : (
                <p>No messages yet</p>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="message-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={!selectedUser}
              />
              <button type="submit" disabled={!selectedUser || !newMessage.trim()}>
                Send
              </button>
            </form>
          </>
        ) : (
          <p>Select a user to start chatting</p>
        )}
      </div>
    </div>
  );
};

export default Messages;