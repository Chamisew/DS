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

// Get ready orders for delivery
router.get('/ready', auth, async (req, res) => {
  try {
    console.log('Fetching ready orders...');
    
    if (req.user.role !== 'delivery') {
      return res.status(403).json({ 
        message: 'Access denied',
        error: 'Only delivery personnel can view ready orders'
      });
    }

    const Order = await getOrderModel();
    console.log('Order model retrieved successfully');
    
    // First, let's check what status values exist in the database
    const allStatusValues = await Order.distinct('status');
    console.log('All status values in database:', allStatusValues);
    
    // Log the database connection details
    console.log('Database connection state:', {
      readyState: Order.db.readyState,
      host: Order.db.host,
      name: Order.db.name
    });
    
    // Then fetch orders with specific statuses
    const readyOrders = await Order.find({ 
      status: { $in: ['ready', 'pending'] }
    }).lean(); // Using lean() for better performance
    
    console.log(`Found ${readyOrders.length} ready orders`);
    
    if (readyOrders.length === 0) {
      console.log('No ready orders found. Checking all orders:');
      const allOrders = await Order.find({}).limit(5).lean();
      console.log('Sample of all orders:', allOrders);
    }
    
    res.json({
      success: true,
      count: readyOrders.length,
      data: readyOrders
    });
  } catch (error) {
    console.error('Error fetching ready orders:', error);
    res.status(500).json({ 
      success: false,
      message: 'Internal server error',
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


module.exports = router; 