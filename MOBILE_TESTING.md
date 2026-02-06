# 📱 MOBILE TESTING SETUP

## Your Network Configuration
- **Local IP Address**: 192.168.1.15
- **Frontend (Mobile)**: http://192.168.1.15:4028
- **Backend API**: http://192.168.1.15:3001/api

## Steps to Test on Mobile:

### 1. Make sure both devices are on the same WiFi network
- Your computer and mobile device must be connected to the same local network

### 2. Start the servers (run these commands):
```bash
# Terminal 1: Backend
cd "C:\Users\Deepak Paswan\Desktop\canteenqr\backend"
npm start

# Terminal 2: Frontend
cd "C:\Users\Deepak Paswan\Desktop\canteenqr\frontend" 
npm start
```

### 3. Access from mobile browser:
- Open your mobile browser (Chrome, Safari, etc.)
- Navigate to: **http://192.168.1.15:4028**

### 4. Test Features:
- ✅ Google OAuth Login
- ✅ Menu browsing and ordering
- ✅ Razorpay payment (mobile optimized)
- ✅ QR code scanning (requires HTTPS for camera)
- ✅ Token lookup functionality
- ✅ PWA features (install app prompt)

## Troubleshooting:

### If mobile can't connect:
1. Check Windows Firewall - ensure ports 3001 and 4028 are allowed
2. Try disabling Windows Defender Firewall temporarily
3. Verify both devices are on same network (check IP ranges)

### For QR Camera features:
- QR scanning requires HTTPS in production
- For local testing, use Chrome's "Allow insecure localhost" flag
- Or generate local SSL certificates

### Windows Firewall Commands (Run as Administrator):
```cmd
netsh advfirewall firewall add rule name="Node Backend" dir=in action=allow protocol=TCP localport=3001
netsh advfirewall firewall add rule name="Vite Frontend" dir=in action=allow protocol=TCP localport=4028
```

## Network Security Note:
This configuration allows local network access. Make sure you're on a trusted network (home/office WiFi).