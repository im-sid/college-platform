import React, { useState, useEffect } from 'react';
import { Route, Routes, Navigate, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { UserProvider } from './context/UserContext';
import NavBar from './components/NavBar';
import Home from './components/Home';
import Profile from './components/Profile';
import Search from './components/Search';
import Acquaintances from './components/Acquaintances';
import Notifications from './components/Notifications';
import UserProfile from './components/UserProfile';
import CreatePost from './components/CreatePost';
import Messages from './components/Messages';
import Ideas from './components/Ideas';
import Auth from './components/Auth';
import AdminHome from './components/AdminHome';
import DeletePost from './components/DeletePost';
import CreateFaculty from './components/CreateFaculty';
import ManageUsers from './components/ManageUsers';
import CreateGroup from './components/CreateGroup';
import Groups from './components/Groups';
import GroupChat from './components/GroupChat';
import BanRequest from './components/BanRequest';
import VerifyEmail from './components/VerifyEmail';

import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(localStorage.getItem('userId') || null);
  const [isLoadingRole, setIsLoadingRole] = useState(false); // Add loading state
  const location = useLocation();
  const navigate = useNavigate();

  // Fetch user role when token is available
  useEffect(() => {
    console.log('App.js: Token effect triggered, token:', token);
    if (token && !userRole && !isLoadingRole) {
      console.log('App.js: Fetching user role...');
      setIsLoadingRole(true);
      axios
        .get('http://localhost:5000/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` },
        })
        .then((res) => {
          console.log('App.js: Profile response:', res.data);
          setUserRole(res.data.role);
          setUserId(res.data._id);
          localStorage.setItem('userId', res.data._id);
          console.log('App.js: User role set:', res.data.role, 'userId:', res.data._id);
        })
        .catch((err) => {
          console.error('App.js: Error fetching profile:', {
            message: err.message,
            response: err.response?.data,
            status: err.response?.status,
            headers: err.response?.headers,
          });
          setUserRole(null); // Clear userRole but keep token
        })
        .finally(() => {
          setIsLoadingRole(false);
        });
    }
  }, [token, isLoadingRole]);

  // Handle redirects based on token and userRole
  useEffect(() => {
    console.log(
      'App.js: Redirect useEffect triggered, token:',
      token,
      'userRole:',
      userRole,
      'isLoadingRole:',
      isLoadingRole,
      'location:',
      location.pathname
    );
    if (token && userRole && !isLoadingRole) {
      if (location.pathname === '/auth' || location.pathname === '/') {
        console.log('App.js: Redirecting to /home after successful login');
        navigate(userRole === 'Admin' ? '/admin' : '/home', { replace: true });
      }
    } else if (!token && !isLoadingRole) {
      if (location.pathname !== '/auth' && location.pathname !== '/verify-email') {
        console.log('App.js: Redirecting to /auth due to no token');
        navigate('/auth', { replace: true });
      }
    }
    // If token exists but userRole is null or isLoadingRole is true, do nothing (wait for userRole to be fetched)
  }, [token, userRole, isLoadingRole, location.pathname, navigate]);

  const handleSetToken = (newToken) => {
    console.log('App.js: handleSetToken called, newToken:', newToken);
    setToken(newToken);
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      setUserRole(null);
      setUserId(null);
      navigate('/auth', { replace: true });
    }
  };

  const shouldShowNavbar = token && userRole && userRole !== 'Admin' && !location.pathname.startsWith('/admin');
  console.log(
    'App.js: shouldShowNavbar:',
    shouldShowNavbar,
    'token:',
    token,
    'userRole:',
    userRole,
    'pathname:',
    location.pathname
  );

  const ProtectedRoute = ({ children, adminOnly = false }) => {
    console.log(
      'ProtectedRoute: Checking route, token:',
      token,
      'userRole:',
      userRole,
      'isLoadingRole:',
      isLoadingRole,
      'adminOnly:',
      adminOnly,
      'pathname:',
      location.pathname
    );
    if (!token) {
      if (location.pathname !== '/auth') {
        console.log('ProtectedRoute: Redirecting to /auth due to no token');
        return <Navigate to="/auth" replace />;
      }
      return null;
    }
    if (!userRole || isLoadingRole) {
      console.log('ProtectedRoute: Waiting for userRole to be fetched');
      return <div>Loading...</div>; // Show a loading indicator while fetching userRole
    }
    if (adminOnly && userRole !== 'Admin') {
      console.log('ProtectedRoute: Redirecting to /home, user is not an admin');
      return <Navigate to="/home" replace />;
    }
    return children;
  };

  return (
    <div>
      {shouldShowNavbar && <NavBar token={token} setToken={handleSetToken} />}
      <div className="App">
        <UserProvider>
          <Routes>
            <Route
              path="/"
              element={<Navigate to={token && userRole ? '/home' : '/auth'} replace />}
            />
            <Route path="/auth" element={<Auth setToken={handleSetToken} />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/create-post" element={<ProtectedRoute><CreatePost /></ProtectedRoute>} />
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/user/:id" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/messages" element={<ProtectedRoute><Messages /></ProtectedRoute>} />
            <Route path="/create-group" element={<ProtectedRoute><CreateGroup /></ProtectedRoute>} />
            <Route path="/acquaintances" element={<ProtectedRoute><Acquaintances /></ProtectedRoute>} />
            <Route path="/ideas" element={<ProtectedRoute><Ideas /></ProtectedRoute>} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/admin" element={<ProtectedRoute adminOnly={true}><AdminHome /></ProtectedRoute>} />
            <Route
              path="/admin/delete-post"
              element={<ProtectedRoute adminOnly={true}><DeletePost /></ProtectedRoute>}
            />
            <Route
              path="/admin/create-faculty"
              element={<ProtectedRoute adminOnly={true}><CreateFaculty /></ProtectedRoute>}
            />
            <Route
              path="/admin/manage-users"
              element={<ProtectedRoute adminOnly={true}><ManageUsers /></ProtectedRoute>}
            />
            <Route path="/group-chat/:groupId" element={<ProtectedRoute><GroupChat /></ProtectedRoute>} />
            <Route path="/groups" element={<ProtectedRoute><Groups /></ProtectedRoute>} />
            <Route
              path="/ban-request/:postId/:userId"
              element={<ProtectedRoute><BanRequest /></ProtectedRoute>}
            />
            <Route
              path="*"
              element={<Navigate to={token && userRole ? '/home' : '/auth'} replace />}
            />
          </Routes>
        </UserProvider>
      </div>
    </div>
  );
}

export default App;