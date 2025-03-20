import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PostCard from './PostCard';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      // Fetch posts
      axios.get('http://localhost:5000/api/posts', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => setPosts(res.data))
        .catch(err => console.log(err));

      // Fetch user profile (still needed for displaying user info on the page)
      axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => setUser(res.data))
        .catch(err => console.log(err));
    }
  }, [token]);

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

  return (
    <div>
      <h2>Home Page</h2>
      {user && (
        <div>
          <h3>Welcome, {user.name}!</h3>
          <p>Branch: {user.branch?.name || 'Loading...'}</p>
          <p>Skills: {user.skills?.map(skill => skill.name).join(', ') || 'None'}</p>
        </div>
      )}
      <h3>Posts</h3>
      {posts.map(post => (
        <PostCard
          key={post._id}
          post={post}
          onLike={handleLike}
          onCommentSubmit={handleCommentSubmit}
        />
      ))}
    </div>
  );
};

export default Home;