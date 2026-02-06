# Frontend-Backend Integration Guide

## 🚀 Quick Setup

### 1. Environment Configuration

Update your `.env` file with the correct values:

```bash
# Backend API Configuration
VITE_API_BASE_URL=http://localhost:3001/api

# Google OAuth Configuration
# Get this from Google Cloud Console -> APIs & Services -> Credentials
VITE_GOOGLE_CLIENT_ID=your-actual-google-client-id-here

# Razorpay Configuration (Public Key)
VITE_RAZORPAY_KEY_ID=rzp_test_SC5XQGAiUbZEvl
```

### 2. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Go to **APIs & Services > Credentials**
5. Click **Create Credentials > OAuth 2.0 Client IDs**
6. Set Application type to **Web application**
7. Add authorized JavaScript origins:
   - `http://localhost:5173` (Vite dev server)
   - `http://127.0.0.1:5173`
8. Add authorized redirect URIs:
   - `http://localhost:5173`
   - `http://127.0.0.1:5173`
9. Copy the **Client ID** and paste it in your `.env` file as `VITE_GOOGLE_CLIENT_ID`

### 3. Start Both Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend  
npm start
```

## 🔧 Integration Features

### Authentication
- ✅ Google OAuth integration with backend verification
- ✅ JWT token management
- ✅ Automatic token refresh
- ✅ User session persistence

### Payment Processing
- ✅ Razorpay integration with backend
- ✅ Order creation and tracking
- ✅ Payment verification
- ✅ Token generation

### API Integration
- ✅ Centralized API service layer
- ✅ React hooks for easy data fetching
- ✅ Error handling and loading states
- ✅ Authentication headers automatic injection

## 📁 New Files Added

1. **`src/services/api.js`** - Centralized API service
2. **`src/hooks/useApi.js`** - React hooks for API calls
3. **`src/components/RazorpayPayment.jsx`** - Payment component
4. **`src/components/GoogleOAuthLogin.jsx`** - Google auth component
5. **`.env.example`** - Environment configuration template

## 🔄 Updated Files

1. **`src/context/AuthContext.jsx`** - Backend integration
2. **`src/components/modals/LoginModal.jsx`** - New auth flow
3. **`src/components/navigation/Header.jsx`** - Updated auth UI

## 🧪 Testing the Integration

### 1. Authentication Flow
1. Open http://localhost:5173
2. Click "Sign in with Google"
3. Complete Google OAuth
4. Check browser dev tools for JWT token in cookies

### 2. Menu Loading
1. Navigate to menu page
2. Menu items should load from backend API
3. Check Network tab for API calls

### 3. Order Flow
1. Add items to cart
2. Proceed to checkout
3. Complete payment with test Razorpay
4. Verify order creation and token generation

## 🚨 Troubleshooting

### Backend Not Starting
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm start
```

### Frontend Not Connecting
1. Check `.env` file has correct `VITE_API_BASE_URL`
2. Ensure backend is running on port 3001
3. Check browser console for CORS errors

### Google OAuth Not Working
1. Verify `VITE_GOOGLE_CLIENT_ID` is correct
2. Check JavaScript origins in Google Console
3. Clear browser cache and cookies

### Payment Errors
1. Ensure Razorpay test keys are correct
2. Check backend logs for payment verification errors
3. Verify webhook endpoints if using production

## 📊 API Endpoints Available

### Authentication
- `POST /api/auth/login` - Google OAuth login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/verify` - Verify token
- `GET /api/auth/profile` - Get user profile

### Menu
- `GET /api/menu/items` - Get menu items
- `GET /api/menu/categories` - Get categories

### Orders
- `POST /api/orders/create` - Create order
- `GET /api/orders/history` - Get user orders
- `GET /api/orders/:id` - Get order details
- `POST /api/orders/:id/cancel` - Cancel order

### Payments
- `POST /api/payments/create` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment

### Tokens
- `GET /api/tokens/find` - Find token by phone
- `GET /api/tokens/my-tokens` - Get user tokens

## 🎯 Next Steps

1. **Complete Google OAuth setup** with your actual Client ID
2. **Test the complete flow** from menu browsing to payment
3. **Customize the UI** to match your design preferences
4. **Add error boundaries** for better error handling
5. **Implement offline support** for better UX
6. **Add push notifications** for order updates
7. **Setup analytics** tracking for user behavior

## 🔒 Security Notes

- Never commit `.env` files to version control
- Use HTTPS in production
- Rotate API keys regularly
- Implement rate limiting in production
- Add input validation on frontend
- Use environment variables for all sensitive data

## 📞 Support

If you encounter any issues:
1. Check the browser console for errors
2. Check backend logs for API errors
3. Verify all environment variables are set
4. Ensure both servers are running
5. Clear browser cache and cookies

Happy coding! 🎉