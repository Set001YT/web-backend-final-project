const Review = require('../models/Review');
const MenuItem = require('../models/MenuItem');

// Get all reviews (with optional menuItem filter)
const getAllReviews = async (req, res) => {
  try {
    const { menuItem } = req.query;
    let query = {};

    if (menuItem) {
      query.menuItem = menuItem;
    }

    const reviews = await Review.find(query)
      .populate('user', 'name email')
      .populate('menuItem', 'name category')
      .sort({ createdAt: -1 });

    res.json({
      count: reviews.length,
      data: reviews
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrieve reviews',
      details: error.message 
    });
  }
};

// Get reviews for specific menu item (with average rating)
const getReviewsByMenuItem = async (req, res) => {
  try {
    const { menuItemId } = req.params;

    const reviews = await Review.find({ menuItem: menuItemId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    res.json({
      count: reviews.length,
      averageRating: averageRating.toFixed(1),
      data: reviews
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrieve reviews',
      details: error.message 
    });
  }
};

// Get single review by ID
const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate('user', 'name email')
      .populate('menuItem', 'name category price');
    
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    res.json({ data: review });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid review ID' });
    }
    res.status(500).json({ 
      error: 'Failed to retrieve review',
      details: error.message 
    });
  }
};

// Create new review (Authenticated users only)
const createReview = async (req, res) => {
  try {
    const { menuItem, rating, comment } = req.body;

    // Check if menu item exists
    const menuItemExists = await MenuItem.findById(menuItem);
    if (!menuItemExists) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    // Check if user already reviewed this item
    const existingReview = await Review.findOne({
      user: req.user._id,
      menuItem: menuItem
    });

    if (existingReview) {
      return res.status(400).json({ 
        error: 'You have already reviewed this menu item' 
      });
    }

    // Create review
    const review = new Review({
      user: req.user._id,
      menuItem,
      rating,
      comment
    });

    await review.save();

    // Populate user and menuItem info
    await review.populate('user', 'name email');
    await review.populate('menuItem', 'name category');

    res.status(201).json({
      message: 'Review created successfully',
      data: review
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ 
      error: 'Failed to create review',
      details: error.message 
    });
  }
};

// Update review (Owner or Admin only)
const updateReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user is owner or admin
    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        error: 'Access denied. You can only update your own reviews.' 
      });
    }

    // Update only rating and comment (not user or menuItem)
    const { rating, comment } = req.body;
    
    if (rating) review.rating = rating;
    if (comment) review.comment = comment;

    await review.save();
    await review.populate('user', 'name email');
    await review.populate('menuItem', 'name category');

    res.json({
      message: 'Review updated successfully',
      data: review
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid review ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ 
      error: 'Failed to update review',
      details: error.message 
    });
  }
};

// Delete review (Owner or Admin only)
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    // Check if user is owner or admin
    const isOwner = review.user.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ 
        error: 'Access denied. You can only delete your own reviews.' 
      });
    }

    await Review.findByIdAndDelete(req.params.id);

    res.json({
      message: 'Review deleted successfully',
      data: review
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid review ID' });
    }
    res.status(500).json({ 
      error: 'Failed to delete review',
      details: error.message 
    });
  }
};

module.exports = {
  getAllReviews,
  getReviewsByMenuItem,
  getReviewById,
  createReview,
  updateReview,
  deleteReview
};
