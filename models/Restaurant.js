const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  restaurant_name: {
    type: String,
    required: true,
    trim: true
  },
  city: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  cuisine: {
    type: String,
    trim: true,
    default: 'Multi-cuisine'
  }
}, {
  timestamps: true // optional: adds createdAt and updatedAt
});

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
module.exports = Restaurant;
