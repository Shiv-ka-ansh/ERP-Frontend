import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Shield,
  Search,
  Filter,
  Download,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  Edit,
  Trash2,
  Plus,
  Eye,
  Bell,
  BellOff,
  RefreshCw,
  User,
  Clock,
  Monitor,
  Smartphone,
  Globe,
  FileText,
  X,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";
import CustomSelect from "../components/ui/CustomSelect";
import CustomDatePicker from "../components/ui/CustomDatePicker";
import { api } from "../api/client";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const MODULE_COLORS = {
  Login: "bg-blue-100 text-blue-700",
  Student: "bg-purple-100 text-purple-700",
  Fee: "bg-green-100 text-green-700",
  Attendance: "bg-orange-100 text-orange-700",
  Salary: "bg-yellow-100 text-yellow-700",
  Exam: "bg-pink-100 text-pink-700",
  SMS: "bg-cyan-100 text-cyan-700",
  Settings: "bg-gray-100 text-gray-700",
  System: "bg-red-100 text-red-700",
};

const ACTION_ICONS = {
  LOGIN: LogIn,
  LOGOUT: LogOut,
  LOGIN_FAILED: XCircle,
  CREATE: Plus,
  EDIT: Edit,
  DELETE: Trash2,
  VIEW: Eye,
  EXPORT: Download,
  BULK: RefreshCw,
};

const HIGH_RISK_ACTIONS = ["LOGIN_FAILED", "DELETE", "EXPORT", "BULK"];

function getRiskLevel(action, module) {
  if (action === "DELETE" || action === "LOGIN_FAILED") return "high";
  if (action === "EXPORT" || action === "BULK") return "high";
  if (action === "EDIT" && (module === "Fee" || module === "Exam"))
    return "medium";
  return "low";
}

