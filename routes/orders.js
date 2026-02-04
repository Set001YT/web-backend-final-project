const express = require('express');
const router = express.Router();
const {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder
} = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

// All routes require authentication
router.use(authenticate);

// Get all orders (user sees own, admin sees all)
router.get('/', getAllOrders);

// Get single order
router.get('/:id', getOrderById);

// Create new order (any authenticated user)
router.post('/', createOrder);

// Update order status (admin only)
router.put('/:id', requireAdmin, updateOrderStatus);

// Delete order (admin only)
router.delete('/:id', requireAdmin, deleteOrder);

module.exports = router;
