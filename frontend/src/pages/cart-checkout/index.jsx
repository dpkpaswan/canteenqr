import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/navigation/Header';
import ProgressIndicator from '../../components/navigation/ProgressIndicator';
import CartItem from './components/CartItem';
import OrderSummary from './components/OrderSummary';
import StudentDetailsForm from './components/StudentDetailsForm';
import PaymentSection from './components/PaymentSection';
import EmptyCart from './components/EmptyCart';
import LoginModal from '../../components/modals/LoginModal';
import RazorpayPayment from '../../components/RazorpayPayment';

const CartCheckout = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, login } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [cartItems, setCartItems] = useState([
    {
      id: "1",
      name: 'Masala Dosa',
      price: 60,
      quantity: 2
    },
    {
      id: "2", 
      name: 'Idli Sambar',
      price: 40,
      quantity: 1
    },
    {
      id: "3",
      name: 'Vada Pav',
      price: 25,
      quantity: 3
    }
  ]);

  const [formData, setFormData] = useState({
    name: '',
    phone: ''
  });

  const [errors, setErrors] = useState({
    name: '',
    phone: ''
  });

  const [isProcessing, setIsProcessing] = useState(false);

  // Mock menu data (same as in menu-landing page)
  const mockMenuData = [
    { id: 1, name: "Masala Dosa", price: 45, category: "South Indian" },
    { id: 2, name: "Paneer Butter Masala", price: 85, category: "Main Course" },
    { id: 3, name: "Veg Biryani", price: 70, category: "Rice & Biryani" },
    { id: 4, name: "Samosa (2 pcs)", price: 20, category: "Snacks" },
    { id: 5, name: "Chole Bhature", price: 60, category: "North Indian" },
    { id: 6, name: "Idli Sambar (3 pcs)", price: 35, category: "South Indian" },
    { id: 7, name: "Veg Fried Rice", price: 65, category: "Rice & Biryani" },
    { id: 8, name: "Dal Tadka", price: 40, category: "Dal & Curry" },
    { id: 9, name: "Aloo Paratha", price: 30, category: "North Indian" },
    { id: 10, name: "Veg Sandwich", price: 25, category: "Snacks" }
  ];

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('canteen_cart');
    if (savedCart) {
      try {
        const cartData = JSON.parse(savedCart);
        // Convert cart object to array format with actual menu item details
        const items = Object.entries(cartData)?.map(([id, quantity]) => {
          const menuItem = mockMenuData.find(item => item.id === parseInt(id));
          return {
            id: String(id),
            name: menuItem?.name || `Item ${id}`, // Use actual menu item name
            price: menuItem?.price || 50, // Use actual menu item price
            quantity: Number(quantity)
          };
        });
        if (items?.length > 0) {
          setCartItems(items);
        }
      } catch (error) {
        console.error('Failed to parse cart:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      setFormData(prev => ({
        ...prev,
        name: user?.name || '',
        email: user?.email || ''
      }));
      console.log('✅ User authenticated in cart:', { isAuthenticated, user: user?.email });
    } else {
      console.log('❌ User not authenticated in cart:', { isAuthenticated, user });
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleUpdateQuantity = (itemId, newQuantity) => {
    setCartItems(prevItems =>
      prevItems?.map(item =>
        item?.id === itemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const handleRemoveItem = (itemId) => {
    setCartItems(prevItems => prevItems?.filter(item => item?.id !== itemId));
  };

  const handleFormChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    console.log('📋 Validating form data:', formData);

    if (!isAuthenticated) {
      if (!formData?.name?.trim()) {
        newErrors.name = 'Full name is required';
        isValid = false;
      } else if (formData?.name?.trim()?.length < 3) {
        newErrors.name = 'Name must be at least 3 characters';
        isValid = false;
      }
    }

    if (!formData?.phone) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (formData?.phone?.length !== 10) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
      isValid = false;
    } else if (!/^[6-9]\d{9}$/?.test(formData?.phone)) {
      newErrors.phone = 'Please enter a valid Indian mobile number';
      isValid = false;
    }

    console.log('✅ Form validation result:', { isValid, errors: newErrors });
    setErrors(newErrors);
    return isValid;
  };

  const handleProceedToPayment = async () => {
    // Show login modal if not authenticated
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!validateForm()) {
      return;
    }

    // Show loading state and trigger payment
    setIsProcessing(true);
    setShowPayment(true);
  };

  const handlePaymentSuccess = (paymentData) => {
    console.log('✅ Payment successful:', paymentData);
    
    // Generate order reference and store order data
    const orderReference = `ORD-${Date.now()}`;
    localStorage.setItem('order_reference', orderReference);
    localStorage.setItem('order_user_email', user?.email || '');
    localStorage.setItem('order_amount', calculateTotal());
    localStorage.setItem('order_items', JSON.stringify(cartItems));
    localStorage.setItem('payment_id', paymentData.razorpay_payment_id);
    
    // Clear cart after successful payment
    localStorage.removeItem('canteen_cart');
    
    // Navigate to success page and clear states
    setShowPayment(false);
    setIsProcessing(false);
    navigate('/order-success-token');
  };

  const handlePaymentFailure = (error) => {
    console.error('❌ Payment failed:', error);
    setShowPayment(false);
    setIsProcessing(false);
    // You can show an error message here
  };

  const calculateTotal = () => {
    return cartItems?.reduce((total, item) => total + (item?.price * item?.quantity), 0) || 0;
  };

  const prepareOrderData = () => {
    const orderData = {
      items: cartItems.map(item => ({
        id: String(item.id), // Ensure ID is string
        name: item.name,
        price: Number(item.price),
        quantity: Number(item.quantity)
      })),
      phone: formData.phone // Phone as direct field, not nested
    };
    
    console.log('📦 Prepared order data:', orderData);
    return orderData;
  };

  const handleLoginSuccess = (credentialResponse) => {
    login(credentialResponse);
    setShowLoginModal(false);
  };

  const isFormValid = formData?.name?.trim()?.length >= 3 && formData?.phone?.length === 10;

  if (cartItems?.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <ProgressIndicator />
        <main className="pt-[60px] md:pt-[80px]">
          <EmptyCart />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <ProgressIndicator />
      <main className="pt-[120px] md:pt-[140px] pb-8 md:pb-12 lg:pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 md:mb-8 lg:mb-10">
            <h1 className="font-heading font-bold text-foreground text-2xl md:text-3xl lg:text-4xl mb-2 md:mb-3">
              Review Your Order
            </h1>
            <p className="text-muted-foreground text-sm md:text-base lg:text-lg">
              Complete your details and proceed to payment
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
            <div className="lg:col-span-2 space-y-4 md:space-y-5 lg:space-y-6">
              <div className="space-y-3 md:space-y-4">
                {cartItems?.map(item => (
                  <CartItem
                    key={item?.id}
                    item={item}
                    onUpdateQuantity={handleUpdateQuantity}
                    onRemove={handleRemoveItem}
                  />
                ))}
              </div>

              <StudentDetailsForm
                formData={formData}
                errors={errors}
                onChange={handleFormChange}
              />
            </div>

            <div className="lg:col-span-1 space-y-4 md:space-y-5 lg:space-y-6">
              <OrderSummary items={cartItems} />
              
              <PaymentSection
                onProceedToPayment={handleProceedToPayment}
                isProcessing={isProcessing}
                isFormValid={isFormValid}
                isAuthenticated={isAuthenticated}
              />
            </div>
          </div>
        </div>
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {showPayment && (
        <>
          {/* Payment loading overlay */}
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Initializing payment...</p>
                <button 
                  onClick={() => {
                    setShowPayment(false);
                    setIsProcessing(false);
                  }}
                  className="mt-4 text-sm text-gray-500 hover:text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
          
          <RazorpayPayment
            orderData={prepareOrderData()}
            userInfo={{
              name: formData.name || user?.name,
              email: user?.email,
              phone: formData.phone
            }}
            onSuccess={handlePaymentSuccess}
            onFailure={handlePaymentFailure}
            onClose={() => {
              setShowPayment(false);
              setIsProcessing(false);
            }}
            autoTrigger={true}
          />
        </>
      )}
    </div>
  );
};

export default CartCheckout;