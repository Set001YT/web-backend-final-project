const express = require('express');
const router = express.Router();
const {
  getAllReviews,
  getReviewsByMenuItem,
  getReviewById,
  createReview,
  updateReview,
  deleteReview
} = require('../controllers/reviewController');
const { authenticate } = require('../middleware/auth');

// Public routes (GET)
router.get('/', getAllReviews);
router.get('/menu-item/:menuItemId', getReviewsByMenuItem);
router.get('/:id', getReviewById);

// Protected routes (Authenticated users)
router.post('/', authenticate, createReview);
router.put('/:id', authenticate, updateReview);
router.delete('/:id', authenticate, deleteReview);

module.exports = router;
