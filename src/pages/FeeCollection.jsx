import { useState, useMemo, useEffect } from "react";
import {
  Search,
  X,
  Printer,
  IndianRupee,
  CreditCard,
  Landmark,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Check,
  ArrowLeft,
  Tag,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { api } from "../api/client";
import CustomDatePicker from "../components/ui/CustomDatePicker";

const ALL_MONTHS = [
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
  "January",
  "February",
  "March",
];

export default function FeeCollection() {
  const navigate = useNavigate();
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [refDetails, setRefDetails] = useState("");

  const [selectedMonths, setSelectedMonths] = useState([]);
  const [selectedAnnualCharges, setSelectedAnnualCharges] = useState({});
  const [customAmount, setCustomAmount] = useState("");
  const [discount, setDiscount] = useState("");
  const [feeDate, setFeeDate] = useState(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, "0");
    const d = String(today.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  });

  const [studentCollections, setStudentCollections] = useState([]);
  const [expandedTxn, setExpandedTxn] = useState(null);
  const [paidMonths, setPaidMonths] = useState([]);
  const [paidAnnualCharges, setPaidAnnualCharges] = useState([]);

  const { showToast, showConfirm, students, feeStructures, schoolInfo } =
    useAppContext();
  const [lateFee, setLateFee] = useState(0);
  const [includeLateFee, setIncludeLateFee] = useState(false);
  const [scholarships, setScholarships] = useState([]);
  const [feeSummary, setFeeSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const filteredStudents = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return students
      .filter(
        (s) =>
          s.name?.toLowerCase().includes(q) ||
          (s.studentId && s.studentId.toLowerCase().includes(q)) ||
          (s.roll && s.roll.toLowerCase().includes(q)) ||
          s.parentName?.toLowerCase().includes(q),
      )
      .map((s) => ({
        id: s.id,
        name: s.name,
        cls: `${s.className}${s.section ? `-${s.section}` : ""}`,
        studentId: s.studentId || s.roll || "—",
        adm: `ADM-${s.id}`,
        father: s.fatherName || s.parentName || "—",
        due: s.dues || 0,
        cleared: s.feeStatus === "cleared",
        phone: s.phone || "",
        dob: s.dob || "",
        className: s.className,
      }));
  }, [students, searchQuery]);

  const studentFeeStructure = useMemo(() => {
    if (!selectedStudent || !feeStructures) return null;
    const fs = feeStructures.find((fs) =>
      fs.className
        ?.split(",")
        .map((c) => c.trim())
        .includes(selectedStudent.className),
    );
    if (!fs) return null;

    let monthlyTuition = fs.monthlyTuition || 0;
    let annualCharges = fs.annualCharges || [];

    if (monthlyTuition === 0 && fs.feeHeads && fs.feeHeads.length > 0) {
      const tuitionHead = fs.feeHeads.find((h) =>
        h.head.toLowerCase().includes("tuition"),
      );
      if (tuitionHead) monthlyTuition = Number(tuitionHead.amount);

      annualCharges = fs.feeHeads
        .filter((h) => !h.head.toLowerCase().includes("tuition"))
        .map((h) => ({ name: h.head, amount: Number(h.amount) }));
    }

    return { ...fs, monthlyTuition, annualCharges };
  }, [selectedStudent, feeStructures]);

  // Load student's past payments to detect paid months and heads
  useEffect(() => {
    if (!selectedStudent) {
      setPaidMonths([]);
      setPaidAnnualCharges([]);
      setStudentCollections([]);
      setFeeSummary(null);
      setSummaryLoading(false);
      return;
    }

    setSelectedMonths([]);
    setSelectedAnnualCharges({});
    setCustomAmount("");
    setDiscount("");
    setRemarks("");

    api.fees
      .collections({ studentId: selectedStudent.id })
      .then((res) => {
        const mine = res?.data || [];
        return setStudentCollections(mine);
      })
      .catch(() => {});

    // Fetch approved scholarships
    api.fees.discounts
      .list({ page: 1, limit: 500 })
      .then((res) => {
        const all = res?.data || [];
        const mine = all.filter(
          (d) =>
            String(d.studentId) === String(selectedStudent.id) &&
            d.status === "approved",
        );
        return setScholarships(mine);
      })
      .catch(() => {});

    // Fetch fee summary (remaining balance)
    setSummaryLoading(true);
    setFeeSummary(null);
    api.fees
      .studentSummary(selectedStudent.id)
      .then((res) => {
        return setFeeSummary(res?.data || null);
      })
      .catch(() => {
        setFeeSummary(null);
      })
      .finally(() => setSummaryLoading(false));
  }, [selectedStudent]);

  useEffect(() => {
    const pMonths = [];
    const pCharges = [];
    studentCollections.forEach((c) => {
      if (c.months && Array.isArray(c.months)) {
        pMonths.push(...c.months);
      }
      if (c.feeHeads && Array.isArray(c.feeHeads)) {
        c.feeHeads.forEach((fh) => {
          if (fh.head !== "Tuition Fee" && !fh.head.includes("Tuition Fee")) {
            pCharges.push(fh.head.toLowerCase().trim());
          }
        });
      }
    });
    setPaidMonths([...new Set(pMonths)]);
    setPaidAnnualCharges([...new Set(pCharges)]);
  }, [studentCollections]);

  const toggleMonth = (month) => {
    if (paidMonths.includes(month)) return;
    setSelectedMonths((prev) =>
      prev.includes(month) ? prev.filter((m) => m !== month) : [...prev, month],
    );
  };

  const toggleAnnualCharge = (chargeName) => {
    const chargeKey = chargeName.toLowerCase().trim();
    if (paidAnnualCharges.includes(chargeKey)) return;

    setSelectedAnnualCharges((prev) => ({
      ...prev,
      [chargeName]: !prev[chargeName],
    }));
  };

  const isChargePaid = (chargeName) => {
    return paidAnnualCharges.includes(chargeName.toLowerCase().trim());
  };

  const calculatedBreakdown = useMemo(() => {
    if (!studentFeeStructure)
      return { tuition: 0, charges: [], subtotal: 0, discount: 0, total: 0 };

    const monthlyFee = studentFeeStructure.monthlyTuition || 0;
    const tuitionTotal = monthlyFee * selectedMonths.length;

    const selectedChargesList = [];
    let chargesTotal = 0;

    if (studentFeeStructure.annualCharges) {
      // Track how many times each head has been paid to handle duplicates
      const paidCounts = {};
      paidAnnualCharges.forEach((name) => {
        paidCounts[name] = (paidCounts[name] || 0) + 1;
      });

      studentFeeStructure.annualCharges.forEach((ac, idx) => {
        const nameKey = ac.name.toLowerCase().trim();
        const uniqueKey = `${ac.name}-${idx}`;

        // A charge is "paid" if it has been paid enough times already
        // This handles multiple "Exam Fee" entries correctly
        let alreadyPaid = false;
        if (paidCounts[nameKey] > 0) {
          alreadyPaid = true;
          paidCounts[nameKey]--;
        }

        if (!alreadyPaid && selectedAnnualCharges[uniqueKey]) {
          selectedChargesList.push(ac);
          chargesTotal += ac.amount;
        }
      });
    }

    const lateFeeAmt = includeLateFee ? Number(lateFee) || 0 : 0;
    const carryForwardBalance =
      feeSummary && feeSummary.partialBalance > 0
        ? feeSummary.partialBalance
        : 0;
    const subtotal =
      tuitionTotal + chargesTotal + lateFeeAmt + carryForwardBalance;

    // Calculate Scholarship Discounts
    let scholarshipTotal = 0;
    scholarships.forEach((s) => {
      if (s.feeHead === "Total_Fees") {
        if (s.type === "percent")
          scholarshipTotal += (subtotal * s.value) / 100;
        else scholarshipTotal += s.value;
      } else if (s.feeHead.toLowerCase().includes("tuition")) {
        if (selectedMonths.length > 0) {
          if (s.type === "percent")
            scholarshipTotal += (tuitionTotal * s.value) / 100;
          else scholarshipTotal += s.value;
        }
      } else {
        const target = selectedChargesList.find((c) => c.name === s.feeHead);
        if (target) {
          if (s.type === "percent")
            scholarshipTotal += (target.amount * s.value) / 100;
          else scholarshipTotal += s.value;
        }
      }
    });

    const manualDiscountAmt = Number(discount) || 0;
    const discountAmt = scholarshipTotal + manualDiscountAmt;
    const total = subtotal - discountAmt;

    return {
      monthlyFee,
      tuitionTotal,
      charges: selectedChargesList,
      lateFee: lateFeeAmt,
      subtotal,
      scholarshipTotal,
      manualDiscount: manualDiscountAmt,
      discount: discountAmt,
      total,
      carryForwardBalance,
    };
  }, [
    studentFeeStructure,
    selectedMonths,
    selectedAnnualCharges,
    paidAnnualCharges,
    lateFee,
    includeLateFee,
    scholarships,
    discount,
    feeSummary,
  ]);

  const totalAmount =
    customAmount !== "" ? Number(customAmount) : calculatedBreakdown.total;

  const handleCollect = () => {
    if (!selectedStudent) {
      showToast("error", "Select a student first");
      return;
    }
    if (calculatedBreakdown.subtotal <= 0) {
      showToast("error", "Select at least one month or fee head");
      return;
    }
    setReceipt(null); // Ensure we are in preview mode
    setShowReceiptModal(true);
  };

  const handleConfirmPayment = async () => {
    const modeMap = {
      Cash: "CASH",
      UPI: "UPI",
      Cheque: "BANK_TRANSFER",
      Card: "CARD",
    };

    const feeHeadsPayload = [];
    if (selectedMonths.length > 0) {
      feeHeadsPayload.push({
        head: "Tuition Fee",
        amount: calculatedBreakdown.tuitionTotal,
      });
    }
    calculatedBreakdown.charges.forEach((c) => {
      feeHeadsPayload.push({ head: c.name, amount: c.amount });
    });
    if (calculatedBreakdown.lateFee > 0) {
      feeHeadsPayload.push({
        head: "Late Fee / Fine",
        amount: calculatedBreakdown.lateFee,
      });
    }
    if (calculatedBreakdown.carryForwardBalance > 0) {
      feeHeadsPayload.push({
        head: "Previous Dues (Carry-forward)",
        amount: calculatedBreakdown.carryForwardBalance,
      });
    }

    const periodStr =
      selectedMonths.length > 0 ? selectedMonths.join(", ") : "Annual Charges";

    setSubmitting(true);
    try {
      const payload = {
        studentId: selectedStudent.id,
        amount: totalAmount,
        amountDue: calculatedBreakdown.total, // full session due before custom override
        mode: modeMap[paymentMode] || "CASH",
        remarks: remarks || undefined,
        period: periodStr,
        months: selectedMonths,
        date: feeDate || undefined,
        feeHeads: feeHeadsPayload,
        discountAmount: calculatedBreakdown.discount || 0,
        refDetails: refDetails || undefined,
      };

      const res = await api.fees.collect(payload);
      const payment = res?.data || res;

      // Update local state for receipt
      try {
        const receiptRes = await api.fees.receipts(payment._id);
        setReceipt(receiptRes?.data?.receipt || receiptRes?.data || payment);
      } catch {
        setReceipt(payment);
      }

      showToast("success", "Fee collected successfully");

      // Auto-refresh student collections and state
      try {
        const refreshRes = await api.fees.collections({
          studentId: selectedStudent.id,
        });
        const mine = refreshRes?.data || [];
        setStudentCollections(mine);

        const pMonths = [];
        const pCharges = [];
        mine.forEach((c) => {
          if (c.months && Array.isArray(c.months)) pMonths.push(...c.months);
          if (c.feeHeads && Array.isArray(c.feeHeads)) {
            c.feeHeads.forEach((fh) => {
              if (
                fh.head !== "Tuition Fee" &&
                !fh.head.includes("Tuition Fee")
              ) {
                pCharges.push(fh.head.toLowerCase().trim());
              }
            });
          }
        });
        setPaidMonths([...new Set(pMonths)]);
        setPaidAnnualCharges([...new Set(pCharges)]);

        // Reset inputs
        setSelectedMonths([]);
        setSelectedAnnualCharges({});
        setCustomAmount("");
        setLateFee(0);
        setIncludeLateFee(false);
        setDiscount("");
        setRemarks("");
        setRefDetails("");

        // Refresh fee summary
        try {
          const summaryRes = await api.fees.studentSummary(selectedStudent.id);
          setFeeSummary(summaryRes?.data || null);
        } catch {}
      } catch {}

      // Trigger print after state updates
      setTimeout(() => {
        window.print();
        setShowReceiptModal(false);
      }, 500);
    } catch (err) {
      showToast(
        "error",
        err?.data?.message || err?.message || "Failed to collect fee",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFullYear = () => {
    if (!studentFeeStructure) return;

    const unpaidMonths = ALL_MONTHS.filter((m) => !paidMonths.includes(m));

    // Calculate target charges
    const targetChargesKeys = [];
    const paidCounts = {};
    paidAnnualCharges.forEach((name) => {
      paidCounts[name] = (paidCounts[name] || 0) + 1;
    });

    studentFeeStructure.annualCharges.forEach((ac, idx) => {
      const nameKey = ac.name.toLowerCase().trim();
      const uniqueKey = `${ac.name}-${idx}`;
      let isPaid = false;
      if (paidCounts[nameKey] > 0) {
        isPaid = true;
        paidCounts[nameKey]--;
      }
      if (!isPaid) targetChargesKeys.push(uniqueKey);
    });

    // Check if everything is already selected
    const allMonthsSelected = unpaidMonths.every((m) =>
      selectedMonths.includes(m),
    );
    const allChargesSelected = targetChargesKeys.every(
      (k) => selectedAnnualCharges[k],
    );
    const isFullySelected =
      allMonthsSelected &&
      allChargesSelected &&
      (unpaidMonths.length > 0 || targetChargesKeys.length > 0);

    if (isFullySelected) {
      setSelectedMonths([]);
      setSelectedAnnualCharges({});
      showToast("info", "Selection cleared");
    } else {
      setSelectedMonths(unpaidMonths);
      const newSelectedCharges = {};
      targetChargesKeys.forEach((k) => (newSelectedCharges[k] = true));
      setSelectedAnnualCharges(newSelectedCharges);
      showToast("success", "Full year selected");
    }
  };

  const isFullYearSelected = useMemo(() => {
    if (!studentFeeStructure) return false;
    const unpaidMonths = ALL_MONTHS.filter((m) => !paidMonths.includes(m));
    if (unpaidMonths.length === 0) return false;

    const allMonthsSelected = unpaidMonths.every((m) =>
      selectedMonths.includes(m),
    );
    if (!allMonthsSelected) return false;

    // Check charges
    const paidCounts = {};
    paidAnnualCharges.forEach((name) => {
      paidCounts[name] = (paidCounts[name] || 0) + 1;
    });

    for (let i = 0; i < studentFeeStructure.annualCharges.length; i += 1) {
      const ac = studentFeeStructure.annualCharges[i];
      const nameKey = ac.name.toLowerCase().trim();
      const uniqueKey = `${ac.name}-${i}`;
      let isPaid = false;
      if (paidCounts[nameKey] > 0) {
        isPaid = true;
        paidCounts[nameKey] -= 1;
      }
      if (!isPaid && !selectedAnnualCharges[uniqueKey]) return false;
    }
    return true;
  }, [
    studentFeeStructure,
    paidMonths,
    selectedMonths,
    selectedAnnualCharges,
    paidAnnualCharges,
  ]);

  const handleDelete = (id, receiptNo) => {
    showConfirm(
      `Are you sure you want to delete receipt ${receiptNo}? This will reverse the fee.`,
      async () => {
        try {
          await api.fees.deleteCollection(id);
          showToast("success", "Receipt deleted successfully");
          // Refetch collections to update UI status
          const refreshRes = await api.fees.collections({
            studentId: selectedStudent.id,
          });
          setStudentCollections(refreshRes?.data || []);
        } catch (err) {
          showToast("error", err?.data?.message || "Failed to delete");
        }
      },
    );
  };

  return (
    <div className="h-[calc(100vh-72px)] flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 mb-3 shrink-0">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-navy transition-colors"
        >
          <ArrowLeft size={15} /> Back
        </button>
        <h1 className="font-brand font-bold text-navy text-base">
          Fee Collection
        </h1>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* PANEL 1: SEARCH */}
        <div className="w-[280px] shrink-0 bg-white rounded-xl shadow-card border border-gray-100 flex flex-col overflow-hidden">
          <div className="p-4 border-b border-gray-100 shrink-0">
            <h2 className="font-brand font-semibold text-navy text-sm mb-3 flex items-center gap-2">
              <Search size={15} className="text-cta" /> Select Student
            </h2>
            <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg px-3 gap-2 focus-within:border-cta focus-within:ring-2 focus-within:ring-cta/10 transition-all">
              <Search size={14} className="text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="border-none bg-transparent text-xs py-2 focus:outline-none w-full"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="text-gray-400 hover:text-gray-600 shrink-0"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1">
            {!searchQuery.trim() ? (
              <div className="text-gray-400 text-center py-8 flex flex-col items-center">
                <Search size={20} className="text-gray-300 mb-2" />
                <p className="text-xs font-medium">Search to begin</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-gray-400 text-center py-8 text-xs bg-gray-50 rounded-lg border border-dashed border-gray-200">
                No students found
              </div>
            ) : (
              filteredStudents.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-2.5 p-2.5 rounded-lg cursor-pointer transition-all ${selectedStudent?.id === s.id ? "bg-cta/5 border border-cta" : "hover:bg-gray-50 border border-transparent"}`}
                  onClick={() => {
                    setSelectedStudent(s);
                    setRemarks("");
                    setRefDetails("");
                  }}
                >
                  <div
                    className={`size-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${selectedStudent?.id === s.id ? "bg-cta text-white" : "bg-gray-100 text-gray-500"}`}
                  >
                    {s.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-brand font-medium text-xs text-navy truncate">
                      {s.name}
                    </div>
                    <div className="text-[10px] text-gray-400">
                      {s.cls} • {s.studentId}
                    </div>
                  </div>
                  {s.cleared ? (
                    <CheckCircle2
                      size={14}
                      className="text-emerald-500 shrink-0"
                    />
                  ) : (
                    <AlertCircle size={14} className="text-rose-400 shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* PANEL 2: SELECTION & PAYMENT */}
        <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
          {!selectedStudent ? (
            <div className="flex-1 bg-white rounded-xl shadow-card border border-gray-100 flex flex-col items-center justify-center text-center p-8">
              <div className="size-16 rounded-full bg-cta/5 flex items-center justify-center mb-4">
                <Landmark size={32} className="text-cta/30" />
              </div>
              <h3 className="font-brand font-bold text-base text-navy">
                Fee Collection
              </h3>
              <p className="text-gray-400 text-xs mt-1 max-w-xs">
                Search and select a student from the left panel to begin
                collecting fees.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 h-full overflow-hidden">
              {/* Header */}
              <div className="bg-white rounded-xl shadow-card border border-gray-100 px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-navy border border-white shadow-sm">
                    {selectedStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="font-brand font-bold text-sm text-navy">
                      {selectedStudent.name.toUpperCase()}
                    </h2>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">
                        Class {selectedStudent.cls}
                      </span>
                      <span>ID: {selectedStudent.studentId}</span>
                    </div>
                  </div>
                </div>
                <button
                  className="p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 transition-colors text-gray-400"
                  onClick={() => setSelectedStudent(null)}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Fee Summary Banner — shows only carry-forward partial balance */}
              {feeSummary &&
                feeSummary.feeStructureFound &&
                feeSummary.collectionsCount > 0 && (
                  <div
                    className={`rounded-xl border px-4 py-3 shrink-0 flex items-center justify-between gap-4 ${
                      feeSummary.partialBalance > 0
                        ? "bg-amber-50 border-amber-200"
                        : "bg-emerald-50 border-emerald-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`size-8 rounded-full flex items-center justify-center shrink-0 ${
                          feeSummary.partialBalance > 0
                            ? "bg-amber-100"
                            : "bg-emerald-100"
                        }`}
                      >
                        {feeSummary.partialBalance > 0 ? (
                          <AlertCircle size={16} className="text-amber-500" />
                        ) : (
                          <CheckCircle2
                            size={16}
                            className="text-emerald-500"
                          />
                        )}
                      </div>
                      <div>
                        <p
                          className={`text-xs font-bold ${
                            feeSummary.partialBalance > 0
                              ? "text-amber-700"
                              : "text-emerald-700"
                          }`}
                        >
                          {feeSummary.partialBalance > 0
                            ? "Carry-forward Balance"
                            : "No Pending Balance"}
                        </p>
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          Total Paid: ₹{feeSummary.totalPaid.toLocaleString()}{" "}
                          &nbsp;•&nbsp; Months: {feeSummary.paidMonthsCount}/12
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className={`font-brand font-bold text-lg leading-none ${
                          feeSummary.partialBalance > 0
                            ? "text-amber-600"
                            : "text-emerald-600"
                        }`}
                      >
                        ₹{feeSummary.partialBalance.toLocaleString()}
                      </p>
                      <p
                        className={`text-[9px] font-semibold uppercase tracking-wider mt-0.5 ${
                          feeSummary.partialBalance > 0
                            ? "text-amber-400"
                            : "text-emerald-400"
                        }`}
                      >
                        {feeSummary.partialBalance > 0
                          ? "Pending"
                          : "All Clear"}
                      </p>
                    </div>
                  </div>
                )}
              {summaryLoading && (
                <div className="rounded-xl border border-gray-100 px-4 py-3 shrink-0 bg-gray-50 flex items-center gap-2">
                  <div className="size-4 border-2 border-cta/30 border-t-cta rounded-full animate-spin shrink-0"></div>
                  <p className="text-xs text-gray-400">
                    Loading fee summary...
                  </p>
                </div>
              )}

              {!studentFeeStructure ? (
                <div className="bg-rose-50 text-rose-600 p-4 rounded-xl border border-rose-100 flex items-center gap-3 shrink-0">
                  <AlertCircle size={18} />
                  <div>
                    <h4 className="font-bold text-xs">
                      No Fee Structure Found
                    </h4>
                    <p className="text-[11px] mt-0.5">
                      Please create a fee structure for Class{" "}
                      {selectedStudent.className} first.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-3 pb-1">
                  {/* Months */}
                  <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4 shrink-0">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <h3 className="font-brand font-semibold text-navy text-xs">
                          Monthly Tuition
                        </h3>
                        <button
                          onClick={toggleFullYear}
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full transition-all uppercase tracking-wider border ${isFullYearSelected ? "bg-cta text-white border-cta" : "bg-cta/5 text-cta border-cta/20 hover:bg-cta hover:text-white"}`}
                        >
                          {isFullYearSelected
                            ? "Deselect Full Year"
                            : "Select Full Year"}
                        </button>
                      </div>
                      <span className="text-xs font-mono font-bold text-cta">
                        ₹{studentFeeStructure.monthlyTuition}/mo
                      </span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                      {ALL_MONTHS.map((month) => {
                        const isPaid = paidMonths.includes(month);
                        const isSelected = selectedMonths.includes(month);
                        return (
                          <button
                            key={month}
                            onClick={() => toggleMonth(month)}
                            disabled={isPaid}
                            className={`relative py-2 rounded-lg text-xs font-medium transition-all border outline-none ${isPaid ? "bg-emerald-50 border-emerald-100 text-emerald-700 cursor-not-allowed" : isSelected ? "bg-cta text-white border-cta shadow-sm ring-1 ring-cta/20" : "bg-white text-gray-600 border-gray-200 hover:border-cta/50 hover:bg-gray-50"}`}
                          >
                            <div className="text-center truncate">
                              {month.slice(0, 3)}
                            </div>
                            {isPaid && (
                              <div className="absolute -top-1 -right-1 bg-emerald-500 text-white rounded-full p-0.5">
                                <Check size={8} strokeWidth={3} />
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Charges */}
                  {studentFeeStructure.annualCharges &&
                    studentFeeStructure.annualCharges.length > 0 && (
                      <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4 shrink-0">
                        <h3 className="font-brand font-semibold text-navy text-xs flex items-center gap-2 mb-3">
                          Annual / One-Time Charges
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(() => {
                            const paidCounts = {};
                            paidAnnualCharges.forEach((name) => {
                              paidCounts[name] = (paidCounts[name] || 0) + 1;
                            });

                            return studentFeeStructure.annualCharges.map(
                              (ac, idx) => {
                                const nameKey = ac.name.toLowerCase().trim();
                                const uniqueKey = `${ac.name}-${idx}`;

                                let isPaid = false;
                                if (paidCounts[nameKey] > 0) {
                                  isPaid = true;
                                  paidCounts[nameKey]--;
                                }

                                const isSelected =
                                  selectedAnnualCharges[uniqueKey] || false;
                                return (
                                  <label
                                    key={uniqueKey}
                                    className={`flex items-center gap-2 p-2.5 rounded-lg transition-all border cursor-pointer ${isPaid ? "bg-emerald-50 border-emerald-100 cursor-not-allowed" : isSelected ? "bg-cta/5 border-cta/30 ring-1 ring-cta/20" : "bg-white border-gray-100 hover:border-gray-300"}`}
                                  >
                                    <div
                                      className={`size-4 rounded border flex items-center justify-center shrink-0 transition-all ${isPaid ? "bg-emerald-500 border-emerald-500" : isSelected ? "bg-cta border-cta" : "bg-white border-gray-300"}`}
                                    >
                                      {(isPaid || isSelected) && (
                                        <Check
                                          size={10}
                                          className="text-white"
                                          strokeWidth={3}
                                        />
                                      )}
                                    </div>
                                    <span
                                      className={`flex-1 text-xs font-medium truncate ${isPaid ? "text-emerald-700" : isSelected ? "text-navy" : "text-gray-600"}`}
                                    >
                                      {ac.name}
                                    </span>
                                    {isPaid ? (
                                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded shrink-0">
                                        Paid
                                      </span>
                                    ) : (
                                      <span
                                        className={`font-mono text-xs font-bold shrink-0 ${isSelected ? "text-cta" : "text-gray-400"}`}
                                      >
                                        ₹{ac.amount}
                                      </span>
                                    )}
                                    <input
                                      type="checkbox"
                                      className="hidden"
                                      checked={isSelected || isPaid}
                                      onChange={() =>
                                        !isPaid &&
                                        setSelectedAnnualCharges((prev) => ({
                                          ...prev,
                                          [uniqueKey]: !prev[uniqueKey],
                                        }))
                                      }
                                      disabled={isPaid}
                                    />
                                  </label>
                                );
                              },
                            );
                          })()}
                        </div>
                      </div>
                    )}

                  {/* Late Fee Section */}
                  <div className="bg-white rounded-xl shadow-card border border-gray-100 p-4 shrink-0">
                    <div className="flex items-center justify-between gap-4">
                      <label
                        className={`flex-1 flex items-center gap-3 p-2 rounded-lg border transition-all cursor-pointer ${includeLateFee ? "bg-amber-50 border-amber-200 ring-1 ring-amber-100" : "bg-white border-gray-100 hover:border-gray-200"}`}
                      >
                        <div
                          className={`size-4 rounded border flex items-center justify-center shrink-0 transition-all ${includeLateFee ? "bg-amber-500 border-amber-500" : "bg-white border-gray-300"}`}
                        >
                          {includeLateFee && (
                            <Check
                              size={10}
                              className="text-white"
                              strokeWidth={3}
                            />
                          )}
                        </div>
                        <span className="text-xs font-semibold text-navy">
                          Late Fee / Fine
                        </span>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={includeLateFee}
                          onChange={() => setIncludeLateFee(!includeLateFee)}
                        />
                      </label>
                      <div className="w-32 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
                          ₹
                        </span>
                        <input
                          type="number"
                          value={lateFee}
                          onChange={(e) => {
                            setLateFee(e.target.value);
                            if (Number(e.target.value) > 0)
                              setIncludeLateFee(true);
                          }}
                          disabled={!includeLateFee}
                          placeholder="0"
                          className="w-full pl-6 pr-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs font-mono focus:outline-none focus:border-amber-300 focus:bg-white transition-all disabled:opacity-50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Payment Details (Moved from Panel 3 to here) */}
                  <div className="bg-white rounded-xl shadow-card p-4 border border-gray-100 shrink-0">
                    <h3 className="font-brand font-semibold text-navy text-xs mb-3 flex items-center gap-2">
                      Payment Details
                    </h3>
                    <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
                      Mode
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 mb-3">
                      {[
                        { mode: "Cash", Icon: IndianRupee },
                        { mode: "UPI", Icon: Smartphone },
                        { mode: "Cheque", Icon: Landmark },
                        { mode: "Card", Icon: CreditCard },
                      ].map(({ mode, Icon }) => (
                        <button
                          key={mode}
                          className={`flex flex-col items-center justify-center gap-1 py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${paymentMode === mode ? "bg-navy text-white border-navy shadow-sm" : "bg-white text-gray-500 border-gray-200 hover:border-gray-300"}`}
                          onClick={() => setPaymentMode(mode)}
                        >
                          <Icon size={14} />
                          {mode}
                        </button>
                      ))}
                    </div>
                    {(paymentMode === "UPI" || paymentMode === "Cheque") && (
                      <div className="mb-3">
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                          {paymentMode === "UPI"
                            ? "UTR / Ref No"
                            : "Cheque No + Bank"}
                        </label>
                        <input
                          type="text"
                          value={refDetails}
                          onChange={(e) => setRefDetails(e.target.value)}
                          placeholder="Enter details"
                          className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:bg-white transition-colors"
                        />
                      </div>
                    )}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                          Date
                        </label>
                        <CustomDatePicker
                          selected={feeDate}
                          onChange={(val) => {
                            if (val) {
                              setFeeDate(val);
                            }
                          }}
                          maxDate={new Date()}
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                          Discount ₹
                        </label>
                        <input
                          type="number"
                          value={discount}
                          onChange={(e) => setDiscount(e.target.value)}
                          placeholder="0"
                          className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-cta focus:bg-white transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                          Custom ₹
                        </label>
                        <input
                          type="number"
                          value={customAmount}
                          onChange={(e) => {
                            const val = Number(e.target.value);
                            if (
                              feeSummary &&
                              feeSummary.remaining !== undefined &&
                              val > feeSummary.remaining
                            ) {
                              setCustomAmount(feeSummary.remaining);
                              showToast(
                                "warning",
                                `Amount cannot exceed remaining balance (₹${feeSummary.remaining.toLocaleString()})`,
                              );
                            } else {
                              setCustomAmount(e.target.value);
                            }
                          }}
                          placeholder={`₹${calculatedBreakdown.total}`}
                          className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-cta focus:bg-white transition-colors"
                        />
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1 block">
                        Remarks
                      </label>
                      <input
                        type="text"
                        value={remarks}
                        onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Optional notes"
                        className="w-full px-2.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:bg-white transition-colors"
                      />
                    </div>
                  </div>

                  {/* Recent Transactions */}
                  <div className="bg-white rounded-xl shadow-card p-4 border border-gray-100 shrink-0">
                    <h3 className="font-brand font-semibold text-navy text-xs mb-3 flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-cta inline-block"></span>
                      Recent Transactions
                      {studentCollections.length > 0 && (
                        <span className="ml-auto text-[9px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                          {studentCollections.length}
                        </span>
                      )}
                    </h3>
                    <div className="space-y-2">
                      {studentCollections.length === 0 ? (
                        <div className="text-center py-4 border-2 border-dashed border-gray-50 rounded-xl">
                          <p className="text-[10px] text-gray-400 italic">
                            No past collections found
                          </p>
                        </div>
                      ) : (
                        studentCollections.slice(0, 8).map((c) => {
                          const isExpanded = expandedTxn === c._id;
                          const modeLabel =
                            c.mode === "BANK_TRANSFER"
                              ? "Cheque"
                              : c.mode === "CASH"
                                ? "Cash"
                                : c.mode;
                          return (
                            <div
                              key={c._id}
                              className={`rounded-xl border transition-all overflow-hidden ${isExpanded ? "border-cta/30 shadow-sm" : "border-gray-100"}`}
                            >
                              {/* Row Header */}
                              <div
                                className={`flex items-center justify-between p-2.5 cursor-pointer group transition-colors ${isExpanded ? "bg-cta/5" : "bg-gray-50 hover:bg-gray-100"}`}
                                onClick={() =>
                                  setExpandedTxn(isExpanded ? null : c._id)
                                }
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`size-5 rounded-md flex items-center justify-center text-[8px] font-bold transition- ${isExpanded ? "bg-cta text-white rotate-90" : "bg-gray-200 text-gray-500"}`}
                                  >
                                    ▶
                                  </div>
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] font-bold text-navy">
                                      {c.receiptNo}
                                    </span>
                                    <span className="text-[9px] text-gray-500 font-medium">
                                      {new Date(
                                        c.date || c.createdAt,
                                      ).toLocaleDateString("en-IN")}{" "}
                                      • {modeLabel}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-[11px] font-bold text-navy">
                                    ₹{c.amount.toLocaleString()}
                                  </span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDelete(c._id, c.receiptNo);
                                    }}
                                    className="p-1.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                                  >
                                    <X size={12} />
                                  </button>
                                </div>
                              </div>

                              {/* Expanded Fee Breakdown */}
                              {isExpanded && (
                                <div className="bg-white border-t border-gray-100 px-3 py-2.5">
                                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                                    Fee Breakdown
                                  </p>
                                  <div className="space-y-1">
                                    {/* Period */}
                                    {c.period && (
                                      <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-gray-500">
                                          Period
                                        </span>
                                        <span className="font-medium text-navy text-right max-w-[60%] truncate">
                                          {c.period}
                                        </span>
                                      </div>
                                    )}
                                    {/* Fee Heads */}
                                    {c.feeHeads && c.feeHeads.length > 0 ? (
                                      c.feeHeads.map((fh, idx) => (
                                        <div
                                          key={idx}
                                          className="flex justify-between items-center text-[10px]"
                                        >
                                          <span className="text-gray-500 truncate flex-1 mr-2">
                                            {fh.head}
                                          </span>
                                          <span className="font-mono font-semibold text-navy shrink-0">
                                            ₹
                                            {Number(fh.amount).toLocaleString()}
                                          </span>
                                        </div>
                                      ))
                                    ) : (
                                      <div className="flex justify-between items-center text-[10px]">
                                        <span className="text-gray-500">
                                          Fee
                                        </span>
                                        <span className="font-mono font-semibold text-navy">
                                          ₹{c.amount.toLocaleString()}
                                        </span>
                                      </div>
                                    )}
                                    {/* Discount */}
                                    {c.discountAmount > 0 && (
                                      <div className="flex justify-between items-center text-[10px] text-emerald-600">
                                        <span className="italic">Discount</span>
                                        <span className="font-mono font-medium">
                                          -₹
                                          {Number(
                                            c.discountAmount,
                                          ).toLocaleString()}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {/* Total row */}
                                  <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-dashed border-gray-200">
                                    <span className="text-[10px] font-bold text-navy uppercase tracking-wide">
                                      Total Paid
                                    </span>
                                    <span className="font-mono text-[11px] font-bold text-cta">
                                      ₹{c.amount.toLocaleString()}
                                    </span>
                                  </div>
                                  {/* Remarks */}
                                  {c.remarks && (
                                    <p className="text-[9px] text-gray-400 italic mt-1">
                                      Remarks: {c.remarks}
                                    </p>
                                  )}
                                  {/* Ref */}
                                  {c.refDetails && (
                                    <p className="text-[9px] text-gray-400 italic">
                                      Ref: {c.refDetails}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PANEL 3: BREAKDOWN */}
        {selectedStudent && studentFeeStructure && (
          <div className="w-[320px] shrink-0 flex flex-col gap-3">
            <div className="bg-navy rounded-xl p-px shrink-0 sticky top-0">
              <div className="bg-white rounded-xl p-4">
                <h3 className="font-brand font-semibold text-navy text-xs flex items-center gap-2 mb-3">
                  Fee Breakdown
                </h3>
                <div className="space-y-2 mb-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500">
                      Tuition ({selectedMonths.length}mo × ₹
                      {calculatedBreakdown.monthlyFee})
                    </span>
                    <span className="font-mono font-semibold text-navy">
                      ₹{calculatedBreakdown.tuitionTotal.toLocaleString()}
                    </span>
                  </div>
                  {calculatedBreakdown.charges.map((c) => (
                    <div
                      key={c.name}
                      className="flex justify-between items-center"
                    >
                      <span className="text-gray-500 truncate flex-1 mr-2">
                        {c.name}
                      </span>
                      <span className="font-mono font-semibold text-navy shrink-0">
                        ₹{c.amount.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  {calculatedBreakdown.lateFee > 0 && (
                    <div className="flex justify-between items-center text-amber-600">
                      <span className="truncate flex-1 mr-2 italic">
                        Late Fee / Fine
                      </span>
                      <span className="font-mono font-semibold shrink-0">
                        ₹{calculatedBreakdown.lateFee.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {calculatedBreakdown.carryForwardBalance > 0 && (
                    <div className="flex justify-between items-center text-amber-600 mt-1.5 pt-1.5 border-t border-dashed border-amber-100">
                      <span className="truncate flex-1 mr-2 font-medium">
                        Previous Dues (Carry-forward)
                      </span>
                      <span className="font-mono font-bold shrink-0">
                        ₹
                        {calculatedBreakdown.carryForwardBalance.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="border-t border-dashed border-gray-200 pt-2 mb-3">
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-semibold text-gray-700">
                      Subtotal
                    </span>
                    <span className="font-mono font-semibold text-navy">
                      ₹{calculatedBreakdown.subtotal.toLocaleString()}
                    </span>
                  </div>
                  {calculatedBreakdown.scholarshipTotal > 0 && (
                    <div className="flex justify-between items-center text-[11px] text-teal-600 mb-1">
                      <span className="flex items-center gap-1 font-medium italic">
                        <Tag size={10} /> Scholarship Applied
                      </span>
                      <span className="font-mono font-bold">
                        -₹
                        {calculatedBreakdown.scholarshipTotal.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {calculatedBreakdown.manualDiscount > 0 && (
                    <div className="flex justify-between items-center text-[11px] text-emerald-600">
                      <span className="italic">Manual Discount</span>
                      <span className="font-mono font-bold">
                        -₹{calculatedBreakdown.manualDiscount.toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-3 flex items-center justify-between border border-gray-100 mb-4">
                  <span className="font-brand font-bold text-navy text-xs uppercase tracking-wide">
                    Total Payable
                  </span>
                  <span className="font-brand font-bold text-xl text-cta">
                    ₹{calculatedBreakdown.total.toLocaleString()}
                  </span>
                </div>
                <button
                  className="w-full py-3 bg-cta text-white rounded-xl text-sm font-bold tracking-wide hover:bg-cta-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-cta/20 flex justify-center items-center gap-2"
                  onClick={handleCollect}
                  disabled={submitting || calculatedBreakdown.subtotal <= 0}
                >
                  {submitting
                    ? "Processing..."
                    : `Collect ₹${totalAmount.toLocaleString()} & Print`}
                </button>
                {/* After this payment: show current session shortfall only */}
                {calculatedBreakdown.subtotal > 0 &&
                  totalAmount < calculatedBreakdown.total && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-gray-500">Remaining Balance</span>
                        <span className="font-mono font-bold text-amber-500">
                          ₹
                          {(
                            calculatedBreakdown.total - totalAmount
                          ).toLocaleString()}{" "}
                          pending
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RECEIPT MODAL */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-navy/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/80 sticky top-0 z-10">
              <h2 className="text-sm font-bold text-navy font-brand tracking-wide uppercase">
                {receipt ? "Receipt Generated" : "Review Payment Slip"}
              </h2>
              <button
                className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors text-gray-500"
                onClick={() => setShowReceiptModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6 bg-gray-100 flex-1 overflow-y-auto custom-scrollbar flex justify-center min-h-0">
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
                className="bg-white mx-auto shadow-2xl fee-receipt-print border border-gray-100 min-h-fit"
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
                    className="receipt-copy bg-white"
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
                      <div className="size-20 rounded flex items-center justify-center shrink-0">
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
                          <br /> Session:{" "}
                          {selectedStudent?.academicYear || "2026-2027"}
                        </p>
                      </div>
                      <div className="w-20"></div>
                    </div>
                    {/* Title */}
                    <h2 className="text-center font-brand font-bold text-[11px] text-navy mb-1 uppercase tracking-widest">
                      Fee Receipt
                    </h2>
                    {/* Receipt No & Date */}
                    <div className="flex justify-between mb-2 text-[10px] font-medium">
                      <span className="font-mono bg-gray-50 px-1.5 py-0.5 border border-gray-100 rounded">
                        No:{" "}
                        <span className="font-bold text-navy">
                          {receipt?.receiptNo || "DRAFT"}
                        </span>
                      </span>
                      <span className="bg-gray-50 px-1.5 py-0.5 border border-gray-100 rounded">
                        Date:{" "}
                        {receipt?.date
                          ? new Date(receipt.date).toLocaleDateString("en-IN")
                          : new Date(feeDate).toLocaleDateString("en-IN")}
                      </span>
                    </div>
                    {/* Student Info */}
                    <div className="mb-1 text-[9px] border border-gray-200 rounded p-1.5 bg-gray-50/50">
                      <div className="grid grid-cols-2 gap-y-0.5">
                        <div>
                          <span className="text-gray-500">Student Name:</span>{" "}
                          <strong className="text-navy">
                            {selectedStudent?.name?.toUpperCase()}
                          </strong>
                        </div>
                        <div>
                          <span className="text-gray-500">Student ID:</span>{" "}
                          <strong className="text-navy">
                            {selectedStudent?.studentId}
                          </strong>
                        </div>
                        <div>
                          <span className="text-gray-500">Class:</span>{" "}
                          <strong className="text-navy">
                            {selectedStudent?.cls}
                          </strong>
                        </div>
                        <div>
                          <span className="text-gray-500">Father's Name:</span>{" "}
                          <strong className="text-navy">
                            {selectedStudent?.father}
                          </strong>
                        </div>
                      </div>
                      <div className="mt-0.5 pt-0.5 border-t border-gray-200">
                        <span className="text-gray-500">Fee Period:</span>{" "}
                        <strong className="text-navy ml-1">
                          {receipt?.period ||
                            (selectedMonths.length > 0
                              ? selectedMonths.join(", ")
                              : "Annual Charges")}
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
                        {(
                          receipt?.feeHeads || [
                            ...(selectedMonths.length > 0
                              ? [
                                  {
                                    head: "Tuition Fee",
                                    amount: calculatedBreakdown.tuitionTotal,
                                  },
                                ]
                              : []),
                            ...calculatedBreakdown.charges.map((c) => ({
                              head: c.name,
                              amount: c.amount,
                            })),
                            ...(calculatedBreakdown.lateFee > 0
                              ? [
                                  {
                                    head: "Late Fee / Fine",
                                    amount: calculatedBreakdown.lateFee,
                                  },
                                ]
                              : []),
                            ...(calculatedBreakdown.carryForwardBalance > 0
                              ? [
                                  {
                                    head: "Previous Dues (Carry-forward)",
                                    amount:
                                      calculatedBreakdown.carryForwardBalance,
                                  },
                                ]
                              : []),
                          ]
                        ).map((fh, idx) => (
                          <tr key={idx} className="border-b border-gray-100">
                            <td className="py-1 px-2">{fh.head}</td>
                            <td className="text-right py-1 px-2 font-mono">
                              ₹{fh.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                        {(receipt?.discountAmount ||
                          calculatedBreakdown.discount) > 0 && (
                          <tr className="border-b border-gray-100 bg-emerald-50/50">
                            <td className="py-1 px-2 text-emerald-700 italic">
                              Discount Applied
                            </td>
                            <td className="text-right py-1 px-2 text-emerald-700 font-mono">
                              -₹
                              {(
                                receipt?.discountAmount ||
                                calculatedBreakdown.discount
                              ).toLocaleString()}
                            </td>
                          </tr>
                        )}
                        <tr className="bg-gray-50">
                          <td className="py-1.5 px-2 font-bold text-navy text-[11px] uppercase">
                            Total Paid
                          </td>
                          <td className="text-right py-1.5 px-2 font-bold text-[11px] text-navy font-mono">
                            ₹{(receipt?.amount || totalAmount).toLocaleString()}
                          </td>
                        </tr>
                        {(receipt
                          ? Math.max(
                              0,
                              (receipt.amountDue || 0) - (receipt.amount || 0),
                            )
                          : Math.max(
                              0,
                              calculatedBreakdown.total - totalAmount,
                            )) > 0 && (
                          <tr className="bg-amber-50/60">
                            <td className="py-1.5 px-2 font-bold text-amber-700 text-[10px] uppercase border-t border-amber-100">
                              Remaining Balance
                            </td>
                            <td className="text-right py-1.5 px-2 font-bold text-[10px] text-amber-700 font-mono border-t border-amber-100">
                              ₹
                              {(receipt
                                ? Math.max(
                                    0,
                                    (receipt.amountDue || 0) -
                                      (receipt.amount || 0),
                                  )
                                : Math.max(
                                    0,
                                    calculatedBreakdown.total - totalAmount,
                                  )
                              ).toLocaleString()}{" "}
                              pending
                            </td>
                          </tr>
                        )}
                        <tr>
                          <td
                            colSpan="2"
                            className="text-[9px] text-gray-500 py-1 px-2 italic bg-white"
                          >
                            Payment Mode:{" "}
                            <strong>
                              {receipt?.mode?.toUpperCase() ||
                                paymentMode.toUpperCase()}
                            </strong>
                            {receipt?.refDetails || refDetails
                              ? ` | Ref: ${receipt?.refDetails || refDetails}`
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
                onClick={() => {
                  setShowReceiptModal(false);
                  setReceipt(null);
                }}
              >
                Cancel
              </button>
              {!receipt && (
                <button
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-cta text-white rounded-xl text-sm font-bold hover:bg-cta-dark transition-colors shadow-lg shadow-cta/20"
                  onClick={handleConfirmPayment}
                >
                  <Check size={18} />{" "}
                  {submitting ? "Confirming..." : "Confirm & Collect Fees"}
                </button>
              )}
              {receipt && (
                <button
                  className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-xl text-sm font-bold hover:bg-cta-dark transition-colors shadow-sm disabled:opacity-60"
                  onClick={async () => {
                    try {
                      await api.fees.printReceipt(receipt._id);
                    } catch {
                      showToast(
                        "error",
                        "Print karne mein problem aayi. Dobara try karein.",
                      );
                    }
                  }}
                >
                  <Printer size={16} /> Print Receipt
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
