const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const Restaurant = require('../models/Restaurant');
const { requireAuth } = require('../middleware/authMiddleware');



// Pages
router.get('/', reviewController.renderHomePage);
router.post('/add-review', requireAuth, reviewController.handleAddReview);
router.get('/charts', reviewController.renderCharts);
router.get('/sentiment-charts', reviewController.renderSentimentCharts);
router.get('/views-rating', reviewController.renderRatingView);

// Add Review Page (only logged-in users can submit reviews)
router.get('/add-review', requireAuth, async (req, res) => {
  try {
    const restaurants = await Restaurant.find({});
    res.render('add_review', { restaurants });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// 🟢 Admin Dashboard
router.get('/admin', async (req, res) => {
  try {
    const restaurants = await Restaurant.find().sort({ createdAt: -1 });
    res.render('admin', { restaurants });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading dashboard');
  }
});

// 🟢 Render Add Restaurant Form
router.get('/restaurant/add', (req, res) => {
  res.render('add_restaurant');
});

// 🟢 Handle Add Restaurant Submission
router.post('/restaurant/add', async (req, res) => {
  try {
    const { restaurant_name, city, address, cuisine } = req.body;
    await Restaurant.create({ restaurant_name, city, address, cuisine });
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to add restaurant');
  }
});

// 🟢 Edit Restaurant
router.get('/restaurant/edit/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    res.render('edit_restaurant', { restaurant });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading edit page');
  }
});

router.post('/restaurant/edit/:id', async (req, res) => {
  try {
    const { restaurant_name, city, address, cuisine } = req.body;
    await Restaurant.findByIdAndUpdate(req.params.id, { restaurant_name, city, address, cuisine });
    res.redirect('/admin');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to update restaurant');
  }
});

// 🟢 Delete Restaurant
router.delete('/restaurant/delete/:id', async (req, res) => {
  try {
    await Restaurant.findByIdAndDelete(req.params.id);
    res.status(200).send('Deleted successfully');
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to delete');
  }
});


module.exports = router;
