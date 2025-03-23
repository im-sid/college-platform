// components/DeletePost.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const DeletePost = () => {
  const [posts, setPosts] = useState([]);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      // Fetch user profile to check role
      axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (res.data.role !== 'Admin') {
            navigate('/home'); // Redirect non-admins
          }
        })
        .catch(err => {
          console.log(err);
          navigate('/auth');
        });

      // Fetch all posts
      axios.get('http://localhost:5000/api/posts', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => setPosts(res.data))
        .catch(err => console.log(err));
    } else {
      navigate('/auth');
    }
  }, [token, navigate]);

  const handleDelete = async (postId) => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      try {
        await axios.delete(`http://localhost:5000/api/posts/${postId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPosts(posts.filter(post => post._id !== postId));
        alert('Post deleted successfully');
      } catch (err) {
        console.log(err);
        alert('Error deleting post');
      }
    }
  };

  return (
    <div style={{ backgroundColor: '#2C3E50', color: '#ECF0F1', minHeight: '100vh', padding: '20px' }}>
      <h2 style={{ color: '#E74C3C' }}>Delete Posts</h2>
      <button
        onClick={() => navigate('/admin')}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3498DB',
          color: '#ECF0F1',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        Back to Admin Dashboard
      </button>
      {posts.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {posts.map(post => (
            <li
              key={post._id}
              style={{
                backgroundColor: '#34495E',
                padding: '15px',
                marginBottom: '10px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h4 style={{ color: '#E74C3C', margin: 0 }}>{post.title}</h4>
                <p style={{ margin: '5px 0' }}>{post.content}</p>
                <small>Posted by: {post.author?.name || 'Unknown'}</small>
              </div>
              <button
                onClick={() => handleDelete(post._id)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#E74C3C',
                  color: '#ECF0F1',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p>No posts available.</p>
      )}
    </div>
  );
};

export default DeletePost;