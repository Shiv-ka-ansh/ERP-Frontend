import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Plus, CheckCircle2, AlertCircle, Printer, X } from "lucide-react";
import { api } from "../api/client";
import { useAppContext } from "../context/AppContext";
import CustomSelect from "../components/ui/CustomSelect";
import CustomDatePicker from "../components/ui/CustomDatePicker";

const MONTHS_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function TeacherSalary() {
 const { teachers, showToast, schoolInfo } = useAppContext();
 const [selectedTeacher, setSelectedTeacher] = useState(null);
 const [payMode, setPayMode] = useState("Bank Transfer");
 const [month, setMonth] = useState(new Date().getMonth() + 1); // 1-indexed
 const [year, setYear] = useState(new Date().getFullYear());
 const [salaryPayments, setSalaryPayments] = useState([]);

 useEffect(() => {
 api.payroll
 .list({ page: 1, limit: 500 })
 .then((res) => setSalaryPayments(res?.data || []))
 .catch(() => setSalaryPayments([]));
 }, []);

 const getInitials = (name = '') => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

 const handlePrevMonth = () => {
 if (month === 1) { setMonth(12); setYear(y => y - 1); }
 else setMonth(m => m - 1);
 };

 const handleNextMonth = () => {
 if (month === 12) { setMonth(1); setYear(y => y + 1); }
 else setMonth(m => m + 1);
 };

 const monthLabel = MONTHS_NAMES[month - 1];

 const teacherRows = (teachers || []).map((t) => {
 const gross = (t.basic || 0) + (t.hra || 0) + (t.allowances || 0);
 const net = gross - (t.deductions || 0);
 const payment = (salaryPayments || []).find((p) => String(p.staffId) === String(t.id) && Number(p.month) === month && Number(p.year) === year);
 return {
 id: t.id,
 staffId: t.staffId || '—',
 init: getInitials(t.name),
 name: t.name,
 subject: t.subject,
 basic: t.basic || 0,
 hra: t.hra || 0,
 allowances: t.allowances || 0,
 deductions: t.deductions || 0,
 salary: net,
 status: payment ? 'paid' : 'unpaid',
 date: payment?.paidDate ? new Date(payment.paidDate).toLocaleDateString('en-IN') : null
 };
 });

 const handlePaySalary = async () => {
 const dateStr = selectedTeacher?.payDate
 ? new Date(selectedTeacher.payDate).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
 : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });
 
 try {
 const modeMap = {
 "Bank Transfer": "BANK_TRANSFER",
 Cash: "CASH",
 Cheque: "BANK_TRANSFER"
 };

 await api.payroll.create({
 staffId: selectedTeacher.id,
 month: month,
 year: year,
 amount: selectedTeacher.salary,
 mode: modeMap[payMode] || 'BANK_TRANSFER',
 paidDate: selectedTeacher?.payDate ? new Date(selectedTeacher.payDate).toISOString() : new Date().toISOString(),
 remarks: `Salary for ${selectedTeacher.name} - ${month}/${year}`
 });

 // Refresh payments so table updates
 const res = await api.payroll.list({ page: 1, limit: 500 });
 setSalaryPayments(res?.data || []);

 setSelectedTeacher({
 ...selectedTeacher,
 type: "slip",
 status: "paid",
 date: dateStr
 });
 showToast('success', 'Salary recorded successfully.');
 } catch {
 showToast('error', 'Failed to save transaction');
 }
 };

 return (
 <div className="min-h-screen">
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-xl font-bold text-navy font-brand">Teacher Salary — {monthLabel} {year}</h1>
 <div className="flex items-center gap-3">
 <div className="flex items-center gap-2">
 <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500" onClick={handlePrevMonth}><ChevronLeft size={16} /></button>
 <span className="font-brand text-navy text-sm font-semibold">{monthLabel.substring(0, 3)} {year}</span>
 <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500" onClick={handleNextMonth}><ChevronRight size={16} /></button>
 </div>
 <button className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors"><Plus size={18} /> Add Teacher</button>
 </div>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
 <div className="bg-white rounded-xl shadow-card p-4"><span className="text-xs text-gray-400">Total Teachers</span><span className="block font-brand text-xl font-bold text-navy">{teacherRows.length}</span></div>
 <div className="bg-white rounded-xl shadow-card p-4 border-l-4 border-emerald-500"><span className="text-xs text-gray-400">Paid</span><span className="flex items-center gap-1 font-brand text-xl font-bold text-emerald-500">{teacherRows.filter(t => t.status === 'paid').length} <CheckCircle2 size={16} /></span></div>
 <div className="bg-white rounded-xl shadow-card p-4 border-l-4 border-cta"><span className="text-xs text-gray-400">Unpaid</span><span className="flex items-center gap-1 font-brand text-xl font-bold text-cta">{teacherRows.filter(t => t.status === 'unpaid').length} <AlertCircle size={16} /></span></div>
 <div className="bg-white rounded-xl shadow-card p-4"><span className="text-xs text-gray-400">Total Payable</span><span className="block font-mono text-navy font-semibold">₹{teacherRows.reduce((sum, t) => sum + (t.salary || 0), 0).toLocaleString()}</span></div>
 <div className="bg-white rounded-xl shadow-card p-4"><span className="text-xs text-gray-400">Paid Amount</span><span className="block font-mono text-emerald-500 font-semibold">₹{teacherRows.filter(t => t.status === 'paid').reduce((sum, t) => sum + (t.salary || 0), 0).toLocaleString()}</span></div>
 </div>

 <div className="bg-white rounded-xl shadow-card overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-gray-50 border-b border-gray-100">
 <tr>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">Photo</th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Staff ID</th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Teacher Name</th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Salary</th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
 <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
 </tr>
 </thead>
 <tbody>
 {teacherRows.length === 0 && (
 <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-400">No teachers found. Add teachers from the Staff module.</td></tr>
 )}
 {teacherRows.map((teacher) => (
 <tr key={teacher.id} className="border-b border-gray-50 hover:bg-gray-50">
 <td className="px-4 py-3"><div className="size-8 rounded-full bg-teal/10 text-teal flex items-center justify-center text-xs font-bold">{teacher.init}</div></td>
 <td className="px-4 py-3 font-mono text-xs text-gray-500">{teacher.staffId}</td>
 <td className="px-4 py-3 font-brand text-sm">{teacher.name}</td>
 <td className="px-4 py-3 text-gray-500">{teacher.subject}</td>
 <td className="px-4 py-3 font-mono font-semibold">₹{teacher.salary.toLocaleString()}</td>
 <td className="px-4 py-3">
 {teacher.status === "paid" ? (
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal/10 text-teal text-xs font-medium rounded-full"><CheckCircle2 size={12} /> Paid on {teacher.date}</span>
 ) : (
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cta/10 text-cta text-xs font-medium rounded-full"><AlertCircle size={12} /> Unpaid</span>
 )}
 </td>
 <td className="px-4 py-3 text-right">
 <div className="flex items-center gap-2 justify-end">
 {teacher.status === "unpaid" && (
 <button className="inline-flex items-center gap-1 px-3 py-1.5 border border-navy text-navy rounded-lg text-xs font-medium hover:bg-navy/5 transition-colors" onClick={() => setSelectedTeacher({ ...teacher, type: "mark" })}>Mark Paid</button>
 )}
 <button className="inline-flex items-center gap-1 px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-xs font-medium transition-colors" onClick={() => setSelectedTeacher({ ...teacher, type: "slip" })}>View Slip</button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* Mark Paid Modal */}
 {selectedTeacher && selectedTeacher.type === "mark" && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-2xl shadow-modal w-full max-w-md">
 <div className="flex items-center justify-between p-6 bg-navy rounded-t-2xl">
 <h3 className="font-brand text-white text-sm font-semibold">Mark Salary Paid</h3>
 <button className="p-1 text-white/70 hover:text-white transition-colors" onClick={() => setSelectedTeacher(null)}><X size={20} /></button>
 </div>
 <div className="p-6">
 <p className="text-gray-700 text-sm">Mark salary paid for <strong>{selectedTeacher.name}</strong>?</p>
 <div className="bg-gray-50 rounded-xl p-4 mt-4">
 <div className="flex justify-between mb-2"><span className="text-sm text-gray-500">Amount:</span><span className="font-mono font-bold">₹{selectedTeacher.salary.toLocaleString()}</span></div>
 <div className="flex justify-between"><span className="text-sm text-gray-500">Month:</span><span className="font-semibold">{monthLabel} {year}</span></div>
 </div>
 <div className="flex flex-col gap-1 mt-4">
 <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payment Date</span>
 <CustomDatePicker 
 selected={selectedTeacher?.payDate || new Date()} 
 onChange={date => setSelectedTeacher({...selectedTeacher, payDate: date})} 
 />
 </div>
 <div className="flex flex-col gap-1 mt-4">
 <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Payment Mode</span>
 <CustomSelect 
 value={payMode} 
 onChange={setPayMode} 
 options={['Bank Transfer', 'Cash', 'Cheque']}
 />
 </div>
 </div>
 <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
 <button className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors" onClick={() => setSelectedTeacher(null)}>Cancel</button>
 <button className="px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors" onClick={handlePaySalary}>Confirm & Generate Slip</button>
 </div>
 </div>
 </div>
 )}

 {/* Salary Slip Modal */}
 {selectedTeacher && selectedTeacher.type === "slip" && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-2xl shadow-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between p-6 bg-navy rounded-t-2xl">
 <h3 className="font-brand text-white text-sm font-semibold">Salary Slip</h3>
 <button className="p-1 text-white/70 hover:text-white transition-colors" onClick={() => setSelectedTeacher(null)}><X size={20} /></button>
 </div>
 <div className="p-6 bg-gray-50 flex justify-center">
 <div className="bg-white mx-auto shadow-card a4-paper" style={{ width: '100%', maxWidth: '210mm', padding: '15mm' }}>
 <div className="flex items-center gap-4 pb-4 border-b-2 border-teal mb-6">
 <div className="size-14 rounded-xl flex items-center justify-center shrink-0">
 <img src={schoolInfo.logoUrl} alt="Logo" className="size-full object-contain" />
 </div>
 <div><h1 className="text-xl font-bold text-navy font-brand">{schoolInfo.name}</h1><p className="text-xs text-gray-500">{schoolInfo.address}</p></div>
 </div>
 <h2 className="text-center font-brand font-bold text-lg text-navy mb-4">SALARY SLIP — {monthLabel.toUpperCase()} {year}</h2>
 <div className="flex justify-between text-sm mb-6">
 <div><p><strong>Employee:</strong> {selectedTeacher.name}</p><p><strong>Staff ID:</strong> {selectedTeacher.staffId}</p><p><strong>Designation:</strong> TGT {selectedTeacher.subject}</p></div>
 <div className="text-right"><p><strong>Pay Date:</strong> {selectedTeacher.date || new Date().toLocaleDateString('en-IN')}</p><p><strong>Mode:</strong> {payMode}</p></div>
 </div>
 <div className="grid grid-cols-2 gap-6 mb-6">
 <table className="w-full text-sm border-collapse"><thead><tr className="border-b-2 border-navy"><th className="text-left py-2">Earnings</th><th className="text-right py-2">Amount</th></tr></thead><tbody>
 <tr className="border-b border-gray-100"><td className="py-2">Basic Pay</td><td className="text-right py-2">₹{(selectedTeacher.basic || 0).toLocaleString()}</td></tr>
 <tr className="border-b border-gray-100"><td className="py-2">HRA</td><td className="text-right py-2">₹{(selectedTeacher.hra || 0).toLocaleString()}</td></tr>
 <tr className="border-b border-gray-100"><td className="py-2">Allowances</td><td className="text-right py-2">₹{(selectedTeacher.allowances || 0).toLocaleString()}</td></tr>
 </tbody></table>
 <table className="w-full text-sm border-collapse"><thead><tr className="border-b-2 border-navy"><th className="text-left py-2">Deductions</th><th className="text-right py-2">Amount</th></tr></thead><tbody>
 <tr className="border-b border-gray-100"><td className="py-2">Total Deductions</td><td className="text-right py-2">₹{(selectedTeacher.deductions || 0).toLocaleString()}</td></tr>
 </tbody></table>
 </div>
 <div className="flex justify-between py-4 border-y-2 border-navy"><h3 className="font-brand">Net Payable</h3><h3 className="font-brand text-teal text-2xl">₹{selectedTeacher.salary.toLocaleString()}</h3></div>
 <div className="flex items-end justify-between mt-16">
 <div className="text-center"><div className="border-b border-black w-36 mb-2"></div><p className="text-xs">Teacher's Signature</p></div>
 <div className="text-center"><div className="border-b border-black w-36 mb-2"></div><p className="text-xs">Principal's Signature</p></div>
 </div>
 </div>
 </div>
 <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
 <button className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors" onClick={() => setSelectedTeacher(null)}>Close</button>
 <button className="inline-flex items-center gap-2 px-4 py-2 border border-cta text-cta rounded-lg text-sm font-medium hover:bg-cta/10 transition-colors" onClick={() => window.print()}><Printer size={18} /> Print Slip</button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}

