import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export default function Toast({ toast, onClose }) {
 useEffect(() => {
 if (toast) {
 const timer = setTimeout(() => {
 onClose();
 }, 4000);
 return () => clearTimeout(timer);
 }
 }, [toast, onClose]);

 if (!toast) return null;

 const config = {
 success: {
 bg: 'bg-emerald-500/90',
 icon: <CheckCircle2 size={18} />,
 label: 'Success'
 },
 error: {
 bg: 'bg-rose-500/90',
 icon: <AlertCircle size={18} />,
 label: 'Error'
 },
 warning: {
 bg: 'bg-amber-500/90',
 icon: <AlertTriangle size={18} />,
 label: 'Warning'
 },
 info: {
 bg: 'bg-sky-500/90',
 icon: <Info size={18} />,
 label: 'Info'
 }
 };

 const current = config[toast.type] || config.info;

 return (
 <div className="fixed top-6 right-6 z-[9999] animate-in fade-in slide-in-from-right-8 duration-300">
 <div className={`${current.bg} text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[300px] backdrop-blur-md border border-white/20`}>
 <div className="shrink-0 size-8 bg-white/20 rounded-xl flex items-center justify-center">
 {current.icon}
 </div>
 <div className="flex-1">
 <p className="text-[10px] font-bold uppercase tracking-wider opacity-70 leading-none mb-1">
 {current.label}
 </p>
 <p className="text-sm font-medium leading-tight">
 {toast.message}
 </p>
 </div>
 <button 
 onClick={onClose}
 className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
 >
 <X size={16} />
 </button>
 </div>
 </div>
 );
}
