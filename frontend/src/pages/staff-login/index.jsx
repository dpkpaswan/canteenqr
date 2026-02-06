import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/ui/Button';
import Header from '../../components/navigation/Header';

const StaffLogin = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <Header hasActiveToken={false} />
      
      <main className="pt-[120px] pb-8 px-4 md:px-6 lg:px-8">
        <div className="max-w-md mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <span className="text-3xl">🏪</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              Canteen Staff Portal
            </h1>
            <p className="text-muted-foreground">
              Choose your operation
            </p>
          </div>

          {/* Staff Options */}
          <div className="space-y-4">
            <Button
              onClick={() => navigate('/staff-verification')}
              variant="default"
              size="lg"
              fullWidth
              className="h-16 text-left justify-start gap-4"
            >
              <div className="text-2xl">📱</div>
              <div>
                <div className="font-semibold">QR Code Verification</div>
                <div className="text-sm opacity-75">Scan student QR codes to complete orders</div>
              </div>
            </Button>

            <Button
              onClick={() => navigate('/staff-dashboard')}
              variant="outline"
              size="lg"
              fullWidth
              className="h-16 text-left justify-start gap-4"
            >
              <div className="text-2xl">📊</div>
              <div>
                <div className="font-semibold">Staff Dashboard</div>
                <div className="text-sm opacity-75">Manage orders and view analytics</div>
              </div>
            </Button>

            <Button
              onClick={() => navigate('/')}
              variant="secondary"
              size="lg"
              fullWidth
              className="h-12"
            >
              🔙 Back to Student Portal
            </Button>
          </div>

          {/* Quick Info */}
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="font-medium text-blue-900 mb-2">📋 Quick Guide:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Use <strong>QR Verification</strong> for order pickup</li>
              <li>• Use <strong>Dashboard</strong> to manage order status</li>
              <li>• Students show QR codes from their phones/emails</li>
              <li>• System validates orders automatically</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffLogin;