import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../context/UserContext';
import { formatDistanceToNow } from 'date-fns'; // Import date-fns function
import './PostCard.css';

const PostCard = ({ post, onLike, onCommentSubmit }) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);
  const { currentUserId } = useContext(UserContext);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const handleLike = () => {
    onLike(post._id);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onCommentSubmit(post._id, commentText);
    setCommentText('');
  };

  const handleUserClick = () => {
    navigate(`/user/${post.author._id}`);
  };

  const handleCommenterClick = (commenterId) => {
    navigate(`/user/${commenterId}`);
  };

  const toggleComments = () => {
    setShowComments(!showComments);
  };

  // Function to format the timestamp as relative time
  const formatTimestamp = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  return (
    <div className="post-card">
      <div className="post-header">
        <div className="user-info" onClick={handleUserClick} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <div className="profile-picture-placeholder" style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#ccc', marginRight: '10px' }}>
            {/* Placeholder for profile picture */}
          </div>
          <span>{post.author.name}</span>
        </div>
      </div>
      <div className="post-content">
        <h3>{post.title}</h3>
        <p>{post.description}</p>
        <p>Tags: {post.tags.join(', ')}</p>
        <div className="post-actions">
          <button onClick={handleLike} className="like-button" disabled={!token || currentUserId === null}>
            {currentUserId === null ? 'Loading...' : (currentUserId && post.likes.includes(currentUserId) ? 'Unlike' : 'Like')} ({post.likes.length})
          </button>
          <button onClick={toggleComments} className="comments-button">
            {showComments ? 'Hide Comments' : `Comments`} <span>({post.comments.length})</span>
          </button>
        </div>
      </div>
      {showComments && (
        <div className="post-comments">
          {post.comments.length > 0 ? (
            post.comments.map((comment, index) => (
              <div key={index} className="comment">
                <p>
                  <span
                    onClick={() => handleCommenterClick(comment.user._id)}
                    style={{ cursor: 'pointer', fontWeight: 'bold', color: '#007bff' }}
                  >
                    {comment.user?.name || 'Unknown'}
                  </span>: {comment.text} 
                  <span style={{ color: '#888', fontSize: '0.9em', marginLeft: '10px' }}>
                    ({formatTimestamp(comment.createdAt)})
                  </span>
                </p>
              </div>
            ))
          ) : (
            <p>No comments yet.</p>
          )}
          <form onSubmit={handleCommentSubmit} className="comment-form">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment"
              required
            />
            <button type="submit" disabled={!commentText.trim()}>Comment</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostCard;