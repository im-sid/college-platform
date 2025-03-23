// components/CreateFaculty.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateFaculty = () => {
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      axios.get('http://localhost:5000/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => {
          if (res.data.role !== 'Admin') {
            navigate('/home');
          }
        })
        .catch(err => {
          console.log(err);
          navigate('/auth');
        });
    } else {
      navigate('/auth');
    }
  }, [token, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/users/create-faculty', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Faculty account created successfully');
      setFormData({ name: '', email: '', password: '' });
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || 'Error creating faculty account');
    }
  };

  return (
    <div style={{ backgroundColor: '#2C3E50', color: '#ECF0F1', minHeight: '100vh', padding: '20px' }}>
      <h2 style={{ color: '#E74C3C' }}>Create Faculty Account</h2>
      <button
        onClick={() => navigate('/admin')}
        style={{
          padding: '10px 20px',
          backgroundColor: '#3498DB',
          color: '#ECF0F1',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        Back to Admin Dashboard
      </button>
      <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: 'none' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: 'none' }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: 'none' }}
          />
        </div>
        <button
          type="submit"
          style={{
            padding: '10px 20px',
            backgroundColor: '#E74C3C',
            color: '#ECF0F1',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Create Faculty Account
        </button>
      </form>
    </div>
  );
};

export default CreateFaculty;