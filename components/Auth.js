import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

const Auth = ({ setToken }) => {
  const [showLogin, setShowLogin] = useState(true); // Default to showing the Login form

  return (
    <div style={{ maxWidth: '400px', margin: '0 auto', padding: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <button
          onClick={() => setShowLogin(true)}
          style={{
            padding: '10px 20px',
            marginRight: '10px',
            backgroundColor: showLogin ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Login
        </button>
        <button
          onClick={() => setShowLogin(false)}
          style={{
            padding: '10px 20px',
            backgroundColor: !showLogin ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          Register
        </button>
      </div>

      {showLogin ? (
        <Login setToken={setToken} />
      ) : (
        <Register setToken={setToken} />
      )}
    </div>
  );
};

export default Auth;