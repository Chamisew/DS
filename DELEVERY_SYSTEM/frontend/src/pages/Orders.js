import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  Box,
  Chip,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  Alert,
  useTheme,
} from '@mui/material';
import { orderApi } from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PaymentIcon from '@mui/icons-material/Payment';

const orderStatuses = [
  'pending',
  'confirmed',
  'preparing',
  'ready',
  'picked_up',
  'delivered',
  'cancelled',
];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const theme = useTheme();

  useEffect(() => {
    const checkAuth = async () => {
      if (!authLoading) {
        if (!isAuthenticated) {
          console.log('User not authenticated, redirecting to login');
          navigate('/login', { state: { from: '/orders' } });
        } else {
          console.log('User authenticated, fetching orders');
          await fetchOrders();
        }
      }
    };

    checkAuth();
  }, [authLoading, isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('Fetching orders for user:', user);
      const response = await orderApi.get('/orders/user');
      console.log('Orders response:', response.data);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        console.log('Unauthorized, redirecting to login');
        navigate('/login', { state: { from: '/orders' } });
      } else {
        setError('Failed to fetch orders. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const normalizedStatus = status.toLowerCase().replace(/ /g, '_');
    switch (normalizedStatus) {
      case 'pending':
        return 'warning';
      case 'confirmed':
        return 'info';
      case 'preparing':
        return 'primary';
      case 'ready':
        return 'info';
      case 'picked_up':
        return 'secondary';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const handleCancelOrder = async (orderId) => {
    try {
      setLoading(true);
      setError('');
      await orderApi.put(`/orders/${orderId}/cancel`);
      await fetchOrders(); // Refresh orders after cancellation
    } catch (error) {
      console.error('Error cancelling order:', error);
      setError(error.response?.data?.message || 'Failed to cancel order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
      >
        <CircularProgress sx={{ color: theme.palette.primary.main }} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return null; // Will be redirected by useEffect
  }

  
};

export default Orders; 