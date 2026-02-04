const MenuItem = require('../models/MenuItem');

// Get all menu items (with filters)
const getAllMenuItems = async (req, res) => {
  try {
    const { category, minPrice, maxPrice, search } = req.query;
    let query = {};

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by price range
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // Search in name or description
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const menuItems = await MenuItem.find(query).sort({ createdAt: -1 });
    
    res.json({
      count: menuItems.length,
      data: menuItems
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrieve menu items',
      details: error.message 
    });
  }
};

// Get single menu item by ID
const getMenuItemById = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    
    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json({ data: menuItem });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid menu item ID' });
    }
    res.status(500).json({ 
      error: 'Failed to retrieve menu item',
      details: error.message 
    });
  }
};

// Create new menu item (Admin only)
const createMenuItem = async (req, res) => {
  try {
    const menuItem = new MenuItem(req.body);
    await menuItem.save();
    
    res.status(201).json({
      message: 'Menu item created successfully',
      data: menuItem
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ 
      error: 'Failed to create menu item',
      details: error.message 
    });
  }
};

// Update menu item (Admin only)
const updateMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json({
      message: 'Menu item updated successfully',
      data: menuItem
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid menu item ID' });
    }
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ 
      error: 'Failed to update menu item',
      details: error.message 
    });
  }
};

// Delete menu item (Admin only)
const deleteMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findByIdAndDelete(req.params.id);

    if (!menuItem) {
      return res.status(404).json({ error: 'Menu item not found' });
    }

    res.json({
      message: 'Menu item deleted successfully',
      data: menuItem
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid menu item ID' });
    }
    res.status(500).json({ 
      error: 'Failed to delete menu item',
      details: error.message 
    });
  }
};

module.exports = {
  getAllMenuItems,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem
};
