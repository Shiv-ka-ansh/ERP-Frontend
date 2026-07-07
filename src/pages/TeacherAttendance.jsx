import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Save, CheckCircle2, XCircle, Clock, Download, Building } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import CustomDatePicker from '../components/ui/CustomDatePicker';
import { api } from '../api/client';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const STATUS_CFG = {
 P: { label: 'Present', cls: 'bg-emerald-50 text-emerald-600 border-emerald-200', dot: 'bg-emerald-500' },
 A: { label: 'Absent', cls: 'bg-red-50 text-red-500 border-red-200', dot: 'bg-red-500' },
 H: { label: 'Half Day', cls: 'bg-amber-50 text-amber-600 border-amber-200', dot: 'bg-amber-400' },
 L: { label: 'Leave', cls: 'bg-blue-50 text-blue-600 border-blue-200', dot: 'bg-blue-400' },
};

const STATUS_BADGE_CLASSES = {
 emerald: {
 container: 'bg-emerald-50 border border-emerald-100',
 dot: 'bg-emerald-500',
 text: 'text-emerald-700',
 },
 red: {
 container: 'bg-red-50 border border-red-100',
 dot: 'bg-red-500',
 text: 'text-red-700',
 },
 gray: {
 container: 'bg-gray-50 border border-gray-100',
 dot: 'bg-gray-400',
 text: 'text-gray-600',
 },
};

function getWorkingDays(year, month) {
  const days = [];
  const total = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= total; d += 1) {
    if (new Date(year, month, d).getDay() !== 0) days.push(d);
  }
  return days;
}

