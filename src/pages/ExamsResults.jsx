import React, { useState, useEffect, useMemo } from "react";
import {
 Plus,
 Edit3,
 FileText,
 BarChart2,
 Printer,
 X,
 Download,
 LayoutGrid,
 CheckCircle2,
 AlertCircle,
 Trash2,
} from "lucide-react";
import { api } from "../api/client";
import { useAppContext } from "../context/AppContext";
import { ALL_CLASSES } from "../constants/classes";
import CustomSelect from "../components/ui/CustomSelect";
import CustomDatePicker from "../components/ui/CustomDatePicker";

export default function ExamsResults() {
 const { showToast, students, currentUser, showConfirm, schoolInfo } = useAppContext();

 const [view, setView] = useState("list");
 const [selectedExam, setSelectedExam] = useState(null);
 const [exams, setExams] = useState([]);
 const [classSubjects, setClassSubjects] = useState([]);
 const [loading, setLoading] = useState(true);

 // Filters
 const [filterClass, setFilterClass] = useState("All Classes");
 const [filterTerm, setFilterTerm] = useState("All Terms");

 // Bulk Create Modal State
 const [showBulkModal, setShowBulkModal] = useState(false);
 const [bulkData, setBulkData] = useState({
 examType: "Unit Test 1",
 term: "Term 1",
 classes: [],
 date: new Date().toISOString().split("T")[0],
 maxMarks: 100,
 theoryMax: 70,
 projectMax: 30,
 });

 const CLASSES = (currentUser?.role === 'Teacher' && currentUser?.assignedClasses?.length > 0)
 ? ALL_CLASSES.filter(c => currentUser.assignedClasses.includes(c))
 : ALL_CLASSES;

 const TERMS = ["Term 1", "Term 2", "Term 3", "Preboard"];

 const EXAM_TYPES = [
 "Unit Test 1",
 "Unit Test 2",
 "Unit Test 3",
 "Mid Term",
 "Term Exam",
 "Half Yearly Exam",
 "Final Exam",
 "Pre-Board",
 "Practice Test",
 ];

 const classOptions = useMemo(() => {
 if (
 currentUser?.role === "Teacher" &&
 currentUser?.assignedClasses?.length > 0
 ) {
 return ["All Classes", ...currentUser.assignedClasses];
 }
 return ["All Classes", ...CLASSES];
 }, [currentUser]);

 useEffect(() => {
 loadData();
 }, []);

 const handleDeleteExam = (exam) => {
 showConfirm(
 `Delete exam "${exam.subject} — ${exam.examType}"? This cannot be undone.`,
 async () => {
 try {
 await api.exams.remove(exam.id);
 showToast('success', 'Exam deleted successfully');
 loadData();
 } catch (err) {
 showToast('error', err?.data?.message || 'Failed to delete exam');
 }
 },
 { title: 'Delete Exam', danger: true, confirmText: 'Delete' }
 );
 };

 const loadData = async () => {
 setLoading(true);
 try {
 const [examsRes, subjectsRes] = await Promise.all([
 api.exams.list({ page: 1, limit: 500 }),
 api.classSubjects.list({ page: 1, limit: 500 }),
 ]);
 
 const mapExamStatus = (st) => {
 const upper = String(st || "").toUpperCase();
 if (upper === "COMPLETED") return "Completed";
 if (upper === "SCHEDULED") return "Scheduled";
 if (upper === "DRAFT") return "Draft";
 return st;
 };
 
 const examsList = examsRes?.data || [];
 const subjects = subjectsRes?.data || [];
 
 setExams(
 examsList.map((e) => ({
 ...e,
 id: e._id,
 status: mapExamStatus(e.status),
 backendStatus: e.status,
 })),
 );
 setClassSubjects(subjects);
 } catch (err) {
 showToast('error', 'Failed to load exams. Please refresh.');
 setExams([]);
 setClassSubjects([]);
 } finally {
 setLoading(false);
 }
 };

 const filteredExams = useMemo(() => {
 return exams.filter((exam) => {
 const classMatch =
 filterClass === "All Classes" || exam.className === filterClass;
 const termMatch = filterTerm === "All Terms" || exam.term === filterTerm;
 return classMatch && termMatch;
 });
 }, [exams, filterClass, filterTerm]);

 const handleAction = async (exam, action) => {
 if (action === "marks") {
 const resultsRes = await api.exams.resultsByExam(exam.id);
 const results = resultsRes?.data || [];
 const marksMap = {};
 results.forEach((r) => {
 marksMap[String(r.studentId)] = {
 theory: r.theoryMarks || 0,
 project: r.projectMarks || 0,
 total: r.totalMarks || 0,
 absent: !!r.absent,
 };
 });
 setSelectedExam({ ...exam, studentMarks: marksMap });
 } else {
 setSelectedExam(exam);
 }
 setView(action);
 };

 const getGrade = (marks, max) => {
 const pct = (marks / max) * 100;
 if (pct >= 90) return { grade: "A+", cls: "bg-teal/10 text-teal" };
 if (pct >= 80) return { grade: "A", cls: "bg-teal/10 text-teal" };
 if (pct >= 70) return { grade: "B+", cls: "bg-amber-50 text-amber-600" };
 if (pct >= 60) return { grade: "B", cls: "bg-amber-50 text-amber-600" };
 if (pct >= 50) return { grade: "C", cls: "bg-gray-100 text-gray-500" };
 return { grade: "F", cls: "bg-cta/10 text-cta" };
 };

 const handleBulkCreate = async () => {
 if (bulkData.classes.length === 0) {
 showToast("error", "Select at least one class");
 return;
 }

 const newExams = [];
 for (const className of bulkData.classes) {
 const config = classSubjects.find((cs) => cs.className === className);
 if (config) {
 config.subjects.forEach((subject) => {
 newExams.push({
 name: `${bulkData.examType} — ${className} — ${subject}`,
 examType: bulkData.examType,
 term: bulkData.term,
 className,
 subject,
 date: bulkData.date,
 maxMarks: bulkData.maxMarks,
 theoryMax:
 className === "Class 9" || className === "Class 10"
 ? bulkData.theoryMax
 : bulkData.maxMarks,
 projectMax:
 className === "Class 9" || className === "Class 10"
 ? bulkData.projectMax
 : 0,
 status: "SCHEDULED",
 academicYear: "2026-27",
 });
 });
 }
 }

 try {
 await Promise.all(newExams.map((examPayload) => api.exams.create(examPayload)));
 showToast("success", `${newExams.length} exam entries created`);
 setShowBulkModal(false);
 loadData();
 } catch {
 showToast("error", "Failed to create bulk exams");
 }
 };

 return (
 <div className="min-h-screen">
 {view === "list" && (
 <>
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
 <div>
 <h1 className="text-xl font-bold text-navy font-brand">
 Exams & Results
 </h1>
 <p className="text-sm text-gray-500">
 Manage exam entries, marks, and report cards.
 </p>
 </div>
 <div className="flex flex-wrap gap-2">
 {currentUser?.role !== 'Teacher' && (
 <>
 <button
 className="inline-flex items-center gap-2 px-4 py-2 bg-cta/10 text-cta rounded-lg text-sm font-medium hover:bg-cta/20 transition-colors"
 onClick={() => setShowBulkModal(true)}
 >
 <LayoutGrid size={18} /> Bulk Create
 </button>
 <button
 className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors"
 onClick={() => setView("add")}
 >
 <Plus size={18} /> Create Exam
 </button>
 </>
 )}
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-card p-4 mb-6 flex flex-wrap items-end gap-4">
 <div className="flex flex-col gap-1 min-w-[160px]">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Class
 </label>
 <CustomSelect
 value={filterClass}
 onChange={setFilterClass}
 options={classOptions}
 />
 </div>
 <div className="flex flex-col gap-1 min-w-[160px]">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Term
 </label>
 <CustomSelect
 value={filterTerm}
 onChange={setFilterTerm}
 options={["All Terms", ...TERMS]}
 />
 </div>
 <div className="text-xs text-gray-400 mb-2">
 Showing {filteredExams.length} entries
 </div>
 </div>

 {loading ? (
 <div className="p-12 text-center text-gray-400">
 Loading exams...
 </div>
 ) : filteredExams.length === 0 ? (
 <div className="bg-white rounded-xl shadow-card p-12 text-center">
 <div className="size-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
 <FileText size={32} />
 </div>
 <h3 className="text-navy font-brand font-bold">No Exams Found</h3>
 <p className="text-gray-400 text-sm mt-1">
 Try changing filters or create a new exam.
 </p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {filteredExams.map((exam) => (
 <div
 key={exam.id}
 className="bg-white rounded-xl shadow-card p-5 hover:border-cta/30 border border-transparent transition-all"
 >
 <div className="flex justify-between mb-4">
 <div>
 <h3 className="font-brand font-semibold text-[15px] leading-tight text-navy">
 {exam.subject}
 </h3>
 <p className="text-gray-400 text-xs font-medium mt-0.5">
 {exam.examType && (
 <span className="text-cta font-semibold">
 {exam.examType}
 </span>
 )}
 {exam.examType && " · "}
 {exam.term} — {exam.className}
 </p>
 </div>
 <span
 className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full h-fit ${exam.status === "Completed" ? "bg-teal/10 text-teal" : "bg-amber-50 text-amber-600"}`}
 >
 {exam.status}
 </span>
 </div>
 <div className="flex gap-4 mb-4 text-xs text-gray-500">
 <span className="flex items-center gap-1">
 <LayoutGrid size={12} /> {exam.date}
 </span>
 <span className="flex items-center gap-1 font-mono">
 Max: {exam.maxMarks}
 </span>
 </div>
 <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-50">
 <button
 className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-xs font-semibold transition-colors"
 onClick={() => handleAction(exam, "marks")}
 >
 <Edit3 size={14} /> Marks
 </button>
 <button
 className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-xs font-semibold transition-colors"
 onClick={() => handleAction(exam, "results")}
 >
 <BarChart2 size={14} /> Results
 </button>
 <button
 className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-teal hover:bg-teal/5 rounded-lg text-xs font-semibold transition-colors"
 onClick={() => handleAction(exam, "report")}
 >
 <FileText size={14} /> Reports
 </button>
 {(currentUser?.role === 'Principal' || currentUser?.role === 'Admin') && (
 <button
 className="inline-flex items-center justify-center gap-1 px-3 py-1.5 text-red-400 hover:bg-red-50 rounded-lg text-xs font-semibold transition-colors"
 onClick={() => handleDeleteExam(exam)}
 >
 <Trash2 size={14} />
 </button>
 )}
 </div>
 </div>
 ))}
 </div>
 )}
 </>
 )}

 {view === "add" && (
 <div>
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-xl font-bold text-navy font-brand">
 Create Single Exam Entry
 </h1>
 </div>
 <div className="bg-white rounded-xl shadow-card p-6 max-w-xl">
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 z-30 relative">
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Term
 </label>
 <CustomSelect
 value={bulkData.term}
 onChange={(val) =>
 setBulkData((prev) => ({ ...prev, term: val }))
 }
 options={TERMS}
 />
 </div>
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Test / Exam Name
 </label>
 <CustomSelect
 value={bulkData.examType}
 onChange={(val) =>
 setBulkData((prev) => ({ ...prev, examType: val }))
 }
 options={EXAM_TYPES}
 />
 </div>
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Class
 </label>
 <CustomSelect
 value={bulkData.classes[0] || "Class 8"}
 onChange={(val) =>
 setBulkData((prev) => ({ ...prev, classes: [val] }))
 }
 options={CLASSES}
 />
 </div>
 </div>

 <div className="flex flex-col gap-1 mb-4 z-20 relative">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Subject
 </label>
 <CustomSelect
 value={bulkData.subject || ""}
 onChange={(val) =>
 setBulkData((prev) => ({ ...prev, subject: val }))
 }
 options={
 classSubjects.find(
 (cs) => cs.className === (bulkData.classes[0] || "Class 8"),
 )?.subjects || []
 }
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 z-10 relative">
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Date
 </label>
 <input
 type="date"
 value={bulkData.date}
 onChange={(e) =>
 setBulkData((prev) => ({ ...prev, date: e.target.value }))
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
 />
 </div>
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Max Marks
 </label>
 <input
 type="number"
 value={bulkData.maxMarks}
 onChange={(e) =>
 setBulkData((prev) => ({
 ...prev,
 maxMarks: parseInt(e.target.value, 10),
 }))
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
 />
 </div>
 {(bulkData.classes[0] === "Class 9" ||
 bulkData.classes[0] === "Class 10") && (
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Theory Max
 </label>
 <input
 type="number"
 value={bulkData.theoryMax}
 onChange={(e) =>
 setBulkData((prev) => ({
 ...prev,
 theoryMax: parseInt(e.target.value, 10),
 }))
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
 />
 </div>
 )}
 </div>

 <div className="flex gap-4">
 <button
 className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
 onClick={() => setView("list")}
 >
 Cancel
 </button>
 <button
 className="px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors"
 onClick={async () => {
 try {
 const className = bulkData.classes[0] || "Class 8";
 await api.exams.create({
 name: `${bulkData.examType} — ${className} — ${bulkData.subject}`,
 examType: bulkData.examType,
 term: bulkData.term,
 className,
 subject: bulkData.subject,
 date: bulkData.date,
 maxMarks: bulkData.maxMarks,
 theoryMax:
 className === "Class 9" || className === "Class 10"
 ? bulkData.theoryMax
 : bulkData.maxMarks,
 projectMax:
 className === "Class 9" || className === "Class 10"
 ? bulkData.maxMarks - bulkData.theoryMax
 : 0,
 status: "SCHEDULED",
 academicYear: "2026-27",
 });
 showToast("success", "Exam entry created");
 setView("list");
 loadData();
 } catch {
 showToast("error", "Failed to create exam");
 }
 }}
 >
 Save Exam
 </button>
 </div>
 </div>
 </div>
 )}

 {view === "results" && (
 <div key={selectedExam.id}>
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-xl font-bold text-navy font-brand">
 Exam Results Analysis
 </h1>
 <p className="text-gray-400 text-sm">
 {selectedExam.className} — {selectedExam.subject} —{" "}
 {selectedExam.term}
 </p>
 </div>
 <button
 className="inline-flex items-center gap-1 px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
 onClick={() => setView("list")}
 >
 <X size={18} /> Back
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
 {(() => {
 const resultsList = Object.values(
 selectedExam.studentMarks || {},
 );
 const scores = resultsList
 .filter((r) => !r.absent)
 .map((r) => r.total);
 const avg = scores.length
 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
 : 0;
 const highest = scores.length ? Math.max(...scores) : 0;
 const lowest = scores.length ? Math.min(...scores) : 0;
 const pass = resultsList.filter(
 (r) => r.total >= selectedExam.maxMarks * 0.33,
 ).length;
 const fail = resultsList.length - pass;

 return (
 <>
 <div className="bg-white rounded-xl shadow-card p-4 border-b-4 border-navy">
 <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Class Avg
 </h4>
 <h2 className="font-brand text-2xl font-bold text-navy">
 {avg}
 </h2>
 </div>
 <div className="bg-white rounded-xl shadow-card p-4 border-b-4 border-teal">
 <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Highest
 </h4>
 <h2 className="font-brand text-2xl font-bold text-teal">
 {highest}
 </h2>
 </div>
 <div className="bg-white rounded-xl shadow-card p-4 border-b-4 border-amber-500">
 <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Lowest
 </h4>
 <h2 className="font-brand text-2xl font-bold text-amber-500">
 {lowest}
 </h2>
 </div>
 <div className="bg-white rounded-xl shadow-card p-4 border-b-4 border-emerald-500">
 <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Passed
 </h4>
 <h2 className="font-brand text-2xl font-bold text-emerald-500">
 {pass}
 </h2>
 </div>
 <div className="bg-white rounded-xl shadow-card p-4 border-b-4 border-cta">
 <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
 Failed
 </h4>
 <h2 className="font-brand text-2xl font-bold text-cta">
 {fail}
 </h2>
 </div>
 </>
 );
 })()}
 </div>
 </div>
 )}

 {view === "report" && (
 <div className="pb-20">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-xl font-bold text-navy font-brand">
 Term Report Generator
 </h1>
 <p className="text-gray-400 text-sm">
 Select student to preview or print all cards for{" "}
 {selectedExam.className}
 </p>
 </div>
 <div className="flex gap-3">
 <button
 className="inline-flex items-center gap-1 px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
 onClick={() => setView("list")}
 >
 <X size={18} /> Back
 </button>
 <button
 className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors shadow-lg shadow-cta/20"
 onClick={() => window.print()}
 >
 <Printer size={18} /> Print Entire Class
 </button>
 </div>
 </div>

 <div className="bg-gray-100 rounded-2xl p-8 min-h-screen flex flex-col items-center gap-12 overflow-y-auto">
 {students
 .filter((s) => s.className === selectedExam.className)
 .map((student) => (
 <div
 key={student.id}
 className="bg-white shadow-2xl p-[15mm] relative report-card print:shadow-none print:m-0"
 style={{ width: "210mm", minHeight: "297mm" }}
 >
 {/* Header */}
 <div className="flex items-center gap-6 pb-6 border-b-4 border-navy mb-8">
 <div className="size-20 bg-white rounded-2xl flex items-center justify-center shrink-0 p-2 shadow-sm border border-gray-100">
  <img
  src={schoolInfo.logoUrl}
  alt="Logo"
  className="size-full object-contain"
  />
 </div>
 <div className="flex-1">
  <h1 className="text-3xl font-black text-navy font-brand tracking-tighter uppercase leading-none">
  {schoolInfo.name}
  </h1>
  <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">
  {schoolInfo.address} • Affiliated
 to CBSE New Delhi
 </p>
 </div>
 </div>

 {/* Sub-Header */}
 <div className="text-center mb-8">
 <h2 className="inline-block bg-navy text-white px-8 py-1.5 rounded-full text-sm font-black tracking-widest uppercase">
 Progress Report — {selectedExam.term} (2026-27)
 </h2>
 </div>

 {/* Student Info */}
 <div className="grid grid-cols-[1fr_120px] gap-8 mb-10">
 <div className="grid grid-cols-2 gap-y-3 gap-x-8 text-[13px]">
 <div className="flex justify-between border-b border-gray-100 pb-1">
 <strong>Student Name</strong>{" "}
 <span className="text-navy font-bold">
 {student.name.toUpperCase()}
 </span>
 </div>
 <div className="flex justify-between border-b border-gray-100 pb-1">
 <strong>Roll No</strong>{" "}
 <span className="text-navy font-bold">
 {student.roll}
 </span>
 </div>
 <div className="flex justify-between border-b border-gray-100 pb-1">
 <strong>Class & Section</strong>{" "}
 <span className="text-navy font-bold">
 {student.className}-{student.section}
 </span>
 </div>
 <div className="flex justify-between border-b border-gray-100 pb-1">
 <strong>Father's Name</strong>{" "}
 <span className="text-navy font-bold">
 {student.parentName || "N/A"}
 </span>
 </div>
 <div className="flex justify-between border-b border-gray-100 pb-1">
 <strong>Date of Birth</strong>{" "}
 <span className="text-navy font-bold">
 {student.dob || "01-01-2015"}
 </span>
 </div>
 <div className="flex justify-between border-b border-gray-100 pb-1">
 <strong>Attendance</strong>{" "}
 <span className="text-navy font-bold">92%</span>
 </div>
 </div>
 <div className="w-full aspect-[3/4] border-2 border-gray-100 rounded-xl bg-gray-50 flex items-center justify-center text-[10px] text-gray-300 font-bold uppercase tracking-tighter text-center px-4">
 Student Photo
 </div>
 </div>

 {/* Performance Table */}
 <div className="mb-10">
 <table className="w-full text-sm border-2 border-navy">
 <thead>
 <tr className="bg-navy text-white">
 <th className="px-4 py-3 text-left border-r border-white/20 uppercase tracking-wider text-xs">
 Scholastic Subjects
 </th>
 <th className="px-4 py-3 text-center border-r border-white/20 uppercase tracking-wider text-xs w-24">
 Max Marks
 </th>
 <th className="px-4 py-3 text-center border-r border-white/20 uppercase tracking-wider text-xs w-24">
 Marks Obtained
 </th>
 <th className="px-4 py-3 text-center uppercase tracking-wider text-xs w-24">
 Grade
 </th>
 </tr>
 </thead>
 <tbody>
 {/* For term logic, we would aggregate all subjects for this student and term */}
 {classSubjects
 .find((cs) => cs.className === selectedExam.className)
 ?.subjects.map((sub, idx) => {
 const marks =
 sub === selectedExam.subject
 ? selectedExam.studentMarks?.[String(student.id)]
 ?.total || 0
 : 0;
 const { grade, cls } = getGrade(
 marks,
 selectedExam.maxMarks,
 );
 return (
 <tr
 key={idx}
 className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} border-b border-navy/10`}
 >
 <td className="px-4 py-2.5 font-bold text-navy uppercase text-[12px] border-r border-navy/10">
 {sub}
 </td>
 <td className="px-4 py-2.5 text-center font-mono border-r border-navy/10">
 {selectedExam.maxMarks}
 </td>
 <td className="px-4 py-2.5 text-center font-mono font-bold text-navy border-r border-navy/10">
 {marks || "-"}
 </td>
 <td className="px-4 py-2.5 text-center font-black text-cta">
 {marks ? grade : "-"}
 </td>
 </tr>
 );
 })}
 <tr className="bg-navy/5 font-black border-t-2 border-navy">
 <td className="px-4 py-3 uppercase text-[12px]">
 Grand Total
 </td>
 <td className="px-4 py-3 text-center font-mono">
 {(classSubjects.find(
 (cs) => cs.className === selectedExam.className,
 )?.subjects.length || 0) * selectedExam.maxMarks}
 </td>
 <td className="px-4 py-3 text-center font-mono text-cta">
 {selectedExam.studentMarks?.[String(student.id)]?.total ||
 0}
 </td>
 <td className="px-4 py-3 text-center text-teal">
 {(
 ((selectedExam.studentMarks?.[String(student.id)]
 ?.total || 0) /
 selectedExam.maxMarks) *
 100
 ).toFixed(1)}
 %
 </td>
 </tr>
 </tbody>
 </table>
 </div>

 {/* Remarks & Footer */}
 <div className="grid grid-cols-2 gap-12 mb-20">
 <div className="p-4 border-2 border-navy/10 rounded-xl bg-gray-50/50">
 <h4 className="text-[10px] font-black uppercase text-navy/40 mb-2 tracking-widest">
 Teacher's Remarks
 </h4>
 <p className="text-sm italic text-navy font-medium">
 Child is showing excellent progress in overall
 development. Needs slight focus on handwriting.
 </p>
 </div>
 <div className="flex flex-col justify-center gap-4">
 <div className="flex justify-between text-[11px] font-bold uppercase text-navy border-b border-navy/10 pb-1">
 <span>Health Status</span>{" "}
 <span className="text-teal">Excellent</span>
 </div>
 <div className="flex justify-between text-[11px] font-bold uppercase text-navy border-b border-navy/10 pb-1">
 <span>Personal Hygiene</span>{" "}
 <span className="text-teal">Maintained</span>
 </div>
 </div>
 </div>

 {/* Signatures */}
 <div className="flex items-end justify-between px-4">
 <div className="text-center">
 <div className="w-32 border-b-2 border-navy mb-2"></div>
 <p className="text-[10px] font-black uppercase tracking-tighter text-navy/40">
 Class Teacher
 </p>
 </div>
 <div className="text-center relative">
 <div className="absolute -top-16 left-1/2 -translate-x-1/2 size-20 bg-teal/5 rounded-full border-2 border-dashed border-teal/20 flex items-center justify-center">
 <span className="text-[10px] text-teal/40 font-black uppercase -rotate-12">
 Office Stamp
 </span>
 </div>
 <div className="w-32 border-b-2 border-navy mb-2"></div>
 <p className="text-[10px] font-black uppercase tracking-tighter text-navy/40">
 Principal
 </p>
 </div>
 <div className="text-center">
 <div className="w-32 border-b-2 border-navy mb-2"></div>
 <p className="text-[10px] font-black uppercase tracking-tighter text-navy/40">
 Parent Signature
 </p>
 </div>
 </div>

 {/* Footer Quote */}
 <div className="absolute bottom-10 inset-x-0 text-center">
 <p className="text-[10px] font-bold text-navy/20 uppercase tracking-[0.5em]">
 Education is the manifestation of perfection already in
 man
 </p>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {view === "marks" && (
 <div className="pb-20">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-xl font-bold text-navy font-brand">
 Enter Marks: {selectedExam.subject}
 </h1>
 <p className="text-gray-400 text-sm">
 {selectedExam.className} — {selectedExam.term}
 </p>
 </div>
 <button
 className="inline-flex items-center gap-1 px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors"
 onClick={() => setView("list")}
 >
 <X size={18} /> Back
 </button>
 </div>

 <div className="bg-white rounded-xl shadow-card overflow-hidden">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-gray-50 border-b border-gray-100">
 <tr>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
 Roll
 </th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
 Student Name
 </th>
 {selectedExam.projectMax > 0 ? (
 <>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
 Theory /{selectedExam.theoryMax}
 </th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
 Project /{selectedExam.projectMax}
 </th>
 </>
 ) : (
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
 Marks /{selectedExam.maxMarks}
 </th>
 )}
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
 Total
 </th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
 Grade
 </th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
 Status
 </th>
 </tr>
 </thead>
 <tbody>
 {students
 .filter((s) => s.className === selectedExam.className)
 .map((student) => {
 const studentMarks = selectedExam.studentMarks?.[
 student.id
 ] || { theory: "", project: "", total: 0, absent: false };
 const { grade, cls } = getGrade(
 studentMarks.total || 0,
 selectedExam.maxMarks,
 );

 return (
 <tr
 key={student.id}
 className="border-b border-gray-50 hover:bg-gray-50"
 >
 <td className="px-4 py-3 font-mono text-gray-400">
 {student.roll}
 </td>
 <td className="px-4 py-3 font-brand font-semibold text-navy">
 {student.name}
 </td>
 {selectedExam.projectMax > 0 ? (
 <>
 <td className="px-4 py-3">
 <input
 type="number"
 className="w-20 px-2 py-1 border border-gray-200 rounded font-mono text-sm focus:outline-none focus:border-cta"
 value={studentMarks.theory}
 onChange={(e) => {
 const val = parseInt(e.target.value, 10) || 0;
 const newTotal =
 val + (studentMarks.project || 0);
 setSelectedExam((prev) => ({
 ...prev,
 studentMarks: {
 ...prev.studentMarks,
 [student.id]: {
 ...studentMarks,
 theory: val,
 total: newTotal,
 },
 },
 }));
 }}
 />
 </td>
 <td className="px-4 py-3">
 <input
 type="number"
 className="w-20 px-2 py-1 border border-gray-200 rounded font-mono text-sm focus:outline-none focus:border-cta"
 value={studentMarks.project}
 onChange={(e) => {
 const val = parseInt(e.target.value, 10) || 0;
 const newTotal =
 val + (studentMarks.theory || 0);
 setSelectedExam((prev) => ({
 ...prev,
 studentMarks: {
 ...prev.studentMarks,
 [student.id]: {
 ...studentMarks,
 project: val,
 total: newTotal,
 },
 },
 }));
 }}
 />
 </td>
 </>
 ) : (
 <td className="px-4 py-3">
 <input
 type="number"
 className="w-20 px-2 py-1 border border-gray-200 rounded font-mono text-sm focus:outline-none focus:border-cta"
 value={studentMarks.theory}
 onChange={(e) => {
 const val = parseInt(e.target.value, 10) || 0;
 setSelectedExam((prev) => ({
 ...prev,
 studentMarks: {
 ...prev.studentMarks,
 [student.id]: {
 ...studentMarks,
 theory: val,
 total: val,
 },
 },
 }));
 }}
 />
 </td>
 )}
 <td className="px-4 py-3 font-mono font-bold text-navy">
 {studentMarks.total || 0}
 </td>
 <td className="px-4 py-3">
 <span
 className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full ${cls}`}
 >
 {grade}
 </span>
 </td>
 <td className="px-4 py-3">
 <label className="flex items-center gap-1.5 text-xs text-gray-500">
 <input
 type="checkbox"
 className="rounded text-cta focus:ring-cta"
 checked={studentMarks.absent}
 onChange={(e) => {
 setSelectedExam((prev) => ({
 ...prev,
 studentMarks: {
 ...prev.studentMarks,
 [student.id]: {
 ...studentMarks,
 absent: e.target.checked,
 },
 },
 }));
 }}
 />{" "}
 Absent
 </label>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-6 py-4 flex items-center justify-between z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
 <p className="text-sm text-gray-500">
 Auto-calculating grades and ranks...
 </p>
 <div className="flex gap-3">
 <button
 className="px-6 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors"
 onClick={() => setView("list")}
 >
 Discard
 </button>
 <button
 className="px-6 py-2 bg-cta text-white rounded-lg text-sm font-semibold hover:bg-cta-dark transition-all shadow-lg shadow-cta/20"
 onClick={async () => {
 try {
 const results = Object.entries(
 selectedExam.studentMarks || {},
 ).map(([studentId, data]) => ({
 studentId,
 theoryMarks: data.theory || 0,
 projectMarks: data.project || 0,
 absent: !!data.absent,
 }));

 await api.exams.bulkUpsertResults({
 examId: selectedExam.id,
 results,
 });

 await api.exams.update(selectedExam.id, {
 status: "COMPLETED",
 });

 showToast("success", "Marks saved successfully");
 setView("list");
 loadData();
 } catch (err) {
 console.error(err);
 showToast("error", "Failed to save marks");
 }
 }}
 >
 Save Results
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Bulk Create Modal */}
 {showBulkModal && (
 <div className="fixed inset-0 bg-navy/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
 <div className="bg-white rounded-2xl shadow-modal w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
 <div className="flex items-center justify-between p-6 bg-navy text-white">
 <div>
 <h3 className="text-lg font-bold font-brand">
 Bulk Create Exams
 </h3>
 <p className="text-white/60 text-xs mt-0.5">
 Generate entries for multiple classes at once
 </p>
 </div>
 <button
 onClick={() => setShowBulkModal(false)}
 className="p-2 hover:bg-white/10 rounded-full transition-colors"
 >
 <X size={20} />
 </button>
 </div>

 <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
 <div className="space-y-4">
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
 Academic Term
 </label>
 <CustomSelect
 value={bulkData.term}
 onChange={(val) =>
 setBulkData((prev) => ({ ...prev, term: val }))
 }
 options={TERMS}
 />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
 Test / Exam Name
 </label>
 <CustomSelect
 value={bulkData.examType}
 onChange={(val) =>
 setBulkData((prev) => ({ ...prev, examType: val }))
 }
 options={EXAM_TYPES}
 />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
 Exam Date
 </label>
 <input
 type="date"
 value={bulkData.date}
 onChange={(e) =>
 setBulkData((prev) => ({ ...prev, date: e.target.value }))
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
 />
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
 Max Marks
 </label>
 <input
 type="number"
 value={bulkData.maxMarks}
 onChange={(e) =>
 setBulkData((prev) => ({
 ...prev,
 maxMarks: parseInt(e.target.value, 10),
 }))
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
 />
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
 Theory Max (9-10)
 </label>
 <input
 type="number"
 value={bulkData.theoryMax}
 onChange={(e) =>
 setBulkData((prev) => ({
 ...prev,
 theoryMax: parseInt(e.target.value, 10),
 }))
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
 />
 </div>
 </div>
 </div>

 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">
 Select Classes
 </label>
 <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 p-3 max-h-[220px] overflow-y-auto">
 <div className="grid grid-cols-2 gap-2">
 {CLASSES.map((cls) => (
 <label
 key={cls}
 className="flex items-center gap-2 p-2 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-gray-200"
 >
 <input
 type="checkbox"
 className="rounded text-cta focus:ring-cta"
 checked={bulkData.classes.includes(cls)}
 onChange={(e) => {
 const newClasses = e.target.checked
 ? [...bulkData.classes, cls]
 : bulkData.classes.filter((c) => c !== cls);
 setBulkData((prev) => ({
 ...prev,
 classes: newClasses,
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
 <p className="text-[10px] text-gray-400 mt-2 flex items-center gap-1">
 <AlertCircle size={12} /> This will create one entry per
 subject for each selected class.
 </p>
 </div>
 </div>

 <div className="p-6 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
 <span className="text-xs text-navy font-medium">
 Selected: {bulkData.classes.length} classes
 </span>
 <div className="flex gap-3">
 <button
 onClick={() => setShowBulkModal(false)}
 className="px-5 py-2 text-gray-500 hover:bg-gray-200 rounded-lg text-sm font-semibold transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleBulkCreate}
 className="px-6 py-2 bg-cta text-white rounded-lg text-sm font-bold shadow-lg shadow-cta/20 hover:bg-cta-dark transition-all"
 >
 Generate Exams
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}

