const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

const User = require('../models/User');
const UserReview = require('../models/UserReview');
const Restaurant = require('../models/Restaurant');

const CSV_FILE = path.join(__dirname, '..', 'data', 'reviews.csv');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Password rule: at least 6 characters, at least 1 letter and 1 number.
const isValidPassword = (password) => {
  return typeof password === 'string' &&
    password.length >= 6 &&
    /[A-Za-z]/.test(password) &&
    /[0-9]/.test(password);
};

// ============================================================
// REGISTER
// ============================================================
const getRegister = (req, res) => {
  res.render('register', { error: null, old: {} });
};

const postRegister = async (req, res) => {
  const { name, email, password, confirmPassword } = req.body;

  try {
    if (!name || !email || !password || !confirmPassword) {
      return res.render('register', {
        error: 'All fields are required.',
        old: { name, email }
      });
    }

    if (!EMAIL_REGEX.test(email)) {
      return res.render('register', {
        error: 'Please enter a valid email address.',
        old: { name, email }
      });
    }

    if (!isValidPassword(password)) {
      return res.render('register', {
        error: 'Password must be at least 6 characters and include a letter and a number.',
        old: { name, email }
      });
    }

    if (password !== confirmPassword) {
      return res.render('register', {
        error: 'Password and Confirm Password do not match.',
        old: { name, email }
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.render('register', {
        error: 'An account with this email already exists. Please login instead.',
        old: { name, email }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'user'
    });

    return res.redirect('/login');

  } catch (err) {
    console.error('Register error:', err);
    return res.render('register', {
      error: 'Something went wrong. Please try again.',
      old: { name, email }
    });
  }
};

// ============================================================
// LOGIN
// ============================================================
const getLogin = (req, res) => {
  res.render('login', { error: null, old: {} });
};

const postLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.render('login', {
        error: 'Please enter both email and password.',
        old: { email }
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    if (!user) {
      return res.render('login', {
        error: 'Invalid email or password.',
        old: { email }
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.render('login', {
        error: 'Invalid email or password.',
        old: { email }
      });
    }

    // Store minimal, safe user info in the session
    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role
    };

    const redirectTo = req.session.redirectTo || '/dashboard';
    delete req.session.redirectTo;

    return res.redirect(redirectTo);

  } catch (err) {
    console.error('Login error:', err);
    return res.render('login', {
      error: 'Something went wrong. Please try again.',
      old: { email }
    });
  }
};

// ============================================================
// LOGOUT
// ============================================================
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
    }
    res.redirect('/login');
  });
};

// ============================================================
// Helper: read all reviews from the existing CSV file
// ============================================================
const readAllCsvReviews = () => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(CSV_FILE)) return resolve([]);
    const reviews = [];
    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on('data', (data) => reviews.push(data))
      .on('end', () => resolve(reviews))
      .on('error', reject);
  });
};

// ============================================================
// DASHBOARD
// ============================================================
const getDashboard = async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ restaurant_name: 1 });
    const allCsvReviews = await readAllCsvReviews();

    // Average rating + review count per restaurant (for "Restaurant ratings")
    const ratingMap = {};
    allCsvReviews.forEach(({ restaurant_name, review_rating }) => {
      const rating = parseFloat(review_rating);
      if (!restaurant_name || isNaN(rating)) return;
      if (!ratingMap[restaurant_name]) ratingMap[restaurant_name] = { count: 0, sum: 0 };
      ratingMap[restaurant_name].count += 1;
      ratingMap[restaurant_name].sum += rating;
    });

    const restaurantData = restaurants.map((r) => {
      const stats = ratingMap[r.restaurant_name];
      return {
        _id: r._id,
        restaurant_name: r.restaurant_name,
        city: r.city,
        address: r.address,
        avgRating: stats ? (stats.sum / stats.count).toFixed(1) : 'N/A',
        reviewCount: stats ? stats.count : 0
      };
    });

    // Overall sentiment summary (for "Sentiment analysis results")
    const sentimentSummary = { Positive: 0, Neutral: 0, Negative: 0 };
    allCsvReviews.forEach(({ review_sentiment }) => {
      if (review_sentiment && sentimentSummary.hasOwnProperty(review_sentiment)) {
        sentimentSummary[review_sentiment]++;
      }
    });

    // This user's own submitted reviews (view/delete only their own)
    const myReviews = await UserReview.find({ user: req.session.user.id }).sort({ createdAt: -1 });

    res.render('dashboard', {
      user: req.session.user,
      restaurants: restaurantData,
      sentimentSummary,
      myReviews
    });

  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).send('Error loading dashboard');
  }
};

// ============================================================
// PROFILE
// ============================================================
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user.id);
    if (!user) {
      req.session.destroy(() => res.redirect('/login'));
      return;
    }
    const reviewCount = await UserReview.countDocuments({ user: user._id });
    res.render('profile', { user, reviewCount });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).send('Error loading profile');
  }
};

// ============================================================
// DELETE MY REVIEW (own reviews only)
// ============================================================
const deleteMyReview = async (req, res) => {
  try {
    const review = await UserReview.findById(req.params.id);

    if (!review) {
      return res.status(404).send('Review not found');
    }

    if (review.user.toString() !== req.session.user.id) {
      return res.status(403).send('You can only delete your own reviews');
    }

    await UserReview.findByIdAndDelete(req.params.id);
    return res.redirect('/dashboard');

  } catch (err) {
    console.error('Delete review error:', err);
    return res.status(500).send('Failed to delete review');
  }
};

module.exports = {
  getRegister,
  postRegister,
  getLogin,
  postLogin,
  logout,
  getDashboard,
  getProfile,
  deleteMyReview
};
