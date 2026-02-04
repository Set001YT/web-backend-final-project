const express = require('express');
const router = express.Router();
const {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
} = require('../controllers/menuItemController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

// Public routes (GET)
router.get('/', getAllMenuItems);
router.get('/:id', getMenuItemById);

// Protected routes (Admin only)
router.post('/', authenticate, requireAdmin, createMenuItem);
router.put('/:id', authenticate, requireAdmin, updateMenuItem);
router.delete('/:id', authenticate, requireAdmin, deleteMenuItem);

module.exports = router;
