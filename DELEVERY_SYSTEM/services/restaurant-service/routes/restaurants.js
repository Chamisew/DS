const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const auth = require('../middleware/auth');
const MenuItem = require('../models/MenuItem');
const Order = require('../models/Order');
const axios = require('axios');


// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'restaurant-service' });
});

// Get all restaurants
router.get('/', async (req, res) => {
  try {
    const { cuisine, search, sort, page = 1, limit = 10 } = req.query;
    const query = {};

    if (cuisine) {
      query.cuisine = cuisine;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOptions = {};
    if (sort) {
      switch (sort) {
        case 'rating':
          sortOptions.rating = -1;
          break;
        case 'deliveryTime':
          sortOptions.deliveryTime = 1;
          break;
        case 'price':
          sortOptions.minOrder = 1;
          break;
        default:
          sortOptions.createdAt = -1;
      }
    }

    const restaurants = await Restaurant.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('owner', 'name email');

    const total = await Restaurant.countDocuments(query);

    res.json({
      restaurants,
      total,
      pages: Math.ceil(total / limit),
      currentPage: page,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get current user's restaurant
router.get('/me', auth, async (req, res) => {
  try {
    console.log('Getting restaurant for user:', req.user._id);
    
    if (req.user.role !== 'restaurant') {
      return res.status(403).json({ message: 'Access denied' });
    }

    let restaurant = await Restaurant.findOne({ owner: req.user._id });
    
    if (!restaurant) {
      console.log('No restaurant found for user:', req.user._id);
      // Create a default restaurant for the user
      restaurant = new Restaurant({
        name: 'My Restaurant',
        description: 'Welcome to my restaurant',
        cuisine: 'General',
        address: '123 Main St',
        owner: req.user._id,
        deliveryTime: 30,
        minOrder: 10,
        deliveryFee: 5,
        isOpen: true,
        isVerified: false
      });

      try {
        restaurant = await restaurant.save();
        console.log('Created new restaurant:', restaurant);
      } catch (error) {
        console.error('Error creating restaurant:', error);
        return res.status(500).json({ message: 'Failed to create restaurant' });
      }
    }

    console.log('Found/created restaurant:', restaurant);
    res.json(restaurant);
  } catch (error) {
    console.error('Error fetching/creating user restaurant:', error);
    res.status(500).json({ message: error.message });
  }
});


// Get restaurant menu items (public access)
router.get('/:id/menu', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    const menuItems = await MenuItem.find({ 
      restaurant: restaurant._id,
      isAvailable: true 
    }).select('name description price category image isAvailable');
    
    res.json(menuItems);
  } catch (error) {
    console.error('Error getting restaurant menu items:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get restaurant menu items (restaurant owner access)
router.get('/menu/restaurant/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'restaurant') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Verify ownership
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const menuItems = await MenuItem.find({ restaurant: restaurant._id });
    res.json(menuItems);
  } catch (error) {
    console.error('Error getting restaurant menu items:', error);
    res.status(500).json({ message: error.message });
  }
});


// Get restaurant orders
router.get('/:id/orders', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    // Verify ownership
    if (restaurant.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const orders = await Order.find({ restaurant: restaurant._id })
      .populate('user', 'name email phone')
      .populate('items.menuItem', 'name price')
      .sort({ createdAt: -1 });

    console.log('Found orders:', orders.length);
    console.log('Sample order data:', orders.length > 0 ? {
      orderId: orders[0]._id,
      userId: orders[0].user?._id,
      userName: orders[0].user?.name,
      userEmail: orders[0].user?.email
    } : 'No orders');

    // Format the orders data
    const formattedOrders = orders.map(order => ({
      _id: order._id,
      user: order.user,
      items: order.items.map(item => ({
        menuItem: item.menuItem,
        quantity: item.quantity,
        price: item.price
      })),
      totalAmount: order.totalAmount,
      status: order.status,
      deliveryAddress: order.deliveryAddress,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    res.json(formattedOrders);
  } catch (error) {
    console.error('Error getting restaurant orders:', error);
    res.status(500).json({ message: error.message });
  }
});


// Get restaurant details
router.get('/:id', async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id)
      .populate('owner', 'name email');

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    res.json(restaurant);
  } catch (error) {
    console.error('Error getting restaurant details:', error);
    res.status(500).json({ message: error.message });
  }
});


// Create restaurant
router.post('/', auth, async (req, res) => {
  try {
    console.log('Create restaurant request:', req.body);
    console.log('User:', req.user);
    
    if (req.user.role !== 'restaurant' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only restaurant owners and admins can create restaurants' });
    }

    // Validate required fields
    const requiredFields = ['name', 'cuisine', 'address', 'deliveryTime', 'minOrder', 'deliveryFee'];
    const missingFields = requiredFields.filter(field => !req.body[field]);
    
    if (missingFields.length > 0) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        missingFields 
      });
    }

    // For restaurant owners, ensure they can only create a restaurant for themselves
    if (req.user.role === 'restaurant') {
      // Restaurant owners can only create restaurants for themselves
      const restaurant = new Restaurant({
        ...req.body,
        owner: req.user._id,
        email: req.user.email
      });
      
      const newRestaurant = await restaurant.save();
      return res.status(201).json(newRestaurant);
    } else if (req.user.role === 'admin') {
      // Admins can create restaurants for any owner
      if (!req.body.owner) {
        return res.status(400).json({ message: 'Owner ID is required for admin-created restaurants' });
      }
      
      const restaurant = new Restaurant({
        ...req.body,
        owner: req.body.owner,
        email: req.body.email || req.user.email
      });
      
      const newRestaurant = await restaurant.save();
      return res.status(201).json(newRestaurant);
    }
  } catch (error) {
    console.error('Error creating restaurant:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    res.status(400).json({ message: error.message });
  }
});


// Update restaurant
router.put('/:id', auth, async (req, res) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (!restaurant) {
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    if (restaurant.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this restaurant' });
    }

    Object.assign(restaurant, req.body);
    const updatedRestaurant = await restaurant.save();
    res.json(updatedRestaurant);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});