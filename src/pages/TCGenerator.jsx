import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Navigate } from "react-router-dom";
import {
  Lock,
  Printer,
  CheckCircle,
  AlertCircle,
  Calendar,
} from "lucide-react";
import CustomDatePicker from "../components/ui/CustomDatePicker";
import { useAppContext } from "../context/AppContext";
import { api } from "../api/client";

// Simple helper to convert date to words (e.g. "Third March Two Thousand Ten")
const dateToWords = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "";

  const days = [
    "",
    "First",
    "Second",
    "Third",
    "Fourth",
    "Fifth",
    "Sixth",
    "Seventh",
    "Eighth",
    "Ninth",
    "Tenth",
    "Eleventh",
    "Twelfth",
    "Thirteenth",
    "Fourteenth",
    "Fifteenth",
    "Sixteenth",
    "Seventeenth",
    "Eighteenth",
    "Nineteenth",
    "Twentieth",
    "Twenty First",
    "Twenty Second",
    "Twenty Third",
    "Twenty Fourth",
    "Twenty Fifth",
    "Twenty Sixth",
    "Twenty Seventh",
    "Twenty Eighth",
    "Twenty Ninth",
    "Thirtieth",
    "Thirty First",
  ];
  const months = [
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

  const day = days[d.getDate()];
  const month = months[d.getMonth()];
  const year = d.getFullYear();

  const convertYearInfoWords = (y) => {
    if (y === 2010) return "Two Thousand Ten";
    if (y === 2011) return "Two Thousand Eleven";
    if (y === 2012) return "Two Thousand Twelve";
    if (y === 2013) return "Two Thousand Thirteen";
    if (y === 2014) return "Two Thousand Fourteen";
    if (y === 2015) return "Two Thousand Fifteen";
    if (y === 2016) return "Two Thousand Sixteen";
    if (y === 2017) return "Two Thousand Seventeen";
    if (y === 2018) return "Two Thousand Eighteen";
    if (y === 2019) return "Two Thousand Nineteen";
    if (y === 2020) return "Two Thousand Twenty";
    if (y === 2021) return "Two Thousand Twenty One";
    if (y === 2022) return "Two Thousand Twenty Two";
    if (y === 2023) return "Two Thousand Twenty Three";
    if (y === 2024) return "Two Thousand Twenty Four";
    if (y === 2025) return "Two Thousand Twenty Five";
    if (y === 2026) return "Two Thousand Twenty Six";
    return y.toString();
  };

  return `${day} ${month} ${convertYearInfoWords(year)}`;
};