function formatDateTime(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

// Seeded demo audit logs (realistic demo data)
const DEMO_LOGS = [
  {
    id: 1,
    timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    user: "Mrs. Poonam Sharma",
    role: "Principal",
    module: "Login",
    action: "LOGIN",
    description: "Successful login",
    ip: "192.168.1.5",
    device: "Desktop",
    browser: "Chrome 122",
    oldValue: null,
    newValue: null,
    risk: "low",
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    user: "Rahul Gupta",
    role: "Admin",
    module: "Fee",
    action: "DELETE",
    description:
      "Fee record deleted — Aarav Sharma, ₹1,500 (Receipt #RCP-2024-0412)",
    ip: "192.168.1.8",
    device: "Desktop",
    browser: "Edge 121",
    oldValue: { amount: 1500, receiptNo: "RCP-2024-0412", date: "2024-11-12" },
    newValue: null,
    risk: "high",
  },
  {
    id: 3,
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    user: "Unknown",
    role: "—",
    module: "Login",
    action: "LOGIN_FAILED",
    description: "Failed login attempt — username: rahul@school",
    ip: "103.21.58.4",
    device: "Mobile",
    browser: "Safari 17",
    oldValue: null,
    newValue: null,
    risk: "high",
  },
  {
    id: 4,
    timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    user: "Rahul Gupta",
    role: "Admin",
    module: "Student",
    action: "EDIT",
    description: "Student profile updated — Diya Patel (Roll 102)",
    ip: "192.168.1.8",
    device: "Desktop",
    browser: "Edge 121",
    oldValue: { phone: "9800000002", parentName: "Ramesh Patel" },
    newValue: { phone: "9811111111", parentName: "Rajesh Patel" },
    risk: "low",
  },
  {
    id: 5,
    timestamp: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    user: "Sunita Verma",
    role: "Teacher",
    module: "Exam",
    action: "EDIT",
    description:
      "Marks edited after initial entry — Arjun Nair, Science Mid-Term",
    ip: "192.168.1.15",
    device: "Desktop",
    browser: "Chrome 122",
    oldValue: { marks: 45 },
    newValue: { marks: 52 },
    risk: "medium",
  },
  {
    id: 6,
    timestamp: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    user: "Rahul Gupta",
    role: "Admin",
    module: "Fee",
    action: "CREATE",
    description:
      "Fee collected — Kabir Das (Roll 105), ₹2,600 (Receipt #RCP-2025-0891)",
    ip: "192.168.1.8",
    device: "Desktop",
    browser: "Edge 121",
    oldValue: null,
    newValue: { amount: 2600, receiptNo: "RCP-2025-0891", mode: "UPI" },
    risk: "low",
  },
  {
    id: 7,
    timestamp: new Date(Date.now() - 70 * 60 * 1000).toISOString(),
    user: "Rahul Gupta",
    role: "Admin",
    module: "Student",
    action: "CREATE",
    description: "New student admission — Priya Sharma, Class 3-A",
    ip: "192.168.1.8",
    device: "Desktop",
    browser: "Edge 121",
    oldValue: null,
    newValue: {
      name: "Priya Sharma",
      className: "Class 3",
      section: "A",
      roll: "113",
    },
    risk: "low",
  },
  {
    id: 8,
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    user: "Unknown",
    role: "—",
    module: "Login",
    action: "LOGIN_FAILED",
    description: "Failed login attempt — username: admin",
    ip: "103.21.58.4",
    device: "Mobile",
    browser: "Chrome Mobile",
    oldValue: null,
    newValue: null,
    risk: "high",
  },
  {
    id: 9,
    timestamp: new Date(Date.now() - 100 * 60 * 1000).toISOString(),
    user: "Unknown",
    role: "—",
    module: "Login",
    action: "LOGIN_FAILED",
    description: "Failed login attempt — username: admin",
    ip: "103.21.58.4",
    device: "Mobile",
    browser: "Chrome Mobile",
    oldValue: null,
    newValue: null,
    risk: "high",
  },
  {
    id: 10,
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    user: "Unknown",
    role: "—",
    module: "Login",
    action: "LOGIN_FAILED",
    description: "Failed login attempt — username: admin",
    ip: "103.21.58.4",
    device: "Mobile",
    browser: "Chrome Mobile",
    oldValue: null,
    newValue: null,
    risk: "high",
  },
  {
    id: 11,
    timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    user: "Mrs. Poonam Sharma",
    role: "Principal",
    module: "Settings",
    action: "EDIT",
    description: "Academic year changed",
    ip: "192.168.1.5",
    device: "Desktop",
    browser: "Chrome 122",
    oldValue: { academicYear: "2024-25" },
    newValue: { academicYear: "2026-27" },
    risk: "medium",
  },
  {
    id: 12,
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    user: "Rahul Gupta",
    role: "Admin",
    module: "Salary",
    action: "CREATE",
    description: "Salary marked paid — Rajesh Kumar, March 2025, ₹31,000",
    ip: "192.168.1.8",
    device: "Desktop",
    browser: "Edge 121",
    oldValue: null,
    newValue: { teacher: "Rajesh Kumar", month: "March 2025", amount: 31000 },
    risk: "low",
  },
  {
    id: 13,
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    user: "Mrs. Poonam Sharma",
    role: "Principal",
    module: "Student",
    action: "EXPORT",
    description: "Bulk student data exported (112 records)",
    ip: "192.168.1.5",
    device: "Desktop",
    browser: "Chrome 122",
    oldValue: null,
    newValue: null,
    risk: "high",
  },
  {
    id: 14,
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    user: "Rahul Gupta",
    role: "Admin",
    module: "Attendance",
    action: "EDIT",
    description: "Attendance edited after save — Class 8-C, 2025-03-10",
    ip: "192.168.1.8",
    device: "Desktop",
    browser: "Edge 121",
    oldValue: { present: 28 },
    newValue: { present: 30 },
    risk: "medium",
  },
  {
    id: 15,
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    user: "Admin",
    role: "Admin",
    module: "SMS",
    action: "CREATE",
    description: "Bulk SMS sent — Fee Reminder, 48 parents, Cost: ₹14.40",
    ip: "192.168.1.8",
    device: "Desktop",
    browser: "Edge 121",
    oldValue: null,
    newValue: {
      type: "Fee Reminder",
      count: 48,
      cost: "₹14.40",
      preview: "Dear parent, fee due for...",
    },
    risk: "low",
  },
  {
    id: 16,
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    user: "Mrs. Poonam Sharma",
    role: "Principal",
    module: "Login",
    action: "LOGOUT",
    description: "User logged out",
    ip: "192.168.1.5",
    device: "Desktop",
    browser: "Chrome 122",
    oldValue: null,
    newValue: null,
    risk: "low",
  },
  {
    id: 17,
    timestamp: new Date(Date.now() - 24.5 * 60 * 60 * 1000).toISOString(),
    user: "Rahul Gupta",
    role: "Admin",
    module: "Fee",
    action: "EDIT",
    description: "Fee structure updated — Class 8, Tuition Fee",
    ip: "192.168.1.8",
    device: "Desktop",
    browser: "Edge 121",
    oldValue: { className: "Class 8", feeHead: "Tuition", amount: 1700 },
    newValue: { className: "Class 8", feeHead: "Tuition", amount: 1800 },
    risk: "medium",
  },
  {
    id: 18,
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    user: "Rahul Gupta",
    role: "Admin",
    module: "Settings",
    action: "CREATE",
    description: "New user account created — sunita.teacher",
    ip: "192.168.1.8",
    device: "Desktop",
    browser: "Edge 121",
    oldValue: null,
    newValue: { username: "sunita.teacher", role: "Teacher" },
    risk: "low",
  },
  {
    id: 19,
    timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    user: "Rahul Gupta",
    role: "Admin",
    module: "Student",
    action: "BULK",
    description: "Bulk promotion — 112 students promoted to next class",
    ip: "192.168.1.8",
    device: "Desktop",
    browser: "Edge 121",
    oldValue: null,
    newValue: null,
    risk: "high",
  },
  {
    id: 20,
    timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    user: "Sunita Verma",
    role: "Teacher",
    module: "Exam",
    action: "CREATE",
    description: "Marks entered — Science Mid-Term, Class 9-B (35 students)",
    ip: "192.168.1.15",
    device: "Desktop",
    browser: "Chrome 122",
    oldValue: null,
    newValue: null,
    risk: "low",
  },
];

// Derive high-risk alerts
function getAlerts(logs) {
  const failedLogins = logs.filter((l) => l.action === "LOGIN_FAILED");
  const alerts = [];

  // Group failed logins by IP
  const ipGroups = {};
  failedLogins.forEach((l) => {
    if (!ipGroups[l.ip]) ipGroups[l.ip] = [];
    ipGroups[l.ip].push(l);
  });
  Object.entries(ipGroups).forEach(([ip, entries]) => {
    if (entries.length >= 3) {
      alerts.push({
        id: `fail-${ip}`,
        type: "danger",
        title: "Multiple Failed Login Attempts",
        message: `${entries.length} failed login attempts from IP ${ip}`,
        time: entries[0].timestamp,
      });
    }
  });

  logs
    .filter((l) => l.action === "DELETE" && l.module === "Fee")
    .forEach((l) => {
      alerts.push({
        id: `fee-del-${l.id}`,
        type: "danger",
        title: "Fee Record Deleted",
        message: l.description,
        time: l.timestamp,
      });
    });

  logs
    .filter((l) => l.action === "EDIT" && l.module === "Exam")
    .forEach((l) => {
      alerts.push({
        id: `marks-edit-${l.id}`,
        type: "warning",
        title: "Marks Edited After Entry",
        message: l.description,
        time: l.timestamp,
      });
    });

  logs
    .filter((l) => l.action === "EXPORT" || l.action === "BULK")
    .forEach((l) => {
      alerts.push({
        id: `bulk-${l.id}`,
        type: "warning",
        title: l.action === "EXPORT" ? "Bulk Data Export" : "Bulk Operation",
        message: l.description,
        time: l.timestamp,
      });
    });

  return alerts;
}

// ─── Diff Viewer ──────────────────────────────────────────────────────────────

function DiffViewer({ oldValue, newValue }) {
  if (!oldValue && !newValue)
    return (
      <p className="text-sm text-gray-400 italic">
        No field-level data recorded.
      </p>
    );

  const allKeys = new Set([
    ...Object.keys(oldValue || {}),
    ...Object.keys(newValue || {}),
  ]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-50">
            <th className="text-left p-2 border border-gray-200 text-gray-500 font-medium w-32">
              Field
            </th>
            <th className="text-left p-2 border border-gray-200 text-red-600 font-medium">
              Before
            </th>
            <th className="text-left p-2 border border-gray-200 text-green-600 font-medium">
              After
            </th>
          </tr>
        </thead>
        <tbody>
          {[...allKeys].map((key) => {
            const before = oldValue?.[key];
            const after = newValue?.[key];
            const changed = before !== after;
            return (
              <tr key={key} className={changed ? "bg-yellow-50" : ""}>
                <td className="p-2 border border-gray-200 font-mono text-xs text-gray-600">
                  {key}
                </td>
                <td className="p-2 border border-gray-200 font-mono text-xs text-red-700 bg-red-50">
                  {before !== undefined ? (
                    String(before)
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="p-2 border border-gray-200 font-mono text-xs text-green-700 bg-green-50">
                  {after !== undefined ? (
                    String(after)
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Log Row ──────────────────────────────────────────────────────────────────

function LogRow({ log, isExpanded, onToggle }) {
  const ActionIcon = ACTION_ICONS[log.action] || Eye;
  const hasChanges = log.oldValue || log.newValue;

  const riskClass = {
    high: "border-l-4 border-red-400",
    medium: "border-l-4 border-yellow-400",
    low: "border-l-4 border-transparent",
  }[log.risk];

  const actionBadge =
    {
      LOGIN: "bg-blue-100 text-blue-700",
      LOGOUT: "bg-gray-100 text-gray-600",
      LOGIN_FAILED: "bg-red-100 text-red-700",
      CREATE: "bg-green-100 text-green-700",
      EDIT: "bg-yellow-100 text-yellow-800",
      DELETE: "bg-red-100 text-red-700",
      VIEW: "bg-purple-100 text-purple-700",
      EXPORT: "bg-orange-100 text-orange-700",
      BULK: "bg-pink-100 text-pink-700",
    }[log.action] || "bg-gray-100 text-gray-600";

  return (
    <>
      <tr
        className={`hover:bg-gray-50 transition-colors ${riskClass} ${hasChanges ? "cursor-pointer" : ""}`}
        onClick={hasChanges ? onToggle : undefined}
      >
        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap font-mono">
          {formatDateTime(log.timestamp)}
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-navy/10 flex items-center justify-center text-navy shrink-0">
              <User size={13} />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">{log.user}</p>
              <p className="text-xs text-gray-400">{log.role}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${MODULE_COLORS[log.module] || "bg-gray-100 text-gray-600"}`}
          >
            {log.module}
          </span>
        </td>
        <td className="px-4 py-3">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-semibold ${actionBadge}`}
          >
            <ActionIcon size={11} />
            {log.action}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600 max-w-xs">
          <p className="truncate">{log.description}</p>
        </td>
        <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
          <div className="flex items-center gap-1">
            <Globe size={11} />
            {log.ip}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            {log.device === "Mobile" ? (
              <Smartphone size={11} />
            ) : (
              <Monitor size={11} />
            )}
            {log.browser}
          </div>
        </td>
        <td className="px-4 py-3 text-center">
          {log.risk === "high" && (
            <span
              className="inline-block size-2 rounded-full bg-red-500"
              title="High Risk"
            />
          )}
          {log.risk === "medium" && (
            <span
              className="inline-block size-2 rounded-full bg-yellow-400"
              title="Medium Risk"
            />
          )}
          {log.risk === "low" && (
            <span
              className="inline-block size-2 rounded-full bg-green-400"
              title="Low Risk"
            />
          )}
        </td>
        <td className="px-4 py-3 text-center">
          {hasChanges && (
            <button className="text-gray-400 hover:text-navy transition-colors">
              {isExpanded ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
            </button>
          )}
        </td>
      </tr>
      {isExpanded && hasChanges && (
        <tr className="bg-blue-50/30">
          <td colSpan={8} className="px-6 py-4 border-b border-blue-100">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Change Detail — Field-Level Diff
              </p>
              <DiffViewer oldValue={log.oldValue} newValue={log.newValue} />
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AuditTrail() {
  const navigate = useNavigate();
  const { currentUser } = useAppContext();

  // Logs state (demo data merged with any db records)
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedRows, setExpandedRows] = useState(new Set());
  const [showAlerts, setShowAlerts] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  // Filters
  const [search, setSearch] = useState("");
  const [filterModule, setFilterModule] = useState("All");
  const [filterAction, setFilterAction] = useState("All");
  const [filterRisk, setFilterRisk] = useState("All");
  const [filterUser, setFilterUser] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // Load audit logs from backend on mount
  useEffect(() => {
    setLoading(true);
    const normalizeAuditLog = (l) => ({
      id: l._id || l.id,
      timestamp: l.timestamp || l.createdAt,
      user: l.username || l.user || "Unknown",
      role: l.role || l.userRole || "—",
      module: l.module || l.moduleName || "System",
      action: l.action || "UNKNOWN",
      description: l.actionDescription || l.description || "",
      ip: l.ipAddress || l.ip || "",
      device: "",
      browser: "",
      oldValue: null,
      newValue: null,
      risk: String(l.riskLevel || l.risk || "LOW").toLowerCase(),
    });

    api.audit
      .list({ page: 1, limit: 200 })
      .then((res) => {
        const backendLogs = (res?.data || []).map(normalizeAuditLog);
        return setLogs(backendLogs);
      })
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, []);

  // Derived data
  const alerts = useMemo(() => getAlerts(logs), [logs]);
  const activeAlerts = alerts.filter((a) => !dismissedAlerts.has(a.id));

  const modules = [
    "All",
    ...new Set(logs.map((l) => l.module).filter(Boolean)),
  ];
  const actions = [
    "All",
    ...new Set(logs.map((l) => l.action).filter(Boolean)),
  ];
  const users = [
    "All",
    ...new Set(logs.map((l) => l.user).filter((u) => u && u !== "Unknown")),
  ];

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (filterModule !== "All" && log.module !== filterModule) return false;
      if (filterAction !== "All" && log.action !== filterAction) return false;
      if (filterRisk !== "All" && log.risk !== filterRisk) return false;
      if (filterUser !== "All" && log.user !== filterUser) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !log.description?.toLowerCase().includes(q) &&
          !log.user?.toLowerCase().includes(q) &&
          !log.ip?.toLowerCase().includes(q)
        )
          return false;
      }
      if (dateFrom && new Date(log.timestamp) < new Date(dateFrom))
        return false;
      if (dateTo) {
        const end = new Date(dateTo);
        end.setHours(23, 59, 59, 999);
        if (new Date(log.timestamp) > end) return false;
      }
      return true;
    });
  }, [
    logs,
    filterModule,
    filterAction,
    filterRisk,
    filterUser,
    search,
    dateFrom,
    dateTo,
  ]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayLogs = logs.filter((l) => new Date(l.timestamp) >= today);
    return {
      total: logs.length,
      todayCount: todayLogs.length,
      highRisk: logs.filter((l) => l.risk === "high").length,
      failedLogins: logs.filter(
        (l) =>
          l.action === "LOGIN_FAILED" ||
          (l.action === "LOGIN" && l.risk === "high"),
      ).length,
    };
  }, [logs]);

  // Export
  const handleExport = () => {
    const headers = [
      "Timestamp",
      "User",
      "Role",
      "Module",
      "Action",
      "Description",
      "IP",
      "Device",
      "Browser",
      "Risk",
    ];
    const rows = filteredLogs.map((l) => [
      formatDateTime(l.timestamp),
      l.user,
      l.role,
      l.module,
      l.action,
      l.description,
      l.ip,
      l.device,
      l.browser,
      l.risk,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${v ?? ""}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `School_Audit_Log_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleRow = (id) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const resetFilters = () => {
    setSearch("");
    setFilterModule("All");
    setFilterAction("All");
    setFilterRisk("All");
    setFilterUser("All");
    setDateFrom("");
    setDateTo("");
  };

  return (
    <div className="p-6 space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m12 19-7-7 7-7" />
          <path d="M19 12H5" />
        </svg>{" "}
        Back
      </button>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-navy text-white">
            <Shield size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-navy">Audit Trail</h1>
            <p className="text-sm text-gray-500">
              Complete activity log — who did what and when
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAlerts((p) => !p)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${showAlerts ? "bg-red-50 border-red-200 text-red-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            {showAlerts ? <Bell size={15} /> : <BellOff size={15} />}
            Alerts
            {activeAlerts.length > 0 && (
              <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                {activeAlerts.length}
              </span>
            )}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-3 py-2 bg-navy text-white rounded-lg text-sm font-medium hover:bg-navy/90 transition-colors"
          >
            <Download size={15} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Alert Notifications (AU-10) */}
      {showAlerts && activeAlerts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle size={13} className="text-red-500" />
            High-Risk Alerts ({activeAlerts.length})
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`flex items-start gap-3 p-3 rounded-xl border text-sm ${
                  alert.type === "danger"
                    ? "bg-red-50 border-red-200"
                    : "bg-yellow-50 border-yellow-200"
                }`}
              >
                <AlertTriangle
                  size={16}
                  className={`shrink-0 mt-0.5 ${alert.type === "danger" ? "text-red-500" : "text-yellow-600"}`}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`font-semibold ${alert.type === "danger" ? "text-red-700" : "text-yellow-800"}`}
                  >
                    {alert.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">
                    {alert.message}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {formatDateTime(alert.time)}
                  </p>
                </div>
                <button
                  onClick={() =>
                    setDismissedAlerts((p) => new Set([...p, alert.id]))
                  }
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: "Total Events",
            value: stats.total,
            icon: FileText,
            color: "text-navy",
            bg: "bg-navy/10",
          },
          {
            label: "Today's Activity",
            value: stats.todayCount,
            icon: Clock,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "High-Risk Events",
            value: stats.highRisk,
            icon: AlertTriangle,
            color: "text-red-600",
            bg: "bg-red-50",
          },
          {
            label: "Failed Logins",
            value: stats.failedLogins,
            icon: XCircle,
            color: "text-orange-600",
            bg: "bg-orange-50",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
              <div className={`p-1.5 rounded-lg ${s.bg}`}>
                <s.icon size={14} className={s.color} />
              </div>
            </div>
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters (AU-09) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Filter size={15} className="text-gray-400" />
          <span className="text-sm font-semibold text-gray-700">Filters</span>
          <button
            onClick={resetFilters}
            className="ml-auto text-xs text-cta hover:underline"
          >
            Reset all
          </button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 z-20 relative">
          {/* Search */}
          <div className="col-span-2 relative">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search description, user, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy"
            />
          </div>
          {/* Module */}
          <div className="min-w-0">
            <CustomSelect
              value={filterModule}
              onChange={setFilterModule}
              options={modules}
            />
          </div>
          {/* Action */}
          <div className="min-w-0">
            <CustomSelect
              value={filterAction}
              onChange={setFilterAction}
              options={actions}
            />
          </div>
          {/* Risk */}
          <div className="min-w-0">
            <CustomSelect
              value={filterRisk}
              onChange={setFilterRisk}
              options={["All", "high", "medium", "low"]}
            />
          </div>
          {/* User */}
          <div className="min-w-0">
            <CustomSelect
              value={filterUser}
              onChange={setFilterUser}
              options={users}
            />
          </div>
          {/* Date From */}
          <div className="flex items-center gap-1 min-w-0">
            <label className="text-xs text-gray-400 shrink-0">From</label>
            <div className="flex-1">
              <CustomDatePicker
                selected={dateFrom ? new Date(dateFrom) : null}
                onChange={(date) => {
                  if (date) {
                    const offsetDate = new Date(
                      date.getTime() - date.getTimezoneOffset() * 60000,
                    );
                    setDateFrom(offsetDate.toISOString().split("T")[0]);
                  } else {
                    setDateFrom("");
                  }
                }}
              />
            </div>
          </div>
          {/* Date To */}
          <div className="flex items-center gap-1 min-w-0">
            <label className="text-xs text-gray-400 shrink-0">To</label>
            <div className="flex-1">
              <CustomDatePicker
                selected={dateTo ? new Date(dateTo) : null}
                onChange={(date) => {
                  if (date) {
                    const offsetDate = new Date(
                      date.getTime() - date.getTimezoneOffset() * 60000,
                    );
                    setDateTo(offsetDate.toISOString().split("T")[0]);
                  } else {
                    setDateTo("");
                  }
                }}
              />
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Showing{" "}
          <span className="font-semibold text-gray-700">
            {filteredLogs.length}
          </span>{" "}
          of {logs.length} events
        </p>
      </div>

      {/* Log Table (AU-09) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {[
                  "Timestamp",
                  "User",
                  "Module",
                  "Action",
                  "Description",
                  "IP / Browser",
                  "Risk",
                  "",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <RefreshCw
                      size={20}
                      className="animate-spin mx-auto mb-2"
                    />
                    Loading audit logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-gray-400">
                    <Shield size={36} className="mx-auto mb-3 text-gray-200" />
                    <p className="font-medium">No events match your filters</p>
                    <button
                      onClick={resetFilters}
                      className="mt-2 text-sm text-cta hover:underline"
                    >
                      Reset filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <LogRow
                    key={log.id}
                    log={log}
                    isExpanded={expandedRows.has(log.id)}
                    onToggle={() => toggleRow(log.id)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        {filteredLogs.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              Click any row with a ▶ icon to expand field-level diff
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-red-500 inline-block" />{" "}
                High Risk
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-yellow-400 inline-block" />{" "}
                Medium
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-full bg-green-400 inline-block" />{" "}
                Low
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Module Coverage
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(MODULE_COLORS).map(([mod, cls]) => (
            <span
              key={mod}
              className={`px-3 py-1 rounded-full text-xs font-medium ${cls}`}
            >
              {mod}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">
          AU-01 Login · AU-02 Students · AU-03 Fees · AU-04 Attendance · AU-05
          Salary · AU-06 Exams · AU-07 SMS · AU-08 Settings
        </p>
      </div>
    </div>
  );
}
