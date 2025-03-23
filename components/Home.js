import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PostCard from './PostCard';
import { useNavigate, useLocation } from 'react-router-dom';

const Home = () => {
  const [posts, setPosts] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const location = useLocation();

  const { scrollToPostId, scrollToCommentId } = location.state || {};

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        navigate('/auth');
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Fetch user profile
        const userRes = await axios.get('http://localhost:5000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userRes.data);
        if (userRes.data.role === 'Admin') {
          navigate('/admin');
          return;
        }

        // Fetch posts
        const postsRes = await axios.get('http://localhost:5000/api/posts', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPosts(postsRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/auth');
        } else {
          setError('Failed to load data. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate]);

  useEffect(() => {
    if (scrollToPostId && posts.length > 0) {
      const postElement = document.getElementById(`post-${scrollToPostId}`);
      if (postElement) {
        postElement.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [scrollToPostId, posts]);

  const handleLike = async (postId) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/posts/${postId}/like`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPosts(posts.map((post) => (post._id === postId ? res.data : post)));
    } catch (err) {
      console.error('Error liking post:', err);
      alert('Failed to like the post. Please try again.');
    }
  };

  const handleCommentSubmit = async (postId, text) => {
    try {
      const res = await axios.post(
        `http://localhost:5000/api/posts/${postId}/comment`,
        { text },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setPosts(posts.map((post) => (post._id === postId ? res.data : post)));
    } catch (err) {
      console.error('Error submitting comment:', err);
      alert('Failed to submit comment. Please try again.');
    }
  };

  const handleDelete = async (postId) => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;

    try {
      await axios.delete(`http://localhost:5000/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPosts(posts.filter((post) => post._id !== postId));
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Failed to delete post. Please try again.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h2>Home Page</h2>
      {user && <h3>Welcome, {user.name}!</h3>}
      <h3>Posts</h3>
      {posts.length > 0 ? (
        posts.map((post) => (
          <PostCard
            key={post._id}
            post={post}
            onLike={handleLike}
            onCommentSubmit={handleCommentSubmit}
            onDelete={handleDelete}
            scrollToPostId={scrollToPostId}
            scrollToCommentId={post._id === scrollToPostId ? scrollToCommentId : null}
            currentUserId={user?._id}
          />
        ))
      ) : (
        <p>No posts available.</p>
      )}
    </div>
  );
};

export default Home;