export default function TCGenerator() {
  const navigate = useNavigate();
  const { id: studentId } = useParams();
  const { showToast, showConfirm, currentUser, schoolInfo } = useAppContext();

  if (currentUser?.role === "Teacher") {
    return <Navigate to="/students" replace />;
  }

  const [student, setStudent] = useState(null);
  const [feeStatus, setFeeStatus] = useState(null);
  const [generatingTc, setGeneratingTc] = useState(false);
  const [tcNumber, setTcNumber] = useState("");
  const [printPending, setPrintPending] = useState(false);

  // Form Fields
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [leavingDate, setLeavingDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [tcFrom, setTcFrom] = useState("");
  const [academicYearStart, setAcademicYearStart] = useState("2026");
  const [academicYearEnd, setAcademicYearEnd] = useState("2027");
  const [promotion, setPromotion] = useState("");
  const [udiseCode, setUdiseCode] = useState("");
  const [studentPen, setStudentPen] = useState("");

  useEffect(() => {
    if (!studentId) return;

    const load = async () => {
      try {
        const res = await api.students.byId(studentId);
        const s = res?.data || res;
        setStudent(s);
        setTcNumber("");
        setFeeStatus((s?.totalFeesDue || 0) > 0 ? "due" : "cleared");
        if (s?.studentPEN) setStudentPen(s.studentPEN);
        if (s?.udiseCode) setUdiseCode(s.udiseCode);
      } catch (err) {
        showToast(
          "error",
          err?.data?.message || err?.message || "Failed to load student",
        );
      }
    };

    load();
  }, [studentId, showToast]);

  // Print only after tcNumber re-renders
  useEffect(() => {
    if (printPending && tcNumber) {
      setPrintPending(false);
      setTimeout(() => window.print(), 300);
    }
  }, [printPending, tcNumber]);

  const checkFees = () => {
    if (!student) return;
    setFeeStatus((student.totalFeesDue || 0) > 0 ? "due" : "cleared");
  };

  const handleGenerateAndPrint = async () => {
    if (!student) {
      showToast("error", "Student not loaded yet");
      return;
    }
    if (feeStatus !== "cleared") {
      showToast("error", "Fees are pending. TC cannot be issued.");
      return;
    }

    // Confirmation before generating
    const confirmMsg = `Are you sure you want to generate TC for:\n\nStudent: ${name}\nClass: ${student?.currentClass || "—"}\nFather: ${parentName}\n\nThis action will be saved permanently. Proceed?`;
    showConfirm(confirmMsg, async () => {
      setGeneratingTc(true);
      try {
        const res = await api.tc.generate({
          studentId: student._id,
          dateOfLeaving: leavingDate,
          tcFrom: tcFrom,
          udiseCode: udiseCode,
          studentPEN: studentPen,
          qualifiedForPromotion: promotion || "Yes",
        });
        const tc = res?.data || res;
        const generatedTcNumber = tc?.tcNumber || "";
        setTcNumber(generatedTcNumber);
        showToast("success", `TC Generated: ${generatedTcNumber}`);
        setPrintPending(true); // Will trigger print via useEffect after re-render
      } catch (err) {
        showToast(
          "error",
          err?.data?.message || err?.message || "Failed to generate TC",
        );
      } finally {
        setGeneratingTc(false);
      }
    });
  };

  const sdo = student?.gender === "Female" ? "D/o" : "S/o";
  const parentName =
    student?.fatherName || student?.motherName || "_________________";
  const name = student
    ? `${student.firstName || ""} ${student.lastName || ""}`.trim()
    : "_________________";
  const dobStr = student?.dateOfBirth
    ? new Date(student.dateOfBirth).toLocaleDateString("en-IN")
    : "_____________";
  const dobWords = student?.dateOfBirth
    ? dateToWords(student.dateOfBirth)
    : "____________________________________";
  const admissionDateStr = student?.dateOfAdmission
    ? new Date(student.dateOfAdmission).toLocaleDateString("en-IN")
    : "_____________";
  const pronoun1 = student?.gender === "Female" ? "She" : "He";
  const pronoun2 = student?.gender === "Female" ? "Her" : "His";
  const pronoun1Lower = student?.gender === "Female" ? "she" : "he";
  const pronoun2Lower = student?.gender === "Female" ? "her" : "his";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-screen">
      {/* LEFT PANEL: FORM */}
      <div className="flex flex-col gap-6 hide-print">
        <div className="flex items-center gap-4">
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
          <h2 className="font-brand font-bold text-lg text-navy">
            Generate TC (Standard Format)
          </h2>
        </div>

        <div className="bg-gray-50 rounded-xl shadow-card p-5 border-2 border-dashed border-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Student Name
              </label>
              <div className="px-3 py-2 bg-white rounded-lg text-sm text-gray-600 border border-gray-100 flex items-center gap-2">
                <Lock size={12} className="text-gray-400" /> {name}
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Registration No.
              </label>
              <div className="px-3 py-2 bg-white rounded-lg text-sm text-gray-600 border border-gray-100 flex items-center gap-2">
                <Lock size={12} className="text-gray-400" />{" "}
                {student?.admissionNumber || "—"}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex gap-4 mb-4">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Date of Issue (Today)
              </label>
              <CustomDatePicker selected={issueDate} onChange={setIssueDate} />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Date of Leaving
              </label>
              <CustomDatePicker
                selected={leavingDate}
                onChange={setLeavingDate}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 mb-4">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              TC Received From (Previous School)
            </label>
            <input
              type="text"
              value={tcFrom}
              onChange={(e) => setTcFrom(e.target.value)}
              placeholder="Leave blank if N/A"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20"
            />
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Session Start
              </label>
              <input
                type="text"
                value={academicYearStart}
                onChange={(e) => setAcademicYearStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
                placeholder="yyyy"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Session End
              </label>
              <input
                type="text"
                value={academicYearEnd}
                onChange={(e) => setAcademicYearEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
                placeholder="yyyy"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 mb-4">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Promotion Status
            </label>
            <input
              type="text"
              value={promotion}
              onChange={(e) => setPromotion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
              placeholder="e.g. Granted for Class VI"
            />
          </div>

          <div className="flex gap-4">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                UDISE Code
              </label>
              <input
                type="text"
                value={udiseCode}
                onChange={(e) => setUdiseCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
                placeholder="School UDISE"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                Student PEN
              </label>
              <input
                type="text"
                value={studentPen}
                onChange={(e) => setStudentPen(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
                placeholder="Student PEN"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-navy font-brand">
              Fee Clearance
            </h3>
            <button
              className="inline-flex items-center gap-2 px-3 py-1.5 border border-cta text-cta rounded-lg text-xs font-medium hover:bg-cta/10 transition-colors"
              onClick={checkFees}
            >
              Check Dues
            </button>
          </div>
          {feeStatus === "cleared" && (
            <div className="flex items-center gap-3 p-4 bg-teal/10 text-teal rounded-xl">
              <CheckCircle size={18} />
              <div>
                <strong className="text-sm">All Dues Cleared</strong>
                <p className="text-xs opacity-80">TC can be issued</p>
              </div>
            </div>
          )}
          {feeStatus === "due" && (
            <div className="flex items-center gap-3 p-4 bg-cta/10 text-cta rounded-xl">
              <AlertCircle size={18} />
              <div>
                <strong className="text-sm">
                  Dues Pending: ₹{student?.totalFeesDue || 0}
                </strong>
                <p className="text-xs opacity-80">TC Generation Blocked</p>
                <button
                  className="inline-flex items-center gap-1 px-3 py-1 mt-2 border border-cta text-cta rounded-lg text-xs font-medium hover:bg-cta/10 transition-colors"
                  onClick={() => navigate("/fees/collect")}
                >
                  Collect Fee First →
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 border border-cta text-cta rounded-lg text-sm font-medium hover:bg-cta/10 transition-colors"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            className="flex-[2] inline-flex items-center justify-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={feeStatus !== "cleared" || generatingTc}
            onClick={handleGenerateAndPrint}
          >
            <Printer size={18} />{" "}
            {generatingTc ? "Saving..." : "Generate & Print TC"}
          </button>
        </div>
      </div>

      {/* RIGHT PANEL: PRINT PREVIEW */}
      <div className="bg-gray-100 rounded-xl p-6 lg:overflow-y-auto lg:h-screen custom-scrollbar flex justify-center items-start print:bg-white print:p-0">
        <div
          className="bg-white shadow-lg mx-auto print-tc-container relative"
          style={{
            width: "210mm",
            minHeight: "297mm",
            padding: "0",
            boxSizing: "border-box",
          }}
        >
          {/* Absolute Background Image */}
          <img
            src="/tc.jpg"
            alt="TC Background"
            className="absolute top-0 left-0 size-full object-cover z-[0]"
          />

          {/* Print specific layout starts here */}
          <div
            className="print-content relative z-10"
            style={{
              fontFamily: '"Nohemi", sans-serif',
              padding: "45mm 25mm 30mm 45mm",
            }}
          >
            <h1
              className="text-center font-bold text-[18px] uppercase underline underline-offset-4 tracking-wider mb-6"
              style={{ fontFamily: '"Nohemi", sans-serif' }}
            >
              SCHOLAR'S TRANSFER CERTIFICATE
            </h1>

            <div className="flex justify-between items-center font-bold text-[13px] mb-6 whitespace-nowrap">
              <div>
                Date :{" "}
                <span className="underline underline-offset-4 font-normal ml-1 mr-2">
                  {issueDate.split("-").reverse().join("/")}
                </span>
              </div>
              <div>
                T.C Serial No.{" "}
                <span className="underline underline-offset-4 font-normal ml-1 mr-2">
                  {tcNumber || "_____________"}
                </span>
              </div>
              <div>
                Registration No.{" "}
                <span className="underline underline-offset-4 font-normal ml-1">
                  {student?.admissionNumber || "_____________"}
                </span>
              </div>
            </div>

            <div
              className="text-[14px] leading-[2.2rem] font-medium"
              style={{ wordSpacing: "0.1rem" }}
            >
              <div className="whitespace-nowrap">
                <span className="ml-16">This is to certify that</span>{" "}
                <span className="font-bold underline underline-offset-4 uppercase px-2">
                  {name || "___________________________________"}
                </span>
              </div>

              <div className="whitespace-nowrap">
                {sdo}{" "}
                <span className="font-bold underline underline-offset-4 uppercase px-2">
                  {parentName || "____________________________________"}
                </span>{" "}
                was admitted into
              </div>

              <div className="whitespace-nowrap overflow-hidden">
                {schoolInfo.name},{" "}
                {(schoolInfo.address.split(",")[1] || "Jhansi").trim()} on{" "}
                <span className="font-bold underline underline-offset-4 px-2">
                  {admissionDateStr || "_____________"}
                </span>{" "}
                with a Transfer Certificate from{" "}
                <span className="font-bold underline underline-offset-4 px-2">
                  {tcFrom || "_____________________________________"}
                </span>
              </div>

              <div className="whitespace-nowrap mb-6">
                and left on{" "}
                <span className="font-bold underline underline-offset-4 px-2">
                  {leavingDate.split("-").reverse().join("/") ||
                    "___________________________"}
                </span>{" "}
                with a good character.
              </div>

              <div className="whitespace-nowrap mb-6">
                <span className="ml-16"> {pronoun1}</span> was then studying in
                class{" "}
                <span className="font-bold underline underline-offset-4 px-2">
                  {student?.currentClass || "____________"}
                </span>{" "}
                the School year being from{" "}
                <span className="font-bold underline underline-offset-4 px-2">
                  {academicYearStart || "________________"}
                </span>{" "}
                <br />
                to{" "}
                <span className="font-bold underline underline-offset-4 px-2">
                  {academicYearEnd || "________________"}
                </span>
                .
              </div>

              <div className="leading-[2.2rem] text-justify mb-8">
                <span className="ml-16">All</span> sums due to this school on{" "}
                {pronoun2Lower} account have been paid, remitted or
                satisfactorily arranged for. {pronoun2} date of birth according
                to the Admission Register is{" "}
                <span className="font-bold underline underline-offset-4 px-2">
                  {dobStr || "____________________________"}
                </span>{" "}
                (in words){" "}
                <span className="font-bold underline underline-offset-4 uppercase px-2 italic">
                  {dobWords ||
                    "_________________ ________________________________________"}
                </span>
                .
              </div>

              <div className="flex flex-col gap-3">
                <p>
                  Promotion has been:{" "}
                  <span className="font-bold underline underline-offset-4 px-4">
                    {promotion || "___________________"}
                  </span>
                  .
                </p>
                <p>
                  School UDISE Code:{" "}
                  <span className="font-bold underline underline-offset-4 px-4">
                    {udiseCode || "____________________"}
                  </span>
                  .
                </p>
                <p>
                  Student PEN:{" "}
                  <span className="font-bold underline underline-offset-4 px-4">
                    {studentPen || "_________________________"}
                  </span>
                  .
                </p>
              </div>
            </div>

            <div className="flex justify-end mt-12 items-end">
              <div className="text-center">
                <div className="text-[13px] font-bold leading-tight">
                  Principal
                  <br />
                  {schoolInfo.name.toUpperCase()}
                  <br />
                  {schoolInfo.address}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Global styles for hide-print */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
 @media print {
 body * {
 visibility: hidden;
 }
 .hide-print {
 display: none !important;
 }
 .print-tc-container, .print-tc-container * {
 visibility: visible;
 }
 .print-tc-container {
 position: absolute;
 left: 0;
 top: 0;
 width: 100%;
 height: 100vh;
 margin: 0;
 padding: 0 !important;
 box-shadow: none !important;
 }
 @page {
 margin: 0 !important;
 size: A4 portrait;
 }
 }
 `,
        }}
      />
    </div>
  );
}
