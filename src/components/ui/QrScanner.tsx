import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  themeColor?: string;
  fps?: number;
  qrbox?: number;
}

export const QrScanner: React.FC<QrScannerProps> = ({ 
  onScanSuccess, 
  themeColor = '#087A4B',
  fps = 10,
  qrbox = 250
}) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // We only want to instantiate the scanner once
    const html5QrCode = new Html5Qrcode("qr-reader", { formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE], verbose: false });
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        const hasCameras = await Html5Qrcode.getCameras();
        if (hasCameras && hasCameras.length > 0) {
          setHasPermission(true);
          
          await html5QrCode.start(
            { facingMode: "environment" }, // Prefer back camera
            {
              fps: fps,
              qrbox: { width: qrbox, height: qrbox },
              aspectRatio: 1.0,
            },
            (decodedText) => {
              // Successfully scanned! 
              // Stop the scanner immediately to prevent duplicate scans
              if (html5QrCode.isScanning) {
                html5QrCode.stop().catch(console.error);
              }
              onScanSuccess(decodedText);
            },
            () => {
              // Ignore standard frame errors (expected when no QR code is in view)
            }
          );
        } else {
          setError("No cameras found on this device.");
        }
      } catch (err: any) {
        setHasPermission(false);
        setError("Camera permission denied or camera unavailable. Please grant permissions and reload.");
        console.error("QR Scanner Error:", err);
      }
    };

    startScanner();

    // Cleanup when component unmounts
    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [fps, qrbox, onScanSuccess]);

  if (hasPermission === false || error) {
    return (
      <div className="w-64 h-64 border-2 border-dashed border-red-500 rounded-2xl flex flex-col items-center justify-center p-4 text-center bg-red-50 dark:bg-red-900/10">
        <Camera className="w-8 h-8 text-red-500 mb-2 opacity-50" />
        <p className="text-sm font-bold text-red-600 dark:text-red-400 mb-1">Camera Access Required</p>
        <p className="text-xs text-red-500 dark:text-red-300">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-3 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-red-200"
        >
          <RefreshCw className="w-3 h-3" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-64 h-64 border-2 border-dashed rounded-2xl overflow-hidden shadow-inner flex items-center justify-center bg-black" style={{ borderColor: themeColor }}>
      
      {/* The actual HTML5-QRCode Video Element Container */}
      <div id="qr-reader" className="w-full h-full absolute inset-0 [&>video]:object-cover" />

      {/* Decorative Overlay Frame (So it still looks like our design) */}
      <div className="absolute inset-0 pointer-events-none z-10">
        {/* Scanning Animation Line */}
        <motion.div 
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 right-0 h-0.5 w-full z-10 opacity-70"
          style={{ backgroundColor: themeColor, boxShadow: `0 0 12px ${themeColor}` }}
        />
        
        {/* Corner marks */}
        <div className="absolute top-[-2px] left-[-2px] w-6 h-6 border-t-4 border-l-4 rounded-tl-xl" style={{ borderColor: themeColor }}></div>
        <div className="absolute top-[-2px] right-[-2px] w-6 h-6 border-t-4 border-r-4 rounded-tr-xl" style={{ borderColor: themeColor }}></div>
        <div className="absolute bottom-[-2px] left-[-2px] w-6 h-6 border-b-4 border-l-4 rounded-bl-xl" style={{ borderColor: themeColor }}></div>
        <div className="absolute bottom-[-2px] right-[-2px] w-6 h-6 border-b-4 border-r-4 rounded-br-xl" style={{ borderColor: themeColor }}></div>
      </div>
      
      {!hasPermission && !error && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm text-white">
          <Camera className="w-8 h-8 mb-2 animate-pulse text-white/70" />
          <p className="text-xs font-bold tracking-wider uppercase text-white/70">Requesting Camera...</p>
        </div>
      )}
    </div>
  );
};
