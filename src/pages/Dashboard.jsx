import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  IndianRupee,
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  Smartphone,
  Plus,
  Gift,
  Calendar,
  Eye,
  EyeOff,
  Cake,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { api } from "../api/client";
import { ALL_CLASSES } from "../constants/classes";

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser, students, teachers } = useAppContext();
  const [collections, setCollections] = useState([]);
  const [defaulters, setDefaulters] = useState([]);
  const [salaryPayments, setSalaryPayments] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [syllabusProgress, setSyllabusProgress] = useState([]);
  const [academicYear, setAcademicYear] = useState("2025–26");
  const [showAmounts, setShowAmounts] = useState(() => {
    return localStorage.getItem("erp_showAmounts") === "true";
  });

  const isTeacher = currentUser?.role === "Teacher";
  const isAdminOrPrincipal =
    currentUser?.role === "Admin" || currentUser?.role === "Principal";

  const toggleAmounts = () => {
    setShowAmounts((prev) => {
      const next = !prev;
      localStorage.setItem("erp_showAmounts", String(next));
      return next;
    });
  };

  const maskedAmount = (value) => {
    if (showAmounts) return `₹${Number(value).toLocaleString()}`;
    return "₹ ••••••";
  };

  const h = new Date().getHours();
  const timeGreeting =
    h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening";
  const displayGreeting = `${timeGreeting}, ${currentUser?.name?.split(" ")[0] || "User"}`;
  const dateStr = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Fetch dashboard data from backend
  useEffect(() => {
    if (isAdminOrPrincipal) {
      api.fees
        .collections()
        .then((res) => setCollections(res?.data || []))
        .catch(() => setCollections([]));
      api.fees
        .defaulters()
        .then((res) => setDefaulters(res?.data?.defaulters || res?.data || []))
        .catch(() => setDefaulters([]));
      api.payroll
        .list({ page: 1, limit: 500 })
        .then((res) => setSalaryPayments(res?.data || []))
        .catch(() => setSalaryPayments([]));
    }
    api.communication.calendar
      .list()
      .then((res) => setCalendarEvents(res?.data || []))
      .catch(() => {});
    api.exams.syllabus
      .progress()
      .then((res) => setSyllabusProgress(res?.data || []))
      .catch(() => setSyllabusProgress([]));
    api.settings
      .get()
      .then((res) => {
        const data = res?.data || res;
        // Support both {value: {academicYear}} and {academicYear} shapes
        const yr = data?.value?.academicYear || data?.academicYear;
        if (yr) return setAcademicYear(yr);
      })
      .catch(() => {});
  }, [isAdminOrPrincipal]);

  // Compute real stats
  const totalStudents = students.length;
  const totalDue = useMemo(
    () => students.reduce((sum, s) => sum + (s.dues || 0), 0),
    [students],
  );
  const dueStudentCount = useMemo(
    () => students.filter((s) => (s.dues || 0) > 0).length,
    [students],
  );
  const monthCollections = useMemo(() => {
    return collections
      .filter((c) => {
        const d = new Date(c.date || c.createdAt);
        return (
          d.getMonth() + 1 === currentMonth && d.getFullYear() === currentYear
        );
      })
      .reduce((sum, c) => sum + (c.amount || 0), 0);
  }, [collections, currentMonth, currentYear]);

  const paidSalaries = useMemo(() => {
    return salaryPayments.filter(
      (p) => Number(p.month) === currentMonth && Number(p.year) === currentYear,
    ).length;
  }, [salaryPayments, currentMonth, currentYear]);

  const monthName = new Date().toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  // Today's birthdays
  const todayBirthdays = useMemo(() => {
    const today = new Date();
    const m = today.getMonth() + 1;
    const d = today.getDate();
    return students.filter((s) => {
      if (!s.dob) return false;
      const dob = new Date(s.dob);
      return dob.getMonth() + 1 === m && dob.getDate() === d;
    });
  }, [students]);

  // Upcoming events — next 7 days
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const week = new Date();
    week.setDate(week.getDate() + 7);
    return calendarEvents
      .filter((e) => {
        const d = new Date(e.date);
        return d >= now && d <= week;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [calendarEvents]);

  return (
    <div className="min-h-screen">
      {/* PAGE HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-navy font-brand">
            {displayGreeting}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">Today: {dateStr}</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdminOrPrincipal && (
            <button
              onClick={toggleAmounts}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-500 hover:text-navy hover:border-gray-300 transition-colors"
              title={showAmounts ? "Hide amounts" : "Show amounts"}
            >
              {showAmounts ? <EyeOff size={14} /> : <Eye size={14} />}
              {showAmounts ? "Hide" : "Show"}
            </button>
          )}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-teal/10 text-teal text-xs font-medium rounded-full">
            Academic Year: {academicYear}
          </div>
        </div>
      </div>

      {/* ROW 1: STATS CARDS */}
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 ${isTeacher ? "lg:grid-cols-2" : "lg:grid-cols-4"} gap-4 mb-6`}
      >
        <div
          className="bg-white rounded-xl p-5 shadow-card flex items-start gap-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-teal"
          onClick={() => navigate("/students")}
        >
          <div className="size-11 rounded-xl bg-teal/15 flex items-center justify-center shrink-0">
            <Users size={20} className="text-teal" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-navy font-brand">
              {totalStudents}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">Total Students</p>
            <p className="text-[11px] text-gray-400">
              {ALL_CLASSES[0]} to {ALL_CLASSES[ALL_CLASSES.length - 1]}
            </p>
          </div>
        </div>

        {isAdminOrPrincipal && (
          <>
            <div
              className="bg-white rounded-xl p-5 shadow-card flex items-start gap-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-emerald-500"
              onClick={() => navigate("/fees/collect")}
            >
              <div className="size-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
                <IndianRupee size={20} className="text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy font-brand">
                  {maskedAmount(monthCollections)}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Collected This Month
                </p>
                <p className="text-[11px] text-gray-400">{monthName}</p>
              </div>
            </div>

            <div
              className="bg-white rounded-xl p-5 shadow-card flex items-start gap-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-cta"
              onClick={() => navigate("/fees/dues")}
            >
              <div className="size-11 rounded-xl bg-cta/15 flex items-center justify-center shrink-0">
                <AlertTriangle size={20} className="text-cta" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-cta font-brand">
                  {maskedAmount(totalDue)}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Total Dues Pending
                </p>
                <p className="text-[11px] text-gray-400">
                  {dueStudentCount} students
                </p>
              </div>
            </div>

            <div
              className="bg-white rounded-xl p-5 shadow-card flex items-start gap-4 cursor-pointer hover:shadow-md transition-shadow border-l-4 border-violet-500"
              onClick={() => navigate("/salary")}
            >
              <div className="size-11 rounded-xl bg-violet-500/15 flex items-center justify-center shrink-0">
                <CheckCircle2 size={20} className="text-violet-500" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-navy font-brand">
                  {showAmounts ? `${paidSalaries}/${teachers.length}` : "••/••"}
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">Salaries Paid</p>
                <p className="text-[11px] text-gray-400">{monthName}</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ROW 2: QUICK ACTIONS */}
      <div
        className={`grid grid-cols-2 sm:grid-cols-3 ${isTeacher ? "lg:grid-cols-3" : "lg:grid-cols-5"} gap-3 mb-6`}
      >
        <button
          className="bg-white rounded-xl p-4 shadow-card flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-gray-600 hover:text-teal"
          onClick={() => navigate("/attendance")}
        >
          <ClipboardCheck size={22} />
          <span className="text-xs font-medium">Mark Attendance</span>
        </button>
        {!isTeacher && (
          <>
            <button
              className="bg-white rounded-xl p-4 shadow-card flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-gray-600 hover:text-teal"
              onClick={() => navigate("/fees/collect")}
            >
              <IndianRupee size={22} />
              <span className="text-xs font-medium">Collect Fee</span>
            </button>
            <button
              className="bg-white rounded-xl p-4 shadow-card flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-gray-600 hover:text-teal"
              onClick={() => navigate("/students")}
            >
              <FileText size={22} />
              <span className="text-xs font-medium">Generate TC</span>
            </button>
            <button
              className="bg-white rounded-xl p-4 shadow-card flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-gray-600 hover:text-teal"
              onClick={() => navigate("/sms")}
            >
              <Smartphone size={22} />
              <span className="text-xs font-medium">Send SMS</span>
            </button>
            <button
              className="bg-white rounded-xl p-4 shadow-card flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-gray-600 hover:text-teal"
              onClick={() => navigate("/students/add")}
            >
              <Plus size={22} />
              <span className="text-xs font-medium">Add Student</span>
            </button>
          </>
        )}
        {isTeacher && (
          <button
            className="bg-white rounded-xl p-4 shadow-card flex flex-col items-center gap-2 hover:shadow-md transition-shadow text-gray-600 hover:text-teal"
            onClick={() => navigate("/syllabus")}
          >
            <FileText size={22} />
            <span className="text-xs font-medium">Syllabus Tracker</span>
          </button>
        )}
      </div>

      {/* BIRTHDAYS TODAY */}
      {todayBirthdays.length > 0 && (
        <div className="bg-white rounded-xl shadow-card p-5 mb-6">
          <h2 className="font-brand font-semibold text-navy mb-3 flex items-center gap-2">
            <Gift size={18} className="text-cta" /> Today's Birthdays (
            {todayBirthdays.length})
          </h2>
          <div className="flex flex-wrap gap-2">
            {todayBirthdays.map((s) => (
              <span
                key={s.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cta/10 text-cta text-sm rounded-full font-medium"
              >
                <todayBirthdays size={14} /> {s.name}{" "}
                <span className="text-cta/50">•</span> {s.className}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* UPCOMING EVENTS */}
      {upcomingEvents.length > 0 && (
        <div className="bg-white rounded-xl shadow-card p-5 mb-6">
          <h2 className="font-brand font-semibold text-navy mb-3 flex items-center gap-2">
            <Calendar size={18} className="text-teal" /> Upcoming Events (Next 7
            Days)
          </h2>
          <div className="flex flex-col gap-2">
            {upcomingEvents.slice(0, 5).map((e, idx) => (
              <div
                key={e._id || idx}
                className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
              >
                <div className="size-10 rounded-lg bg-teal/10 flex items-center justify-center shrink-0">
                  <Calendar size={18} className="text-teal" />
                </div>
                <div>
                  <p className="font-brand font-semibold text-navy text-sm">
                    {e.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(e.date).toLocaleDateString("en-IN", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                    })}{" "}
                    · {e.type || e.category || ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ROW 3: TWO COLUMN — hidden for teachers and staff */}
      {isAdminOrPrincipal && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* LEFT: RECENT ACTIVITY */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-brand font-semibold text-navy">
                Recent Transactions
              </h3>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 border border-cta text-cta rounded-lg text-sm font-medium hover:bg-cta/10 transition-colors"
                onClick={() => navigate("/fees/collect")}
              >
                View All →
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {collections.length === 0 ? (
                <div className="text-gray-400 text-center py-5 text-sm">
                  No recent transactions.
                </div>
              ) : (
                collections.slice(0, 5).map((item, idx) => {
                  const student = students.find(
                    (s) => String(s.id) === String(item.studentId),
                  );
                  return (
                    <div
                      key={item._id || idx}
                      className="flex items-center gap-3 py-2"
                    >
                      <div className="size-9 rounded-full bg-teal/10 text-teal flex items-center justify-center text-xs font-bold shrink-0">
                        {(student?.name || "U").charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">
                          {student?.name || "Unknown"}{" "}
                          <span className="text-gray-400">
                            • {student?.className || ""}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          Fee Collected: {maskedAmount(item.amount || 0)}{" "}
                          <span className="text-gray-400">
                            •{" "}
                            {item.date
                              ? new Date(item.date).toLocaleDateString("en-IN")
                              : "—"}
                          </span>
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-teal/10 text-teal">
                        Paid
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* RIGHT: FEE DEFAULTERS */}
          <div className="bg-white rounded-xl shadow-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-brand font-semibold text-navy">
                Fee Defaulters
              </h3>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 border border-cta text-cta rounded-lg text-sm font-medium hover:bg-cta/10 transition-colors"
                onClick={() => navigate("/fees/dues")}
              >
                View All →
              </button>
            </div>
            <div className="flex flex-col gap-3">
              {defaulters.length === 0 ? (
                <div className="text-gray-400 text-center py-5 text-sm">
                  No fee defaulters found.
                </div>
              ) : (
                defaulters.slice(0, 5).map((item, idx) => {
                  const student = students.find(
                    (s) => String(s.id) === String(item.studentId || item._id),
                  );
                  return (
                    <div
                      key={item._id || idx}
                      className="flex items-center gap-3 py-2"
                    >
                      <div className="size-9 rounded-full bg-cta/10 text-cta flex items-center justify-center text-xs font-bold shrink-0">
                        {(student?.name || item?.firstName || "U").charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800">
                          {student?.name ||
                            `${item?.firstName || ""} ${item?.lastName || ""}`.trim() ||
                            "Unknown"}
                        </p>
                        <p className="text-xs text-gray-500">
                          {student?.className || item?.currentClass || ""}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full bg-cta/10 text-cta">
                        {maskedAmount(item.totalFeesDue || student?.dues || 0)}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* ROW 4: SYLLABUS OVERVIEW */}
      {(isAdminOrPrincipal || isTeacher) && (
        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-brand font-semibold text-navy">
              Syllabus Progress (Live)
            </h3>
            <button
              className="inline-flex items-center gap-2 px-4 py-2 border border-cta text-cta rounded-lg text-sm font-medium hover:bg-cta/10 transition-colors"
              onClick={() => navigate("/syllabus")}
            >
              View Full Syllabus →
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {syllabusProgress.length === 0 ? (
              <div className="text-gray-400 text-center py-5 text-sm">
                No syllabus data found. Add chapters in the Syllabus module.
              </div>
            ) : (
              syllabusProgress.map((item, i) => (
                <div
                  key={i}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                >
                  <span className="text-sm font-medium text-gray-600 sm:w-40 shrink-0">
                    {item.className} - {item.subject}
                  </span>
                  <div className="flex items-center gap-4 w-full flex-1">
                    <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${item.progress >= 80 ? "bg-emerald-500" : item.progress >= 50 ? "bg-teal" : "bg-amber-400"}`}
                        style={{ width: `${item.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-mono font-bold text-gray-600 w-10 text-right">
                      {item.progress}%
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
