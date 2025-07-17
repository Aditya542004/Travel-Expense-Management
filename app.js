const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');
require('dotenv').config();

const User = require('./models/User'); // Make sure you have this model
const employeeRoutes = require('./routes/employee');

const app = express();


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

// Landing page
app.get('/', (req, res) => {
  res.render('landingpage');
});

// Show login page
app.get('/login', (req, res) => {
  res.render('login');
});

// Show register page
app.get('/register', (req, res) => {
  res.render('register');
});
// Show register page
app.get('/expenses', (req, res) => {
  res.render('expenses', { expenses: [] }); // Always pass expenses array
});
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.json({ success: false, message: 'Invalid email or password' });
    }

    // Store session details
    req.session.userId = user._id;
    req.session.accountType = user.accountType;

    console.log('Logged in user:', user.email, 'Role:', user.accountType); // Debug log

    // Send success response
    return res.json({
      success: true,
      user: {
        email: user.email,
        accountType: user.accountType
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.json({ success: false, message: 'Server error. Please try again.' });
  }
});


// Handle register POST
app.post('/register', async (req, res) => {
  const { username, email, password, confirm_password, accountType } = req.body;
  if (password !== confirm_password) {
    return res.render('register', { error: 'Passwords do not match' });
  }
  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.render('register', { error: 'Email already exists' });
    }
    const existingUsername = await User.findOne({ username });
    if (existingUsername) {
      return res.render('register', { error: 'Username already exists' });
    }
    const user = new User({ username, email, password, accountType });
    await user.save();
    req.session.userId = user._id;
    req.session.accountType = user.accountType;
  } catch (err) {
    res.render('register', { error: 'Registration failed. Please try again.' });
  }
});

app.get('/manager/dashboard', (req, res) => {
  if (!req.session.userId || req.session.accountType !== 'manager') {
    return res.redirect('/login');
  }
  res.render('manager_dashboard');
});

app.get('/employee/dashboard', (req, res) => {
  if (!req.session.userId || req.session.accountType !== 'employee') {
    return res.redirect('/login');
  }
  res.render('employee_dashboard');
});

app.use('/api/employee', employeeRoutes);

// Logout
app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { message: 'Page not found' });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server started on http://localhost:${PORT}`));