export default function TeacherAttendance() {
 const { showToast, teachers, currentUser } = useAppContext();
 const location = useLocation();
 const isMyView = location.pathname === '/teacher-attendance/my' || currentUser?.role === 'Teacher';
 const today = new Date();
 const [todayStr] = today.toISOString().split('T');
 const [year, setYear] = useState(today.getFullYear());
 const [month, setMonth] = useState(today.getMonth());
 const [tab, setTab] = useState('daily');
 const [selDate, setSelDate] = useState(todayStr);
 const [att, setAtt] = useState({});
 const [saved, setSaved] = useState(new Set());

 const staff = teachers.map(t => ({ ...t, subject: t.subject || 'N/A' }));

 // Load existing attendance from API when date changes
 useEffect(() => {
 const loadAtt = async () => {
 try {
 const res = await api.attendance.get({ date: selDate, type: 'STAFF' });
 const records = res?.data || [];
 const map = {};
 records.forEach(r => {
 if (r.staffId) {
 let mappedStatus = r.status;
 if (r.status === 'PRESENT') mappedStatus = 'P';
 else if (r.status === 'ABSENT') mappedStatus = 'A';
 else if (r.status === 'HALF_DAY') mappedStatus = 'H';
 else if (r.status === 'LEAVE') mappedStatus = 'L';
 map[`${r.staffId}-${selDate}`] = mappedStatus;
 }
 });
 setAtt(prev => ({ ...prev, ...map }));
 } catch { /* empty */ }
 };
 loadAtt();
 }, [selDate]);
 const workDays = useMemo(() => getWorkingDays(year, month), [year, month]);

 const getS = (id, date) => att[`${id}-${date}`] || null;
 const setS = (id, date, s) => {
 setAtt(p => ({ ...p, [`${id}-${date}`]: s }));
 setSaved(p => { const n = new Set(p); n.delete(date); return n; });
 };

  const monthStats = (id) => {
    let P=0, A=0, H=0, L=0;
    workDays.forEach(d => {
      const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
      const s = att[`${id}-${ds}`];
      if(s==='P') P += 1; else if(s==='A') A += 1; else if(s==='H') H += 1; else if(s==='L') L += 1;
    });
    return { P, A, H, L, cut: A + H*0.5 };
  };

 const prevM = () => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); };
 const nextM = () => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); };

 const todayCount = staff.filter(s=>getS(s.id,selDate)==='P').length;
 const absentCount = staff.filter(s=>getS(s.id,selDate)==='A').length;
 const notMarked = staff.filter(s=>!getS(s.id,selDate)).length;

 const handleExport = () => {
 const hdr = ['Name','Role',...workDays.map(d=>`${d}/${month+1}`),'P','A','H','L','Cut'];
 const rows = staff.map(s=>{
 const st=monthStats(s.id);
 return [s.name,s.role,...workDays.map(d=>{
 const ds=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
 return att[`${s.id}-${ds}`]||'—';
 }),st.P,st.A,st.H,st.L,st.cut];
 });
 const csv=[hdr,...rows].map(r=>r.join(',')).join('\n');
 const a=document.createElement('a');
 a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
 a.download=`Teacher_Att_${MONTHS[month]}_${year}.csv`;
 a.click();
 };

 if (isMyView) {
 return <MyAttendanceView currentUser={currentUser} staff={staff} />;
 }

 return (
 <div className="min-h-screen">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-xl font-bold text-navy font-brand">Staff Attendance</h1>
 <p className="text-xs text-gray-400 mt-0.5">Daily marking & monthly reports</p>
 </div>
 <div className="flex items-center gap-3">
 {tab==='monthly' && (
 <button onClick={handleExport} className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors">
 <Download size={15}/> Export
 </button>
 )}
 <div className="flex bg-white border border-gray-200 rounded-lg overflow-hidden">
 {['daily','monthly'].map(t=>(
 <button key={t} onClick={()=>setTab(t)}
 className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${tab===t?'bg-navy text-white':'text-gray-500 hover:bg-gray-50'}`}>
 {t==='monthly'?'Monthly Report':t.charAt(0).toUpperCase()+t.slice(1)}
 </button>
 ))}
 </div>
 </div>
 </div>

 {tab==='daily' && (<>
 <div className="flex flex-wrap items-center gap-3 mb-5">
 <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
 <label className="text-xs text-gray-500">Date:</label>
 <div className="min-w-[130px]">
 <CustomDatePicker
 selected={selDate ? new Date(`${selDate}T00:00:00`) : null}
 onChange={(date) => {
 if (date) {
 const offsetDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
 const [ds] = offsetDate.toISOString().split('T');
 if (ds <= todayStr) setSelDate(ds);
 }
 }}
 maxDate={new Date()}
 />
 </div>
 </div>
 <div className="flex gap-2">
 {[['emerald','Present',todayCount],['red','Absent',absentCount],['gray','Unmarked',notMarked]].map(([c,l,v])=>{
 const cls = STATUS_BADGE_CLASSES[c];
 return (
 <div key={l} className={`flex items-center gap-2 ${cls.container} px-3 py-2 rounded-lg text-sm`}>
 <span className={`size-2 rounded-full ${cls.dot}`}/>
 <span className={`${cls.text} font-medium`}>{l}: {v}</span>
 </div>
 );
 })}
 </div>
 {!saved.has(selDate) && staff.some(s=>getS(s.id,selDate)) ? (
 <button onClick={async ()=>{
 try {
 const records = staff.filter(s => getS(s.id, selDate)).map(s => {
 let mappedStatus = getS(s.id, selDate);
 if (mappedStatus === 'P') mappedStatus = 'PRESENT';
 else if (mappedStatus === 'A') mappedStatus = 'ABSENT';
 else if (mappedStatus === 'H') mappedStatus = 'HALF_DAY';
 else if (mappedStatus === 'L') mappedStatus = 'LEAVE';

 return {
 staffId: s.id,
 status: mappedStatus,
 remarks: ''
 };
 });
 await api.attendance.bulkUpsert({
 type: 'STAFF',
 date: selDate,
 records
 });
 setSaved(p=>new Set([...p,selDate]));
 showToast('success',`Attendance saved for ${selDate}`);
 } catch { showToast('error','Failed to save attendance'); }
 }}
 className="ml-auto inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark">
 <Save size={15}/> Save Attendance
 </button>
 ) : saved.has(selDate) ? (
 <span className="ml-auto inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium">
 <CheckCircle2 size={14}/> Saved
 </span>
 ) : null}
 </div>

 <div className="flex gap-2 mb-4">
 <span className="text-xs text-gray-400 self-center mr-1">Mark as:</span>
 {Object.entries(STATUS_CFG).map(([k,v])=>(
 <div key={k} className={`flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium ${v.cls}`}>
 <span className={`size-1.5 rounded-full ${v.dot}`}/>{k} — {v.label}
 </div>
 ))}
 </div>

 <div className="bg-white rounded-xl shadow-card overflow-hidden">
 <table className="w-full text-sm">
 <thead className="bg-gray-50 border-b border-gray-100">
 <tr>
 {['Staff Member','Role','Mark Status','Status'].map(h=>(
 <th key={h} className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${h==='Mark Status'?'text-center w-64':h==='Status'?'text-center':'text-left'}`}>{h}</th>
 ))}
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50">
 {staff.map(s=>{
 const status=getS(s.id,selDate);
 return (
 <tr key={s.id} className="hover:bg-gray-50 transition-colors">
 <td className="px-4 py-3">
 <div className="flex items-center gap-3">
 <div className="size-8 rounded-full bg-teal/10 text-teal flex items-center justify-center text-xs font-bold shrink-0">
 {s.name.split(' ').map(n=>n[0]).join('').substring(0,2).toUpperCase()}
 </div>
 <div>
 <p className="font-medium text-gray-800">{s.name}</p>
 <p className="text-xs text-gray-400">{s.subject}</p>
 </div>
 </div>
 </td>
 <td className="px-4 py-3 text-sm text-gray-500">{s.role}</td>
 <td className="px-4 py-3">
 <div className="flex items-center justify-center gap-1">
 {Object.entries(STATUS_CFG).map(([k,v])=>(
 <button key={k} onClick={()=>setS(s.id,selDate,k)}
 className={`size-9 rounded-lg border text-xs font-bold transition-all ${status===k?`${v.cls} ring-2 ring-offset-1 ring-current scale-110`:'border-gray-200 text-gray-400 hover:border-gray-300 hover:bg-gray-50'}`}
 title={v.label}>{k}</button>
 ))}
 </div>
 </td>
 <td className="px-4 py-3 text-center">
 {status?(
 <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_CFG[status]?.cls}`}>
 <span className={`size-1.5 rounded-full ${STATUS_CFG[status]?.dot}`}/>
 {STATUS_CFG[status]?.label}
 </span>
 ):<span className="text-xs text-gray-300">—</span>}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </>)}

 {tab==='monthly' && (<>
 <div className="flex items-center gap-3 mb-5">
 <button onClick={prevM} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500"><ChevronLeft size={16}/></button>
 <span className="font-brand font-semibold text-navy text-sm min-w-[120px] text-center">{MONTHS[month]} {year}</span>
 <button onClick={nextM} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500"><ChevronRight size={16}/></button>
 <span className="text-xs text-gray-400 ml-2">{workDays.length} working days</span>
 </div>
 <div className="bg-white rounded-xl shadow-card overflow-hidden">
 <div className="overflow-x-auto">
 <table className="text-sm" style={{minWidth:'900px',width:'100%'}}>
 <thead className="bg-gray-50 border-b border-gray-100">
 <tr>
 <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase sticky left-0 bg-gray-50">Staff</th>
 {workDays.map(d=><th key={d} className="px-1.5 py-3 text-center text-xs text-gray-400 min-w-[28px]">{d}</th>)}
 {['P','A','H','L'].map(k=><th key={k} className={`p-3 text-center text-xs font-semibold uppercase ${k==='P'?'text-emerald-600':k==='A'?'text-red-500':k==='H'?'text-amber-500':'text-blue-500'}`}>{k}</th>)}
 <th className="p-3 text-center text-xs font-semibold text-gray-600 uppercase whitespace-nowrap">Cut Days</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-gray-50">
 {staff.map(s=>{
 const st=monthStats(s.id);
 return (
 <tr key={s.id} className="hover:bg-gray-50">
 <td className="px-4 py-2 sticky left-0 bg-white">
 <div className="font-medium text-gray-800 whitespace-nowrap">{s.name}</div>
 <div className="text-xs text-gray-400">{s.role}</div>
 </td>
 {workDays.map(d=>{
 const ds=`${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
 const sv=att[`${s.id}-${ds}`];
 const cfg=sv?STATUS_CFG[sv]:null;
 return (
 <td key={d} className="px-1 py-2 text-center">
 {cfg?(
 <span className={`inline-flex items-center justify-center size-5 rounded text-xs font-bold ${cfg.cls}`}>{sv}</span>
 ):<span className="text-gray-200 text-xs">·</span>}
 </td>
 );
 })}
 <td className="px-3 py-2 text-center font-mono font-semibold text-emerald-600">{st.P}</td>
 <td className="px-3 py-2 text-center font-mono font-semibold text-red-500">{st.A}</td>
 <td className="px-3 py-2 text-center font-mono font-semibold text-amber-500">{st.H}</td>
 <td className="px-3 py-2 text-center font-mono font-semibold text-blue-500">{st.L}</td>
 <td className="px-3 py-2 text-center">{st.cut>0?<span className="font-mono font-semibold text-red-500">{st.cut}</span>:<span className="text-gray-300 text-xs">—</span>}</td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 text-xs text-gray-400">P = Present · A = Absent · H = Half Day · L = Leave</div>
 </div>
 </>)}
 </div>
 );
}

