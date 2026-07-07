import React, { useState } from "react";
import { Edit2, Trash2, Search, X, User } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { ALL_CLASSES } from "../constants/classes";

export default function Teachers() {
 const {
 teachers,
 updateTeacher,
 deleteTeacher,
 showToast,
 showConfirm,
 } = useAppContext();
 const [searchTerm, setSearchTerm] = useState("");

 // Modal State
 const [showModal, setShowModal] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [formData, setFormData] = useState({
 name: "",
 subject: "",
 qualification: "",
 joinDate: "",
 dob: "",
 phone: "",
 basic: "",
 hra: "",
 allowances: "",
 deductions: "",
 assignedClasses: [],
 userId: null,
 });

 const filteredTeachers = teachers.filter(
 (t) =>
 t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 t.subject.toLowerCase().includes(searchTerm.toLowerCase()),
 );


 const openEditModal = (teacher) => {
 setEditingId(teacher.id);
 setFormData({ ...teacher });
 setShowModal(true);
 };

 const handleSave = async () => {
 if (!formData.subject?.trim()) {
 showToast("error", "Subject is required");
 return;
 }

 const payload = {
 subject: formData.subject,
 assignedClasses: formData.assignedClasses || [],
 };

 try {
 if (editingId) {
 await updateTeacher(editingId, payload);
 showToast("success", "Teacher roles updated");
 }
 setShowModal(false);
 } catch (err) {
 showToast("error", err?.data?.message || err?.message || "Failed to update teacher");
 }
 };

 const handleDelete = (id) => {
 showConfirm(
 "Are you sure you want to remove this teacher from the database? This action cannot be undone.",
 () => {
 deleteTeacher(id)
 .then(() => showToast("success", "Teacher removed successfully"))
 .catch(() => showToast("error", "Failed to delete teacher"));
 },
 );
 };

 const getInitials = (name) =>
 name
 .split(" ")
 .map((n) => n[0])
 .join("")
 .substring(0, 2)
 .toUpperCase();
 const calculateGross = (t) =>
 (t.basic || 0) + (t.hra || 0) + (t.allowances || 0) - (t.deductions || 0);

 return (
 <div className="min-h-screen">
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-xl font-bold text-navy font-brand">
 Teacher Profiles
 </h1>
 <div className="flex items-center gap-3">
 <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 gap-2">
 <Search size={18} className="text-gray-400" />
 <input
 type="text"
 placeholder="Search staff..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="border-none bg-transparent text-sm py-2 focus:outline-none w-48"
 />
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
 {filteredTeachers.map((t) => (
 <div
 key={t.id}
 className="bg-white rounded-xl shadow-card overflow-hidden group"
 >
 <div className="p-5">
 <div className="flex justify-between items-start mb-4">
 <div className="size-12 rounded-full bg-navy/10 text-navy flex items-center justify-center font-brand font-bold text-lg">
 {getInitials(t.name)}
 </div>
 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 <button
 onClick={() => openEditModal(t)}
 className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-navy transition-colors"
 >
 <Edit2 size={14} />
 </button>
 <button
 onClick={() => handleDelete(t.id)}
 className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"
 >
 <Trash2 size={14} />
 </button>
 </div>
 </div>
 <h3 className="font-brand font-bold text-lg text-navy mb-0.5">
 {t.name}
 </h3>
 <p className="text-sm text-gray-500 font-medium mb-1">
 {t.subject} Teacher
 </p>

 {t.assignedClasses?.length > 0 && (
 <div className="flex flex-wrap gap-1 mt-1.5">
 {t.assignedClasses.slice(0, 4).map((cls) => (
 <span
 key={cls}
 className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded font-medium"
 >
 {cls}
 </span>
 ))}
 {t.assignedClasses.length > 4 && (
 <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 text-[10px] rounded">
 +{t.assignedClasses.length - 4} more
 </span>
 )}
 </div>
 )}

 <div className="space-y-2 mt-4 pt-4 border-t border-gray-50">
 <div className="flex justify-between text-xs">
 <span className="text-gray-500">Qualification</span>
 <span className="font-medium text-navy">
 {t.qualification || "N/A"}
 </span>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-gray-500">Joined</span>
 <span className="font-medium text-navy">
 {t.joinDate || "N/A"}
 </span>
 </div>
 <div className="flex justify-between text-xs">
 <span className="text-gray-500">Net Salary</span>
 <span className="font-medium text-emerald-600 font-brand font-mono">
 ₹{calculateGross(t).toLocaleString()}
 </span>
 </div>
 </div>
 </div>
 </div>
 ))}
 {filteredTeachers.length === 0 && (
 <div className="col-span-full py-12 text-center bg-white rounded-xl shadow-card">
 <User size={48} className="mx-auto text-gray-300 mb-3" />
 <h3 className="text-lg font-brand font-semibold text-navy">
 No Teachers Found
 </h3>
 <p className="text-gray-500 text-sm mt-1">
 Try adjusting your search or add a new teacher.
 </p>
 </div>
 )}
 </div>

 {/* Add/Edit Modal */}
 {showModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-2xl shadow-modal w-full max-w-2xl">
 <div className="flex items-center justify-between p-6 bg-navy rounded-t-2xl">
 <h3 className="font-brand text-white text-sm font-semibold">
 Manage Teacher Roles
 </h3>
 <button onClick={() => setShowModal(false)}>
 <X size={20} className="text-white/70 hover:text-white" />
 </button>
 </div>

 <div className="p-6 max-h-[70vh] overflow-y-auto">
 {/* Role Info */}
 <h4 className="font-brand font-semibold text-sm text-navy mb-3 uppercase tracking-wide border-b border-gray-100 pb-2">
 Teacher Roles & Assigned Classes
 </h4>
 <div className="grid grid-cols-1 gap-4 mb-6">
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase">
 Teacher Name
 </label>
 <input
 type="text"
 value={formData.name}
 disabled
 className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-lg text-sm text-gray-500 cursor-not-allowed focus:outline-none"
 />
 </div>
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase">
 Primary Subject <span className="text-cta">*</span>
 </label>
 <input
 type="text"
 value={formData.subject}
 onChange={(e) =>
 setFormData((prev) => ({
 ...prev,
 subject: e.target.value,
 }))
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
 />
 </div>
 </div>

 {/* ASSIGNED CLASSES */}
 <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-gray-100">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Assigned Classes
 </label>
 <div className="bg-gray-50 rounded-xl border border-gray-200 p-3 max-h-[180px] overflow-y-auto">
 <div className="grid grid-cols-3 gap-1.5">
 {ALL_CLASSES.map((cls) => (
 <label
 key={cls}
 className="flex items-center gap-2 px-2 py-1.5 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-200"
 >
 <input
 type="checkbox"
 className="rounded text-cta focus:ring-cta"
 checked={(formData.assignedClasses || []).includes(
 cls,
 )}
 onChange={(e) => {
 const updated = e.target.checked
 ? [...(formData.assignedClasses || []), cls]
 : (formData.assignedClasses || []).filter(
 (c) => c !== cls,
 );
 setFormData((prev) => ({
 ...prev,
 assignedClasses: updated,
 }));
 }}
 />
 <span className="text-sm text-navy font-medium">
 {cls}
 </span>
 </label>
 ))}
 </div>
 </div>
 <p className="text-[11px] text-gray-400">
 Teacher will only see these classes in Syllabus Tracker and
 Marks Entry.
 </p>
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
 {editingId ? "Update Profile" : "Save Teacher"}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
