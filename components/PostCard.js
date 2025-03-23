import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';
import { FaEllipsisH } from 'react-icons/fa';
import './PostCard.css';

const PostCard = ({
  post,
  onLike,
  onCommentSubmit,
  onDelete,
  scrollToPostId,
  scrollToCommentId,
  currentUserId,
}) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(!!scrollToCommentId);
  const [userRole, setUserRole] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [highlightPost, setHighlightPost] = useState(false);
  const [highlightComment, setHighlightComment] = useState(scrollToCommentId);
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      axios
        .get('http://localhost:5000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          setUserRole(res.data.role);
        })
        .catch((err) => {
          console.error('Error fetching user profile:', err);
          setUserRole(null);
        });
    }
  }, [token]);

  useEffect(() => {
    if (scrollToPostId && post._id === scrollToPostId) {
      setHighlightPost(true);
    }

    if (scrollToCommentId && showComments) {
      const commentElement = document.getElementById(`comment-${scrollToCommentId}`);
      if (commentElement) {
        commentElement.scrollIntoView({ behavior: 'smooth' });
        setHighlightComment(scrollToCommentId);
      }
    }

    if (scrollToPostId && post._id === scrollToPostId) {
      const timer = setTimeout(() => {
        setHighlightPost(false);
        setHighlightComment(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [scrollToPostId, scrollToCommentId, showComments, post._id]);

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

  const formatTimestamp = (date) => {
    return formatDistanceToNow(new Date(date), { addSuffix: true });
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const canDelete = currentUserId && (currentUserId === post.author._id || userRole === 'Admin');

  return (
    <div className={`post-card ${highlightPost ? 'highlight-post' : ''}`} id={`post-${post._id}`}>
      <div
        className="post-header"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
      >
        <div
          className="user-info"
          onClick={handleUserClick}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
        >
          <div
            className="profile-picture-placeholder"
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              backgroundColor: '#ccc',
              marginRight: '10px',
            }}
          />
          <span>{post.author.name}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          {canDelete && (
            <button
              onClick={() => onDelete(post._id)}
              className="delete-button"
              style={{
                backgroundColor: '#E74C3C',
                color: '#ECF0F1',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '10px',
              }}
            >
              Delete
            </button>
          )}

          {userRole === 'Faculty' && (
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
                    to={`/ban-request/${post._id}/${post.author._id}`}
                    style={{ textDecoration: 'none' }}
                    onClick={() => setMenuOpen(false)}
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
      </div>

      <div className="post-content">
        <h3>{post.title}</h3>
        <p>{post.description}</p>
        <p>Tags: {post.tags.join(', ')}</p>
        <div className="post-actions">
          <button
            onClick={handleLike}
            className="like-button"
            disabled={!token || !currentUserId}
          >
            {currentUserId && post.likes.includes(currentUserId) ? 'Unlike' : 'Like'} (
            {post.likes.length})
          </button>
          <button onClick={toggleComments} className="comments-button">
            {showComments ? 'Hide Comments' : `Comments`} <span>({post.comments.length})</span>
          </button>
        </div>
      </div>

      {showComments && (
        <div className="post-comments">
          {post.comments.length > 0 ? (
            post.comments.map((comment) => (
              <div
                key={comment._id}
                id={`comment-${comment._id}`}
                className={`comment ${highlightComment === comment._id ? 'highlight-comment' : ''}`}
              >
                <p>
                  <span
                    onClick={() => handleCommenterClick(comment.user._id)}
                    style={{ cursor: 'pointer', fontWeight: 'bold', color: '#007bff' }}
                  >
                    {comment.user?.name || 'Unknown'}
                  </span>
                  : {comment.text}
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
            <button type="submit" disabled={!commentText.trim()}>
              Comment
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default PostCard;