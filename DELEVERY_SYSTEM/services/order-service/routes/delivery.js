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

// Get delivery person's order history
router.get('/history', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') {
      return res.status(403).json({ message: 'Only delivery personnel can view their order history' });
    }

    const orders = await Order.find({
      deliveryPerson: req.user._id,
      status: { $in: ['delivered', 'cancelled'] },
    })
      .populate('restaurant', 'name address')
      .populate('user', 'name phone')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Accept an order for delivery
router.post('/:orderId/accept', auth, async (req, res) => {
  try {
    if (req.user.role !== 'delivery') {
      return res.status(403).json({ message: 'Only delivery personnel can accept orders' });
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'ready') {
      return res.status(400).json({ message: 'Order is not ready for delivery' });
    }

    if (order.deliveryPerson) {
      return res.status(400).json({ message: 'Order already assigned to a delivery person' });
    }

    order.deliveryPerson = req.user._id;
    order.status = 'picked_up';
    await order.save();

    res.json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});




module.exports = router; 