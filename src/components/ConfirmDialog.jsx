import React from 'react';
import { X, AlertCircle, HelpCircle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

export default function ConfirmDialog() {
 const { confirmDialog, hideConfirm } = useAppContext();

 if (!confirmDialog.isOpen) return null;

 const getIcon = () => {
 if (confirmDialog.danger) return <AlertCircle className="text-rose-500" size={24} />;
 return <HelpCircle className="text-teal" size={24} />;
 };

 return (
 <div className="fixed inset-0 bg-navy/40 backdrop-blur-[2px] flex items-center justify-center z-[10000] p-4 transition-all duration-300">
 <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 scale-100 transition-transform">
 <div className="p-8">
 <div className="flex items-start justify-between mb-6">
 <div className={`p-3 rounded-2xl ${confirmDialog.danger ? 'bg-rose-50' : 'bg-teal/10'}`}>
 {getIcon()}
 </div>
 <button 
 className="p-2 rounded-xl hover:bg-gray-100 transition-colors text-gray-400" 
 onClick={hideConfirm}
 >
 <X size={20} />
 </button>
 </div>

 <h3 className="text-xl font-bold text-navy font-brand mb-2">
 {confirmDialog.title || (confirmDialog.danger ? 'Delete Record?' : 'Are you sure?')}
 </h3>
 <p className="text-gray-500 leading-relaxed text-sm">
 {confirmDialog.message}
 </p>
 </div>

 <div className="flex items-center gap-3 p-6 bg-gray-50/50 border-t border-gray-100">
 <button
 className="flex-1 px-4 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors"
 onClick={hideConfirm}
 >
 CANCEL
 </button>
 <button
 className={`flex-1 px-4 py-3 text-white rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 ${
 confirmDialog.danger 
 ? 'bg-cta hover:bg-cta-dark shadow-cta/20' 
 : 'bg-teal hover:bg-teal-dark shadow-teal/20'
 }`}
 onClick={() => {
 if (confirmDialog.onConfirm) confirmDialog.onConfirm();
 hideConfirm();
 }}
 >
 {confirmDialog.confirmText || (confirmDialog.danger ? 'DELETE' : 'CONFIRM')}
 </button>
 </div>
 </div>
 </div>
 );
}
