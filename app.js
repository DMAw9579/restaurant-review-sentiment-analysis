require('dotenv').config();

const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');

const app = express();

// ===============================
// Middleware
// ===============================
app.use(bodyParser.urlencoded({ extended: true }));
// AI routes (recommendations page + chatbot widget) send JSON bodies,
// so we also need the JSON body parser alongside the existing urlencoded one.
app.use(express.json());

app.use(express.static(path.join(__dirname, 'public')));

// ===============================
// Session Middleware
// ===============================
app.use(session({
  secret: 'restaurant-secret',
  resave: false,
  saveUninitialized: true
}));

// Make the logged-in user (if any) available to every EJS view as `user`
app.use((req, res, next) => {
  res.locals.user = (req.session && req.session.user) ? req.session.user : null;
  next();
});

// ===============================
// View Engine Setup
// ===============================
app.set('view engine', 'ejs');

app.set('views', path.join(__dirname, 'views'));

// ===============================
// MongoDB Connection
// ===============================
const mongoURI = 'mongodb://127.0.0.1:27017/test';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})

.then(() => {

  console.log('✅ Connected to Local MongoDB');

  // ===============================
  // Routes
  // ===============================
  const reviewRoutes = require('./routes/reviewRoutes');

  const adminRoutes = require('./routes/adminRoutes');

  const authRoutes = require('./routes/authRoutes');

  const aiRoutes = require('./routes/aiRoutes');

  app.use('/', authRoutes);

  app.use('/', reviewRoutes);

  app.use('/', aiRoutes);

  app.use('/admin', adminRoutes);

  // ===============================
  // Start Server
  // ===============================
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

})

.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});