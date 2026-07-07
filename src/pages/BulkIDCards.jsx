import React, { useState, useMemo } from "react";
import {
  Printer,
  Download,
  User,
  Users,
  Filter,
  CreditCard,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import CustomSelect from "../components/ui/CustomSelect";

export default function BulkIDCards() {
  const navigate = useNavigate();
  const { students, schoolInfo } = useAppContext();
  const [selectedClass, setSelectedClass] = useState("All");
  const [selectedSection, setSelectedSection] = useState("All");

  const classes = useMemo(() => {
    const cls = [...new Set(students.map((s) => s.className))].sort();
    return ["All", ...cls];
  }, [students]);

  const sections = useMemo(() => {
    const secs = [
      ...new Set(
        students
          .filter(
            (s) => selectedClass === "All" || s.className === selectedClass,
          )
          .map((s) => s.section)
          .filter(Boolean),
      ),
    ].sort();
    return ["All", ...secs];
  }, [students, selectedClass]);

  const filteredStudents = useMemo(() => {
    return students
      .filter((s) => {
        if (selectedClass !== "All" && s.className !== selectedClass)
          return false;
        if (selectedSection !== "All" && s.section !== selectedSection)
          return false;
        return true;
      })
      .sort((a, b) => (a.roll || "").localeCompare(b.roll || ""));
  }, [students, selectedClass, selectedSection]);

  const formatDOB = (dob) => {
    if (!dob) return "N/A";
    return new Date(dob).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen pt-2">
      <button
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy transition-colors mb-4 print:hidden"
        onClick={() => navigate(-1)}
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
      {/* TOOLBAR — hidden on print */}
      <div className="flex items-center justify-between mb-6 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-navy font-brand flex items-center gap-2">
            <CreditCard size={24} className="text-cta" /> Bulk ID Card Generator
          </h1>
          <p className="text-gray-400 text-sm mt-0.5">
            Select a class to generate printable ID cards for all students at
            once
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors"
            onClick={() => window.print()}
            disabled={filteredStudents.length === 0}
          >
            <Printer size={18} /> Print All Cards ({filteredStudents.length})
          </button>
        </div>
      </div>

      {/* FILTERS — hidden on print */}
      <div className="bg-white rounded-xl shadow-card p-4 mb-6 flex flex-wrap gap-4 items-end print:hidden">
        <div className="flex flex-col gap-1 w-56">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Class
          </label>
          <CustomSelect
            value={selectedClass}
            onChange={(val) => {
              setSelectedClass(val);
              setSelectedSection("All");
            }}
            options={classes}
          />
        </div>
        <div className="flex flex-col gap-1 w-40">
          <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Section
          </label>
          <CustomSelect
            value={selectedSection}
            onChange={setSelectedSection}
            options={sections}
          />
        </div>
        <div className="flex items-center gap-2 ml-auto bg-gray-50 px-4 py-2 rounded-lg">
          <Users size={16} className="text-gray-400" />
          <span className="text-sm font-medium text-navy">
            {filteredStudents.length} Students
          </span>
        </div>
      </div>

      {/* EMPTY STATE */}
      {filteredStudents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 print:hidden">
          <Filter size={48} className="text-gray-300 mb-4" />
          <h3 className="font-brand font-semibold text-navy">
            No students found
          </h3>
          <p className="text-gray-400 text-sm mt-1">
            Select a class to generate ID cards.
          </p>
        </div>
      )}

      {/* ID CARD GRID — this is the print area */}
      <div className="id-cards-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 print:grid-cols-2 print:gap-4">
        {filteredStudents.map((student) => (
          <div
            key={student.id}
            className="id-card-54x86 relative overflow-hidden print:shadow-none print:break-inside-avoid shadow-card mx-auto"
            style={{
              borderRadius: 8,
              background:
                "linear-gradient(180deg, #0c1a2e 0%, #132240 40%, #162a50 100%)",
              boxShadow:
                "0 8px 32px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          >
            {/* ─── HEADER ─── */}
            <div className="flex items-center gap-3 px-5 pt-5 pb-3">
              {/* Logo Image / Fallback Container */}
              <div
                className="shrink-0 flex items-center justify-center font-brand font-bold text-xs tracking-wider"
                style={{
                  width: 50,
                  height: 50,
                  background: schoolInfo.logoUrl
                    ? "transparent"
                    : "linear-gradient(135deg, #c8956c, #d4a574)",
                  color: "#0c1a2e",
                  borderRadius: 8,
                }}
              >
                {schoolInfo.logoUrl ? (
                  <img
                    src={schoolInfo.logoUrl}
                    alt="Logo"
                    className="size-full object-contain"
                    onError={(e) => {
                      e.target.style.display = "none";
                      e.target.parentElement.style.background =
                        "linear-gradient(135deg, #c8956c, #d4a574)";
                      e.target.parentElement.style.borderRadius = "50%"; // Fallback to circle for pure text
                      e.target.parentElement.innerText = "SCH";
                    }}
                  />
                ) : (
                  <div className="size-full flex items-center justify-center rounded-full">
                    School ERP
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <h3 className="font-brand font-bold text-white text-[13px] leading-tight text-left">
                  {schoolInfo.name}
                </h3>
                <span
                  className="text-[9px] uppercase tracking-[0.15em] mt-0.5"
                  style={{ color: "#8da4c2" }}
                >
                  School City, State
                </span>
              </div>
            </div>

            {/* ─── RED BANNER ─── */}
            <div
              className="text-center py-[5px] text-[9px] font-bold uppercase tracking-[0.2em] text-white"
              style={{
                background: "linear-gradient(90deg, #c0392b, #e74c3c, #c0392b)",
              }}
            >
              ● Student Identity Card • 2026–27 ●
            </div>

            {/* ─── PHOTO AREA ─── */}
            <div className="flex justify-center pt-4 pb-2">
              <div
                className="flex flex-col items-center justify-center overflow-hidden"
                style={{
                  width: 90,
                  height: 105,
                  borderRadius: 10,
                  border: "2px dashed rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.04)",
                }}
              >
                {student.photoUrl ? (
                  <img
                    src={student.photoUrl}
                    alt={student.name}
                    className="size-full object-cover"
                  />
                ) : (
                  <>
                    <User size={30} style={{ color: "#5a6f8a" }} />
                    <span
                      className="text-[9px] mt-1"
                      style={{ color: "#5a6f8a" }}
                    >
                      Photo
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* ─── NAME & CLASS BADGE ─── */}
            <div className="text-center px-5 pb-2">
              <h4
                className="font-brand font-bold text-white text-[16px] tracking-wide truncate"
                title={student.name}
              >
                {student.name.toUpperCase()}
              </h4>
              <div className="flex justify-center mt-1.5">
                <span
                  className="inline-block text-[10px] font-semibold px-4 py-[3px] rounded-full tracking-wide"
                  style={{
                    border: "1px solid rgba(255,255,255,0.2)",
                    color: "#d4dae4",
                    background: "rgba(255,255,255,0.06)",
                  }}
                >
                  {student.className}
                  {student.section ? ` — Section ${student.section}` : ""}
                </span>
              </div>
            </div>

            {/* ─── DETAILS TABLE ─── */}
            <div className="px-5 pt-2 pb-1">
              <div
                style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
                className="pt-2"
              >
                <table
                  className="w-full text-[10.5px]"
                  style={{ borderSpacing: "0 2px" }}
                >
                  <tbody>
                    {[
                      ["STUDENT ID", student.studentId || "N/A", true],
                      [
                        "FATHER",
                        student.parentName || student.father || "N/A",
                        false,
                      ],
                      ["D.O.B", formatDOB(student.dob), false],
                      ["PHONE", student.phone || "N/A", false],
                    ].map(([label, value, accent]) => (
                      <tr key={label}>
                        <td
                          className="py-[2.5px] font-semibold uppercase tracking-wider"
                          style={{ color: "#8da4c2", width: "45%" }}
                        >
                          {label}
                        </td>
                        <td
                          className="py-[2.5px] text-right font-semibold"
                          style={{ color: accent ? "#d4a574" : "#e8ecf1" }}
                        >
                          {value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ─── FOOTER ─── */}
            <div
              className="flex items-center justify-between px-4 py-[6px] mt-1"
              style={{
                background: "linear-gradient(90deg, #c8b68e, #d4c49e)",
                borderRadius: "0 0 16px 16px",
              }}
            >
              <span
                className="text-[8px] font-medium tracking-wide"
                style={{ color: "#3a2a12" }}
              >
                {schoolInfo.address}
              </span>
              <span
                className="text-[9px] font-bold tracking-wider"
                style={{ color: "#1a1204" }}
              >
                {schoolInfo.phone}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
