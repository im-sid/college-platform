import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      navigate('/auth');
      return;
    }

    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const userRes = await axios.get('http://localhost:5000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(userRes.data);

        const groupsRes = await axios.get('http://localhost:5000/api/groups', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGroups(groupsRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.message || 'Failed to load groups. Please try again.');
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/auth');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token, navigate]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Groups</h2>

      {user?.role === 'Faculty' && (
        <div style={{ marginBottom: '20px' }}>
          <Link to="/create-group">
            <button
              style={{
                padding: '10px 20px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}
            >
              Create Group
            </button>
          </Link>
        </div>
      )}

      {groups.length > 0 ? (
        <div>
          {groups.map((group) => {
            const unreadCount =
              group.unreadCounts.find((uc) => uc.user.toString() === user._id)?.count || 0;
            return (
              <Link
                to={`/group-chat/${group._id}`}
                key={group._id}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div
                  style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    marginBottom: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <h3 style={{ margin: 0 }}>{group.name}</h3>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        backgroundColor: '#28a745',
                        color: 'white',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '14px',
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <p>No groups found.</p>
      )}
    </div>
  );
};

export default Groups;