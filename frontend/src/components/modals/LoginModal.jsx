import React, { useState } from 'react';
import { GoogleLogin } from '@react-oauth/google';
import Icon from '../AppIcon';
import { useAuth } from '../../context/AuthContext';
import GoogleOAuthLogin from '../GoogleOAuthLogin';

const LoginModal = ({ isOpen, onClose, onLoginSuccess }) => {
  const { login, loading } = useAuth();
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleLoginSuccess = async (userData) => {
    try {
      setError(null);
      onLoginSuccess?.(userData);
      onClose();
    } catch (err) {
      setError('Login failed. Please try again.');
      console.error('Login error:', err);
    }
  };

  const handleLoginError = (error) => {
    setError('Google Login Failed. Please try again.');
    console.error('Google Login Error:', error);
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-50 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-card rounded-xl shadow-xl max-w-xs w-full mx-4 p-4 relative animate-in fade-in zoom-in duration-200"
          onClick={(e) => e?.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <Icon name="X" size={20} />
          </button>

          <div className="text-center mb-4 md:mb-6">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3 md:mb-4">
              <Icon name="Lock" size={24} className="md:w-8 md:h-8" color="var(--color-primary)" />
            </div>
            <h2 className="text-lg font-bold text-foreground mb-2">
              Sign In Required
            </h2>
            <p className="text-sm text-muted-foreground">
              Please sign in with Google to place orders
            </p>
          </div>

          <div className="flex flex-col items-center gap-4">
            {error && (
              <div className="w-full p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm text-center">
                {error}
              </div>
            )}
            
            <GoogleOAuthLogin
              onSuccess={handleLoginSuccess}
              onError={handleLoginError}
              disabled={loading}
              className="w-full"
            />
            
            <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted p-3 rounded-lg">
              <Icon name="Info" size={16} className="flex-shrink-0 mt-0.5" />
              <p>
                Your email will be used to send order confirmation and token details
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Continue browsing menu
          </button>
        </div>
      </div>
    </>
  );
};

export default LoginModal;