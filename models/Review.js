const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  menuItem: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MenuItem',
    required: [true, 'Menu item is required']
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  },
  comment: {
    type: String,
    required: [true, 'Comment is required'],
    minlength: [5, 'Comment must be at least 5 characters'],
    maxlength: [500, 'Comment cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Prevent duplicate reviews (one user can review one dish only once)
reviewSchema.index({ user: 1, menuItem: 1 }, { unique: true });

module.exports = mongoose.model('Review', reviewSchema);
