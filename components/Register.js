import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const Register = ({ setToken }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branch, setBranch] = useState(''); // Will store the selected branch ID
  const [skills, setSkills] = useState([]); // Will store the selected skill IDs
  const [availableBranches, setAvailableBranches] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const navigate = useNavigate();

  // Fetch branches and skills when the component mounts
  useEffect(() => {
    // Fetch branches
    axios.get('http://localhost:5000/api/branches')
      .then(res => {
        setAvailableBranches(res.data);
      })
      .catch(err => {
        console.error('Error fetching branches:', err);
        alert('Failed to load branches. Please try again later.');
      });

    // Fetch skills
    axios.get('http://localhost:5000/api/skills')
      .then(res => {
        setAvailableSkills(res.data);
      })
      .catch(err => {
        console.error('Error fetching skills:', err);
        alert('Failed to load skills. Please try again later.');
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/users/register', {
        name,
        email,
        password,
        branch, // Send the selected branch ID
        skills, // Send the array of selected skill IDs
      });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userId', res.data.userId);
      setToken(res.data.token);
      navigate('/profile');
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  // Handle multiple skill selection
  const handleSkillsChange = (e) => {
    const selectedOptions = Array.from(e.target.selectedOptions).map(option => option.value);
    setSkills(selectedOptions);
  };

  return (
    <div>
      <h2>Register</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Email:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password:</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Branch:</label>
          <select
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            required
          >
            <option value="" disabled>Select a branch</option>
            {availableBranches.map(branch => (
              <option key={branch._id} value={branch._id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Skills:</label>
          <select
            multiple
            value={skills}
            onChange={handleSkillsChange}
          >
            {availableSkills.map(skill => (
              <option key={skill._id} value={skill._id}>
                {skill.name}
              </option>
            ))}
          </select>
          <p>Hold Ctrl (Windows) or Command (Mac) to select multiple skills.</p>
        </div>
        <button type="submit">Register</button>
      </form>
    </div>
  );
};

export default Register;