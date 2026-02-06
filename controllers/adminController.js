const User = require('../models/User');

// Promote user to admin (Admin only)
const promoteToAdmin = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ error: 'User is already an admin' });
    }

    user.role = 'admin';
    await user.save();

    res.json({
      message: 'User promoted to admin successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to promote user',
      details: error.message 
    });
  }
};

// Demote admin to user (Admin only)
const demoteToUser = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.role === 'user') {
      return res.status(400).json({ error: 'User is already a regular user' });
    }

    // Prevent demoting yourself
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: 'You cannot demote yourself' });
    }

    user.role = 'user';
    await user.save();

    res.json({
      message: 'Admin demoted to user successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to demote user',
      details: error.message 
    });
  }
};

// Get all users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });

    res.json({
      count: users.length,
      data: users
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrieve users',
      details: error.message 
    });
  }
};

module.exports = {
  promoteToAdmin,
  demoteToUser,
  getAllUsers
};
