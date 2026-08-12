import React from 'react';
import { useStore } from '@nanostores/react';
import { $toasts, removeToast } from '../../../stores/toastStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const toasts = useStore($toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 max-w-sm w-full px-4">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="bg-white border border-[#ebebeb] shadow-lg rounded-xl p-3.5 flex items-start justify-between space-x-3 transition-all duration-200 animate-in fade-in slide-in-from-bottom-2"
        >
          <div className="flex items-start space-x-2.5">
            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />}
            {toast.type === 'info' && <Info className="w-5 h-5 text-[#0070f3] mt-0.5 shrink-0" />}
            <div>
              <h5 className="text-xs font-semibold text-[#171717]">{toast.title}</h5>
              {toast.message && <p className="text-xs text-[#4d4d4d] mt-0.5">{toast.message}</p>}
            </div>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-[#8f8f8f] hover:text-[#171717] transition-colors p-0.5 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
