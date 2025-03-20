import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PostCard from './PostCard';
import ProfileMini from './ProfileMini';
import './Search.css';

const Search = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ posts: [], users: [], tags: [] });
  const [recommendations, setRecommendations] = useState({ posts: [], users: [] });
  const [filterType, setFilterType] = useState('all');
  const [filterDate, setFilterDate] = useState('newest');
  const [hasSearched, setHasSearched] = useState(false);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const postsRes = await axios.get('http://localhost:5000/api/posts/recommendations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const usersRes = await axios.get('http://localhost:5000/api/users/recommendations', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecommendations({ posts: postsRes.data, users: usersRes.data });
      } catch (err) {
        console.error('Error fetching recommendations:', err);
      }
    };

    if (token) {
      fetchRecommendations();
    }
  }, [token]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setHasSearched(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/search?query=${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(res.data);
    } catch (err) {
      console.error('Error searching:', err);
    }
  };

  const handleLike = async (postId) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(prev => ({
        ...prev,
        posts: prev.posts.map(post => (post._id === postId ? res.data : post)),
      }));
      setRecommendations(prev => ({
        ...prev,
        posts: prev.posts.map(post => (post._id === postId ? res.data : post)),
      }));
    } catch (err) {
      console.error('Error liking post:', err);
    }
  };

  const handleCommentSubmit = async (postId, text) => {
    try {
      const res = await axios.post(`http://localhost:5000/api/posts/${postId}/comment`, { text }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResults(prev => ({
        ...prev,
        posts: prev.posts.map(post => (post._id === postId ? res.data : post)),
      }));
      setRecommendations(prev => ({
        ...prev,
        posts: prev.posts.map(post => (post._id === postId ? res.data : post)),
      }));
    } catch (err) {
      console.error('Error submitting comment:', err);
    }
  };

  const handleTagClick = (tag) => {
    navigate(`/ideas?tag=${tag}`);
  };

  const filteredResults = {
    posts: results.posts,
    users: results.users,
    tags: results.tags,
  };

  const displayedResults = {
    posts: filterType === 'all' || filterType === 'posts' ? filteredResults.posts : [],
    users: filterType === 'all' || filterType === 'users' ? filteredResults.users : [],
    tags: filterType === 'all' || filterType === 'tags' ? filteredResults.tags : [],
  };

  displayedResults.posts = [...displayedResults.posts].sort((a, b) => {
    const dateA = new Date(a.createdAt);
    const dateB = new Date(b.createdAt);
    return filterDate === 'newest' ? dateB - dateA : dateA - dateB;
  });

  return (
    <div className="search-page">
      <h2>Search</h2>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for posts, users, or tags..."
          required
        />
        <button type="submit">Search</button>
      </form>

      <div className="filter-controls">
        <div>
          <label>Type: </label>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">All</option>
            <option value="posts">Posts</option>
            <option value="users">Users</option>
            <option value="tags">Tags</option>
          </select>
        </div>
        {(filterType === 'all' || filterType === 'posts') && (
          <div>
            <label>Sort by Date: </label>
            <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
            </select>
          </div>
        )}
      </div>

      {!hasSearched ? (
        <div className="recommendations">
          <h3>Recommended for You</h3>
          <div className="recommended-users">
            <h4>Users You Might Know</h4>
            {recommendations.users.length === 0 ? (
              <p>No user recommendations available.</p>
            ) : (
              recommendations.users.map(user => (
                <ProfileMini key={user._id} user={user} />
              ))
            )}
          </div>
          <div className="recommended-posts">
            <h4>Posts You Might Like</h4>
            {recommendations.posts.length === 0 ? (
              <p>No post recommendations available.</p>
            ) : (
              recommendations.posts.map(post => (
                <PostCard
                  key={post._id}
                  post={post}
                  onLike={handleLike}
                  onCommentSubmit={handleCommentSubmit}
                />
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="search-results">
          <h3>Results</h3>
          {(filterType === 'all' || filterType === 'posts') && (
            <div className="posts-section">
              <h4>Posts</h4>
              {displayedResults.posts.length === 0 ? (
                <p>No posts found</p>
              ) : (
                displayedResults.posts.map(post => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onLike={handleLike}
                    onCommentSubmit={handleCommentSubmit}
                  />
                ))
              )}
            </div>
          )}
          {(filterType === 'all' || filterType === 'users') && (
            <div className="users-section">
              <h4>Users</h4>
              {displayedResults.users.length === 0 ? (
                <p>No users found</p>
              ) : (
                displayedResults.users.map(user => (
                  <ProfileMini key={user._id} user={user} />
                ))
              )}
            </div>
          )}
          {(filterType === 'all' || filterType === 'tags') && (
            <div className="tags-section">
              <h4>Tags</h4>
              {displayedResults.tags.length === 0 ? (
                <p>No tags found</p>
              ) : (
                displayedResults.tags.map(tag => (
                  <span
                    key={tag}
                    className="tag"
                    onClick={() => handleTagClick(tag)}
                  >
                    #{tag}
                  </span>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Search;