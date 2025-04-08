import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  IconButton,
  TextField,
  Box,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
} from '@mui/material';
import {
  Add as AddIcon,
  Remove as RemoveIcon,
  Delete as DeleteIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';
import axios from 'axios';

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [orderForm, setOrderForm] = useState({
    deliveryAddress: localStorage.getItem('lastDeliveryAddress') || '',
    paymentMethod: 'cash',
    notes: '',
  });
  const navigate = useNavigate();
  const theme = useTheme();

  useEffect(() => {
    // Load cart from localStorage
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }
  }, []);

  const handleQuantityChange = (itemId, newQuantity) => {
    if (newQuantity < 1) {
      handleRemoveItem(itemId);
      return;
    }
    setCart(prevCart => {
      const updatedCart = prevCart.map(item => 
        item.menuItemId === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      );
      // Save to localStorage after update
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      return updatedCart;
    });
  };

};

export default Cart; 