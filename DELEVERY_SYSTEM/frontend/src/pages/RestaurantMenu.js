import React, { useState, useEffect } from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import { restaurantApi } from '../utils/axios';
import { useAuth } from '../context/AuthContext';

const RestaurantMenu = () => {
  const { user } = useAuth();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurantId, setRestaurantId] = useState(null);

  useEffect(() => {
    if (user && user.role === 'restaurant') {
      fetchRestaurantAndMenuItems();
    }
  }, [user]);

  const fetchRestaurantAndMenuItems = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First get or create the restaurant
      let restaurant;
      try {
        const restaurantResponse = await restaurantApi.get('/restaurants/me');
        
        if (!restaurantResponse.data || !restaurantResponse.data._id) {
          throw new Error('Failed to get or create restaurant');
        }
        
        restaurant = restaurantResponse.data;
        setRestaurantId(restaurant._id);
      } catch (error) {
        console.error('Error with restaurant:', error);
        setError('Failed to get or create restaurant. Please try again.');
        setLoading(false);
        return;
      }

      // Now fetch the menu items using the restaurant ID
      try {
        const menuResponse = await restaurantApi.get(`/menu/restaurant/${restaurant._id}`);
        setMenuItems(menuResponse.data || []);
      } catch (error) {
        console.error('Error fetching menu items:', error);
        
        if (error.response?.status === 401) {
          setError('Authentication failed. Please log in again.');
        } else if (error.response?.status === 403) {
          setError('Access denied. You do not have permission to view this data.');
        } else if (error.response?.status === 404) {
          setError('Menu items not found. Please add some menu items.');
        } else {
          setError(`Failed to fetch menu items: ${error.response?.data?.message || error.message}`);
        }
      }
    } catch (error) {
      console.error('Error in fetchRestaurantAndMenuItems:', error);
      setError(`Failed to fetch data: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Basic display of fetched data */}
      <Box sx={{ mt: 2 }}>
        <pre>{JSON.stringify(menuItems, null, 2)}</pre>
      </Box>
    </Box>
  );
};

export default RestaurantMenu;