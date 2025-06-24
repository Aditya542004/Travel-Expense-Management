const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Show registration form
router.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('register', { error: null });
});

// Handle registration with password confirmation
router.post('/register', async (req, res) => {
  const { username, password, confirm_password } = req.body;
  if (!username || !password || !confirm_password) {
    return res.render('register', { error: 'All fields are required.' });
  }
  if (password !== confirm_password) {
    return res.render('register', { error: 'Passwords do not match.' });
  }
  try {
    await User.create({ username, password });
    res.redirect('/login');
  } catch (err) {
    let error = 'Registration failed. Username may already exist.';
    res.render('register', { error });
  }
});

// Show login form
router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('login', { error: null });
});

// Handle login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.render('login', { error: 'Both fields are required.' });
  }
  const user = await User.findOne({ username });
  if (user && await user.comparePassword(password)) {
    req.session.userId = user._id;
    res.redirect('/dashboard');
  } else {
    res.render('login', { error: 'Invalid credentials' });
  }
});

// Dashboard (protected)
router.get('/dashboard', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const user = await User.findById(req.session.userId);
  res.render('dashboard', { user });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;