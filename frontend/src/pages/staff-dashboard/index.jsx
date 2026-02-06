import React, { useState, useEffect } from 'react';
import { vendorAPI } from '../../services/api';
import Button from '../../components/ui/Button';
import Header from '../../components/navigation/Header';

const StaffDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    fetchOrders();
    fetchDashboard();
  }, [filter]);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const statusFilter = filter === 'all' ? null : filter;
      const result = await vendorAPI.getOrders(1, 50, statusFilter);
      setOrders(result.data.orders || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDashboard = async () => {
    try {
      const result = await vendorAPI.getDashboard();
      setDashboard(result.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      await vendorAPI.updateOrderStatus(orderId, status);
      fetchOrders(); // Refresh orders
      fetchDashboard(); // Refresh stats
    } catch (err) {
      alert(err.message || 'Failed to update order status');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header hasActiveToken={false} />
      
      <main className="pt-[120px] pb-8 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              📊 Canteen Staff Dashboard
            </h1>
            <p className="text-muted-foreground">
              Manage orders and view analytics
            </p>
          </div>

          {/* Quick Stats */}
          {dashboard && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-card p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Today's Orders</p>
                <p className="text-2xl font-bold text-primary">{dashboard.today?.stats?.total || 0}</p>
              </div>
              <div className="bg-card p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Revenue</p>
                <p className="text-2xl font-bold text-green-600">₹{dashboard.today?.revenue || 0}</p>
              </div>
              <div className="bg-card p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{dashboard.active?.counts?.pending || 0}</p>
              </div>
              <div className="bg-card p-4 rounded-lg border">
                <p className="text-sm text-muted-foreground">Ready</p>
                <p className="text-2xl font-bold text-green-600">{dashboard.active?.counts?.ready || 0}</p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => window.open('/staff-verification', '_blank')}
              variant="default"
              className="bg-green-600 hover:bg-green-700"
            >
              📱 QR Verification
            </Button>
            <Button
              onClick={fetchOrders}
              variant="outline"
              disabled={isLoading}
            >
              🔄 Refresh
            </Button>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 bg-card p-2 rounded-lg border">
            {['all', 'pending', 'preparing', 'ready', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                  filter === status
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted'
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          {/* Orders List */}
          <div className="bg-card rounded-lg border">
            <div className="p-4 border-b">
              <h2 className="text-lg font-semibold">📋 Orders</h2>
            </div>
            
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                <p>Loading orders...</p>
              </div>
            ) : error ? (
              <div className="p-8 text-center text-red-600">
                ❌ {error}
              </div>
            ) : orders.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                📭 No orders found
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3">Token</th>
                      <th className="text-left p-3">Customer</th>
                      <th className="text-left p-3">Items</th>
                      <th className="text-left p-3">Amount</th>
                      <th className="text-left p-3">Status</th>
                      <th className="text-left p-3">Time</th>
                      <th className="text-left p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id} className="border-t hover:bg-muted/50">
                        <td className="p-3 font-mono font-bold">{order.token}</td>
                        <td className="p-3">{order.user_name}</td>
                        <td className="p-3 text-sm">
                          {order.items?.length} items
                        </td>
                        <td className="p-3 font-semibold">₹{order.total_amount}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="p-3 text-sm">{formatTime(order.created_at)}</td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            {order.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'preparing')}
                                className="bg-blue-600 hover:bg-blue-700 text-xs"
                              >
                                Start
                              </Button>
                            )}
                            {order.status === 'preparing' && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'ready')}
                                className="bg-green-600 hover:bg-green-700 text-xs"
                              >
                                Ready
                              </Button>
                            )}
                            {order.status === 'ready' && (
                              <Button
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, 'completed')}
                                className="bg-gray-600 hover:bg-gray-700 text-xs"
                              >
                                Complete
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffDashboard;