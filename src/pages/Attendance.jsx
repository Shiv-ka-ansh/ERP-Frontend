import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, BarChart2, Save, CheckCircle2, RotateCcw, Clock, Circle, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { api } from '../api/client';
import { ALL_CLASSES } from '../constants/classes';

export default function Attendance() {
 const navigate = useNavigate();
 const { showToast, students, currentUser } = useAppContext();

 const isTeacher = currentUser?.role === 'Teacher';
 const teacherClasses = currentUser?.assignedClasses || [];
 const availableClasses = isTeacher && teacherClasses.length > 0
 ? ALL_CLASSES.filter(c => teacherClasses.includes(c))
 : ALL_CLASSES;

 const [activeClass, setActiveClass] = useState(localStorage.getItem('attendance_last_class') || availableClasses[0]);
 const [attendanceData, setAttendanceData] = useState({});
 const [hasChanges, setHasChanges] = useState(false);
 const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
 const [saving, setSaving] = useState(false);
 const [notes, setNotes] = useState({});

 // Filter students for the active class
 const classStudents = useMemo(() => {
 return students
 .filter(s => s.className === activeClass)
 .sort((a, b) => (a.roll || '').localeCompare(b.roll || ''));
 }, [students, activeClass]);

 // Fetch existing attendance for the selected date & class
 useEffect(() => {
 const loadAttendance = async () => {
 try {
 const res = await api.attendance.get({ date: selectedDate, type: 'STUDENT', className: activeClass });
 const records = res?.data || [];
 const dataMap = {};
 const notesMap = {};
 records.forEach(r => {
 // Map backend enum to frontend 'P', 'A', 'L'
 if (r.studentId) {
 let mappedStatus = r.status;
 if (r.status === 'PRESENT') mappedStatus = 'P';
 else if (r.status === 'ABSENT') mappedStatus = 'A';
 else if (r.status === 'LATE') mappedStatus = 'L';
 dataMap[r.studentId] = mappedStatus;
 notesMap[r.studentId] = r.remarks || '';
 }
 });
 setAttendanceData(dataMap);
 setNotes(notesMap);
 setHasChanges(false);
 } catch {
 // If no records, start fresh
 setAttendanceData({});
 setNotes({});
 }
 };
 loadAttendance();
 }, [selectedDate, activeClass]);

 const handleMark = (id, status) => {
 setAttendanceData(prev => ({ ...prev, [id]: prev[id] === status ? null : status }));
 setHasChanges(true);
 };

 const handleMarkAll = () => {
 const newData = { ...attendanceData };
 classStudents.forEach(s => { newData[s.id] = 'P'; });
 setAttendanceData(newData);
 setHasChanges(true);
 };

 const handleReset = () => {
 const newData = { ...attendanceData };
 classStudents.forEach(s => { delete newData[s.id]; });
 setAttendanceData(newData);
 setHasChanges(true);
 };

 const handleSave = async () => {
 setSaving(true);
 try {
 const records = classStudents
 .filter(s => attendanceData[s.id])
 .map(s => {
 let mappedStatus = attendanceData[s.id];
 if (mappedStatus === 'P') mappedStatus = 'PRESENT';
 else if (mappedStatus === 'A') mappedStatus = 'ABSENT';
 else if (mappedStatus === 'L') mappedStatus = 'LATE';

 return {
 studentId: s.id,
 status: mappedStatus,
 remarks: notes[s.id] || ''
 };
 });

 if (records.length === 0) {
 showToast('error', 'No attendance marked yet');
 setSaving(false);
 return;
 }

 await api.attendance.bulkUpsert({
 type: 'STUDENT',
 date: selectedDate,
 className: activeClass,
 records
 });
 setHasChanges(false);
 showToast('success', 'Attendance saved successfully');
 } catch {
 showToast('error', 'Failed to save attendance');
 } finally {
 setSaving(false);
 }
 };

  const getStats = () => {
    const stats = { P: 0, A: 0, L: 0, U: 0 };
    classStudents.forEach(s => {
      const val = attendanceData[s.id];
      if (val === 'P') stats.P += 1;
      else if (val === 'A') stats.A += 1;
      else if (val === 'L') stats.L += 1;
      else stats.U += 1;
    });
    return stats;
  };
 const stats = getStats();

 const handleDateNav = (dir) => {
 const d = new Date(selectedDate);
 d.setDate(d.getDate() + dir);
 if (d <= new Date()) {
 setSelectedDate(d.toISOString().split('T')[0]);
 }
 };

 return (
 <div className="min-h-screen pb-20">
 {/* CONTROLS ROW */}
 <div className="flex flex-wrap items-center gap-4 mb-6">
 <div className="flex items-center gap-2">
 <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500" onClick={() => handleDateNav(-1)} aria-label="Previous Day"><ChevronLeft size={16} /></button>
 <div className="font-brand font-semibold text-navy text-sm">{new Date(`${selectedDate}T00:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}</div>
 <button className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500" disabled={selectedDate >= new Date().toISOString().split('T')[0]} onClick={() => handleDateNav(1)} aria-label="Next Day"><ChevronRight size={16} /></button>
 </div>

 <div className="flex gap-1.5 overflow-x-auto flex-1">
 {availableClasses.map(c => (
 <button key={c} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeClass === c ? 'bg-navy text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-cta'}`} 
 onClick={() => {
 setActiveClass(c);
 localStorage.setItem('attendance_last_class', c);
 }}>
 {c.replace('Class ', 'C')}
 </button>
 ))}
 </div>

 <button className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors" onClick={() => navigate('/attendance/report')}>
 <BarChart2 size={16} /> <span className="hidden md:inline">View Report</span>
 </button>
 </div>

 {/* STATUS BAR */}
 <div className="bg-white rounded-xl shadow-card p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
 <div className="text-center"><div className="text-xs text-gray-400 mb-1">Present</div><div className="text-lg font-semibold text-green-500 flex items-center justify-center gap-1">{stats.P} <CheckCircle2 size={16} /></div></div>
 <div className="text-center"><div className="text-xs text-gray-400 mb-1">Absent</div><div className="text-lg font-semibold text-cta flex items-center justify-center gap-1">{stats.A} <Circle size={16} fill="currentColor" /></div></div>
 <div className="text-center"><div className="text-xs text-gray-400 mb-1">Late</div><div className="text-lg font-semibold text-amber-400 flex items-center justify-center gap-1">{stats.L} <Clock size={16} /></div></div>
 <div className="text-center"><div className="text-xs text-gray-400 mb-1">Unmarked</div><div className="text-lg font-semibold text-gray-400 flex items-center justify-center gap-1">{stats.U} <Circle size={16} /></div></div>
 </div>

 {/* BULK ACTIONS */}
 <div className="flex gap-3 mb-4">
 <button className="inline-flex items-center gap-2 px-4 py-2 border border-green-500 text-green-500 rounded-lg text-sm font-medium hover:bg-green-500/10 transition-colors" onClick={handleMarkAll}><CheckCircle2 size={16} /> Mark All Present</button>
 <button className="inline-flex items-center gap-2 px-4 py-2 border border-cta text-cta rounded-lg text-sm font-medium hover:bg-cta/10 transition-colors" onClick={handleReset}><RotateCcw size={16} /> Reset All</button>
 </div>

 {/* ATTENDANCE LIST */}
 <div className="bg-white rounded-xl shadow-card overflow-hidden">
 <div className="overflow-x-auto rounded-xl border border-gray-100">
 <table className="w-full text-sm min-w-[600px]">
 <thead className="bg-gray-50 border-b border-gray-100">
 <tr>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">Roll</th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-16">Photo</th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Student Name</th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-48">Status</th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Note</th>
 </tr>
 </thead>
 <tbody>
 {classStudents.length === 0 && (
 <tr><td colSpan="5" className="px-4 py-8 text-center text-gray-400">No students found for {activeClass}.</td></tr>
 )}
 {classStudents.map(student => {
 const status = attendanceData[student.id];
 const rowBg = status === 'P' ? 'bg-teal/5' : status === 'A' ? 'bg-cta/5' : status === 'L' ? 'bg-amber-50' : '';
 return (
 <tr key={student.id} className={`${rowBg} border-b border-gray-50 hover:bg-gray-50`}>
 <td className="px-4 py-3 font-mono text-gray-500">{student.roll || '—'}</td>
 <td className="px-4 py-3"><div className="size-8 rounded-full bg-teal/10 text-teal flex items-center justify-center text-xs font-bold">{student.name.charAt(0)}</div></td>
 <td className="px-4 py-3">
 <div className="font-brand text-sm">{student.name}</div>
 </td>
 <td className="px-4 py-3">
 <div className="flex gap-2">
 <button className={`size-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${status === 'P' ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 hover:border-2 hover:border-gray-300'}`} onClick={() => handleMark(student.id, 'P')} aria-label="Mark Present">P</button>
 <button className={`size-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${status === 'A' ? 'bg-cta text-white' : 'bg-gray-100 text-gray-400 hover:border-2 hover:border-gray-300'}`} onClick={() => handleMark(student.id, 'A')} aria-label="Mark Absent">A</button>
 <button className={`size-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all ${status === 'L' ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-400 hover:border-2 hover:border-gray-300'}`} onClick={() => handleMark(student.id, 'L')} aria-label="Mark Late">L</button>
 </div>
 </td>
 <td className="px-4 py-3">
 <input
 type="text"
 placeholder="Add note..."
 value={notes[student.id] || ''}
 onChange={e => setNotes(prev => ({ ...prev, [student.id]: e.target.value }))}
 className="px-2 py-1 border border-gray-200 rounded text-xs focus:outline-none focus:border-cta w-full"
 />
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>

 {/* STICKY BOTTOM SAVE */}
 <div className="fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 px-6 py-3 flex items-center justify-between z-20 shadow-card">
 <span className="text-sm text-gray-400">{hasChanges ? 'Unsaved changes' : 'All changes saved'}</span>
 <button
 className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 disabled={!hasChanges || saving}
 onClick={handleSave}
 >
 <Save size={18} /> {saving ? 'Saving...' : 'Save Attendance'}
 </button>
 </div>
 </div>
 );
}
