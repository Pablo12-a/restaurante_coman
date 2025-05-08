const express = require('express');
const Table = require('../models/table');
const Order = require('../models/order');
const router = express.Router();

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
  if (req.session.user) {
    return next();
  }
  return res.status(401).json({ message: 'Not authenticated' });
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ message: 'Not authorized' });
};

// Get all tables
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const tables = await Table.find().sort({ number: 1 });
    res.json(tables);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single table
router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    res.json(table);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create table (admin only)
router.post('/', isAdmin, async (req, res) => {
  try {
    const { number, seats, location, positionX, positionY } = req.body;
    
    // Check if table number already exists
    const existingTable = await Table.findOne({ number });
    if (existingTable) {
      return res.status(400).json({ message: 'Table number already exists' });
    }
    
    const newTable = new Table({
      number,
      seats,
      location: location || 'inside',
      positionX: positionX || 0,
      positionY: positionY || 0
    });
    
    await newTable.save();
    res.status(201).json(newTable);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update table (admin only)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    res.json(table);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete table (admin only)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    // Check if table has active orders
    const activeOrders = await Order.findOne({
      table: req.params.id,
      status: 'active'
    });
    
    if (activeOrders) {
      return res.status(400).json({ message: 'Cannot delete table with active orders' });
    }
    
    const table = await Table.findByIdAndDelete(req.params.id);
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    res.json({ message: 'Table deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update table status
router.patch('/:id/status', isAuthenticated, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!['available', 'occupied', 'reserved', 'cleaning'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    
    const table = await Table.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    if (!table) {
      return res.status(404).json({ message: 'Table not found' });
    }
    
    res.json(table);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active orders for a table
router.get('/:id/orders', isAuthenticated, async (req, res) => {
  try {
    const orders = await Order.find({
      table: req.params.id,
      status: 'active'
    })
    .sort({ createdAt: -1 })
    .populate('waiter', 'name');
    
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;