import React, { useState, useMemo, useEffect } from 'react';
import { CalendarDays, Plus, Trash2, ChevronLeft, ChevronRight, X, Flag, BookOpen, Users, Trophy, HeartHandshake, Star } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import CustomSelect from '../components/ui/CustomSelect';
import CustomDatePicker from '../components/ui/CustomDatePicker';
import { api } from '../api/client';

const INDIAN_HOLIDAYS_2026 = [
 { date: '2026-01-26', name: 'Republic Day' },
 { date: '2026-03-25', name: 'Holi' },
 { date: '2026-04-14', name: 'Ambedkar Jayanti' },
 { date: '2026-05-01', name: 'Labour Day' },
 { date: '2026-08-15', name: 'Independence Day' },
 { date: '2026-10-02', name: 'Gandhi Jayanti' },
 { date: '2026-11-14', name: "Children's Day" },
 { date: '2026-12-25', name: 'Christmas' },
];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const EVENT_TYPES = ['Holiday','Exam','PTM','Competition','Activity','Sports','Function'];

const TYPE_CONFIG = {
 Holiday: { color: 'bg-red-100 text-red-700 border-red-200', icon: Flag },
 Exam: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: BookOpen },
 PTM: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Users },
 Competition: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Trophy },
 Activity: { color: 'bg-teal/10 text-teal border-teal/20', icon: Star },
 Sports: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Trophy },
 Function: { color: 'bg-pink-100 text-pink-700 border-pink-200', icon: HeartHandshake },
};

const EMPTY = { date: '', title: '', type: 'Holiday', note: '' };

