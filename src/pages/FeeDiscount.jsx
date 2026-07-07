import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import {
 Search,
 Tag,
 Settings2,
 Trash2,
 X,
 AlertCircle,
 Plus,
 CheckCircle2,
 XCircle,
 RotateCcw,
 Pencil,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import CustomSelect from "../components/ui/CustomSelect";
import { api } from "../api/client";

export default function FeeDiscount() {
 const { students, feeStructures, showToast, showConfirm, currentUser } =
 useAppContext();
 const navigate = useNavigate();
 const isPrincipal = currentUser?.role === "Principal";

 const [searchTerm, setSearchTerm] = useState("");
 const [selectedStudent, setSelectedStudent] = useState(null);
 const [showModal, setShowModal] = useState(false);
 const [discountData, setDiscountData] = useState([]);
 const [formData, setFormData] = useState({
 feeHead: "",
 type: "percent",
 value: "",
 reason: "",
 });
 const [editingId, setEditingId] = useState(null);

 const filteredStudents =
 searchTerm.trim().length >= 2
 ? students.filter(
 (s) =>
 s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 (s.roll || "").includes(searchTerm),
 )
 : [];

 const currentStructure = selectedStudent
 ? feeStructures.find((f) =>
 f.className?.split(',').map(c => c.trim()).includes(selectedStudent.className)
 )
 : null;

 const loadDiscounts = async () => {
 try {
 const res = await api.fees.discounts.list({ page: 1, limit: 1000 });
 const allDiscounts = res?.data || [];
 
 let filtered = allDiscounts;
 if (selectedStudent) {
 filtered = allDiscounts.filter(
 (d) => String(d.studentId) === String(selectedStudent.id),
 );
 }

 setDiscountData(
 filtered.map((d) => {
 const student = students.find(s => String(s.id) === String(d.studentId));
 return {
 id: d._id,
 studentId: d.studentId,
 studentName: student?.name || "Unknown",
 studentClass: student?.className || "",
 feeHead: d.feeHead || "",
 type: d.type,
 value: d.value,
 reason: d.reason || "",
 status: d.status || "pending",
 };
 }),
 );
 } catch {
 showToast("error", "Failed to load discounts");
 }
 };

 useEffect(() => {
 loadDiscounts();
 }, [selectedStudent]);

 const handleCreateDiscount = async () => {
 if (!formData.feeHead || !formData.value || !formData.reason) {
 showToast("error", "Please fill all discount details");
 return;
 }
 
 const payload = {
 studentId: selectedStudent.id,
 feeHead: formData.feeHead,
 type: formData.type,
 value: Number(formData.value),
 reason: formData.reason,
 academicYear: "2026-27",
 };

 try {
 if (editingId) {
 await api.fees.discounts.update(editingId, payload);
 showToast("success", "Discount updated successfully");
 } else {
 if (
 discountData.some(
 (d) => d.feeHead === formData.feeHead && d.status !== "revoked",
 )
 ) {
 showToast("error", "A discount for this fee head already exists");
 return;
 }
 await api.fees.discounts.create(payload);
 showToast("success", "Discount assigned — pending Principal approval");
 }
 await loadDiscounts();
 setShowModal(false);
 setEditingId(null);
 setFormData({ feeHead: "", type: "percent", value: "", reason: "" });
 } catch {
 showToast("error", editingId ? "Failed to update" : "Failed to save discount");
 }
 };

 const handleEdit = (d) => {
 // If in global view, select the student first
 if (!selectedStudent || String(selectedStudent.id) !== String(d.studentId)) {
 const student = students.find(s => String(s.id) === String(d.studentId));
 if (student) setSelectedStudent(student);
 }
 setFormData({
 feeHead: d.feeHead,
 type: d.type,
 value: d.value,
 reason: d.reason,
 });
 setEditingId(d.id);
 setShowModal(true);
 };

 const handleApprove = async (id) => {
 try {
 await api.fees.discounts.approve(id);
 await loadDiscounts();
 showToast("success", "Discount approved");
 } catch {
 showToast("error", "Failed to approve");
 }
 };

 const handleReject = (id) => {
 showConfirm("Reject this discount?", async () => {
 try {
 await api.fees.discounts.reject(id, "Rejected by Principal");
 await loadDiscounts();
 showToast("success", "Discount rejected");
 } catch {
 showToast("error", "Failed to reject");
 }
 });
 };

 const handleRevoke = (id) => {
 showConfirm(
 "Revoke this approved discount? Future fee collections will not apply it.",
 async () => {
 try {
 await api.fees.discounts.revoke(id);
 await loadDiscounts();
 showToast("success", "Discount revoked");
 } catch {
 showToast("error", "Failed to revoke");
 }
 },
 );
 };

 const handleDeleteDiscount = (id) => {
 showConfirm("Remove this discount assignment?", async () => {
 try {
 await api.fees.discounts.remove(id);
 setDiscountData((prev) => prev.filter((d) => d.id !== id));
 showToast("success", "Discount removed");
 } catch {
 showToast("error", "Failed to delete discount");
 }
 });
 };

 const statusBadge = (status) => {
 const map = {
 pending: "bg-amber-50 text-amber-600",
 approved: "bg-teal/10 text-teal",
 rejected: "bg-cta/10 text-cta",
 revoked: "bg-gray-100 text-gray-400",
 };
 return (
 <span
 className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${map[status] || map.pending}`}
 >
 {status?.charAt(0).toUpperCase() + status?.slice(1)}
 </span>
 );
 };

 return (
 <div className="min-h-screen">
 <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-4 transition-colors">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg> Back
 </button>
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-xl font-bold text-navy font-brand flex items-center gap-2">
 <Tag size={24} className="text-cta" /> Scholarships & Discounts
 </h1>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 items-start">
 {/* Left: Search */}
 <div className="bg-white rounded-xl shadow-card p-5">
 <h2 className="font-brand font-semibold text-navy mb-4">
 Find Student
 </h2>
 <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 gap-2 mb-4 focus-within:border-cta focus-within:ring-2 focus-within:ring-cta/20 transition-all">
 <Search size={18} className="text-gray-400" />
 <input
 type="text"
 placeholder="Name or Roll No (min 2 chars)"
 value={searchTerm}
 onChange={(e) => {
 setSearchTerm(e.target.value);
 setSelectedStudent(null);
 }}
 className="w-full bg-transparent text-sm py-2 focus:outline-none"
 />
 </div>
 <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-1">
 {searchTerm.trim().length >= 2 && filteredStudents.length === 0 && (
 <div className="text-center py-4 text-xs text-gray-400">
 No students found.
 </div>
 )}
 {filteredStudents.map((s) => (
 <div
 key={s.id}
 onClick={() => setSelectedStudent(s)}
 className={`p-3 rounded-lg border cursor-pointer transition-all ${
 selectedStudent?.id === s.id
 ? "border-cta bg-cta/5"
 : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
 }`}
 >
 <div className="flex justify-between items-start">
 <div>
 <p className="font-brand font-semibold text-navy text-sm">
 {s.name}
 </p>
 <p className="text-[11px] text-gray-500">
 {s.className} - Sec {s.section}
 </p>
 </div>
 <span className="text-[10px] font-mono text-gray-400">
 #{s.roll}
 </span>
 </div>
 </div>
 ))}
 </div>
 </div>

 {/* Right: Discounts */}
 <div className="bg-white rounded-xl shadow-card flex flex-col min-h-[500px]">
 {!selectedStudent && discountData.length === 0 ? (
 <div className="flex-1 flex flex-col items-center justify-center opacity-50 p-10 text-center">
 <Settings2 size={48} className="text-gray-300 mb-4" />
 <h3 className="font-brand text-xl text-navy">No Scholarships Assigned</h3>
 <p className="text-sm text-gray-500 mt-1 max-w-sm">
 Search and select a student to start assigning scholarships.
 </p>
 </div>
 ) : (
 <>
 {selectedStudent ? (
 <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-navy rounded-t-xl">
 <div>
 <h2 className="font-brand font-bold text-lg text-white">
 {selectedStudent.name}
 </h2>
 <p className="text-white/60 text-xs mt-0.5">
 {selectedStudent.className} | Roll: {selectedStudent.roll} |{" "}
 {currentStructure
 ? `Fee: ${selectedStudent.className}`
 : "No fee structure"}
 </p>
 </div>
 <button
 onClick={() => setShowModal(true)}
 disabled={!currentStructure}
 className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 <Plus size={16} /> New Discount
 </button>
 </div>
 ) : (
 <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-xl">
 <div>
 <h2 className="font-brand font-bold text-lg text-navy">
 All Scholarships
 </h2>
 <p className="text-gray-500 text-xs mt-0.5">
 List of all assigned fee reductions and scholarships across the school.
 </p>
 </div>
 <div className="text-[10px] bg-navy/5 text-navy px-3 py-1 rounded-full font-bold">
 {discountData.length} ASSIGNED
 </div>
 </div>
 )}

 {selectedStudent && !currentStructure && (
 <div className="m-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-amber-800">
 <AlertCircle
 size={18}
 className="mt-0.5 text-amber-500 shrink-0"
 />
 <p className="text-sm">
 No fee structure for{" "}
 <strong>{selectedStudent.className}</strong>. Create one in
 Fee Structure manager first.
 </p>
 </div>
 )}

 <div className="flex-1 p-6">
 <h3 className="font-brand text-sm text-navy uppercase tracking-wide font-semibold mb-4 border-b border-gray-100 pb-2">
 {selectedStudent ? `Discounts for ${selectedStudent.name}` : "Assigned Scholarships (2026-27)"}
 {!isPrincipal && (
 <span className="ml-2 text-[10px] text-amber-500 font-normal normal-case">
 — Principal approval required
 </span>
 )}
 </h3>
 <div className="border border-gray-100 rounded-xl overflow-hidden">
 <table className="w-full text-sm">
 <thead className="bg-gray-50 border-b border-gray-100">
 <tr>
 {!selectedStudent && (
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
 Student
 </th>
 )}
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
 Fee Head
 </th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
 Value
 </th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
 Status
 </th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
 Reason
 </th>
 <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
 Actions
 </th>
 </tr>
 </thead>
 <tbody>
 {discountData.length === 0 && (
 <tr>
 <td
 colSpan={selectedStudent ? 5 : 6}
 className="px-4 py-8 text-center text-gray-400"
 >
 No discounts assigned.
 </td>
 </tr>
 )}
 {discountData.map((d) => (
 <tr
 key={d.id}
 className="border-b border-gray-50 hover:bg-gray-50"
 >
 {!selectedStudent && (
 <td className="px-4 py-3">
 <div className="font-brand font-semibold text-navy">
 {d.studentName}
 </div>
 <div className="text-[10px] text-gray-400">
 {d.studentClass}
 </div>
 </td>
 )}
 <td className="px-4 py-3 font-medium text-gray-700">
 {d.feeHead}
 </td>
 <td className="px-4 py-3 text-cta font-mono font-bold">
 {d.type === "percent"
 ? `${d.value}% OFF`
 : `₹${d.value} OFF`}
 </td>
 <td className="px-4 py-3">{statusBadge(d.status)}</td>
 <td className="px-4 py-3 text-gray-500 text-xs">
 {d.reason}
 </td>
 <td className="px-4 py-3 text-right">
 <div className="flex items-center justify-end gap-1">
 {/* Edit Button */}
 <button
 onClick={() => handleEdit(d)}
 title="Edit"
 className="p-1.5 rounded-lg hover:bg-navy/5 text-navy/70 hover:text-navy transition-colors"
 >
 <Pencil size={15} />
 </button>

 {/* Principal-only: Approve pending */}
 {isPrincipal && d.status === "pending" && (
 <>
 <button
 onClick={() => handleApprove(d.id)}
 title="Approve"
 className="p-1.5 rounded-lg hover:bg-teal/10 text-teal transition-colors"
 >
 <CheckCircle2 size={16} />
 </button>
 <button
 onClick={() => handleReject(d.id)}
 title="Reject"
 className="p-1.5 rounded-lg hover:bg-cta/10 text-cta transition-colors"
 >
 <XCircle size={16} />
 </button>
 </>
 )}
 {/* Principal-only: Revoke approved */}
 {isPrincipal && d.status === "approved" && (
 <button
 onClick={() => handleRevoke(d.id)}
 title="Revoke"
 className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
 >
 <RotateCcw size={16} />
 </button>
 )}
 {/* Delete */}
 <button
 onClick={() => handleDeleteDiscount(d.id)}
 title="Delete"
 className="p-1.5 rounded-lg hover:bg-rose-50 text-cta transition-colors"
 >
 <Trash2 size={16} />
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 </>
 )}
 </div>
 </div>

 {/* Modal */}
 {showModal && currentStructure && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-2xl shadow-modal w-full max-w-md">
 <div className="flex items-center justify-between p-6 bg-navy rounded-t-2xl">
 <h3 className="font-brand text-white text-sm font-semibold">
 {editingId ? "Edit Fee Discount" : "Assign Fee Discount"}
 </h3>
 <button onClick={() => {
 setShowModal(false);
 setEditingId(null);
 setFormData({ feeHead: "", type: "percent", value: "", reason: "" });
 }}>
 <X size={20} className="text-white/70 hover:text-white" />
 </button>
 </div>
 <div className="p-6">
 <div className="flex flex-col gap-1 mb-4 z-20 relative">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Select Fee Head
 </label>
 <CustomSelect
 value={formData.feeHead}
 onChange={(val) =>
 setFormData((prev) => ({ ...prev, feeHead: val }))
 }
 options={[
 { label: "-- Choose Head --", value: "" },
 ...(currentStructure.feeHeads || []).map((fh) => ({
 label: `${fh.head} (Base: ₹${fh.amount})`,
 value: fh.head,
 })),
 { label: "Entire Total Fees", value: "Total_Fees" },
 ]}
 />
 </div>
 <div className="grid grid-cols-2 gap-4 mb-4">
 <div className="flex flex-col gap-1 z-10 relative">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Type
 </label>
 <CustomSelect
 value={formData.type}
 onChange={(val) =>
 setFormData((prev) => ({ ...prev, type: val }))
 }
 options={[
 { label: "Percentage (%)", value: "percent" },
 { label: "Flat Amount (₹)", value: "flat" },
 ]}
 />
 </div>
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Value
 </label>
 <input
 type="number"
 value={formData.value}
 onChange={(e) =>
 setFormData((prev) => ({
 ...prev,
 value: e.target.value,
 }))
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-cta"
 placeholder="e.g. 50"
 />
 </div>
 </div>
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Reason / Remarks
 </label>
 <input
 type="text"
 value={formData.reason}
 onChange={(e) =>
 setFormData((prev) => ({ ...prev, reason: e.target.value }))
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
 placeholder="e.g. Staff Child, RTE, Merit Scholarship"
 />
 </div>
 </div>
 <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
 <button
 onClick={() => {
 setShowModal(false);
 setEditingId(null);
 setFormData({ feeHead: "", type: "percent", value: "", reason: "" });
 }}
 className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium"
 >
 Cancel
 </button>
 <button
 onClick={handleCreateDiscount}
 className="px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark"
 >
 {editingId ? "Update Discount" : "Assign Discount"}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
