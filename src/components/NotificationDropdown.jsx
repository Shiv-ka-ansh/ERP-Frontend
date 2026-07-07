import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Cake, IndianRupee, Calendar, ClipboardCheck, X, ChevronRight, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { useAppContext } from '../context/AppContext';

const TYPE_CFG = {
  Birthday: { icon: Cake, color: 'text-pink-500', bg: 'bg-pink-50' },
  Fee: { icon: IndianRupee, color: 'text-cta', bg: 'bg-cta/10' },
  Event: { icon: Calendar, color: 'text-teal', bg: 'bg-teal/10' },
  Leave: { icon: ClipboardCheck, color: 'text-amber-500', bg: 'bg-amber-50' },
};

export default function NotificationDropdown({ onClose }) {
  const navigate = useNavigate();
  const { unreadNotifications, dismissNotification, markAllNotificationsAsRead, loadNotifications } = useAppContext();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    loadNotifications().finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const notifications = unreadNotifications;

  return (
  <div className="absolute top-full mt-2 right-0 w-80 sm:w-96 bg-white rounded-2xl shadow-modal border border-gray-100 overflow-hidden flex flex-col z-50 animate-in fade-in slide-in-from-top-2 duration-200">
  {/* Header */}
  <div className="px-4 py-3 bg-navy flex items-center justify-between">
  <div className="flex items-center gap-2">
  <Bell size={16} className="text-white/70" />
  <h3 className="text-white font-brand font-semibold text-sm">Notifications</h3>
  {notifications.length > 0 && (
  <span className="bg-cta text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
  {notifications.length}
  </span>
  )}
  </div>
  <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
  <X size={16} />
  </button>
  </div>

  {/* Body */}
  <div className="max-h-[400px] overflow-y-auto custom-scrollbar bg-white">
  {loading ? (
  <div className="p-8 text-center">
  <div className="size-6 border-2 border-teal border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
  <p className="text-xs text-gray-400">Updating alerts...</p>
  </div>
  ) : notifications.length === 0 ? (
  <div className="p-10 text-center">
  <div className="size-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
  <CheckCircle2 size={24} className="text-gray-200" />
  </div>
  <p className="text-navy font-brand font-semibold text-sm">All caught up!</p>
  <p className="text-gray-400 text-xs mt-1">No new notifications for you today.</p>
  </div>
  ) : (
  <div className="divide-y divide-gray-50">
  {notifications.map((n) => {
  const cfg = TYPE_CFG[n.type] || { icon: Info, color: 'text-gray-500', bg: 'bg-gray-50' };
  const Icon = cfg.icon;
  return (
  <div 
  key={n.id} 
  className="p-4 hover:bg-gray-50 transition-colors cursor-pointer group relative flex gap-3 items-start"
  onClick={() => {
  if (n.path) navigate(n.path);
  onClose();
  }}
  >
  <div className={`p-2 rounded-xl ${cfg.bg} ${cfg.color} shrink-0`}>
  <Icon size={18} />
  </div>
  <div className="flex-1 min-w-0">
  <div className="flex justify-between items-start mb-0.5">
  <p className="text-xs font-bold text-navy truncate pr-4">{n.title}</p>
  {n.priority === 'high' && (
  <span className="shrink-0 size-1.5 rounded-full bg-cta mt-1"></span>
  )}
  </div>
  <p className="text-[11px] text-gray-500 leading-relaxed">{n.description}</p>
  </div>
  <button 
    onClick={(e) => {
      e.stopPropagation();
      dismissNotification(n.id);
    }}
    className="self-center p-1 rounded-lg hover:bg-gray-200 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
    title="Dismiss"
  >
    <X size={14} />
  </button>
  </div>
  );
  })}
  </div>
  )}
  </div>

  {/* Footer */}
  {notifications.length > 0 && (
  <div className="p-3 bg-gray-50 border-t border-gray-100 text-center">
  <button 
  className="text-[11px] font-semibold text-teal hover:text-teal-dark font-brand uppercase tracking-wider"
  onClick={() => {
    markAllNotificationsAsRead();
    onClose();
  }}
  >
  Mark all as read
  </button>
  </div>
  )}
  </div>
  );
}
