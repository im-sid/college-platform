import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
const Auth = ({ setToken }) => {
  const [showLogin, setShowLogin] = useState(true);

  return (
    <div
      style={{
        maxWidth: '400px',
        margin: '0 auto',
        padding: '20px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#fff',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          marginBottom: '20px',
          gap: '10px',
        }}
      >
        <button
          onClick={() => setShowLogin(true)}
          style={{
            padding: '10px 20px',
            backgroundColor: showLogin ? '#007bff' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '16px',
            transition: 'background-color 0.3s',
          }}
          aria-pressed={showLogin}
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
            fontSize: '16px',
            transition: 'background-color 0.3s',
          }}
          aria-pressed={!showLogin}
        >
          Register
        </button>
      </div>

      {showLogin ? <Login setToken={setToken} /> : <Register setToken={setToken} />}
    </div>
  );
};

export default Auth;