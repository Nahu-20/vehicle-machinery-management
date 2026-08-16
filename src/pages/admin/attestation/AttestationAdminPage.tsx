import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ScanLine, 
  Sprout, 
  Package, 
  Award, 
  Truck, 
  CheckCircle2,
  AlertCircle,
  Printer,
  Camera,
  X,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useStaffAuthorization } from '../../../hooks/useStaffAuthorization';
import { QrScanner } from '../../../components/ui/QrScanner';

interface AttestationStage {
  id: string;
  title: string;
  icon: React.FC<any>;
  description: string;
  roleRequired: string;
  themeColor: string;
}

const ATTESTATION_STAGES: AttestationStage[] = [
  {
    id: 'cultivation',
    title: 'Cultivation & Harvest',
    icon: Sprout,
    description: 'Log harvest data, farm origin, and organic practices.',
    roleRequired: 'superAdmin', // Future: 'farmInspector'
    themeColor: '#087A4B' // Emerald
  },
  {
    id: 'processing',
    title: 'Washing & Processing',
    icon: Package,
    description: 'Record washing station details, fermentation, and moisture levels.',
    roleRequired: 'superAdmin', // Future: 'processingManager'
    themeColor: '#D97706' // Amber
  },
  {
    id: 'quality',
    title: 'Quality Certification',
    icon: Award,
    description: 'Certify cupping scores, flavor profiles, and official grades.',
    roleRequired: 'superAdmin', // Future: 'qualityInspector'
    themeColor: '#2563EB' // Blue
  },
  {
    id: 'export',
    title: 'Export & Shipment',
    icon: Truck,
    description: 'Log packaging details, container IDs, and port dispatch.',
    roleRequired: 'superAdmin', // Future: 'exportOfficer'
    themeColor: '#9333EA' // Purple
  }
];

