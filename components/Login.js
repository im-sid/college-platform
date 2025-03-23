import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import './Login.css';

const Login = ({ setToken }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    console.log('handleLogin: Starting login process, email:', email);

    if (!email || !password) {
      setError('Please enter both email and password');
      console.log('handleLogin: Validation failed - email or password missing');
      return;
    }

    try {
      console.log('handleLogin: Attempting Firebase login...');
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      console.log('handleLogin: Firebase login successful, user:', user.uid);

      console.log('handleLogin: Sending request to /api/users/login-firebase...');
      let res;
      try {
        const idToken = await user.getIdToken();
        console.log('handleLogin: Firebase ID token:', idToken);
        res = await axios.post('http://localhost:5000/api/users/login-firebase', {
          firebaseUid: user.uid,
          email: user.email,
        }, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        });
        console.log('handleLogin: Backend response:', res.data);
      } catch (axiosError) {
        console.error('handleLogin: Error calling backend:', axiosError.response?.data || axiosError.message);
        setError('Error communicating with backend: ' + (axiosError.response?.data?.message || axiosError.message));
        try {
          await auth.signOut();
          console.log('handleLogin: Signed out user due to backend error');
        } catch (signOutError) {
          console.error('handleLogin: Error signing out after backend error:', signOutError);
        }
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        return;
      }

      // Add ban check here
      if (res.data.isBanned) {
        console.log('handleLogin: User is banned, blocking login');
        setError('Your account is banned. Please contact an admin.');
        try {
          await auth.signOut();
          console.log('handleLogin: Signed out user due to ban');
        } catch (signOutError) {
          console.error('handleLogin: Error signing out after ban check:', signOutError);
        }
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        return;
      }

      console.log('handleLogin: Setting token and userId in localStorage...');
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.userId);
      setToken(res.data.token);
      console.log('handleLogin: Token set, token:', res.data.token, 'userId:', res.data.userId);

      console.log('handleLogin: Navigating to /home...');
      navigate('/home', { replace: true });
    } catch (err) {
      console.error('handleLogin: Login error:', err.code, err.message);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError('Invalid email or password');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many login attempts. Please try again later.');
      } else {
        setError('An error occurred during login: ' + err.message);
      }
      try {
        await auth.signOut();
        console.log('handleLogin: Signed out user due to error');
      } catch (signOutError) {
        console.error('handleLogin: Error signing out:', signOutError);
      }
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Please enter your email to reset your password');
      console.log('handlePasswordReset: Validation failed - email missing');
      return;
    }

    try {
      console.log('handlePasswordReset: Sending password reset email...');
      await sendPasswordResetEmail(auth, email);
      setError('Password reset email sent. Check your inbox.');
      console.log('handlePasswordReset: Password reset email sent');
    } catch (err) {
      console.error('handlePasswordReset: Password reset error:', err);
      setError('Error sending password reset email: ' + err.message);
    }
  };

  const toggleForgotPassword = (e) => {
    e.preventDefault();
    setIsForgotPassword(!isForgotPassword);
    setError('');
    setPassword('');
    console.log('toggleForgotPassword: Toggled forgot password mode, isForgotPassword:', !isForgotPassword);
  };

  return (
    <div className="login-container">
      {isForgotPassword ? (
        <>
          <h2>Reset Password</h2>
          <form onSubmit={handlePasswordReset}>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit">Send Reset Email</button>
            <p>
              <a href="#" onClick={toggleForgotPassword}>Back to Login</a>
            </p>
          </form>
        </>
      ) : (
        <>
          <h2>Login</h2>
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
            <div className="form-group">
              <label>Password:</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>
            {error && <p className="error">{error}</p>}
            <button type="submit">Login</button>
            <p>
              <a href="#" onClick={toggleForgotPassword}>Forgot Password?</a>
            </p>
          </form>
        </>
      )}
    </div>
  );
};

export default Login;