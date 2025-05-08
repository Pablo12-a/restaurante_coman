const express = require('express');
const Order = require('../models/order');
const Table = require('../models/table');
const MenuItem = require('../models/menu');
const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  return res.status(401).json({ message: 'Not authenticated' });
};

// Get all orders
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const { status, table } = req.query;
    
    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (table) filter.table = table;
    
    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('table', 'number')
      .populate('waiter', 'name');
      
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single order
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('table', 'number')
      .populate('waiter', 'name');
      
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create order
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { tableId, items } = req.body;
    
    // Validate table
    const table = await Table.findById(tableId);
    if (!table) {
      return res.status(400).json({ message: 'Invalid table' });
    }
    
    // Update table status
    table.status = 'occupied';
    await table.save();
    
    // Process order items
    const processedItems = [];
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        return res.status(400).json({ message: `Menu item not found: ${item.menuItemId}` });
      }
      
      processedItems.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        notes: item.notes || ''
      });
    }
    
    // Create new order
    const newOrder = new Order({
      table: table._id,
      tableNumber: table.number,
      items: processedItems,
      waiter: req.session.user.id,
    });
    
    await newOrder.save();
    
    res.status(201).json(newOrder);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order status
router.patch('/:id/status', isAuthenticated, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['active', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    order.status = status;
    
    // If order is completed or cancelled, update table status
    if (status === 'completed' || status === 'cancelled') {
      // Check if table has other active orders
      const activeOrders = await Order.countDocuments({
        table: order.table,
        status: 'active',
        _id: { $ne: order._id }
      });
      
      if (activeOrders === 0) {
        // No other active orders, mark table as cleaning
        await Table.findByIdAndUpdate(order.table, { status: 'cleaning' });
      }
    }
    
    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update order item status
router.patch('/:id/items/:itemId/status', isAuthenticated, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['pending', 'preparing', 'ready', 'delivered'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const item = order.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Order item not found' });
    }
    
    item.status = status;
    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add items to order
router.post('/:id/items', isAuthenticated, async (req, res) => {
  try {
    const { items } = req.body;
    
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Process new items
    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        return res.status(400).json({ message: `Menu item not found: ${item.menuItemId}` });
      }
      
      order.items.push({
        menuItem: menuItem._id,
        name: menuItem.name,
        price: menuItem.price,
        quantity: item.quantity,
        notes: item.notes || ''
      });
    }
    
    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete item from order
router.delete('/:id/items/:itemId', isAuthenticated, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const item = order.items.id(req.params.itemId);
    if (!item) {
      return res.status(404).json({ message: 'Order item not found' });
    }
    
    item.remove();
    await order.save();
    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get kitchen orders (for chef view)
router.get('/kitchen/active', isAuthenticated, async (req, res) => {
  try {
    if (req.session.user.role !== 'admin' && req.session.user.role !== 'chef') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const orders = await Order.find({ 
      status: 'active',
      'items.status': { $in: ['pending', 'preparing'] }
    })
    .sort({ createdAt: 1 })
    .populate('table', 'number')
    .populate('waiter', 'name');
    
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;