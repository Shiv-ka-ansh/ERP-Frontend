import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Upload, X, Check } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import CustomSelect from "../components/ui/CustomSelect";
import CustomDatePicker from "../components/ui/CustomDatePicker";
import { api } from "../api/client";
import { CLASS_OPTIONS } from "../constants/classes";

export default function AddStudent() {
 const navigate = useNavigate();
 const { id } = useParams();
 const isEditMode = !!id;
 const { showToast, loadCoreData, feeStructures, schoolInfo } =
 useAppContext();
 const [transportReq, setTransportReq] = useState(false);
 const [isSaving, setIsSaving] = useState(false);
 const [dataLoading, setDataLoading] = useState(isEditMode);

 const [formData, setFormData] = useState({
 firstName: "",
 lastName: "",
 dob: "",
 gender: "Male",
 bloodGroup: "Select",
 father: "",
 mother: "",
 mobile: "",
 whatsapp: "",
 email: "",
 className: "",
 section: schoolInfo?.sections?.[0] || "A",
 aadhar: "",
 studentPEN: "",
 parentAadhar: "",
 admissionDate: new Date().toISOString().split("T")[0],
 address: "",
 city: "",
 state: "Uttar Pradesh",
 pincode: "",
 transportRoute: "Select route",
 socialCategory: "Select",
 minorityGroup: "Select",
 hasCustomFee: false,
 customFeeAmount: "",
 profileImage: null,
 });
 const [sameAsPrimary, setSameAsPrimary] = useState(false);
 const [errors, setErrors] = useState({});

 // Edit mode: fetch existing student data
 useEffect(() => {
 if (!isEditMode) return;
 api.students
 .byId(id)
 .then((res) => {
 const s = res?.data || res;
 setFormData({
 firstName: s.firstName || "",
 lastName: s.lastName || "",
 dob: s.dateOfBirth ? new Date(s.dateOfBirth) : "",
 gender: s.gender || "Male",
 bloodGroup: s.bloodGroup || "Select",
 father: s.fatherName || "",
 mother: s.motherName || "",
 mobile: s.primaryContactPhone || "",
 whatsapp: s.whatsappNumber || "",
 email: s.email || "",
 className: s.currentClass || "",
 section: s.section || "A",
 aadhar: s.aadharNumber || "",
 studentPEN: s.studentPEN || "",
 parentAadhar: s.parentAadhar || "",
 admissionDate: s.admissionDate
 ? new Date(s.admissionDate)
 : new Date(),
 address:
 s.address?.fullAddress ||
 (typeof s.address === "string" ? s.address : ""),
 city: s.address?.city || "",
 state: s.address?.state || "Uttar Pradesh",
 pincode: s.address?.pincode || "",
 transportRoute: s.transportRoute || "Select route",
 socialCategory: s.socialCategory || "Select",
 minorityGroup: s.minorityGroup || "Select",
 hasCustomFee: false,
 customFeeAmount: "",
 profileImage: s.photoUrl || null,
 });
 setDataLoading(false);
 return;
 })
 .catch(() => {
 showToast("error", "Failed to load student data");
 navigate("/students");
 });
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [id]);

 const handleSave = async (e) => {
 e.preventDefault();
 const newErrors = {};
 const firstNameInput = (formData.firstName || "").trim();
 const lastNameInput = (formData.lastName || "").trim();
 const mobile = (formData.mobile || "").trim();
 const father = (formData.father || "").trim();
 const email = (formData.email || "").trim();
 const whatsapp = (formData.whatsapp || "").trim();

 if (!firstNameInput || firstNameInput.length < 2)
 newErrors.firstName = "Minimum 2 characters required";
 const threeYearsAgo = new Date();
 threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
 if (!formData.dob) newErrors.dob = "Date of birth is required";
 else if (new Date(formData.dob) > threeYearsAgo)
 newErrors.dob = "Student must be at least 3 years old";
 if (!father) newErrors.father = "Father name is required";
 if (!mobile || !/^\d{10}$/.test(mobile))
 newErrors.mobile = "Must be exactly 10 digits";
 if (!formData.className) newErrors.className = "Class is required";
 if (!formData.gender) newErrors.gender = "Gender is required";

 // Removed name split logic as fields are now separate

 if (Object.keys(newErrors).length > 0) {
 setErrors(newErrors);
 showToast("error", "Please fix the errors in the form");
 return;
 }

 setErrors({});
 setIsSaving(true);
 try {
 const payload = {
 firstName: firstNameInput,
 lastName: lastNameInput,
 dateOfBirth: formData.dob,
 gender: formData.gender || "Male",
 currentClass: formData.className,
 section: formData.section || "A",
 fatherName: father,
 motherName: (formData.mother || "").trim(),
 primaryContactPhone: mobile,
 whatsappNumber: whatsapp,
 email: email,
 socialCategory:
 formData.socialCategory !== "Select"
 ? formData.socialCategory
 : undefined,
 minorityGroup:
 formData.minorityGroup !== "Select"
 ? formData.minorityGroup
 : undefined,
 bloodGroup:
 formData.bloodGroup !== "Select" ? formData.bloodGroup : undefined,
 aadharNumber: formData.aadhar,
 studentPEN: formData.studentPEN,
 parentAadhar: formData.parentAadhar,
 address: {
 fullAddress: formData.address,
 city: formData.city,
 state: formData.state || "Uttar Pradesh",
 pincode: formData.pincode,
 },
 totalFeesDue:
 formData.hasCustomFee && formData.customFeeAmount
 ? Number(formData.customFeeAmount)
 : undefined,
 profileImage: formData.profileImage,
 };

 if (isEditMode) {
 await api.students.update(id, payload);
 showToast("success", "Student Updated Successfully");
 await loadCoreData();
 navigate(`/students/${id}`);
 } else {
 const res = await api.students.create(payload);
 showToast("success", "Student Added Successfully");
 await loadCoreData();
 const createdId = res?.data?._id;
 navigate(createdId ? `/students/${createdId}` : "/students");
 }
 } catch (err) {
 // If it's a validation error from the backend, map details to our errors state
 if (
 err?.data?.error?.code === "VALIDATION_ERROR" &&
 Array.isArray(err.data.error.details)
 ) {
 const backendErrors = {};
    err.data.error.details.forEach((detail) => {
      // Map backend field names to our local formData keys
      let { field, message } = detail;
      if (field === "primaryContactPhone") field = "mobile";
      if (field === "currentClass") field = "className";
      if (field === "firstName") field = "firstName";
      if (field === "lastName") field = "lastName";
      backendErrors[field] = message;
    });
 setErrors(backendErrors);
 showToast("error", "Invalid input provided. Please check the fields.");
 } else {
 const message =
 err?.data?.message || err?.message || "Failed to add student";
 showToast("error", message);
 }
 } finally {
 setIsSaving(false);
 }
 };

 React.useEffect(() => {
 if (sameAsPrimary) {
 setFormData((prev) => ({ ...prev, whatsapp: prev.mobile }));
 }
 }, [formData.mobile, sameAsPrimary]);

 if (dataLoading) {
 return (
 <div className="min-h-screen flex items-center justify-center text-gray-500">
 Loading student data...
 </div>
 );
 }

 // Helper to find a student's matching fee structure (handles comma-separated classNames)
 const matchingFeeStructure = feeStructures?.find((fs) =>
 fs.className
 ?.split(",")
 .map((c) => c.trim())
 .includes(formData.className),
 );

 return (
 <div className="min-h-screen">
 <button
 onClick={() => navigate(-1)}
 className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-4 transition-colors"
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
 {isEditMode ? "Edit Student Profile" : "Add New Student"}
 </h1>
 </div>

 <form onSubmit={handleSave}>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* LEFT COLUMN */}
 <div className="flex flex-col gap-6">
 <div className="bg-white rounded-xl shadow-card p-6">
 <h2 className="text-lg font-semibold text-navy font-brand mb-4">
 Personal Information
 </h2>

 <div className="relative flex items-center gap-4 mb-6 p-4 border-2 border-dashed border-gray-200 rounded-xl hover:border-cta/50 transition-colors cursor-pointer group">
 <input
 type="file"
 accept="image/*"
 className="absolute inset-0 size-full opacity-0 cursor-pointer z-10"
 onChange={(e) => {
 if (e.target.files && e.target.files[0]) {
 const reader = new FileReader();
 reader.onload = (ev) =>
 setFormData({
 ...formData,
 profileImage: ev.target.result,
 });
 reader.readAsDataURL(e.target.files[0]);
 }
 }}
 />
 <div className="size-20 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 overflow-hidden relative group-hover:bg-gray-100 transition-colors">
 {formData.profileImage ? (
 <img
 src={formData.profileImage}
 alt="Preview"
 className="size-full object-cover"
 />
 ) : (
 <Upload
 size={24}
 className="text-gray-400 group-hover:text-cta transition-colors"
 />
 )}
 </div>
 <div className="text-gray-400">
 <p className="text-sm font-medium text-gray-600 group-hover:text-cta transition-colors">
 Drag and drop or click to upload
 </p>
 <span className="text-xs">Recommended size: 120x120px</span>
 </div>
 </div>

 <div className="flex flex-col sm:flex-row gap-4 mb-4">
 <div className="flex-1 flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 First Name *
 </label>
 <input
 type="text"
 placeholder="First Name"
 value={formData.firstName}
 onChange={(e) =>
 setFormData({ ...formData, firstName: e.target.value })
 }
 className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors ${errors.firstName ? "border-cta" : "border-gray-200"}`}
 />
 {errors.firstName && (
 <span className="text-xs text-cta mt-1">
 {errors.firstName}
 </span>
 )}
 </div>
 <div className="flex-1 flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Last Name
 </label>
 <input
 type="text"
 placeholder="Last Name"
 value={formData.lastName}
 onChange={(e) =>
 setFormData({ ...formData, lastName: e.target.value })
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors"
 />
 </div>
 <div className="flex-1 flex flex-col gap-1 relative z-30">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Date of Birth *
 </label>
 <CustomDatePicker
 selected={formData.dob}
 onChange={(date) => setFormData({ ...formData, dob: date })}
 maxDate={(() => {
 const d = new Date();
 d.setFullYear(d.getFullYear() - 3);
 return d;
 })()}
 error={!!errors.dob}
 />
 {errors.dob && (
 <span className="text-xs text-cta mt-1">{errors.dob}</span>
 )}
 </div>
 </div>

 <div className="flex flex-col sm:flex-row gap-4 mb-4">
 <div className="flex-1 overflow-x-auto pb-1 sm:pb-0">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide whitespace-nowrap">
 Gender
 </label>
 <div className="flex gap-2 mt-1">
 {["Male", "Female", "Other"].map((g) => (
 <div
 key={g}
 className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all border whitespace-nowrap ${formData.gender === g ? "bg-cta text-white border-cta" : "bg-white text-gray-500 border-gray-200 hover:border-cta"}`}
 onClick={() => setFormData({ ...formData, gender: g })}
 >
 {g}
 </div>
 ))}
 </div>
 </div>
 <div className="flex-1 flex flex-col gap-1 z-20">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Blood Group
 </label>
 <CustomSelect
 value={formData.bloodGroup || "Select"}
 onChange={(val) =>
 setFormData({ ...formData, bloodGroup: val })
 }
 options={[
 "Select",
 "A+",
 "A-",
 "B+",
 "B-",
 "O+",
 "O-",
 "AB+",
 "AB-",
 ]}
 />
 </div>
 </div>

 <div className="flex flex-col sm:flex-row gap-4 mb-4 z-10 relative">
 <div className="flex-1 flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Social Category
 </label>
 <CustomSelect
 value={formData.socialCategory || "Select"}
 onChange={(val) =>
 setFormData({ ...formData, socialCategory: val })
 }
 options={["Select", "General", "OBC", "SC", "ST"]}
 />
 </div>
 <div className="flex-1 flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Minority Group
 </label>
 <CustomSelect
 value={formData.minorityGroup || "Select"}
 onChange={(val) =>
 setFormData({ ...formData, minorityGroup: val })
 }
 options={[
 "Select",
 "NA",
 "Muslim",
 "Christian",
 "Sikh",
 "Buddhist",
 "Parsi",
 "Jain",
 ]}
 />
 </div>
 </div>

 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Aadhar Number
 </label>
 <input
 type="number"
 placeholder="xxxx xxxx xxxx"
 value={formData.aadhar}
 onChange={(e) =>
 setFormData({ ...formData, aadhar: e.target.value })
 }
 onInput={(e) =>
 (e.target.value = e.target.value.slice(0, 12))
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
 />
 </div>

 <div className="flex flex-col gap-1 mt-4">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Student PEN (National ID)
 </label>
 <input
 type="text"
 placeholder="Enter 11-digit PEN"
 value={formData.studentPEN}
 maxLength="11"
 onChange={(e) =>
 setFormData({ ...formData, studentPEN: e.target.value })
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors"
 />
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-card p-6">
 <h2 className="text-lg font-semibold text-navy font-brand mb-4">
 Parent / Guardian Details
 </h2>
 <div className="flex flex-col gap-1 mb-4">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Father's Name *
 </label>
 <input
 type="text"
 value={formData.father}
 onChange={(e) =>
 setFormData({ ...formData, father: e.target.value })
 }
 className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors ${errors.father ? "border-cta" : "border-gray-200"}`}
 />
 {errors.father && (
 <span className="text-xs text-cta mt-1">{errors.father}</span>
 )}
 </div>
 <div className="flex flex-col gap-1 mb-4">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Mother's Name
 </label>
 <input
 type="text"
 value={formData.mother}
 onChange={(e) =>
 setFormData({ ...formData, mother: e.target.value })
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors"
 />
 </div>
 <div className="flex flex-col gap-1 mb-4">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Parent Aadhar Number
 </label>
 <input
 type="number"
 placeholder="xxxx xxxx xxxx"
 value={formData.parentAadhar}
 onChange={(e) =>
 setFormData({ ...formData, parentAadhar: e.target.value })
 }
 onInput={(e) =>
 (e.target.value = e.target.value.slice(0, 12))
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
 />
 </div>
 <div className="flex gap-4">
 <div className="flex-1 flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Primary Mobile *
 </label>
 <input
 type="tel"
 value={formData.mobile}
 onChange={(e) =>
 setFormData({ ...formData, mobile: e.target.value })
 }
 placeholder="10 digit number"
 className={`w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors ${errors.mobile ? "border-cta" : "border-gray-200"}`}
 />
 {errors.mobile && (
 <span className="text-xs text-cta mt-1">
 {errors.mobile}
 </span>
 )}
 </div>
 <div className="flex-1 flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 WhatsApp Number
 </label>
 <input
 type="tel"
 placeholder="WhatsApp number"
 value={formData.whatsapp}
 onChange={(e) => {
 setFormData({ ...formData, whatsapp: e.target.value });
 if (sameAsPrimary && e.target.value !== formData.mobile) {
 setSameAsPrimary(false);
 }
 }}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors"
 />
 <label className="flex items-center gap-1.5 mt-1.5 text-xs text-gray-400 cursor-pointer">
 <input
 type="checkbox"
 className="rounded"
 checked={sameAsPrimary}
 onChange={(e) => setSameAsPrimary(e.target.checked)}
 />{" "}
 Same as primary
 </label>
 </div>
 </div>
 <div className="flex flex-col gap-1 mt-4">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Email Address
 </label>
 <input
 type="email"
 placeholder="parent@example.com"
 value={formData.email}
 onChange={(e) =>
 setFormData({ ...formData, email: e.target.value })
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors"
 />
 </div>
 </div>
 </div>

 {/* RIGHT COLUMN */}
 <div className="flex flex-col gap-6">
 <div className="bg-white rounded-xl shadow-card p-6">
 <h2 className="text-lg font-semibold text-navy font-brand mb-4">
 Academic Details
 </h2>
 <div className="flex gap-4 mb-4">
 <div className="flex-1 flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Admission No. (Auto)
 </label>
 <input
 type="text"
 value="Auto-generated"
 readOnly
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono text-gray-400 bg-gray-50 italic"
 />
 </div>
 <div className="flex-1 flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Date of Admission
 </label>
 <CustomDatePicker
 selected={formData.admissionDate || new Date()}
 onChange={(date) =>
 setFormData({ ...formData, admissionDate: date })
 }
 />
 </div>
 </div>

 <div className="flex gap-4 mb-4">
 <div className="flex-1 flex flex-col gap-1 z-10">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Class *
 </label>
 <CustomSelect
 value={formData.className || "Select"}
 onChange={(val) =>
 setFormData({
 ...formData,
 className: val !== "Select" ? val : "",
 })
 }
 options={CLASS_OPTIONS}
 error={!!errors.className}
 />
 {errors.className && (
 <span className="text-xs text-cta mt-1">
 {errors.className}
 </span>
 )}
 </div>
 <div className="flex-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Section
 </label>
 <div className="flex gap-2 mt-1">
 {(schoolInfo?.sections || ["A", "B", "C"]).map((s) => (
 <div
 key={s}
 className={`px-4 py-2 rounded-lg text-sm font-medium cursor-pointer transition-all border ${formData.section === s ? "bg-cta text-white border-cta" : "bg-white text-gray-500 border-gray-200 hover:border-cta"}`}
 onClick={() => setFormData({ ...formData, section: s })}
 >
 {s}
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Previous School (If any)
 </label>
 <input
 type="text"
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors"
 />
 </div>
 </div>

 <div className="bg-white rounded-xl shadow-card p-6">
 <h2 className="text-lg font-semibold text-navy font-brand mb-4">
 Address
 </h2>
 <div className="flex flex-col gap-1 mb-4">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Full Address
 </label>
 <textarea
 rows="2"
 value={formData.address}
 onChange={(e) =>
 setFormData({ ...formData, address: e.target.value })
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors resize-none"
 ></textarea>
 </div>
 <div className="flex gap-4">
 <div className="flex-[2] flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 City
 </label>
 <input
 type="text"
 placeholder="City"
 value={formData.city}
 onChange={(e) =>
 setFormData({ ...formData, city: e.target.value })
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors"
 />
 </div>
 <div className="flex-[2] flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 State
 </label>
 <input
 type="text"
 placeholder="State"
 value={formData.state}
 onChange={(e) =>
 setFormData({ ...formData, state: e.target.value })
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors"
 />
 </div>
 <div className="flex-1 flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Pincode
 </label>
 <input
 type="number"
 placeholder="Pincode"
 value={formData.pincode}
 onChange={(e) =>
 setFormData({ ...formData, pincode: e.target.value })
 }
 onInput={(e) =>
 (e.target.value = e.target.value.slice(0, 6))
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
 />
 </div>
 </div>
 </div>

 {/* Fee Assignment — only visible in Add mode */}
 {!isEditMode && (
 <div className="bg-gray-50 rounded-xl shadow-card p-6 border border-gray-100">
 <h2 className="text-lg font-semibold text-navy font-brand mb-4">
 Fee Assignment
 </h2>
 <div className="flex flex-col gap-3">
 {!formData.className ? (
 <p className="text-sm text-gray-400 text-center py-4">
 Select a class to see fee details
 </p>
 ) : (
 <>
 {(matchingFeeStructure?.feeHeads || []).map((fh, idx) => (
 <div
 key={idx}
 className="flex items-center justify-between py-2 border-b border-gray-200"
 >
 <span className="text-sm text-gray-600">
 {fh.head}
 </span>
 <span className="text-sm font-medium">
 ₹{fh.amount.toLocaleString()}
 </span>
 </div>
 ))}

 <div className="flex items-center justify-between py-3 border-b border-gray-200 mt-2">
 <span className="text-sm font-medium text-gray-700">
 Apply Custom Fee Amount?
 </span>
 <label className="relative inline-flex items-center cursor-pointer">
 <input
 type="checkbox"
 checked={formData.hasCustomFee}
 onChange={(e) =>
 setFormData({
 ...formData,
 hasCustomFee: e.target.checked,
 })
 }
 className="sr-only peer"
 />
 <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-cta after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:size-4 border border-gray-300 peer-checked:border-cta after:transition-all"></div>
 </label>
 </div>

 {formData.hasCustomFee && (
 <div className="flex flex-col gap-1 mt-3 pb-2">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Custom Total Fee (₹)
 </label>
 <input
 type="number"
 placeholder="Enter custom amount"
 value={formData.customFeeAmount}
 onChange={(e) =>
 setFormData({
 ...formData,
 customFeeAmount: e.target.value,
 })
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta"
 />
 </div>
 )}
 </>
 )}

 {transportReq && (
 <div className="flex flex-col gap-1 mt-2">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Bus Route / Area
 </label>
 <CustomSelect
 value={formData.transportRoute || "Select route"}
 onChange={(val) =>
 setFormData({ ...formData, transportRoute: val })
 }
 options={[
 "Select route",
 "Route 1: Sadar Bazaar (₹1,200)",
 "Route 2: Sipri Bazar (₹1,500)",
 ]}
 />
 </div>
 )}

 <div className="flex items-center justify-between pt-3 border-t border-gray-300 mt-2">
 <span className="font-brand font-semibold">Total</span>
 <span className="font-brand font-semibold text-teal text-lg">
 ₹
 {(() => {
 const headsTotal =
 matchingFeeStructure?.feeHeads?.reduce(
 (acc, curr) => acc + curr.amount,
 0,
 ) || 0;
 const transport = transportReq ? 1200 : 0;
 return (headsTotal + transport).toLocaleString();
 })()}
 </span>
 </div>
 </div>
 </div>
 )}

 {/* Discount — only visible in Add mode */}
 {!isEditMode && (
 <div className="bg-white rounded-xl shadow-card p-6">
 <h2 className="text-lg font-semibold text-navy font-brand mb-4">
 Fee Discount / Scholarship (Optional)
 </h2>
 <div className="flex flex-col gap-4">
 <div className="flex gap-4">
 <div className="flex-1 flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Discount Type
 </label>
 <select
 value={formData.discountType || "none"}
 onChange={(e) =>
 setFormData({
 ...formData,
 discountType: e.target.value,
 })
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors"
 >
 <option value="none">No Discount</option>
 <option value="percent">Percentage (%)</option>
 <option value="flat">Flat Amount (₹)</option>
 </select>
 </div>
 {formData.discountType &&
 formData.discountType !== "none" && (
 <div className="flex-1 flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 {formData.discountType === "percent"
 ? "Discount %"
 : "Discount ₹"}
 </label>
 <input
 type="number"
 placeholder={
 formData.discountType === "percent"
 ? "e.g. 25"
 : "e.g. 5000"
 }
 value={formData.discountValue || ""}
 onChange={(e) =>
 setFormData({
 ...formData,
 discountValue: e.target.value,
 })
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors"
 />
 </div>
 )}
 </div>
 {formData.discountType &&
 formData.discountType !== "none" && (
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">
 Reason
 </label>
 <input
 type="text"
 placeholder="e.g. Staff Child, RTE, Merit"
 value={formData.discountReason || ""}
 onChange={(e) =>
 setFormData({
 ...formData,
 discountReason: e.target.value,
 })
 }
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors"
 />
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 </div>

 {/* STICKY BOTTOM ACTIONS */}
 <div className="bottom-0 mt-6 -mx-6 px-6 py-4 bg-white border-t border-gray-100 flex items-center justify-between z-20 shadow-card">
 <button
 type="button"
 disabled={isSaving}
 className="inline-flex items-center gap-2 px-4 py-2 border border-cta text-cta rounded-lg text-sm font-medium hover:bg-cta/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 onClick={() => navigate(-1)}
 >
 Cancel
 </button>
 <div className="flex items-center gap-3">
 <button
 type="button"
 disabled={isSaving}
 className="inline-flex items-center gap-2 px-4 py-2 border border-cta text-cta rounded-lg text-sm font-medium hover:bg-cta/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Save Draft
 </button>
 {!isEditMode && (
 <button
 type="button"
 disabled={isSaving}
 className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 Save & Add Another
 </button>
 )}
 <button
 type="submit"
 disabled={isSaving}
 className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {isSaving ? (
 <>
 <div className="size-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
 Saving...
 </>
 ) : isEditMode ? (
 "Update Student"
 ) : (
 "Save Student"
 )}
 </button>
 </div>
 </div>
 </form>
 </div>
 );
}
