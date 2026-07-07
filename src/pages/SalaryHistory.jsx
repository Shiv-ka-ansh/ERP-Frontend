import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, History, Printer, X, Wallet, FileText, Trash2, Edit2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import CustomSelect from '../components/ui/CustomSelect';
import { api } from '../api/client';

export default function SalaryHistory() {
 const navigate = useNavigate();
 const { teachers, showToast, showConfirm, schoolInfo } = useAppContext();
 
 const [payments, setPayments] = useState([]);
 const [selectedTeacherId, setSelectedTeacherId] = useState('All');
 const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
 
 // Salary Slip Modal
 const [showSlip, setShowSlip] = useState(false);
 const [slipData, setSlipData] = useState(null);
 
 // Edit Modal
 const [showEdit, setShowEdit] = useState(false);
 const [editData, setEditData] = useState(null);
 const [editAmount, setEditAmount] = useState('');
 const [editMode, setEditMode] = useState('');
 const [saving, setSaving] = useState(false);
 const [deletingId, setDeletingId] = useState(null);

 useEffect(() => {
 // Load all payments
 api.payroll
 .list({ page: 1, limit: 500 })
 .then((res) => setPayments((res?.data || []).map((p) => ({ ...p, id: p._id }))))
 .catch(() => showToast('error', 'Failed to load salary history'));
 }, [showToast]);

 const filteredPayments = useMemo(() => {
 return payments.filter(p => {
 const matchTeacher = selectedTeacherId === 'All' || String(p.staffId) === String(selectedTeacherId);
 const matchYear = String(p.year) === String(selectedYear);
 return matchTeacher && matchYear;
 }).sort((a, b) => new Date(b.paidDate) - new Date(a.paidDate));
 }, [payments, selectedTeacherId, selectedYear]);

 const getTeacher = (id) => teachers.find(t => String(t.id) === String(id)) || { name: 'Unknown Teacher' };

 // Summary logic
 const annualTotalPaid = filteredPayments.reduce((sum, p) => sum + p.amount, 0);

 const openSalarySlip = (payment) => {
 const teacher = getTeacher(payment.staffId);
 setSlipData({ ...payment, teacher });
 setShowSlip(true);
 };

 const handleExport = () => {
 const headers = ['Date', 'Teacher', 'Month', 'Year', 'Amount', 'Mode', 'Remarks'];
 const rows = filteredPayments.map(p => [
 new Date(p.paidDate).toLocaleDateString(),
 getTeacher(p.staffId).name,
 p.month,
 p.year,
 p.amount,
 p.mode,
 p.remarks || ''
 ]);
 const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
 const blob = new Blob([csv], { type: 'text/csv' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `salary_history_${selectedYear}.csv`;
 a.click();
 URL.revokeObjectURL(url);
 showToast('success', 'Salary history exported');
 };

  const handleDeletePayment = (payment) => {
    showConfirm(
      `Delete salary payment for ${getTeacher(payment.staffId).name} (${payment.month}/${payment.year})? This action cannot be undone.`,
      async () => {
        setDeletingId(payment.id);
        try {
          await api.payroll.remove(payment.id);
          setPayments(prev => prev.filter(p => p.id !== payment.id));
          showToast('success', 'Salary payment deleted');
        } catch (err) {
          showToast('error', err?.message || 'Failed to delete payment');
        } finally {
          setDeletingId(null);
        }
      }
    );
  };

 const handleEditPayment = (payment) => {
 setEditData(payment);
 setEditAmount(payment.amount.toString());
 setEditMode(payment.mode);
 setShowEdit(true);
 };

 const handleSaveEdit = async () => {
 if (!editData) return;
 setSaving(true);
 try {
 await api.payroll.update(editData.id, {
 amount: Number(editAmount),
 mode: editMode
 });
 setPayments(prev => prev.map(p => p.id === editData.id ? { ...p, amount: Number(editAmount), mode: editMode } : p));
 showToast('success', 'Salary payment updated');
 setShowEdit(false);
 setEditData(null);
 } catch (err) {
 showToast('error', err?.message || 'Failed to update payment');
 } finally {
 setSaving(false);
 }
 };

 return (
 <div className="min-h-screen">
 <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-4 transition-colors">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg> Back
 </button>
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-xl font-bold text-navy font-brand flex items-center gap-2">
 <History size={24} className="text-cta" /> Salary Payment History
 </h1>
 <button onClick={handleExport} className="inline-flex items-center gap-2 px-4 py-2 border border-cta text-cta rounded-lg text-sm font-medium hover:bg-cta/10 transition-colors">
 <Download size={18} /> Export CSV
 </button>
 </div>

 {/* Summary Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
 <div className="bg-white rounded-xl shadow-card p-5 flex items-center gap-4">
 <div className="size-10 rounded-xl bg-cta/10 flex items-center justify-center"><Wallet size={20} className="text-cta" /></div>
 <div>
 <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">Annual Total Paid ({selectedYear})</p>
 <p className="text-2xl font-brand font-bold text-navy font-mono">₹{annualTotalPaid.toLocaleString()}</p>
 </div>
 </div>
 </div>

 {/* Filters */}
 <div className="bg-white rounded-xl shadow-card p-4 mb-6 flex flex-wrap gap-4 items-end">
 <div className="flex flex-col gap-1 w-64 z-20">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Filter by Teacher</label>
 <CustomSelect 
 value={selectedTeacherId} 
 onChange={val => setSelectedTeacherId(val)}
 options={[
 { label: 'All Teachers', value: 'All' },
 ...teachers.map(t => ({ label: `${t.name} (ID: ${t.id})`, value: t.id }))
 ]}
 />
 </div>
 <div className="flex flex-col gap-1 w-32 z-20">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Year</label>
 <CustomSelect 
 value={selectedYear} 
 onChange={val => setSelectedYear(val)}
 options={['2026', '2025', '2024']}
 className="text-center"
 />
 </div>
 </div>

 {/* History Table */}
 <div className="bg-white rounded-xl shadow-card overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-gray-50 border-b border-gray-100">
 <tr>
 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Paid Date</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Teacher</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">For Month</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Amount</th>
 <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Mode</th>
 <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
 </tr>
 </thead>
 <tbody>
 {filteredPayments.length === 0 && (
 <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-400">No payment history found for the selected filters.</td></tr>
 )}
 {filteredPayments.map(p => (
 <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50">
 <td className="px-6 py-4 text-gray-600">{new Date(p.paidDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
 <td className="px-6 py-4 font-brand font-semibold text-navy">{getTeacher(p.staffId).name}</td>
 <td className="px-6 py-4 text-gray-600">{p.month} {p.year}</td>
 <td className="px-6 py-4 font-brand font-mono font-semibold text-cta">₹{(p.amount || 0).toLocaleString()}</td>
 <td className="px-6 py-4">
 <span className="bg-gray-100 text-gray-600 rounded-lg px-2.5 py-1 text-xs font-medium">{p.mode}</span>
 </td>
 <td className="px-6 py-4 text-right">
 <div className="flex items-center gap-1 justify-end">
 <button onClick={() => openSalarySlip(p)} className="inline-flex items-center gap-1 p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors" title="View Slip">
 <FileText size={15} />
 </button>
 <button onClick={() => handleEditPayment(p)} className="inline-flex items-center gap-1 p-1.5 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600 transition-colors" title="Edit Payment">
 <Edit2 size={15} />
 </button>
 <button
 onClick={() => handleDeletePayment(p)}
 disabled={deletingId === p.id}
 className="inline-flex items-center gap-1 p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
 title="Delete Payment"
 >
 <Trash2 size={15} />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* Salary Slip Modal */}
 {showSlip && slipData && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg">
 <div className="flex items-center justify-between p-6 bg-navy rounded-t-2xl print:hidden">
 <h3 className="font-brand text-white text-sm font-semibold">Salary Slip - {slipData.month} {slipData.year}</h3>
 <div className="flex gap-2">
 <button onClick={() => window.print()} className="p-1 hover:bg-white/10 rounded text-white transition-colors" title="Print"><Printer size={18} /></button>
 <button onClick={() => setShowSlip(false)} className="p-1 hover:bg-white/10 rounded text-white/70 hover:text-white transition-colors"><X size={20} /></button>
 </div>
 </div>

 <div className="p-8 print:p-0">
 {/* Print Layout */}
 <div className="text-center mb-6">
 <h2 className="font-brand font-bold text-2xl text-navy">{schoolInfo.name.toUpperCase()}</h2>
 <p className="text-sm text-gray-500">Salary Slip for the month of {slipData.month} {slipData.year}</p>
 </div>
 
 <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
 <div>
 <p className="text-gray-500 mb-1">Employee Name:</p>
 <p className="font-brand font-semibold text-navy">{slipData.teacher.name}</p>
 </div>
 <div>
 <p className="text-gray-500 mb-1">Payment Date:</p>
 <p className="font-brand font-semibold text-navy">{new Date(slipData.paidDate).toLocaleDateString('en-IN')}</p>
 </div>
 <div>
 <p className="text-gray-500 mb-1">Payment Mode:</p>
 <p className="font-brand font-semibold text-navy">{slipData.mode}</p>
 </div>
 <div>
 <p className="text-gray-500 mb-1">Transaction Ref:</p>
 <p className="font-brand font-semibold text-navy">{slipData.id.toString().padStart(6, '0')}</p>
 </div>
 </div>

 <div className="border border-gray-200 rounded-lg overflow-hidden mb-6">
 <table className="w-full text-sm">
 <thead className="bg-gray-50 border-b border-gray-200">
 <tr>
 <th className="px-4 py-3 text-left font-semibold text-navy">Earnings</th>
 <th className="px-4 py-3 text-right font-semibold text-navy">Amount (₹)</th>
 </tr>
 </thead>
 <tbody>
 <tr className="border-b border-gray-100">
 <td className="px-4 py-3 text-gray-600">Basic Pay</td>
 <td className="px-4 py-3 text-right font-mono text-gray-800">{(slipData.teacher.basic || 0).toLocaleString()}</td>
 </tr>
 <tr className="border-b border-gray-100">
 <td className="px-4 py-3 text-gray-600">HRA</td>
 <td className="px-4 py-3 text-right font-mono text-gray-800">{(slipData.teacher.hra || 0).toLocaleString()}</td>
 </tr>
 <tr className="border-b border-gray-100">
 <td className="px-4 py-3 text-gray-600">Other Allowances</td>
 <td className="px-4 py-3 text-right font-mono text-gray-800">{(slipData.teacher.allowances || 0).toLocaleString()}</td>
 </tr>
 <tr className="border-b border-gray-200 bg-gray-50">
 <th className="px-4 py-3 text-left font-semibold text-navy">Total Gross Earnings</th>
 <th className="px-4 py-3 text-right font-mono font-bold text-navy">
 {((slipData.teacher.basic || 0) + (slipData.teacher.hra || 0) + (slipData.teacher.allowances || 0)).toLocaleString()}
 </th>
 </tr>
 <tr className="border-b border-gray-100">
 <td className="px-4 py-3 text-gray-600">Less: Deductions</td>
 <td className="px-4 py-3 text-right font-mono text-cta -font-bold">-{(slipData.teacher.deductions || 0).toLocaleString()}</td>
 </tr>
 <tr className="bg-cta/5 border-t-2 border-cta">
 <th className="p-4 text-left font-brand font-bold text-cta text-base">Net Salary Paid</th>
 <th className="p-4 text-right font-mono font-bold text-cta text-lg">₹{(slipData.amount || 0).toLocaleString()}</th>
 </tr>
 </tbody>
 </table>
 </div>
 
 <div className="flex justify-between mt-12 pt-4 border-t border-gray-200 px-4 print:mt-16">
 <div className="text-center">
 <div className="w-32 border-b border-gray-300 mb-2"></div>
 <p className="text-xs text-gray-500 font-medium">Employer Signature</p>
 </div>
 <div className="text-center">
 <div className="w-32 border-b border-gray-300 mb-2"></div>
 <p className="text-xs text-gray-500 font-medium">Employee Signature</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 )}
 {/* Edit Payment Modal */}
 {showEdit && editData && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-2xl shadow-modal w-full max-w-md">
 <div className="flex items-center justify-between p-6 bg-navy rounded-t-2xl">
 <h3 className="font-brand text-white text-sm font-semibold">Edit Salary Payment</h3>
 <button className="p-1 text-white/70 hover:text-white transition-colors" onClick={() => { setShowEdit(false); setEditData(null); }}><X size={20} /></button>
 </div>
 <div className="p-6">
 <p className="text-gray-700 text-sm mb-4">Editing payment for <strong>{getTeacher(editData.staffId).name}</strong> — {editData.month}/{editData.year}</p>
 <div className="flex flex-col gap-4">
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Amount (₹)</label>
 <input type="number" value={editAmount} onChange={e => setEditAmount(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20" />
 </div>
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payment Mode</label>
 <CustomSelect value={editMode} onChange={setEditMode} options={['CASH', 'UPI', 'BANK_TRANSFER']} />
 </div>
 </div>
 </div>
 <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
 <button className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors" onClick={() => { setShowEdit(false); setEditData(null); }}>Cancel</button>
 <button className="px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors disabled:opacity-50" onClick={handleSaveEdit} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}

