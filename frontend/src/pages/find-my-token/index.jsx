import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '../../context/AuthContext';
import { tokenAPI } from '../../services/api';
import Header from '../../components/navigation/Header';
import ProgressIndicator from '../../components/navigation/ProgressIndicator';
import PhoneInputForm from './components/PhoneInputForm';
import TokenDisplay from './components/TokenDisplay';
import ErrorMessage from './components/ErrorMessage';
import InstructionCard from './components/InstructionCard';
import Icon from '../../components/AppIcon';

const FindMyToken = () => {
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [tokenData, setTokenData] = useState(null);
  const [error, setError] = useState('');
  const [searchMethod, setSearchMethod] = useState('phone');

  const handlePhoneSubmit = async (phoneNumber) => {
    setLoading(true);
    setError('');
    setTokenData(null);

    try {
      const response = await tokenAPI.findToken({ phone: phoneNumber });
      
      if (response.success && response.data?.order) {
        const order = response.data.order;
        setTokenData({
          token: order.token,
          orderDetails: {
            time: new Date(order.createdAt).toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            itemCount: order.items ? order.items.length : 0,
            amount: order.totalAmount
          }
        });
      } else {
        setError('No active orders found for this phone number. Please check the number and try again, or place a new order.');
      }
    } catch (error) {
      console.error('Error finding token by phone:', error);
      if (error.response?.status === 404) {
        setError('No active orders found for this phone number. Please check the number and try again, or place a new order.');
      } else if (error.response?.status === 400) {
        setError(error.response.data?.message || 'Token expired. Please place a new order.');
      } else {
        setError('Failed to find token. Please check your internet connection and try again.');
      }
    }

    setLoading(false);
  };

  const handleEmailSubmit = async (email) => {
    setLoading(true);
    setError('');
    setTokenData(null);

    try {
      const response = await tokenAPI.findToken({ email });
      
      if (response.success && response.data?.order) {
        const order = response.data.order;
        setTokenData({
          token: order.token,
          orderDetails: {
            time: new Date(order.createdAt).toLocaleString('en-IN', {
              timeZone: 'Asia/Kolkata',
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }),
            itemCount: order.items ? order.items.length : 0,
            amount: order.totalAmount
          }
        });
      } else {
        setError('No active orders found for this email address. Please check and try again, or place a new order.');
      }
    } catch (error) {
      console.error('Error finding token by email:', error);
      if (error.response?.status === 404) {
        setError('No active orders found for this email address. Please check and try again, or place a new order.');
      } else if (error.response?.status === 400) {
        setError(error.response.data?.message || 'Token expired. Please place a new order.');
      } else {
        setError('Failed to find token. Please check your internet connection and try again.');
      }
    }

    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Find My Token - CanteenQR</title>
        <meta name="description" content="Retrieve your active order token using your phone number" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header hasActiveToken={false} />
        <ProgressIndicator />

        <main className="pt-[104px] sm:pt-[120px] md:pt-[116px] pb-8 md:pb-12 lg:pb-16">
          <div className="max-w-2xl mx-auto px-4 md:px-6 lg:px-8">
            <div className="space-y-6 md:space-y-8 lg:space-y-10">
              <div className="text-center space-y-2 md:space-y-3">
                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full bg-primary/10 mb-4 md:mb-6">
                  <Icon 
                    name="Search" 
                    size={32} 
                    color="var(--color-primary)"
                    className="md:w-10 md:h-10 lg:w-12 lg:h-12"
                  />
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-heading font-bold text-foreground">
                  Find My Token
                </h1>
                <p className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-md mx-auto">
                  {isAuthenticated ? 'Retrieve your token using email or phone number' : 'Enter your phone number to retrieve your active order token'}
                </p>
              </div>

              <div className="bg-card rounded-lg p-6 md:p-8 lg:p-10 shadow-md border border-border">
                {isAuthenticated && (
                  <div className="flex gap-2 mb-6">
                    <button
                      onClick={() => setSearchMethod('email')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        searchMethod === 'email' ?'bg-primary text-primary-foreground' :'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      Email
                    </button>
                    <button
                      onClick={() => setSearchMethod('phone')}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                        searchMethod === 'phone' ?'bg-primary text-primary-foreground' :'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                    >
                      Phone
                    </button>
                  </div>
                )}

                <PhoneInputForm 
                  onSubmit={searchMethod === 'email' ? handleEmailSubmit : handlePhoneSubmit}
                  loading={loading}
                  searchMethod={searchMethod}
                  defaultEmail={isAuthenticated ? user?.email : ''}
                />
              </div>

              {tokenData && (
                <TokenDisplay 
                  token={tokenData?.token}
                  orderDetails={tokenData?.orderDetails}
                />
              )}

              {error && (
                <ErrorMessage message={error} />
              )}

              {!tokenData && !error && (
                <InstructionCard />
              )}

              <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 md:p-6">
                <div className="flex items-start gap-3 md:gap-4">
                  <div className="flex-shrink-0 mt-0.5">
                    <Icon 
                      name="Info" 
                      size={20} 
                      color="var(--color-warning)"
                      className="md:w-6 md:h-6"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs md:text-sm text-foreground/80">
                      <strong className="font-medium">Note:</strong> This feature only works for active orders. Completed or cancelled orders cannot be retrieved through this system.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
};

export default FindMyToken;