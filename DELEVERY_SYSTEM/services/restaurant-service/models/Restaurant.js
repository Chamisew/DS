const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  cuisine: {
    type: String,
    required: true,
    trim: true
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0
  },
  deliveryTime: {
    type: Number,
    required: true
  },
  minOrder: {
    type: Number,
    required: true
  },
  isOpen: {
    type: Boolean,
    default: true
  },
  image: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

restaurantSchema.index({ name: 'text', cuisine: 'text' });
restaurantSchema.index({ owner: 1 });
restaurantSchema.index({ isOpen: 1 });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant; 