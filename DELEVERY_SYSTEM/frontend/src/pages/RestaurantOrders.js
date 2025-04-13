import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Button, Chip, Alert, CircularProgress, Container
} from '@mui/material';
import { restaurantApi } from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import { orderApi } from '../utils/axios';

const RestaurantOrders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (user && user.role === 'restaurant') {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      
      // First get the restaurant ID for the current user
      const restaurantResponse = await restaurantApi.get('/restaurants/me');
      const restaurantId = restaurantResponse.data._id;

      // Then fetch orders for this restaurant
      const response = await orderApi.get('/orders', {
        params: { restaurant: restaurantId }
      });

      // Process orders data
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
      setError(error.response?.data?.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setLoading(true);
      setError('');
      
      await orderApi.patch(`/orders/${orderId}/status`, {
        status: newStatus
      });

      // Update local state
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order._id === orderId 
            ? { ...order, status: newStatus }
            : order
        )
      );
      setSuccess('Order status updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error updating order status:', error);
      setError(error.response?.data?.message || 'Failed to update order status');
    } finally {
      setLoading(false);
    }
  };

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      'pending': 'confirmed',
      'confirmed': 'preparing',
      'preparing': 'ready'
    };
    return statusFlow[currentStatus.toLowerCase()] || null;
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': { bg: 'rgba(255, 152, 0, 0.2)', color: '#FF9800' },
      'confirmed': { bg: 'rgba(33, 150, 243, 0.2)', color: '#2196F3' },
      'preparing': { bg: 'rgba(230, 81, 0, 0.2)', color: '#E65100' },
      'ready': { bg: 'rgba(76, 175, 80, 0.2)', color: '#4CAF50' },
      'cancelled': { bg: 'rgba(244, 67, 54, 0.2)', color: '#F44336' }
    };
    return colors[status.toLowerCase()] || { bg: 'rgba(158, 158, 158, 0.2)', color: '#9E9E9E' };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Restaurant Orders
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Total</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.map((order) => {
              const nextStatus = getNextStatus(order.status);
              const statusColor = getStatusColor(order.status);
              
              return (
                <TableRow key={order._id}>
                  <TableCell>#{order._id.slice(-6)}</TableCell>
                  <TableCell>{order.customer.name}</TableCell>
                  <TableCell>
                    {order.items.map(item => (
                      <div key={item._id}>
                        {item.quantity}x {item.menuItem.name} - Rs. {item.price}
                      </div>
                    ))}
                  </TableCell>
                  <TableCell>Rs. {order.totalAmount}</TableCell>
                  <TableCell>
                    <Chip
                      label={order.status}
                      sx={{
                        backgroundColor: statusColor.bg,
                        color: statusColor.color
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {nextStatus && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => handleUpdateStatus(order._id, nextStatus)}
                        disabled={loading}
                      >
                        Mark as {nextStatus}
                      </Button>
                    )}
                    {order.status.toLowerCase() === 'pending' && (
                      <Button
                        variant="outlined"
                        color="error"
                        size="small"
                        sx={{ ml: 1 }}
                        onClick={() => handleUpdateStatus(order._id, 'cancelled')}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
};

export default RestaurantOrders;