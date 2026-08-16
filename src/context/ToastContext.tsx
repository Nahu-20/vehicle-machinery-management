import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';

export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface ToastMessage {
  id: string;
  title?: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, title?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToastMessage = { id, message, type, title };

    setToasts((prev) => [...prev, newToast]);

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  // Handle ESC key to dismiss top toast
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && toasts.length > 0) {
        removeToast(toasts[toasts.length - 1].id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toasts, removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}

      {/* Toast Container */}
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-[calc(100vw-2.5rem)] pointer-events-none"
      >
        {toasts.map((toast) => {
          const getBgColor = () => {
            switch (toast.type) {
              case 'success':
                return 'bg-emerald-900 border-emerald-700 text-white';
              case 'warning':
                return 'bg-amber-900 border-amber-700 text-white';
              case 'error':
                return 'bg-red-900 border-red-700 text-white';
              case 'info':
              default:
                return 'bg-[#063D2A] border-[#087A4B] text-white';
            }
          };

          const getIcon = () => {
            switch (toast.type) {
              case 'success':
                return <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />;
              case 'warning':
                return <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />;
              case 'error':
                return <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />;
              case 'info':
              default:
                return <Info className="h-5 w-5 text-[#D7A928] shrink-0" />;
            }
          };

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-2xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 ${getBgColor()}`}
            >
              <div className="flex items-start gap-3">
                {getIcon()}
                <div className="space-y-0.5">
                  {toast.title && <h4 className="text-xs font-black uppercase tracking-wider text-emerald-200">{toast.title}</h4>}
                  <p className="text-xs sm:text-sm font-semibold leading-snug">{toast.message}</p>
                </div>
              </div>

              <button
                onClick={() => removeToast(toast.id)}
                aria-label="Close notification"
                className="min-h-[44px] min-w-[44px] -m-2 flex items-center justify-center rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
