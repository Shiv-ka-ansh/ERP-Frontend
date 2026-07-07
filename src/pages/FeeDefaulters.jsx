import React, { useState, useEffect, useMemo } from 'react';
import {
 Search, Download, AlertCircle, MessageSquare, Users,
 IndianRupee, ArrowLeft, RefreshCw, Calendar, Clock, CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { api } from '../api/client';
import { ALL_CLASSES } from '../constants/classes';

const ALL_MONTHS = [
 'April', 'May', 'June', 'July', 'August', 'September',
 'October', 'November', 'December', 'January', 'February', 'March'
];

export default function FeeDefaulters() {
 const { showToast, showConfirm, schoolInfo } = useAppContext();
 const navigate = useNavigate();

 const [data, setData] = useState(null); // full API response
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [activeClass, setActiveClass] = useState('All');
 const [smsSending, setSmsSending] = useState(null); // studentId being processed

 const fetchDefaulters = () => {
 setLoading(true);
 api.fees.defaulters()
 .then(res => setData(res?.data || null))
 .catch(() => showToast('error', 'Failed to load defaulters'))
 .finally(() => setLoading(false));
 };

 useEffect(() => { fetchDefaulters(); }, []);

 const defaulters = data?.defaulters || [];
 const expectedMonths = data?.expectedMonths || [];
 const gracePeriodActive = data?.gracePeriodActive || false;
 const asOfDate = data?.asOfDate ? new Date(data.asOfDate) : new Date();

 // Format "as of" date display
 const asOfStr = asOfDate.toLocaleDateString('en-IN', {
 day: 'numeric', month: 'long', year: 'numeric'
 });
 const currentDay = asOfDate.getDate();
 const gracePeriodEnd = 15;
 const daysLeft = gracePeriodActive ? (gracePeriodEnd - currentDay) : 0;

 // Class filter list
 const classList = useMemo(() => {
 const classes = [...new Set(defaulters.map(d => d.currentClass))].sort((a, b) => {
 const idxA = ALL_CLASSES.indexOf(a);
 const idxB = ALL_CLASSES.indexOf(b);
 if (idxA !== -1 && idxB !== -1) return idxA - idxB;
 if (idxA !== -1) return -1;
 if (idxB !== -1) return 1;
 return a.localeCompare(b, undefined, { numeric: true });
 });

 return ['All', ...classes];
 }, [defaulters]);

 // Filter defaulters
 const filtered = useMemo(() => {
 let list = defaulters;
 if (activeClass !== 'All') list = list.filter(d => d.currentClass === activeClass);
 if (searchTerm.trim()) {
 const q = searchTerm.toLowerCase();
 list = list.filter(d =>
 d.name.toLowerCase().includes(q) ||
 d.admissionNo?.toLowerCase().includes(q)
 );
 }
 return list;
 }, [defaulters, activeClass, searchTerm]);

 const totalOverdue = filtered.reduce((s, d) => s + (d.totalOverdue || 0), 0);

 // SMS Reminder
 const handleSMSReminder = async (student) => {
 if (!student.phone) {
 showToast('error', `No phone number for ${student.name}`);
 return;
 }
 setSmsSending(student.studentId);
 try {
 const overdueList = student.overdueMonths.join(', ');
 await api.communication.sendSms({
 recipient: student.phone,
 message: `Dear Parent, fees for ${overdueList} (₹${student.totalOverdue.toLocaleString()}) are pending for ${student.name}. Please pay by the 15th. — ${schoolInfo.name}`,
 variables: {}
 });
 showToast('success', `SMS sent to ${student.name}'s parent`);
 } catch {
 showToast('error', 'Failed to send SMS');
 } finally {
 setSmsSending(null);
 }
 };

 // Bulk SMS
  const handleBulkSMS = () => {
    const withPhone = filtered.filter(s => s.phone && s.phone.trim().length === 10);
    if (withPhone.length === 0) {
      showToast('error', 'No students with phone numbers in this filter');
      return;
    }
    showConfirm(
      `Send SMS reminder to ${withPhone.length} parents?`,
      async () => {
        setSmsSending('bulk');
        try {
          const results = await Promise.all(
            withPhone.map(async (student) => {
              try {
                const overdueList = student.overdueMonths.join(', ');
                await api.communication.sendSms({
                  recipient: student.phone,
                  message: `Dear Parent, fees for ${overdueList} (₹${student.totalOverdue.toLocaleString()}) are pending for ${student.name}. Please pay by the 15th. — ${schoolInfo.name}`,
                  variables: {}
                });
                return true;
              } catch {
                return false;
              }
            })
          );
          const sent = results.filter(Boolean).length;
          showToast('success', `SMS sent to ${sent} parents`);
        } catch {
          showToast('error', 'Failed to send SMS reminders');
        } finally {
          setSmsSending(null);
        }
      }
    );
  };

 // CSV Export
 const handleExport = () => {
 if (filtered.length === 0) { showToast('error', 'No data to export'); return; }
 const headers = ['Name', 'Admission No', 'Class', 'Section', 'Overdue Months', 'Months Count', 'Monthly Fee', 'Overdue Tuition', 'Unpaid Charges', 'Total Overdue', 'Phone'];
 const rows = filtered.map(d => [
 d.name, d.admissionNo, d.currentClass, d.section,
 `"${d.overdueMonths.join(', ')}"`,
 d.overdueMonthsCount,
 d.monthlyTuition,
 d.overdueMonthsAmount,
 d.unpaidChargesAmount,
 d.totalOverdue,
 d.phone
 ]);
 const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
 const blob = new Blob([csv], { type: 'text/csv' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `fee_defaulters_${asOfDate.toISOString().split('T')[0]}.csv`;
 a.click();
 URL.revokeObjectURL(url);
 showToast('success', 'Defaulters list exported');
 };

 return (
 <div className="min-h-screen">
 {/* Header */}
 <div className="flex items-center gap-3 mb-5">
 <button
 onClick={() => navigate(-1)}
 className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy transition-colors"
 >
 <ArrowLeft size={15} /> Back
 </button>
 <h1 className="font-brand font-bold text-navy text-lg flex items-center gap-2">
 <AlertCircle size={20} className="text-cta" /> Fee Defaulters
 </h1>
 <button
 onClick={fetchDefaulters}
 disabled={loading}
 className="ml-auto p-2 rounded-lg text-gray-400 hover:text-navy hover:bg-gray-100 transition-colors disabled:opacity-50"
 title="Refresh"
 >
 <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
 </button>
 </div>

 {/* Grace Period Banner / Status Bar */}
 {!loading && (
 <div className={`rounded-xl border px-4 py-3 mb-5 flex items-center gap-3 ${
 gracePeriodActive
 ? 'bg-teal/5 border-teal/20'
 : 'bg-rose-50 border-rose-100'
 }`}>
 <div className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
 gracePeriodActive ? 'bg-teal/10' : 'bg-rose-100'
 }`}>
 <Clock size={15} className={gracePeriodActive ? 'text-teal' : 'text-rose-500'} />
 </div>
 <div className="flex-1 min-w-0">
 {gracePeriodActive ? (
 <>
 <p className="text-xs font-bold text-teal">Grace Period Active</p>
 <p className="text-[10px] text-gray-500 mt-0.5">
 Fees for {expectedMonths[expectedMonths.length - 1] || 'current month'} are not yet overdue — {daysLeft} day{daysLeft !== 1 ? 's' : ''} left till 15th
 </p>
 </>
 ) : (
 <>
 <p className="text-xs font-bold text-rose-600">
 Showing defaulters as of {asOfStr}
 </p>
 <p className="text-[10px] text-gray-500 mt-0.5">
 Expected paid months: {expectedMonths.length > 0 ? expectedMonths.join(', ') : 'None'} — Grace period (1–15) has passed
 </p>
 </>
 )}
 </div>
 <div className="text-right shrink-0">
 <div className="flex gap-1.5">
 {ALL_MONTHS.map((m, i) => {
 const isExpected = expectedMonths.includes(m);
 const isCurrent = m === (asOfDate.toLocaleString('en-US', { month: 'long' }));
 return (
 <div
 key={m}
 title={m}
 className={`size-3 rounded-sm text-[7px] flex items-center justify-center font-bold transition-all ${
 isExpected
 ? 'bg-rose-400'
 : isCurrent && !gracePeriodActive
 ? 'bg-rose-200'
 : 'bg-gray-100'
 }`}
 />
 );
 })}
 </div>
 <p className="text-[8px] text-gray-400 mt-1 text-right">Academic months</p>
 </div>
 </div>
 )}

 {/* Summary Stats */}
 <div className="grid grid-cols-3 gap-4 mb-5">
 <div className="bg-white rounded-xl shadow-card p-4 flex items-center gap-3">
 <div className="size-9 rounded-xl bg-cta/10 flex items-center justify-center shrink-0">
 <Users size={18} className="text-cta" />
 </div>
 <div>
 <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Defaulters</p>
 <p className="text-xl font-brand font-bold text-navy">
 {loading ? '—' : filtered.length}
 </p>
 </div>
 </div>
 <div className="bg-white rounded-xl shadow-card p-4 flex items-center gap-3">
 <div className="size-9 rounded-xl bg-cta/10 flex items-center justify-center shrink-0">
 <IndianRupee size={18} className="text-cta" />
 </div>
 <div>
 <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Total Overdue</p>
 <p className="text-xl font-brand font-bold text-navy font-mono">
 {loading ? '—' : `₹${totalOverdue.toLocaleString()}`}
 </p>
 </div>
 </div>
 <div className="bg-white rounded-xl shadow-card p-4 flex items-center gap-3">
 <div className="size-9 rounded-xl bg-teal/10 flex items-center justify-center shrink-0">
 <Calendar size={18} className="text-teal" />
 </div>
 <div>
 <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">Months Due</p>
 <p className="text-xl font-brand font-bold text-navy">
 {loading ? '—' : expectedMonths.length}
 </p>
 </div>
 </div>
 </div>

 {/* Filters + Actions Row */}
 <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
 {/* Class Filter Tabs */}
 <div className="flex items-center gap-2 overflow-x-auto pb-1">
 {classList.map(cls => (
 <button
 key={cls}
 onClick={() => setActiveClass(cls)}
 className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap ${
 activeClass === cls
 ? 'bg-cta text-white'
 : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200'
 }`}
 >
 {cls}
 </button>
 ))}
 </div>
 {/* Search + Action Buttons */}
 <div className="flex items-center gap-2">
 <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 gap-2">
 <Search size={14} className="text-gray-400" />
 <input
 type="text"
 placeholder="Search student..."
 value={searchTerm}
 onChange={e => setSearchTerm(e.target.value)}
 className="border-none bg-transparent text-xs py-2 focus:outline-none w-36"
 />
 </div>
 <button
 onClick={handleBulkSMS}
 disabled={loading || filtered.length === 0}
 className="inline-flex items-center gap-1.5 px-3 py-2 border border-teal text-teal rounded-lg text-xs font-medium hover:bg-teal/10 transition-colors disabled:opacity-40"
 >
 <MessageSquare size={13} /> Bulk SMS
 </button>
 <button
 onClick={handleExport}
 disabled={loading || filtered.length === 0}
 className="inline-flex items-center gap-1.5 px-3 py-2 border border-cta text-cta rounded-lg text-xs font-medium hover:bg-cta/10 transition-colors disabled:opacity-40"
 >
 <Download size={13} /> Export
 </button>
 </div>
 </div>

 {/* Main Table */}
 <div className="bg-white rounded-xl shadow-card overflow-hidden">
 {loading ? (
 <div className="flex items-center justify-center py-16 gap-3 text-gray-400">
 <RefreshCw size={18} className="animate-spin" />
 <span className="text-sm">Calculating defaulters...</span>
 </div>
 ) : gracePeriodActive ? (
 <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
 <div className="size-14 rounded-full bg-teal/10 flex items-center justify-center">
 <CheckCircle2 size={28} className="text-teal" />
 </div>
 <p className="font-brand font-bold text-navy text-sm">Grace Period Active</p>
 <p className="text-gray-400 text-xs max-w-xs">
 No fees are overdue yet. Students have until the 15th of each month to pay.
 Check back after the 15th to see defaulters.
 </p>
 </div>
 ) : filtered.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-16 text-center gap-3">
 <div className="size-14 rounded-full bg-emerald-50 flex items-center justify-center">
 <CheckCircle2 size={28} className="text-emerald-500" />
 </div>
 <p className="font-brand font-bold text-navy text-sm">No Defaulters</p>
 <p className="text-gray-400 text-xs">All students are up to date with their fees.</p>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-gray-50 border-b border-gray-100">
 <tr>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">#</th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Student</th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Class</th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Overdue Months</th>
 <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Remaining Due</th>
 <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
 </tr>
 </thead>
 <tbody>
 {filtered.map((d, idx) => (
 <tr key={String(d.studentId)} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
 <td className="px-4 py-3 text-xs text-gray-400 font-mono">{idx + 1}</td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-2.5">
 <div className="size-7 rounded-full bg-cta/10 flex items-center justify-center text-[11px] font-bold text-cta shrink-0">
 {d.name.charAt(0)}
 </div>
 <div>
 <p className="font-brand font-semibold text-navy text-xs">{d.name}</p>
 <p className="text-[10px] text-gray-400">{d.admissionNo}</p>
 </div>
 </div>
 </td>
 <td className="px-4 py-3">
 <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-medium">
 {d.currentClass}{d.section ? `-${d.section}` : ''}
 </span>
 </td>
 <td className="px-4 py-3">
 <div className="flex flex-wrap gap-1">
 {d.overdueMonths.map(m => (
 <span key={m} className="text-[10px] bg-rose-50 text-rose-600 border border-rose-100 px-1.5 py-0.5 rounded-full font-medium">
 {m.slice(0, 3)}
 </span>
 ))}
 {d.unpaidChargesAmount > 0 && (
 <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-100 px-1.5 py-0.5 rounded-full font-medium">
 +Charges
 </span>
 )}
 </div>
 <p className="text-[9px] text-gray-400 mt-0.5">
 {d.overdueMonthsCount} month{d.overdueMonthsCount !== 1 ? 's' : ''} × ₹{d.monthlyTuition.toLocaleString()}
 {d.unpaidChargesAmount > 0 ? ` + ₹${d.unpaidChargesAmount.toLocaleString()} charges` : ''}
 </p>
 </td>
 <td className="px-4 py-3 text-right">
 <span className="font-mono font-bold text-cta text-sm">
 ₹{d.totalOverdue.toLocaleString()}
 </span>
 </td>
 <td className="px-4 py-3 text-right">
 <button
 onClick={() => handleSMSReminder(d)}
 disabled={smsSending === d.studentId || !d.phone}
 className="inline-flex items-center gap-1 px-2.5 py-1.5 text-teal hover:bg-teal/10 rounded-lg text-xs font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
 title={!d.phone ? 'No phone number' : 'Send SMS reminder'}
 >
 <MessageSquare size={12} />
 {smsSending === d.studentId ? 'Sending...' : 'SMS'}
 </button>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>

 {/* Footer note */}
 {!loading && !gracePeriodActive && filtered.length > 0 && (
 <p className="text-[10px] text-gray-400 text-center mt-3">
 Defaulter : students who have not paid fees for any month up to {expectedMonths[expectedMonths.length - 1]} by the 15th of the following month.
 </p>
 )}
 </div>
 );
}

