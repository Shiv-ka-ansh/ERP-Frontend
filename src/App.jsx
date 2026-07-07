import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import AuthLayout from "./components/AuthLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import { AppProvider } from "./context/AppContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Students from "./pages/Students";
import AddStudent from "./pages/AddStudent";
import StudentProfile from "./pages/StudentProfile";
import FeeCollection from "./pages/FeeCollection";
import FeeStructure from "./pages/FeeStructure";
import FeeDefaulters from "./pages/FeeDefaulters";
import Attendance from "./pages/Attendance";
import TCGenerator from "./pages/TCGenerator";
import TeacherSalary from "./pages/TeacherSalary";
import SyllabusTracker from "./pages/SyllabusTracker";
import ExamsResults from "./pages/ExamsResults";
import SMSModule from "./pages/SMSModule";
import Settings from "./pages/Settings";
import AttendanceReport from "./pages/AttendanceReport";
import PrintFormats from "./pages/PrintFormats";
import SMSTemplates from "./pages/SMSTemplates";
import PrintIDCard from "./pages/PrintIDCard";
import FeeReport from "./pages/FeeReport";
import Teachers from "./pages/Teachers";
import Staff from "./pages/Staff";
import FeeDiscount from "./pages/FeeDiscount";
import SalaryHistory from "./pages/SalaryHistory";
import Expenses from "./pages/Expenses";
import BulkIDCards from "./pages/BulkIDCards";
import AuditTrail from "./pages/AuditTrail";
import TeacherAttendance from "./pages/TeacherAttendance";
import AcademicCalendar from "./pages/AcademicCalendar";

import GlobalUI from "./components/GlobalUI";

function App() {
 return (
 <BrowserRouter>
 <GlobalUI />

 <Routes>
 {/* Auth Route */}
 <Route element={<AuthLayout />}>
 <Route path="/login" element={<Login />} />
 </Route>

 {/* Main App Routes with Sidebar/Topbar Layout */}
 <Route element={<Layout />}>
 <Route path="/" element={<Navigate to="/dashboard" replace />} />
 <Route path="/dashboard" element={<ProtectedRoute allowedRoles={['Principal', 'Admin', 'Staff', 'Teacher']}><Dashboard /></ProtectedRoute>} />

 <Route path="/students" element={<ProtectedRoute allowedRoles={['Principal', 'Admin', 'Staff', 'Teacher']}><Students /></ProtectedRoute>} />
 <Route path="/students/add" element={<ProtectedRoute allowedRoles={['Principal', 'Admin', 'Staff']}><AddStudent /></ProtectedRoute>} />
 <Route path="/students/:id/edit" element={<ProtectedRoute allowedRoles={['Principal', 'Admin', 'Staff']}><AddStudent /></ProtectedRoute>} />
 <Route path="/students/:id" element={<ProtectedRoute allowedRoles={['Principal', 'Admin', 'Staff', 'Teacher']}><StudentProfile /></ProtectedRoute>} />
 <Route path="/students/:id/tc" element={<ProtectedRoute allowedRoles={['Principal', 'Admin']}><TCGenerator /></ProtectedRoute>} />
 <Route path="/students/:id/idcard" element={<ProtectedRoute allowedRoles={['Principal', 'Admin', 'Staff']}><PrintIDCard /></ProtectedRoute>} />
 <Route path="/students/idcards" element={<ProtectedRoute allowedRoles={['Principal', 'Admin', 'Staff']}><BulkIDCards /></ProtectedRoute>} />

 <Route path="/fees/dues" element={<ProtectedRoute allowedRoles={['Principal', 'Admin', 'Staff']}><FeeDefaulters /></ProtectedRoute>} />
 <Route path="/fees/structure" element={<ProtectedRoute allowedRoles={['Principal', 'Admin', 'Staff']}><FeeStructure /></ProtectedRoute>} />
 <Route path="/fees/report" element={<ProtectedRoute allowedRoles={['Principal', 'Admin', 'Staff']}><FeeReport /></ProtectedRoute>} />
 <Route path="/fees/collect" element={<ProtectedRoute allowedRoles={['Principal', 'Admin', 'Staff']}><FeeCollection /></ProtectedRoute>} />
 <Route path="/fees/discount" element={<ProtectedRoute allowedRoles={['Principal', 'Admin', 'Staff']}><FeeDiscount /></ProtectedRoute>} />
 <Route path="/expenses" element={<ProtectedRoute allowedRoles={['Principal', 'Admin']}><Expenses /></ProtectedRoute>} />

 <Route path="/attendance" element={<ProtectedRoute allowedRoles={['Principal', 'Admin', 'Teacher']}><Attendance /></ProtectedRoute>} />
 <Route path="/attendance/report" element={<ProtectedRoute allowedRoles={['Principal', 'Admin', 'Teacher']}><AttendanceReport /></ProtectedRoute>} />

 <Route path="/salary" element={<ProtectedRoute allowedRoles={['Principal', 'Admin']}><TeacherSalary /></ProtectedRoute>} />
 <Route path="/salary/history" element={<ProtectedRoute allowedRoles={['Principal', 'Admin']}><SalaryHistory /></ProtectedRoute>} />

 <Route path="/teachers" element={<ProtectedRoute allowedRoles={['Principal', 'Admin']}><Teachers /></ProtectedRoute>} />
 <Route path="/staff" element={<ProtectedRoute allowedRoles={['Principal', 'Admin']}><Staff /></ProtectedRoute>} />
 <Route path="/teacher-attendance" element={<ProtectedRoute allowedRoles={['Principal', 'Admin']}><TeacherAttendance /></ProtectedRoute>} />
 <Route path="/teacher-attendance/my" element={<ProtectedRoute allowedRoles={['Principal', 'Admin', 'Teacher']}><TeacherAttendance /></ProtectedRoute>} />
 <Route path="/academic-calendar" element={<ProtectedRoute allowedRoles={['Principal', 'Admin', 'Teacher']}><AcademicCalendar /></ProtectedRoute>} />

 <Route path="/syllabus" element={<ProtectedRoute allowedRoles={['Principal', 'Admin', 'Teacher']}><SyllabusTracker /></ProtectedRoute>} />

 <Route path="/exams" element={<ProtectedRoute allowedRoles={['Principal', 'Admin', 'Teacher']}><ExamsResults /></ProtectedRoute>} />

 <Route path="/sms" element={<ProtectedRoute allowedRoles={['Principal', 'Admin']}><SMSModule /></ProtectedRoute>} />
 <Route path="/sms/templates" element={<ProtectedRoute allowedRoles={['Principal', 'Admin']}><SMSTemplates /></ProtectedRoute>} />

 <Route path="/settings" element={<ProtectedRoute allowedRoles={['Principal', 'Admin']}><Settings /></ProtectedRoute>} />
 <Route path="/settings/print-formats" element={<ProtectedRoute allowedRoles={['Principal', 'Admin']}><PrintFormats /></ProtectedRoute>} />

 <Route path="/audit-trail" element={<ProtectedRoute allowedRoles={['Principal']}><AuditTrail /></ProtectedRoute>} />
 </Route>
 </Routes>
 </BrowserRouter>
 );
}

export default App;
