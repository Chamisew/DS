import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert
} from '@mui/material';
import { Restaurant as RestaurantIcon } from '@mui/icons-material';
import { restaurantApi } from '../utils/axios';
import { useAuth } from '../context/AuthContext';

const RestaurantDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasRestaurant, setHasRestaurant] = useState(false);
  const [openRestaurantDialog, setOpenRestaurantDialog] = useState(false);
  const [restaurantFormData, setRestaurantFormData] = useState({
    name: '',
    description: '',
    cuisine: '',
    address: '',
    phone: '',
    openingHours: '',
    minOrder: '',
    deliveryTime: '',
    deliveryFee: '',
    image: '',
    isOpen: true,
  });

  useEffect(() => {
    if (user && user.role === 'restaurant') {
      checkRestaurantExists();
    }
  }, [user]);

  const checkRestaurantExists = async () => {
    try {
      setLoading(true);
      const response = await restaurantApi.get('/restaurants/me');
      if (response.data && response.data._id) {
        setHasRestaurant(true);
      }
    } catch (error) {
      console.error('Error checking restaurant:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenRestaurantDialog = () => {
    setOpenRestaurantDialog(true);
  };

  const handleCloseRestaurantDialog = () => {
    setOpenRestaurantDialog(false);
    setRestaurantFormData({
      name: '',
      description: '',
      cuisine: '',
      address: '',
      phone: '',
      openingHours: '',
      minOrder: '',
      deliveryTime: '',
      deliveryFee: '',
      image: '',
      isOpen: true,
    });
  };

  const handleRestaurantChange = (e) => {
    const { name, value } = e.target;
    setRestaurantFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRestaurantSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // Validate required fields
      const requiredFields = ['name', 'description', 'cuisine', 'address', 'phone', 
                            'openingHours', 'minOrder', 'deliveryTime', 'deliveryFee'];
      const missingFields = requiredFields.filter(field => !restaurantFormData[field]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Prepare data for submission
      const restaurantData = {
        ...restaurantFormData,
        deliveryTime: Number(restaurantFormData.deliveryTime),
        minOrder: Number(restaurantFormData.minOrder),
        deliveryFee: Number(restaurantFormData.deliveryFee),
        owner: user.id
      };

      // Validate numbers
      if (isNaN(restaurantData.deliveryTime) || 
          isNaN(restaurantData.minOrder) || 
          isNaN(restaurantData.deliveryFee)) {
        setError('Please enter valid numbers for delivery time, minimum order, and delivery fee');
        return;
      }

      // Submit to API
      const response = await restaurantApi.post('/restaurants', restaurantData);
      console.log('Restaurant created:', response.data);
      
      setSuccess('Restaurant created successfully');
      setHasRestaurant(true);
      handleCloseRestaurantDialog();
    } catch (error) {
      console.error('Error creating restaurant:', error);
      setError(error.response?.data?.message || error.message || 'Failed to create restaurant');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#E65100' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6, mt: 2 }}>
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, color: '#E65100' }}>
          Restaurant Dashboard
        </Typography>
        <Typography variant="subtitle1">
          {hasRestaurant ? 'Manage your restaurant' : 'Create your restaurant to get started'}
        </Typography>
      </Box>

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

      <Box sx={{ mb: 4 }}>
        <Button
          variant="contained"
          startIcon={<RestaurantIcon />}
          onClick={handleOpenRestaurantDialog}
          disabled={hasRestaurant}
          sx={{ backgroundColor: '#E65100' }}
        >
          {hasRestaurant ? 'Restaurant Already Added' : 'Add Restaurant'}
        </Button>
      </Box>

      {/* Restaurant Creation Dialog */}
      <Dialog 
        open={openRestaurantDialog} 
        onClose={handleCloseRestaurantDialog} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>Add New Restaurant</DialogTitle>
        <form onSubmit={handleRestaurantSubmit}>
          <DialogContent>
            {[
              { name: 'name', label: 'Restaurant Name', required: true },
              { name: 'description', label: 'Description', required: true, multiline: true, rows: 3 },
              { name: 'cuisine', label: 'Cuisine', required: true },
              { name: 'address', label: 'Address', required: true },
              { name: 'phone', label: 'Phone', required: true },
              { name: 'openingHours', label: 'Opening Hours', required: true },
              { name: 'minOrder', label: 'Minimum Order', required: true, type: 'number' },
              { name: 'deliveryTime', label: 'Delivery Time (minutes)', required: true, type: 'number' },
              { name: 'deliveryFee', label: 'Delivery Fee', required: true, type: 'number' },
              { name: 'image', label: 'Image URL' },
            ].map((field) => (
              <TextField
                key={field.name}
                fullWidth
                margin="normal"
                label={field.label}
                name={field.name}
                value={restaurantFormData[field.name]}
                onChange={handleRestaurantChange}
                required={field.required}
                type={field.type}
                multiline={field.multiline}
                rows={field.rows}
              />
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRestaurantDialog}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ backgroundColor: '#E65100' }}>
              Create Restaurant
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default RestaurantDashboard;