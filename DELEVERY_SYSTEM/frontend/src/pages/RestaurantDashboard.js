import React, { useState, useEffect } from 'react';
import {Container,Typography,Grid,Card,CardContent,Box,CircularProgress,Button,Dialog,DialogTitle,DialogContent,DialogActions,TextField,Alert,Tabs,Tab,} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon, Restaurant as RestaurantIcon,} from '@mui/icons-material';
import { restaurantApi } from '../utils/axios';
import { useAuth } from '../context/AuthContext';
import RestaurantMenu from './RestaurantMenu';
import RestaurantOrders from './RestaurantOrders';

const RestaurantDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({ totalOrders: 0, totalRevenue: 0, activeOrders: 0, menuItems: 0,});
  const [restaurantId, setRestaurantId] = useState(null);
  const [hasRestaurant, setHasRestaurant] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [openMenuDialog, setOpenMenuDialog] = useState(false);
  const [openRestaurantDialog, setOpenRestaurantDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [menuFormData, setMenuFormData] = useState({ name: '', description: '', price: '', category: '', image: '', isAvailable: true, preparationTime: 15,});
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
      // TODO: Implement data fetching logic
    } catch (error) {
      setError('Failed to fetch dashboard data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Loading state
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
        <CircularProgress sx={{ color: '#E65100' }} />
      </Box>
    );
  }

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        py: 6, 
        mt: 2, 
        background: 'rgba(18, 18, 18, 0.95)', 
        borderRadius: 4,
      }}
    >
      {/* Header Section */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 800, color: '#E65100' }}>
          Restaurant Dashboard
        </Typography>
        <Typography variant="subtitle1">
          Manage your restaurant and orders
        </Typography>
      </Box>

      {/* Stats Cards */}
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

      {/* Tabs Navigation */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="Menu" />
          <Tab label="Orders" />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {tabValue === 0 && <RestaurantMenu />}
      {tabValue === 1 && <RestaurantOrders />}
    </Container>
  );
};

export default RestaurantDashboard;