import React, { useState, useEffect, useMemo } from "react";
import {
 ChevronRight,
 Check,
 Circle,
 Clock,
 Loader2,
 Plus,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { api } from "../api/client";
import { ALL_CLASSES } from "../constants/classes";

export default function SyllabusTracker() {
 const { showToast, currentUser } = useAppContext();
 const [viewState, setViewState] = useState("grid");
 const [selectedDetail, setSelectedDetail] = useState(null);
 const [syllabusData, setSyllabusData] = useState([]);
 const [classSubjects, setClassSubjects] = useState([]);
 const [loading, setLoading] = useState(true);

 // Detail view state for adding new chapter
 const [showAddForm, setShowAddForm] = useState(false);
 const [newChapterNo, setNewChapterNo] = useState("");
 const [newChapterName, setNewChapterName] = useState("");

 const academicYear = "2026-27"; // Currently static per requirements

 useEffect(() => {
 loadData();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 const loadData = async () => {
 try {
 const [syllabusRes, classSubRes] = await Promise.all([
 api.exams.syllabus.list({ page: 1, limit: 500 }),
 api.classSubjects.list({ page: 1, limit: 500 }),
 ]);

 const toFrontendStatus = (st) => {
 const upper = String(st || "").toUpperCase();
 if (upper === "PENDING") return "pending";
 if (upper === "IN_PROGRESS") return "progress";
 if (upper === "COMPLETED") return "done";
 return "pending";
 };

 setSyllabusData(
 (syllabusRes?.data || []).map((s) => ({
 ...s,
 id: s._id,
 chapterNo: s.chapterNo !== undefined ? Number(s.chapterNo) : 0,
 status: toFrontendStatus(s.status),
 completedDate: s.completedDate || null,
 })),
 );
 setClassSubjects(classSubRes?.data || []);
 } catch {
 showToast("error", "Failed to load syllabus data");
 } finally {
 setLoading(false);
 }
 };

 const getCellColor = (val) => {
 if (val < 50) return "bg-cta/20 text-cta";
 if (val < 75) return "bg-amber-100 text-amber-700";
 return "bg-teal/10 text-teal"; // High completion color is teal
 };

 const handleCellClick = (className, subject) => {
 setSelectedDetail({ className, subject });
 setViewState("detail");
 setShowAddForm(false);
 };

 const toggleChapterStatus = async (chapter) => {
 const statusCycle = {
 pending: "progress",
 progress: "done",
 done: "pending",
 };

 const newStatus = statusCycle[chapter.status];
 const completedDate =
 newStatus === "done" ? new Date().toISOString().split("T")[0] : null;

 const toBackendStatus = (st) => {
 const lower = String(st || "").toLowerCase();
 if (lower === "pending") return "PENDING";
 if (lower === "progress") return "IN_PROGRESS";
 if (lower === "done") return "COMPLETED";
 return "PENDING";
 };

 try {
 await api.exams.syllabus.update(chapter.id, {
 status: toBackendStatus(newStatus),
 completedDate,
 });
 await loadData();
 } catch {
 showToast("error", "Failed to update chapter status");
 }
 };

 const handleAddChapter = async () => {
 if (!newChapterNo || !newChapterName.trim()) {
 showToast("error", "Please provide chapter number and name");
 return;
 }

 try {
 await api.exams.syllabus.create({
 className: selectedDetail.className,
 subject: selectedDetail.subject,
 chapterNo: Number(newChapterNo),
 chapterName: newChapterName.trim(),
 status: "PENDING",
 completedDate: null,
 });
 showToast("success", "Chapter added successfully");
 setNewChapterNo("");
 setNewChapterName("");
 setShowAddForm(false);
 await loadData();
 } catch {
 showToast("error", "Failed to add chapter");
 }
 };

 // Compute Grid Data
 const { subjects, gridData } = useMemo(() => {
 // List of all possible classes
 
 // Filter classes based on teacher assignments
 let visibleClasses = classSubjects.map((cs) => cs.className);
 if (
 currentUser?.role === "Teacher" &&
 currentUser?.assignedClasses?.length > 0
 ) {
 visibleClasses = visibleClasses.filter((c) =>
 currentUser.assignedClasses.includes(c),
 );
 }

 // Collect all subjects only from the visible classes
 const visibleSubConfigs = classSubjects.filter((cs) =>
 visibleClasses.includes(cs.className),
 );
 const allSubjects = [
 ...new Set(visibleSubConfigs.flatMap((cs) => cs.subjects)),
 ].sort();

 // Default fallback if DB is completely empty for these
 const finalClasses =
 visibleClasses.length > 0
 ? visibleClasses
 : currentUser?.role === "Teacher"
 ? []
 : ALL_CLASSES;
 const finalSubjects =
 allSubjects.length > 0
 ? allSubjects
 : ["Maths", "Science", "English", "SST", "Hindi"];

 const grid = finalClasses.map((c) => {
 const row = { className: c };
 const classSubInfo = classSubjects.find((cs) => cs.className === c);

 finalSubjects.forEach((s) => {
 // Only calculate if the subject exists for this class
 if (classSubInfo && classSubInfo.subjects.includes(s)) {
 const chapters = syllabusData.filter(
 (d) => d.className === c && d.subject === s,
 );
 if (chapters.length === 0) {
 row[s] = 0;
 } else {
 const done = chapters.filter((d) => d.status === "done").length;
 row[s] = Math.round((done / chapters.length) * 100);
 }
 } else {
 row[s] = null; // No subject for this class
 }
 });
 return row;
 });

 return { classes: finalClasses, subjects: finalSubjects, gridData: grid };
 }, [syllabusData, classSubjects]);

 // Compute Detail Data
 const detailData = useMemo(() => {
 if (!selectedDetail)
 return { chapters: [], progressPercent: 0, doneCount: 0, totalCount: 0 };

 const chapters = syllabusData
 .filter(
 (d) =>
 d.className === selectedDetail.className &&
 d.subject === selectedDetail.subject,
 )
 .sort((a, b) => a.chapterNo - b.chapterNo);

 const totalCount = chapters.length;
 const doneCount = chapters.filter((d) => d.status === "done").length;
 const progressPercent =
 totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

 return { chapters, progressPercent, doneCount, totalCount };
 }, [syllabusData, selectedDetail]);

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
 <div>
 <h1 className="text-xl font-bold text-navy font-brand">
 Syllabus Overview
 </h1>
 {viewState === "detail" && selectedDetail && (
 <p className="text-gray-400 text-sm mt-1 flex items-center gap-1">
 <span
 className="cursor-pointer hover:text-cta transition-colors"
 onClick={() => setViewState("grid")}
 >
 All Classes
 </span>
 <ChevronRight size={14} />
 {selectedDetail.className} — {selectedDetail.subject}
 </p>
 )}
 </div>
 <select
 value={academicYear}
 disabled
 className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
 >
 <option>{academicYear}</option>
 </select> 
 </div>

 {viewState === "grid" && (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
 {gridData.map((row) => (
 <div
 key={row.className}
 className="bg-white rounded-2xl shadow-card p-6 border border-gray-100 hover:shadow-lg transition-all"
 >
 <h3 className="font-brand font-bold text-navy text-[17px] mb-4 pb-3 border-b border-gray-100 flex items-center justify-between">
 <span>Class {row.className}</span>
 <span className="text-[10px] font-medium px-2 py-0.5 bg-gray-100 text-gray-500 rounded-lg">{subjects.filter(s => row[s] !== null).length} Subjects</span>
 </h3>
 <div className="space-y-4">
 {subjects.map(
 (s) =>
 row[s] !== null && (
 <div
 key={s}
 className="cursor-pointer group flex flex-col gap-1.5"
 onClick={() => handleCellClick(row.className, s)}
 >
 <div className="flex justify-between items-end text-sm">
 <span className="font-semibold text-gray-600 group-hover:text-cta transition-colors text-[13px]">
 {s}
 </span>
 <span className="font-bold text-navy font-mono text-[13px]">
 {row[s]}%
 </span>
 </div>
 <div className="w-full bg-gray-100 rounded-full h-2 relative overflow-hidden group-hover:bg-gray-200 transition-colors">
 <div
 className={`absolute top-0 left-0 h-full rounded-full transition-all duration-500 ${
 row[s] >= 100
 ? "bg-teal"
 : row[s] >= 50
 ? "bg-amber-400"
 : "bg-cta"
 }`}
 style={{ width: `${row[s]}%` }}
 ></div>
 </div>
 </div>
 ),
 )}
 {subjects.filter(s => row[s] !== null).length === 0 && (
 <div className="text-center text-sm text-gray-400 py-4">No subjects mapped</div>
 )}
 </div>
 </div>
 ))}
 </div>
 )}

 {viewState === "detail" && selectedDetail && (
 <div className="flex flex-col gap-6">
 <div className="bg-white rounded-xl shadow-card p-6">
 <div className="flex items-center justify-between">
 <h2 className="font-brand font-bold text-xl text-navy">
 {selectedDetail.className} — {selectedDetail.subject}
 </h2>
 {!showAddForm && (
 <button
 onClick={() => setShowAddForm(true)}
 className="inline-flex items-center gap-2 px-3 py-1.5 bg-cta/10 text-cta rounded-lg text-sm font-medium hover:bg-cta/20 transition-colors"
 >
 <Plus size={16} /> Add Chapter
 </button>
 )}
 </div>

 <div className="flex items-center gap-4 mt-4">
 <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
 <div
 className="h-full bg-cta rounded-full transition-all duration-500"
 style={{ width: `${detailData.progressPercent}%` }}
 ></div>
 </div>
 <h2 className="font-brand text-cta text-2xl font-bold">
 {detailData.progressPercent}%
 </h2>
 <span className="text-gray-400 text-sm">
 {detailData.doneCount}/{detailData.totalCount} chapters
 </span>
 </div>

 {showAddForm && (
 <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-100 flex flex-col sm:flex-row sm:items-end gap-3">
 <div className="flex flex-col gap-1 w-full sm:w-24">
 <label className="text-xs font-medium text-gray-500 uppercase">
 Ch No.
 </label>
 <input
 type="number"
 min="1"
 value={newChapterNo}
 onChange={(e) => setNewChapterNo(e.target.value)}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
 />
 </div>
 <div className="flex flex-col gap-1 flex-1 w-full">
 <label className="text-xs font-medium text-gray-500 uppercase">
 Chapter Name
 </label>
 <input
 type="text"
 placeholder="e.g. Algebra Basics"
 value={newChapterName}
 onChange={(e) => setNewChapterName(e.target.value)}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
 />
 </div>
 <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
 <button
 onClick={() => setShowAddForm(false)}
 className="flex-1 sm:flex-none px-4 py-2 text-gray-500 hover:bg-gray-200 bg-gray-100 rounded-lg text-sm font-medium transition-colors"
 >
 Cancel
 </button>
 <button
 onClick={handleAddChapter}
 className="flex-1 sm:flex-none px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors"
 >
 Save
 </button>
 </div>
 </div>
 )}
 </div>

 <div className="bg-white rounded-xl shadow-card overflow-hidden">
 {detailData.chapters.length === 0 ? (
 <div className="p-8 text-center text-gray-400">
 No chapters added yet for this subject.
 </div>
 ) : (
 detailData.chapters.map((item) => (
 <div
 key={item.id}
 className={`flex items-center gap-4 px-6 py-4 border-b border-gray-50 cursor-pointer transition-colors ${
 item.status === "done"
 ? "bg-cta/5 hover:bg-cta/10"
 : item.status === "progress"
 ? "bg-amber-50 hover:bg-amber-100/50"
 : "hover:bg-gray-50"
 }`}
 onClick={() => toggleChapterStatus(item)}
 >
 <div
 className={`size-7 rounded-full flex items-center justify-center shrink-0 transition-colors ${
 item.status === "done"
 ? "bg-cta text-white"
 : item.status === "progress"
 ? "bg-amber-400 text-white"
 : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
 }`}
 >
 {item.status === "done" ? (
 <Check size={14} />
 ) : item.status === "progress" ? (
 <Clock size={14} />
 ) : (
 <Circle size={14} />
 )}
 </div>
 <div className="flex-1 min-w-0">
 <span className="font-brand text-sm">
 Ch {item.chapterNo}: {item.chapterName}
 </span>
 </div>
 <span
 className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
 item.status === "done"
 ? "bg-cta/10 text-cta"
 : item.status === "progress"
 ? "bg-amber-100 text-amber-700"
 : "bg-gray-100 text-gray-500"
 }`}
 >
 {item.status === "done"
 ? `Done (${item.completedDate})`
 : item.status === "progress"
 ? "In Progress"
 : "Click to start"}
 </span>
 </div>
 ))
 )}
 </div>
 </div>
 )}
 </div>
 );
}
