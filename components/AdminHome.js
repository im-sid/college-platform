import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PostCard from './PostCard';
import { useNavigate, Link } from 'react-router-dom';

const AdminHome = () => {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          setUser(res.data);
          if (res.data.role !== 'Admin') {
            navigate('/home');
          }
        })
        .catch(err => {
          console.log(err);
          navigate('/auth');
        });

      axios.get('http://localhost:5000/api/posts', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => setPosts(res.data))
        .catch(err => console.log(err));
    } else {
      navigate('/auth');
    }
  }, [token, navigate]);

  const handleLike = async (postId) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(posts.map(post => (post._id === postId ? res.data : post)));
    } catch (err) {
      console.log(err);
    }
  };

  const handleCommentSubmit = async (postId, text) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/posts/${postId}/comment`, { text }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(posts.map(post => (post._id === postId ? res.data : post)));
    } catch (err) {
      console.log(err);
    }
  };

  const handleDelete = (postId) => {
    setPosts(posts.filter(post => post._id !== postId));
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/auth');
  };

  return (
    <div style={{ backgroundColor: '#2C3E50', color: '#ECF0F1', minHeight: '100vh', padding: '20px' }}>
      <h2 style={{ color: '#E74C3C' }}>Admin Dashboard</h2>
      <button
        onClick={handleLogout}
        style={{
          padding: '10px 20px',
          backgroundColor: '#E74C3C',
          color: '#ECF0F1',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        Logout
      </button>
      {user && (
        <div>
          <h3 style={{ color: '#3498DB' }}>Welcome, {user.name} (Admin)!</h3>
          <p>Branch: {user.branch?.name || 'Loading...'}</p>
          <p>Skills: {user.skills?.map(skill => skill.name).join(', ') || 'None'}</p>
        </div>
      )}
      <div style={{ margin: '20px 0', padding: '20px', backgroundColor: '#34495E', borderRadius: '8px' }}>
        <h3 style={{ color: '#E74C3C' }}>Admin Tools</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ marginBottom: '10px' }}>
            <Link to="/admin/delete-post" style={{ color: '#3498DB', textDecoration: 'none' }}>
              Delete Post
            </Link>
          </li>
          <li style={{ marginBottom: '10px' }}>
            <Link to="/admin/create-faculty" style={{ color: '#3498DB', textDecoration: 'none' }}>
              Create Faculty Account
            </Link>
          </li>
          <li style={{ marginBottom: '10px' }}>
            <Link to="/admin/manage-users" style={{ color: '#3498DB', textDecoration: 'none' }}>
              Ban/Unban Users
            </Link>
          </li>
        </ul>
      </div>
      <h3 style={{ color: '#E74C3C' }}>Posts</h3>
      {posts.map(post => (
        <PostCard
          key={post._id}
          post={post}
          onLike={handleLike}
          onCommentSubmit={handleCommentSubmit}
          onDelete={handleDelete} // Pass the onDelete handler
        />
      ))}
    </div>
  );
};

export default AdminHome;