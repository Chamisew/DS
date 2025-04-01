const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { auth } = require('../middleware/auth');

// Get available orders for delivery
router.get('/available', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') {
      return res.status(403).json({ message: 'Only delivery personnel can view available orders' });
    }

    const orders = await Order.find({
      status: 'ready',
      deliveryPerson: { $exists: false },
    })
      .populate('restaurant', 'name address')
      .populate('user', 'name phone')
      .sort({ createdAt: 1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get delivery person's current orders
router.get('/current', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') {
      return res.status(403).json({ message: 'Only delivery personnel can view their current orders' });
    }

    const orders = await Order.find({
      deliveryPerson: req.user._id,
      status: { $in: ['picked_up'] },
    })
      .populate('restaurant', 'name address')
      .populate('user', 'name phone')
      .sort({ createdAt: 1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


module.exports = router; 