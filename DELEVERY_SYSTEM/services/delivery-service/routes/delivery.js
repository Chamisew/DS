const express = require('express');
const router = express.Router();
const getOrderModel = require('../models/Order');
const DeliveryPerson = require('../models/DeliveryPerson');
const { auth } = require('../middleware/auth');

// Test endpoint to check database connection and model
router.get('/test', async (req, res) => {
  try {
    console.log('Testing database connection and Order model...');
    const Order = await getOrderModel();
    
    // Try to find any order
    const anyOrder = await Order.findOne({});
    console.log('Any order found:', anyOrder);
    
    // Try to count all orders
    const orderCount = await Order.countDocuments({});
    console.log('Total orders in database:', orderCount);
    
    // Try to find orders with status 'ready'
    const readyOrders = await Order.find({ status: 'ready' });
    console.log('Orders with status "ready":', readyOrders);
    
    res.json({
      anyOrder,
      orderCount,
      readyOrders
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message
    });
  }
});


module.exports = router; 