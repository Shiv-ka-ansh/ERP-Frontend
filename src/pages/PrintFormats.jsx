import React, { useState } from "react";
import { useNavigate } from 'react-router-dom';
import { FileText, CheckCircle } from "lucide-react";
import { api } from "../api/client";
import { useAppContext } from "../context/AppContext";

export default function PrintFormats() {
 const navigate = useNavigate();
 const { showToast } = useAppContext();
 const [receiptFormat, setReceiptFormat] = useState("a4");
 const [reportCardFormat, setReportCardFormat] = useState("term");
 const [saving, setSaving] = useState(false);

 const handleSave = async () => {
 setSaving(true);
 try {
 await api.settings.upsert("printFormats", {
 receiptFormat,
 reportCardFormat,
 });
 showToast("success", "Print settings saved");
 } catch {
 showToast("error", "Failed to save print settings");
 } finally {
 setSaving(false);
 }
 };

 return (
 <div className="min-h-screen">
 <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-4 transition-colors">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg> Back
 </button>
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-xl font-bold text-navy font-brand">
 Print Formats & Templates
 </h1>
 <button
 onClick={handleSave}
 disabled={saving}
 className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark disabled:opacity-50 transition-colors"
 >
 <CheckCircle size={18} /> {saving ? "Saving..." : "Save Settings"}
 </button>
 </div>

 <div className="bg-white rounded-xl shadow-card p-6 mb-6">
 <h2 className="font-brand font-semibold text-navy text-lg mb-4">
 Receipt Formats
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div
 onClick={() => setReceiptFormat("a4")}
 className={`p-4 border-2 rounded-xl cursor-pointer hover:shadow-md transition-shadow ${receiptFormat === "a4" ? "border-teal bg-gray-50" : "border-gray-200"}`}
 >
 <h3
 className={`font-brand flex items-center gap-2 mb-2 ${receiptFormat === "a4" ? "text-teal" : ""}`}
 >
 <FileText size={16} /> A4 Standard Receipt
 </h3>
 <p className="text-gray-500 text-sm">
 Full page receipt with complete school header and watermark.
 </p>
 </div>
 <div
 onClick={() => setReceiptFormat("thermal")}
 className={`p-4 border-2 rounded-xl cursor-pointer hover:shadow-md transition-shadow ${receiptFormat === "thermal" ? "border-teal bg-gray-50" : "border-gray-200"}`}
 >
 <h3
 className={`font-brand flex items-center gap-2 mb-2 ${receiptFormat === "thermal" ? "text-teal" : ""}`}
 >
 <FileText size={16} /> Thermal Print (80mm)
 </h3>
 <p className="text-gray-500 text-sm">
 Compact layout for POS thermal printers.
 </p>
 </div>
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-card p-6">
 <h2 className="font-brand font-semibold text-navy text-lg mb-4">
 Report Card Formats
 </h2>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <div
 onClick={() => setReportCardFormat("term")}
 className={`p-4 border-2 rounded-xl cursor-pointer hover:shadow-md transition-shadow ${reportCardFormat === "term" ? "border-teal bg-gray-50" : "border-gray-200"}`}
 >
 <h3
 className={`font-brand flex items-center gap-2 mb-2 ${reportCardFormat === "term" ? "text-teal" : ""}`}
 >
 <FileText size={16} /> Term-wise Comprehensive
 </h3>
 <p className="text-gray-500 text-sm">
 Detailed report card with scholastic and co-scholastic grades.
 </p>
 </div>
 <div
 onClick={() => setReportCardFormat("simple")}
 className={`p-4 border-2 rounded-xl cursor-pointer hover:shadow-md transition-shadow ${reportCardFormat === "simple" ? "border-teal bg-gray-50" : "border-gray-200"}`}
 >
 <h3
 className={`font-brand flex items-center gap-2 mb-2 ${reportCardFormat === "simple" ? "text-teal" : ""}`}
 >
 <FileText size={16} /> Simple Marksheet
 </h3>
 <p className="text-gray-500 text-sm">
 Basic subject-wise marksheet layout.
 </p>
 </div>
 </div>
 </div>
 </div>
 );
}
