import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/navigation/Header';
import ProgressIndicator from '../../components/navigation/ProgressIndicator';
import OrderCard from './components/OrderCard';
import EmptyOrderHistory from './components/EmptyOrderHistory';
import LoadingState from './components/LoadingState';
import LoginModal from '../../components/modals/LoginModal';

const OrderHistory = () => {
  const { user, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      setLoading(false);
      return;
    }

    // Simulate API call to fetch order history
    const fetchOrderHistory = async () => {
      try {
        setLoading(true);
        
        // Mock order history data - In production, replace with actual API call
        // Example: const response = await axios.get(`/api/orders?email=${user?.email}`);
        const mockOrders = [
          {
            id: 'ORD-001',
            tokenNumber: 'A247',
            orderDate: new Date('2026-02-03T14:30:00')?.toISOString(),
            items: [
              { id: 1, name: 'Veg Biryani', price: 80, quantity: 2 },
              { id: 2, name: 'Paneer Tikka', price: 120, quantity: 1 },
              { id: 3, name: 'Cold Coffee', price: 50, quantity: 2 }
            ],
            totalAmount: 330,
            status: 'completed'
          },
          {
            id: 'ORD-002',
            tokenNumber: 'B156',
            orderDate: new Date('2026-02-01T12:15:00')?.toISOString(),
            items: [
              { id: 4, name: 'Masala Dosa', price: 60, quantity: 1 },
              { id: 5, name: 'Filter Coffee', price: 30, quantity: 2 }
            ],
            totalAmount: 120,
            status: 'completed'
          },
          {
            id: 'ORD-003',
            tokenNumber: 'C089',
            orderDate: new Date('2026-01-30T13:45:00')?.toISOString(),
            items: [
              { id: 6, name: 'Chole Bhature', price: 70, quantity: 1 },
              { id: 7, name: 'Lassi', price: 40, quantity: 1 },
              { id: 8, name: 'Samosa', price: 20, quantity: 3 }
            ],
            totalAmount: 170,
            status: 'completed'
          }
        ];

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setOrders(mockOrders);
      } catch (error) {
        console.error('Failed to fetch order history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderHistory();
  }, [isAuthenticated, user]);

  const handleReorder = (order) => {
    // Convert order items to cart format
    const cartItems = {};
    order?.items?.forEach(item => {
      cartItems[item?.id] = item?.quantity;
    });

    // Save to localStorage
    localStorage.setItem('canteen_cart', JSON.stringify(cartItems));

    // Navigate to menu page
    navigate('/menu-landing');
  };

  const handleLoginSuccess = (credentialResponse) => {
    login(credentialResponse);
    setShowLoginModal(false);
  };

  const handleLoginError = () => {
    console.error('Google Login Failed');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background">
        <Header hasActiveToken={false} />
        <ProgressIndicator currentStep={0} />
        
        <main className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-10">
          <div className="max-w-md mx-auto text-center">
            <h1 className="font-heading font-bold text-foreground text-2xl md:text-3xl lg:text-4xl mb-4">
              Order History
            </h1>
            <p className="text-muted-foreground text-base md:text-lg mb-6">
              Please sign in to view your order history
            </p>
          </div>
        </main>

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => {
            setShowLoginModal(false);
            navigate('/menu-landing');
          }}
          onLoginSuccess={handleLoginSuccess}
          onLoginError={handleLoginError}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header hasActiveToken={false} />
      <ProgressIndicator currentStep={0} />
      
      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 lg:py-10">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-heading font-bold text-foreground text-2xl md:text-3xl lg:text-4xl mb-2">
            Order History
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mb-6 md:mb-8">
            View your past orders and reorder your favorites
          </p>

          {loading ? (
            <LoadingState />
          ) : orders?.length === 0 ? (
            <EmptyOrderHistory />
          ) : (
            <div className="space-y-4 md:space-y-5 lg:space-y-6">
              {orders?.map((order) => (
                <OrderCard
                  key={order?.id}
                  order={order}
                  onReorder={handleReorder}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OrderHistory;