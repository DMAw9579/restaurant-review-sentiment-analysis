// ============================================================
// dataAggregator.js
// ------------------------------------------------------------
// Single shared place that reads the existing data sources
// (data/reviews.csv + the Restaurant collection) and shapes
// them into the structures the new AI features need.
//
// Nothing here changes how reviews/restaurants are stored -
// it only reads what already exists, the same way
// reviewController.js / authController.js already do.
// ============================================================

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const Restaurant = require('../models/Restaurant');

const CSV_FILE = path.join(__dirname, '..', 'data', 'reviews.csv');

// Read every review row from the CSV (same file the charts use).
function getAllReviews() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(CSV_FILE)) return resolve([]);

    const reviews = [];
    fs.createReadStream(CSV_FILE)
      .pipe(csv())
      .on('data', (row) => {
        // Skip malformed/blank rows (the CSV has a stray blank line in it)
        if (!row.restaurant_name || !row.review_text) return;
        reviews.push({
          restaurant_name: row.restaurant_name.trim(),
          city: (row.city || '').trim(),
          review_date: row.review_date || '',
          review_rating: parseFloat(row.review_rating) || 0,
          review_text: row.review_text.trim(),
          review_sentiment: row.review_sentiment || 'Neutral'
        });
      })
      .on('end', () => resolve(reviews))
      .on('error', reject);
  });
}

// All reviews for one specific restaurant (case-insensitive match).
async function getReviewsForRestaurant(restaurantName) {
  const all = await getAllReviews();
  const target = restaurantName.trim().toLowerCase();
  return all.filter((r) => r.restaurant_name.toLowerCase() === target);
}

// Restaurant documents merged with their computed stats
// (avg rating, review count, sentiment breakdown, cuisine, city).
// This is the "one object per restaurant" view every AI feature works from.
async function getRestaurantsWithStats() {
  const [restaurants, reviews] = await Promise.all([
    Restaurant.find({}).lean(),
    getAllReviews()
  ]);

  const statsByName = {};
  reviews.forEach((r) => {
    const key = r.restaurant_name.toLowerCase();
    if (!statsByName[key]) {
      statsByName[key] = {
        count: 0,
        sum: 0,
        sentiments: { Positive: 0, Neutral: 0, Negative: 0 },
        cities: new Set()
      };
    }
    const s = statsByName[key];
    s.count += 1;
    s.sum += r.review_rating;
    if (s.sentiments[r.review_sentiment] !== undefined) {
      s.sentiments[r.review_sentiment] += 1;
    }
    if (r.city) s.cities.add(r.city);
  });

  // Restaurants that exist in MongoDB (the admin-managed list)
  const merged = restaurants.map((r) => {
    const stats = statsByName[r.restaurant_name.toLowerCase()];
    return {
      id: r._id.toString(),
      restaurant_name: r.restaurant_name,
      city: r.city,
      address: r.address,
      cuisine: r.cuisine || 'Multi-cuisine',
      avgRating: stats ? +(stats.sum / stats.count).toFixed(2) : null,
      reviewCount: stats ? stats.count : 0,
      sentiments: stats ? stats.sentiments : { Positive: 0, Neutral: 0, Negative: 0 }
    };
  });

  // Some CSV rows reference restaurants that were never added in /admin
  // (e.g. the seed data). Include them too, so recommendations/chat/summary
  // still cover every restaurant that actually has reviews.
  const knownNames = new Set(merged.map((r) => r.restaurant_name.toLowerCase()));
  Object.keys(statsByName).forEach((key) => {
    if (knownNames.has(key)) return;
    const stats = statsByName[key];
    const original = reviews.find((r) => r.restaurant_name.toLowerCase() === key);
    merged.push({
      id: null,
      restaurant_name: original.restaurant_name,
      city: [...stats.cities][0] || '',
      address: '',
      cuisine: 'Multi-cuisine',
      avgRating: +(stats.sum / stats.count).toFixed(2),
      reviewCount: stats.count,
      sentiments: stats.sentiments
    });
  });

  return merged;
}

module.exports = {
  getAllReviews,
  getReviewsForRestaurant,
  getRestaurantsWithStats
};
