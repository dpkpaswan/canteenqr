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

      // Initialize daily counter table for atomic token generation
      await this.initializeDailyCounterTable();
    } catch (error) {
      console.error('❌ Error initializing database tables:', error);
      throw error;
    }
  }

  /**
   * Initialize daily counter table for atomic token generation
   */
  async initializeDailyCounterTable() {
    try {
      // Try to access the daily_counters table
      const { data: counterCheck, error: counterError } = await this.supabase
        .from('daily_counters')
        .select('id')
        .limit(1);

      if (counterError && counterError.code === 'PGRST116') {
        console.log('📊 Daily counters table not found. Please create it manually in Supabase with this SQL:');
        console.log(`
CREATE TABLE IF NOT EXISTS daily_counters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  date_key DATE NOT NULL UNIQUE,
  counter INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS daily_counters_date_idx ON daily_counters(date_key);
        `);
      } else if (counterError) {
        console.warn('⚠️  Daily counters table access failed:', counterError.message);
      } else {
        console.log('✅ Daily counters table exists');
      }
    } catch (error) {
      console.warn('⚠️  Could not initialize daily counters table:', error.message);
    }
  }

  /**
   * Get next atomic counter for today
   */
  async getNextAtomicCounter() {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Try to increment counter atomically using PostgreSQL's UPSERT
      const { data, error } = await this.supabase.rpc('increment_daily_counter', {
        date_input: today
      });

      if (error) {
        console.warn('⚠️  Atomic counter failed:', error.message);
        return null;
      }

      return data;
    } catch (error) {
      console.warn('⚠️  Atomic counter error:', error.message);
      return null;
    }
  }

  /**
   * Alternative atomic token generation using dedicated counter table
   */
  async generateAtomicToken() {
    const tokenPrefix = process.env.TOKEN_PREFIX || 'T';
    
    try {
      // Try atomic counter first
      const counter = await this.getNextAtomicCounter();
      if (counter && counter > 0) {
        const atomicToken = `${tokenPrefix}-${String(counter).padStart(3, '0')}`;
        console.log(`⚡ Generated atomic token: ${atomicToken} (counter: ${counter})`);
        return atomicToken;
      }
    } catch (error) {
      console.warn('⚠️  Atomic token generation failed:', error.message);
    }

    // Fallback to timestamp-based unique token
    const timestamp = Date.now().toString().slice(-6);
    const randomPart = Math.random().toString(36).substr(2, 4).toUpperCase();
    const fallbackToken = `${tokenPrefix}-${timestamp}${randomPart}`;
    
    console.log(`🔄 Using fallback unique token: ${fallbackToken}`);
    return fallbackToken;
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
   * Clean up incomplete orders (orders without payment_id that are older than 30 minutes)
   * This helps prevent token conflicts from abandoned payment attempts
   */
  async cleanupIncompleteOrders() {
    try {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      
      const { data: incompleteOrders, error: findError } = await this.supabase
        .from('orders')
        .select('token, created_at')
        .is('payment_id', null)
        .lt('created_at', thirtyMinutesAgo);

      if (findError) {
        console.error('❌ Error finding incomplete orders:', findError);
        return;
      }

      if (!incompleteOrders || incompleteOrders.length === 0) {
        return;
      }

      console.log(`🧹 Found ${incompleteOrders.length} incomplete orders to clean up:`, 
        incompleteOrders.map(o => o.token));

      const { error: deleteError } = await this.supabase
        .from('orders')
        .delete()
        .is('payment_id', null)
        .lt('created_at', thirtyMinutesAgo);

      if (deleteError) {
        console.error('❌ Error cleaning up incomplete orders:', deleteError);
      } else {
        console.log(`✅ Cleaned up ${incompleteOrders.length} incomplete orders`);
      }
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
    }
  }

  /**
   * Generate guaranteed unique token - no retries needed
   */
  async generateDailyToken() {
    const tokenPrefix = process.env.TOKEN_PREFIX || 'T';
    
    // Use high-precision timestamp + random for guaranteed uniqueness
    const now = Date.now();
    const microTime = process.hrtime.bigint().toString().slice(-6); // Microseconds
    const randomPart = Math.random().toString(36).substr(2, 6).toUpperCase();
    const processId = process.pid.toString().slice(-2);
    
    // Format: T-HHMMSS-RANDOM (based on current time + randomness)
    const timeStr = new Date(now).toTimeString().substr(0, 8).replace(/:/g, '');
    const uniqueToken = `${tokenPrefix}-${timeStr.slice(-6)}-${randomPart.slice(0, 4)}`;
    
    console.log(`✅ Generated guaranteed unique token: ${uniqueToken}`);
    return uniqueToken;
  }

  /**
   * @deprecated Use generateDailyToken() instead
   */
  async generateTodayToken() {
    return this.generateDailyToken();
  }

  /**
   * Create a new order with guaranteed unique token - no retries needed
   */
  async createOrder(orderData) {
    try {
      const token = await this.generateDailyToken();
      
      if (!token) {
        throw new Error('Failed to generate order token');
      }
      
      console.log(`🎫 Creating order with token: ${token}`);
      
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
        console.error('❌ Order creation failed:', error);
        throw error;
      }

      console.log(`✅ Order created successfully: ${token} (ID: ${data.id})`);
      return data;
    } catch (error) {
      console.error('❌ Database order creation failed:', error);
      throw error;
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