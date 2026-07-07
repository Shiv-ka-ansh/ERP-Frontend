import React, { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { api } from "../api/client";
import { ALL_CLASSES } from "../constants/classes";

export default function FeeStructure() {
 const { showToast, showConfirm, feeStructures, refreshFeeStructures } =
 useAppContext();
 const [loading, setLoading] = useState(true);
 const [showModal, setShowModal] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [expandedRow, setExpandedRow] = useState(null);

 // Modal form state
 const [formData, setFormData] = useState({
 classes: [],
 academicYear: "2026-27",
 monthlyTuition: "",
 annualCharges: [{ name: "", amount: "" }],
 });

 useEffect(() => {
 refreshFeeStructures()
  .then(() => setLoading(false))
  .catch((err) => console.error("Error:", err));
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);



 const openAddModal = () => {
 setEditingId(null);
 setFormData({
 classes: [],
 academicYear: "2026-27",
 monthlyTuition: "",
 annualCharges: [{ name: "", amount: "" }],
 });
 setShowModal(true);
 };

 const openEditModal = (structure) => {
 setEditingId(structure.id);
 // Derive annual charges from any feeHeads that are not Tuition
 const annualFromHeads = (structure.feeHeads || []).filter(fh => !fh.head.toLowerCase().includes('tuition'));
 setFormData({
 classes: structure.className ? structure.className.split(',').map(c => c.trim()) : [],
 academicYear: structure.academicYear,
 monthlyTuition: structure.monthlyTuition || (structure.feeHeads?.find(fh => fh.head.toLowerCase().includes('tuition'))?.amount) || '',
 annualCharges: annualFromHeads.map(fh => ({ name: fh.head, amount: fh.amount })),
 });
 setShowModal(true);
 };

 const addAnnualCharge = () => {
 setFormData((prev) => ({
 ...prev,
 annualCharges: [...prev.annualCharges, { name: "", amount: "" }],
 }));
 };

 const removeAnnualCharge = (index) => {
 setFormData((prev) => ({
 ...prev,
 annualCharges: prev.annualCharges.filter((_, i) => i !== index),
 }));
 };

 const updateAnnualCharge = (index, field, value) => {
 setFormData((prev) => ({
 ...prev,
 annualCharges: prev.annualCharges.map((ac, i) =>
 i === index ? { ...ac, [field]: value } : ac,
 ),
 }));
 };

 const handleSave = async () => {
 if (formData.classes.length === 0) {
 showToast("error", "Please select at least one class");
 return;
 }

 if (!formData.monthlyTuition) {
 showToast("error", "Please enter monthly tuition fee");
 return;
 }

 const record = {
 className: formData.classes.join(", "),
 academicYear: formData.academicYear,
 monthlyTuition: Number(formData.monthlyTuition),
 annualCharges: formData.annualCharges
 .filter(ac => ac.name.trim() && ac.amount)
 .map(ac => ({
 name: ac.name.trim(),
 amount: Number(ac.amount)
 })),
 // Also keep feeHeads for backward compatibility if needed
 feeHeads: [
 { head: "Tuition Fee", amount: Number(formData.monthlyTuition), months: "Monthly" },
 ...formData.annualCharges
 .filter(ac => ac.name.trim() && ac.amount)
 .map(ac => ({ head: ac.name.trim(), amount: Number(ac.amount), months: "Annual" }))
 ],
 totalMonthly: Number(formData.monthlyTuition)
 };

 try {
 if (editingId) {
 await api.fees.updateFeeStructure(editingId, record);
 showToast("success", "Fee template updated successfully");
 } else {
 await api.fees.createFeeStructure(record);
 showToast("success", "Fee template created successfully");
 }
 await refreshFeeStructures();
 setShowModal(false);
 } catch {
 showToast("error", "Failed to save fee template");
 }
 };

 const handleDelete = (id) => {
 showConfirm(
 "Are you sure you want to delete this fee template?",
 async () => {
 await api.fees.deleteFeeStructure(id);
 await refreshFeeStructures();
 showToast("success", "Fee template deleted");
 },
 );
 };

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center">
 <Loader2 size={24} className="animate-spin text-cta" />
 </div>
 );
 }

 return (
 <div className="min-h-screen">
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-xl font-bold text-navy font-brand">
 Fee Structure Manager
 </h1>
 <button
 onClick={openAddModal}
 className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors"
 >
 <Plus size={18} /> New Template
 </button>
 </div>

 <div className="bg-white rounded-xl shadow-card overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-gray-50 border-b border-gray-100">
 <tr>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
 Class/Grade
 </th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
 Tuition (Monthly)
 </th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
 Annual Charges
 </th>
 <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
 Actions
 </th>
 </tr>
 </thead>
 <tbody>
 {feeStructures.length === 0 && (
 <tr>
 <td
 colSpan={5}
 className="px-4 py-8 text-center text-gray-400"
 >
 No fee templates found. Click "New Template" to add one.
 </td>
 </tr>
 )}
 {feeStructures.map((s) => {
 const monthlyTuition = s.monthlyTuition || (s.feeHeads?.find(h => h.head.toLowerCase().includes('tuition'))?.amount) || 0;
 const annualChargesList = s.feeHeads?.filter(h => !h.head.toLowerCase().includes('tuition')) || [];
 const annualChargesTotal = annualChargesList.reduce((sum, ac) => sum + (Number(ac.amount) || 0), 0);
 const annualTotal = (Number(monthlyTuition) * 12) + annualChargesTotal;

 return (
 <React.Fragment key={s.id}>
 <tr
 className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
 onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)}
 >
 <td className="px-4 py-3 font-brand font-semibold text-navy">
 <div className="flex items-center gap-2">
 {expandedRow === s.id ? <ChevronUp size={14} className="text-cta" /> : <ChevronDown size={14} className="text-gray-400" />}
 {s.className}
 </div>
 </td>
 <td className="px-4 py-3 font-mono font-bold text-cta">
 ₹{monthlyTuition.toLocaleString()}
 </td>
 <td className="px-4 py-3">
 <div className="flex flex-wrap gap-1.5">
 {annualChargesList.map((ac, i) => (
 <span key={i} className="bg-navy/5 text-navy rounded-full px-2.5 py-0.5 text-[10px] font-medium border border-navy/10 flex items-center gap-1">
 <span>{ac.head}:</span>
 <span className="font-mono font-bold">₹{ac.amount}</span>
 </span>
 ))}
 {(annualChargesList.length === 0) && (
 <span className="text-gray-400 text-xs italic">No annual charges</span>
 )}
 </div>
 </td>
 <td className="px-4 py-3 text-gray-500">{s.academicYear}</td>
 <td className="px-4 py-3 text-right">
 <div className="flex items-center gap-2 justify-end">
 <button onClick={(e) => { e.stopPropagation(); openEditModal(s); }} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"><Edit2 size={16} /></button>
 <button onClick={(e) => { e.stopPropagation(); handleDelete(s.id); }} className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-cta-red"><Trash2 size={16} /></button>
 </div>
 </td>
 </tr>
 {expandedRow === s.id && (
 <tr className="bg-gray-50">
 <td colSpan={5} className="p-4">
 <div className="flex flex-col gap-4">
 <div>
 <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Structure Details</h4>
 <div className="grid grid-cols-2 gap-4">
 <div className="bg-white p-3 rounded-lg border border-gray-100">
 <span className="text-xs text-gray-500">Monthly Tuition</span>
 <p className="text-lg font-bold text-cta font-mono">₹{monthlyTuition.toLocaleString()}</p>
 </div>
 <div className="bg-white p-3 rounded-lg border border-gray-100">
 <span className="text-xs text-gray-500">Annual Total</span>
 <p className="text-lg font-bold text-navy font-mono">
 ₹{annualTotal.toLocaleString()}
 </p>
 </div>
 </div>
 </div>
 <div>
 <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Annual Charge Breakdown</h4>
 <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
 <table className="w-full text-xs">
 <thead className="bg-gray-50">
 <tr>
 <th className="px-3 py-2 text-left text-gray-500 font-semibold">Head Name</th>
 <th className="px-3 py-2 text-right text-gray-500 font-semibold">Amount</th>
 </tr>
 </thead>
 <tbody>
 {annualChargesList.map((ac, i) => (
 <tr key={i} className="border-t border-gray-50">
 <td className="px-3 py-2 text-gray-700">{ac.head}</td>
 <td className="px-3 py-2 text-right font-mono font-semibold text-navy">₹{ac.amount.toLocaleString()}</td>
 </tr>
 ))}
 {(annualChargesList.length === 0) && (
 <tr><td colSpan={2} className="px-3 py-4 text-center text-gray-400 italic">No annual charges defined</td></tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 </td>
 </tr>
 )}
 </React.Fragment>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>

 {/* Add/Edit Modal */}
 {showModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-2xl shadow-modal w-full max-w-2xl">
 <div className="flex items-center justify-between p-6 bg-navy rounded-t-2xl">
 <h3 className="font-brand text-white text-sm font-semibold">
 {editingId ? "Edit Fee Template" : "New Fee Template"}
 </h3>
 <button onClick={() => setShowModal(false)}>
 <X size={20} className="text-white/70 hover:text-white" />
 </button>
 </div>
 <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
 <div className="grid grid-cols-3 gap-4 mb-6">
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Select Class</label>
 <select
 value={formData.classes[0] || ""}
 onChange={(e) => setFormData((prev) => ({ ...prev, classes: [e.target.value] }))}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors"
 >
 <option value="">Select Class</option>
 {ALL_CLASSES.map((c) => (
 <option key={c} value={c}>{c}</option>
 ))}
 </select>
 </div>
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Academic Year</label>
 <input
 type="text"
 value={formData.academicYear}
 onChange={(e) => setFormData((prev) => ({ ...prev, academicYear: e.target.value }))}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors"
 />
 </div>
 <div className="flex flex-col gap-1">
 <label className="text-xs text-gray-700 uppercase tracking-wide font-bold">Monthly Tuition (₹)</label>
 <input
 type="number"
 placeholder="0"
 value={formData.monthlyTuition}
 onChange={(e) => setFormData((prev) => ({ ...prev, monthlyTuition: e.target.value }))}
 className="w-full px-3 py-2 border-2 border-cta/30 rounded-lg text-sm font-bold font-mono focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors"
 />
 </div>
 </div>

 <div className="flex items-center justify-between mb-3 pt-4 border-t border-gray-100">
 <div className="flex flex-col">
 <label className="text-xs text-gray-500 uppercase tracking-wide font-bold">
 Annual / One-Time Charges
 </label>
 <p className="text-[10px] text-gray-400 italic">Add multiple exam fees, admission fees, etc.</p>
 </div>
 <div className="flex gap-2">
 <button
 onClick={() => {
 setFormData(prev => ({
 ...prev,
 annualCharges: [
 ...prev.annualCharges.filter(ac => ac.name || ac.amount),
 { name: "Ist Examination Fee", amount: "350" },
 { name: "IInd Examination Fee", amount: "350" },
 { name: "IIIrd Examination Fee", amount: "350" }
 ]
 }))
 }}
 className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-1 rounded hover:bg-amber-100 transition-colors flex items-center gap-1"
 >
 + Add 3 Exam Fees
 </button>
 <button
 onClick={addAnnualCharge}
 className="text-xs text-cta font-bold hover:underline flex items-center gap-1"
 >
 <Plus size={14} /> Add Charge
 </button>
 </div>
 </div>

 {/* Column Headers */}
 <div className="flex items-center gap-2 mb-2 px-1">
 <span className="flex-[2] text-[10px] font-medium text-gray-400 uppercase tracking-wider">Charge Name</span>
 <span className="w-32 text-[10px] font-medium text-gray-400 uppercase tracking-wider">Amount (₹)</span>
 <span className="w-8"></span>
 </div>
 {formData.annualCharges.map((ac, i) => (
 <div key={i} className="flex items-center gap-2 mb-2">
 <input
 type="text"
 placeholder="e.g. Admission Fee, Examination Fee"
 value={ac.name}
 onChange={(e) => updateAnnualCharge(i, "name", e.target.value)}
 className="flex-[2] px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors"
 />
 <input
 type="number"
 placeholder="0"
 value={ac.amount}
 onChange={(e) => updateAnnualCharge(i, "amount", e.target.value)}
 className="w-32 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors"
 />
 <button
 onClick={() => removeAnnualCharge(i)}
 className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-cta transition-colors"
 >
 <X size={14} />
 </button>
 </div>
 ))}

 {formData.annualCharges.length === 0 && (
 <div className="text-center py-4 bg-gray-50 rounded-lg border border-dashed border-gray-200 mb-4">
 <p className="text-xs text-gray-400 italic">No annual charges added. Click "+ Add Charge" to add some.</p>
 </div>
 )}

 <div className="flex items-center justify-between mt-6 p-4 bg-navy text-white rounded-xl shadow-lg">
 <div>
 <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">Total Fee Profile</span>
 <p className="text-xs opacity-90">Tuition + Annual Charges</p>
 </div>
 <div className="text-right">
 <span className="font-brand font-bold font-mono text-2xl">
 ₹{(Number(formData.monthlyTuition) + formData.annualCharges.reduce((sum, ac) => sum + (Number(ac.amount) || 0), 0)).toLocaleString()}
 </span>
 </div>
 </div>
 </div>
 <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
 <button
 onClick={() => setShowModal(false)}
 className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium"
 >
 Cancel
 </button>
 <button
 onClick={handleSave}
 className="px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark"
 >
 {editingId ? "Update Template" : "Save Template"}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
