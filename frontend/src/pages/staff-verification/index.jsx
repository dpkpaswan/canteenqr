import React, { useState, useRef, useEffect } from 'react';
import { vendorAPI } from '../../services/api';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Header from '../../components/navigation/Header';
import QrScanner from 'qr-scanner';

const StaffVerification = () => {
  const [qrData, setQrData] = useState('');
  const [verificationResult, setVerificationResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [hasCamera, setHasCamera] = useState(false);
  const [isSecureContext, setIsSecureContext] = useState(true);
  const [cameraError, setCameraError] = useState('');
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const qrScannerRef = useRef(null);

  // Initialize camera capabilities and security checks
  useEffect(() => {
    // Check HTTPS requirement
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    setIsSecureContext(isSecure);
    
    if (!isSecure && window.location.hostname !== 'localhost') {
      setCameraError('QR scanning requires HTTPS in production');
      return;
    }

    // Check camera availability
    QrScanner.hasCamera().then(result => {
      setHasCamera(result);
      if (!result) {
        setCameraError('Camera not available on this device');
      }
    }).catch((err) => {
      console.error('Camera check failed:', err);
      setHasCamera(false);
      setCameraError('Failed to access camera. Please check permissions.');
    });

    return () => {
      // Cleanup scanner on unmount
      if (qrScannerRef.current) {
        qrScannerRef.current.destroy();
      }
    };
  }, []);

  const startScanning = async () => {
    if (!hasCamera || !videoRef.current) {
      setError('Camera not available on this device');
      return;
    }

    if (!isSecureContext && window.location.hostname !== 'localhost') {
      setError('Camera access requires HTTPS connection');
      return;
    }

    try {
      setIsScanning(true);
      setError('');
      setCameraError('');
      
      // Create QR scanner with mobile-optimized settings
      qrScannerRef.current = new QrScanner(
        videoRef.current,
        result => {
          // QR code detected
          console.log('QR detected:', result.data);
          setQrData(result.data);
          stopScanning();
          // Auto-verify after scan
          setTimeout(() => {
            handleVerifyQR(result.data);
          }, 100);
        },
        {
          returnDetailedScanResult: true,
          highlightScanRegion: true,
          highlightCodeOutline: true,
          maxScansPerSecond: 5, // Optimize for mobile performance
        }
      );

      await qrScannerRef.current.start();
    } catch (err) {
      console.error('Failed to start scanner:', err);
      let errorMessage = 'Failed to start camera.';
      
      if (err.name === 'NotAllowedError') {
        errorMessage = 'Camera access denied. Please allow camera permissions and try again.';
      } else if (err.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (err.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported in this browser.';
      }
      
      setError(errorMessage);
      setCameraError(errorMessage);
      setIsScanning(false);
    }
  };

  const stopScanning = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop();
      qrScannerRef.current.destroy();
      qrScannerRef.current = null;
    }
    setIsScanning(false);
  };

  const handleVerifyQR = async (qrDataToVerify = qrData) => {
    const dataToVerify = qrDataToVerify || qrData;
    
    if (!dataToVerify.trim()) {
      setError('Please scan QR code or enter QR code data');
      return;
    }

    setIsLoading(true);
    setError('');
    setVerificationResult(null);

    try {
      const result = await vendorAPI.scanQR(dataToVerify.trim());
      setVerificationResult(result);
      setQrData(''); // Clear input after successful verification
    } catch (err) {
      setError(err.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearResult = () => {
    setVerificationResult(null);
    setError('');
  };

  const handleQRInput = (e) => {
    setQrData(e.target.value);
    setError('');
  };

  const formatItems = (items) => {
    if (!items || !Array.isArray(items)) return 'No items';
    
    return items.map(item => 
      `${item.name} (Qty: ${item.quantity}) - ₹${(item.price * item.quantity).toFixed(2)}`
    ).join(', ');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header hasActiveToken={false} />
      
      <main className="pt-[120px] pb-8 px-4 md:px-6 lg:px-8">
        {/* HTTPS Warning Banner */}
        {!isSecureContext && window.location.hostname !== 'localhost' && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <span className="text-yellow-600">⚠️</span>
              <p className="text-yellow-800 font-medium">
                QR scanning requires HTTPS in production
              </p>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              Camera access is only available on secure connections (HTTPS)
            </p>
          </div>
        )}
        
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              🏪 Canteen Staff Verification
            </h1>
            <p className="text-muted-foreground">
              Scan or enter student QR code to verify and complete orders
            </p>
          </div>

          {/* QR Input Section */}
          <div className="bg-card rounded-xl p-6 shadow-lg border">
            <h2 className="text-lg font-semibold text-foreground mb-4">
              📱 Scan QR Code or Enter Data
            </h2>
            
            {/* Camera Scanner Section */}
            {hasCamera && (
              <div className="mb-6">
                <div className="flex gap-3 mb-4">
                  <Button
                    onClick={isScanning ? stopScanning : startScanning}
                    variant={isScanning ? "destructive" : "default"}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isScanning ? '🛑 Stop Scanning' : '📷 Start Camera Scanner'}
                  </Button>
                </div>
                
                {isScanning && (
                  <div className="relative bg-black rounded-lg overflow-hidden mb-4">
                    <video
                      ref={videoRef}
                      className="w-full h-64 object-cover"
                      style={{ transform: 'scaleX(-1)' }} // Mirror for better UX
                    />
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-2 border-green-400 rounded-lg"></div>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 text-center">
                      <p className="text-white text-sm bg-black bg-opacity-50 rounded px-2 py-1">
                        📱 Point camera at student's QR code
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="border-b border-gray-200 mb-4">
                  <div className="flex justify-center">
                    <span className="bg-background px-3 text-sm text-muted-foreground">OR</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Manual Input Section */}
            <div className="space-y-4">
              <div>
                <label htmlFor="qrData" className="block text-sm font-medium text-foreground mb-2">
                  Manual QR Code Entry:
                </label>
                <textarea
                  id="qrData"
                  value={qrData}
                  onChange={handleQRInput}
                  placeholder='Paste QR data here (JSON format like: {"orderId":"...","token":"T-001",...})'
                  className="w-full h-24 sm:h-28 px-4 py-3 border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary text-base" // 16px font prevents iOS zoom
                  disabled={isLoading || isScanning}
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => handleVerifyQR()}
                  disabled={isLoading || !qrData.trim() || isScanning}
                  className="flex-1 h-12 text-base" // Mobile-friendly height
                  variant="default"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    '✅ Verify Order'
                  )}
                </Button>
                
                <Button
                  onClick={() => setQrData('')}
                  variant="outline"
                  disabled={isLoading || isScanning}
                  className="sm:w-auto h-12 text-base"
                >
                  🗑️ Clear
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">📋 How to use:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• <strong>Camera Method:</strong> Click "Start Camera Scanner" and point at QR code</li>
                <li>• <strong>Manual Method:</strong> Ask student to copy QR data and paste below</li>
                <li>• System validates: token match, today's date, ready status</li>
                <li>• Order completes automatically after successful scan</li>
              </ul>
              {!hasCamera && (
                <div className="mt-3 p-2 bg-yellow-100 rounded border border-yellow-300">
                  <p className="text-yellow-800 text-xs">
                    📱 Camera not detected. Use manual entry method.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-red-500">❌</span>
                <span className="font-medium text-red-700">Verification Failed</span>
              </div>
              <p className="text-red-600 mt-1">{error}</p>
            </div>
          )}

          {/* Success Result */}
          {verificationResult && verificationResult.success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-green-500 text-xl">✅</span>
                  <h3 className="font-semibold text-green-700">Order Verified Successfully!</h3>
                </div>
                <Button
                  onClick={handleClearResult}
                  variant="outline"
                  size="sm"
                >
                  ✕
                </Button>
              </div>
              
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Token Number:</p>
                    <p className="text-lg font-bold text-green-700">
                      {verificationResult.data.token}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600">Customer Name:</p>
                    <p className="text-lg font-semibold text-gray-800">
                      {verificationResult.data.customerName}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Amount:</p>
                    <p className="text-lg font-bold text-green-600">
                      ₹{verificationResult.data.totalAmount}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed At:</p>
                    <p className="text-sm text-gray-700">
                      {new Date(verificationResult.data.completedAt).toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                
                {verificationResult.data.items && (
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-2">Order Items:</p>
                    <div className="bg-white rounded-lg p-3 border">
                      <p className="text-sm text-gray-700">
                        {formatItems(verificationResult.data.items)}
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="text-center pt-2">
                  <p className="text-green-600 font-medium">
                    🎉 Order marked as completed! Student can collect their food.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sample QR Data for Testing */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-medium text-gray-700 mb-2">🧪 Sample QR Data (for testing):</h3>
            <code className="text-xs text-gray-600 block bg-white p-2 rounded border">
              {`{"orderId":"sample-id","token":"T-001","date":"${new Date().toISOString().split('T')[0]}","customerName":"Test Student"}`}
            </code>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StaffVerification;