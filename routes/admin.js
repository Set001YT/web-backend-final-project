const express = require('express');
const router = express.Router();
const {
  promoteToAdmin,
  demoteToUser,
  getAllUsers
} = require('../controllers/adminController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbac');

// All routes require admin privileges
router.use(authenticate, requireAdmin);

// Get all users
router.get('/users', getAllUsers);

// Promote user to admin
router.post('/promote', promoteToAdmin);

// Demote admin to user
router.post('/demote', demoteToUser);

module.exports = router;
