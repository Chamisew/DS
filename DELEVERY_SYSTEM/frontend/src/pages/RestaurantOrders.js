import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Container,
  Typography,
  Alert
} from '@mui/material';
import { restaurantApi, orderApi } from '../utils/axios';
import { useAuth } from '../context/AuthContext';

const RestaurantOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user && user.role === 'restaurant') {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First get restaurant ID
      const restaurantResponse = await restaurantApi.get('/restaurants/me', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!restaurantResponse.data?._id) {
        throw new Error('No restaurant found');
      }
      
      const restaurantId = restaurantResponse.data._id;

      // Then fetch orders for this restaurant
      const response = await orderApi.get('/orders', {
        params: { restaurant: restaurantId },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (!Array.isArray(response.data)) {
        throw new Error('Invalid orders data');
      }

      // Transform order data
      const ordersWithDetails = response.data.map(order => ({
        ...order,
        customer: {
          name: order.userDetails?.name || 'Unknown Customer'
        },
        items: order.items.map(item => ({
          ...item,
          menuItem: {
            name: item.name || 'Unknown Item',
            price: item.price
          }
        }))
      }));
      
      setOrders(ordersWithDetails);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        setError('Authentication failed. Please log in again.');
      } else if (error.response?.status === 403) {
        setError('Access denied. Please check your permissions.');
      } else {
        setError(error.message || 'Failed to fetch orders');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>
          Orders
        </Typography>
        <Typography>
          Manage and track your restaurant orders
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Orders table will be implemented in next commit */}
      <Box sx={{ mt: 2 }}>
        <pre>{JSON.stringify(orders, null, 2)}</pre>
      </Box>
    </Container>
  );
};

export default RestaurantOrders;