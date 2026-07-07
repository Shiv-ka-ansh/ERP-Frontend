import React, { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  Filter,
  Download,
  Trash2,
  Edit2,
  TrendingUp,
  IndianRupee,
  Wallet,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useAppContext } from "../context/AppContext";
import CustomSelect from "../components/ui/CustomSelect";
import CustomDatePicker from "../components/ui/CustomDatePicker";
import { api } from "../api/client";

// For simplified PDF export if needed or just CSV matching PRD requirements
const EXPENSE_CATEGORIES = [
  "Teacher Salary",
  "Staff Salary",
  "Electricity",
  "Water",
  "Maintenance",
  "Stationery",
  "Furniture",
  "Events",
  "Transport",
  "Rent",
  "Govt Fees",
  "Miscellaneous",
];

const PAYMENT_MODES = ["Cash", "UPI", "Cheque", "Bank Transfer"];

export default function Expenses() {
  const { showToast, showConfirm } = useAppContext();

  const [expenses, setExpenses] = useState([]);
  const [fees, setFees] = useState([]); // For income

  const [showModal, setShowModal] = useState(false);
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7),
  ); // YYYY-MM
  const [filterCategory, setFilterCategory] = useState("All");

  const [formData, setFormData] = useState({
    date: new Date(), // CustomDatePicker expects a Date object
    amount: "",
    category: "Miscellaneous",
    description: "",
    paymentMode: "Cash",
    vendor: "",
    billNo: "",
  });

  const loadData = async () => {
    try {
      const [expRes, feeRes] = await Promise.all([
        api.expenses.list(),
        api.fees.collections(),
      ]);

      const expData = (expRes?.data || []).map((e) => ({
        ...e,
        id: e._id,
        date: e.date ? new Date(e.date).toISOString().slice(0, 10) : "",
      }));
      const feeData = (feeRes?.data || []).map((f) => ({
        ...f,
        id: f._id,
        date: f.date ? new Date(f.date).toISOString().slice(0, 10) : "",
      }));

      setExpenses(expData.sort((a, b) => new Date(b.date) - new Date(a.date)));
      setFees(feeData);
    } catch {
      showToast("error", "Failed to load financial data");
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const eMonth = e.date.substring(0, 7);
      const matchMonth = filterMonth ? eMonth === filterMonth : true;
      const matchCat =
        filterCategory === "All" || e.category === filterCategory;
      return matchMonth && matchCat;
    });
  }, [expenses, filterMonth, filterCategory]);

  // Summaries
  const totalExpense = filteredExpenses.reduce(
    (sum, e) => sum + Number(e.amount),
    0,
  );

  // Calculate income for the filtered month
  const totalIncome = fees
    .filter((f) => f.date && f.date.substring(0, 7) === filterMonth)
    .reduce((sum, f) => sum + Number(f.amount), 0);
  const netSurplus = totalIncome - totalExpense;

  const handleSaveExpense = async () => {
    if (!formData.amount || !formData.date || !formData.category) {
      showToast("error", "Date, Amount and Category are required");
      return;
    }
    try {
      const modeMap = {
        Cash: "CASH",
        UPI: "UPI",
        Cheque: "BANK_TRANSFER",
        "Bank Transfer": "BANK_TRANSFER",
      };

      const expenseDate =
        formData.date instanceof Date ? formData.date : new Date(formData.date);

      await api.expenses.create({
        date: expenseDate.toISOString().slice(0, 10),
        amount: Number(formData.amount),
        category: formData.category,
        description: formData.description,
        paymentMode: modeMap[formData.paymentMode] || "CASH",
        vendor: formData.vendor,
        billNo: formData.billNo || "",
      });
      showToast("success", "Expense recorded successfully");
      setShowModal(false);
      setFormData({
        date: new Date(),
        amount: "",
        category: "Miscellaneous",
        description: "",
        paymentMode: "Cash",
        vendor: "",
        billNo: "",
      });
      loadData();
    } catch (err) {
      console.error("Save expense error:", err);
      showToast("error", "Failed to save expense");
    }
  };

  const handleDelete = (id) => {
    showConfirm("Delete this expense record?", async () => {
      await api.expenses.remove(id);
      showToast("success", "Expense deleted");
      loadData();
    });
  };

  const handleExport = () => {
    const headers = [
      "Date",
      "Category",
      "Description",
      "Amount",
      "Payment Mode",
      "Vendor",
      "Bill/Invoice No",
    ];
    const rows = filteredExpenses.map((e) => [
      e.date.split("-").reverse().join("/"),
      e.category,
      e.description || "",
      e.amount,
      e.paymentMode,
      e.vendor || "",
      e.billNo || "",
    ]);

    const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Expenses");
    XLSX.writeFile(workbook, `school_expenses_${filterMonth}.xlsx`);

    showToast("success", "Expenses exported to Excel");
  };

  return (
    <div className="min-h-screen">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-navy font-brand flex items-center gap-2">
          <Wallet size={24} className="text-cta" /> School Expenses & P&L
        </h1>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 border border-cta text-cta rounded-lg text-sm font-medium hover:bg-cta/10 transition-colors"
          >
            <Download size={18} /> Export Excel
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors"
          >
            <Plus size={18} /> Add Expense
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-card p-4 mb-6 flex items-end gap-4">
        <div className="flex flex-col gap-1 w-48">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Month
          </label>
          <CustomDatePicker
            selected={new Date(`${filterMonth}-01`)}
            onChange={(date) => {
              const d = date instanceof Date ? date : new Date(date);
              setFilterMonth(d.toISOString().slice(0, 7));
            }}
            dateFormat="MM/yyyy"
            showMonthYearPicker
          />
        </div>
        <div className="flex flex-col gap-1 w-64">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Category
          </label>
          <CustomSelect
            value={filterCategory}
            onChange={setFilterCategory}
            options={["All", ...EXPENSE_CATEGORIES]}
          />
        </div>
        <button className="h-[38px] w-[38px] shrink-0 flex items-center justify-center border border-gray-200 text-gray-500 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter size={18} />
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Category & Desc
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Vendor/Bill
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Mode
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-400"
                  >
                    No expenses found for selected filters.
                  </td>
                </tr>
              )}
              {filteredExpenses.map((e) => (
                <tr
                  key={e.id}
                  className="border-b border-gray-50 hover:bg-gray-50"
                >
                  <td className="px-6 py-4 text-gray-600 font-mono text-xs">
                    {e.date.split("-").reverse().join("/")}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-brand font-semibold text-navy">
                      {e.category}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {e.description || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-gray-700 text-xs">
                      {" "}
                      {e.vendor || "N/A"}
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-600 text-xs mt-1">
                      {" "}
                      {e.billNo ? `Bill: ${e.billNo}` : "No Bill Info"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-[10px] font-medium uppercase tracking-wider">
                      {e.paymentMode}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-mono font-bold text-cta text-base">
                    ₹{e.amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="p-1.5 text-gray-400 hover:text-cta hover:bg-cta/10 rounded-lg transition-colors"
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

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex flex-col items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-modal w-full max-w-lg max-h-screen overflow-y-auto">
            <div className="p-6 bg-navy text-white rounded-t-2xl flex items-center justify-between">
              <h3 className="font-brand font-semibold">Record Expense</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Date *
                  </label>
                  <CustomDatePicker
                    selected={formData.date}
                    onChange={(date) => setFormData({ ...formData, date })}
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg font-mono text-lg text-cta font-bold focus:outline-none focus:border-cta"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 mb-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Category *
                </label>
                <CustomSelect
                  value={formData.category}
                  onChange={(val) =>
                    setFormData({ ...formData, category: val })
                  }
                  options={EXPENSE_CATEGORIES}
                />
              </div>

              <div className="flex flex-col gap-1 mb-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Description
                </label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta resize-none"
                  placeholder="Details about this expense..."
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Payment Mode
                  </label>
                  <CustomSelect
                    value={formData.paymentMode}
                    onChange={(val) =>
                      setFormData({ ...formData, paymentMode: val })
                    }
                    options={PAYMENT_MODES}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Bill/Invoice Number
                  </label>
                  <input
                    type="text"
                    value={formData.billNo}
                    onChange={(e) =>
                      setFormData({ ...formData, billNo: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-cta"
                    placeholder="Optional"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 mb-6">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  Vendor/Payee Name
                </label>
                <input
                  type="text"
                  value={formData.vendor}
                  onChange={(e) =>
                    setFormData({ ...formData, vendor: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
                  placeholder="Optional"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveExpense}
                  className="flex-[2] px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors"
                >
                  Save Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
