import React from 'react';
import { Link } from 'react-router-dom';

const ProfileMini = ({ user, onRemove, onAdd }) => {
  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '10px',
        borderBottom: '1px solid #ddd',
      }}
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
      <div style={{ flex: 1 }}>
        <Link to={`/user/${user._id}`} style={{ textDecoration: 'none', color: '#007bff' }}>
          <h4 style={{ margin: 0 }}>{user.name || 'Unknown'}</h4>
        </Link>
        <p style={{ margin: '0', color: '#666' }}>{user.email || 'No email'}</p>
      </div>
      {onAdd && (
        <button
          type="button"
          onClick={() => onAdd(user)}
          style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            padding: '5px 10px',
            cursor: 'pointer',
          }}
        >
          Add
        </button>
      )}
      {onRemove && (
        <button
          type="button"
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