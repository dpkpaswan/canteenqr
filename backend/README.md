# College Canteen QR Backend

A production-ready backend API for a college canteen QR-based token ordering system built with Node.js, Express, Supabase, and Razorpay.

## 🚀 Features

- **Google OAuth Authentication** - Secure user authentication using Google OAuth
- **Razorpay Payment Integration** - Complete payment processing with test mode
- **Real-time Order Management** - Order creation, status updates, and tracking
- **Token Generation System** - Daily resetting sequential tokens (T-001, T-002, etc.)
- **Email Notifications** - Automated order confirmations and status updates
- **Vendor Dashboard APIs** - Complete order management for canteen staff
- **Find My Token** - Easy token lookup by email or phone
- **Queue Management** - Real-time queue status and wait time estimates
- **Production Ready** - Comprehensive error handling, validation, and security

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Google OAuth 2.0, JWT
- **Payments**: Razorpay (Test Mode)
- **Email**: Nodemailer
- **Validation**: Joi
- **Security**: Helmet, CORS, Rate Limiting

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account
- Google OAuth credentials
- Razorpay test account
- Gmail app password (for email notifications)

## 🏗️ Installation

1. **Clone and Setup**
   ```bash
   cd backend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   Fill in your environment variables (see Configuration section)

3. **Database Setup**
   - Create a new project in Supabase
   - Run the SQL commands provided in the console to create tables
   - Update your `.env` with Supabase credentials

4. **Start Development Server**
   ```bash
   npm run dev
   ```

## ⚙️ Configuration

### Environment Variables

Create a `.env` file with the following variables:

```env
# Server
PORT=3001
NODE_ENV=development

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id

# JWT
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_EXPIRES_IN=7d

# Razorpay (Test Mode)
RAZORPAY_KEY_ID=your_test_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret

# Email
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM="College Canteen <noreply@college.edu>"

# College Details
COLLEGE_NAME=Your College Name
CANTEEN_NAME=Main Canteen
PICKUP_LOCATION=Ground Floor, Main Building
```

### Database Schema

Execute this SQL in your Supabase SQL editor:

```sql
-- Create orders table
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  token VARCHAR(20) UNIQUE NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  items JSONB NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'preparing', 'ready', 'completed')),
  payment_id VARCHAR(255),
  payment_signature VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_orders_token ON orders(token);
CREATE INDEX idx_orders_email ON orders(user_email);
CREATE INDEX idx_orders_phone ON orders(phone);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- Enable Row Level Security (optional)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
```

## 📚 API Documentation

### Base URL
```
http://localhost:3001/api
```

### Authentication Routes (`/auth`)

#### POST `/auth/google-login`
Authenticate with Google OAuth token
```json
{
  "idToken": "google_id_token_here"
}
```

#### POST `/auth/verify-token`
Verify JWT token (Protected)

#### GET `/auth/profile`
Get user profile (Protected)

### Payment Routes (`/payments`)

#### POST `/payments/create-order`
Create Razorpay payment order (Protected)
```json
{
  "items": [
    {
      "id": "item1",
      "name": "Tea",
      "price": 15,
      "quantity": 2
    }
  ],
  "phone": "+919876543210"
}
```

#### POST `/payments/verify`
Verify payment and create order (Protected)
```json
{
  "razorpay_order_id": "order_id",
  "razorpay_payment_id": "payment_id",
  "razorpay_signature": "signature",
  "orderData": {
    "items": [...],
    "phone": "+919876543210"
  }
}
```

### Order Routes (`/orders`)

#### GET `/orders/my-orders`
Get user's orders (Protected)

#### GET `/orders/by-token/:token`
Get order by token (Public)

#### GET `/orders/active-order`
Get user's active order (Protected)

#### GET `/orders/queue-status`
Get current queue status (Public)

### Token Routes (`/tokens`)

#### POST `/tokens/find`
Find token by email or phone
```json
{
  "email": "user@example.com"
  // OR
  "phone": "+919876543210"
}
```

#### GET `/tokens/:token`
Get order details by token

### Vendor Routes (`/vendor`)

#### GET `/vendor/orders`
Get all orders with pagination

#### PATCH `/vendor/orders/:orderId/status`
Update order status
```json
{
  "status": "preparing"
}
```

#### GET `/vendor/dashboard`
Get dashboard statistics

#### GET `/vendor/orders/queue`
Get orders in queue

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Input Validation** - Comprehensive request validation with Joi
- **Rate Limiting** - Prevent API abuse
- **CORS Protection** - Configured for specific origins
- **Helmet Security** - Security headers
- **Error Handling** - Safe error responses without sensitive data

## 📊 Order Flow

1. **User Authentication** - Login with Google OAuth
2. **Order Creation** - Create Razorpay payment order
3. **Payment** - Process payment through Razorpay
4. **Verification** - Verify payment signature
5. **Token Generation** - Generate sequential daily token
6. **Order Storage** - Save order in Supabase
7. **Email Notification** - Send confirmation email
8. **Status Updates** - Vendor updates order status
9. **Pickup Notification** - Email when ready

## 🚀 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Environment Checklist
- [ ] Update `CORS_ORIGIN` for frontend domain
- [ ] Set `NODE_ENV=production`
- [ ] Use strong `JWT_SECRET`
- [ ] Enable Razorpay live mode
- [ ] Configure production email service
- [ ] Set up SSL/HTTPS
- [ ] Configure proper database security

## 🧪 Testing

### Health Check
```bash
curl http://localhost:3001/health
```

### API Testing
Use Postman collection or test with curl:
```bash
# Test auth
curl -X POST http://localhost:3001/api/auth/google-login \
  -H "Content-Type: application/json" \
  -d '{"idToken": "your_google_token"}'
```

## 🔧 Troubleshooting

### Common Issues

1. **Database Connection**
   - Verify Supabase URL and keys
   - Check network connectivity
   - Ensure tables are created

2. **Google OAuth**
   - Verify Google Client ID
   - Check OAuth configuration
   - Ensure domain is authorized

3. **Razorpay Integration**
   - Confirm test API keys
   - Check webhook configuration
   - Verify signature generation

4. **Email Service**
   - Use app passwords for Gmail
   - Check SMTP settings
   - Verify sender domain

### Logs
Check console for detailed error messages and service status.

## 📈 Monitoring

The API provides several health check endpoints:
- `/health` - Overall API health
- `/api/auth/health` - Auth service health
- `/api/vendor/health` - All services health

## 🤝 Production Deployment

For production deployment:

1. **Replace Supabase** with college database
2. **Enable Razorpay live mode**
3. **Configure domain-based CORS**
4. **Set up monitoring and logging**
5. **Implement admin authentication for vendor routes**
6. **Add database backups**
7. **Set up SSL certificates**

## 📄 License

MIT License - see LICENSE file for details

---

**Note**: This backend is designed to be production-ready after proper configuration and security review. Always perform security audits before deploying to production.