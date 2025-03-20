const mongoose = require('mongoose');
const Branch = require('./models/Branch');
const Skill = require('./models/Skills');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected for seeding'))
  .catch(err => console.log(err));

// Data to seed
const branches = [
  { name: 'Computer Science' },
  { name: 'Mechanical Engineering' },
  { name: 'Electrical Engineering' },
  { name: 'Civil Engineering' },
];

const skills = [
  { name: 'JavaScript' },
  { name: 'Python' },
  { name: 'Java' },
  { name: 'C++' },
  { name: 'React' },
  { name: 'Node.js' },
];

// Seed function
const seedDB = async () => {
  try {
    // Clear existing data
    await Branch.deleteMany({});
    await Skill.deleteMany({});

    // Seed branches
    await Branch.insertMany(branches);
    console.log('Branches seeded successfully');

    // Seed skills
    await Skill.insertMany(skills);
    console.log('Skills seeded successfully');

    // Close the connection
    mongoose.connection.close();
    console.log('Database connection closed');
  } catch (err) {
    console.error('Error seeding database:', err);
    mongoose.connection.close();
  }
};

// Run the seed function
seedDB();