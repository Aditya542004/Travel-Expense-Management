require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const path = require('path');

// Add Firebase Admin SDK
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json'); // Place your Firebase service account key here

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const User = require('./models/User'); // Import User model

const app = express();

// MongoDB Connection with status logging
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('✅ MongoDB connected successfully!'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json()); // Needed for Firebase login POST
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: process.env.MONGO_URI })
}));

// Make userId available in all views
app.use((req, res, next) => {
  res.locals.userId = req.session.userId;
  next();
});

// Redirect root to dashboard or login
app.get('/', (req, res) => {
  if (req.session.userId) {
    return res.redirect('/dashboard');
  }
  res.redirect('/login');
});

// Firebase login/register route with best practice flow
app.post('/auth/firebase-login', async (req, res) => {
  const { idToken, action } = req.body;
  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    let user = await User.findOne({ firebaseUid: decodedToken.uid });

    if (action === 'register') {
      // If registering and user doesn't exist, create user
      if (!user) {
        user = await User.create({
          firebaseUid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name || '',
          provider: decodedToken.firebase.sign_in_provider
        });
        return res.json({ success: false, redirectToLogin: true });
      } else {
        // Already registered, redirect to login
        return res.json({ success: false, redirectToLogin: true });
      }
    } else if (action === 'login') {
      // If logging in and user exists, log in
      if (user) {
        req.session.userId = user.firebaseUid;
        req.session.provider = user.provider;
        return res.json({ success: true });
      } else {
        // Not registered, redirect to register
        return res.json({ success: false, needRegister: true });
      }
    }
    res.status(400).json({ error: 'Invalid action' });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Auth routes
app.use('/', require('./routes/auth'));

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

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server started on http://localhost:${PORT}`));