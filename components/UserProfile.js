import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom'; // Added Link for ban request
import axios from 'axios';
import PostCard from './PostCard';
import ProfileMini from './ProfileMini';
import { FaEllipsisH } from 'react-icons/fa'; // Import three-dot icon

const UserProfile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [view, setView] = useState('posts'); // Toggle between 'posts' and 'acquaintances'
  const [menuOpen, setMenuOpen] = useState(false); // For three-dot menu toggle
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/auth'); // Redirect to login if no token
      return;
    }

    // Fetch the user's profile
    axios.get(`http://localhost:5000/api/users/${id}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => setUser(res.data))
      .catch(err => {
        console.log(err);
        navigate('/auth'); // Redirect to login on error
      });

    // Fetch the logged-in user's profile
    axios.get('http://localhost:5000/api/users/profile', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => setLoggedInUser(res.data))
      .catch(err => {
        console.log(err);
        navigate('/auth'); // Redirect to login on error
      });

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
  }, [id, token, navigate]);

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

  const handleChat = () => {
    navigate('/messages', { state: { selectedUserId: id } }); // Navigate to Messages with the selected user's ID
  };

  const isRequestSent = (userId) => {
    return sentRequests.some(request => request.to._id === userId && request.status === 'pending');
  };

  const isAcquaintance = (userId) => {
    return loggedInUser?.acquaintances.some(acquaintance => acquaintance._id === userId);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  if (!user || !loggedInUser) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2>{user.name}'s Profile</h2>
        {/* Three-Dot Menu for Faculty (not visible for the user's own profile) */}
        {loggedInUser.role === 'Faculty' && user._id !== loggedInUser._id && (
          <div style={{ position: 'relative' }}>
            <button
              onClick={toggleMenu}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#666',
                fontSize: '16px',
              }}
            >
              <FaEllipsisH />
            </button>

            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '30px',
                  right: '0',
                  backgroundColor: '#fff',
                  boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
                  borderRadius: '5px',
                  padding: '5px',
                  zIndex: 100,
                }}
              >
                <Link
                  to={`/ban-request/null/${user._id}`} // Use null for postId since this isn't tied to a post
                  style={{ textDecoration: 'none' }}
                  onClick={() => setMenuOpen(false)} // Close menu on click
                >
                  <button
                    style={{
                      backgroundColor: '#ff4d4f',
                      color: 'white',
                      border: 'none',
                      padding: '5px 10px',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px',
                    }}
                  >
                    Send Ban Request
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="profile-picture-placeholder" style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#ccc', margin: '0 auto' }}>
        {/* Placeholder for profile picture */}
      </div>
      <p>Email: {user.email}</p>
      <p>Branch: {user.branch?.name || 'Loading...'}</p>
      <p>Skills: {user.skills?.map(skill => skill.name).join(', ') || 'None'}</p>
      <p>Bio: {user.bio || 'No bio available'}</p>

      {/* Show "Send Friend Request" and "Chat" buttons if not the same user */}
      {user._id !== loggedInUser._id && (
        <div style={{ margin: '20px 0', display: 'flex', gap: '10px' }}>
          {!isAcquaintance(user._id) && (
            isRequestSent(user._id) ? (
              <button disabled>Request Sent</button>
            ) : (
              <button onClick={() => handleSendRequest(user._id)}>Send Friend Request</button>
            )
          )}
          {loggedInUser.role === 'Faculty' && (
            <button
              onClick={handleChat}
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Chat
            </button>
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