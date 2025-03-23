import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

const Register = ({ setToken }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState('');
  const [skills, setSkills] = useState([]);
  const [availableBranches, setAvailableBranches] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [emailValid, setEmailValid] = useState(null);
  const [emailError, setEmailError] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [registerNumberValid, setRegisterNumberValid] = useState(null);
  const [registerNumberError, setRegisterNumberError] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      setIsFetchingData(true);
      setError('');

      try {
        const branchesRes = await axios.get('http://localhost:5000/api/branches');
        setAvailableBranches(branchesRes.data);

        const skillsRes = await axios.get('http://localhost:5000/api/skills');
        setAvailableSkills(skillsRes.data);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load branches or skills. Please try again later.');
      } finally {
        setIsFetchingData(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const validateEmailFormat = () => {
      if (!email) {
        setEmailValid(null);
        setEmailError('');
        setRegisterNumber('');
        setRegisterNumberValid(null);
        setRegisterNumberError('');
        return;
      }

      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!regex.test(email)) {
        setEmailValid(false);
        setEmailError('Invalid email format');
        setRegisterNumber('');
        setRegisterNumberValid(null);
        setRegisterNumberError('');
        return;
      }

      const domain = email.split('@')[1];
      if (domain !== 'mvgrce.edu.in') {
        setEmailValid(false);
        setEmailError('Email must be a college email (username@mvgrce.edu.in)');
        setRegisterNumber('');
        setRegisterNumberValid(null);
        setRegisterNumberError('');
        return;
      }

      const extractedRegisterNumber = email.split('@')[0];
      setRegisterNumber(extractedRegisterNumber);

      setEmailValid(true);
      setEmailError('');
      setRegisterNumberValid(true);
      setRegisterNumberError('');
    };

    const debounce = setTimeout(validateEmailFormat, 500);
    return () => clearTimeout(debounce);
  }, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!emailValid || !registerNumberValid) {
      setError('Please fix the errors in the form');
      setIsLoading(false);
      return;
    }

    if (!branch) {
      setError('Please select a branch');
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await sendEmailVerification(user);

      const idToken = await user.getIdToken();

      const res = await axios.post(
        'http://localhost:5000/api/users/register-firebase',
        {
          firebaseUid: user.uid,
          name,
          email,
          branch,
          skills,
          registerNumber,
        },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      await auth.signOut();

      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      setToken(null);

      navigate('/verify-email', { replace: true });
    } catch (err) {
      console.error('Registration error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('This email is already registered. Please log in instead.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkillsChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map((option) => option.value);
    setSkills(selectedOptions);
  };

  if (isFetchingData) {
    return <div>Loading branches and skills...</div>;
  }

  if (error && !isLoading) {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
        <p style={{ color: '#E74C3C', margin: '10px 0' }}>{error}</p>
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>Register</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>
            Email (username@mvgrce.edu.in):
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              borderColor: emailValid === null ? '#ddd' : emailValid ? 'green' : 'red',
            }}
          />
          {emailError && <p style={{ color: '#E74C3C', margin: '5px 0' }}>{emailError}</p>}
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Branch:</label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
            }}
          >
            <option value="" disabled>
              Select a branch
            </option>
            {availableBranches.map((branch) => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px' }}>Skills:</label>
          <select
            multiple
            value={skills}
            onChange={handleSkillsChange}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: '4px',
              border: '1px solid #ddd',
              height: '100px',
            }}
          >
            {availableSkills.map((skill) => (
              <option key={skill._id} value={skill._id}>
                {skill.name}
              </option>
            ))}
          </select>
          <p style={{ fontSize: '0.9em', color: '#666', marginTop: '5px' }}>
            Hold Ctrl (Windows) or Command (Mac) to select multiple skills.
          </p>
        </div>
        {error && <p style={{ color: '#E74C3C', margin: '10px 0' }}>{error}</p>}
        <button
          type="submit"
          disabled={isLoading || emailValid !== true || registerNumberValid !== true}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor:
              isLoading || emailValid !== true || registerNumberValid !== true
                ? '#ccc'
                : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor:
              isLoading || emailValid !== true || registerNumberValid !== true
                ? 'not-allowed'
                : 'pointer',
          }}
        >
          {isLoading ? 'Registering...' : 'Register'}
        </button>
      </form>
    </div>
  );
};

export default Register;