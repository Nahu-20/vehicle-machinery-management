import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  ScanLine, 
  Smartphone, 
  CheckCircle2, 
  MapPin, 
  Package, 
  Sprout, 
  Truck, 
  Award 
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { QrScanner } from '../components/ui/QrScanner';

interface TraceabilityEvent {
  id: string;
  date: string;
  title: string;
  location: string;
  description: string;
  icon: 'sprout' | 'package' | 'award' | 'truck';
  actor: string;
}

// Dummy data removed in favor of real blockchain data

export const BlockchainTraceabilityPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const targetBatchId = queryParams.get('batchId') || 'COFFEE-BATCH-001';

  const [isScanning, setIsScanning] = useState(true);
  const [scanResult, setScanResult] = useState<TraceabilityEvent[] | null>(null);
  const [batchDetails, setBatchDetails] = useState<any>(null);
  const [isDesktop, setIsDesktop] = useState(false);
  const [currentUrl, setCurrentUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if device is desktop for the "Continue on Phone" feature
    const checkIsDesktop = () => setIsDesktop(window.innerWidth > 768);
    checkIsDesktop();
    window.addEventListener('resize', checkIsDesktop);
    
    // Get local URL for QR code generation
    const currentHref = window.location.href;
    setCurrentUrl(currentHref);
    
    // If we are on localhost, try to fetch the local IP so the phone can actually connect
    if (currentHref.includes('localhost')) {
      fetch('/api/local-ip')
        .then(res => res.json())
        .then(data => {
          if (data.ip && data.ip !== 'localhost') {
            setCurrentUrl(currentHref.replace('localhost', data.ip));
          }
        })
        .catch(err => console.warn('Could not fetch local IP:', err));
    }

    return () => window.removeEventListener('resize', checkIsDesktop);
  }, []);

  // Fallback for manual simulation if needed
  const handleSimulateScan = async () => {
    await performScan(targetBatchId);
  };

  const handleRealScan = async (decodedText: string) => {
    try {
      // The decoded text is usually a URL: http://ip/traceability/scan?batchId=COFFEE-BATCH-001
      const url = new URL(decodedText);
      const scannedBatchId = url.searchParams.get('batchId');
      
      if (scannedBatchId) {
        await performScan(scannedBatchId);
      } else {
        alert("Invalid QR Code: No batch ID found in the URL.");
      }
    } catch (e) {
      // If it's not a valid URL, maybe it's just raw text of the batchId
      if (decodedText.startsWith('COFFEE-') || decodedText.length > 5) {
         await performScan(decodedText);
      } else {
         alert("Invalid QR Code: Could not parse URL.");
      }
    }
  };

  const performScan = async (idToScan: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/blockchain/history/${idToScan}`);
      const data = await res.json();
      if (data.success) {
        setIsScanning(false);
        setBatchDetails(data.batch);
        
        const mappedEvents = data.history.map((evt: any, i: number) => {
          let icon: 'sprout' | 'package' | 'award' | 'truck' = 'sprout';
          let title = 'Cultivation & Harvest';
          if (evt.stage === 1) { icon = 'package'; title = 'Washing & Processing'; }
          else if (evt.stage === 2) { icon = 'award'; title = 'Quality Certification'; }
          else if (evt.stage === 3) { icon = 'truck'; title = 'Export Packaging & Shipment'; }

          return {
            id: `evt-${i}`,
            date: new Date(evt.timestamp).toLocaleDateString(),
            title,
            location: evt.location,
            description: evt.description,
            icon,
            actor: evt.actor
          };
        });
        setScanResult(mappedEvents);
      } else {
        alert("Error fetching from blockchain: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Error connecting to backend");
    } finally {
      setIsLoading(false);
    }
  };

  const renderIcon = (iconType: string) => {
    switch (iconType) {
      case 'sprout': return <Sprout className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'package': return <Package className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'award': return <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
      case 'truck': return <Truck className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      default: return <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F7F3] dark:bg-[#0B1912] text-[#0A1912] dark:text-[#E6F0EA] flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-[#F6F7F3]/90 dark:bg-[#0B1912]/90 backdrop-blur-md border-b border-[#E2E8E3] dark:border-[#183327] px-4 py-4 flex items-center shadow-sm">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-full hover:bg-[#E2E8E3] dark:hover:bg-[#183327] transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-[#063D2A] dark:text-emerald-400" />
        </button>
        <h1 className="ml-2 text-lg font-bold tracking-tight">Product Traceability</h1>
      </header>

      <main className="flex-1 flex flex-col max-w-lg w-full mx-auto relative overflow-hidden">
        <AnimatePresence mode="wait">
          {isScanning ? (
            <motion.div 
              key="scanner"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="p-6 text-center space-y-2">
                <h2 className="text-2xl font-extrabold text-[#063D2A] dark:text-white">Scan Product</h2>
                <p className="text-sm text-[#56635B] dark:text-emerald-100/70">
                  Scan the blockchain QR code on the packaging to verify origin and history.
                </p>
              </div>

              {/* Viewfinder UI */}
              <div className="relative flex-1 flex flex-col items-center justify-center p-6 bg-black/5 dark:bg-black/20 m-6 rounded-3xl overflow-hidden shadow-inner border border-black/10 dark:border-white/5">
                
                {/* Real Live QR Scanner */}
                <QrScanner onScanSuccess={handleRealScan} themeColor="#087A4B" />

                <div className="mt-8 space-y-4 w-full">
                  <p className="text-xs text-center text-[#56635B] dark:text-emerald-100/50 mb-2">
                    Point camera at QR code to scan automatically
                  </p>
                  
                  {/* Keep fallback button just in case camera fails or desktop use */}
                  <button 
                    onClick={handleSimulateScan}
                    disabled={isLoading}
                    className="w-full py-4 bg-[#087A4B]/10 hover:bg-[#087A4B]/20 dark:bg-[#A3E635]/10 dark:hover:bg-[#A3E635]/20 text-[#087A4B] dark:text-[#A3E635] rounded-full font-bold transition-all active:scale-95 disabled:opacity-50 border border-[#087A4B]/30 dark:border-[#A3E635]/30"
                  >
                    {isLoading ? 'Querying Blockchain...' : `Simulate Scan (${targetBatchId})`}
                  </button>
                </div>
              </div>

              {/* Desktop 'Continue on Phone' Hint */}
              {isDesktop && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mx-6 mb-8 p-5 bg-white dark:bg-[#0E241B] border border-[#E2E8E3] dark:border-[#183327] rounded-2xl shadow-sm flex items-center gap-4"
                >
                  <div className="flex-shrink-0 bg-white p-2 rounded-xl border border-gray-200">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(currentUrl)}`} 
                      alt="QR Code to open on phone"
                      className="w-20 h-20"
                    />
                  </div>
                  <div className="space-y-1">
                    <h3 className="font-bold flex items-center gap-2 text-[#063D2A] dark:text-emerald-50">
                      <Smartphone className="w-4 h-4" /> Continue on Phone
                    </h3>
                    <p className="text-xs text-[#56635B] dark:text-emerald-100/70 leading-relaxed">
                      Using a PC? Scan this QR code with your mobile device to open this scanner and scan a physical product.
                    </p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="result"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex-1 overflow-y-auto pb-12"
            >
              {/* Product Header Card */}
              <div className="bg-[#063D2A] dark:bg-emerald-950 text-white p-6 pb-12 rounded-b-[2.5rem] shadow-xl relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified Authentic
                    </span>
                    <h2 className="text-2xl font-extrabold pt-2">Grade 1 Washed Coffee</h2>
                    <p className="text-emerald-100/80 text-sm">Batch ID: {batchDetails?.batchId || '#OCFCU-2023-8991'}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                    <p className="text-emerald-200/60 text-xs font-medium mb-1">Origin</p>
                    <p className="font-semibold text-sm flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" /> {batchDetails?.origin || 'Jimma Zone'}
                    </p>
                  </div>
                  <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                    <p className="text-emerald-200/60 text-xs font-medium mb-1">Variety</p>
                    <p className="font-semibold text-sm">{batchDetails?.variety || 'Heirloom / JARC'}</p>
                  </div>
                </div>
              </div>

              {/* Timeline Section */}
              <div className="px-6 pt-8 -mt-6 relative">
                <h3 className="text-lg font-extrabold text-[#063D2A] dark:text-white mb-6">Blockchain Journey</h3>
                
                <div className="relative border-l-2 border-[#E2E8E3] dark:border-[#183327] ml-4 space-y-8">
                  {scanResult?.map((event, index) => (
                    <motion.div 
                      key={event.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15 }}
                      className="relative pl-6"
                    >
                      {/* Timeline Dot with Icon */}
                      <div className="absolute -left-[17px] top-1 w-8 h-8 rounded-full bg-white dark:bg-[#0E241B] border-2 border-[#087A4B] dark:border-[#A3E635] flex items-center justify-center shadow-sm">
                        {renderIcon(event.icon)}
                      </div>
                      
                      <div className="bg-white dark:bg-[#0E241B] border border-[#E2E8E3] dark:border-[#183327] p-4 rounded-2xl shadow-sm">
                        <div className="flex justify-between items-start mb-2 gap-4">
                          <h4 className="font-bold text-[#0A1912] dark:text-emerald-50 text-base">{event.title}</h4>
                          <span className="text-xs font-medium text-[#56635B] dark:text-emerald-100/50 whitespace-nowrap bg-black/5 dark:bg-white/5 px-2 py-1 rounded-md">
                            {event.date}
                          </span>
                        </div>
                        
                        <p className="text-[#56635B] dark:text-emerald-100/80 text-sm leading-relaxed mb-3">
                          {event.description}
                        </p>
                        
                        <div className="flex items-center gap-2 text-xs text-[#087A4B] dark:text-[#A3E635] bg-[#087A4B]/5 dark:bg-[#A3E635]/10 p-2 rounded-lg font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Verified by {event.actor}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-10 mb-6 text-center">
                  <button 
                    onClick={() => setIsScanning(true)}
                    className="text-sm font-semibold text-[#56635B] dark:text-emerald-100/70 hover:text-[#087A4B] dark:hover:text-[#A3E635] transition-colors"
                  >
                    Scan Another Product
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
