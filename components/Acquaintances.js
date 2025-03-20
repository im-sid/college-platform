import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Acquaintances = () => {
  const [user, setUser] = useState(null);
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [sentRequests, setSentRequests] = useState([]); // Track sent requests
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (token) {
      // Fetch user profile with acquaintances and pending requests
      axios.get('http://localhost:5000/api/users/profile', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => setUser(res.data))
        .catch(err => console.log(err));

      // Fetch sent requests
      axios.get('http://localhost:5000/api/users/requests/sent', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
        .then(res => setSentRequests(res.data))
        .catch(err => console.log(err));
    }
  }, [token]);

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.get(`http://localhost:5000/api/users/search?query=${query}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSearchResults(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleSendRequest = async (id) => {
    try {
      await axios.post(`http://localhost:5000/api/users/requests/${id}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      // Refresh sent requests after sending a new one
      const res = await axios.get('http://localhost:5000/api/users/requests/sent', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSentRequests(res.data);
      alert('Friend request sent!');
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || 'Failed to send request');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/users/requests/${requestId}/accept`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      const res = await axios.put(`http://localhost:5000/api/users/requests/${requestId}/decline`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUser(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const isRequestSent = (userId) => {
    return sentRequests.some(request => request.to._id === userId && request.status === 'pending');
  };

  return (
    <div>
      <h2>Acquaintances</h2>
      <h3>Pending Requests</h3>
      {user?.pendingRequests.length === 0 ? (
        <p>No pending requests.</p>
      ) : (
        user?.pendingRequests.map(request => (
          <div key={request._id}>
            <p>{request.from.name} ({request.from.email})</p>
            <button onClick={() => handleAcceptRequest(request._id)}>Accept</button>
            <button onClick={() => handleDeclineRequest(request._id)}>Decline</button>
          </div>
        ))
      )}

      <h3>Your Acquaintances</h3>
      {user?.acquaintances.length === 0 ? (
        <p>You have no acquaintances yet.</p>
      ) : (
        user?.acquaintances.map(acquaintance => (
          <div key={acquaintance._id}>
            <p>{acquaintance.name} ({acquaintance.email})</p>
          </div>
        ))
      )}

      <h3>Search Users</h3>
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name or email"
          required
        />
        <button type="submit">Search</button>
      </form>

      <h3>Search Results</h3>
      {searchResults.length === 0 ? (
        <p>No users found</p>
      ) : (
        searchResults.map(result => (
          <div key={result._id}>
            <p>{result.name} ({result.email})</p>
            {isRequestSent(result._id) ? (
              <button disabled>Request Sent</button>
            ) : (
              <button onClick={() => handleSendRequest(result._id)}>Send Friend Request</button>
            )}
          </div>
        ))
      )}
    </div>
  );
};

export default Acquaintances;