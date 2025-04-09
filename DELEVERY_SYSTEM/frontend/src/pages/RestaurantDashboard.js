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
  const [openRestaurantDialog, setOpenRestaurantDialog] = useState(false);
 
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
      let restaurant;
      try {
        console.log('Fetching or creating restaurant...');
      const restaurantResponse = await restaurantApi.get('/restaurants/me');
        console.log('Restaurant response:', restaurantResponse.data);
        
        if (!restaurantResponse.data || !restaurantResponse.data._id) {
          throw new Error('Failed to get or create restaurant');
        }restaurant = restaurantResponse.data;
        const restaurantId = restaurant._id;
        setHasRestaurant(true); 
        if (!restaurantId) {
          throw new Error('Restaurant ID is not valid');
        }setRestaurantId(restaurantId); 
        console.log('Got restaurant with ID:', restaurantId);
        try {
          console.log('Fetching dashboard data for restaurant:', restaurantId);
      const [statsRes, menuRes, ordersRes] = await Promise.all([
            restaurantApi.get(`/restaurants/${restaurantId}/stats`),
            restaurantApi.get(`/restaurants/${restaurantId}/menu`),
            restaurantApi.get(`/restaurants/${restaurantId}/orders`)
          ]); 
          console.log('Dashboard data responses:', {
            stats: statsRes.data,
            menuItems: menuRes.data,
            orders: ordersRes.data });
          if (!statsRes.data) {
            throw new Error('Invalid stats data received from server');
          }
          const formattedStats = {
            totalOrders: statsRes.data.totalOrders || 0, totalRevenue: statsRes.data.totalRevenue || 0,
            activeOrders: statsRes.data.activeOrders || 0, menuItems: statsRes.data.menuItems || 0
          };
          console.log('Formatted stats:', formattedStats);
          console.log('Menu items:', menuRes.data || []);
          console.log('Orders:', ordersRes.data || []);
  
          setStats(formattedStats);
          setMenuItems(menuRes.data || []);
          setOrders(ordersRes.data || []);
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
          console.error('Error details:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
          });
          
          if (error.response?.status === 401) {
            setError('Authentication failed. Please log in again.');
          } else if (error.response?.status === 403) {
            setError('Access denied. You do not have permission to view this data.');
          } else if (error.response?.status === 404) {
            setError('Restaurant not found. Please create a restaurant first.');
          } else if (error.response?.status === 400) {
            setError(`Invalid request: ${error.response.data.message}`);
          } else {
            setError(`Failed to fetch dashboard data: ${error.response?.data?.message || error.message}`);
          }
        }
      } catch (error) {
        console.error('Error with restaurant:', error);
        setError('Failed to get or create restaurant. Please try again.');
      }
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
      setError(`Failed to fetch dashboard data: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenRestaurantDialog = () => {
    setOpenRestaurantDialog(true);
  };

  
 
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
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
        <CircularProgress sx={{ color: '#E65100' }} />
      </Box>
    );
  }

  return (
    <Container 
      maxWidth="lg" 
      sx={{ py: 6, mt: 2, background: 'rgba(18, 18, 18, 0.95)', backdropFilter: 'blur(20px)', borderRadius: 4, boxShadow: `0 8px 32px rgba(0, 0, 0, 0.3)`, border: `1px solid rgba(255, 255, 255, 0.1)`, position: 'relative', overflow: 'hidden',
        '&::before': { content: '""', position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: '#E65100', opacity: 0.8, },}}
        >
      <Box sx={{ mb: 6 }}>
        <Typography variant="h4" gutterBottom
          sx={{fontWeight: 800, color: '#E65100', textAlign: 'center', letterSpacing: '1px', position: 'relative',textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
           '&::after': {content: '""',position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)', width: '60px', height: '4px', background: '#E65100', borderRadius: '2px',boxShadow: '0 2px 4px rgba(230, 81, 0, 0.3)', },}}
        >
          Restaurant Dashboard
        </Typography>
        <Typography 
          variant="subtitle1" 
          sx={{ textAlign: 'center', color: 'rgba(255, 255, 255, 0.9)',mt: 2,fontWeight: 500,letterSpacing: '0.5px',
          }}
        >
          Manage your restaurant and orders
        </Typography>
      </Box>

      {error && (
        <Alert 
          severity="error" 
          sx={{ mb: 3,borderRadius: 2, boxShadow: `0 4px 12px rgba(244, 67, 54, 0.4)`,background: 'rgba(30, 30, 30, 0.95)',backdropFilter: 'blur(10px)', border: `1px solid rgba(255, 255, 255, 0.1)`,
            '& .MuiAlert-icon': { color: '#f44336',},
            '& .MuiAlert-message': { color: 'rgba(255, 255, 255, 0.95)',fontWeight: 500, }, }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert 
          severity="success" 
          sx={{ mb: 3,borderRadius: 2,boxShadow: `0 4px 12px rgba(76, 175, 80, 0.4)`,background: 'rgba(30, 30, 30, 0.95)',backdropFilter: 'blur(10px)',border: `1px solid rgba(255, 255, 255, 0.1)`,
            '& .MuiAlert-icon': { color: '#4CAF50',},
            '& .MuiAlert-message': {color: 'rgba(255, 255, 255, 0.95)',fontWeight: 500,},}}>
          {success}
        </Alert>
      )}

      <Box sx={{ mb: 4 }}>
        <Button
          variant="contained"
          startIcon={<RestaurantIcon />}
          onClick={handleOpenRestaurantDialog}
          disabled={hasRestaurant}
          sx={{backgroundColor: '#E65100',color: 'rgba(255, 255, 255, 0.95)',fontWeight: 600,letterSpacing: '0.5px',textTransform: 'none',padding: '10px 24px', borderRadius: 2,
            boxShadow: '0 4px 12px rgba(230, 81, 0, 0.3)',
            '&:hover': {backgroundColor: '#BF360C',boxShadow: '0 6px 16px rgba(230, 81, 0, 0.4)',},
            '&.Mui-disabled': {backgroundColor: 'rgba(230, 81, 0, 0.3)',color: 'rgba(255, 255, 255, 0.5)',},
          }}>
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
            <Card
              sx={{background: 'rgba(30, 30, 30, 0.95)',backdropFilter: 'blur(10px)',border: `1px solid rgba(255, 255, 255, 0.1)`,borderRadius: 3,transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': { transform: 'translateY(-6px) scale(1.01)', boxShadow: `0 12px 28px rgba(230, 81, 0, 0.2)`, background: 'rgba(40, 40, 40, 0.95)',},}}>
              <CardContent>
                <Typography 
                  sx={{ color: 'rgba(255, 255, 255, 0.9)',mb: 1,fontWeight: 500,letterSpacing: '0.5px',}}>
                  {stat.label}
                </Typography>
                <Typography 
                  variant="h4"
                  sx={{ color: '#E65100',fontWeight: 700,textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)', }}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <Box 
        sx={{ borderBottom: 1, borderColor: 'rgba(255, 255, 255, 0.1)',mb: 3,}}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{ '& .MuiTab-root': {color: 'rgba(255, 255, 255, 0.8)',fontWeight: 500,letterSpacing: '0.5px',textTransform: 'none','&.Mui-selected': {color: '#E65100',  fontWeight: 600, },
            },
            '& .MuiTabs-indicator': { backgroundColor: '#E65100', height: '3px',},
          }}>
          <Tab label="Menu" />
          <Tab label="Orders" />
        </Tabs>
      </Box>

      {tabValue === 0 && <RestaurantMenu />}
      {tabValue === 1 && <RestaurantOrders />}

      
    </Container>
  );
};

export default RestaurantDashboard; 