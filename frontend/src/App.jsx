import React from "react";
import { GoogleOAuthProvider } from '@react-oauth/google';
import { AuthProvider } from './context/AuthContext';
import Routes from "./Routes";

function App() {
  const clientId = import.meta.env?.VITE_GOOGLE_CLIENT_ID;

  return (
    <GoogleOAuthProvider clientId={clientId}>
      <AuthProvider>
        <Routes />
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;
