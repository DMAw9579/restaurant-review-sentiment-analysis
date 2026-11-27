const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const getSentiment = require('../utils/sentiment');
const UserReview = require('../models/UserReview');


const CSV_FILE = path.join(__dirname, '..', 'data', 'reviews.csv');

const csvWriter = createCsvWriter({
  path: CSV_FILE,
  header: [
    { id: 'restaurant_name', title: 'restaurant_name' },
    { id: 'city', title: 'city' },
    { id: 'review_date', title: 'review_date' },
    { id: 'review_rating', title: 'review_rating' },
    { id: 'review_text', title: 'review_text' },
    { id: 'review_sentiment', title: 'review_sentiment' }
  ],
  append: true,
});

// Home Page
const renderHomePage = (req, res) => {
  res.render('index');
};

// Add Review Page
const renderAddReviewPage = (req, res) => {
  res.render('add_review');
};

// Handle Review Submission
// Requires a logged-in user (see routes/reviewRoutes.js -> requireAuth).
// Keeps writing to the CSV exactly as before (so existing charts/sentiment
// pages keep working unchanged), and additionally saves a copy linked to the
// logged-in user so it can show up on their dashboard and be deleted by them.
const handleAddReview = async (req, res) => {
  const newReview = req.body;
  const sentiment = getSentiment(newReview.review_text);
  newReview.review_sentiment = sentiment;

  try {
    await csvWriter.writeRecords([newReview]);

    if (req.session && req.session.user) {
      await UserReview.create({
        user: req.session.user.id,
        restaurant_name: newReview.restaurant_name,
        city: newReview.city,
        review_date: newReview.review_date,
        review_rating: newReview.review_rating,
        review_text: newReview.review_text,
        review_sentiment: sentiment
      });
    }

    res.redirect('/');
  } catch (err) {
    console.error('Add review error:', err);
    res.status(500).send('Failed to submit review');
  }
};

// Render Average Rating & Review Count Charts
const renderCharts = (req, res) => {
  const reviews = [];

  fs.createReadStream(CSV_FILE)
    .pipe(csv())
    .on('data', data => reviews.push(data))
    .on('end', () => {
      const restaurantData = {};

      reviews.forEach(({ restaurant_name, review_rating }) => {
        const rating = parseFloat(review_rating);
        if (!restaurant_name || isNaN(rating)) return;

        if (!restaurantData[restaurant_name]) {
          restaurantData[restaurant_name] = { count: 0, sum: 0 };
        }

        restaurantData[restaurant_name].count += 1;
        restaurantData[restaurant_name].sum += rating;
      });

      const chartData = Object.keys(restaurantData).map(name => ({
        name,
        avgRating: (restaurantData[name].sum / restaurantData[name].count).toFixed(2),
        reviewCount: restaurantData[name].count
      }));

      res.render('views_chart', { chartData });
    });
};

// Render Sentiment Distribution Chart
const renderSentimentCharts = (req, res) => {
  const reviews = [];

  fs.createReadStream(CSV_FILE)
    .pipe(csv())
    .on('data', data => reviews.push(data))
    .on('end', () => {
      const sentimentData = [];

      reviews.forEach(({ restaurant_name, review_sentiment }) => {
        if (!restaurant_name) return;

        let sentimentEntry = sentimentData.find(r => r.name === restaurant_name);
        if (!sentimentEntry) {
          sentimentEntry = {
            name: restaurant_name,
            sentiments: { Positive: 0, Neutral: 0, Negative: 0 }
          };
          sentimentData.push(sentimentEntry);
        }

        if (review_sentiment && sentimentEntry.sentiments.hasOwnProperty(review_sentiment)) {
          sentimentEntry.sentiments[review_sentiment]++;
        }
      });

      res.render('sentiment_chart', { sentimentData });
    });
};

// Render Ratings Over Time (Multi-Line Chart)
const renderRatingView = (req, res) => {
  const reviews = [];

  fs.createReadStream(CSV_FILE)
    .pipe(csv())
    .on('data', row => {
      row.review_date = new Date(row.review_date);
      row.review_rating = parseFloat(row.review_rating);
      reviews.push(row);
    })
    .on('end', () => {
      const grouped = {};

      reviews.forEach(r => {
        const key = r.restaurant_name;
        const date = new Date(r.review_date);
      
        if (isNaN(date.getTime()) || isNaN(r.review_rating)) return;
      
        const dateStr = date.toISOString().split('T')[0];
      
        if (!grouped[key]) grouped[key] = {};
        if (!grouped[key][dateStr]) grouped[key][dateStr] = [];
      
        grouped[key][dateStr].push(r.review_rating);
      });
      

      const chartData = Object.keys(grouped).map(name => {
        const dates = Object.keys(grouped[name]).sort();
        const ratings = dates.map(date =>
          grouped[name][date].reduce((a, b) => a + b, 0) / grouped[name][date].length
        );
        return { name, dates, ratings };
      });

      res.render('views_rating', { chartData });
    });
};

module.exports = {
  renderHomePage,
  renderAddReviewPage,
  handleAddReview,
  renderCharts,
  renderSentimentCharts,
  renderRatingView
};

