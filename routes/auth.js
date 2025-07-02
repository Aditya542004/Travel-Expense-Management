const express = require('express');
const router = express.Router();
const User = require('../models/User');
const mongoose = require('mongoose');
const admin = require('firebase-admin');

// Show registration form (local users)
router.get('/register', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('register', { error: null });
});

// Handle registration with password confirmation (local users)
router.post('/register', async (req, res) => {
  const { username, password, confirm_password, accountType } = req.body;
  if (!username || !password || !confirm_password || !accountType) {
    return res.render('register', { error: 'All fields are required.' });
  }
  if (password !== confirm_password) {
    return res.render('register', { error: 'Passwords do not match.' });
  }
  if (!['manager', 'employee'].includes(accountType)) {
    return res.render('register', { error: 'Invalid account type.' });
  }
  try {
    await User.create({ username, password, provider: 'password', accountType });
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    res.render('register', { error: 'Registration failed. Username may already exist.' });
  }
});

// Show login form (local users)
router.get('/login', (req, res) => {
  if (req.session.userId) return res.redirect('/dashboard');
  res.render('login', { error: null });
});

// Handle login (local users)
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.render('login', { error: 'Both fields are required.' });
  }
  const user = await User.findOne({ username });
  if (user && await user.comparePassword(password)) {
    req.session.userId = user._id.toString();
    req.session.provider = 'password';
    res.redirect('/dashboard');
  } else {
    res.render('login', { error: 'Invalid credentials' });
  }
});

// Handle Google Signup
router.post('/google-signup', async (req, res) => {
  const { idToken, accountType } = req.body;
  if (!idToken || !accountType) {
    return res.status(400).json({ message: 'Token and account type required' });
  }
  if (!['manager', 'employee'].includes(accountType)) {
    return res.status(400).json({ message: 'Invalid account type' });
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name } = decodedToken;

    let user = await User.findOne({ firebaseUid: uid });
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    user = new User({
      firebaseUid: uid,
      email,
      name,
      provider: 'google.com',
      accountType
    });

    await user.save();

    req.session.userId = uid;
    req.session.provider = 'google.com';

    res.json({ message: 'Signup successful', user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Signup failed' });
  }
});

// Handle Google Login
router.post('/google-login', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ message: 'Token required' });
  }
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid } = decodedToken;

    const user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(403).json({ message: 'User not registered. Please sign up first.' });
    }

    req.session.userId = uid;
    req.session.provider = 'google.com';

    res.json({ message: 'Login successful', user });
  } catch (err) {
    console.error(err);
    res.status(401).json({ message: 'Invalid token' });
  }
});

// Dashboard (protected)
router.get('/dashboard', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');

  let user = null;

  if (mongoose.Types.ObjectId.isValid(req.session.userId)) {
    user = await User.findById(req.session.userId);
  }
  if (!user) {
    user = await User.findOne({ firebaseUid: req.session.userId });
  }
  if (!user) {
    req.session.destroy(() => res.redirect('/login'));
    return;
  }

  res.render('dashboard', { user });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
