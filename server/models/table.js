const mongoose = require('mongoose');

const TableSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true,
    unique: true
  },
  seats: {
    type: Number,
    required: true,
    min: 1
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'cleaning'],
    default: 'available'
  },
  location: {
    type: String,
    enum: ['inside', 'outside', 'bar', 'private'],
    default: 'inside'
  },
  positionX: {
    type: Number,
    default: 0
  },
  positionY: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Table', TableSchema);