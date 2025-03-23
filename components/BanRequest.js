import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import ProfileMini from './ProfileMini';

const BanRequest = () => {
  const { postId, userId } = useParams();
  const [post, setPost] = useState(null);
  const [user, setUser] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [selectedAdmin, setSelectedAdmin] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }

    const fetchData = async () => {
      try {
        if (postId !== 'null') {
          const postResponse = await axios.get(`http://localhost:5000/api/posts/${postId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setPost(postResponse.data);
        }

        const userResponse = await axios.get(`http://localhost:5000/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userResponse.data);

        const adminsResponse = await axios.get('http://localhost:5000/api/users/admins', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAdmins(adminsResponse.data);
        if (adminsResponse.data.length > 0) {
          setSelectedAdmin(adminsResponse.data[0]._id);
        }
      } catch (err) {
        console.error('Error in fetchData:', err);
        setError(err.response?.data?.message || 'Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [postId, userId, token, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Please provide a description for the ban request.');
      return;
    }
    if (!selectedAdmin) {
      setError('Please select an admin to send the request to.');
      return;
    }

    setError(null);
    setSuccess(null);

    try {
      await axios.post(
        'http://localhost:5000/api/ban-requests',
        {
          post: postId === 'null' ? null : postId,
          user: userId,
          admin: selectedAdmin,
          description,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess('Ban request sent successfully!');
      setTimeout(() => navigate('/home'), 2000);
    } catch (err) {
      console.error('Error submitting ban request:', err);
      setError(err.response?.data?.message || 'Failed to send ban request.');
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: '#E74C3C' }}>Error</h2>
        <div
          style={{
            backgroundColor: '#E74C3C',
            padding: '10px',
            borderRadius: '4px',
            color: '#ECF0F1',
          }}
        >
          {error}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <h2 style={{ color: '#E74C3C' }}>Error</h2>
        <div
          style={{
            backgroundColor: '#E74C3C',
            padding: '10px',
            borderRadius: '4px',
            color: '#ECF0F1',
          }}
        >
          User not found.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: '#E74C3C' }}>Send Ban Request</h2>

      {error && (
        <div
          style={{
            backgroundColor: '#E74C3C',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '20px',
            color: '#ECF0F1',
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            backgroundColor: '#2ECC71',
            padding: '10px',
            borderRadius: '4px',
            marginBottom: '20px',
            color: '#ECF0F1',
          }}
        >
          {success}
        </div>
      )}

      {post && (
        <div
          style={{
            border: '1px solid #ddd',
            padding: '15px',
            borderRadius: '5px',
            marginBottom: '20px',
          }}
        >
          <h3>Post Details</h3>
          <p>
            <strong>Title:</strong> {post.title}
          </p>
          <p>
            <strong>Description:</strong> {post.description}
          </p>
          <p>
            <strong>Tags:</strong> {post.tags.join(', ')}
          </p>
          <p>
            <strong>Posted by:</strong> {post.author.name}
          </p>
          <p>
            <strong>Posted on:</strong> {new Date(post.createdAt).toLocaleString()}
          </p>
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <h3>User to Ban</h3>
        <ProfileMini user={user} />
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label
            htmlFor="admin"
            style={{ display: 'block', marginBottom: '5px' }}
          >
            Select Admin to Send Request To:
          </label>
          <select
            id="admin"
            value={selectedAdmin}
            onChange={(e) => setSelectedAdmin(e.target.value)}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
            disabled={admins.length === 0}
            required
          >
            {admins.length > 0 ? (
              admins.map((admin) => (
                <option key={admin._id} value={admin._id}>
                  {admin.name} ({admin.email})
                </option>
              ))
            ) : (
              <option value="">No admins available</option>
            )}
          </select>
          {admins.length === 0 && (
            <p style={{ color: '#E74C3C', marginTop: '5px' }}>
              No admins available to send the request to.
            </p>
          )}
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label
            htmlFor="description"
            style={{ display: 'block', marginBottom: '5px' }}
          >
            Reason for Ban Request:
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe why you want to ban this user..."
            style={{
              width: '100%',
              height: '100px',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
            required
          />
        </div>

        <button
          type="submit"
          disabled={admins.length === 0}
          style={{
            backgroundColor: admins.length === 0 ? '#ccc' : '#ff4d4f',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '4px',
            cursor: admins.length === 0 ? 'not-allowed' : 'pointer',
          }}
        >
          Submit Ban Request
        </button>
      </form>
    </div>
  );
};

export default BanRequest;