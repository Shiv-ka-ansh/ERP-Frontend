import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
 Home, Users, ClipboardCheck, BookOpen, FileText, IndianRupee,
 Smartphone, Settings, History, Tag, Wallet, Settings2, Shield,
 AlertCircle, LogOut, CalendarDays, UserCog, GraduationCap, UserPlus,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";


const ALL_MENU_ITEMS = [
 { name: "Dashboard", icon: Home, path: "/dashboard", alwaysShow: true },
 { type: "divider", label: "ACADEMICS" },
 { name: "Students", icon: Users, path: "/students" },
 { name: "New Admission", icon: UserPlus, path: "/students/add" },
 { name: "Attendance", icon: ClipboardCheck,path: "/attendance" },
 { name: "Syllabus", icon: BookOpen, path: "/syllabus" },
 { name: "Exams & Results", icon: FileText, path: "/exams" },
 { type: "divider", label: "FINANCE" },
 { name: "Fee Collection", icon: IndianRupee, path: "/fees/collect" },
 { name: "Fee Report", icon: FileText, path: "/fees/report" },
 { name: "Fee Structure", icon: Settings2, path: "/fees/structure" },
 { name: "Fee Defaulters", icon: AlertCircle, path: "/fees/dues" },
 { name: "Discounts", icon: Tag, path: "/fees/discount" },
 { name: "School Expenses", icon: Wallet, path: "/expenses" },
 { type: "divider", label: "STAFF & HR" },
 { name: "Teachers", icon: GraduationCap, path: "/teachers" },
 { name: "Staff Directory", icon: UserCog, path: "/staff" },
 { name: "Staff Attendance", teacherLabel: "My Attendance", teacherPath: "/teacher-attendance/my", icon: ClipboardCheck,path: "/teacher-attendance" },
 { name: "Salary Payroll", icon: Wallet, path: "/salary" },
 { name: "Salary History", icon: History, path: "/salary/history" },
 { type: "divider", label: "COMMUNICATION" },
 { name: "SMS Reminders", icon: Smartphone, path: "/sms" },
 { type: "divider", label: "ADMIN" },
 { name: "Academic Calendar",icon: CalendarDays, path: "/academic-calendar" },
 { name: "Settings", icon: Settings, path: "/settings" },
 { name: "Audit Trail", icon: Shield, path: "/audit-trail" },
];

export default function Sidebar({ isOpen }) {
  const { currentUser, logout, checkPathAllowed, schoolInfo } = useAppContext();
  const navigate = useNavigate();
  const userRole = currentUser?.role;

  const visibleItems = [];
 let pendingDivider = null;
  for (const item of ALL_MENU_ITEMS) {
    if (item.type === 'divider') { pendingDivider = item; continue; }
    if (item.alwaysShow || (checkPathAllowed && checkPathAllowed(item.path, false))) {
      if (pendingDivider) { visibleItems.push(pendingDivider); pendingDivider = null; }
      visibleItems.push(item);
    }
  }

 return (
 <aside className={`fixed top-0 left-0 h-screen bg-navy flex flex-col z-40 transition-all duration-300 ${isOpen ? 'w-60' : 'w-16'}`}>
 <div className="px-6 py-5 border-b border-white/10 flex items-center gap-3">
 <img src={schoolInfo?.logoUrl || "/logo.png"} alt="Logo" className="size-8 object-contain shrink-0" />
 {isOpen && (
 <div>
 <span className="text-white font-brand font-bold text-lg tracking-wide">School ERP</span>
 <span className="text-cta font-brand font-bold text-lg tracking-wide ml-1">ERP</span>
 <p className="text-white/40 text-xs mt-0.5">Jhansi</p>
 </div>
 )}
 </div>

 <nav className="flex-1 overflow-y-auto sidebar-scrollbar py-4 flex flex-col gap-0.5">
 {visibleItems.map((item, idx) => {
 if (item.type === 'divider') {
 return (
 <div key={`d-${idx}`} className="px-4 py-2">
 {isOpen
 ? <span className="text-white/30 text-[10px] font-semibold uppercase tracking-widest">{item.label}</span>
 : <hr className="border-white/10" />}
 </div>
 );
 }
 const Icon = item.icon;
  const isSelfAtt = userRole === 'Teacher' || userRole === 'Staff';
  const itemName = isSelfAtt && item.teacherLabel ? item.teacherLabel : item.name;
  const itemPath = isSelfAtt && item.teacherPath ? item.teacherPath : item.path;

 return (
 <NavLink
 key={itemPath}
 to={itemPath}
 end={['/dashboard', '/salary', '/attendance', '/students'].includes(itemPath)}
 className={({ isActive }) =>
 `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-all ${
 isActive ? 'bg-cta text-white font-medium' : 'text-white/60 hover:bg-white/10 hover:text-white'
 }`
 }
 >
 <Icon size={18} className="shrink-0" />
 {isOpen && <span>{itemName}</span>}
 </NavLink>
 );
 })}
 </nav>

 <div className="p-4 border-t border-white/10">
 <button
 onClick={() => { logout(); navigate('/login'); }}
 className="flex items-center gap-3 w-full p-2 text-white/60 hover:text-white transition-colors"
 >
 <LogOut size={20} className="text-cta shrink-0" />
 {isOpen && <span className="font-medium text-sm">Logout</span>}
 </button>
 </div>
 </aside>
 );
}

