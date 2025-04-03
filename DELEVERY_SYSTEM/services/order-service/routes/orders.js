const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Order, Restaurant, User, MenuItem } = require('../models');
const { auth } = require('../middleware/auth');
const axios = require('axios');

// Get all orders for the logged-in user
router.get('/user', auth, async (req, res) => {
  try {
    console.log('Fetching orders for user:', req.user._id);
    
    if (!req.user._id) {
      console.error('No user ID found in request');
      return res.status(401).json({ message: 'Invalid user data' });
    }

    const orders = await Order.find({ user: req.user._id })
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 })
      .lean();
    
    console.log('Found orders:', orders.length);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ 
      message: 'Error fetching orders',
      error: error.message 
    });
  }
});

// Get all orders for a restaurant
router.get('/', auth, async (req, res) => {
  try {
    if (!req.user.restaurant) {
      console.error('No restaurant ID found for user:', req.user._id);
      return res.status(403).json({ message: 'Access denied' });
    }

    console.log('Fetching orders for restaurant:', req.user.restaurant);

    const orders = await Order.find({ restaurant: req.user.restaurant })
      .populate({
        path: 'user',
        select: 'name email phone',
        model: mongoose.model('User')
      })
      .populate('restaurant', 'name')
      .sort({ createdAt: -1 })
      .lean();
    
    console.log(`Found ${orders.length} orders`);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

// Get a single order
router.get('/:id', auth, async (req, res) => {
  try {
    console.log('Fetching order:', req.params.id, 'for user:', req.user._id);
    
    if (!req.user._id) {
      console.error('No user ID found in request');
      return res.status(401).json({ message: 'Invalid user data' });
    }

    const order = await Order.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user._id },
        { restaurant: req.user.restaurant }
      ]
    })
    .populate('user', 'name email phone')
    .populate('restaurant', 'name')
    .lean();

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Error fetching order:', error);
    res.status(500).json({ message: 'Error fetching order' });
  }
});

module.exports = router; 