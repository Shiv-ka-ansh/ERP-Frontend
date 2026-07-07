import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Download, Printer, Filter } from "lucide-react";
import CustomSelect from "../components/ui/CustomSelect";
import CustomDatePicker from "../components/ui/CustomDatePicker";
import { useAppContext } from "../context/AppContext";
import { api } from "../api/client";

const MODE_LABELS = {
  CASH: "Cash",
  UPI: "UPI",
  BANK_TRANSFER: "Bank",
  CARD: "Card",
};
const MODE_BADGE = {
  CASH: "bg-gray-100 text-gray-600",
  UPI: "bg-teal/10 text-teal",
  BANK_TRANSFER: "bg-blue-50 text-blue-600",
  CARD: "bg-violet-50 text-violet-600",
};

export default function FeeReport() {
  const { students, user, showToast, showConfirm, schoolInfo } =
    useAppContext();
  const navigate = useNavigate();
  const [reportType, setReportType] = useState("daily");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptStudent, setReceiptStudent] = useState(null);
  const [receiptSummary, setReceiptSummary] = useState(null);

  const fetchCollections = useCallback(() => {
    setLoading(true);
    api.fees
      .collections()
      .then((res) => setCollections(res?.data || []))
      .catch(() => setCollections([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  // Filter collections based on report type + date
  const filteredCollections = useMemo(() => {
    const parseDate = (val) => {
      if (!val) return new Date();
      if (val instanceof Date) return val;
      if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
        const [y, m, d] = val.split("-").map(Number);
        return new Date(y, m - 1, d);
      }
      return new Date(val);
    };

    const sDate = parseDate(selectedDate);

    return collections.filter((c) => {
      const d = parseDate(c.date || c.createdAt);
      if (isNaN(d.getTime())) return false;
      if (reportType === "daily") {
        return (
          d.getDate() === sDate.getDate() &&
          d.getMonth() === sDate.getMonth() &&
          d.getFullYear() === sDate.getFullYear()
        );
      }
      if (reportType === "monthly") {
        return (
          d.getMonth() === sDate.getMonth() &&
          d.getFullYear() === sDate.getFullYear()
        );
      }
      return true; // custom — show all for now
    });
  }, [collections, reportType, selectedDate]);

  const totalCollection = filteredCollections.reduce(
    (s, c) => s + (c.amount || 0),
    0,
  );

  const exportToCSV = () => {
    if (filteredCollections.length === 0) {
      showToast("error", "No data to export");
      return;
    }
    const headers = [
      "Receipt No",
      "Date",
      "Student Name",
      "Class",
      "Payment Mode",
      "Fee Heads",
      "Amount",
    ];
    const rows = filteredCollections.map((c) => {
      let studentName = "Unknown";
      let className = "—";
      if (c.studentId && typeof c.studentId === "object") {
        studentName =
          `${c.studentId.firstName || ""} ${c.studentId.lastName || ""}`.trim() ||
          "Unknown";
        className = c.studentId.currentClass
          ? `${c.studentId.currentClass}${c.studentId.section ? `-${c.studentId.section}` : ""}`
          : "—";
      } else {
        const student = students.find(
          (s) => String(s.id) === String(c.studentId),
        );
        if (student) {
          const { name, className: sClass } = student;
          studentName = name;
          className = sClass;
        }
      }
      const heads = Array.isArray(c.feeHeads)
        ? c.feeHeads.map((h) => h.head).join("; ")
        : "—";
      const date = c.date ? new Date(c.date).toLocaleDateString("en-IN") : "—";
      return [
        c.receiptNo || "—",
        date,
        studentName,
        className,
        c.mode || "CASH",
        heads,
        c.amount || 0,
      ]
        .map((val) => `"${val}"`)
        .join(",");
    });

    // Add Total Row
    rows.push(
      ["", "", "", "", "", "Total", totalCollection]
        .map((val) => `"${val}"`)
        .join(","),
    );

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.setAttribute(
      "download",
      `Fee_Report_${selectedDate.toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleReprint = (c) => {
    let studentName = "Unknown";
    let className = "—";
    let studentId = "—";
    let father = "—";

    if (c.studentId && typeof c.studentId === "object") {
      studentName =
        `${c.studentId.firstName || ""} ${c.studentId.lastName || ""}`.trim() ||
        "Unknown";
      className = c.studentId.currentClass
        ? `${c.studentId.currentClass}${c.studentId.section ? `-${c.studentId.section}` : ""}`
        : "—";
      studentId = c.studentId.studentId || "—";
      father = c.studentId.fatherName || c.studentId.parentName || "—";
    } else {
      const student = students.find(
        (s) => String(s.id) === String(c.studentId),
      );
      if (student) {
        const {
          name,
          className: sClass,
          studentId: sId,
          roll,
          fatherName,
          parentName,
        } = student;
        studentName = name;
        className = sClass;
        studentId = sId || roll || "—";
        father = fatherName || parentName || "—";
      }
    }

    setReceiptStudent({ name: studentName, cls: className, studentId, father });

    // Construct receipt object similar to FeeCollection.jsx
    let periodStr = "—";
    if (c.months && c.months.length > 0) {
      periodStr = c.months.join(", ");
    } else {
      // maybe no months, just charges
      periodStr = "One-time charges";
    }

    setReceipt({
      receiptNo: c.receiptNo,
      date: c.date || c.createdAt,
      period: periodStr,
      feeHeads: c.feeHeads || [],
      discountAmount: c.discountAmount || 0,
      amount: c.amount || 0,
      mode: c.mode,
      refDetails: c.refDetails,
      remarks: c.remarks,
    });

    setReceiptSummary(null);
    const sid =
      typeof c.studentId === "object"
        ? c.studentId._id || c.studentId.id
        : c.studentId;
    if (sid) {
      api.fees
        .studentSummary(sid)
        .then((res) => setReceiptSummary(res?.data || null))
        .catch(() => {});
    }

    setShowReceiptModal(true);
  };

  const handleDelete = (id, receiptNo) => {
    showConfirm(
      `Are you sure you want to delete receipt ${receiptNo}? This will reverse the fee.`,
      async () => {
        try {
          await api.fees.deleteCollection(id);
          setCollections((prev) => prev.filter((c) => c._id !== id));
          showToast("success", `Receipt ${receiptNo} deleted successfully`);
        } catch (err) {
          showToast("error", err?.message || "Failed to delete receipt");
        }
      },
    );
  };

  return (
    <div className="min-h-screen relative">
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-4 transition-colors print:hidden"
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-navy font-brand">
          Fee Collection Report
        </h1>
        <div className="flex items-center gap-3 print:hidden">
          <button
            className="inline-flex items-center gap-2 px-4 py-2 border border-cta text-cta rounded-lg text-sm font-medium hover:bg-cta/10 transition-colors"
            onClick={exportToCSV}
          >
            <Download size={18} /> Export Excel / CSV
          </button>
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors"
            onClick={() => window.print()}
          >
            <Printer size={18} /> Print Report
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-6 mb-6 print:hidden">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Report Type
            </label>
            <div className="z-20">
              <CustomSelect
                value={reportType}
                onChange={(val) => setReportType(val)}
                options={[
                  { label: "Daily Report", value: "daily" },
                  { label: "Monthly Report", value: "monthly" },
                  { label: "All Collections", value: "custom" },
                ]}
              />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Date / Month
            </label>
            <CustomDatePicker
              selected={selectedDate}
              onChange={(d) => d && setSelectedDate(d)}
              dateFormat={reportType === "monthly" ? "MM/yyyy" : "dd/MM/yyyy"}
              showMonthYearPicker={reportType === "monthly"}
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchCollections}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-cta text-cta rounded-lg text-sm font-medium hover:bg-cta/10 transition-colors disabled:opacity-60"
            >
              <Filter size={16} /> {loading ? "Loading..." : "Refresh Data"}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-card p-5 border-l-4 border-teal">
          <h4 className="text-xs text-gray-400">Total Collection</h4>
          <h2 className="font-brand text-2xl font-bold text-teal">
            ₹{totalCollection.toLocaleString()}
          </h2>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5 border-l-4 border-blue-500">
          <h4 className="text-xs text-gray-400">Receipts</h4>
          <h2 className="font-brand text-2xl font-bold text-blue-500">
            {filteredCollections.length}
          </h2>
        </div>
        <div className="bg-white rounded-xl shadow-card p-5 border-l-4 border-amber-500">
          <h4 className="text-xs text-gray-400">Avg per Receipt</h4>
          <h2 className="font-brand text-2xl font-bold text-amber-500">
            ₹
            {filteredCollections.length > 0
              ? Math.round(
                  totalCollection / filteredCollections.length,
                ).toLocaleString()
              : 0}
          </h2>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Receipt No
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Student Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Class
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Payment Mode
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Discount
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Amount
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCollections.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="px-4 py-8 text-center text-gray-400"
                  >
                    No collections found for this period.
                  </td>
                </tr>
              ) : (
                filteredCollections.map((c, idx) => {
                  let studentName = "Unknown";
                  let className = "—";
                  if (c.studentId && typeof c.studentId === "object") {
                    studentName =
                      `${c.studentId.firstName || ""} ${c.studentId.lastName || ""}`.trim() ||
                      "Unknown";
                    className = c.studentId.currentClass
                      ? `${c.studentId.currentClass}${c.studentId.section ? `-${c.studentId.section}` : ""}`
                      : "—";
                  } else {
                    const student = students.find(
                      (s) => String(s.id) === String(c.studentId),
                    );
                    if (student) {
                      const { name, className: sClass } = student;
                      studentName = name;
                      className = sClass;
                    }
                  }

                  const mode = c.mode || "CASH";
                  return (
                    <tr
                      key={c._id || idx}
                      className="border-b border-gray-50 hover:bg-gray-50"
                    >
                      <td className="px-4 py-3 font-mono text-gray-400">
                        {c.receiptNo || `RCP-${idx + 1}`}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {c.date
                          ? new Date(c.date).toLocaleDateString("en-IN")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 font-brand">{studentName}</td>
                      <td className="px-4 py-3 text-gray-700">{className}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${MODE_BADGE[mode] || "bg-gray-100 text-gray-600"}`}
                        >
                          {MODE_LABELS[mode] || mode}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-rose-500">
                        {c.discountAmount && c.discountAmount > 0 ? (
                          <span className="text-xs font-bold">
                            ₹{c.discountAmount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-right">
                        ₹{(c.amount || 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleReprint(c)}
                          className="text-xs text-blue-500 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors mr-2"
                        >
                          Reprint
                        </button>
                        <button
                          onClick={() => handleDelete(c._id, c.receiptNo)}
                          className="text-xs text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2 py-1 rounded transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
              {filteredCollections.length > 0 && (
                <tr className="bg-gray-50">
                  <td
                    colSpan="6"
                    className="px-4 py-3 text-right font-bold text-gray-600"
                  >
                    Total Collected:
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-teal text-right text-base">
                    ₹{totalCollection.toLocaleString()}
                  </td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECEIPT MODAL */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto custom-scrollbar flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/80 sticky top-0 z-10">
              <h2 className="text-sm font-bold text-navy font-brand tracking-wide uppercase">
                Reprint Receipt
              </h2>
              <button
                className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-500"
                onClick={() => setShowReceiptModal(false)}
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
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>
            <div className="p-5 bg-gray-200/50 flex-1 flex justify-center">
              <style>{`
 @media print {
 @page { size: A4 portrait; margin: 0; }
 body * { visibility: hidden; }
 .fee-receipt-print, .fee-receipt-print * { visibility: visible; }
 .fee-receipt-print {
 position: absolute;
 left: 0;
 top: 0;
 width: 210mm !important;
 height: 296mm !important;
 padding: 4mm 8mm !important;
 margin: 0 !important;
 box-sizing: border-box !important;
 box-shadow: none !important;
 background: white !important;
 display: flex !important;
 flex-direction: column !important;
 }
 .receipt-copy {
 width: 100% !important;
 flex: 1 !important;
 display: flex !important;
 flex-direction: column !important;
 page-break-inside: avoid !important;
 break-inside: avoid !important;
 overflow: hidden !important;
 }
 .receipt-copy > * {
 flex-shrink: 0;
 }
 .receipt-copy table {
 margin-bottom: auto !important;
 }
 .receipt-copy th, .receipt-copy td {
 padding-top: 2px !important;
 padding-bottom: 2px !important;
 }
 .cut-line { margin: 2mm 0 !important; }
 }
 `}</style>
              <div
                className="bg-white mx-auto shadow-sm fee-receipt-print"
                style={{
                  width: "100%",
                  maxWidth: "210mm",
                  padding: "6mm 10mm",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {["STUDENT COPY", "INSTITUTE COPY"].map((copyLabel, index) => (
                  <div
                    key={copyLabel}
                    className="receipt-copy"
                    style={{ display: "flex", flexDirection: "column" }}
                  >
                    {/* Copy Label */}
                    <div className="text-center mb-1">
                      <span className="px-2 py-0.5 bg-gray-100 border border-gray-300 text-[9px] font-bold tracking-widest rounded-full">
                        {copyLabel}
                      </span>
                    </div>
                    {/* Header */}
                    <div className="flex items-center gap-3 pb-1 border-b-2 border-cta mb-1">
                      <div className="size-12 rounded flex items-center justify-center shrink-0">
                        <img
                          src={schoolInfo.logoUrl}
                          alt="Logo"
                          className="size-full object-contain"
                        />
                      </div>
                      <div className="flex-1 text-center">
                        <h1 className="text-sm font-bold text-navy font-brand leading-tight tracking-wide">
                          {schoolInfo.name}
                        </h1>
                        <p className="text-[8px] text-gray-500 font-medium">
                          {schoolInfo.address} | Ph: {schoolInfo.phone}
                        </p>
                      </div>
                      <div className="w-12"></div>
                    </div>
                    {/* Title */}
                    <h2 className="text-center font-brand font-bold text-[11px] text-navy mb-1 uppercase tracking-widest">
                      Fee Receipt (Duplicate)
                    </h2>
                    {/* Receipt No & Date */}
                    <div className="flex justify-between mb-2 text-[10px] font-medium">
                      <span className="font-mono bg-gray-50 px-1.5 py-0.5 border border-gray-100 rounded">
                        No:{" "}
                        <span className="font-bold text-navy">
                          {receipt?.receiptNo || "—"}
                        </span>
                      </span>
                      <span className="bg-gray-50 px-1.5 py-0.5 border border-gray-100 rounded">
                        Date:{" "}
                        {receipt?.date
                          ? new Date(receipt.date).toLocaleDateString("en-IN")
                          : new Date().toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    {/* Student Info */}
                    <div className="mb-1 text-[9px] border border-gray-200 rounded p-1.5 bg-gray-50/50">
                      <div className="grid grid-cols-2 gap-y-0.5">
                        <div>
                          <span className="text-gray-500">Student Name:</span>{" "}
                          <strong className="text-navy">
                            {receiptStudent?.name?.toUpperCase()}
                          </strong>
                        </div>
                        <div>
                          <span className="text-gray-500">Student ID:</span>{" "}
                          <strong className="text-navy">
                            {receiptStudent?.studentId}
                          </strong>
                        </div>
                        <div>
                          <span className="text-gray-500">Class:</span>{" "}
                          <strong className="text-navy">
                            {receiptStudent?.cls}
                          </strong>
                        </div>
                        <div>
                          <span className="text-gray-500">Father's Name:</span>{" "}
                          <strong className="text-navy">
                            {receiptStudent?.father}
                          </strong>
                        </div>
                      </div>
                      <div className="mt-0.5 pt-0.5 border-t border-gray-200">
                        <span className="text-gray-500">Fee Period:</span>{" "}
                        <strong className="text-navy ml-1">
                          {receipt?.period}
                        </strong>
                      </div>
                    </div>
                    {/* Fee Table */}
                    <table className="w-full text-[10px] border-collapse border border-gray-200">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="text-left py-1 px-2 border-b border-gray-200 font-bold text-navy">
                            Fee Head
                          </th>
                          <th className="text-right py-1 px-2 border-b border-gray-200 font-bold text-navy w-24">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(receipt?.feeHeads || []).map((fh, idx) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="py-1 px-2">{fh.head}</td>
                            <td className="text-right py-1 px-2 font-mono">
                              ₹{fh.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {receipt?.discountAmount > 0 && (
                          <tr className="border-b border-gray-100 bg-emerald-50/50">
                            <td className="py-1 px-2 text-emerald-700 italic">
                              Discount Applied
                            </td>
                            <td className="text-right py-1 px-2 text-emerald-700 font-mono">
                              -₹{receipt.discountAmount.toLocaleString()}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-gray-50">
                          <td className="py-1.5 px-2 font-bold text-navy text-[11px] uppercase">
                            Total Paid
                          </td>
                          <td className="text-right py-1.5 px-2 font-bold text-[11px] text-navy font-mono">
                            ₹{(receipt?.amount || 0).toLocaleString()}
                          </td>
                        </tr>
                        {receiptSummary &&
                          receiptSummary.feeStructureFound &&
                          receiptSummary.partialBalance > 0 && (
                            <tr className="bg-amber-50/60">
                              <td className="py-1.5 px-2 font-bold text-amber-700 text-[10px] uppercase border-t border-amber-100">
                                Pending Balance
                              </td>
                              <td className="text-right py-1.5 px-2 font-bold text-[10px] text-amber-700 font-mono border-t border-amber-100">
                                ₹
                                {Math.max(
                                  0,
                                  receiptSummary.partialBalance,
                                ).toLocaleString()}
                              </td>
                            </tr>
                          )}
                        <tr>
                          <td
                            colSpan="2"
                            className="text-[9px] text-gray-500 py-1 px-2 italic bg-white"
                          >
                            Payment Mode:{" "}
                            <strong>{receipt?.mode || "CASH"}</strong>
                            {receipt?.refDetails
                              ? ` | Ref: ${receipt.refDetails}`
                              : ""}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    {receipt?.remarks && (
                      <p className="text-[9px] text-gray-500 mt-1 italic">
                        Remarks: {receipt.remarks}
                      </p>
                    )}
                    {/* Footer: PAID + Signature */}
                    <div className="flex items-end justify-between mt-1.5 mb-1">
                      <div className="px-2 py-0.5 border-2 border-cta text-cta font-brand font-bold text-sm rotate-[-12deg] opacity-80 rounded tracking-widest">
                        PAID
                      </div>
                      <div className="text-center">
                        <p className="text-[8px] text-gray-500 mb-2">
                          Received by: Admin
                        </p>
                        <div className="border-b border-gray-400 w-24 mx-auto"></div>
                        <p className="text-[7px] text-gray-500 mt-0.5 uppercase tracking-widest">
                          Authorized Signatory
                        </p>
                      </div>
                    </div>
                    {/* Cut Line between copies */}
                    {index === 0 && (
                      <div className="cut-line w-full border-t border-dashed border-gray-300 my-2 relative flex items-center justify-center">
                        <span className="bg-white px-3 text-gray-400 text-[9px] tracking-widest font-bold">
                          ✂ CUT HERE ✂
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 p-4 bg-white border-t border-gray-100 sticky bottom-0">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-bold transition-colors"
                onClick={() => setShowReceiptModal(false)}
              >
                Close
              </button>
              <button
                className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-xl text-sm font-bold hover:bg-cta-dark transition-colors shadow-sm"
                onClick={() => {
                  const afterPrint = () => {
                    setShowReceiptModal(false);
                    window.removeEventListener("afterprint", afterPrint);
                  };
                  window.addEventListener("afterprint", afterPrint);
                  window.print();
                }}
              >
                <Printer size={16} /> Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