export default function AcademicCalendar() {
 const { showToast, currentUser } = useAppContext();
 const [events, setEvents] = useState([]);
 const [currentDate, setCurrentDate] = useState(new Date());
 
 const [showModal, setShowModal] = useState(false);
 const [form, setForm] = useState(EMPTY);
 const [selectedEvent, setSelectedEvent] = useState(null);

 // Load calendar events from backend on mount
 useEffect(() => {
 api.communication.calendar.list()
 .then(res => {
 const data = res?.data || [];
 return setEvents(data.map(e => ({
 id: e._id,
 date: e.date ? new Date(e.date).toISOString().split('T')[0] : '',
 title: e.title,
 type: e.type || 'Holiday',
 note: e.note || e.description || '',
 isBackend: true
 })));
 })
 .catch(() => setEvents([]));
 }, []);

 const year = currentDate.getFullYear();
 const month = currentDate.getMonth();

 const allEvents = useMemo(() => {
 const publicHolidays = INDIAN_HOLIDAYS_2026.map((h, i) => ({
 id: `hol-2026-${i}`,
 date: h.date,
 title: h.name,
 type: 'Holiday',
 note: 'Public Holiday',
 isPublicHoliday: true
 }));
 return [...events, ...publicHolidays];
 }, [events, year]);

 // Generate calendar grid
 const daysInMonth = new Date(year, month + 1, 0).getDate();
 const firstDayOfMonth = new Date(year, month, 1).getDay();
 const [todayStr] = new Date().toISOString().split('T');

 const calendarDays = useMemo(() => {
 const days = [];
 // Padding from previous month
 for (let i = 0; i < firstDayOfMonth; i += 1) {
 days.push(null);
 }
 // Days of current month
 for (let i = 1; i <= daysInMonth; i += 1) {
 const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
 const dayEvents = allEvents.filter(e => e.date === dateStr);
 days.push({ day: i, dateStr, events: dayEvents });
 }
 // Padding for next month to fill grid (makes 35 or 42 cells)
 const paddingRight = (7 - (days.length % 7)) % 7;
 for (let i = 0; i < paddingRight; i += 1) {
 days.push(null);
 }
 return days;
 }, [year, month, daysInMonth, firstDayOfMonth, allEvents]);

 const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
 const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
 
 const handleMonthChange = (e) => setCurrentDate(new Date(year, parseInt(e.target.value, 10), 1));
 const handleYearChange = (e) => setCurrentDate(new Date(parseInt(e.target.value, 10), month, 1));

 const handleDayClick = (dateStr) => {
 setForm({ ...EMPTY, date: dateStr });
 setSelectedEvent(null);
 setShowModal(true);
 };

 const handleEventClick = (e, ev) => {
 e.stopPropagation();
 setSelectedEvent(ev);
 setShowModal(true);
 };

 const handleSave = async () => {
 if (!form.date || !form.title.trim()) { showToast('error', 'Date and Title required'); return; }
 try {
 const res = await api.communication.calendar.create({
 title: form.title.trim(),
 date: form.date,
 type: form.type,
 note: form.note,
 description: form.note
 });
 const created = res?.data || res;
 setEvents(p => [...p, {
 id: created?._id || Date.now(),
 date: form.date,
 title: form.title.trim(),
 type: form.type,
 note: form.note,
 isBackend: true
 }]);
 showToast('success', 'Event added');
 setShowModal(false);
 setForm(EMPTY);
 } catch {
 showToast('error', 'Failed to save event');
 }
 };

 const handleDelete = async (id) => {
 try {
 await api.communication.calendar.remove(id);
 setEvents(p => p.filter(e => e.id !== id));
 showToast('success', 'Event deleted');
 } catch {
 showToast('error', 'Failed to delete event');
 }
 setShowModal(false);
 setSelectedEvent(null);
 };

 return (
 <div className="min-h-screen">
 {/* Header */}
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <div className="p-2.5 rounded-xl bg-navy text-white"><CalendarDays size={20}/></div>
 <div>
 <h1 className="text-xl font-bold text-navy font-brand">Academic Calendar</h1>
 <p className="text-xs text-gray-400 mt-0.5">Manage school events & holidays</p>
 </div>
 </div>
 {currentUser?.role !== 'Teacher' && (
 <button onClick={()=>{setForm(EMPTY); setSelectedEvent(null); setShowModal(true);}} className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors">
 <Plus size={17}/> Add Event
 </button>
 )}
 </div>

 <div className="bg-white rounded-2xl shadow-card overflow-hidden border border-gray-100">
 {/* Calendar Controls */}
 <div className="flex flex-wrap items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50 z-20 relative">
 <div className="flex gap-2">
 <div className="w-32">
 <CustomSelect 
 value={MONTHS[month]} 
 onChange={(val) => handleMonthChange({target: {value: MONTHS.indexOf(val)}})}
 options={MONTHS}
 />
 </div>
 <div className="w-24">
 <CustomSelect 
 value={year.toString()} 
 onChange={(val) => handleYearChange({target: {value: val}})}
 options={[year-1, year, year+1, year+2].map(String)}
 />
 </div>
 <button 
 onClick={() => setCurrentDate(new Date())} 
 className="px-4 py-2 bg-white border border-gray-200 text-gray-500 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-navy transition-colors ml-2"
 >
 Today
 </button>
 </div>
 
 <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
 <button onClick={handlePrevMonth} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"><ChevronLeft size={18}/></button>
 <span className="w-32 text-center text-sm font-brand font-bold text-navy">{MONTHS[month]} {year}</span>
 <button onClick={handleNextMonth} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 transition-colors"><ChevronRight size={18}/></button>
 </div>
 </div>

 {/* Days Header */}
 <div className="hidden sm:grid grid-cols-7 border-b border-gray-100 bg-white">
 {DAYS.map(d => (
 <div key={d} className="py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-widest bg-gray-50">
 {d}
 </div>
 ))}
 </div>

 {/* Mobile Agenda View */}
 <div className="block sm:hidden p-4 space-y-3 bg-gray-50">
 {allEvents
 .filter(e => e.date && e.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
 .sort((a,b)=>new Date(a.date).getTime() - new Date(b.date).getTime())
 .map(ev => {
 const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.Activity;
 const IconConfig = cfg.icon;
 return (
 <div 
 key={ev.id} 
 onClick={(e) => handleEventClick(e, ev)}
 className={`p-4 bg-white rounded-xl shadow-sm border-l-4 border flex items-center gap-4 cursor-pointer transition- hover:scale-[1.02] ${cfg.color.split(' ')[2]}`}
 >
 <div className={`p-2 rounded-lg ${cfg.color.split(' ')[0]} ${cfg.color.split(' ')[1]}`}>
 <IconConfig size={20} />
 </div>
 <div className="flex-1">
 <h4 className="font-bold text-sm text-navy">{ev.title}</h4>
 <p className="text-xs text-gray-500 font-medium">{new Date(ev.date).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}</p>
 </div>
 <span className={`px-2 py-1 text-[10px] uppercase font-bold tracking-wider rounded ${cfg.color}`}>
 {ev.type}
 </span>
 </div>
 );
 })
 }
 {allEvents.filter(e => e.date && e.date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)).length === 0 && (
 <div className="text-center py-10 text-gray-400 text-sm bg-white rounded-xl border border-dashed border-gray-200">
 No events scheduled for this month.
 </div>
 )}
 </div>

 {/* Calendar Grid (Desktop) */}
 <div className="hidden sm:grid grid-cols-7 bg-gray-100 gap-px border-b border-gray-100">
 {calendarDays.map((cell, idx) => {
 if (!cell) {
 return <div key={`empty-${idx}`} className="h-32 bg-gray-50/50 p-2 opacity-50"></div>;
 }
 const isToday = cell.dateStr === todayStr;
 return (
 <div 
 key={cell.dateStr} 
 onClick={() => handleDayClick(cell.dateStr)}
 className={`min-h-[120px] bg-white p-2 border-t-2 transition-all hover:bg-slate-50 cursor-pointer ${isToday ? 'border-navy bg-blue-50/30' : 'border-transparent'}`}
 >
 <div className="flex justify-between items-start mb-2">
 <span className={`size-7 flex items-center justify-center rounded-full text-sm font-semibold ${isToday ? 'bg-navy text-white' : 'text-gray-600'}`}>
 {cell.day}
 </span>
 </div>
 
 <div className="space-y-1.5 overflow-y-auto max-h-[80px] no-scrollbar">
 {cell.events.map(ev => {
 const cfg = TYPE_CONFIG[ev.type] || TYPE_CONFIG.Activity;
 return (
 <div 
 key={ev.id} 
 onClick={(e) => handleEventClick(e, ev)}
 className={`px-2 py-1 text-[10px] font-medium rounded border leading-tight truncate transition- hover:scale-[1.02] cursor-pointer ${cfg.color}`}
 title={`${ev.title}${ev.note ? ` - ${ev.note}` : ''}`}
 >
 {ev.title}
 </div>
 );
 })}
 </div>
 </div>
 );
 })}
 </div>
 
 {/* Legend */}
 <div className="p-4 bg-white border-b lg:border-b-0 flex flex-wrap gap-3 items-center justify-center">
 <span className="text-xs text-gray-400 font-medium mr-2">Legend:</span>
 {EVENT_TYPES.map(t => {
 const cfg = TYPE_CONFIG[t];
 return (
 <div key={t} className="flex items-center gap-1.5 text-xs text-gray-600">
 <span className={`size-3 rounded border ${cfg.color.split(' ')[0]} ${cfg.color.split(' ')[2]}`}></span>
 {t}
 </div>
 )
 })}
 </div>
 </div>

 {/* Add / View Event Modal */}
 {showModal && (
 <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50 p-4 animate-in fade-in duration-200">
 <div className="bg-white rounded-2xl shadow-modal w-full max-w-md scale-in-center">
 <div className="flex items-center justify-between p-5 bg-navy rounded-t-2xl">
 <h3 className="font-brand text-white font-semibold">{selectedEvent ? 'Event Details' : 'Add Calendar Event'}</h3>
 <button onClick={()=>{setShowModal(false); setForm(EMPTY); setSelectedEvent(null);}} className="p-1 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors">
 <X size={18} />
 </button>
 </div>
 
 {selectedEvent ? (
 // View Mode
 <div className="p-6">
 <div className="flex items-start justify-between mb-4">
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${TYPE_CONFIG[selectedEvent.type]?.color || TYPE_CONFIG.Activity.color}`}>
 {selectedEvent.type}
 </span>
 <span className="text-xs font-semibold text-gray-400">{selectedEvent.date}</span>
 </div>
 <h4 className="text-xl font-bold text-navy font-brand">{selectedEvent.title}</h4>
 </div>
 </div>
 {selectedEvent.note && (
 <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm text-gray-600 mt-2">
 {selectedEvent.note}
 </div>
 )}
 
 <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
 {!selectedEvent.isPublicHoliday && currentUser?.role !== 'Teacher' && (
 <button onClick={()=>handleDelete(selectedEvent.id)} className="px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors">Delete Event</button>
 )}
 <button onClick={()=>setShowModal(false)} className="px-4 py-2 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy-light transition-colors">Done</button>
 </div>
 </div>
 ) : (
 // Add Mode
 <>
 <div className="p-6 space-y-5">
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Event Title <span className="text-cta">*</span></label>
 <input autoFocus value={form.title} onChange={e=>setForm(p=>({...p,title:e.target.value}))} placeholder="e.g. Annual Sports Day"
 className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all"/>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="flex flex-col gap-1.5 min-w-0">
 <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Date <span className="text-cta">*</span></label>
 <CustomDatePicker 
 selected={form.date ? new Date(form.date) : null}
 onChange={(date) => {
 if (date) {
 const offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
 setForm(p=>({...p,date: offsetDate.toISOString().split('T')[0]}));
 } else {
 setForm(p=>({...p,date: ''}));
 }
 }}
 />
 </div>
 <div className="flex flex-col gap-1.5 min-w-0">
 <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Type</label>
 <CustomSelect 
 value={form.type} 
 onChange={(val) => setForm(p=>({...p,type:val}))}
 options={EVENT_TYPES}
 />
 </div>
 </div>
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Description (Optional)</label>
 <textarea value={form.note} onChange={e=>setForm(p=>({...p,note:e.target.value}))} placeholder="Any extra details..." rows={2}
 className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:bg-white focus:border-navy focus:ring-2 focus:ring-navy/10 transition-all resize-none"/>
 </div>
 </div>
 <div className="flex items-center justify-end gap-3 p-5 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
 <button onClick={()=>{setShowModal(false);setForm(EMPTY);}} className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 rounded-lg text-sm font-medium transition-colors">Cancel</button>
 <button onClick={handleSave} className="px-5 py-2 bg-cta text-white rounded-lg text-sm font-medium shadow-sm shadow-cta/20 hover:bg-cta-dark transition-all hover:scale-[1.02] active:scale-[0.98]">
 Save Event
 </button>
 </div>
 </>
 )}
 </div>
 </div>
 )}
 </div>
 );
}
