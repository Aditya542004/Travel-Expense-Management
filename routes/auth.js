const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWUsImlhdCI6MTUxNjIzOTAyMn0.KMUFsIDTnFmyG3nMiGM6H9FNFUROf3wh7SmqJp-QV30'; // Use process.env.JWT_SECRET in production

function generateToken(user) {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      username: user.username,
      accountType: user.accountType
    },
    JWT_SECRET,
    { expiresIn: '1d' }
  );
}

// API: Register (Signup)
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password, confirm_password, accountType } = req.body;
    if (!username || !email || !password || !confirm_password || !accountType) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    if (password !== confirm_password) {
      return res.status(400).json({ success: false, message: 'Passwords do not match' });
    }
    if (!['manager', 'employee'].includes(accountType)) {
      return res.status(400).json({ success: false, message: 'Invalid account type' });
    }
    if (await User.findOne({ email })) {
      return res.status(400).json({ success: false, message: 'Email already exists' });
    }
    if (await User.findOne({ username })) {
      return res.status(400).json({ success: false, message: 'Username already exists' });
    }
    const user = new User({ username, email, password, accountType });
    await user.save();
    const token = generateToken(user);
    res.status(201).json({
      success: true,
      message: 'Signup successful',
      token,
      user: { username, email, accountType }
    });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// API: Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    const token = generateToken(user);
    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: { username: user.username, email: user.email, accountType: user.accountType }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
