import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  IconButton,
  Divider,
  CircularProgress,
  Alert,
  Chip,
  Rating
} from '@mui/material';
import { Add as AddIcon, Remove as RemoveIcon, ShoppingCart as CartIcon } from '@mui/icons-material';
import { restaurantApi, orderApi } from '../utils/axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);


const DELIVERY_FEE = 50; // Fixed delivery fee of Rs50

const RestaurantDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [cart, setCart] = useState([]);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);
  const [orderForm, setOrderForm] = useState({
    deliveryAddress: localStorage.getItem('lastDeliveryAddress') || '',
    paymentMethod: 'cash',
    notes: '',
  });
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentIntent, setPaymentIntent] = useState(null);

  useEffect(() => {
    if (!id) {
      setError('Restaurant ID is required');
      setLoading(false);
      return;
    }
    fetchRestaurantData();
  }, [id]);

  const fetchRestaurantData = async () => {
    try {
      console.log('Fetching restaurant data for ID:', id);
      const [restaurantRes, menuRes] = await Promise.all([
        restaurantApi.get(`/restaurants/${id}`),
        restaurantApi.get(`/restaurants/${id}/menu`),
      ]);

      setRestaurant(restaurantRes.data);
      setMenuItems(menuRes.data);
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      setError('Failed to fetch restaurant data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((cartItem) => cartItem.menuItemId === item._id);
      if (existingItem) {
        return prevCart.map((cartItem) =>
          cartItem.menuItemId === item._id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prevCart, { 
        menuItemId: item._id, 
        quantity: 1, 
        price: item.price,
        name: item.name,
        image: item.image,
        restaurantId: id,
        restaurantName: restaurant.name
      }];
    });
  };

  const handleRemoveFromCart = (itemId) => {
    setCart((prevCart) => prevCart.filter((item) => item.menuItemId !== itemId));
  };

  const handleUpdateQuantity = (itemId, newQuantity) => {
    console.log('Updating quantity for item:', itemId, 'to:', newQuantity);
    if (newQuantity < 1) {
      handleRemoveFromCart(itemId);
      return;
    }
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.menuItemId === itemId);
      if (existingItem) {
        return prevCart.map((item) =>
          item.menuItemId === itemId ? { ...item, quantity: newQuantity } : item
        );
      } else {
        const menuItem = menuItems.find((item) => item._id === itemId);
        if (menuItem) {
          return [...prevCart, { menuItemId: itemId, quantity: newQuantity, price: menuItem.price }];
        }
      }
      return prevCart;
    });
  };

  // Calculate subtotal and total
  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalAmount = subtotal + DELIVERY_FEE;

  const handlePlaceOrder = async () => {
    try {
      if (!id) {
        setError('Restaurant ID is missing');
        return;
      }

      if (!user) {
        setError('Please login to place an order');
        return;
      }

      if (cart.length === 0) {
        setError('Your cart is empty');
        return;
      }

      if (!orderForm.deliveryAddress) {
        setError('Please enter delivery address');
        return;
      }

      // Save the delivery address to localStorage for future use
      localStorage.setItem('lastDeliveryAddress', orderForm.deliveryAddress);

      const orderData = {
        restaurantId: restaurant._id,
        items: cart.map(item => ({
          menuItem: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions || ''
        })),
        totalAmount,
        deliveryFee: DELIVERY_FEE,
        deliveryAddress: orderForm.deliveryAddress,
        paymentMethod: orderForm.paymentMethod,
        notes: orderForm.notes
      };

      console.log('Placing order with data:', orderData);
      
      const response = await orderApi.post('/orders', orderData);
      console.log('Order response:', response.data);

      if (orderForm.paymentMethod === 'card') {
        // For card payments, show payment form
        setPaymentIntent(response.data.paymentIntent);
        // Don't close dialog yet - wait for payment completion
      } else {
        // For cash payments, clear cart and show success
        setSuccess('Order placed successfully!');
        setCart([]);
        localStorage.removeItem('cart');
        setOpenOrderDialog(false);
      }
    } catch (error) {
      console.error('Error placing order:', error);
      setError(error.response?.data?.message || 'Failed to place order');
    }
  };

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (cart.length > 0) {
      localStorage.setItem('cart', JSON.stringify(cart));
    }
  }, [cart]);

  // Load cart from localStorage on component mount
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      // Only load cart if it's from the same restaurant
      if (parsedCart.length > 0 && parsedCart[0].restaurantId === id) {
        setCart(parsedCart);
      }
    }
  }, [id]);

  // Payment form component
  const PaymentForm = ({ paymentIntent, onSuccess, onError }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);

    const handleSubmit = async (event) => {
      event.preventDefault();
      
      if (!stripe || !elements) {
        return;
      }

      setProcessing(true);

      try {
        const { error, paymentIntent: confirmedPayment } = await stripe.confirmCardPayment(
          paymentIntent.clientSecret,
          {
            payment_method: {
              card: elements.getElement(CardElement),
            },
          }
        );

        if (error) {
          onError(error.message);
        } else {
          onSuccess(confirmedPayment);
        }
      } catch (err) {
        onError('Payment processing failed');
      } finally {
        setProcessing(false);
      }
    };

    return (
      <form onSubmit={handleSubmit}>
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#424770',
              '::placeholder': {
                color: '#aab7c4',
              },
            },
            invalid: {
              color: '#9e2146',
            },
          },
        }} />
        <Button
          type="submit"
          variant="contained"
          color="primary"
          fullWidth
          disabled={!stripe || processing}
          sx={{ mt: 2 }}
        >
          {processing ? <CircularProgress size={24} /> : 'Pay Now'}
        </Button>
      </form>
    );
  };

  // Add payment handling functions
  const handlePaymentSuccess = async (confirmedPayment) => {
    setSuccess('Payment successful! Order placed.');
    setCart([]);
    localStorage.removeItem('cart');
    setOpenOrderDialog(false);
  };

  const handlePaymentError = (errorMessage) => {
    setError(`Payment failed: ${errorMessage}`);
  };

  // Add this function to handle checkout
  const handleCheckout = async () => {
    try {
      // Create order first
      const orderResponse = await orderApi.post('/orders', {
        restaurantId: restaurant._id,
        items: cart.map(item => ({
          menuItem: item.menuItemId,
          quantity: item.quantity,
          price: item.price,
          specialInstructions: item.specialInstructions || ''
        })),
        totalAmount,
        deliveryFee: DELIVERY_FEE,
        deliveryAddress: orderForm.deliveryAddress,
        paymentMethod: 'card',
        notes: orderForm.notes
      });

      // Create checkout session
      const checkoutResponse = await axios.post(
        `${process.env.REACT_APP_PAYMENT_SERVICE_URL}/api/payments/create-checkout-session`,
        {
          orderId: orderResponse.data.order._id,
          items: cart.map(item => ({
            name: item.name,
            quantity: item.quantity,
            amount: item.price * 100, // Convert to smallest currency unit
            currency: 'inr'
          })),
          successUrl: `${window.location.origin}/order-success?orderId=${orderResponse.data.order._id}`,
          cancelUrl: `${window.location.origin}/order-failed?orderId=${orderResponse.data.order._id}`
        },
        {
          headers: { Authorization: `Bearer ${user.token}` }
        }
      );

      // Redirect to Stripe Checkout
      const stripe = await loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
      await stripe.redirectToCheckout({
        sessionId: checkoutResponse.data.sessionId
      });

    } catch (error) {
      console.error('Checkout error:', error);
      setError(error.response?.data?.message || 'Failed to initiate checkout');
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

  if (!restaurant) {
    return (
      <Container>
        <Alert severity="error">Restaurant not found</Alert>
      </Container>
    );
  }

};

export default RestaurantDetail; 