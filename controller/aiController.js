const aiService = require('../utils/aiService');
const dataAggregator = require('../utils/dataAggregator');

// ============================================================
// GET /recommendations  -> render the preference form page
// ============================================================
const renderRecommendationsPage = async (req, res) => {
  try {
    const restaurants = await dataAggregator.getRestaurantsWithStats();

    const cuisines = [...new Set(restaurants.map((r) => r.cuisine).filter(Boolean))].sort();
    const cities = [...new Set(restaurants.map((r) => r.city).filter(Boolean))].sort();

    res.render('recommendations', { cuisines, cities });
  } catch (err) {
    console.error('Recommendations page error:', err);
    res.status(500).send('Error loading recommendations page');
  }
};

// ============================================================
// POST /api/ai/summary  { restaurant_name }
// ============================================================
const getSummary = async (req, res) => {
  try {
    const { restaurant_name } = req.body;
    if (!restaurant_name) {
      return res.status(400).json({ error: 'restaurant_name is required' });
    }

    const reviews = await dataAggregator.getReviewsForRestaurant(restaurant_name);
    const summary = await aiService.summarizeRestaurantReviews(restaurant_name, reviews);

    res.json({ restaurant_name, reviewCount: reviews.length, summary });
  } catch (err) {
    console.error('AI summary error:', err);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
};

// ============================================================
// POST /api/ai/recommend  { cuisine, city, priority }
// ============================================================
const getRecommendations = async (req, res) => {
  try {
    const { cuisine, city, priority } = req.body;
    const restaurants = await dataAggregator.getRestaurantsWithStats();

    const recommendations = await aiService.recommendRestaurants(
      { cuisine: cuisine || '', city: city || '', priority: priority || '' },
      restaurants
    );

    res.json({ recommendations });
  } catch (err) {
    console.error('AI recommendation error:', err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
};

// ============================================================
// POST /api/ai/chat  { message }
// ============================================================
const chat = async (req, res) => {
  try {
    const { message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'message is required' });
    }

    const [restaurants, reviews] = await Promise.all([
      dataAggregator.getRestaurantsWithStats(),
      dataAggregator.getAllReviews()
    ]);

    const reply = await aiService.chatAnswer(message.trim(), restaurants, reviews);
    res.json({ reply });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: 'Failed to get a response' });
  }
};

module.exports = {
  renderRecommendationsPage,
  getSummary,
  getRecommendations,
  chat
};
