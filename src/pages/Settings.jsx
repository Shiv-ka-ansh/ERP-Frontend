import React, { useState, useEffect } from "react";
import {
  Save,
  Image as ImageIcon,
  Globe,
  Database,
  Users,
  Shield,
  Edit2,
  Trash2,
  Plus,
  X,
  CheckSquare,
  Square,
  BookOpen,
  Eye,
  EyeOff,
  Archive,
  RefreshCw,
} from "lucide-react";
import { useAppContext, DEFAULT_MATRIX } from "../context/AppContext";
import CustomSelect from "../components/ui/CustomSelect";
import { api } from "../api/client";
import { ALL_CLASSES } from "../constants/classes";

export default function Settings() {
  const {
    showToast,
    showConfirm,
    user: currentUser,
    teachers: staffTeachers,
    setSchoolInfo,
  } = useAppContext();
  const [activeTab, setActiveTab] = useState("general");
  const [usersList, setUsersList] = useState([]);

  // Subject Management State
  const [classSubjects, setClassSubjects] = useState([]);
  const [selectedClassForSubjects, setSelectedClassForSubjects] =
    useState("Class 1");
  const [newSubjectName, setNewSubjectName] = useState("");

  // User Modal State
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [userFormData, setUserFormData] = useState({
    username: "",
    password: "",
    fullName: "",
    email: "",
    role: "Teacher",
    assignedClasses: [],
    linkedStaffId: null,
  });
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [teacherSearch, setTeacherSearch] = useState("");
  const [showTeacherDropdown, setShowTeacherDropdown] = useState(false);
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);

  // Data Management State (Recycle Bin)
  const [deletedStudents, setDeletedStudents] = useState([]);

  // School profile state for general tab
  const [schoolProfile, setSchoolProfile] = useState({
    schoolName: "Demo Public School",
    affiliationNo: "UP-214455",
    schoolCode: "SCH-001",
    address: "School Address, City, State, 123456",
    phone: "1234567890",
    website: "www.schoolwebsite.com",
    sections: ["A", "B", "C"],
  });
  const [savingProfile, setSavingProfile] = useState(false);

  // Academic year state
  const [academicYear, setAcademicYear] = useState("2026-27");
  const [savingAcYear, setSavingAcYear] = useState(false);
  const [passwordModal, setPasswordModal] = useState({
    isOpen: false,
    targetAction: null,
    password: "",
    targetYear: "",
  });

  // Load predefined data
  useEffect(() => {
    if (activeTab === "general") {
      api.settings
        .get()
        .then((res) => {
          const data = res?.data || res;
          const profile = data?.schoolProfile;
          if (profile && Object.keys(profile).length > 0) {
            return setSchoolProfile((prev) => ({ ...prev, ...profile }));
          }
        })
        .catch(() => {});
    }
    if (activeTab === "academic") {
      api.settings
        .get()
        .then((res) => {
          const data = res?.data || res;
          const yr = data?.academicYear || data?.value?.academicYear;
          if (yr) return setAcademicYear(yr);
        })
        .catch(() => {});
    }
    if (activeTab === "users") {
      api.users
        .list({ page: 1, limit: 500 })
        .then((res) =>
          setUsersList((res?.data || []).map((u) => ({ ...u, id: u._id }))),
        )
        .catch(() => showToast("error", "Failed to load users"));
    }
    if (activeTab === "subjects") {
      loadClassSubjects();
    }
    if (activeTab === "permissions") {
      api.settings
        .get()
        .then((res) => {
          const data = res?.data || res;
          if (
            data?.rolePermissionsMatrix &&
            Array.isArray(data.rolePermissionsMatrix) &&
            data.rolePermissionsMatrix.length > 0
          ) {
            return setPermissionsMatrix(data.rolePermissionsMatrix);
          }
        })
        .catch(() => {});
    }
    if (activeTab === "data") {
      loadDeletedStudents();
    }
  }, [activeTab]);

  const loadDeletedStudents = async () => {
    try {
      const res = await api.students.listDeleted();
      setDeletedStudents(res?.data || []);
    } catch {
      showToast("error", "Failed to load deleted students");
    }
  };

  const loadClassSubjects = async () => {
    const data = await api.classSubjects.list({ page: 1, limit: 500 });
    setClassSubjects((data?.data || []).map((d) => ({ ...d, id: d._id })));
  };

  const tabs = [
    { key: "general", label: "General Info", Icon: Globe },
    { key: "academic", label: "Academic Year", Icon: Database },
    { key: "subjects", label: "Subjects", Icon: BookOpen },
    { key: "users", label: "User Roles", Icon: Users },
    { key: "permissions", label: "Permissions", Icon: Shield },
    { key: "data", label: "Data Management", Icon: Archive, restricted: true },
  ].filter((t) => !t.restricted || currentUser?.role === "Principal");

  const [permissionsMatrix, setPermissionsMatrix] = useState(DEFAULT_MATRIX);
  const [savingMatrix, setSavingMatrix] = useState(false);

  /* ---------------- HANDLERS ---------------- */

  const handleAddSubject = async (eOrSub) => {
    const val = typeof eOrSub === "string" ? eOrSub : newSubjectName;
    if (!val.trim()) return;
    const cleanSub = val.trim();
    const existing = classSubjects.find(
      (cs) => cs.className === selectedClassForSubjects,
    );
    if (existing) {
      if (existing.subjects.includes(cleanSub)) {
        showToast("error", "Subject already exists");
        return;
      }
      await api.classSubjects.update(existing.id, {
        subjects: [...existing.subjects, cleanSub],
      });
    } else {
      await api.classSubjects.create({
        className: selectedClassForSubjects,
        subjects: [cleanSub],
      });
    }
    if (val === newSubjectName) setNewSubjectName("");
    loadClassSubjects();
    showToast("success", "Subject added");
  };

  const handleDeleteSubject = async (className, subject) => {
    const existing = classSubjects.find((cs) => cs.className === className);
    if (!existing) return;
    const updated = existing.subjects.filter((s) => s !== subject);
    await api.classSubjects.update(existing.id, { subjects: updated });
    loadClassSubjects();
    showToast("success", "Subject removed");
  };

  const handleEditUser = (u) => {
    const roleMapRev = {
      PRINCIPAL: "Principal",
      ADMIN: "Admin",
      TEACHER: "Teacher",
      STAFF: "Staff",
      ACCOUNTANT: "Staff",
    };

    setEditingUserId(u.id);
    setUserFormData({
      username: u.username || "",
      password: "",
      fullName: u.fullName || "",
      email: u.email || "",
      role: roleMapRev[u.role] || u.role,
      assignedClasses: u.assignedClasses || [],
      linkedStaffId: u.linkedStaffId || null,
    });
    setResetPasswordValue("");
    setShowUserPassword(false);
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (
      !userFormData.username ||
      (!editingUserId && !userFormData.password) ||
      !userFormData.fullName ||
      !userFormData.email
    ) {
      showToast("error", "Please fill all required user fields");
      return;
    }
    try {
      const roleMap = {
        Principal: "PRINCIPAL",
        Admin: "ADMIN",
        Teacher: "TEACHER",
        Staff: "STAFF",
      };
      const payload = {
        username: userFormData.username.trim(),
        role: roleMap[userFormData.role] || userFormData.role,
        fullName: userFormData.fullName.trim(),
        email: userFormData.email.trim(),
        assignedClasses: userFormData.assignedClasses,
        linkedStaffId: userFormData.linkedStaffId || null,
      };

      if (editingUserId) {
        await api.users.update(editingUserId, payload);
        if (resetPasswordValue) {
          await api.users.resetPassword(editingUserId, resetPasswordValue);
        }
        showToast("success", "User updated successfully");
      } else {
        payload.password = userFormData.password;
        await api.users.create(payload);
        showToast("success", "User added successfully");
      }

      const res = await api.users.list({ page: 1, limit: 500 });
      setUsersList((res?.data || []).map((u) => ({ ...u, id: u._id })));
      setShowUserModal(false);
      setShowUserPassword(false);
      setEditingUserId(null);
      setUserFormData({
        username: "",
        password: "",
        fullName: "",
        email: "",
        role: "Teacher",
        assignedClasses: [],
        linkedStaffId: null,
      });
      setResetPasswordValue("");
    } catch {
      showToast("error", "Failed to save user");
    }
  };

  const handleDeleteUser = (id) => {
    if (!id) return;
    if (id === 1) {
      // Prevent deleting default admin for safety (Dexie legacy)
      showToast("error", "Cannot delete primary admin account");
      return;
    }
    showConfirm("Delete this user account?", async () => {
      await api.users.remove(id);
      const res = await api.users.list({ page: 1, limit: 500 });
      setUsersList((res?.data || []).map((u) => ({ ...u, id: u._id })));
      showToast("success", "User deleted");
    });
  };

  const togglePermission = (rowIndex, role) => {
    if (role === "Principal") return; // Principal locked
    setPermissionsMatrix((prev) =>
      prev.map((row, i) =>
        i === rowIndex
          ? { ...row, roles: { ...row.roles, [role]: !row.roles[role] } }
          : row,
      ),
    );
  };

  const handleSavePermissions = async () => {
    setSavingMatrix(true);
    try {
      await api.settings.upsert("rolePermissionsMatrix", permissionsMatrix);
      showToast("success", "Permissions saved successfully");
    } catch {
      showToast("error", "Failed to save permissions");
    } finally {
      setSavingMatrix(false);
    }
  };

  const handleRollover = () => {
    // targetYear compute karo from current academicYear
    const parts = academicYear.split("-");
    const nextStart = parseInt(parts[0], 10) + 1;
    const nextEnd = nextStart + 1;
    const targetYear = `${nextStart}-${String(nextEnd).slice(-2)}`;

    showConfirm(
      `\u26A0\uFE0F This will promote ALL students to next class and set academic year to ${targetYear}. Class 10 students will become Alumni. This CANNOT be undone. Are you sure?`,
      () => {
        setPasswordModal({
          isOpen: true,
          targetAction: "ROLLOVER",
          password: "",
          targetYear,
        });
      },
      {
        title: "Confirm Session Rollover",
        danger: true,
        confirmText: "Yes, Proceed to Verification",
      },
    );
  };

  const START_YEAR = 2026;
  let activeStart = START_YEAR;
  if (academicYear) {
    const yr = parseInt(academicYear.split("-")[0], 10);
    if (!isNaN(yr)) activeStart = Math.max(START_YEAR, yr);
  }

  const acYearsList = [];
  for (let y = START_YEAR; y <= activeStart + 1; y += 1) {
    const nextY = y + 1;
    const val = `${y}-${nextY.toString().slice(-2)}`;
    acYearsList.push({
      label: `${y} - ${nextY}${academicYear === val ? " (Active)" : ""}`,
      value: val,
    });
  }

  const nextRolloverYear = `${activeStart + 1}-${(activeStart + 2).toString().slice(-2)}`;

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-navy font-brand">ERP Settings</h1>
        <button
          className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={savingProfile}
          onClick={async () => {
            setSavingProfile(true);
            try {
              await api.settings.upsert("schoolProfile", schoolProfile);
              setSchoolInfo({
                name: schoolProfile.schoolName,
                logoUrl: schoolProfile.logoUrl || "/logo.png",
                address: schoolProfile.address,
                phone: schoolProfile.phone,
              });
              showToast("success", "Settings saved successfully");
            } catch (err) {
              console.error(err);
              showToast("error", "Failed to save settings");
            } finally {
              setSavingProfile(false);
            }
          }}
        >
          <Save size={18} /> {savingProfile ? "Saving..." : "Save All Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6 items-start">
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          {tabs.map(({ key, label, Icon }) => (
            <button
              key={key}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all ${activeTab === key ? "bg-cta/10 text-cta border-l-4 border-cta" : "text-gray-500 hover:bg-gray-50 border-l-4 border-transparent"}`}
              onClick={() => setActiveTab(key)}
            >
              <Icon size={18} /> {label}
            </button>
          ))}
        </div>

        <div>
          {/* TAB 1: GENERAL */}
          {activeTab === "general" && (
            <div className="bg-white rounded-xl shadow-card p-6">
              <h2 className="font-brand font-bold text-xl text-navy mb-6">
                School Profile
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    School Setup Logo (Dark Background)
                  </label>
                  <div className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-cta transition-colors">
                    <ImageIcon size={32} className="text-gray-400" />
                    <span className="text-sm font-semibold text-navy">
                      Click to upload brand logo
                    </span>
                    <span className="text-xs text-gray-400">PNG, max 2MB</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Print Watermark Logo (Light Background)
                  </label>
                  <div className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-gray-200 rounded-xl bg-white cursor-pointer hover:border-cta transition-colors">
                    <div className="size-10 rounded-full bg-gray-50 flex items-center justify-center text-cta p-1">
                      <img
                        src={schoolProfile.logoUrl || "/logo.png"}
                        alt="Logo"
                        className="size-full object-contain"
                      />
                    </div>
                    <span className="text-sm font-semibold text-navy">
                      school_watermark.png
                    </span>
                    <span className="text-xs text-gray-400">
                      Click to change
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-1 mb-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  School Full Name
                </label>
                <input
                  type="text"
                  value={schoolProfile.schoolName}
                  onChange={(e) =>
                    setSchoolProfile((p) => ({
                      ...p,
                      schoolName: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-base font-brand text-navy focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Affiliation No.
                  </label>
                  <input
                    type="text"
                    value={schoolProfile.affiliationNo}
                    onChange={(e) =>
                      setSchoolProfile((p) => ({
                        ...p,
                        affiliationNo: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    School Code
                  </label>
                  <input
                    type="text"
                    value={schoolProfile.schoolCode}
                    onChange={(e) =>
                      setSchoolProfile((p) => ({
                        ...p,
                        schoolCode: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 mb-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Official Address (Prints on Receipts/TC)
                </label>
                <textarea
                  rows={2}
                  value={schoolProfile.address}
                  onChange={(e) =>
                    setSchoolProfile((p) => ({ ...p, address: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 resize-none"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Contact Number
                  </label>
                  <input
                    type="text"
                    value={schoolProfile.phone}
                    onChange={(e) =>
                      setSchoolProfile((p) => ({ ...p, phone: e.target.value }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Website Address
                  </label>
                  <input
                    type="text"
                    value={schoolProfile.website}
                    onChange={(e) =>
                      setSchoolProfile((p) => ({
                        ...p,
                        website: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACADEMIC */}
          {activeTab === "academic" && (
            <div className="bg-white rounded-xl shadow-card p-6">
              <h2 className="font-brand font-bold text-xl text-navy mb-6">
                Academic Configuration
              </h2>
              <div className="flex flex-col gap-1 mb-6">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Current Active Academic Year
                </label>
                <CustomSelect
                  value={academicYear}
                  onChange={setAcademicYear}
                  options={acYearsList}
                  className="font-brand text-navy"
                />
              </div>

              <button
                disabled={savingAcYear}
                onClick={() =>
                  setPasswordModal({
                    isOpen: true,
                    targetAction: "SAVE_YEAR",
                    password: "",
                  })
                }
                className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark disabled:opacity-50 mb-6"
              >
                <Save size={16} />{" "}
                {savingAcYear ? "Saving..." : "Save Academic Year"}
              </button>

              <div className="flex items-start gap-4 p-5 bg-amber-50 border border-amber-200 rounded-xl">
                <Globe size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-sm">Session Roll-over</strong>
                  <p className="text-gray-500 text-sm mt-1">
                    Perform this action carefully. It promotes all passing
                    students to the next class and generates new fee templates.
                  </p>
                  <button
                    onClick={handleRollover}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium mt-3 hover:bg-amber-600 transition-colors"
                  >
                    Initiate Roll-over to{" "}
                    {(() => {
                      const parts = academicYear.split("-");
                      const next = parseInt(parts[0], 10) + 1;
                      return `${next}-${String(next + 1).slice(-2)}`;
                    })()}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUBJECTS */}
          {activeTab === "subjects" && (
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-brand font-bold text-xl text-navy">
                    Class-wise Subjects
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Configure subjects for each class. These will be used in
                    Exams and Syllabus modules.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1 max-w-xs">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Select Class
                  </label>
                  <CustomSelect
                    value={selectedClassForSubjects}
                    onChange={setSelectedClassForSubjects}
                    options={ALL_CLASSES}
                  />
                </div>

                <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 mt-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter subject name (e.g. Science)"
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddSubject()}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
                    />
                    <button
                      onClick={handleAddSubject}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors"
                    >
                      <Plus size={18} /> Add
                    </button>
                  </div>

                  {/* Basic Subjects Quick Add */}
                  <div className="flex flex-wrap gap-2 mt-3 p-3 bg-white border border-gray-100 rounded-lg shadow-sm">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-1 mt-1.5 shrink-0">
                      Quick Add:
                    </span>
                    {[
                      "English",
                      "Hindi",
                      "Mathematics",
                      "Science",
                      "Social Science",
                      "Sanskrit",
                      "Computer",
                      "EVS",
                      "G.K.",
                      "Art & Craft",
                      "Physical Education",
                    ].map((sub) => (
                      <button
                        key={sub}
                        onClick={() => handleAddSubject(sub)}
                        className="px-2.5 py-1 text-xs border border-gray-200 text-gray-600 rounded hover:bg-cta hover:text-white hover:border-cta transition-colors"
                      >
                        + {sub}
                      </button>
                    ))}
                  </div>

                  <div className="mt-6">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                      Current Subjects
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {classSubjects
                        .find((cs) => cs.className === selectedClassForSubjects)
                        ?.subjects.map((sub) => (
                          <div
                            key={sub}
                            className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-lg shadow-sm group"
                          >
                            <span className="text-sm font-medium text-navy">
                              {sub}
                            </span>
                            <button
                              onClick={() =>
                                handleDeleteSubject(
                                  selectedClassForSubjects,
                                  sub,
                                )
                              }
                              className="text-gray-400 hover:text-cta transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      {(!classSubjects.find(
                        (cs) => cs.className === selectedClassForSubjects,
                      ) ||
                        classSubjects.find(
                          (cs) => cs.className === selectedClassForSubjects,
                        ).subjects.length === 0) && (
                        <p className="text-sm text-gray-400 italic">
                          No subjects added for this class yet.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: USERS */}
          {activeTab === "users" && (
            <div className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h2 className="font-brand font-bold text-xl text-navy">
                    User Management
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage login credentials and assign roles to staff members.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingUserId(null);
                    setShowUserPassword(false);
                    setUserFormData({
                      username: "",
                      password: "",
                      fullName: "",
                      email: "",
                      role: "Teacher",
                      assignedClasses: [],
                      linkedStaffId: null,
                    });
                    setResetPasswordValue("");
                    setShowUserModal(true);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cta/10 text-cta rounded-lg text-sm font-medium hover:bg-cta/20 transition-colors"
                >
                  <Plus size={18} /> Add User
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Username
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Role Prefix
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Assigned Classes
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.length === 0 && (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-gray-400"
                        >
                          Loading users...
                        </td>
                      </tr>
                    )}
                    {usersList.map((u) => (
                      <tr
                        key={u.id}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 font-brand font-semibold text-navy">
                          {u.username}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {(u.assignedClasses || []).length > 0 ? (
                              (u.assignedClasses || []).map((cls, i) => (
                                <span
                                  key={i}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-teal/10 text-teal"
                                >
                                  {cls}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-300">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleEditUser(u)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400 hover:text-cta"
                            aria-label="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-red-400 hover:text-red-500"
                            aria-label="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: PERMISSIONS */}
          {activeTab === "permissions" && (
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="font-brand font-bold text-xl text-navy">
                    Role Permissions
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Controls sidebar visibility. Principal access cannot be
                    removed.
                  </p>
                </div>
                <button
                  onClick={handleSavePermissions}
                  disabled={savingMatrix}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark disabled:opacity-50 transition-colors"
                >
                  <Save size={16} />{" "}
                  {savingMatrix ? "Saving..." : "Save Permissions"}
                </button>
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-100">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide w-48">
                        Module
                      </th>
                      {["Principal", "Admin", "Staff", "Teacher"].map(
                        (role) => (
                          <th
                            key={role}
                            className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide"
                          >
                            {role}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {permissionsMatrix.map((row, i) => (
                      <tr
                        key={row.module}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 font-brand font-semibold text-navy text-[13px]">
                          {row.module}
                        </td>
                        {["Principal", "Admin", "Staff", "Teacher"].map(
                          (role) => (
                            <td key={role} className="px-6 py-4 text-center">
                              <button
                                onClick={() => togglePermission(i, role)}
                                disabled={role === "Principal"}
                                className={`mx-auto block transition-all ${role === "Principal" ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:scale-110"}`}
                                title={
                                  role === "Principal"
                                    ? "Always enabled"
                                    : `Toggle ${role}`
                                }
                              >
                                {row.roles[role] ? (
                                  <CheckSquare size={18} className="text-cta" />
                                ) : (
                                  <Square size={18} className="text-gray-300" />
                                )}
                              </button>
                            </td>
                          ),
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: DATA MANAGEMENT */}
          {activeTab === "data" && currentUser?.role === "Principal" && (
            <div className="bg-white rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="font-brand font-bold text-xl text-navy">
                    Recycle Bin
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    Manage archived students. You can restore them or delete
                    them permanently.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto border border-gray-100 rounded-xl">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Student ID
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Deleted By
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletedStudents.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-8 text-center text-gray-400"
                        >
                          Recycle bin is empty.
                        </td>
                      </tr>
                    )}
                    {deletedStudents.map((s) => (
                      <tr
                        key={s._id}
                        className="border-b border-gray-50 hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 font-mono text-gray-500 text-xs">
                          {s.studentId}
                        </td>
                        <td className="px-6 py-4 font-brand font-semibold text-navy">
                          {s.firstName} {s.lastName}
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {s.currentClass}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-xs">
                          {s.deletedBy?.fullName ||
                            s.deletedBy?.username ||
                            "Unknown"}
                        </td>
                        <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              showConfirm(
                                `Restore ${s.firstName} ${s.lastName}?`,
                                async () => {
                                  await api.students.restore(s._id);
                                  showToast("success", "Student restored");
                                  loadDeletedStudents();
                                },
                              );
                            }}
                            className="p-1.5 rounded-lg border border-teal text-teal hover:bg-teal hover:text-white transition-colors"
                            title="Restore Student"
                          >
                            <RefreshCw size={14} />
                          </button>
                          <button
                            onClick={() => {
                              showConfirm(
                                `PERMANENTLY DELETE ${s.firstName} ${s.lastName}? This action cannot be undone.`,
                                async () => {
                                  await api.students.permanentDelete(s._id);
                                  showToast(
                                    "success",
                                    "Student permanently deleted",
                                  );
                                  loadDeletedStudents();
                                },
                                {
                                  danger: true,
                                  title: "Permanent Delete",
                                  confirmText: "Permanently Delete",
                                },
                              );
                            }}
                            className="p-1.5 rounded-lg border border-red-500 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                            title="Format/Delete Permanently"
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-6 bg-navy rounded-t-2xl shrink-0">
              <h3 className="font-brand text-white text-sm font-semibold">
                {editingUserId ? "Edit System User" : "Add System User"}
              </h3>
              <button onClick={() => setShowUserModal(false)}>
                <X size={20} className="text-white/70 hover:text-white" />
              </button>
            </div>
            <div className="p-6 flex flex-col gap-4 overflow-y-auto flex-1 custom-scrollbar">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Role
                </label>
                <div className="z-20">
                  <CustomSelect
                    value={userFormData.role}
                    onChange={(val) => {
                      setUserFormData((prev) => ({
                        ...prev,
                        role: val,
                        assignedClasses:
                          val === "Teacher" ? prev.assignedClasses : [],
                        linkedStaffId:
                          val === "Teacher" ? prev.linkedStaffId : null,
                        fullName: val === "Teacher" ? "" : prev.fullName,
                      }));
                      setShowTeacherDropdown(false);
                      setTeacherSearch("");
                    }}
                    options={["Admin", "Principal", "Staff", "Teacher"]}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Login Username
                </label>
                <input
                  type="text"
                  value={userFormData.username}
                  onChange={(e) =>
                    setUserFormData((prev) => ({
                      ...prev,
                      username: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
                  placeholder="e.g. j.sharma"
                />
              </div>
              {!editingUserId ? (
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Temporary Password
                  </label>
                  <div className="relative">
                    <input
                      type={showUserPassword ? "text" : "password"}
                      value={userFormData.password}
                      onChange={(e) =>
                        setUserFormData((prev) => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta pr-10"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cta p-1 rounded"
                      onClick={() => setShowUserPassword(!showUserPassword)}
                    >
                      {showUserPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-1 p-3 bg-red-50 rounded-lg border border-red-100">
                  <label className="text-xs font-medium text-red-500 uppercase tracking-wide">
                    Reset Password (Optional)
                  </label>
                  <div className="relative mt-1">
                    <input
                      type={showUserPassword ? "text" : "password"}
                      value={resetPasswordValue}
                      onChange={(e) => setResetPasswordValue(e.target.value)}
                      className="w-full px-3 py-2 border border-red-200 rounded-lg text-sm focus:outline-none focus:border-red-400 pr-10"
                      placeholder="Enter new password to reset"
                    />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-red-300 hover:text-red-500 p-1 rounded"
                      onClick={() => setShowUserPassword(!showUserPassword)}
                    >
                      {showUserPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                  <span className="text-xs text-red-400 mt-1">
                    Leave empty to keep current password.
                  </span>
                </div>
              )}
              <div className="flex flex-col gap-1 relative">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Full Name{" "}
                  {userFormData.role === "Teacher" && (
                    <span className="text-teal normal-case">
                      (Select from staff)
                    </span>
                  )}
                </label>
                {userFormData.role === "Teacher" ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={
                        showTeacherDropdown
                          ? teacherSearch
                          : userFormData.fullName
                      }
                      onChange={(e) => {
                        setTeacherSearch(e.target.value);
                        setShowTeacherDropdown(true);
                      }}
                      onFocus={() => {
                        setTeacherSearch("");
                        setShowTeacherDropdown(true);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
                      placeholder="Type to search teacher..."
                    />
                    {showTeacherDropdown && (
                      <div className="absolute top-full inset-x-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-40 overflow-y-auto z-50">
                        {staffTeachers
                          .filter(
                            (t) =>
                              !teacherSearch ||
                              t.name
                                .toLowerCase()
                                .includes(teacherSearch.toLowerCase()) ||
                              (t.staffId &&
                                t.staffId
                                  .toLowerCase()
                                  .includes(teacherSearch.toLowerCase())),
                          )
                          .map((t) => (
                            <button
                              key={t.id}
                              type="button"
                              className="w-full text-left px-3 py-2 text-sm hover:bg-cta/10 hover:text-cta transition-colors flex items-center justify-between"
                              onClick={() => {
                                setUserFormData((prev) => ({
                                  ...prev,
                                  fullName: t.name,
                                  linkedStaffId: t.id,
                                }));
                                setShowTeacherDropdown(false);
                                setTeacherSearch("");
                              }}
                            >
                              <div className="flex flex-col">
                                <span className="font-medium">{t.name}</span>
                                {t.staffId && (
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    {t.staffId}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-400">
                                {t.subject || t.role || ""}
                              </span>
                            </button>
                          ))}
                        {staffTeachers.filter(
                          (t) =>
                            !teacherSearch ||
                            t.name
                              .toLowerCase()
                              .includes(teacherSearch.toLowerCase()) ||
                            (t.staffId &&
                              t.staffId
                                .toLowerCase()
                                .includes(teacherSearch.toLowerCase())),
                        ).length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-400">
                            No teachers found
                          </div>
                        )}
                      </div>
                    )}
                    {userFormData.linkedStaffId &&
                      userFormData.fullName &&
                      !showTeacherDropdown && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2">
                          <span className="text-[10px] bg-teal/10 text-teal px-1.5 py-0.5 rounded font-medium">
                            Linked
                          </span>
                        </div>
                      )}
                  </div>
                ) : (
                  <input
                    type="text"
                    value={userFormData.fullName}
                    onChange={(e) =>
                      setUserFormData((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
                    placeholder="e.g. Jatin Sharma"
                  />
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Email
                </label>
                <input
                  type="email"
                  value={userFormData.email}
                  onChange={(e) =>
                    setUserFormData((prev) => ({
                      ...prev,
                      email: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
                  placeholder="e.g. jatin@school.com"
                />
              </div>

              {userFormData.role === "Teacher" && (
                <div className="flex flex-col gap-1 mt-2">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide flex justify-between">
                    <span>Assigned Classes</span>
                    <span className="text-teal text-[10px]">
                      {userFormData.assignedClasses.length} selected
                    </span>
                  </label>
                  <div className="flex flex-wrap gap-2 mt-1 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50 custom-scrollbar">
                    {ALL_CLASSES.map((cls) => {
                      const isSelected =
                        userFormData.assignedClasses.includes(cls);
                      return (
                        <button
                          key={cls}
                          onClick={() =>
                            setUserFormData((prev) => ({
                              ...prev,
                              assignedClasses: isSelected
                                ? prev.assignedClasses.filter((c) => c !== cls)
                                : [...prev.assignedClasses, cls],
                            }))
                          }
                          className={`px-2 py-1 text-xs rounded-md border font-medium transition-colors ${
                            isSelected
                              ? "bg-teal border-teal text-white"
                              : "bg-white border-gray-200 text-gray-600 hover:border-teal"
                          }`}
                        >
                          {cls}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 bg-white shrink-0">
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setShowUserPassword(false);
                }}
                className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveUser}
                className="px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark"
              >
                {editingUserId ? "Update User" : "Save User"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Verification Modal for Academic Year changes */}
      {passwordModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-sm">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h3 className="font-brand text-navy text-base font-bold">
                Principal Verification
              </h3>
              <button
                onClick={() =>
                  setPasswordModal({
                    isOpen: false,
                    targetAction: null,
                    password: "",
                  })
                }
                className="text-gray-400 hover:text-gray-600 rounded-full p-1 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-5">
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Please enter your password to authorize this highly sensitive
                action. Only the Principal can verify.
              </p>
              <div className="relative">
                <input
                  type={showVerifyPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={passwordModal.password}
                  onChange={(e) =>
                    setPasswordModal((p) => ({
                      ...p,
                      password: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta pr-10"
                  autoFocus
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-cta p-1 rounded"
                  onClick={() => setShowVerifyPassword(!showVerifyPassword)}
                >
                  {showVerifyPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
              <button
                disabled={savingAcYear}
                onClick={async () => {
                  if (!passwordModal.password) {
                    showToast("error", "Please enter password");
                    return;
                  }
                  setSavingAcYear(true);
                  try {
                    if (passwordModal.targetAction === "SAVE_YEAR") {
                      await api.settings.upsert(
                        "academicYear",
                        academicYear,
                        passwordModal.password,
                      );
                      showToast("success", "Academic year saved");
                    } else if (passwordModal.targetAction === "ROLLOVER") {
                      const res = await api.settings.rollover(
                        passwordModal.targetYear,
                        passwordModal.password,
                      );
                      const d = res?.data;
                      showToast(
                        "success",
                        `Rollover done! ${d?.promoted || 0} promoted, ${d?.graduated || 0} graduated. Year: ${passwordModal.targetYear}`,
                      );
                      setAcademicYear(passwordModal.targetYear);
                    }
                    setPasswordModal({
                      isOpen: false,
                      targetAction: null,
                      password: "",
                    });
                  } catch (err) {
                    showToast(
                      "error",
                      err?.data?.message ||
                        err?.message ||
                        "Verification failed",
                    );
                  } finally {
                    setSavingAcYear(false);
                  }
                }}
                className="w-full mt-5 px-4 py-2.5 bg-red-500 text-white rounded-lg text-sm font-bold hover:bg-red-600 transition-colors disabled:opacity-50 tracking-wider shadow-sm"
              >
                {savingAcYear ? "VERIFYING..." : "VERIFY & PROCEED"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
