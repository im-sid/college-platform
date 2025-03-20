import React, { useState, useEffect } from 'react';
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
  const [currentUserId, setCurrentUserId] = useState(localStorage.getItem('userId'));
  const token = localStorage.getItem('token');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUserId) {
      socket.on('connect', () => {
        console.log('Socket.IO connected:', socket.id);
      });
      socket.on('connect_error', (err) => {
        console.error('Socket.IO connection error:', err);
      });

      socket.emit('join', currentUserId);

      console.log('Token:', token);
      axios.get('http://localhost:5000/api/messages/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          console.log('Conversations response:', res.data);
          setConversations(res.data);

          const { selectedUserId } = location.state || {};
          console.log('Navigated with selectedUserId:', selectedUserId);
          if (selectedUserId) {
            const user = res.data.find(conv => conv.acquaintance._id === selectedUserId)?.acquaintance;
            console.log('Found user to select:', user);
            if (user) {
              setSelectedUser(user);
            } else {
              console.log('User not found in conversations, fetching user data...');
              axios.get(`/api/users/${selectedUserId}`, {
                headers: { Authorization: `Bearer ${token}` }
              })
                .then(userRes => {
                  console.log('Fetched user:', userRes.data);
                  setSelectedUser(userRes.data);
                })
                .catch(err => console.error('Error fetching user:', err));
            }
          }
        })
        .catch(err => {
          console.error('Error fetching conversations:', err.response ? err.response.data : err.message);
        });

      socket.on('receiveMessage', (message) => {
        if (
          (message.sender === currentUserId && message.receiver === selectedUser?._id) ||
          (message.sender === selectedUser?._id && message.receiver === currentUserId)
        ) {
          setMessages(prev => {
            const messageExists = prev.some(
              msg => msg.content === message.content && msg.createdAt === message.createdAt
            );
            if (messageExists) return prev;
            const updatedMessage = {
              ...message,
              isSentByMe: message.sender === currentUserId,
            };
            return [...prev, updatedMessage];
          });
        }
      });

      return () => {
        socket.off('connect');
        socket.off('connect_error');
        socket.off('receiveMessage');
      };
    }
  }, [currentUserId, location.state]);

  useEffect(() => {
    if (selectedUser) {
      console.log('Fetching message history for user:', selectedUser._id);
      axios.get(`http://localhost:5000/api/messages/history/${selectedUser._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => {
          console.log('Message history response:', res.data);
          setMessages(res.data);
        })
        .catch(err => console.error('Error fetching message history:', err));
    }
  }, [selectedUser, token]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!selectedUser) {
      alert('Please select a user to chat with.');
      return;
    }
    if (newMessage.trim() && currentUserId) {
      const messageData = {
        senderId: currentUserId,
        receiverId: selectedUser._id,
        content: newMessage,
      };
      console.log('Emitting sendMessage with data:', messageData);

      // Immediately add the message to the messages state
      const newSentMessage = {
        sender: currentUserId,
        receiver: selectedUser._id,
        content: newMessage,
        createdAt: new Date().toISOString(),
        isSentByMe: true,
      };
      setMessages(prev => [...prev, newSentMessage]);

      // Emit the message via Socket.IO
      socket.emit('sendMessage', messageData);
      setNewMessage('');
    }
  };

  console.log('Rendering messages:', messages);
  console.log('Rendering conversations:', conversations);

  return (
    <div className="messages-container">
      <div className="sidebar">
        <h2>Conversations</h2>
        <ul>
          {conversations.length > 0 ? (
            conversations.map(conversation => (
              <li
                key={conversation.acquaintance._id}
                onClick={() => setSelectedUser(conversation.acquaintance)}
                className={selectedUser?._id === conversation.acquaintance._id ? 'active' : ''}
              >
                <div>
                  <span>{conversation.acquaintance.name || conversation.acquaintance.email || 'Unknown User'}</span>
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
            <h2>Chat with {selectedUser.name || selectedUser.email || 'Unknown User'}</h2>
            <div className="messages">
              {messages.length > 0 ? (
                messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`message ${msg.isSentByMe ? 'sent' : 'received'}`}
                  >
                    <p>{msg.content}</p>
                    <span>{new Date(msg.createdAt).toLocaleTimeString()}</span>
                  </div>
                ))
              ) : (
                <p>No messages yet</p>
              )}
            </div>
            <form onSubmit={handleSendMessage} className="message-input">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                disabled={!selectedUser}
              />
              <button type="submit" disabled={!selectedUser}>Send</button>
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