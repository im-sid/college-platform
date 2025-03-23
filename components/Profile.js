import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom'; // Import useLocation to access state
import PostCard from './PostCard';
import ProfileMini from './ProfileMini';

const Profile = () => {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [branch, setBranch] = useState('');
  const [bio, setBio] = useState('');
  const [skills, setSkills] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [sentRequests, setSentRequests] = useState([]);
  const [posts, setPosts] = useState([]);
  const [view, setView] = useState('posts');
  const token = localStorage.getItem('token');
  const location = useLocation(); // Use location to access state
  const pendingRequestsRef = useRef(null); // Ref to scroll to pending requests

  useEffect(() => {
    if (token) {
      axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          setUser(res.data);
          setName(res.data.name || '');
          setEmail(res.data.email || '');
          setBranch(res.data.branch?._id || '');
          setBio(res.data.bio || '');
          setSkills(res.data.skills || []);
        })
        .catch(err => console.log(err));

      axios.get('http://localhost:5000/api/skills', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => setAvailableSkills(res.data))
        .catch(err => console.log(err));

      axios.get('http://localhost:5000/api/branches', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => setAvailableBranches(res.data))
        .catch(err => console.log(err));

      axios.get('http://localhost:5000/api/users/requests/sent', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => setSentRequests(res.data))
        .catch(err => console.log(err));

      axios.get('http://localhost:5000/api/posts/user/me', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => setPosts(res.data))
        .catch(err => console.log(err));
    }
  }, [token]);

  // Handle showPendingRequests from notification click
  useEffect(() => {
    if (location.state?.showPendingRequests) {
      setView('acquaintances'); // Switch to acquaintances view to show pending requests
      if (pendingRequestsRef.current) {
        pendingRequestsRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [location.state]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.put('http://localhost:5000/api/users/profile', {
        name,
        email,
        branch,
        bio,
        skills: skills.map(skill => skill._id),
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
      setEditMode(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      console.error('Response:', err.response?.data);
      if (err.response?.status === 400) {
        alert(err.response.data.message || 'Invalid input. Please check your data and try again.');
      } else if (err.response?.status === 401) {
        alert('Session expired. Please log in again.');
        localStorage.removeItem('token');
        window.location.href = '/auth';
      } else if (err.response?.status === 500) {
        alert('Server error. Please try again later or contact support.');
      } else {
        alert('Failed to update profile. Please try again later.');
      }
    }
  };

  const handleSkillChange = (e) => {
    const selectedSkillId = e.target.value;
    const selectedSkill = availableSkills.find(skill => skill._id === selectedSkillId);
    if (selectedSkill && !skills.some(skill => skill._id === selectedSkillId)) {
      setSkills([...skills, selectedSkill]);
    }
  };

  const removeSkill = (skillId) => {
    setSkills(skills.filter(skill => skill._id !== skillId));
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/users/requests/${requestId}/accept`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/users/requests/${requestId}/decline`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(posts.map(post => post._id === postId ? res.data : post));
    } catch (err) {
      console.log(err);
    }
  };

  const handleCommentSubmit = async (postId, text) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/posts/${postId}/comment`, { text }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(posts.map(post => post._id === postId ? res.data : post));
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      console.log('Deleting post with ID:', postId);
      console.log('Token:', token);
      await axios.delete(`http://localhost:5000/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(posts.filter(post => post._id !== postId));
      alert('Post deleted successfully!');
    } catch (err) {
      console.error('Error deleting post:', err);
      if (err.response) {
        console.log('Response data:', err.response.data);
        console.log('Response status:', err.response.status);
        if (err.response.status === 401) {
          alert('Session expired. Please log in again.');
          localStorage.removeItem('token');
          window.location.href = '/auth';
        } else {
          alert(`Failed to delete post: ${err.response.data.message || 'Server error'}`);
        }
      } else {
        alert('Failed to delete post: Network error');
      }
    }
  };

  const handleRemoveAcquaintance = async (acquaintanceId) => {
    if (!window.confirm('Are you sure you want to remove this acquaintance?')) return;
    try {
      const res = await axios.delete(`http://localhost:5000/api/users/acquaintances/${acquaintanceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Response from remove acquaintance:', res.data);
      setUser(res.data.user);
      alert('Acquaintance removed successfully!');
    } catch (err) {
      console.error('Error removing acquaintance:', err);
      if (err.response) {
        console.log('Response data:', err.response.data);
        console.log('Response status:', err.response.status);
        if (err.response.status === 401) {
          alert('Session expired. Please log in again.');
          localStorage.removeItem('token');
          window.location.href = '/auth';
        } else {
          alert(`Failed to remove acquaintance: ${err.response.data.message || 'Server error'}`);
        }
      } else {
        alert('Failed to remove acquaintance: Network error');
      }
    }
  };

  if (!user || !user.name || !user.email) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h2>My Profile</h2>
      <div className="profile-picture-placeholder" style={{ width: '100px', height: '100px', borderRadius: '50%', backgroundColor: '#ccc', margin: '0 auto' }}>
        {/* Placeholder for profile picture */}
      </div>

      {editMode ? (
        <form onSubmit={handleUpdateProfile}>
          <div>
            <label>Name:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Email:</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label>Branch:</label>
            <select value={branch} onChange={(e) => setBranch(e.target.value)} required>
              <option value="" disabled>Select a branch</option>
              {availableBranches.map(branch => (
                <option key={branch._id} value={branch._id}>{branch.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label>Bio:</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
            />
          </div>
          <div>
            <label>Skills:</label>
            <select onChange={handleSkillChange} defaultValue="">
              <option value="" disabled>Select a skill</option>
              {availableSkills.map(skill => (
                <option key={skill._id} value={skill._id}>{skill.name}</option>
              ))}
            </select>
            <div>
              {skills.map(skill => (
                <span key={skill._id} style={{ marginRight: '10px' }}>
                  {skill.name} <button type="button" onClick={() => removeSkill(skill._id)}>x</button>
                </span>
              ))}
            </div>
          </div>
          <button type="submit">Save</button>
          <button type="button" onClick={() => setEditMode(false)} style={{ marginLeft: '10px', backgroundColor: '#dc3545' }}>
            Cancel
          </button>
        </form>
      ) : (
        <div>
          <p>Name: {user.name}</p>
          <p>Email: {user.email}</p>
          <p>Branch: {user.branch?.name || 'Loading...'}</p>
          <p>Skills: {user.skills?.map(skill => skill.name).join(', ') || 'None'}</p>
          <p>Bio: {user.bio || 'No bio available'}</p>
          <button onClick={() => setEditMode(true)}>Edit Profile</button>
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
          My Posts
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
          <h3>My Posts</h3>
          {posts.length === 0 ? (
            <p>You have not created any posts yet.</p>
          ) : (
            posts.map(post => (
              <div key={post._id} style={{ position: 'relative' }}>
                <PostCard
                  post={post}
                  onLike={handleLike}
                  onCommentSubmit={handleCommentSubmit}
                />
                <button
                  onClick={() => handleDeletePost(post._id)}
                  style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    padding: '5px 10px',
                    cursor: 'pointer',
                  }}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {view === 'acquaintances' && (
        <div className="acquaintances-section">
          <h3 ref={pendingRequestsRef}>
            Pending Requests
            {location.state?.showPendingRequests && (
              <span style={{ color: '#007bff', marginLeft: '10px' }}>(New Request)</span>
            )}
          </h3>
          {(!user.pendingRequests || user.pendingRequests.length === 0) ? (
            <p>No pending requests.</p>
          ) : (
            user.pendingRequests.map(request => (
              <div key={request._id}>
                <p>{request.from.name} ({request.from.email})</p>
                <button onClick={() => handleAcceptRequest(request._id)}>Accept</button>
                <button onClick={() => handleDeclineRequest(request._id)}>Decline</button>
              </div>
            ))
          )}

          <h3>Your Acquaintances</h3>
          {(!user.acquaintances || user.acquaintances.length === 0) ? (
            <p>You have no acquaintances yet.</p>
          ) : (
            user.acquaintances.map(acquaintance => (
              <ProfileMini
                key={acquaintance._id}
                user={acquaintance}
                onRemove={handleRemoveAcquaintance}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Profile;