const mongoose = require('mongoose');

// This model tracks reviews per logged-in user (id, ownership, delete rights).
// The existing CSV file (data/reviews.csv) keeps storing every review as before
// so the current charts / sentiment dashboards keep working untouched.
const userReviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  restaurant_name: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  review_date: {
    type: String
  },
  review_rating: {
    type: Number,
    required: true
  },
  review_text: {
    type: String,
    required: true
  },
  review_sentiment: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('UserReview', userReviewSchema);
