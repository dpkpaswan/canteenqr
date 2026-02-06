/**
 * Supabase database service
 * Handles all database operations for the canteen ordering system
 */

const { createClient } = require('@supabase/supabase-js');

class DatabaseService {
  constructor() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
      throw new Error('Supabase configuration missing. Please check environment variables.');
    }

    // Initialize Supabase client with service role key for backend operations
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    console.log('✅ Supabase database connection initialized');
  }

  /**
   * Initialize database tables if they don't exist
   */
  async initializeTables() {
    try {
      console.log('🔧 Checking database tables...');
      
      // Check if orders table exists
      const { data: tables, error: checkError } = await this.supabase
        .from('orders')
        .select('id')
        .limit(1);

      if (checkError && checkError.code === 'PGRST116') {
        console.log('📋 Orders table not found, creating it...');
        await this.createOrdersTable();
      } else if (checkError) {
        throw checkError;
      } else {
        console.log('✅ Orders table already exists');
      }
    } catch (error) {
      console.error('❌ Error initializing database tables:', error);
      throw error;
    }
  }

  /**
   * Create the orders table using raw SQL
   */
  async createOrdersTable() {
    // Since we can't reliably create tables via API, provide clear instructions
    const instructions = `
    Please create the orders table manually in your Supabase dashboard:
    
    1. Go to your Supabase project dashboard
    2. Navigate to SQL Editor
    3. Run the SQL from: backend/database/create_tables.sql
    
    Or manually create the table with this basic structure:
    
    CREATE TABLE orders (
      id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
      token VARCHAR(20) UNIQUE NOT NULL,
      user_name VARCHAR(255) NOT NULL,
      user_email VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      items JSONB NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending',
      payment_id VARCHAR(255),
      payment_signature VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    `;
    
    console.log('📋 Orders table creation required:');
    console.log(instructions);
    
    throw new Error('Please create the orders table manually in Supabase. Check console for instructions.');
  }

  /**
   * Helper function to check if a date is today (timezone-aware)
   * @param {string|Date} date - Date to check
   * @returns {boolean} True if date is today
   */
  isToday(date) {
    const inputDate = new Date(date);
    const today = new Date();
    
    // Convert to Asia/Kolkata timezone for consistent comparison
    const todayIndia = new Date(today.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    const inputDateIndia = new Date(inputDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
    
    return (
      inputDateIndia.getFullYear() === todayIndia.getFullYear() &&
      inputDateIndia.getMonth() === todayIndia.getMonth() &&
      inputDateIndia.getDate() === todayIndia.getDate()
    );
  }

  /**
   * Get today's date range in Asia/Kolkata timezone
   * @returns {object} Object with startOfDay and endOfDay in UTC
   */
  getTodayRange() {
    const now = new Date();
    
    // Get current date in Asia/Kolkata timezone
    const indiaDateString = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }); // YYYY-MM-DD format
    
    console.log(`🕒 Current time: ${now.toISOString()}`);
    console.log(`🕒 India date: ${indiaDateString}`);
    
    // Create start and end of day in Asia/Kolkata
    const startOfDayIST = new Date(`${indiaDateString}T00:00:00+05:30`);
    const endOfDayIST = new Date(`${indiaDateString}T23:59:59.999+05:30`);
    
    // Convert to UTC for database queries
    const result = {
      startOfDay: startOfDayIST.toISOString(),
      endOfDay: endOfDayIST.toISOString()
    };
    
    console.log(`🕒 Date range for today: ${result.startOfDay} to ${result.endOfDay}`);
    
    return result;
  }

  /**
   * Generate next sequential token for today (resets daily at 00:00 Asia/Kolkata)
   */
  async generateDailyToken() {
    try {
      const { startOfDay, endOfDay } = this.getTodayRange();
      const tokenPrefix = process.env.TOKEN_PREFIX || 'T';
      
      console.log(`🔍 Searching for tokens between ${startOfDay} and ${endOfDay}`);
      
      // Get all tokens created today, ordered by token number
      const { data: todaysOrders, error } = await this.supabase
        .from('orders')
        .select('token, created_at')
        .gte('created_at', startOfDay)
        .lte('created_at', endOfDay)
        .order('token', { ascending: true });

      if (error) {
        console.error('❌ Database error fetching today\'s tokens:', error);
        throw error;
      }

      console.log(`🔍 Found ${todaysOrders?.length || 0} existing orders today:`, 
        todaysOrders?.map(o => `${o.token} (${o.created_at})`) || []);

      // Find the next available token number
      let nextTokenNumber = 1;
      if (todaysOrders && todaysOrders.length > 0) {
        // Extract token numbers and find the next available one
        const existingNumbers = todaysOrders
          .map(order => {
            const match = order.token.match(new RegExp(`^${tokenPrefix}-(\\d+)$`));
            return match ? parseInt(match[1]) : null;
          })
          .filter(num => num !== null)
          .sort((a, b) => a - b);

        console.log(`🔍 Existing token numbers:`, existingNumbers);

        // Find first gap or next number after the highest
        for (let i = 0; i < existingNumbers.length; i++) {
          if (existingNumbers[i] !== nextTokenNumber) {
            break; // Found a gap
          }
          nextTokenNumber++;
        }
      }

      const token = `${tokenPrefix}-${String(nextTokenNumber).padStart(3, '0')}`;
      
      console.log(`📋 Generated daily token: ${token} (Today's order #${nextTokenNumber})`);
      return token;
    } catch (error) {
      console.error('❌ Error generating daily token:', error);
      throw new Error('Failed to generate daily order token');
    }
  }

  /**
   * @deprecated Use generateDailyToken() instead
   */
  async generateTodayToken() {
    return this.generateDailyToken();
  }

  /**
   * Create a new order
   */
  async createOrder(orderData) {
    try {
      const token = await this.generateDailyToken();
      
      const { data, error } = await this.supabase
        .from('orders')
        .insert([{
          token,
          user_name: orderData.user_name,
          user_email: orderData.user_email,
          phone: orderData.phone,
          items: orderData.items,
          total_amount: orderData.total_amount,
          payment_id: orderData.payment_id,
          payment_signature: orderData.payment_signature,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`✅ Order created successfully: ${token}`);
      return data;
    } catch (error) {
      console.error('❌ Error creating order:', error);
      throw new Error('Failed to create order');
    }
  }

  /**
   * Get order by ID
   */
  async getOrderById(orderId) {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('❌ Error fetching order by ID:', error);
      return null;
    }
  }

  /**
   * Get order by token with today validation
   * Enforces "Valid Only Today" rule
   */
  async getOrderByToken(token) {
    try {
      const { data, error } = await this.supabase
        .from('orders')
        .select('*')
        .eq('token', token)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (!data) {
        return null;
      }

      // Check if order is from today
      if (!this.isToday(data.created_at)) {
        throw new Error('Token expired. Valid only on order date.');
      }

      return data;
    } catch (error) {
      console.error('❌ Error fetching order by token:', error);
      if (error.message.includes('Token expired')) {
        throw error; // Re-throw token expiry errors
      }
      return null;
    }
  }

  /**
   * Validate token for pickup (enforces today-only rule)
   * @param {string} token - Order token to validate
   * @returns {object} Validation result with order data or error
   */
  async validateTokenForPickup(token) {
    try {
      const order = await this.getOrderByToken(token);
      
      if (!order) {
        return {
          valid: false,
          error: 'Token not found'
        };
      }

      // Check if order is completed
      if (order.status === 'completed') {
        return {
          valid: false,
          error: 'Order already completed'
        };
      }

      // Check if order is from today (already checked in getOrderByToken, but double-check)
      if (!this.isToday(order.created_at)) {
        return {
          valid: false,
          error: 'Token expired. Valid only on order date.'
        };
      }

      return {
        valid: true,
        order: order
      };
    } catch (error) {
      console.error('❌ Token validation error:', error);
      return {
        valid: false,
        error: error.message
      };
    }
  }

  /**
   * Update order status with date validation
   * Prevents marking orders from previous days as completed
   */
  async updateOrderStatus(orderId, newStatus) {
    try {
      // First get the order to check its date
      const order = await this.getOrderById(orderId);
      
      if (!order) {
        throw new Error('Order not found');
      }

      // If trying to mark as completed, ensure order is from today
      if (newStatus === 'completed' && !this.isToday(order.created_at)) {
        throw new Error('Cannot mark previous day orders as completed. Order must be from today.');
      }

      // Update the order status
      const { data, error } = await this.supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`✅ Order ${order.token} status updated to: ${newStatus}`);
      return data;
    } catch (error) {
      console.error('❌ Error updating order status:', error);
      throw error;
    }
  }

  /**
   * Update order status by token with date validation
   * Prevents marking orders from previous days as completed
   */
  async updateOrderStatusByToken(token, newStatus) {
    try {
      // Use the token validation which already checks today's date
      const validationResult = await this.validateTokenForPickup(token);
      
      if (!validationResult.valid) {
        throw new Error(validationResult.error);
      }

      const order = validationResult.order;

      // If trying to mark as completed, double-check it's from today
      if (newStatus === 'completed' && !this.isToday(order.created_at)) {
        throw new Error('Cannot mark previous day orders as completed. Order must be from today.');
      }

      // Update the order status
      const { data, error } = await this.supabase
        .from('orders')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('token', token)
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log(`✅ Order ${token} status updated to: ${newStatus}`);
      return data;
    } catch (error) {
      console.error('❌ Error updating order status by token:', error);
      throw error;
    }
  }

  /**
   * Find latest active order by email or phone
   */
  async findOrderByEmailOrPhone(email, phone) {
    try {
      let query = this.supabase
        .from('orders')
        .select('*')
        .in('status', ['pending', 'preparing', 'ready'])
        .order('created_at', { ascending: false })
        .limit(1);

      if (email) {
        query = query.eq('user_email', email);
      } else if (phone) {
        query = query.eq('phone', phone);
      } else {
        return null;
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return data.length > 0 ? data[0] : null;
    } catch (error) {
      console.error('❌ Error finding order:', error);
      return null;
    }
  }

  /**
   * Get all orders for vendor (with pagination)
   */
  async getVendorOrders(page = 1, limit = 50, status = null) {
    try {
      let query = this.supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: true });

      if (status) {
        query = query.eq('status', status);
      }

      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        orders: data || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      };
    } catch (error) {
      console.error('❌ Error fetching vendor orders:', error);
      throw new Error('Failed to fetch orders');
    }
  }

  /**
   * Get order statistics for today
   */
  async getTodayStats() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      // Get counts by status
      const { data: statusCounts, error } = await this.supabase
        .from('orders')
        .select('status')
        .gte('created_at', `${today}T00:00:00Z`)
        .lt('created_at', `${tomorrow}T00:00:00Z`);

      if (error) {
        throw error;
      }

      const stats = {
        total: statusCounts.length,
        pending: 0,
        preparing: 0,
        ready: 0,
        completed: 0
      };

      statusCounts.forEach(order => {
        stats[order.status] = (stats[order.status] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('❌ Error fetching today stats:', error);
      return { total: 0, pending: 0, preparing: 0, ready: 0, completed: 0 };
    }
  }
}

// Singleton instance
let databaseService = null;

function getDatabaseService() {
  if (!databaseService) {
    databaseService = new DatabaseService();
  }
  return databaseService;
}

module.exports = {
  DatabaseService,
  getDatabaseService
};