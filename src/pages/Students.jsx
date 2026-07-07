import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ChevronLeft, ChevronRight, CheckCircle2, AlertCircle, CreditCard, Trash2 } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { ALL_CLASSES } from "../constants/classes";
import { api } from "../api/client";

export default function Students() {
 const navigate = useNavigate();
 const { students: backendStudents, currentUser, showToast, showConfirm, loadCoreData } = useAppContext();
 const [activeTab, setActiveTab] = useState("All");
 const [searchQuery, setSearchQuery] = useState("");
 const [currentPage, setCurrentPage] = useState(1);
 const itemsPerPage = 12;

 const isTeacher = currentUser?.role === 'Teacher';
 const teacherAssignedClasses = currentUser?.assignedClasses || [];

 // Teachers only see their assigned class tabs; others see all
 const availableClasses = isTeacher && teacherAssignedClasses.length > 0
 ? ALL_CLASSES.filter(c => teacherAssignedClasses.includes(c))
 : ALL_CLASSES;

 const classes = ["All", ...availableClasses];
 const allStudents = backendStudents || [];
 const isPrincipalOrAdmin = currentUser?.role === 'Principal' || currentUser?.role === 'Admin';

 const filteredStudents = allStudents.filter(s => {
 const matchesSearch = s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || String(s.roll || '').includes(searchQuery);
 const matchesTab = activeTab === "All" || s.className === activeTab;
 return matchesSearch && matchesTab;
 });

 const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
 const startIndex = (currentPage - 1) * itemsPerPage;
 const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

 React.useEffect(() => {
 setCurrentPage(1);
 }, [searchQuery, activeTab]);

 const handleDeleteStudent = (e, student) => {
 e.stopPropagation();
 showConfirm(
 `Archive "${student.name}"? The student will be moved to the recycle bin and can be restored by the Principal.`,
 async () => {
 try {
 await api.students.delete(student.id);
 showToast('success', `${student.name} archived successfully`);
 await loadCoreData();
 } catch (err) {
 showToast('error', err?.data?.message || 'Failed to archive student');
 }
 },
 { title: 'Archive Student', danger: true, confirmText: 'Archive' }
 );
 };

 return (
 <div className="min-h-screen">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
 <h1 className="text-xl font-bold text-navy font-brand">Students</h1>
 <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
 <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 gap-2">
 <Search size={18} className="text-gray-400" />
 <input
 type="text"
 placeholder="Search name or roll no..."
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 className="border-none bg-transparent text-sm py-2 focus:outline-none w-48"
 />
 </div>
 {currentUser?.role !== 'Teacher' && (
 <button className="inline-flex w-full sm:w-auto items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors" onClick={() => navigate("/students/idcards")}>
 <CreditCard size={18} />
 <span className="inline md:inline">ID Cards</span>
 </button>
 )}
 </div>
 </div>

 <div className="mb-6 overflow-x-auto">
 <div className="flex gap-1.5 min-w-max pb-2">
 {classes.map((c) => (
 <button
 key={c}
 className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
 activeTab === c
 ? 'bg-navy text-white'
 : 'bg-white text-gray-500 border border-gray-200 hover:border-cta hover:text-teal'
 }`}
 onClick={() => setActiveTab(c)}
 >
 {c}
 {c === "All" && <span className="ml-1.5 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">{allStudents.length}</span>}
 </button>
 ))}
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
 {paginatedStudents.length === 0 ? (
 <div className="col-span-full text-center py-10 text-gray-400">
 No students found matching your filters.
 </div>
 ) : (
 paginatedStudents.map((student) => (
 <div
 key={student.id}
 className="bg-white rounded-xl shadow-card p-5 cursor-pointer hover:shadow-md transition-shadow relative group"
 onClick={() => navigate(`/students/${student.id}`)}
 >
 <div className="flex items-center justify-between mb-3">
 <div className="size-10 rounded-full bg-teal/10 text-teal flex items-center justify-center text-sm font-bold">
 {student.name.charAt(0)}
 </div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">ID: {student.studentId}</span>
 {isPrincipalOrAdmin && (
 <button
 className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-red-400 hover:bg-red-50 transition-all"
 onClick={(e) => handleDeleteStudent(e, student)}
 title="Archive student"
 >
 <Trash2 size={14} />
 </button>
 )}
 </div>
 </div>

 <h2 className="font-brand font-semibold text-sm text-navy mb-1">
 {student.name.toUpperCase()}
 </h2>
 <div className="text-xs text-gray-400 flex flex-col gap-0.5">
 <span>{student.className}</span>
 <span>Father: {student.father}</span>
 </div>

 <div className="mt-3 pt-3 border-t border-gray-50">
 {student.feeStatus === "cleared" ? (
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal/10 text-teal text-xs font-medium rounded-full">
 <CheckCircle2 size={12} /> Fees Cleared
 </span>
 ) : (
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cta/10 text-cta text-xs font-medium rounded-full">
 <AlertCircle size={12} /> Due: ₹{student.dues || 0}
 </span>
 )}
 </div>
 </div>
 ))
 )}
 </div>

 {totalPages > 1 && (
 <div className="flex items-center justify-between mt-6">
 <div className="text-sm text-gray-400">
 Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredStudents.length)} of {filteredStudents.length} students
 </div>
 <div className="flex items-center gap-2">
 <button
 className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
 disabled={currentPage === 1}
 onClick={() => setCurrentPage(prev => prev - 1)}
 >
 <ChevronLeft size={14} /> Prev
 </button>
 <span className="text-xs text-gray-400 px-2">
 Page {currentPage} of {totalPages}
 </span>
 <button
 className="inline-flex items-center gap-1 px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
 disabled={currentPage === totalPages}
 onClick={() => setCurrentPage(prev => prev + 1)}
 >
 Next <ChevronRight size={14} />
 </button>
 </div>
 </div>
 )}
 </div>
 );
}
