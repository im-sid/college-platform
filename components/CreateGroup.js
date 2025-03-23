import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ProfileMini from './ProfileMini';

const CreateGroup = () => {
  const [groupName, setGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [user, setUser] = useState(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }

    // Fetch the logged-in user's profile to check their role
    axios.get('http://localhost:5000/api/users/profile', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => {
        setUser(res.data);
        if (res.data.role !== 'Faculty') {
          alert('Only faculty can create groups');
          navigate('/home');
        }
      })
      .catch(err => {
        console.error(err);
        navigate('/auth');
      });
  }, [token, navigate]);

  const handleSearch = async () => { // Removed e parameter since it's not a form submission
    console.log('Search button clicked, query:', searchQuery);
    if (!searchQuery.trim()) {
      console.log('Search query is empty');
      return;
    }

    try {
      const res = await axios.get(`http://localhost:5000/api/search?query=${searchQuery}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('Search API response:', res.data);
      setSearchResults(res.data.users); // Use res.data.users since the endpoint returns { posts, users, tags }
    } catch (err) {
      console.error('Error searching users:', err.response ? err.response.data : err.message);
      alert(err.response?.data?.message || 'Error searching users');
    }
  };

  const handleAddMember = (member) => {
    if (selectedMembers.some(m => m._id === member._id)) {
      alert('User already added to the group');
      return;
    }
    setSelectedMembers([...selectedMembers, member]);
  };

  const handleRemoveMember = (memberId) => {
    setSelectedMembers(selectedMembers.filter(member => member._id !== memberId));
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }
    if (selectedMembers.length === 0) {
      alert('Please add at least one member to the group');
      return;
    }

    try {
      const memberIds = selectedMembers.map(member => member._id);
      const res = await axios.post('http://localhost:5000/api/groups', {
        name: groupName,
        memberIds,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('Group created successfully!');
      navigate('/groups');
    } catch (err) {
      console.error('Error creating group:', err);
      alert(err.response?.data?.message || 'Error creating group');
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Create a Group</h2>
      <form onSubmit={handleCreateGroup}>
        <div style={{ marginBottom: '20px' }}>
          <label>Group Name:</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            style={{ padding: '10px', width: '300px', marginLeft: '10px' }}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Search Members</h3>
          <div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name or email"
              style={{ padding: '10px', width: '300px', marginRight: '10px' }}
            />
            <button
              type="button" // Use type="button" to prevent form submission
              onClick={handleSearch} // Trigger search on click
              style={{ padding: '10px 20px' }}
            >
              Search
            </button>
          </div>
        </div>

        {searchResults.length > 0 ? (
          <div style={{ marginBottom: '20px' }}>
            <h3>Search Results</h3>
            {searchResults.map(result => (
              <ProfileMini
                key={result._id}
                user={result}
                onAdd={handleAddMember}
              />
            ))}
          </div>
        ) : (
          searchQuery && <p>No users found</p>
        )}

        {selectedMembers.length > 0 && (
          <div style={{ marginBottom: '20px' }}>
            <h3>Selected Members</h3>
            {selectedMembers.map(member => (
              <ProfileMini
                key={member._id}
                user={member}
                onRemove={handleRemoveMember}
              />
            ))}
          </div>
        )}

        <button
          type="submit"
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Create Group
        </button>
      </form>
    </div>
  );
};

export default CreateGroup;