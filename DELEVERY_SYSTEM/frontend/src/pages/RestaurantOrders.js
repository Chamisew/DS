import React, { useState, useEffect } from 'react';
import {
  Box,
  CircularProgress,
  Container
} from '@mui/material';
import { useAuth } from '../context/AuthContext';

const RestaurantOrders = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role === 'restaurant') {
      // Will implement data fetching later
      setLoading(false);
    }
  }, [user]);

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
      {/* Basic structure - will be implemented in subsequent commits */}
      <Box>
        <Typography variant="h4">
          Orders
        </Typography>
        <Typography>
          Manage and track your restaurant orders
        </Typography>
      </Box>
    </Container>
  );
};

export default RestaurantOrders;