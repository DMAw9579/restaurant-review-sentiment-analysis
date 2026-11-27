const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { requireAuth, redirectIfLoggedIn } = require('../middleware/authMiddleware');

// Registration
router.get('/register', redirectIfLoggedIn, authController.getRegister);
router.post('/register', redirectIfLoggedIn, authController.postRegister);

// Login
router.get('/login', redirectIfLoggedIn, authController.getLogin);
router.post('/login', redirectIfLoggedIn, authController.postLogin);

// Logout
router.get('/logout', authController.logout);

// Dashboard (protected)
router.get('/dashboard', requireAuth, authController.getDashboard);

// Profile (protected)
router.get('/profile', requireAuth, authController.getProfile);

// Delete own review (protected)
router.post('/my-reviews/delete/:id', requireAuth, authController.deleteMyReview);

module.exports = router;
