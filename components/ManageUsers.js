import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ProfileMini from './ProfileMini';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]); // New state for filtered users
  const [pendingBanRequests, setPendingBanRequests] = useState([]);
  const [allBanRequests, setAllBanRequests] = useState([]);
  const [error, setError] = useState(null);
  const [showBanRequests, setShowBanRequests] = useState(false); // Toggle ban requests section
  const [banRequestView, setBanRequestView] = useState('pending'); // Toggle between pending and history
  const [searchQuery, setSearchQuery] = useState(''); // Search query for users
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }

    // Verify the user is an admin
    axios.get('http://localhost:5000/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        if (res.data.role !== 'Admin') {
          navigate('/home');
        }
      })
      .catch(err => {
        console.error('Error verifying admin access:', err);
        setError('Failed to verify admin access. Please log in again.');
        navigate('/auth');
      });

    // Fetch all users
    axios.get('http://localhost:5000/api/users', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        setUsers(res.data);
        setFilteredUsers(res.data); // Initially, filtered users are the same as all users
      })
      .catch(err => {
        console.error('Error fetching users:', err);
        setError('Failed to fetch users. Please try again later.');
      });

    // Fetch pending ban requests
    axios.get('http://localhost:5000/api/ban-requests', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        setPendingBanRequests(res.data);
      })
      .catch(err => {
        console.error('Error fetching pending ban requests:', err);
        setError('Failed to fetch ban requests. Please try again later.');
      });

    // Fetch all ban requests (for history)
    axios.get('http://localhost:5000/api/ban-requests/all', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        setAllBanRequests(res.data);
      })
      .catch(err => {
        console.error('Error fetching all ban requests:', err);
        setError('Failed to fetch ban request history. Please try again later.');
      });
  }, [token, navigate]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);

    if (query.trim() === '') {
      setFilteredUsers(users); // Reset to all users if search query is empty
    } else {
      const filtered = users.filter(
        user =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  };

  const handleBanUnban = async (userId, action) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/users/${userId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(users.map(user => user._id === userId ? { ...user, isBanned: action === 'ban' } : user));
      setFilteredUsers(filteredUsers.map(user => user._id === userId ? { ...user, isBanned: action === 'ban' } : user));
      alert(response.data.message || `User ${action === 'ban' ? 'banned' : 'unbanned'} successfully`);
    } catch (err) {
      console.error(`Error ${action === 'ban' ? 'banning' : 'unbanning'} user:`, err);
      alert(err.response?.data?.message || `Error ${action === 'ban' ? 'banning' : 'unbanning'} user`);
    }
  };

  const handleBanRequestAction = async (requestId, action) => {
    try {
      const response = await axios.put(`http://localhost:5000/api/ban-requests/${requestId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const banRequest = pendingBanRequests.find(request => request._id === requestId);
      const userIdToBan = banRequest?.user?._id;

      setPendingBanRequests(pendingBanRequests.filter(request => request._id !== requestId));
      setAllBanRequests(allBanRequests.map(request => 
        request._id === requestId ? { ...request, status: action === 'approve' ? 'approved' : 'rejected' } : request
      ));

      if (action === 'approve' && userIdToBan) {
        setUsers(users.map(user => 
          user._id === userIdToBan ? { ...user, isBanned: true } : user
        ));
        setFilteredUsers(filteredUsers.map(user => 
          user._id === userIdToBan ? { ...user, isBanned: true } : user
        ));
      }

      alert(response.data.message || `Ban request ${action} successfully`);
    } catch (err) {
      console.error(`Error ${action} ban request:`, err);
      alert(err.response?.data?.message || `Error ${action} ban request`);
    }
  };

  return (
    <div style={{ backgroundColor: '#2C3E50', color: '#ECF0F1', minHeight: '100vh', padding: '20px' }}>
      <h2 style={{ color: '#E74C3C' }}>Manage Users</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => navigate('/admin')}
          style={{
            padding: '10px 20px',
            backgroundColor: '#3498DB',
            color: '#ECF0F1',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Back to Admin Dashboard
        </button>
        <button
          onClick={() => setShowBanRequests(!showBanRequests)}
          style={{
            padding: '10px 20px',
            backgroundColor: showBanRequests ? '#E74C3C' : '#2ECC71',
            color: '#ECF0F1',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          {showBanRequests ? 'Hide Ban Requests' : 'Show Ban Requests'}
        </button>
      </div>

      {error && (
        <div style={{ backgroundColor: '#E74C3C', padding: '10px', borderRadius: '4px', marginBottom: '20px' }}>
          {error}
        </div>
      )}

      {/* Ban Requests Section */}
      {showBanRequests && (
        <div style={{ marginBottom: '40px' }}>
          <h3 style={{ color: '#E74C3C' }}>Ban Requests</h3>
          <div style={{ marginBottom: '20px' }}>
            <button
              onClick={() => setBanRequestView('pending')}
              style={{
                padding: '10px 20px',
                marginRight: '10px',
                backgroundColor: banRequestView === 'pending' ? '#E74C3C' : '#34495E',
                color: '#ECF0F1',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Pending Ban Requests
            </button>
            <button
              onClick={() => setBanRequestView('history')}
              style={{
                padding: '10px 20px',
                backgroundColor: banRequestView === 'history' ? '#E74C3C' : '#34495E',
                color: '#ECF0F1',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Ban Request History
            </button>
          </div>

          {banRequestView === 'pending' && (
            <div>
              {pendingBanRequests.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {pendingBanRequests.map(request => (
                    <li
                      key={request._id}
                      style={{
                        backgroundColor: '#34495E',
                        padding: '15px',
                        marginBottom: '10px',
                        borderRadius: '8px',
                      }}
                    >
                      <div style={{ marginBottom: '10px' }}>
                        <p><strong>Requested by:</strong> {request.requester.name} ({request.requester.email})</p>
                        <p><strong>User to Ban:</strong> {request.user.name} ({request.user.email})</p>
                        {request.post ? (
                          <>
                            <p><strong>Post Title:</strong> {request.post.title}</p>
                            <p><strong>Post Description:</strong> {request.post.description}</p>
                          </>
                        ) : (
                          <p><strong>Post:</strong> Not associated with a specific post</p>
                        )}
                        <p><strong>Reason:</strong> {request.description}</p>
                        <p><strong>Requested on:</strong> {new Date(request.createdAt).toLocaleString()}</p>
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button
                          onClick={() => handleBanRequestAction(request._id, 'approve')}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#2ECC71',
                            color: '#ECF0F1',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleBanRequestAction(request._id, 'reject')}
                          style={{
                            padding: '8px 16px',
                            backgroundColor: '#E74C3C',
                            color: '#ECF0F1',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                          }}
                        >
                          Reject
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No pending ban requests.</p>
              )}
            </div>
          )}

          {banRequestView === 'history' && (
            <div>
              {allBanRequests.length > 0 ? (
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  {allBanRequests.map(request => (
                    <li
                      key={request._id}
                      style={{
                        backgroundColor: '#34495E',
                        padding: '15px',
                        marginBottom: '10px',
                        borderRadius: '8px',
                      }}
                    >
                      <div>
                        <p><strong>Requested by:</strong> {request.requester.name} ({request.requester.email})</p>
                        <p><strong>User to Ban:</strong> {request.user.name} ({request.user.email})</p>
                        {request.post ? (
                          <>
                            <p><strong>Post Title:</strong> {request.post.title}</p>
                            <p><strong>Post Description:</strong> {request.post.description}</p>
                          </>
                        ) : (
                          <p><strong>Post:</strong> Not associated with a specific post</p>
                        )}
                        <p><strong>Reason:</strong> {request.description}</p>
                        <p><strong>Status:</strong> {request.status.charAt(0).toUpperCase() + request.status.slice(1)}</p>
                        <p><strong>Requested on:</strong> {new Date(request.createdAt).toLocaleString()}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No ban request history.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Users Section with Search */}
      <h3 style={{ color: '#E74C3C' }}>All Users</h3>
      <div style={{ marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Search users by name or email..."
          value={searchQuery}
          onChange={handleSearchChange}
          style={{
            padding: '10px',
            width: '300px',
            borderRadius: '4px',
            border: '1px solid #34495E',
            backgroundColor: '#34495E',
            color: '#ECF0F1',
            outline: 'none',
          }}
        />
      </div>
      {filteredUsers.length > 0 ? (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {filteredUsers.map(user => (
            <li
              key={user._id}
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
                <h4 style={{ color: '#E74C3C', margin: 0 }}>{user.name}</h4>
                <p style={{ margin: '5px 0' }}>Email: {user.email}</p>
                <p style={{ margin: '5px 0' }}>Role: {user.role}</p>
                <p style={{ margin: '5px 0' }}>Status: {user.isBanned ? 'Banned' : 'Active'}</p>
              </div>
              <div>
                {user.role !== 'Admin' && (
                  <button
                    onClick={() => handleBanUnban(user._id, user.isBanned ? 'unban' : 'ban')}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: user.isBanned ? '#2ECC71' : '#E74C3C',
                      color: '#ECF0F1',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {user.isBanned ? 'Unban' : 'Ban'}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No users match your search.</p>
      )}
    </div>
  );
};

export default ManageUsers;