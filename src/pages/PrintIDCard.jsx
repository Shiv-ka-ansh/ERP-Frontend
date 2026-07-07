import React, { useState, useEffect } from "react";
import { Printer, Download, User, Loader2, AlertCircle } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAppContext } from "../context/AppContext";

export default function PrintIDCard() {
 const { id } = useParams();
 const navigate = useNavigate();
 const { schoolInfo } = useAppContext();
 const [student, setStudent] = useState(null);
 const [loading, setLoading] = useState(true);
 const [logoError, setLogoError] = useState(false);

 useEffect(() => {
   if (schoolInfo?.logoUrl) {
     const img = new Image();
     img.src = schoolInfo.logoUrl;
     img.onload = () => setLogoError(false);
     img.onerror = () => setLogoError(true);
   } else {
     setLogoError(true);
   }
 }, [schoolInfo?.logoUrl]);

 useEffect(() => {
 const fetchStudent = async () => {
 try {
 const res = await api.students.byId(id);
 const s = res?.data || res;
 setStudent({
 name: `${s.firstName || ""} ${s.lastName || ""}`.trim(),
 className: s.currentClass,
 section: s.section,
 studentId: s.studentId || "",
 roll:
 s.rollNumber !== undefined && s.rollNumber !== null
 ? String(s.rollNumber).padStart(3, "0")
 : "",
 dob: s.dateOfBirth
 ? new Date(s.dateOfBirth).toISOString().slice(0, 10)
 : null,
 bloodGroup: s.bloodGroup || null,
 phone: s.primaryContactPhone || null,
 fatherName: s.fatherName || null,
 address: typeof s.address === 'object'
 ? `${s.address.street || s.address.fullAddress || ''}${s.address.city ? `, ${s.address.city}` : ''}`
 : (s.address || null),
 });
 } catch (err) {
 console.error("Error fetching student:", err);
 } finally {
 setLoading(false);
 }
 };
 fetchStudent();
 }, [id]);

 if (loading) {
 return (
 <div className="min-h-screen flex items-center justify-center flex-col gap-3">
 <Loader2 size={32} className="animate-spin text-cta" />
 <p className="text-gray-500 font-medium">Generating ID Card...</p>
 </div>
 );
 }

 if (!student) {
 return (
 <div className="min-h-screen flex items-center justify-center flex-col gap-4">
 <div className="size-16 bg-red-50 rounded-full flex items-center justify-center">
 <AlertCircle size={32} className="text-red-500" />
 </div>
 <div className="text-center">
 <h2 className="text-xl font-bold text-navy font-brand">
 Student Not Found
 </h2>
 <p className="text-gray-500 mt-1">
 Could not locate student with ID {id}
 </p>
 </div>
 <button
 onClick={() => navigate(-1)}
 className="px-6 py-2 bg-cta text-white rounded-lg font-medium hover:bg-cta-dark mt-2"
 >
 Go Back
 </button>
 </div>
 );
 }

 // Format date if it exists
 const formattedDOB = student.dob
 ? new Date(student.dob).toLocaleDateString("en-IN", {
 day: "2-digit",
 month: "2-digit",
 year: "numeric",
 })
 : "N/A";

 return (
 <div className="min-h-screen">
 <button
 className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy transition-colors mb-4"
 onClick={() => navigate(-1)}
 >
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg> Back
 </button>
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-xl font-bold text-navy font-brand">
 Student ID Card
 </h1>
 <p className="text-gray-400 text-sm">
 Student ID: {id} | Generating for 2026-27
 </p>
 </div>
 <div className="flex items-center gap-3">
 <button className="inline-flex items-center gap-2 px-4 py-2 border border-cta text-cta rounded-lg text-sm font-medium hover:bg-cta/10 transition-colors">
 <Download size={18} /> Export PDF
 </button>
 <button
 className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors"
 onClick={() => window.print()}
 >
 <Printer size={18} /> Print Card
 </button>
 </div>
 </div>

 <div className="flex flex-wrap justify-center gap-10 p-10 bg-gray-50 rounded-xl relative">
 {/* FRONT SIDE */}
 <div>
 <p className="text-center text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Front Side</p>
 <div
 className="id-card-54x86 relative overflow-hidden print:shadow-none print:break-inside-avoid shadow-card mx-auto"
 style={{
 borderRadius: 8,
 background: "linear-gradient(180deg, #0c1a2e 0%, #132240 40%, #162a50 100%)",
 boxShadow: "0 20px 50px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.08)",
 }}
 >
 {/* ─── HEADER ─── */}
 <div className="flex items-center gap-3 px-6 pt-6 pb-4 border-b border-white/5">
            <div
              className="shrink-0 flex items-center justify-center font-brand font-bold text-xs tracking-wider shadow-lg overflow-hidden"
              style={{ width: 52, height: 52, background: schoolInfo.logoUrl && !logoError ? "transparent" : "linear-gradient(135deg, #c8956c, #d4a574)", color: "#0c1a2e", borderRadius: 10 }}
            >
              {schoolInfo.logoUrl && !logoError ? (
                <img src={schoolInfo.logoUrl} alt="Logo" className="size-full object-contain" />
              ) : (
                <div className="size-full flex items-center justify-center rounded-full">School ERP</div>
              )}
            </div>
 <div className="flex flex-col">
 <h3 className="font-brand font-bold text-white text-[14px] leading-tight text-left">{schoolInfo.name}</h3>
 <span className="text-[10px] uppercase tracking-[0.15em] mt-0.5 text-left" style={{ color: "#8da4c2" }}>School City, State</span>
 </div>
 </div>
 {/* ─── RED BANNER ─── */}
 <div className="text-center py-[6px] text-[10px] font-bold uppercase tracking-[0.25em] text-white" style={{ background: "linear-gradient(90deg, #c0392b, #e74c3c, #c0392b)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.1)" }}>
 ● Identity Card • 2026–27 ●
 </div>
 {/* ─── PHOTO AREA ─── */}
 <div className="flex justify-center pt-6 pb-2">
 <div className="flex flex-col items-center justify-center overflow-hidden shadow-2xl" style={{ width: 100, height: 115, borderRadius: 12, border: "2px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.03)" }}>
 <User size={36} style={{ color: "#5a6f8a" }} />
 <span className="text-[10px] mt-2 font-medium" style={{ color: "#5a6f8a" }}>STUDENT</span>
 </div>
 </div>
 {/* ─── NAME & CLASS BADGE ─── */}
 <div className="text-center px-6 pb-3">
 <h4 className="font-brand font-bold text-white text-[18px] tracking-wide truncate" title={student.name}>{student.name.toUpperCase()}</h4>
 <div className="flex justify-center mt-2">
 <span className="inline-block text-[11px] font-semibold px-5 py-[4px] rounded-full tracking-wider" style={{ border: "1px solid rgba(255,255,255,0.2)", color: "#d4dae4", background: "rgba(255,255,255,0.08)" }}>
 {student.className}{student.section ? ` — Section ${student.section}` : ""}
 </span>
 </div>
 </div>
 {/* ─── DETAILS TABLE ─── */}
 <div className="px-6 pt-3 pb-2">
 <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }} className="pt-3">
 <table className="w-full text-[11px]" style={{ borderSpacing: "0 3px" }}>
 <tbody>
 {[
 ["STUDENT ID", student.studentId || "N/A", true],
 ["FATHER", student.fatherName || "N/A", false],
 ["D.O.B", formattedDOB, false],
 ["PHONE", student.phone || "N/A", false],
 ].map(([label, value, accent]) => (
 <tr key={label}>
 <td className="py-[3px] font-semibold uppercase tracking-widest" style={{ color: "#8da4c2", width: "45%" }}>{label}</td>
 <td className="py-[3px] text-right font-bold" style={{ color: accent ? "#d4a574" : "#e8ecf1" }}>{value}</td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 {/* ─── FOOTER ─── */}
 <div className="flex items-center justify-between px-6 py-[8px] mt-2" style={{ background: "linear-gradient(90deg, #c8b68e, #d4c49e)", borderRadius: "0 0 20px 20px" }}>
 <span className="text-[9px] font-semibold tracking-wide" style={{ color: "#3a2a12" }}>{schoolInfo.address}</span>
 <span className="text-[10px] font-black tracking-wider" style={{ color: "#1a1204" }}>{schoolInfo.phone}</span>
 </div>
 </div>
 </div>

 {/* BACK SIDE */}
 <div>
 <p className="text-center text-xs text-gray-400 font-semibold uppercase tracking-wider mb-3">Back Side</p>
 <div
 className="id-card-54x86 relative overflow-hidden print:shadow-none print:break-inside-avoid shadow-card mx-auto"
 style={{
 borderRadius: 8,
 background: "linear-gradient(180deg, #f8f6f3 0%, #ffffff 40%, #f4f1ed 100%)",
 boxShadow: "0 20px 50px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.08)",
 }}
 >
 {/* Back header bar */}
 <div className="text-center py-[8px] text-[10px] font-bold uppercase tracking-[0.25em]" style={{ background: "linear-gradient(90deg, #0c1a2e, #162a50, #0c1a2e)", color: "#c8b68e" }}>
 ● {schoolInfo.name.toUpperCase()} ●
 </div>

 <div className="px-6 pt-5 pb-3">
 {/* Emergency Contact */}
 <div className="mb-4">
 <h5 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Emergency Contact</h5>
 <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
 <p className="text-[11px] text-gray-700"><strong>Father:</strong> {student.fatherName || 'N/A'}</p>
 <p className="text-[11px] text-gray-700 mt-1"><strong>Phone:</strong> {student.phone || 'N/A'}</p>
 </div>
 </div>

 {/* Address */}
 <div className="mb-4">
 <h5 className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2">Address</h5>
 <p className="text-[10px] text-gray-600 leading-relaxed bg-gray-50 rounded-lg p-3 border border-gray-200">
 {student.address || 'N/A'}
 </p>
 </div>

 {/* Blood Group */}
 {student.bloodGroup && (
 <div className="flex items-center gap-2 mb-4">
 <span className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Blood Group:</span>
 <span className="inline-flex items-center px-3 py-1 bg-red-50 text-red-600 rounded-full text-[11px] font-bold border border-red-200">{student.bloodGroup}</span>
 </div>
 )}

 {/* Terms */}
 <div className="border-t border-dashed border-gray-300 pt-3 mt-3">
 <p className="text-[8px] text-gray-400 leading-relaxed">
 • This card is non-transferable.
 <br />• If found, please return to the school office.
 <br />• Session: 2026–27
 </p>
 </div>
 </div>

 {/* Principal Signature */}
 <div className="px-6 pb-2 mt-auto">
 <div className="flex justify-end">
 <div className="text-center">
 <div className="w-28 border-b border-gray-400 mb-1"></div>
 <p className="text-[9px] text-gray-500 font-semibold">Principal's Signature</p>
 </div>
 </div>
 </div>

 {/* Footer */}
 <div className="flex items-center justify-center px-6 py-[8px]" style={{ background: "linear-gradient(90deg, #c8b68e, #d4c49e)", borderRadius: "0 0 20px 20px" }}>
 <span className="text-[9px] font-bold tracking-wider" style={{ color: "#3a2a12" }}>{schoolInfo.phone} • {schoolInfo.address}</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}

