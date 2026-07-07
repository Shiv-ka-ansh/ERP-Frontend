import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/client";

export const MODULE_PATH_MAP = {
  "Students Database": ["/students", "/students/add"],
  "Fee Collection": ["/fees/collect", "/fees/report"],
  "Fee Structure": ["/fees/structure"],
  "Fee Discount": ["/fees/discount"],
  "Fee Defaulters": ["/fees/dues"],
  "HR & Payroll": [
    "/teachers",
    "/staff",
    "/salary",
    "/salary/history",
    "/teacher-attendance",
  ],
  "Exams & Results": ["/exams"],
  "Attendance Entry": ["/attendance"],
  "SMS Gateway": ["/sms"],
  Settings: ["/settings"],
  "Audit Trail": ["/audit-trail"],
  "Academic Calendar": ["/academic-calendar"],
  "School Expenses": ["/expenses"],
  Syllabus: ["/syllabus"],
};

export const DEFAULT_MATRIX = [
  {
    module: "Students Database",
    roles: { Principal: true, Admin: true, Staff: true, Teacher: true },
  },
  {
    module: "Fee Collection",
    roles: { Principal: true, Admin: true, Staff: true, Teacher: false },
  },
  {
    module: "Fee Discount",
    roles: { Principal: true, Admin: true, Staff: false, Teacher: false },
  },
  {
    module: "Fee Defaulters",
    roles: { Principal: true, Admin: true, Staff: false, Teacher: false },
  },
  {
    module: "HR & Payroll",
    roles: { Principal: true, Admin: true, Staff: false, Teacher: false },
  },
  {
    module: "Exams & Results",
    roles: { Principal: true, Admin: true, Staff: false, Teacher: true },
  },
  {
    module: "Attendance Entry",
    roles: { Principal: true, Admin: true, Staff: true, Teacher: true },
  },
  {
    module: "SMS Gateway",
    roles: { Principal: true, Admin: true, Staff: false, Teacher: false },
  },
  {
    module: "Settings",
    roles: { Principal: true, Admin: true, Staff: false, Teacher: false },
  },
  {
    module: "Audit Trail",
    roles: { Principal: true, Admin: false, Staff: false, Teacher: false },
  },
  {
    module: "Academic Calendar",
    roles: { Principal: true, Admin: true, Staff: false, Teacher: true },
  },
  {
    module: "School Expenses",
    roles: { Principal: true, Admin: true, Staff: false, Teacher: false },
  },
  {
    module: "Syllabus",
    roles: { Principal: true, Admin: true, Staff: false, Teacher: true },
  },
];

const AppContext = createContext();

