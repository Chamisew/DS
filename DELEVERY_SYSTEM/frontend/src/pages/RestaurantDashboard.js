import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Tabs,
  Tab,
} from '@mui/material';
import { Add as AddIcon, Restaurant as RestaurantIcon } from '@mui/icons-material';
import { restaurantApi } from '../utils/axios';
import { useAuth } from '../context/AuthContext';

const RestaurantDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({ 
    totalOrders: 0, 
    totalRevenue: 0, 
    activeOrders: 0, 
    menuItems: 0 
  });
  const [restaurantId, setRestaurantId] = useState(null);
  const [hasRestaurant, setHasRestaurant] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [openMenuDialog, setOpenMenuDialog] = useState(false);
  const [openRestaurantDialog, setOpenRestaurantDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [menuFormData, setMenuFormData] = useState({ 
    name: '', 
    description: '', 
    price: '', 
    category: '', 
    image: '', 
    isAvailable: true, 
    preparationTime: 15 
  });
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
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (user && user.role === 'restaurant') {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch restaurant data
      const restaurantResponse = await restaurantApi.get('/restaurants/me');
      if (!restaurantResponse.data?._id) {
        throw new Error('Failed to get restaurant');
      }
      
      const restaurantId = restaurantResponse.data._id;
      setHasRestaurant(true);
      setRestaurantId(restaurantId);

      // Fetch menu and stats
      const [statsRes, menuRes] = await Promise.all([
        restaurantApi.get(`/restaurants/${restaurantId}/stats`),
        restaurantApi.get(`/restaurants/${restaurantId}/menu`)
      ]);

      setStats({
        totalOrders: statsRes.data.totalOrders || 0,
        totalRevenue: statsRes.data.totalRevenue || 0,
        activeOrders: statsRes.data.activeOrders || 0,
        menuItems: statsRes.data.menuItems || 0
      });

      setMenuItems(menuRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Restaurant Dialog Handlers
  const handleOpenRestaurantDialog = () => setOpenRestaurantDialog(true);
  const handleCloseRestaurantDialog = () => {
    setOpenRestaurantDialog(false);
    setRestaurantFormData({
      name: '', description: '', cuisine: '', address: '', phone: '', 
      openingHours: '', minOrder: '', deliveryTime: '', deliveryFee: '', 
      image: '', isOpen: true
    });
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

      // Prepare and validate data
      const restaurantData = {
        ...restaurantFormData,
        deliveryTime: Number(restaurantFormData.deliveryTime),
        minOrder: Number(restaurantFormData.minOrder),
        deliveryFee: Number(restaurantFormData.deliveryFee),
        owner: user.id 
      };

      if (isNaN(restaurantData.deliveryTime) || isNaN(restaurantData.minOrder) || 
          isNaN(restaurantData.deliveryFee)) {
        setError('Please enter valid numbers for delivery time, minimum order, and delivery fee');
        return;
      }

      // Submit data
      await restaurantApi.post('/restaurants', restaurantData);
      setSuccess('Restaurant created successfully');
      handleCloseRestaurantDialog();
      fetchDashboardData();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to create restaurant');
    }
  };

  const handleRestaurantChange = (e) => {
    const { name, value } = e.target;
    setRestaurantFormData(prev => ({ ...prev, [name]: value }));
  };

  // Menu Dialog Handlers
  const handleOpenMenuDialog = (item = null) => {
    if (item) {
      setSelectedItem(item);
      setMenuFormData({
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image,
        isAvailable: item.isAvailable,
        preparationTime: item.preparationTime || 15,
      });
    } else {
      setSelectedItem(null);
      setMenuFormData({
        name: '', description: '', price: '', category: '', 
        image: '', isAvailable: true, preparationTime: 15
      });
    }
    setOpenMenuDialog(true);
  };

  const handleCloseMenuDialog = () => {
    setOpenMenuDialog(false);
    setSelectedItem(null);
    setMenuFormData({
      name: '', description: '', price: '', category: '', 
      image: '', isAvailable: true, preparationTime: 15
    });
  };

  const handleMenuChange = (e) => {
    const { name, value, checked } = e.target;
    setMenuFormData(prev => ({
      ...prev,
      [name]: name === 'isAvailable' ? checked : value
    }));
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    try {
      // Validate required fields
      const requiredFields = ['name', 'price', 'category', 'preparationTime'];
      const missingFields = requiredFields.filter(field => !menuFormData[field]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      // Prepare and validate data
      const menuItemData = {
        ...menuFormData,
        price: Number(menuFormData.price),
        preparationTime: Number(menuFormData.preparationTime)
      };

      if (isNaN(menuItemData.price) || menuItemData.price <= 0) {
        setError('Please enter a valid price greater than 0');
        return;
      }

      if (isNaN(menuItemData.preparationTime) || menuItemData.preparationTime <= 0) {
        setError('Please enter a valid preparation time greater than 0');
        return;
      }

      // Submit data
      if (selectedItem) {
        await restaurantApi.put(`/menu/${selectedItem._id}`, menuItemData);
        setSuccess('Menu item updated successfully');
      } else {
        await restaurantApi.post('/menu', menuItemData);
        setSuccess('Menu item created successfully');
      }
      
      handleCloseMenuDialog();
      fetchDashboardData();
    } catch (error) {
      setError(error.response?.data?.message || 'An unexpected error occurred');
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    try {
      await restaurantApi.delete(`/menu/${itemId}`);
      setSuccess('Menu item deleted successfully');
      fetchDashboardData();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete menu item');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
          Manage your restaurant and menu
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>}

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

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: 'Total Orders', value: stats.totalOrders },
          { label: 'Total Revenue', value: `Rs. ${stats.totalRevenue}` },
          { label: 'Active Orders', value: stats.activeOrders },
          { label: 'Menu Items', value: stats.menuItems },
        ].map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card>
              <CardContent>
                <Typography>{stat.label}</Typography>
                <Typography variant="h4" sx={{ color: '#E65100' }}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mb: 4 }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenMenuDialog()}
          sx={{ backgroundColor: '#E65100' }}
        >
          Add Menu Item
        </Button>
      </Box>

      {/* Menu Items List */}
      <Grid container spacing={3}>
        {menuItems.map(item => (
          <Grid item xs={12} sm={6} md={4} key={item._id}>
            <Card>
              <CardContent>
                <Typography variant="h6">{item.name}</Typography>
                <Typography>{item.description}</Typography>
                <Typography>Rs. {item.price}</Typography>
                <Typography>Category: {item.category}</Typography>
                <Typography>Prep Time: {item.preparationTime} mins</Typography>
                <Box sx={{ mt: 2 }}>
                  <Button 
                    onClick={() => handleOpenMenuDialog(item)}
                    sx={{ mr: 1 }}
                  >
                    Edit
                  </Button>
                  <Button 
                    onClick={() => handleDeleteMenuItem(item._id)}
                    color="error"
                  >
                    Delete
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Restaurant Creation Dialog */}
      <Dialog open={openRestaurantDialog} onClose={handleCloseRestaurantDialog} maxWidth="sm" fullWidth>
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

      {/* Menu Item Dialog */}
      <Dialog open={openMenuDialog} onClose={handleCloseMenuDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedItem ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
        <form onSubmit={handleMenuSubmit}>
          <DialogContent>
            <TextField
              fullWidth
              margin="normal"
              label="Name"
              name="name"
              value={menuFormData.name}
              onChange={handleMenuChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Description"
              name="description"
              value={menuFormData.description}
              onChange={handleMenuChange}
              multiline
              rows={3}
            />
            <TextField
              fullWidth
              margin="normal"
              label="Price"
              name="price"
              type="number"
              value={menuFormData.price}
              onChange={handleMenuChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Category"
              name="category"
              value={menuFormData.category}
              onChange={handleMenuChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Preparation Time (minutes)"
              name="preparationTime"
              type="number"
              value={menuFormData.preparationTime}
              onChange={handleMenuChange}
              required
            />
            <TextField
              fullWidth
              margin="normal"
              label="Image URL"
              name="image"
              value={menuFormData.image}
              onChange={handleMenuChange}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseMenuDialog}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ backgroundColor: '#E65100' }}>
              {selectedItem ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default RestaurantDashboard;