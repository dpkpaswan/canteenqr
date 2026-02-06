import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import GoogleOAuthLogin, { AuthStatus } from '../GoogleOAuthLogin';
import Icon from '../AppIcon';

const Header = ({ hasActiveToken = false }) => {
  const location = useLocation();
  const currentPath = location?.pathname;
  const { user, isAuthenticated, logout, loading } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const isTokenPage = currentPath === '/find-my-token';

  const handleLoginSuccess = (userData) => {
    console.log('Login successful:', userData);
    // The auth context will handle the state update
  };

  const handleLoginError = (error) => {
    console.error('Login failed:', error);
  };

  const handleLogout = () => {
    logout();
    setShowProfileMenu(false);
  };

  return (
    <header className="sticky top-0 z-[100] bg-card shadow-sm border-b border-border/50">
      {/* Row 1: Logo + Auth - Compact mobile height */}
      <div className="h-14 flex items-center justify-between px-4">
        {/* Compact Logo */}
        <Link to="/menu-landing" className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center">
            <Icon name="UtensilsCrossed" size={16} color="var(--color-primary)" />
          </div>
          <span className="text-base font-semibold text-foreground">CanteenQR</span>
        </Link>

        {/* Compact Auth */}
        <div className="flex items-center">
          {isAuthenticated ? (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-1 p-2 rounded-lg hover:bg-accent transition-colors"
              >
                {user?.picture ? (
                  <img 
                    src={user?.picture} 
                    alt={user?.name} 
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-white text-xs font-medium">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                )}
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b border-border">
                    <p className="font-medium text-sm text-foreground">{user?.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                  </div>
                  <Link
                    to="/order-history"
                    onClick={() => setShowProfileMenu(false)}
                    className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2 text-sm"
                  >
                    <Icon name="History" size={14} />
                    <span>Order History</span>
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full px-3 py-2 text-left hover:bg-accent transition-colors flex items-center gap-2 text-destructive text-sm"
                  >
                    <Icon name="LogOut" size={14} />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center">
              {loading ? (
                <div className="flex items-center gap-1">
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                </div>
              ) : (
                <GoogleOAuthLogin
                  onSuccess={handleLoginSuccess}
                  onError={handleLoginError}
                  className="p-2 rounded-lg border border-input hover:bg-accent text-xs"
                >
                  <Icon name="User" size={14} />
                </GoogleOAuthLogin>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Horizontal Scrollable Navigation */}
      <div className="h-10 border-t border-border/30 overflow-hidden">
        <div className="flex items-center overflow-x-auto gap-3 px-4 py-2 scrollbar-hide">
          <Link 
            to="/menu-landing" 
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              currentPath === '/menu-landing' || currentPath === '/' 
                ? 'bg-primary text-primary-foreground' 
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            Menu
          </Link>
          <Link 
            to="/find-my-token" 
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              isTokenPage ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            Find Token
          </Link>
          {isAuthenticated && (
            <Link 
              to="/order-history" 
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                currentPath === '/order-history' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              }`}
            >
              History
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;