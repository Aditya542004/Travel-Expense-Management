const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
require('dotenv').config();

const User = require('./models/User'); // Make sure you have this model

const app = express();

// Security middleware
app.use(helmet());
app.use(cookieParser());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'default_secret',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGODB_URI }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24, // 1 day
  }
}));

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Make userId available in all views
app.use((req, res, next) => {
  res.locals.userId = req.session.userId;
  next();
});

// Health check route
app.get('/health', (req, res) => res.send('OK'));

// Login page
app.get('/login', (req, res) => {
  res.render('login');
});

// Register page
app.get('/register', (req, res) => {
  res.render('register');
});

// Handle login POST
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ email: username });
    if (!user || !(await user.comparePassword(password))) {
      return res.render('login', { error: 'Invalid username or password' });
    }
    req.session.userId = user._id;
    res.redirect('/dashboard');
  } catch (err) {
    res.render('login', { error: 'An error occurred. Please try again.' });
  }
});

// Handle register POST
app.post('/register', async (req, res) => {
  const { username, password, confirm_password, accountType } = req.body;
  if (password !== confirm_password) {
    return res.render('register', { error: 'Passwords do not match' });
  }
  try {
    const existing = await User.findOne({ email: username });
    if (existing) {
      return res.render('register', { error: 'Username already exists' });
    }
    const user = new User({ email: username, password, accountType });
    await user.save();
    req.session.userId = user._id;
    res.redirect('/dashboard');
  } catch (err) {
    res.render('register', { error: 'Registration failed. Please try again.' });
  }
});

// Redirect root to dashboard or login
app.get('/', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

// Auth API routes (if you have any)
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Protect /expenses routes
app.use('/expenses', (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
}, require('./routes/expenses'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { message: 'Page not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server started on http://localhost:${PORT}`));