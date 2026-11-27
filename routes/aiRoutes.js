const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

// Page
router.get('/recommendations', aiController.renderRecommendationsPage);

// JSON API used by the recommendations page, dashboard "AI Summary" buttons,
// and the chatbot widget (public - same visibility as /charts, /sentiment-charts)
router.post('/api/ai/summary', aiController.getSummary);
router.post('/api/ai/recommend', aiController.getRecommendations);
router.post('/api/ai/chat', aiController.chat);

module.exports = router;
