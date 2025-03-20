import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import PostCard from './PostCard';
import './Ideas.css';

const Ideas = () => {
  const [posts, setPosts] = useState([]);
  const token = localStorage.getItem('token');
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const tag = queryParams.get('tag');

  useEffect(() => {
    if (token && tag) {
      axios.get(`http://localhost:5000/api/posts/by-tag/${tag}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => setPosts(res.data))
        .catch(err => console.error('Error fetching posts by tag:', err));
    }
  }, [token, tag]);

  const handleLike = async (postId) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(posts.map(post => (post._id === postId ? res.data : post)));
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleCommentSubmit = async (postId, text) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/posts/${postId}/comment`, { text }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(posts.map(post => (post._id === postId ? res.data : post)));
    } catch (err) {
      console.error('Error submitting comment:', err);
    }
  };

  return (
    <div className="ideas-page">
      <h2>Ideas with Tag: #{tag}</h2>
      {posts.length === 0 ? (
        <p>No posts found with this tag.</p>
      ) : (
        posts.map(post => (
          <PostCard
            key={post._id}
            post={post}
            onLike={handleLike}
            onCommentSubmit={handleCommentSubmit}
          />
        ))
      )}
    </div>
  );
};

export default Ideas;