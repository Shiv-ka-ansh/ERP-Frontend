import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Edit2,
  FileText,
  AlertCircle,
  Phone,
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Printer,
} from "lucide-react";
import { api } from "../api/client";
import { useAppContext } from "../context/AppContext";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const STATUS_CFG = {
  P: {
    label: "Present",
    cls: "bg-emerald-50 text-emerald-600 border-emerald-200",
    dot: "bg-emerald-500",
  },
  A: {
    label: "Absent",
    cls: "bg-red-50 text-red-500 border-red-200",
    dot: "bg-red-500",
  },
  H: {
    label: "Half Day",
    cls: "bg-amber-50 text-amber-600 border-amber-200",
    dot: "bg-amber-400",
  },
  L: {
    label: "Leave",
    cls: "bg-blue-50 text-blue-600 border-blue-200",
    dot: "bg-blue-400",
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

export default function StudentProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast, showConfirm, schoolInfo } = useAppContext();
  const [activeTab, setActiveTab] = useState("Overview");
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAppContext();
  const [feeHistory, setFeeHistory] = useState([]);
  const [results, setResults] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [receiptData, setReceiptData] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [deletingFeeId, setDeletingFeeId] = useState(null);

  const today = new Date();
  const [attYear, setAttYear] = useState(today.getFullYear());
  const [attMonth, setAttMonth] = useState(today.getMonth());

  const tabs = ["Overview", "Fee History", "Exams", "Attendance"];
  if (currentUser?.role !== "Teacher") tabs.push("TC");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.students.byId(id);
        const s = res?.data || res;
        setStudent(s);
      } catch {
        showToast("error", "Failed to load student");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (activeTab === "Fee History") {
      api.fees
        .collections()
        .then((res) => {
          const all = res?.data || [];
          return setFeeHistory(
            all.filter((f) => String(f.studentId) === String(id)),
          );
        })
        .catch(() => {});
    }
    if (activeTab === "Exams") {
      api.exams
        .reportCard(id)
        .then((res) => setResults(res?.data?.results || []))
        .catch(() => {});
    }
    if (activeTab === "Attendance") {
      const loadAtt = async () => {
        try {
          const res = await api.attendance.report({
            month: attMonth + 1,
            year: attYear,
            type: "student",
            staffId: id, // API might use staffId key for any ID in report endpoint if not studentId
          });
          // Usually individual report returns records for that student
          setAttendanceRecords(res?.data || []);
        } catch {
          setAttendanceRecords([]);
        }
      };
      loadAtt();
    }
  }, [activeTab, id, attMonth, attYear]);
  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-400">
        Loading...
      </div>
    );
  if (!student)
    return <div className="p-6 text-red-500">Student not found</div>;

  const fullName =
    `${student.firstName || ""} ${student.lastName || ""}`.trim();
  const initials = (
    (student.firstName?.[0] || "") + (student.lastName?.[0] || "")
  ).toUpperCase();

  return (
    <div className="min-h-screen">
      {/* BACK BUTTON */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-4 transition-colors"
      >
        <ArrowLeft size={16} /> Back
      </button>

      {/* PROFILE HEADER */}
      <div className="bg-white rounded-xl shadow-card p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              {student.photoUrl ? (
                <img
                  src={student.photoUrl}
                  alt={fullName}
                  className="size-20 rounded-2xl object-cover"
                />
              ) : (
                <div className="size-20 rounded-2xl bg-teal/10 text-teal flex items-center justify-center text-2xl font-bold">
                  {initials}
                </div>
              )}
            </div>
            <div>
              <h1 className="font-brand font-bold text-lg text-navy">
                {fullName}
              </h1>
              <p className="text-sm text-gray-400">
                {student.currentClass}
                {student.section ? `-${student.section}` : ""} | Roll:{" "}
                {student.rollNumber || "—"}
              </p>
              <p className="font-mono text-teal text-sm mt-1">
                {student.studentId || student.admissionNumber}
              </p>
              <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                Father: {student.fatherName || "—"} |{" "}
                <Phone size={14} className="text-gray-400" />{" "}
                {student.primaryContactPhone || "—"}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start lg:items-end gap-3 mt-4 lg:mt-0 w-full lg:w-auto">
            <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
              {currentUser?.role !== "Teacher" && (
                <>
                  <button
                    onClick={() => navigate(`/students/${id}/edit`)}
                    className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                  >
                    <Edit2 size={16} /> Edit Student
                  </button>
                  <button
                    onClick={() => navigate(`/students/${id}/tc`)}
                    className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors"
                  >
                    <FileText size={16} /> Generate TC
                  </button>
                </>
              )}
            </div>
            {(student.totalFeesDue || 0) > 0 && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cta/10 text-cta text-xs font-medium rounded-full">
                <AlertCircle size={14} /> Due ₹
                {(student.totalFeesDue || 0).toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${activeTab === tab ? "bg-navy text-white" : "text-gray-500 hover:bg-gray-100"}`}
            onClick={() =>
              tab === "TC" ? navigate(`/students/${id}/tc`) : setActiveTab(tab)
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {activeTab === "Overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="font-brand font-semibold text-navy mb-4">
              Personal Details
            </h3>
            <dl className="flex flex-col gap-3 text-sm">
              {[
                ["Full Name", fullName],
                [
                  "Date of Birth",
                  student.dateOfBirth
                    ? new Date(student.dateOfBirth).toLocaleDateString("en-IN")
                    : "—",
                ],
                ["Age", student.age ? `${student.age} Years` : "—"],
                ["Gender", student.gender || "—"],
                ["Blood Group", student.bloodGroup || "—"],
                ["Admission No.", student.admissionNumber || "—"],
                ["Student ID", student.studentId || "—"],
                ["Student PEN", student.studentPEN || "—"],
                ["Aadhar Number", student.aadharNumber || "—"],
                [
                  "Social Category",
                  student.socialCategory && student.socialCategory !== "NA"
                    ? student.socialCategory
                    : "—",
                ],
                [
                  "Minority Group",
                  student.minorityGroup && student.minorityGroup !== "NA"
                    ? student.minorityGroup
                    : "—",
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <dt className="text-gray-400 w-32 shrink-0">{label}</dt>
                  <dd className="text-navy font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="bg-white rounded-xl shadow-card p-6">
            <h3 className="font-brand font-semibold text-navy mb-4">
              Contact & Family
            </h3>
            <dl className="flex flex-col gap-3 text-sm">
              {[
                ["Father", student.fatherName || "—"],
                ["Mother", student.motherName || "—"],
                ["Phone", student.primaryContactPhone || "—"],
                [
                  "Address",
                  typeof student.address === "object"
                    ? `${student.address.street || student.address.fullAddress || ""}${student.address.city ? `, ${student.address.city}` : ""}` ||
                      "—"
                    : student.address || "—",
                ],
                [
                  "Fee Status",
                  (student.totalFeesDue || 0) > 0
                    ? `Due ₹${student.totalFeesDue}`
                    : "Cleared",
                ],
              ].map(([label, value]) => (
                <div key={label} className="flex gap-2">
                  <dt className="text-gray-400 w-32 shrink-0">{label}</dt>
                  <dd className="text-navy font-medium">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      )}

      {activeTab === "Fee History" && (
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="font-brand font-semibold text-navy mb-4">
            Fee Payment History
          </h3>
          {feeHistory.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              No fee records found.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {[
                      "Receipt No",
                      "Date",
                      "Amount",
                      "Mode",
                      "Discount",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className={`px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide ${h === "Actions" ? "text-right" : "text-left"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {feeHistory.map((f) => (
                    <tr
                      key={f._id}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-mono text-teal">
                        {f.receiptNo}
                      </td>
                      <td className="px-4 py-3">
                        {new Date(f.date || f.createdAt).toLocaleDateString(
                          "en-IN",
                        )}
                      </td>
                      <td className="px-4 py-3 font-bold text-navy">
                        ₹{(f.amount || 0).toLocaleString()}
                        {f.grossAmount && f.grossAmount !== f.amount && (
                          <span className="text-xs text-gray-400 line-through ml-1">
                            ₹{f.grossAmount.toLocaleString()}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">
                          {f.mode || "CASH"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-emerald-600 font-medium">
                        {f.discountAmount && f.discountAmount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-semibold">
                            -₹{f.discountAmount.toLocaleString()}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          {/* Print Old Receipt */}
                          <button
                            title="Print Receipt"
                            className="p-1.5 rounded-lg hover:bg-teal/10 text-gray-400 hover:text-teal transition-colors"
                            onClick={() => {
                              setReceiptData(f);
                              setShowReceiptModal(true);
                            }}
                          >
                            <Printer size={15} />
                          </button>
                          {/* Delete Fee Entry */}
                          {currentUser?.role !== "Teacher" && (
                            <button
                              title="Delete Entry"
                              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                              disabled={deletingFeeId === f._id}
                              onClick={() => {
                                showConfirm(
                                  `Delete receipt ${f.receiptNo}? This will reverse the fee amount from student records.`,
                                  async () => {
                                    setDeletingFeeId(f._id);
                                    try {
                                      await api.fees.deleteCollection(f._id);
                                      setFeeHistory((prev) =>
                                        prev.filter((x) => x._id !== f._id),
                                      );
                                      showToast(
                                        "success",
                                        `Receipt ${f.receiptNo} deleted`,
                                      );
                                      // Refresh student data
                                      const res = await api.students.byId(id);
                                      setStudent(res?.data || res);
                                    } catch (err) {
                                      showToast(
                                        "error",
                                        err?.message || "Failed to delete",
                                      );
                                    } finally {
                                      setDeletingFeeId(null);
                                    }
                                  },
                                );
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* OLD FEE RECEIPT PRINT MODAL */}
      {showReceiptModal && receiptData && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-base font-semibold text-navy font-brand">
                Receipt — {receiptData.receiptNo}
              </h2>
              <button
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-400"
                onClick={() => setShowReceiptModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-6 bg-gray-50 flex justify-center">
              <div
                className="bg-white mx-auto shadow-card fee-receipt-print"
                style={{
                  width: "210mm",
                  minHeight: "148mm",
                  padding: "10mm",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <div className="flex items-center gap-4 pb-2 border-b-2 border-teal mb-4">
                  <div className="size-12 rounded-xl flex items-center justify-center shrink-0">
                    <img
                      src={schoolInfo.logoUrl}
                      alt="Logo"
                      className="size-full object-contain"
                    />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold text-navy font-brand leading-tight">
                      {schoolInfo.name}
                    </h1>
                    <p className="text-[10px] text-gray-500">
                      {schoolInfo.address}
                    </p>
                    <p className="text-[10px] text-gray-500 flex items-center gap-1">
                      <Phone size={10} className="text-gray-400" />{" "}
                      {schoolInfo.phone}
                    </p>
                  </div>
                </div>
                <h2 className="text-center font-brand font-bold text-base text-navy mb-2">
                  FEE RECEIPT
                </h2>
                <div className="flex justify-between mb-3 text-xs">
                  <span className="font-mono">
                    Receipt No: {receiptData.receiptNo}
                  </span>
                  <span>
                    Date:{" "}
                    {receiptData.date
                      ? new Date(receiptData.date).toLocaleDateString("en-IN")
                      : "—"}
                  </span>
                </div>
                <div className="mb-4 text-xs space-y-1 border border-gray-200 rounded-lg p-3">
                  <p>
                    <strong>Student:</strong>{" "}
                    {student
                      ? `${student.firstName || ""} ${student.lastName || ""}`
                          .trim()
                          .toUpperCase()
                      : "—"}
                  </p>
                  <p>
                    <strong>Class:</strong> {student?.currentClass}
                    {student?.section ? `-${student.section}` : ""} |{" "}
                    <strong>Student ID:</strong> {student?.studentId || "—"}
                  </p>
                  <p>
                    <strong>Father:</strong> {student?.fatherName || "—"}
                  </p>
                  <p>
                    <strong>Fee Period:</strong> {receiptData.period || "—"}
                  </p>
                </div>
                <table className="w-full text-xs mb-auto border-collapse">
                  <thead>
                    <tr className="border-b border-navy">
                      <th className="text-left py-1.5">Fee Head</th>
                      <th className="text-right py-1.5">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(receiptData.feeHeads || []).map((fh, idx) => (
                      <tr
                        key={`${fh.head}-${idx}`}
                        className="border-b border-gray-100"
                      >
                        <td className="py-1.5">{fh.head}</td>
                        <td className="text-right py-1.5">
                          ₹{(fh.amount || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                    {receiptData.discountAmount > 0 && (
                      <tr className="border-b border-gray-100">
                        <td className="py-1.5 text-emerald-600">Discount</td>
                        <td className="text-right py-1.5 text-emerald-600 font-semibold">
                          -₹{receiptData.discountAmount.toLocaleString()}
                        </td>
                      </tr>
                    )}
                    <tr className="border-t border-navy">
                      <td className="py-1.5 font-brand font-bold">
                        Total Paid
                      </td>
                      <td className="text-right py-1.5 font-brand font-bold text-base">
                        ₹{(receiptData.amount || 0).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td
                        colSpan="2"
                        className="text-[10px] text-gray-400 pt-1"
                      >
                        Mode: {receiptData.mode || "CASH"}
                        {receiptData.refDetails
                          ? ` | Ref: ${receiptData.refDetails}`
                          : ""}
                      </td>
                    </tr>
                  </tbody>
                </table>
                {receiptData.remarks && (
                  <p className="text-[10px] text-gray-500 mt-2">
                    Remarks: {receiptData.remarks}
                  </p>
                )}
                <div className="flex items-end justify-between mt-4 mb-2">
                  <div className="px-3 py-1 border-2 border-cta text-cta font-brand font-bold text-lg rotate-[-12deg] opacity-80">
                    PAID
                  </div>
                  <div className="text-center">
                    <p className="text-[10px]">Received by: Admin</p>
                    <div className="border-b border-black w-28 my-3"></div>
                    <p className="text-[9px]">Authorized Signature</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-4 p-6 border-t border-gray-100">
              <button
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
                onClick={() => setShowReceiptModal(false)}
              >
                Close
              </button>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors"
                onClick={() => {
                  const afterPrint = () => {
                    window.removeEventListener("afterprint", afterPrint);
                  };
                  window.addEventListener("afterprint", afterPrint);
                  window.print();
                }}
              >
                <Printer size={18} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Exams" && (
        <div className="bg-white rounded-xl shadow-card p-6">
          <h3 className="font-brand font-semibold text-navy mb-4">
            Exam Results
          </h3>
          {results.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">
              No results found.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {[
                    "Exam",
                    "Subject",
                    "Marks",
                    "Percentage",
                    "Grade",
                    "Rank",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {results.map((r, idx) => (
                  <tr
                    key={r._id || idx}
                    className="border-b border-gray-50 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">{r.examId?.name || "—"}</td>
                    <td className="px-4 py-3">{r.examId?.subject || "—"}</td>
                    <td className="px-4 py-3 font-mono">
                      {r.totalMarks}/{r.examId?.maxMarks || "—"}
                    </td>
                    <td className="px-4 py-3">{r.percentage}%</td>
                    <td className="px-4 py-3 font-bold text-teal">{r.grade}</td>
                    <td className="px-4 py-3">{r.rank || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {activeTab === "Attendance" && (
        <div className="flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow-card">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
              <h3 className="font-brand font-semibold text-navy">
                Monthly Attendance Record
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (attMonth === 0) {
                      setAttMonth(11);
                      setAttYear((y) => y - 1);
                    } else setAttMonth((m) => m - 1);
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <span className="font-bold text-navy text-sm min-w-[120px] text-center">
                  {MONTHS[attMonth]} {attYear}
                </span>
                <button
                  onClick={() => {
                    if (attMonth === 11) {
                      setAttMonth(0);
                      setAttYear((y) => y + 1);
                    } else setAttMonth((m) => m + 1);
                  }}
                  className="p-1.5 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3 mb-6">
                {getWorkingDays(attYear, attMonth).map((day) => {
                  const ds = `${attYear}-${String(attMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const record = attendanceRecords.find((r) =>
                    r?.date?.startsWith(ds),
                  );
                  let code = null;
                  if (record) {
                    if (record?.status === "PRESENT") code = "P";
                    else if (record?.status === "ABSENT") code = "A";
                    else if (record?.status === "HALF_DAY") code = "H";
                    else if (record?.status === "LEAVE") code = "L";
                  }
                  const cfg = code ? STATUS_CFG[code] : null;
                  const isToday = ds === today.toISOString().split("T")[0];

                  return (
                    <div
                      key={day}
                      className={`relative flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${isToday ? "border-navy ring-1 ring-navy/20 shadow-sm" : "border-gray-100"} ${cfg?.cls || "bg-gray-50/50"}`}
                    >
                      <span className="text-[10px] font-bold mb-1 text-gray-400 uppercase">
                        {new Date(attYear, attMonth, day).toLocaleDateString(
                          "en-US",
                          { weekday: "short" },
                        )}
                      </span>
                      <span
                        className={`text-lg font-black ${cfg ? "text-current" : "text-gray-700"}`}
                      >
                        {day}
                      </span>
                      {cfg ? (
                        <span className="mt-1 text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded bg-white/60 border border-current/20">
                          {cfg.label}
                        </span>
                      ) : (
                        <span className="mt-1 text-[9px] text-gray-300 font-medium">
                          —
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                {Object.entries(STATUS_CFG).map(([k, v]) => {
                  const count = getWorkingDays(attYear, attMonth).filter(
                    (d) => {
                      const ds = `${attYear}-${String(attMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                      const r = attendanceRecords.find((rec) =>
                        rec?.date?.startsWith(ds),
                      );
                      if (!r) return false;
                      if (k === "P" && r?.status === "PRESENT") return true;
                      if (k === "A" && r?.status === "ABSENT") return true;
                      if (k === "H" && r?.status === "HALF_DAY") return true;
                      if (k === "L" && r?.status === "LEAVE") return true;
                      return false;
                    },
                  ).length;

                  return (
                    <div key={k} className="flex items-center gap-2">
                      <div className={`size-3 rounded-full ${v.dot}`}></div>
                      <span className="text-xs font-semibold text-navy">
                        {v.label}
                      </span>
                      <span className="text-xs font-black bg-white px-2 py-0.5 rounded-full border border-gray-200">
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
