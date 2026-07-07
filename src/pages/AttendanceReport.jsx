import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Download, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import CustomSelect from '../components/ui/CustomSelect';
import { api } from '../api/client';
import { ALL_CLASSES } from '../constants/classes';

export default function AttendanceReport() {
 const navigate = useNavigate();
 const { students, currentUser } = useAppContext();
 const [activeClass, setActiveClass] = useState('All');
 const [activeMonth, setActiveMonth] = useState(() => {
 const d = new Date();
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
 });
 const [searchQuery, setSearchQuery] = useState('');
 const [attendanceReport, setAttendanceReport] = useState([]);

 const isTeacher = currentUser?.role === 'Teacher';
 const teacherClasses = currentUser?.assignedClasses || [];
 const availableClasses = isTeacher && teacherClasses.length > 0
 ? ALL_CLASSES.filter(c => teacherClasses.includes(c))
 : ALL_CLASSES;

 const classes = ['All', ...availableClasses];

  const monthOptions = useMemo(() => {
    const opts = [];
    const now = new Date();
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      opts.push({ value: val, label });
    }
    return opts;
  }, []);

  useEffect(() => {
    const [year, month] = activeMonth.split('-');
    api.attendance.report({ month: parseInt(month, 10), year: parseInt(year, 10), type: 'student' })
      .then(res => setAttendanceReport(res?.data || []))
      .catch(() => setAttendanceReport([]));
  }, [activeMonth]);

 const filteredStudents = useMemo(() => {
 return students.filter(s => {
 if (activeClass !== 'All' && s.className !== activeClass) return false;
 if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !(s.roll || '').includes(searchQuery)) return false;
 return true;
 }).map(s => {
 // Find matching report record
 const report = attendanceReport.find(r => String(r.studentId) === String(s.id));
 const totalDays = report?.totalDays || 24;
 const present = report?.present || 0;
 const absent = report?.absent || totalDays - present;
 const percentage = totalDays > 0 ? Math.round((present / totalDays) * 100) : 0;
 return { ...s, totalDays, present, absent, percentage };
 }).sort((a, b) => (a.roll || '').localeCompare(b.roll || ''));
 }, [students, activeClass, searchQuery, attendanceReport]);

 const classAvg = useMemo(() => {
 if (filteredStudents.length === 0) return 0;
 return Math.round(filteredStudents.reduce((acc, s) => acc + s.percentage, 0) / filteredStudents.length);
 }, [filteredStudents]);

 const activeMonthLabel = monthOptions.find(o => o.value === activeMonth)?.label || activeMonth;

 return (
 <div className="min-h-screen">
 <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-4 transition-colors">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg> Back
 </button>
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-xl font-bold text-navy font-brand">Monthly Attendance Report</h1>
 <div className="flex items-center gap-3">
 <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 gap-2">
 <Search size={18} className="text-gray-400" />
 <input type="text" placeholder="Search by name..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="border-none bg-transparent text-sm py-2 focus:outline-none w-40" />
 </div>
 <button className="inline-flex items-center gap-2 px-4 py-2 border border-cta text-cta rounded-lg text-sm font-medium hover:bg-cta/10 transition-colors" onClick={() => window.print()}>
 <Download size={18} /><span className="hidden md:inline">Export PDF</span>
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
 <div className="bg-white rounded-xl shadow-card p-4 flex items-center gap-3 relative z-20">
 <Calendar size={18} className="text-gray-400 shrink-0" />
 <div className="flex-1">
 <CustomSelect 
 value={activeMonth} 
 onChange={setActiveMonth} 
 options={monthOptions}
 />
 </div>
 </div>
 <div className="bg-white rounded-xl shadow-card p-4 border-l-4 border-teal">
 <div className="text-xs text-gray-400">Class Average ({activeMonthLabel})</div>
 <div className={`font-brand font-bold text-2xl flex items-center gap-2 ${classAvg >= 85 ? 'text-emerald-500' : classAvg >= 75 ? 'text-amber-500' : 'text-cta'}`}>
 {classAvg}%
 {classAvg >= 85 ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
 </div>
 </div>
 <div className="bg-white rounded-xl shadow-card p-4">
 <div className="text-xs text-gray-400">Total Students</div>
 <div className="font-brand font-bold text-2xl text-navy">{filteredStudents.length}</div>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-card overflow-hidden">
 <div className="flex gap-2 p-4 border-b border-gray-100 bg-gray-50 overflow-x-auto">
 {classes.map(c => (
 <button key={c} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${activeClass === c ? 'bg-navy text-white' : 'bg-transparent text-gray-500 border border-gray-200 hover:border-cta'}`} onClick={() => setActiveClass(c)}>{c}</button>
 ))}
 </div>

 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead className="bg-gray-50 border-b border-gray-100">
 <tr>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Roll No</th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Student Name</th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Class</th>
 <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Working Days</th>
 <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Present</th>
 <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Absent</th>
 <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">Attendance %</th>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
 </tr>
 </thead>
 <tbody>
 {filteredStudents.length > 0 ? filteredStudents.map((student) => (
 <tr key={student.id} className="border-b border-gray-50 hover:bg-gray-50">
 <td className="px-4 py-3 font-mono text-gray-400">{student.roll}</td>
 <td className="px-4 py-3 font-semibold text-gray-700">{student.name}</td>
 <td className="px-4 py-3 text-gray-700">{student.className}</td>
 <td className="px-4 py-3 text-center text-gray-700">{student.totalDays}</td>
 <td className="px-4 py-3 text-center text-emerald-500 font-semibold">{student.present}</td>
 <td className={`px-4 py-3 text-center ${student.absent > 5 ? 'text-cta' : 'text-gray-500'}`}>{student.absent}</td>
 <td className="px-4 py-3">
 <div className="flex items-center justify-center gap-2">
 <span className="font-semibold">{student.percentage}%</span>
 <div className="w-10 h-1 bg-gray-200 rounded-full overflow-hidden">
 <div className={`h-full rounded-full ${student.percentage >= 85 ? 'bg-emerald-500' : student.percentage >= 75 ? 'bg-amber-500' : 'bg-cta'}`} style={{ width: `${student.percentage}%` }}></div>
 </div>
 </div>
 </td>
 <td className="px-4 py-3">
 {student.percentage < 75 ? (
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cta/10 text-cta text-xs font-medium rounded-full">Defaulter ({'<'}75%)</span>
 ) : (
 <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal/10 text-teal text-xs font-medium rounded-full">Regular</span>
 )}
 </td>
 </tr>
 )) : (
 <tr><td colSpan="8" className="text-center py-10 text-gray-400">No students found for this selected class.</td></tr>
 )}
 </tbody>
 </table>
 </div>
 </div>
 </div>
 );
}
