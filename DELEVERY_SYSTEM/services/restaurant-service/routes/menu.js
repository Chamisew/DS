const express = require('express');
const router = express.Router();
const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const auth = require('../middleware/auth');

// Get menu items for a restaurant
router.get('/', auth, async (req, res) => {
  try {
    console.log('Getting menu items for current user:', req.user._id);
    
    // First try to get the restaurant for the current user
    const restaurant = await Restaurant.findOne({ owner: req.user._id });
    if (!restaurant) {
      console.log('Restaurant not found for user:', req.user._id);
      return res.status(404).json({ message: 'Restaurant not found' });
    }

    console.log('Found restaurant:', restaurant._id);
    const menuItems = await MenuItem.find({ restaurant: restaurant._id });
    console.log('Found menu items:', menuItems.length);
    res.json(menuItems);
  } catch (error) {
    console.error('Error getting menu items:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get menu items for a specific restaurant
router.get('/restaurant/:restaurantId', auth, async (req, res) => {
    try {
      const { restaurantId } = req.params;
      
      // Validate restaurantId
      if (!restaurantId) {
        console.log('Invalid restaurant ID:', restaurantId);
        return res.status(400).json({ message: 'Valid restaurant ID is required' });
      }
  
      // Get the restaurant first to validate it exists
      const restaurant = await Restaurant.findById(restaurantId);
      if (!restaurant) {
        console.log('Restaurant not found:', restaurantId);
        return res.status(404).json({ message: 'Restaurant not found' });
      }
  
      // Verify ownership
      if (restaurant.owner.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Access denied' });
      }
  
      console.log('Getting menu items for restaurant:', restaurantId);
      const menuItems = await MenuItem.find({ restaurant: restaurantId });
      console.log('Found menu items:', menuItems.length);
      res.json(menuItems);
    } catch (error) {
      console.error('Error getting menu items:', error);
      res.status(500).json({ message: error.message });
    }
  });