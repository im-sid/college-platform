import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import ProfileMini from './ProfileMini';

const socket = io('http://localhost:5000');

const GroupChat = () => {
  const { groupId } = useParams();
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [currentUserId, setCurrentUserId] = useState(localStorage.getItem('userId'));
  const [user, setUser] = useState(null);
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const location = useLocation();
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (!token || !currentUserId) {
      navigate('/auth');
      return;
    }

    setLoading(true);
    setError(null);

    socket.emit('join', currentUserId);

    const fetchData = async () => {
      try {
        // Fetch user profile
        const userRes = await axios.get('http://localhost:5000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userRes.data);

        // Fetch group details
        const groupRes = await axios.get(`http://localhost:5000/api/groups/${groupId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGroup(groupRes.data);

        // Fetch group message history
        const messagesRes = await axios.get(
          `http://localhost:5000/api/messages/group-history/${groupId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setMessages(messagesRes.data);

        // Reset unread count for this group
        await axios.put(
          `http://localhost:5000/api/groups/${groupId}/reset-unread`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Failed to load group chat. Please try again.');
        navigate('/groups');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    socket.on('receiveMessage', (message) => {
      if (message.group?._id === groupId) {
        setMessages((prev) => {
          const messageExists = prev.some((msg) => msg._id === message._id);
          if (messageExists) return prev;
          return [...prev, message];
        });
      }
    });

    return () => {
      socket.off('receiveMessage');
    };
  }, [currentUserId, groupId, token, navigate]);

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
    if (!newMessage.trim()) return;

    try {
      const res = await axios.post(
        'http://localhost:5000/api/messages',
        {
          groupId,
          content: newMessage,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessages((prev) => [...prev, res.data]);
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert(err.response?.data?.message || 'Error sending message');
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      const res = await axios.get(`http://localhost:5000/api/search?query=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSearchResults(res.data.users.filter((u) => !group.members.some((m) => m._id === u._id)));
    } catch (err) {
      console.error('Error searching users:', err);
      alert(err.response?.data?.message || 'Error searching users');
    }
  };

  const handleAddMemberToGroup = async (member) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/groups/${groupId}/add-member`,
        {
          memberId: member._id,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setGroup({ ...group, members: res.data.members });
      setSearchResults([]);
      setSearchQuery('');
    } catch (err) {
      console.error('Error adding member:', err);
      alert(err.response?.data?.message || 'Error adding member');
    }
  };

  const handleRemoveMemberFromGroup = async (memberId) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/api/groups/${groupId}/remove-member`,
        {
          memberId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setGroup({ ...group, members: res.data.members });
    } catch (err) {
      console.error('Error removing member:', err);
      alert(err.response?.data?.message || 'Error removing member');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: 0, flex: 1 }}>Chat in {group.name}</h2>
        <button
          onClick={() => setShowGroupInfo(!showGroupInfo)}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          {showGroupInfo ? 'Hide Group Info' : 'Group Info'}
        </button>
      </div>

      {showGroupInfo && (
        <div
          style={{
            marginBottom: '20px',
            padding: '10px',
            border: '1px solid #ddd',
            borderRadius: '5px',
          }}
        >
          <h4>Members</h4>
          {group.members.map((member) => (
            <ProfileMini
              key={member._id}
              user={member}
              onRemove={
                user.role === 'Faculty' &&
                member._id.toString() !== group.creator.toString() &&
                member._id.toString() !== user._id
                  ? () => handleRemoveMemberFromGroup(member._id)
                  : null
              }
            />
          ))}

          {user.role === 'Faculty' && (
            <div style={{ marginTop: '20px' }}>
              <h4>Add Members</h4>
              <div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by name or email"
                  style={{ padding: '10px', width: '300px', marginRight: '10px' }}
                />
                <button
                  type="button"
                  onClick={handleSearch}
                  style={{ padding: '10px 20px' }}
                >
                  Search
                </button>
              </div>
              {searchResults.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <h5>Search Results</h5>
                  {searchResults.map((result) => (
                    <ProfileMini
                      key={result._id}
                      user={result}
                      onAdd={() => handleAddMemberToGroup(result)}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div
        style={{ border: '1px solid #ddd', padding: '10px', height: '400px', overflowY: 'scroll' }}
      >
        {messages.length > 0 ? (
          messages.map((msg) => (
            <div
              key={msg._id}
              id={`message-${msg._id}`}
              style={{
                marginBottom: '10px',
                textAlign: msg.isSentByMe ? 'right' : 'left',
              }}
            >
              <p
                style={{
                  margin: '0',
                  backgroundColor: msg.isSentByMe ? '#007bff' : '#f1f1f1',
                  color: msg.isSentByMe ? 'white' : 'black',
                  padding: '5px 10px',
                  borderRadius: '5px',
                  display: 'inline-block',
                }}
              >
                {msg.sender.name}: {msg.content}
              </p>
              <span style={{ display: 'block', fontSize: '0.8em', color: '#666' }}>
                {new Date(msg.createdAt).toLocaleTimeString()}
              </span>
            </div>
          ))
        ) : (
          <p>No messages yet</p>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} style={{ marginTop: '20px' }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          style={{ padding: '10px', width: '80%', marginRight: '10px' }}
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          style={{
            padding: '10px 20px',
            backgroundColor: newMessage.trim() ? '#28a745' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
          }}
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default GroupChat;