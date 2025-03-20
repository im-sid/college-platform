import React, { useState } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
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
import Auth from './components/Auth'; // Import the Auth component
import './App.css';

function App() {
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Update localStorage whenever the token changes
  const handleSetToken = (newToken) => {
    setToken(newToken);
    if (newToken) {
      localStorage.setItem('token', newToken);
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
    }
  };

  return (
    <div>
      {token && <NavBar token={token} setToken={handleSetToken} />}
      <div className="App">
        <UserProvider>
          <Routes>
            <Route path="/" element={<Navigate to={token ? "/home" : "/auth"} />} />
            <Route path="/auth" element={<Auth setToken={handleSetToken} />} />
            <Route path="/home" element={token ? <Home /> : <Navigate to="/auth" />} />
            <Route path="/profile" element={token ? <Profile /> : <Navigate to="/auth" />} />
            <Route path="/create-post" element={token ? <CreatePost /> : <Navigate to="/auth" />} />
            <Route path="/search" element={token ? <Search /> : <Navigate to="/auth" />} />
            <Route path="/notifications" element={token ? <Notifications /> : <Navigate to="/auth" />} />
            <Route path="/user/:id" element={token ? <UserProfile /> : <Navigate to="/auth" />} />
            <Route path="/messages" element={token ? <Messages /> : <Navigate to="/auth" />} />
            <Route path="/acquaintances" element={token ? <Acquaintances /> : <Navigate to="/auth" />} />
            <Route path="/ideas" element={<Ideas />} />
            <Route path="*" element={<Navigate to={token ? "/home" : "/auth"} />} />
          </Routes>
        </UserProvider>
      </div>
    </div>
  );
}

export default App;