export function AppProvider({ children }) {
  // Safe JSON parsing for user to prevent crash
  const getInitialUser = () => {
    try {
      const savedUser = localStorage.getItem("erp_user");
      if (savedUser) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.warn("Corrupted user session found, clearing it.", e);
      localStorage.removeItem("erp_user");
      localStorage.removeItem("erp_token");
    }
    return null;
  };

  const [currentUser, setCurrentUser] = useState(getInitialUser);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [toast, setToast] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    message: "",
    onConfirm: null,
  });

  // Data from backend only (online-first)
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [rolePermissionsMatrix, setRolePermissionsMatrix] = useState(null);
  const [unreadNotifications, setUnreadNotifications] = useState([]);
  const [schoolInfo, setSchoolInfo] = useState({
    name: "Summit International School",
    logoUrl: "/logo.png",
    address: "School Address, City",
    phone: "1234567890",
  });

  const loadNotifications = async (
    currentStudents = students,
    currentTeachers = teachers,
  ) => {
    if (!currentUser) return;
    try {
      const items = [];
      const today = new Date();
      const m = today.getMonth() + 1;
      const d = today.getDate();
      const todayStr = today.toISOString().split("T")[0];

      // Reset read list if day changed
      const savedDate = localStorage.getItem("erp_notification_date");
      if (savedDate !== todayStr) {
        localStorage.setItem("erp_notification_date", todayStr);
        localStorage.setItem("erp_read_notifications", JSON.stringify([]));
      }

      const readIds = JSON.parse(
        localStorage.getItem("erp_read_notifications") || "[]",
      );

      // 1. Birthdays
      const checkBirthday = (person, type, pathPrefix) => {
        if (!person.dob) return;
        const dob = new Date(person.dob);
        if (dob.getMonth() + 1 === m && dob.getDate() === d) {
          const desc =
            type === "student"
              ? `Wish ${person.name} from ${person.className} a happy birthday.`
              : `Wish ${person.name} (Staff) a happy birthday.`;
          items.push({
            id: `bday-${type}-${person.id}`,
            type: "Birthday",
            title: `Today is ${person.name}'s Birthday!`,
            description: desc,
            priority: "medium",
            path: pathPrefix ? `${pathPrefix}/${person.id}` : null,
          });
        }
      };

      currentStudents.forEach((s) => checkBirthday(s, "student", "/students"));
      currentTeachers.forEach((t) => checkBirthday(t, "staff", null));

      // 2. High Fee Dues
      try {
        const defaultersRes = await api.fees.defaulters();
        const highDues = (defaultersRes?.data || []).slice(0, 3);
        highDues.forEach((def) => {
          if ((def.totalFeesDue || 0) > 5000) {
            items.push({
              id: `due-${def._id}`,
              type: "Fee",
              title: "High Fee Pending",
              description: `${def.firstName} (${def.currentClass}) has ₹${def.totalFeesDue.toLocaleString()} pending.`,
              priority: "high",
              path: "/fees/dues",
            });
          }
        });
      } catch (e) {
        console.warn("Failed to fetch defaulters for notifications", e);
      }

      // 3. Upcoming Events
      try {
        const eventsRes = await api.communication.calendar.list();
        const now = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(now.getDate() + 3);

        (eventsRes?.data || []).forEach((ev) => {
          const evDate = new Date(ev.date);
          if (evDate >= now && evDate <= threeDaysLater) {
            items.push({
              id: `event-${ev._id}`,
              type: "Event",
              title: `Upcoming: ${ev.title}`,
              description: `${ev.type || "Event"} on ${evDate.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}.`,
              priority: "medium",
              path: "/academic-calendar",
            });
          }
        });
      } catch (e) {
        console.warn("Failed to fetch events for notifications", e);
      }

      // 4. Leave Requests
      if (["Principal", "Admin"].includes(currentUser?.role)) {
        try {
          const leavesRes = await api.attendance.leaveRequests();
          const pendingLeaves = (leavesRes?.data || []).filter(
            (l) => l.status === "pending",
          );
          if (pendingLeaves.length > 0) {
            items.push({
              id: "leaves-summary",
              type: "Leave",
              title: `${pendingLeaves.length} Pending Leave Request(s)`,
              description: "Staff members are waiting for leave approval.",
              priority: "high",
              path: "/teacher-attendance",
            });
          }
        } catch (e) {
          console.warn("Failed to fetch leaves for notifications", e);
        }
      }

      // Filter out read notifications
      const unread = items.filter((item) => !readIds.includes(item.id));

      const priorityScore = { high: 3, medium: 2, low: 1 };
      setUnreadNotifications(
        unread
          .sort((a, b) => priorityScore[b.priority] - priorityScore[a.priority])
          .slice(0, 8),
      );
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  const dismissNotification = (id) => {
    const readIds = JSON.parse(
      localStorage.getItem("erp_read_notifications") || "[]",
    );
    if (!readIds.includes(id)) {
      readIds.push(id);
      localStorage.setItem("erp_read_notifications", JSON.stringify(readIds));
    }
    setUnreadNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllNotificationsAsRead = () => {
    const readIds = JSON.parse(
      localStorage.getItem("erp_read_notifications") || "[]",
    );
    unreadNotifications.forEach((n) => {
      if (!readIds.includes(n.id)) readIds.push(n.id);
    });
    localStorage.setItem("erp_read_notifications", JSON.stringify(readIds));
    setUnreadNotifications([]);
  };

  const mapBackendStudent = (s) => ({
    id: s._id,
    studentId: s.studentId,
    roll:
      s.rollNumber !== undefined && s.rollNumber !== null
        ? String(s.rollNumber).padStart(3, "0")
        : "",
    name: `${s.firstName || ""} ${s.lastName || ""}`.trim(),
    className: s.currentClass,
    section: s.section,
    father: s.fatherName || "",
    parentName: s.fatherName || s.guardianName || s.motherName || "",
    phone: s.primaryContactPhone || "",
    age: s.age || null,
    dob: s.dateOfBirth
      ? new Date(s.dateOfBirth).toISOString().slice(0, 10)
      : "",
    dues: s.totalFeesDue || 0,
    paid: s.totalFeesPaid || 0,
    feeStatus:
      (s.totalFeesDue || 0) > 0
        ? "due"
        : (s.totalFeesPaid || 0) > 0
          ? "cleared"
          : "none",
    attendance: null,
    photoUrl: s.photoUrl || "",
    socialCategory: s.socialCategory || "NA",
    minorityGroup: s.minorityGroup || "NA",
  });

  const mapBackendTeacher = (t) => ({
    id: t._id,
    staffId: t.staffId || null,
    name: t.name,
    role: t.roleType === "TEACHER" ? "Teacher" : t.roleType || "Staff",
    subject: t.subject || t.department || "",
    department: t.department || "",
    qualification: t.qualification || "",
    joinDate: t.joinDate ? new Date(t.joinDate).toISOString().slice(0, 10) : "",
    dob: t.dateOfBirth
      ? new Date(t.dateOfBirth).toISOString().slice(0, 10)
      : "",
    phone: t.phone || "",
    basic: t.basic || 0,
    hra: t.hra || 0,
    allowances: t.allowances || 0,
    deductions: t.deductions || 0,
    assignedClasses: Array.isArray(t.assignedClasses) ? t.assignedClasses : [],
    userId: t.userId || null,
  });

  const titleRoleFromBackend = (backendRole) => {
    if (!backendRole) return backendRole;
    const upper = String(backendRole).toUpperCase();
    if (upper === "PRINCIPAL") return "Principal";
    if (upper === "ADMIN") return "Admin";
    if (upper === "TEACHER") return "Teacher";
    if (upper === "ACCOUNTANT") return "Staff";
    if (upper === "STAFF") return "Staff";
    return backendRole;
  };

  const loadCoreData = async () => {
    const token = localStorage.getItem("erp_token");
    if (!token) {
      return;
    }

    try {
      const [studentRes, feeRes, staffRes] = await Promise.all([
        api.students.list({ page: 1, limit: 500 }),
        api.fees.structures(),
        api.staff.list({ page: 1, limit: 500 }),
      ]);

      const mappedStudents = (studentRes?.data || []).map(mapBackendStudent);
      setStudents(mappedStudents);
      setFeeStructures(
        (feeRes?.data || feeRes || []).map((f) => ({
          ...f,
          id: f?._id || f?.id,
        })),
      );

      const teachersOnline = (staffRes?.data || [])
        .filter((t) => t.roleType === "TEACHER")
        .map(mapBackendTeacher);
      setTeachers(teachersOnline);

      // Load Notifications
      loadNotifications(mappedStudents, teachersOnline);

      // Load Role Permissions Matrix and School Info
      api.settings
        .get()
        .then((res) => {
          const data = res?.data || res;
          if (
            data?.rolePermissionsMatrix &&
            Array.isArray(data.rolePermissionsMatrix)
          ) {
            setRolePermissionsMatrix(data.rolePermissionsMatrix);
          }
          if (data?.schoolProfile) {
            return setSchoolInfo({
              name:
                data.schoolProfile.schoolName || "Summit International School",
              logoUrl: data.schoolProfile.logoUrl || "/logo.png",
              address: data.schoolProfile.address || "School Address, City",
              phone: data.schoolProfile.phone || "1234567890",
              sections: data.schoolProfile.sections || ["A", "B"],
            });
          }
        })
        .catch(() => {});
    } catch (e) {
      showToast(
        "error",
        e?.data?.message || e?.message || "Failed to load backend data",
      );
      setStudents([]);
      setTeachers([]);
      setFeeStructures([]);
    }
  };

  // Load core data whenever user is available (token present) or session changes
  useEffect(() => {
    if (!currentUser) return;
    loadCoreData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // After refresh, currentUser might be missing but token can still exist.
  useEffect(() => {
    const token = localStorage.getItem("erp_token");
    if (!token) return;
    if (currentUser) return;

    api.auth
      .me()
      .then((meRes) => {
        if (meRes?.data) {
          return setCurrentUser({
            ...meRes.data,
            role: titleRoleFromBackend(meRes.data?.role),
          });
        }
      })
      .catch(() => {
        localStorage.removeItem("erp_token");
        setCurrentUser(null);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!currentUser) {
      localStorage.removeItem("erp_user");
      localStorage.removeItem("erp_token");
      return;
    }

    localStorage.setItem("erp_user", JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const hideToast = () => setToast(null);

  const showConfirm = (message, onConfirm, options = {}) => {
    setConfirmDialog({
      isOpen: true,
      message,
      onConfirm,
      title: options.title || "",
      danger: options.danger || false,
      confirmText: options.confirmText || "",
    });
  };

  const hideConfirm = () => {
    setConfirmDialog({
      isOpen: false,
      message: "",
      onConfirm: null,
      title: "",
      danger: false,
      confirmText: "",
    });
  };

  const login = ({ token, user }) => {
    const displayUser = {
      ...user,
      role: titleRoleFromBackend(user?.role),
    };
    localStorage.setItem("erp_token", token);
    setCurrentUser(displayUser);
  };

  const logout = () => {
    localStorage.removeItem("erp_token");
    setCurrentUser(null);
  };

  // CRUD Helpers (backend only)
  const addTeacher = async (teacherData) => {
    await api.staff.create({
      ...teacherData,
      roleType: "TEACHER",
    });
    await loadCoreData();
  };

  const updateTeacher = async (id, changes) => {
    await api.staff.update(id, changes);
    await loadCoreData();
  };

  const deleteTeacher = async (id) => {
    await api.staff.remove(id);
    await loadCoreData();
  };

  const refreshFeeStructures = async () => {
    const feeRes = await api.fees.structures();
    const mapped = (feeRes?.data || feeRes || []).map((f) => ({
      ...f,
      id: f?._id || f?.id,
    }));
    setFeeStructures(mapped);
    return mapped;
  };

  const checkPathAllowed = (itemPath, defaultRoleCheck = false) => {
    const userRole = currentUser?.role;
    if (userRole === "Principal") return true;
    if (
      (userRole === "Teacher" || userRole === "Staff") &&
      itemPath === "/teacher-attendance/my"
    )
      return true;
    if (itemPath === "/dashboard" || itemPath === "/login" || itemPath === "/")
      return true;
    if (
      itemPath === "/fees/structure" ||
      itemPath.startsWith("/fees/structure/")
    )
      return false;

    const matrix = rolePermissionsMatrix || DEFAULT_MATRIX;

    let bestModule = null;
    let maxMatchLen = 0;

    for (const [mod, paths] of Object.entries(MODULE_PATH_MAP)) {
      for (const p of paths) {
        if (
          (itemPath === p || itemPath.startsWith(`${p}/`)) &&
          p.length > maxMatchLen
        ) {
          maxMatchLen = p.length;
          bestModule = mod;
        }
      }
    }

    if (bestModule) {
      const permRow =
        matrix.find((r) => r.module === bestModule) ||
        DEFAULT_MATRIX.find((r) => r.module === bestModule);
      return permRow?.roles?.[userRole] === true;
    }

    return defaultRoleCheck;
  };

  const value = {
    currentUser,
    login,
    logout,
    isOnline,
    showToast,
    hideToast,
    toast,
    confirmDialog,
    showConfirm,
    hideConfirm,
    students,
    setStudents,
    teachers,
    setTeachers,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    feeStructures,
    refreshFeeStructures,
    loadCoreData,
    rolePermissionsMatrix,
    schoolInfo,
    setSchoolInfo,
    checkPathAllowed,
    unreadNotifications,
    dismissNotification,
    markAllNotificationsAsRead,
    loadNotifications,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
