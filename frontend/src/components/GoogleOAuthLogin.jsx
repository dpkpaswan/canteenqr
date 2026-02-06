/**
 * Google OAuth Integration Component
 * Handles Google Sign-In with the backend
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

// Load Google Identity Services script
const loadGoogleScript = () => {
  return new Promise((resolve) => {
    if (window.google) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const GoogleOAuthLogin = ({
  onSuccess,
  onError,
  className = '',
  children,
  disabled = false,
}) => {
  const { login, loading } = useAuth();
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [googleInitialized, setGoogleInitialized] = useState(false);

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const initializeGoogle = async () => {
      if (!clientId || clientId === 'your-google-client-id-here') {
        console.warn('Google Client ID not configured');
        return;
      }

      const scriptLoaded = await loadGoogleScript();
      setGoogleLoaded(scriptLoaded);

      if (scriptLoaded && window.google) {
        try {
          // Dynamic origin support for mobile LAN access and ngrok tunneling
          // IMPORTANT: Add these origins to Google Cloud Console:
          // - http://localhost:4028
          // - http://192.168.x.x:4028 (your actual LAN IP)
          // - https://your-ngrok-url.ngrok-free.app
          const currentOrigin = window.location.origin;
          console.log('🌐 OAuth initializing with origin:', currentOrigin);
          
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleResponse,
            auto_select: false,
            cancel_on_tap_outside: true,
            use_fedcm_for_prompt: false, // Disable FedCM to avoid CORS issues
            ux_mode: 'popup', // Use popup mode to handle COOP policy
            context: 'signin',
            itp_support: true,
            origin: currentOrigin // Use dynamic origin for mobile and ngrok compatibility
          });
          setGoogleInitialized(true);
          console.log('✅ Google OAuth initialized successfully');
        } catch (error) {
          console.error('❌ Google initialization failed:', error);
        }
      }
    };

    initializeGoogle();
  }, [clientId]);

  const handleGoogleResponse = async (response) => {
    try {
      if (!response.credential) {
        throw new Error('No credential received from Google');
      }

      // Send ID token to backend for verification
      const loginResponse = await login(response.credential);
      
      if (loginResponse.success) {
        onSuccess?.(loginResponse.data);
      } else {
        throw new Error(loginResponse.message || 'Login failed');
      }
    } catch (error) {
      console.error('Google login failed:', error);
      onError?.(error);
    }
  };

  const handleGoogleLogin = () => {
    if (!googleInitialized || disabled || loading) {
      console.warn('Google login not ready:', { googleInitialized, disabled, loading });
      return;
    }

    try {
      // Try popup first, fallback to redirect if needed
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.log('Prompt not displayed, using alternative approach');
          // Fallback: trigger via renderButton
          const tempDiv = document.createElement('div');
          tempDiv.style.position = 'absolute';
          tempDiv.style.top = '-9999px';
          tempDiv.style.left = '-9999px';
          document.body.appendChild(tempDiv);
          
          try {
            window.google.accounts.id.renderButton(tempDiv, {
              theme: 'outline',
              size: 'large',
              type: 'standard',
              shape: 'rectangular',
              width: 300
            });
            
            // Auto-click after a brief delay
            setTimeout(() => {
              const button = tempDiv.querySelector('div[role="button"]');
              if (button) {
                button.click();
              }
              // Cleanup
              setTimeout(() => {
                if (document.body.contains(tempDiv)) {
                  document.body.removeChild(tempDiv);
                }
              }, 1000);
            }, 100);
          } catch (renderError) {
            console.error('Button render failed:', renderError);
            document.body.removeChild(tempDiv);
          }
        }
      });
    } catch (error) {
      console.error('❌ Google login failed:', error);
      onError?.(error);
    }
  };

  // Check if Google OAuth is properly configured
  const isConfigured = clientId && clientId !== 'your-google-client-id-here';

  if (!isConfigured) {
    return (
      <div className="p-4 bg-yellow-100 text-yellow-800 rounded-lg">
        <p className="text-sm">
          Google OAuth not configured. Please add VITE_GOOGLE_CLIENT_ID to your .env file.
        </p>
      </div>
    );
  }

  // Default button if no children provided
  if (!children) {
    return (
      <button
        onClick={handleGoogleLogin}
        disabled={disabled || loading || !googleInitialized}
        className={`flex items-center justify-center px-6 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? (
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
        ) : (
          <>
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
              <path
                fill="#4285f4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34a853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#fbbc05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#ea4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </>
        )}
      </button>
    );
  }

  // Custom trigger element
  return (
    <div onClick={handleGoogleLogin} className={className}>
      {children}
    </div>
  );
};

// Auth status component
export const AuthStatus = () => {
  const { user, isAuthenticated, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <span>Checking authentication...</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        {user?.picture && (
          <img
            src={user.picture}
            alt={user.name}
            className="w-8 h-8 rounded-full"
          />
        )}
        <span className="text-sm font-medium">{user?.name}</span>
      </div>
      <button
        onClick={logout}
        className="text-sm text-red-600 hover:text-red-800"
      >
        Logout
      </button>
    </div>
  );
};

export default GoogleOAuthLogin;