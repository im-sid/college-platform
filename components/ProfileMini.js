import React from 'react';
import { Link } from 'react-router-dom';

const ProfileMini = ({ user, onRemove }) => {
  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '10px', borderBottom: '1px solid #ddd' }}>
      <div
        className="profile-picture-placeholder"
        style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          backgroundColor: '#ccc',
          marginRight: '10px',
        }}
      >
        {/* Placeholder for profile picture */}
      </div>
      <div style={{ flex: 1 }}>
        <Link to={`/user/${user._id}`} style={{ textDecoration: 'none', color: '#007bff' }}>
          <h4 style={{ margin: 0 }}>{user.name}</h4>
        </Link>
        <p style={{ margin: '0', color: '#666' }}>{user.email}</p>
      </div>
      {onRemove && (
        <button
          onClick={() => onRemove(user._id)}
          style={{
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            padding: '5px 10px',
            cursor: 'pointer',
          }}
        >
          Remove
        </button>
      )}
    </div>
  );
};

export default ProfileMini;