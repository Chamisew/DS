const express = require('express');
const router = express.Router();
const Restaurant = require('../models/Restaurant');
const auth = require('../middleware/auth');


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