export const AttestationAdminPage: React.FC = () => {
  const { hasRole, staffUser } = useStaffAuthorization();
  
  const [batchId, setBatchId] = useState<string>('');
  const [origin, setOrigin] = useState<string>('Jimma Zone, Oromia');
  const [variety, setVariety] = useState<string>('Arabica - Heirloom');

  // Auto-generate a unique batch ID
  const generateNewBatchId = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const randomHex = Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase().padStart(6, '0');
    setBatchId(`OCFCU-${year}-${randomHex}`);
    setInitStatusMessage(null);
    setQrCodeUrl(null);
  };

  useEffect(() => {
    generateNewBatchId();
  }, []);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [initStatusMessage, setInitStatusMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [stageStatuses, setStageStatuses] = useState<Record<string, {type: 'success' | 'error', text: string}>>({});
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [scanningStageId, setScanningStageId] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  const submitAttestation = async (stageId: string, targetBatchId: string) => {
    if (isSubmittingRef.current) return; // Strict lock to prevent double-submissions
    isSubmittingRef.current = true;
    
    const stage = visibleStages.find(s => s.id === stageId);
    if (!stage) {
      isSubmittingRef.current = false;
      return;
    }
    
    setIsSubmitting(stage.id);
    
    // Clear previous status for this specific stage
    setStageStatuses(prev => ({ ...prev, [stage.id]: null } as any));
    
    try {
      const res = await fetch('/api/blockchain/attest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: targetBatchId,
          stage: stage.id,
          actor: staffUser?.displayName || 'Authorized Staff',
          location: 'Oromia Regional Office',
          description: `Attested ${stage.title} data`,
          ipfsHash: 'QmDummyHash'
        })
      });
      const data = await res.json();
      if (data.success) {
        setStageStatuses(prev => ({ ...prev, [stage.id]: { type: 'success', text: `${stage.title} logged successfully! TX: ${data.txHash}` } }));
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setStageStatuses(prev => ({ ...prev, [stage.id]: { type: 'error', text: err.message } }));
    } finally {
      setIsSubmitting(null);
      isSubmittingRef.current = false;
    }
  };

  const handleAdminScan = async (decodedText: string) => {
    let scannedBatchId = decodedText;
    try {
      const url = new URL(decodedText);
      const urlBatchId = url.searchParams.get('batchId');
      if (urlBatchId) {
        scannedBatchId = urlBatchId;
      }
    } catch (e) {
      // Not a URL, use raw text
    }
    
    if (!scannedBatchId) {
      alert("Invalid QR Code.");
      setScanningStageId(null);
      return;
    }
    
    setBatchId(scannedBatchId);
    
    const stageToSubmit = scanningStageId;
    setScanningStageId(null);
    
    if (stageToSubmit) {
      await submitAttestation(stageToSubmit, scannedBatchId);
    }
  };

  // For the prototype, we assume superAdmin sees all. 
  // In a real scenario, we'd filter this array based on the user's role.
  const visibleStages = ATTESTATION_STAGES.filter(stage => 
    hasRole('superAdmin') || hasRole(stage.roleRequired as any)
  );

  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Blockchain Attestation
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
            Scan physical product QR codes to log supply chain events securely onto the blockchain. 
            Your actions are cryptographically signed using the master backend wallet on behalf of {staffUser?.email}.
          </p>
        </div>
      </div>

      {/* Batch Registration Panel */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-slate-900 dark:text-white">Register New Coffee Batch</h3>
        <div className="flex flex-col sm:flex-row gap-4 items-end">
          <div className="flex-1 space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase">New Batch ID</label>
              <div className="flex items-center gap-2 mt-1">
                <input 
                  type="text" 
                  value={batchId} 
                  readOnly
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3 outline-none font-mono text-sm text-slate-500 cursor-not-allowed"
                />
                <button
                  onClick={generateNewBatchId}
                  className="p-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700"
                  title="Generate a new Batch ID"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Origin Region</label>
                <div className="flex items-center gap-2 mt-1">
                  <select 
                    value={origin} 
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm appearance-none cursor-pointer"
                  >
                    <option value="Jimma Zone, Oromia">Jimma Zone, Oromia</option>
                    <option value="Guji Zone, Oromia">Guji Zone, Oromia</option>
                    <option value="West Guji Zone, Oromia">West Guji Zone, Oromia</option>
                    <option value="East Hararghe Zone, Oromia">East Hararghe Zone, Oromia</option>
                    <option value="West Hararghe Zone, Oromia">West Hararghe Zone, Oromia</option>
                    <option value="Illubabor Zone, Oromia">Illubabor Zone, Oromia</option>
                    <option value="Buno Bedele Zone, Oromia">Buno Bedele Zone, Oromia</option>
                    <option value="Limmu, Oromia">Limmu, Oromia</option>
                    <option value="Bale Zone, Oromia">Bale Zone, Oromia</option>
                  </select>
                </div>
              </div>

              <div className="flex-1">
                <label className="text-xs font-bold text-slate-500 uppercase">Coffee Variety</label>
                <div className="flex items-center gap-2 mt-1">
                  <select 
                    value={variety} 
                    onChange={(e) => setVariety(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500/50 text-sm appearance-none cursor-pointer"
                  >
                    <option value="Arabica - Heirloom">Arabica - Heirloom</option>
                    <option value="Arabica - JARC Varieties">Arabica - JARC Varieties</option>
                    <option value="Arabica - Geisha">Arabica - Geisha</option>
                    <option value="Arabica - Kurume">Arabica - Kurume</option>
                    <option value="Arabica - Dega">Arabica - Dega</option>
                    <option value="Arabica - Wolisho">Arabica - Wolisho</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          
          <button 
            onClick={async () => {
              setIsSubmitting('init');
              setInitStatusMessage(null);
              setQrCodeUrl(null);
              try {
                const res = await fetch('/api/blockchain/batch', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ batchId: batchId, origin: origin, variety: variety })
                });
                const data = await res.json();
                if (data.success) {
                  setInitStatusMessage({ type: 'success', text: `Batch initialized! TX: ${data.txHash}` });
                  
                  // Generate the QR Code URL
                  const protocol = window.location.protocol;
                  let host = window.location.host;
                  if (host.includes('localhost')) {
                    const ipRes = await fetch('/api/local-ip').then(r => r.json()).catch(() => ({ ip: 'localhost' }));
                    if (ipRes.ip && ipRes.ip !== 'localhost') {
                      host = host.replace('localhost', ipRes.ip);
                    }
                  }
                  const fullUrl = `${protocol}//${host}/traceability/scan?batchId=${encodeURIComponent(batchId)}`;
                  setQrCodeUrl(fullUrl);
                } else {
                  throw new Error(data.error);
                }
              } catch (err: any) {
                setInitStatusMessage({ type: 'error', text: err.message });
              } finally {
                setIsSubmitting(null);
              }
            }}
            disabled={isSubmitting !== null}
            className="px-4 py-2 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 disabled:opacity-50"
          >
            {isSubmitting === 'init' ? 'Initializing...' : 'Initialize New Batch'}
          </button>
        </div>
        {initStatusMessage && (
          <div className={`text-sm p-3 rounded-lg ${initStatusMessage.type === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
            {initStatusMessage.text}
          </div>
        )}

        {qrCodeUrl && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-2xl p-5 flex flex-col md:flex-row items-center gap-6 mt-4">
            <div className="bg-white p-2 rounded-xl border border-gray-200 shadow-sm shrink-0">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCodeUrl)}`} 
                alt={`QR Code for ${batchId}`}
                className="w-32 h-32"
              />
            </div>
            <div className="space-y-3 flex-1 text-center md:text-left">
              <h3 className="font-bold text-emerald-900 dark:text-emerald-100">Batch Initialized Successfully!</h3>
              <p className="text-sm text-emerald-800/80 dark:text-emerald-200/70">
                This is the permanent QR code for Batch <strong>{batchId}</strong>. Print and attach it to the physical product sack. All subsequent stages will be logged against this ID.
              </p>
              <button 
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head><title>Print QR Code - ${batchId}</title></head>
                        <body style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; font-family:sans-serif;">
                          <h2>Batch ID: ${batchId}</h2>
                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrCodeUrl)}" style="margin-bottom: 20px;" />
                          <p style="font-weight: bold; color: #087A4B;">Oromia Agriculture Bureau</p>
                          <p>Scan to view blockchain history</p>
                          <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors shadow-sm"
              >
                <Printer className="w-4 h-4" /> Print QR Code
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Warning/Info Banner */}
      <div className="bg-emerald-50 dark:bg-[#081811] border border-emerald-200 dark:border-[#183327] rounded-2xl p-4 flex gap-3 items-start">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
            Role-Based Visibility Active
          </h3>
          <p className="text-xs text-emerald-700/80 dark:text-emerald-200/70 leading-relaxed">
            Because you are logged in as a <strong>{staffUser?.role}</strong>, you have access to {visibleStages.length} attestation modules. 
            When other staff log in, they will only see the scanner specific to their department (e.g., Quality Inspectors will only see the Quality Certification scanner).
          </p>
        </div>
      </div>

      {/* Grid of Scanners */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
        {visibleStages.map((stage) => {
          const Icon = stage.icon;
          
          return (
            <div key={stage.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
              
              {/* Card Header */}
              <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 bg-slate-50 dark:bg-slate-900/50">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-inner shrink-0"
                  style={{ backgroundColor: stage.themeColor }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h2 className="font-bold text-slate-900 dark:text-white text-base">{stage.title}</h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{stage.description}</p>
                </div>
                <button
                  onClick={() => setScanningStageId(stage.id)}
                  className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
                  title={`Scan QR to log ${stage.title}`}
                  style={{ color: stage.themeColor }}
                >
                  <Camera className="w-5 h-5" />
                </button>
              </div>

              {/* Viewfinder UI */}
              <div className="p-6 flex-1 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-black/10">
                <div className="relative w-48 h-48 border-2 border-dashed rounded-2xl flex items-center justify-center mb-6" style={{ borderColor: stage.themeColor }}>
                  <ScanLine className="w-10 h-10 opacity-30 animate-pulse" style={{ color: stage.themeColor }} />
                  
                  {/* Scanning Animation Line */}
                  <motion.div 
                    animate={{ top: ['0%', '100%', '0%'] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-[2px] w-full z-10"
                    style={{ backgroundColor: stage.themeColor, boxShadow: `0 0 10px ${stage.themeColor}` }}
                  />
                  
                  {/* Corner marks */}
                  <div className="absolute top-[-2px] left-[-2px] w-5 h-5 border-t-4 border-l-4 rounded-tl-xl" style={{ borderColor: stage.themeColor }}></div>
                  <div className="absolute top-[-2px] right-[-2px] w-5 h-5 border-t-4 border-r-4 rounded-tr-xl" style={{ borderColor: stage.themeColor }}></div>
                  <div className="absolute bottom-[-2px] left-[-2px] w-5 h-5 border-b-4 border-l-4 rounded-bl-xl" style={{ borderColor: stage.themeColor }}></div>
                  <div className="absolute bottom-[-2px] right-[-2px] w-5 h-5 border-b-4 border-r-4 rounded-br-xl" style={{ borderColor: stage.themeColor }}></div>
                </div>

                <div className="text-center mt-2 w-full">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {isSubmitting === stage.id ? (
                      <span className="flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4 animate-pulse" /> Submitting to Blockchain...
                      </span>
                    ) : (
                      "Click the camera icon to scan a QR code"
                    )}
                  </p>
                  
                  {/* Stage-specific Status Message */}
                  {stageStatuses[stage.id] && (
                    <div className={`mt-4 text-xs p-3 rounded-lg text-left break-all shadow-sm ${stageStatuses[stage.id].type === 'success' ? 'bg-emerald-100/50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200/50'}`}>
                      {stageStatuses[stage.id].text}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction Progress Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md p-4">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-slate-900 p-8 rounded-3xl max-w-sm w-full border border-emerald-500/30 shadow-2xl shadow-emerald-500/20 flex flex-col items-center text-center space-y-6"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-emerald-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-full relative">
                <Loader2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-spin" />
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Processing Transaction</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Cryptographically signing and writing to the Sepolia blockchain. This usually takes 10-15 seconds.
              </p>
            </div>
            
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
              <motion.div 
                className="h-full bg-emerald-500"
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 12, ease: "linear" }}
              />
            </div>
          </motion.div>
        </div>
      )}

      {/* Full Screen Camera Modal for Admin */}
      {scanningStageId && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/90 backdrop-blur-sm p-4">
          <button 
            onClick={() => setScanningStageId(null)}
            className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          
          <h2 className="text-white text-xl font-bold mb-6">Scan Sack QR Code</h2>
          <div className="bg-black/50 p-6 rounded-3xl border border-white/10 shadow-2xl">
            <QrScanner onScanSuccess={handleAdminScan} themeColor="#A3E635" qrbox={200} />
          </div>
          <p className="text-white/60 mt-6 text-sm">Point camera at the printed QR code on the sack</p>
        </div>
      )}
    </div>
  );
};