function MyAttendanceView({ currentUser, staff }) {
 const today = new Date();
 const [year, setYear] = useState(today.getFullYear());
 const [month, setMonth] = useState(today.getMonth());
 const [attRecords, setAttRecords] = useState([]);
 const [summary, setSummary] = useState({ present: 0, absent: 0, halfDay: 0, leave: 0 });

 useEffect(() => {
 const loadMyAttendance = async () => {
 try {
 const res = await api.attendance.myAttendance({ month: month + 1, year });
 const data = res?.data || {};
 setAttRecords(data.records || []);
 setSummary(data.summary || { present: 0, absent: 0, halfDay: 0, leave: 0 });
 } catch {
 setAttRecords([]);
 setSummary({ present: 0, absent: 0, halfDay: 0, leave: 0 });
 }
 };
 loadMyAttendance();
 }, [month, year]);

 const workDays = useMemo(() => getWorkingDays(year, month), [year, month]);

 const { P, A, H, L } = { P: summary.present, A: summary.absent, H: summary.halfDay, L: summary.leave };
 
 const daysData = workDays.map(d => {
 const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
 const record = attRecords.find(r => r.date && r.date.startsWith(ds));
 let state = null;
 if (record) {
 if (record.status === 'PRESENT') state = 'P';
 else if (record.status === 'ABSENT') state = 'A';
 else if (record.status === 'HALF_DAY') state = 'H';
 else if (record.status === 'LEAVE') state = 'L';
 }
 return { date: d, ds, state };
 });

 const prevM = () => { if(month===0){setMonth(11);setYear(y=>y-1);}else setMonth(m=>m-1); };
 const nextM = () => { if(month===11){setMonth(0);setYear(y=>y+1);}else setMonth(m=>m+1); };

 return (
 <div className="min-h-screen">
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-xl font-bold text-navy font-brand">My Attendance</h1>
 <p className="text-xs text-gray-400 mt-0.5">Track your monthly attendance records</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
 <div className="bg-white p-4 rounded-xl shadow-card flex flex-col justify-center">
 <span className="text-emerald-500 font-bold mb-1">Present</span>
 <span className="text-2xl font-black text-navy">{P}</span>
 </div>
 <div className="bg-white p-4 rounded-xl shadow-card flex flex-col justify-center">
 <span className="text-red-500 font-bold mb-1">Absent</span>
 <span className="text-2xl font-black text-navy">{A}</span>
 </div>
 <div className="bg-white p-4 rounded-xl shadow-card flex flex-col justify-center">
 <span className="text-amber-500 font-bold mb-1">Half Day</span>
 <span className="text-2xl font-black text-navy">{H}</span>
 </div>
 <div className="bg-white p-4 rounded-xl shadow-card flex flex-col justify-center">
 <span className="text-blue-500 font-bold mb-1">Leaves</span>
 <span className="text-2xl font-black text-navy">{L}</span>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-card overflow-hidden">
 <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
 <h3 className="font-brand font-semibold text-navy">Monthly Record</h3>
 <div className="flex items-center gap-3">
 <button onClick={prevM} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500"><ChevronLeft size={18}/></button>
 <span className="font-bold text-navy text-sm min-w-[120px] text-center">{MONTHS[month]} {year}</span>
 <button onClick={nextM} className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500"><ChevronRight size={18}/></button>
 </div>
 </div>
 
 <div className="p-5 grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
 {daysData.map(item => {
 const cfg = item.state ? STATUS_CFG[item.state] : null;
 const isToday = item.ds === today.toISOString().split('T')[0];
 return (
 <div key={item.date} className={`relative flex flex-col items-center justify-center p-3 rounded-xl border ${isToday ? 'border-navy shadow-md' : 'border-gray-100'} ${cfg?.cls || 'bg-gray-50'}`}>
 <span className="text-xs font-bold mb-1 text-gray-500">{new Date(year, month, item.date).toLocaleDateString('en-US', {weekday:'short'})}</span>
 <span className={`text-lg font-black ${cfg ? 'text-current' : 'text-gray-700'}`}>{item.date}</span>
 {cfg ? (
 <span className={`mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/50 border border-current`}>{cfg.label}</span>
 ) : (
 <span className="mt-1 text-[10px] text-gray-400 font-medium">—</span>
 )}
 </div>
 )
 })}
 </div>
 <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-center gap-4 flex-wrap">
 {Object.entries(STATUS_CFG).map(([k,v])=>(
 <div key={k} className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
 <span className={`size-3 rounded ${v.cls}`}></span> {v.label}
 </div>
 ))}
 </div>
 </div>
 </div>
 )
}
