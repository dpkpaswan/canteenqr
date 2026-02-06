import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/navigation/Header';
import ProgressIndicator from '../../components/navigation/ProgressIndicator';
import TokenDisplay from './components/TokenDisplay';
import OrderSummary from './components/OrderSummary';
import StatusMessage from './components/StatusMessage';
import ActionButtons from './components/ActionButtons';
import QRCode from 'qrcode';

const OrderSuccessToken = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [orderData, setOrderData] = useState(null);

  useEffect(() => {
    const fetchOrderData = async () => {
      try {
        const orderReference = localStorage.getItem('order_reference');
        const orderId = localStorage.getItem('current_order_id');
        
        if (!orderId) {
          console.error('No order ID found');
          return;
        }

        // For now, use the stored order data if available
        const storedOrderData = localStorage.getItem('order_data');
        if (storedOrderData) {
          const parsedData = JSON.parse(storedOrderData);
          
          // Generate QR code data
          const qrData = {
            orderId: parsedData.id || orderId,
            token: parsedData.token,
            date: new Date().toISOString().split('T')[0],
            customerName: parsedData.user_name || user?.name
          };
          
          // Generate QR code
          const qrCodeUrl = await QRCode.toDataURL(JSON.stringify(qrData));
          
          setOrderData({
            ...parsedData,
            qrCodeUrl,
            tokenNumber: parsedData.token,
            studentName: parsedData.user_name || user?.name,
            email: parsedData.user_email || user?.email,
            orderReference: orderReference,
            estimatedTime: 15
          });
        }
      } catch (error) {
        console.error('Error fetching order data:', error);
      }
    };

    fetchOrderData();
    window.scrollTo(0, 0);
  }, [user]);

  if (!orderData) {
    return (
      <div className="min-h-screen bg-background">
        <Header hasActiveToken={false} />
        <ProgressIndicator />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 md:h-16 md:w-16 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-base md:text-lg text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header hasActiveToken={true} />
      <ProgressIndicator />
      <main className="pt-[140px] md:pt-[160px] pb-8 md:pb-12 lg:pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 lg:space-y-10">
          <StatusMessage estimatedTime={orderData?.estimatedTime} email={orderData?.email} />
          
          <TokenDisplay 
            tokenNumber={orderData?.tokenNumber} 
            qrCodeUrl={orderData?.qrCodeUrl}
          />
          
          <OrderSummary 
            items={orderData?.items} 
            totalAmount={orderData?.totalAmount} 
          />
          
          <ActionButtons tokenNumber={orderData?.tokenNumber} />
        </div>
      </main>
    </div>
  );
};

export default OrderSuccessToken;