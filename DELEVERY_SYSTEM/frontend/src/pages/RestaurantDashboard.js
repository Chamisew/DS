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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Checkbox
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Restaurant as RestaurantIcon } from '@mui/icons-material';
import { restaurantApi } from '../utils/axios';
import { useAuth } from '../context/AuthContext';

const RestaurantDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    preparationTime: 15,
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
      
      // Check if restaurant exists
      const restaurantResponse = await restaurantApi.get('/restaurants/me');
      if (restaurantResponse.data && restaurantResponse.data._id) {
        const restaurantId = restaurantResponse.data._id;
        setHasRestaurant(true);
        setRestaurantId(restaurantId);
        
        // Fetch menu items
        const menuRes = await restaurantApi.get(`/restaurants/${restaurantId}/menu`);
        setMenuItems(menuRes.data || []);
      }
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
      image: '', isOpen: true,
    });
  };

  const handleRestaurantSubmit = async (e) => {
    e.preventDefault();
    try {
      const requiredFields = ['name', 'description', 'cuisine', 'address', 'phone', 
                            'openingHours', 'minOrder', 'deliveryTime', 'deliveryFee'];
      const missingFields = requiredFields.filter(field => !restaurantFormData[field]);
      
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      const restaurantData = {
        ...restaurantFormData,
        deliveryTime: Number(restaurantFormData.deliveryTime),
        minOrder: Number(restaurantFormData.minOrder),
        deliveryFee: Number(restaurantFormData.deliveryFee),
        owner: user.id 
      };

      const response = await restaurantApi.post('/restaurants', restaurantData);
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
        image: '', isAvailable: true, preparationTime: 15,
      });
    }
    setOpenMenuDialog(true);
  };

  const handleCloseMenuDialog = () => {
    setOpenMenuDialog(false);
    setSelectedItem(null);
    setMenuFormData({
      name: '', description: '', price: '', category: '', 
      image: '', isAvailable: true, preparationTime: 15,
    });
  };

  const handleMenuChange = (e) => {
    const { name, value, type, checked } = e.target;
    setMenuFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleMenuSubmit = async (e) => {
    e.preventDefault();
    try {
      const requiredFields = ['name', 'price', 'category', 'preparationTime'];
      const missingFields = requiredFields.filter(field => !menuFormData[field]);
      if (missingFields.length > 0) {
        setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
        return;
      }

      const menuItemData = {
        ...menuFormData,
        price: Number(menuFormData.price),
        preparationTime: Number(menuFormData.preparationTime),
        restaurant: restaurantId
      };

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
      setError(error.response?.data?.message || error.message || 'Menu operation failed');
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    try {
      await restaurantApi.delete(`/menu/${itemId}`);
      setSuccess('Menu item deleted successfully');
      fetchDashboardData();
    } catch (error) {
      setError(error.response?.data?.message || error.message || 'Failed to delete menu item');
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#E65100' }}>
          Restaurant Dashboard
        </Typography>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        {!hasRestaurant && (
          <Button
            variant="contained"
            startIcon={<RestaurantIcon />}
            onClick={handleOpenRestaurantDialog}
            sx={{ backgroundColor: '#E65100', '&:hover': { backgroundColor: '#BF360C' } }}
          >
            Add Restaurant
          </Button>
        )}
      </Box>

      {hasRestaurant && (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
              <Tab label="Menu Management" />
            </Tabs>
          </Box>

          {tabValue === 0 && (
            <Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenMenuDialog()}
                sx={{ mb: 3 }}
              >
                Add Menu Item
              </Button>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Price</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Available</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {menuItems.map((item) => (
                      <TableRow key={item._id}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell>Rs. {item.price}</TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          <Checkbox checked={item.isAvailable} disabled />
                        </TableCell>
                        <TableCell>
                          <IconButton onClick={() => handleOpenMenuDialog(item)}>
                            <EditIcon />
                          </IconButton>
                          <IconButton onClick={() => handleDeleteMenuItem(item._id)}>
                            <DeleteIcon color="error" />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </>
      )}

      {/* Restaurant Dialog */}
      <Dialog open={openRestaurantDialog} onClose={handleCloseRestaurantDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{hasRestaurant ? 'Update Restaurant' : 'Add New Restaurant'}</DialogTitle>
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
                label={field.label}
                name={field.name}
                value={restaurantFormData[field.name]}
                onChange={handleRestaurantChange}
                margin="normal"
                required={field.required}
                type={field.type || 'text'}
                multiline={field.multiline}
                rows={field.rows}
              />
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseRestaurantDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {hasRestaurant ? 'Update' : 'Create'} Restaurant
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Menu Item Dialog */}
      <Dialog open={openMenuDialog} onClose={handleCloseMenuDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedItem ? 'Edit Menu Item' : 'Add New Menu Item'}</DialogTitle>
        <form onSubmit={handleMenuSubmit}>
          <DialogContent>
            {[
              { name: 'name', label: 'Item Name', required: true },
              { name: 'description', label: 'Description', multiline: true, rows: 3 },
              { name: 'price', label: 'Price', required: true, type: 'number' },
              { name: 'category', label: 'Category', required: true },
              { name: 'preparationTime', label: 'Prep Time (mins)', required: true, type: 'number' },
              { name: 'image', label: 'Image URL' },
            ].map((field) => (
              <TextField
                key={field.name}
                fullWidth
                label={field.label}
                name={field.name}
                value={menuFormData[field.name]}
                onChange={handleMenuChange}
                margin="normal"
                required={field.required}
                type={field.type || 'text'}
                multiline={field.multiline}
                rows={field.rows}
              />
            ))}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
              <Checkbox
                name="isAvailable"
                checked={menuFormData.isAvailable}
                onChange={handleMenuChange}
              />
              <Typography>Available</Typography>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseMenuDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {selectedItem ? 'Update' : 'Create'} Item
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default RestaurantDashboard;