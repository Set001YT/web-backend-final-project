const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');

// Get all orders (Admin sees all, User sees only their own)
const getAllOrders = async (req, res) => {
  try {
    let query = {};
    
    // If user is not admin, show only their orders
    if (req.user.role !== 'admin') {
      query.user = req.user._id;
    }

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.menuItem', 'name category imageUrl')
      .sort({ createdAt: -1 });

    res.json({
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to retrieve orders',
      details: error.message 
    });
  }
};

// Get single order by ID
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('items.menuItem', 'name category price imageUrl');
    
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check if user owns this order or is admin
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ 
        error: 'Access denied. You can only view your own orders.' 
      });
    }

    res.json({ data: order });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    res.status(500).json({ 
      error: 'Failed to retrieve order',
      details: error.message 
    });
  }
};

// Create new order (Authenticated users)
const createOrder = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item' });
    }

    // Verify all menu items exist and get their current prices
    const orderItems = [];
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      
      if (!menuItem) {
        return res.status(404).json({ 
          error: `Menu item with ID ${item.menuItem} not found` 
        });
      }

      // Validate quantity
      const quantity = parseInt(item.quantity);
      if (quantity < 1) {
        return res.status(400).json({ 
          error: 'Quantity must be at least 1' 
        });
      }

      orderItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        quantity: quantity,
        price: menuItem.price  // Use current price from database
      });
    }

    // Create order
    const order = new Order({
      user: req.user._id,
      items: orderItems
    });

    await order.save();

    // Populate for response
    await order.populate('user', 'name email');
    await order.populate('items.menuItem', 'name category imageUrl');

    res.status(201).json({
      message: 'Order created successfully',
      data: order
    });
  } catch (error) {
    console.error('Order creation error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: Object.values(error.errors).map(e => e.message)
      });
    }
    res.status(500).json({ 
      error: 'Failed to create order',
      details: error.message 
    });
  }
};

// Update order status (Admin only)
const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        error: `Status must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    )
      .populate('user', 'name email')
      .populate('items.menuItem', 'name category');

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    res.status(500).json({ 
      error: 'Failed to update order',
      details: error.message 
    });
  }
};

// Delete order (Admin only)
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    res.json({
      message: 'Order deleted successfully',
      data: order
    });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'Invalid order ID' });
    }
    res.status(500).json({ 
      error: 'Failed to delete order',
      details: error.message 
    });
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder
};
