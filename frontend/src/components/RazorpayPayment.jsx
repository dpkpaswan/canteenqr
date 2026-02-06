/**
 * Razorpay Payment Integration Component
 * Handles payment processing with the backend
 */

import React, { useEffect, useState } from 'react';
import { usePayment } from '../hooks/useApi';

// Load Razorpay script dynamically
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const RazorpayPayment = ({
  orderData,
  userInfo,
  onSuccess,
  onFailure,
  onClose,
  disabled = false,
  children,
  className = '',
  autoTrigger = false, // New prop to auto-trigger payment
}) => {
  const { paymentConfig, fetchPaymentConfig, createPaymentOrder, verifyPayment, loading } = usePayment();
  const [razorpayLoaded, setRazorpayLoaded] = useState(false);
  const [paymentTriggered, setPaymentTriggered] = useState(false);

  // Load Razorpay script and payment config on mount
  useEffect(() => {
    const initializePayment = async () => {
      const scriptLoaded = await loadRazorpayScript();
      setRazorpayLoaded(scriptLoaded);
      
      if (!paymentConfig) {
        await fetchPaymentConfig();
      }
    };

    initializePayment();
  }, [paymentConfig, fetchPaymentConfig]);

  // Auto-trigger payment when ready
  useEffect(() => {
    if (autoTrigger && razorpayLoaded && paymentConfig && !paymentTriggered && !loading) {
      setPaymentTriggered(true);
      processPayment();
    }
  }, [autoTrigger, razorpayLoaded, paymentConfig, paymentTriggered, loading]);

  const processPayment = async () => {
    if (!razorpayLoaded || !paymentConfig || !window.Razorpay) {
      onFailure?.(new Error('Razorpay not loaded properly'));
      return;
    }

    try {
      // Step 1: Create payment order in backend
      const orderResponse = await createPaymentOrder(orderData);
      
      if (!orderResponse.success) {
        throw new Error(orderResponse.message || 'Failed to create payment order');
      }

      const { orderId, amount, currency, key } = orderResponse.data;

      // Step 2: Configure Razorpay options for mobile
      const options = {
        key: key || paymentConfig.razorpayKeyId,
        amount: amount, // Amount in paise
        currency: currency || 'INR',
        name: 'College Canteen',
        description: 'Food Order Payment',
        order_id: orderId,
        prefill: {
          name: userInfo?.name || '',
          email: userInfo?.email || '',
          contact: orderData?.phone || '',
        },
        theme: {
          color: '#667eea',
        },
        modal: {
          ondismiss: () => {
            onClose?.();
          },
          // Mobile optimizations
          confirm_close: true,
          escape: false,
        },
        // Mobile-specific options
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
        },
        config: {
          display: {
            blocks: {
              banks: {
                name: 'Most Used Methods',
                instruments: [
                  { method: 'upi' },
                  { method: 'card' },
                  { method: 'netbanking' },
                ],
              },
            },
            sequence: ['block.banks'],
            preferences: {
              show_default_blocks: false,
            },
          },
        },
        handler: async (response) => {
          try {
            // Step 3: Verify payment with backend
            const verificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderData,
            };

            console.log('🔍 Sending payment verification data:', {
              ...verificationData,
              orderData: {
                ...verificationData.orderData,
                itemCount: verificationData.orderData?.items?.length
              }
            });

            const verificationResponse = await verifyPayment(verificationData);
            
            if (verificationResponse.success) {
              console.log('✅ Payment verification successful:', verificationResponse.data);
              
              // Store order data in localStorage for order success page
              const orderDetailsForStorage = {
                ...verificationResponse.data,
                items: orderData.items // Include cart items
              };
              localStorage.setItem('order_data', JSON.stringify(orderDetailsForStorage));
              localStorage.setItem('current_order_id', verificationResponse.data.id);
              
              onSuccess?.(verificationResponse.data);
            } else {
              throw new Error(verificationResponse.message || 'Payment verification failed');
            }
          } catch (error) {
            console.error('❌ Payment verification failed:', error);
            onFailure?.(error);
          }
        },
      };

      // Step 3: Open Razorpay payment interface
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment initiation failed:', error);
      onFailure?.(error);
    }
  };

  const handleClick = () => {
    if (!disabled && !loading) {
      processPayment();
    }
  };

  // Default button if no children provided - Mobile optimized
  if (!children) {
    return (
      <button
        onClick={handleClick}
        disabled={disabled || loading || !razorpayLoaded}
        className={`w-full h-12 px-6 py-3 bg-blue-600 text-white text-base font-semibold rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation transition-colors ${className}`}
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
            Processing...
          </>
        ) : (
          '💳 Pay Now'
        )}
      </button>
    );
  }

  // Custom trigger element
  return (
    <div onClick={handleClick} className={className}>
      {children}
    </div>
  );
};

export default RazorpayPayment;