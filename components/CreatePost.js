import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreatePost = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const token = localStorage.getItem('token');
  const navigate = useNavigate();

  const handlePostSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/posts', {
        title,
        description,
        tags: tags.split(',').map(tag => tag.trim()),
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      navigate('/home');
    } catch (err) {
      console.log(err);
      alert('Failed to create post');
    }
  };

  return (
    <div>
      <h2>Create a Post</h2>
      <form onSubmit={handlePostSubmit}>
        <div>
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Description:</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Tags (comma-separated):</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="e.g., tag1, tag2"
          />
        </div>
        <button type="submit">Post</button>
      </form>
    </div>
  );
};

export default CreatePost;