import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function CustomDatePicker({
 selected,
 onChange,
 placeholderText = 'Select date',
 minDate,
 maxDate,
 error = false,
 className = '',
}) {
 const [open, setOpen] = useState(false);
 // 'days' | 'months' | 'years'
 const [view, setView] = useState('days');
 const containerRef = useRef(null);

 // Parse selected value
 const parseSafeDate = (val) => {
 if (!val) return null;
 if (val instanceof Date) return val;
 if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
 const [y, m, d] = val.split("-").map(Number);
 return new Date(y, m - 1, d);
 }
 return new Date(val);
 };

 const selectedDate = useMemo(() => parseSafeDate(selected), [selected]);
 const parsedMin = useMemo(() => parseSafeDate(minDate), [minDate]);
 const parsedMax = useMemo(() => parseSafeDate(maxDate), [maxDate]);

 const [viewMonth, setViewMonth] = useState(() => {
 if (selectedDate) return selectedDate.getMonth();
 if (parsedMax && new Date() > parsedMax) return parsedMax.getMonth();
 return new Date().getMonth();
 });
 const [viewYear, setViewYear] = useState(() => {
 if (selectedDate) return selectedDate.getFullYear();
 if (parsedMax && new Date() > parsedMax) return parsedMax.getFullYear();
 return new Date().getFullYear();
 });
 const [yearRangeStart, setYearRangeStart] = useState(() => {
 const y = selectedDate ? selectedDate.getFullYear() : (parsedMax && new Date() > parsedMax ? parsedMax.getFullYear() : new Date().getFullYear());
 return y - (y % 12);
 });

 // Re-sync view when selected changes
 useEffect(() => {
 if (selectedDate) {
 setViewMonth(selectedDate.getMonth());
 setViewYear(selectedDate.getFullYear());
 }
 }, [selectedDate]);

 // Close on outside click
 useEffect(() => {
 const handler = (e) => {
 if (containerRef.current && !containerRef.current.contains(e.target)) {
 setOpen(false);
 setView('days');
 }
 };
 document.addEventListener('mousedown', handler);
 return () => document.removeEventListener('mousedown', handler);
 }, []);

 const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate();
 const getFirstDayOfMonth = (m, y) => new Date(y, m, 1).getDay();

 const isDateDisabled = (d) => {
 if (parsedMin && d < new Date(parsedMin.getFullYear(), parsedMin.getMonth(), parsedMin.getDate())) return true;
 if (parsedMax && d > new Date(parsedMax.getFullYear(), parsedMax.getMonth(), parsedMax.getDate())) return true;
 return false;
 };

 const isSameDay = (a, b) =>
 a && b && a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

 const isToday = (d) => isSameDay(d, new Date());

 const handleSelectDay = (day) => {
 const d = new Date(viewYear, viewMonth, day);
 if (isDateDisabled(d)) return;
 if (onChange) {
 const offset = d.getTimezoneOffset();
 const localDate = new Date(d.getTime() - offset * 60 * 1000);
 onChange(localDate.toISOString().split('T')[0]);
 }
 setOpen(false);
 setView('days');
 };

 const handlePrevMonth = () => {
 if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
 else setViewMonth(viewMonth - 1);
 };
 const handleNextMonth = () => {
 if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
 else setViewMonth(viewMonth + 1);
 };

 const handleSelectMonth = (m) => {
 setViewMonth(m);
 setView('days');
 };

 const handleSelectYear = (y) => {
 setViewYear(y);
 setView('months');
 };

 const displayValue = selectedDate
 ? `${String(selectedDate.getDate()).padStart(2, '0')}/${String(selectedDate.getMonth() + 1).padStart(2, '0')}/${selectedDate.getFullYear()}`
 : '';

 // Build calendar days grid
 const daysInMonth = getDaysInMonth(viewMonth, viewYear);
 const firstDay = getFirstDayOfMonth(viewMonth, viewYear);
 const prevMonthDays = getDaysInMonth(viewMonth === 0 ? 11 : viewMonth - 1, viewMonth === 0 ? viewYear - 1 : viewYear);
 const calendarCells = [];

 // Previous month trailing days
 for (let i = firstDay - 1; i >= 0; i -= 1) {
 calendarCells.push({ day: prevMonthDays - i, type: 'prev' });
 }
 // Current month days
 for (let i = 1; i <= daysInMonth; i += 1) {
 calendarCells.push({ day: i, type: 'current' });
 }
 // Next month leading days
 const remaining = 42 - calendarCells.length;
 for (let i = 1; i <= remaining; i += 1) {
 calendarCells.push({ day: i, type: 'next' });
 }

 return (
 <div className={`relative w-full ${className}`} ref={containerRef}>
 {/* Input trigger */}
 <div
 className={`flex items-center w-full cursor-pointer rounded-lg bg-white py-2 pl-10 pr-3 border text-sm transition-all
 ${error ? 'border-cta ring-2 ring-cta/20' : 'border-gray-200 hover:border-gray-300 focus-within:border-navy focus-within:ring-2 focus-within:ring-navy/20'}
 `}
 onClick={() => { setOpen(!open); setView('days'); }}
 >
 <span className="pointer-events-none absolute left-0 flex items-center pl-3">
 <Calendar className="size-4 text-gray-400" />
 </span>
 <span className={displayValue ? 'text-gray-800' : 'text-gray-400'}>
 {displayValue || placeholderText}
 </span>
 </div>

 {/* Dropdown Calendar */}
 {open && (
 <div className="absolute top-full left-0 mt-1.5 z-50 w-[290px] bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-200">

 {/* ===== DAYS VIEW ===== */}
 {view === 'days' && (
 <div>
 {/* Header */}
 <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-navy/5 to-transparent">
 <button 
 type="button" 
 onClick={handlePrevMonth} 
 disabled={parsedMin && new Date(viewYear, viewMonth, 1) <= parsedMin}
 className="p-1 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
 >
 <ChevronLeft size={16} className="text-gray-600" />
 </button>
 <button
 type="button"
 onClick={() => setView('months')}
 className="text-sm font-semibold text-navy hover:text-cta transition-colors font-brand tracking-wide"
 >
 {MONTH_FULL[viewMonth]} {viewYear}
 </button>
 <button 
 type="button" 
 onClick={handleNextMonth} 
 disabled={parsedMax && new Date(viewYear, viewMonth + 1, 0) >= parsedMax}
 className="p-1 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
 >
 <ChevronRight size={16} className="text-gray-600" />
 </button>
 </div>
 {/* Day names */}
 <div className="grid grid-cols-7 px-3 py-1">
 {DAYS.map((d) => (
 <div key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase py-1">{d}</div>
 ))}
 </div>
 {/* Day cells */}
 <div className="grid grid-cols-7 px-3 pb-3 gap-y-0.5">
 {calendarCells.map((cell, idx) => {
 if (cell.type !== 'current') {
 return <div key={idx} className="text-center py-1.5 text-xs text-gray-300">{cell.day}</div>;
 }
 const cellDate = new Date(viewYear, viewMonth, cell.day);
 const disabled = isDateDisabled(cellDate);
 const isSelected = isSameDay(cellDate, selectedDate);
 const today = isToday(cellDate);

 return (
 <button
 key={idx}
 type="button"
 disabled={disabled}
 onClick={() => handleSelectDay(cell.day)}
 className={`relative text-center py-1.5 text-xs rounded-lg transition-all font-medium
 ${disabled ? 'text-gray-300 cursor-not-allowed' : 'cursor-pointer hover:bg-navy/10'}
 ${isSelected ? 'bg-navy text-white shadow-md hover:bg-navy' : ''}
 ${today && !isSelected ? 'text-cta font-bold ring-1 ring-cta/30' : ''}
 ${!isSelected && !today && !disabled ? 'text-gray-700' : ''}
 `}
 >
 {cell.day}
 </button>
 );
 })}
 </div>
 {/* Today shortcut */}
 {!parsedMax || new Date() <= parsedMax ? (
 <div className="px-3 pb-3">
 <button
 type="button"
 onClick={() => {
 const now = new Date();
 if (!isDateDisabled(now)) {
 setViewMonth(now.getMonth());
 setViewYear(now.getFullYear());
 handleSelectDay(now.getDate());
 }
 }}
 className="w-full py-1.5 text-xs font-medium text-navy bg-navy/5 rounded-lg hover:bg-navy/10 transition-colors"
 >
 Today
 </button>
 </div>
 ) : null}
 </div>
 )}

 {/* ===== MONTHS VIEW ===== */}
 {view === 'months' && (
 <div>
 <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-navy/5 to-transparent">
 <button type="button" onClick={() => setViewYear(viewYear - 1)} className="p-1 rounded-md hover:bg-gray-100 transition-colors">
 <ChevronLeft size={16} className="text-gray-600" />
 </button>
 <button
 type="button"
 onClick={() => { setYearRangeStart(viewYear - (viewYear % 12)); setView('years'); }}
 className="text-sm font-semibold text-navy hover:text-cta transition-colors font-brand tracking-wide"
 >
 {viewYear}
 </button>
 <button type="button" onClick={() => setViewYear(viewYear + 1)} className="p-1 rounded-md hover:bg-gray-100 transition-colors">
 <ChevronRight size={16} className="text-gray-600" />
 </button>
 </div>
 <div className="grid grid-cols-3 gap-2 p-4">
 {MONTHS.map((m, idx) => {
 const isSelected = selectedDate && selectedDate.getMonth() === idx && selectedDate.getFullYear() === viewYear;
 const isCurrent = new Date().getMonth() === idx && new Date().getFullYear() === viewYear;
 const monthDate = new Date(viewYear, idx, 1);
 const lastDayOfMonth = new Date(viewYear, idx + 1, 0);
 const isDisabled = (parsedMin && lastDayOfMonth < parsedMin) || (parsedMax && monthDate > parsedMax);

 return (
 <button
 key={m}
 type="button"
 disabled={isDisabled}
 onClick={() => handleSelectMonth(idx)}
 className={`py-2.5 rounded-lg text-sm font-medium transition-all
 ${isSelected ? 'bg-navy text-white shadow-md' : 'hover:bg-navy/10 text-gray-700'}
 ${isCurrent && !isSelected ? 'ring-1 ring-cta/30 text-cta font-semibold' : ''}
 ${isDisabled ? 'opacity-20 cursor-not-allowed grayscale' : ''}
 `}
 >
 {m}
 </button>
 );
 })}
 </div>
 </div>
 )}

 {/* ===== YEARS VIEW ===== */}
 {view === 'years' && (
 <div>
 <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-navy/5 to-transparent">
 <button type="button" onClick={() => setYearRangeStart(yearRangeStart - 12)} className="p-1 rounded-md hover:bg-gray-100 transition-colors">
 <ChevronLeft size={16} className="text-gray-600" />
 </button>
 <span className="text-sm font-semibold text-navy font-brand tracking-wide">
 {yearRangeStart} – {yearRangeStart + 11}
 </span>
 <button type="button" onClick={() => setYearRangeStart(yearRangeStart + 12)} className="p-1 rounded-md hover:bg-gray-100 transition-colors">
 <ChevronRight size={16} className="text-gray-600" />
 </button>
 </div>
 <div className="grid grid-cols-3 gap-2 p-4">
 {Array.from({ length: 12 }, (_, i) => yearRangeStart + i).map((y) => {
 const isSelected = selectedDate && selectedDate.getFullYear() === y;
 const isCurrent = new Date().getFullYear() === y;
 const isDisabled = (parsedMin && y < parsedMin.getFullYear()) || (parsedMax && y > parsedMax.getFullYear());

 return (
 <button
 key={y}
 type="button"
 disabled={isDisabled}
 onClick={() => handleSelectYear(y)}
 className={`py-2.5 rounded-lg text-sm font-medium transition-all
 ${isSelected ? 'bg-navy text-white shadow-md' : 'hover:bg-navy/10 text-gray-700'}
 ${isCurrent && !isSelected ? 'ring-1 ring-cta/30 text-cta font-semibold' : ''}
 ${isDisabled ? 'opacity-20 cursor-not-allowed grayscale' : ''}
 `}
 >
 {y}
 </button>
 );
 })}
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 );
}
