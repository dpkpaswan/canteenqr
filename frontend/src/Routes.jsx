import React from "react";
import { BrowserRouter, Routes as RouterRoutes, Route } from "react-router-dom";
import ScrollToTop from "components/ScrollToTop";
import ErrorBoundary from "components/ErrorBoundary";
import NotFound from "pages/NotFound";
import OrderSuccessToken from './pages/order-success-token';
import CartCheckout from './pages/cart-checkout';
import FindMyToken from './pages/find-my-token';
import MenuLanding from './pages/menu-landing';
import OrderHistory from './pages/order-history';
import StaffVerification from './pages/staff-verification';
import StaffDashboard from './pages/staff-dashboard';
import StaffLogin from './pages/staff-login';

const Routes = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        {/* Mobile-first app shell */}
        <div className="min-h-screen flex flex-col overflow-x-hidden bg-background">
          <ScrollToTop />
          <RouterRoutes>
            <Route path="/" element={<MenuLanding />} />
            <Route path="/order-success-token" element={<OrderSuccessToken />} />
            <Route path="/cart-checkout" element={<CartCheckout />} />
            <Route path="/find-my-token" element={<FindMyToken />} />
            <Route path="/menu-landing" element={<MenuLanding />} />
            <Route path="/order-history" element={<OrderHistory />} />
            <Route path="/staff-login" element={<StaffLogin />} />
            <Route path="/staff-verification" element={<StaffVerification />} />
            <Route path="/staff-dashboard" element={<StaffDashboard />} />
            <Route path="*" element={<NotFound />} />
          </RouterRoutes>
        </div>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

export default Routes;
