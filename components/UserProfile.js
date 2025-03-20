import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import PostCard from './PostCard';
import ProfileMini from './ProfileMini';

const UserProfile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [view, setView] = useState('posts'); // Toggle between 'posts' and 'acquaintances'
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      // Fetch the user's profile
      axios.get(`http://localhost:5000/api/users/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => setUser(res.data))
        .catch(err => console.log(err));

      // Fetch the logged-in user's profile
      axios.get('http://localhost:5000/api/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => setLoggedInUser(res.data))
        .catch(err => console.log(err));

      // Fetch the user's posts
      axios.get(`http://localhost:5000/api/posts/user/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => setPosts(res.data))
        .catch(err => console.log(err));

      // Fetch sent requests
      axios.get('http://localhost:5000/api/users/requests/sent', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => setSentRequests(res.data))
        .catch(err => console.log(err));
    }
  }, [id, token]);

  const handleLike = async (postId) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/posts/${postId}/like`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPosts(posts.map(post => post._id === postId ? res.data : post));
    } catch (err) {
      console.log(err);
    }
  };

  const handleCommentSubmit = async (postId, text) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/posts/${postId}/comment`, {
        text,
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setPosts(posts.map(post => post._id === postId ? res.data : post));
    } catch (err) {
      console.log(err);
    }
  };

  const handleSendRequest = async (id) => {
    try {
      await axios.post(`http://localhost:5000/api/users/requests/${id}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const res = await axios.get('http://localhost:5000/api/users/requests/sent', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSentRequests(res.data);
      alert('Friend request sent!');
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || 'Failed to send request');
    }
  };

  const isRequestSent = (userId) => {
    return sentRequests.some(request => request.to._id === userId && request.status === 'pending');
  };

  const isAcquaintance = (userId) => {
    return loggedInUser?.acquaintances.some(acquaintance => acquaintance._id === userId);
  };

  if (!user || !loggedInUser) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>{user.name}'s Profile</h2>
      <div className="profile-picture-placeholder" style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#ccc', margin: '0 auto' }}>
        {/* Placeholder for profile picture */}
      </div>
      <p>Email: {user.email}</p>
      <p>Branch: {user.branch?.name || 'Loading...'}</p>
      <p>Skills: {user.skills?.map(skill => skill.name).join(', ') || 'None'}</p>
      <p>Bio: {user.bio || 'No bio available'}</p>

      {/* Show "Send Friend Request" button if not already acquaintances */}
      {user._id !== loggedInUser._id && !isAcquaintance(user._id) && (
        <div style={{ margin: '20px 0' }}>
          {isRequestSent(user._id) ? (
            <button disabled>Request Sent</button>
          ) : (
            <button onClick={() => handleSendRequest(user._id)}>Send Friend Request</button>
          )}
        </div>
      )}

      <div className="toggle-buttons" style={{ margin: '20px 0' }}>
        <button
          onClick={() => setView('posts')}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: view === 'posts' ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Posts
        </button>
        <button
          onClick={() => setView('acquaintances')}
          style={{
            padding: '10px 20px',
            backgroundColor: view === 'acquaintances' ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Acquaintances
        </button>
      </div>

      {view === 'posts' && (
        <div className="posts-section">
          <h3>Posts</h3>
          {posts.length === 0 ? (
            <p>{user.name} has not created any posts yet.</p>
          ) : (
            posts.map(post => (
              <PostCard
                key={post._id}
                post={post}
                user={loggedInUser}
                onLike={handleLike}
                onCommentSubmit={handleCommentSubmit}
              />
            ))
          )}
        </div>
      )}

      {view === 'acquaintances' && (
        <div className="acquaintances-section">
          <h3>Acquaintances</h3>
          {user.acquaintances.length === 0 ? (
            <p>{user.name} has no acquaintances yet.</p>
          ) : (
            user.acquaintances.map(acquaintance => (
              <ProfileMini key={acquaintance._id} user={acquaintance} />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default UserProfile;