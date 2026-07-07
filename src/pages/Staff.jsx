import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, X, Users, Phone, Briefcase, Calendar } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import CustomSelect from '../components/ui/CustomSelect';
import CustomDatePicker from '../components/ui/CustomDatePicker';
import { api } from '../api/client';

const STAFF_ROLES = [
 'Teacher', 'Principal', 'Vice Principal', 'Coordinator', 'Admin Staff',
 'Accountant', 'Librarian', 'Lab Assistant', 'Peon', 'Driver', 'Guard'
];

const ROLE_COLOR = {
 'Principal': 'bg-purple-100 text-purple-700',
 'Vice Principal': 'bg-indigo-100 text-indigo-700',
 'Coordinator': 'bg-blue-100 text-blue-700',
 'Teacher': 'bg-teal/10 text-teal',
 'Admin Staff': 'bg-amber-100 text-amber-700',
 'Accountant': 'bg-emerald-100 text-emerald-700',
 'Librarian': 'bg-cyan-100 text-cyan-700',
 'Lab Assistant': 'bg-sky-100 text-sky-700',
 'Peon': 'bg-gray-100 text-gray-600',
 'Driver': 'bg-orange-100 text-orange-700',
 'Guard': 'bg-red-100 text-red-700',
};

const FILTER_GROUPS = ['All', 'Teaching', 'Non-Teaching'];
const TEACHING_ROLES = ['Teacher', 'Principal', 'Vice Principal', 'Coordinator'];

const EMPTY_FORM = {
 name: '', role: 'Teacher', department: '', qualification: '',
 joinDate: new Date().toISOString().split('T')[0], phone: '',
 basic: '', hra: '', allowances: '', deductions: '', email: '',
};

export default function Staff() {
 const { addTeacher, updateTeacher, deleteTeacher, showToast, showConfirm } = useAppContext();
 const [allStaff, setAllStaff] = useState([]);
 const [loading, setLoading] = useState(true);
 const [searchTerm, setSearchTerm] = useState('');
 const [filterGroup, setFilterGroup] = useState('All');
 const [showModal, setShowModal] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [formData, setFormData] = useState(EMPTY_FORM);

 const loadStaff = async () => {
 setLoading(true);
 try {
 const res = await api.staff.list({ page: 1, limit: 500 });
 setAllStaff((res?.data || []).map(t => ({
 id: t._id,
 staffId: t.staffId || null,
 name: t.name,
 role: t.role || 'Staff',
 roleType: t.roleType || (TEACHING_ROLES.includes(t.role) ? 'TEACHER' : 'NON_TEACHING'), 
 subject: t.subject || t.department || '',
 department: t.department || '',
 qualification: t.qualification || '',
 joinDate: t.joinDate ? new Date(t.joinDate).toISOString().slice(0, 10) : '',
 phone: t.phone || '',
 basic: t.basic || 0,
 hra: t.hra || 0,
 allowances: t.allowances || 0,
 deductions: t.deductions || 0,
 email: t.email || '',
 })));
 } catch (err) {
 showToast('error', err?.data?.message || err?.message || 'Failed to load staff');
 } finally {
 setLoading(false);
 }
 };

 React.useEffect(() => {
 loadStaff();
 }, []);

 const filteredStaff = allStaff.filter(s => {
 const matchSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
 (s.staffId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
 (s.role || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
 (s.department || '').toLowerCase().includes(searchTerm.toLowerCase());
 if (!matchSearch) return false;
 if (!matchSearch) return false;
 if (filterGroup === 'Teaching') return s.roleType === 'TEACHER';
 if (filterGroup === 'Non-Teaching') return s.roleType === 'NON_TEACHING';
 return true;
 });

 const openAdd = () => {
 setEditingId(null);
 setFormData(EMPTY_FORM);
 setShowModal(true);
 };

 const openEdit = (s) => {
 setEditingId(s.id);
 setFormData({ ...EMPTY_FORM, ...s });
 setShowModal(true);
 };

 const handleSave = async () => {
 if (!formData.name.trim() || !formData.role) {
 showToast('error', 'Name and Role are required');
 return;
 }
 const payload = {
 ...formData,
 basic: Number(formData.basic) || 0,
 hra: Number(formData.hra) || 0,
 allowances: Number(formData.allowances) || 0,
 deductions: Number(formData.deductions) || 0,
 subject: formData.department || '',
 };
 try {
 if (editingId) {
 await api.staff.update(editingId, payload);
 showToast('success', 'Staff profile updated');
 } else {
 await api.staff.create(payload);
 showToast('success', 'Staff member added');
 }
 setShowModal(false);
 loadStaff();
 } catch (err) {
 showToast('error', err?.data?.message || err?.message || 'Failed to save');
 }
 };

 const handleDelete = (s) => {
 showConfirm(`Remove ${s.name} from the system? This cannot be undone.`, async () => {
 try {
 await api.staff.remove(s.id);
 showToast('success', 'Staff member removed');
 loadStaff();
 } catch (err) {
 showToast('error', err?.data?.message || err?.message || 'Failed to delete');
 }
 });
 };

 const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
 const getNet = (s) => ((s.basic || 0) + (s.hra || 0) + (s.allowances || 0) - (s.deductions || 0));

 const stats = {
 total: allStaff.length,
 teaching: allStaff.filter(s => s.roleType === 'TEACHER').length,
 nonTeaching: allStaff.filter(s => s.roleType === 'NON_TEACHING').length,
 };

 const field = (label, key, type = 'text', props = {}) => (
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</label>
 {type === 'date' ? (
 <CustomDatePicker
 selected={formData[key]}
 onChange={date => setFormData(p => ({ ...p, [key]: date }))}
 {...props}
 />
 ) : (
 <input
 type={type}
 value={formData[key] ?? ''}
 onChange={e => setFormData(p => ({ ...p, [key]: e.target.value }))}
 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-navy focus:ring-1 focus:ring-navy/20"
 {...props}
 />
 )}
 </div>
 );

 return (
 <div className="min-h-screen">
 {/* Header */}
 <div className="flex items-center justify-between mb-6">
 <div>
 <h1 className="text-xl font-bold text-navy font-brand">Staff Directory</h1>
 <p className="text-xs text-gray-400 mt-0.5">Teaching & Non-Teaching staff</p>
 </div>
 <div className="flex items-center gap-3">
 <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 gap-2">
 <Search size={16} className="text-gray-400" />
 <input
 type="text"
 placeholder="Search name, role, dept..."
 value={searchTerm}
 onChange={e => setSearchTerm(e.target.value)}
 className="border-none bg-transparent text-sm py-2 focus:outline-none w-48"
 />
 </div>
 <button
 onClick={openAdd}
 className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors"
 >
 <Plus size={17} /> Add Staff
 </button>
 </div>
 </div>

 {/* Stats */}
 <div className="grid grid-cols-3 gap-4 mb-6">
 {[
 { label: 'Total Staff', value: stats.total, color: 'text-navy', border: 'border-l-4 border-navy' },
 { label: 'Teaching Staff', value: stats.teaching, color: 'text-teal', border: 'border-l-4 border-teal' },
 { label: 'Non-Teaching', value: stats.nonTeaching, color: 'text-amber-600', border: 'border-l-4 border-amber-400' },
 ].map(s => (
 <div key={s.label} className={`bg-white rounded-xl shadow-card p-4 ${s.border}`}>
 <p className="text-xs text-gray-400">{s.label}</p>
 <p className={`text-2xl font-bold font-brand ${s.color}`}>{s.value}</p>
 </div>
 ))}
 </div>

 {/* Filter tabs */}
 <div className="flex gap-1.5 mb-5">
 {FILTER_GROUPS.map(g => (
 <button
 key={g}
 onClick={() => setFilterGroup(g)}
 className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
 filterGroup === g ? 'bg-navy text-white' : 'bg-white text-gray-500 border border-gray-200 hover:border-navy hover:text-navy'
 }`}
 >
 {g}
 </button>
 ))}
 </div>

 {/* Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
 {loading ? (
 <div className="col-span-full py-12 text-center text-gray-400">Loading staff directory...</div>
 ) : filteredStaff.length === 0 ? (
 <div className="col-span-full py-12 text-center bg-white rounded-xl shadow-card">
 <Users size={40} className="mx-auto text-gray-200 mb-3" />
 <p className="text-navy font-brand font-semibold">No staff found</p>
 <p className="text-gray-400 text-sm mt-1">Try adjusting search/filter or add a new member.</p>
 </div>
 ) : (
 filteredStaff.map(s => {
 const roleColor = ROLE_COLOR[s.role] || 'bg-gray-100 text-gray-600';
 return (
 <div key={s.id} className="bg-white rounded-xl shadow-card overflow-hidden group">
 <div className="p-5">
 <div className="flex justify-between items-start mb-4">
 <div className="size-12 rounded-full bg-navy/10 text-navy flex items-center justify-center font-brand font-bold text-lg">
 {getInitials(s.name)}
 </div>
 <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-navy transition-colors"><Edit2 size={14} /></button>
 <button onClick={() => handleDelete(s)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
 </div>
 </div>

 <h3 className="font-brand font-bold text-navy mb-1">{s.name}</h3>
 {s.staffId && <span className="block text-xs font-mono text-gray-400 mb-2">{s.staffId}</span>}
 <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleColor}`}>
 <Briefcase size={10} />
 {s.role}
 </span>

 <div className="space-y-2 mt-4 pt-4 border-t border-gray-50">
 {s.department && (
 <div className="flex justify-between text-xs">
 <span className="text-gray-400">Department</span>
 <span className="font-medium text-gray-700">{s.department}</span>
 </div>
 )}
 {(s.subject && !s.department) && (
 <div className="flex justify-between text-xs">
 <span className="text-gray-400">Subject</span>
 <span className="font-medium text-gray-700">{s.subject}</span>
 </div>
 )}
 {s.qualification && (
 <div className="flex justify-between text-xs">
 <span className="text-gray-400">Qualification</span>
 <span className="font-medium text-gray-700 text-right max-w-[120px] truncate">{s.qualification}</span>
 </div>
 )}
 <div className="flex justify-between text-xs">
 <span className="text-gray-400">Net Salary</span>
 <span className="font-medium text-emerald-600 font-mono">₹{getNet(s).toLocaleString()}</span>
 </div>
 {s.phone && (
 <div className="flex items-center gap-1 text-xs text-gray-400">
 <Phone size={10} />
 {s.phone}
 </div>
 )}
 {s.joinDate && (
 <div className="flex items-center gap-1 text-xs text-gray-400">
 <Calendar size={10} />
 Joined: {s.joinDate}
 </div>
 )}
 </div>
 </div>
 </div>
 );
 })
 )}
 </div>

 {/* Add/Edit Modal */}
 {showModal && (
 <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
 <div className="bg-white rounded-2xl shadow-modal w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
 {/* Modal Header - Fixed */}
 <div className="flex items-center justify-between p-6 bg-navy rounded-t-2xl shrink-0">
 <h3 className="font-brand text-white font-semibold">{editingId ? 'Edit Staff Profile' : 'Add New Staff Member'}</h3>
 <button onClick={() => setShowModal(false)}><X size={20} className="text-white/70 hover:text-white" /></button>
 </div>

 {/* Modal Body - Scrollable */}
 <div className="p-6 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
 {/* Basic Info */}
 <div>
 <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">Personal Information</h4>
 <div className="grid grid-cols-2 gap-4">
 {field(<span>Full Name <span className="text-red-500">*</span></span>, 'name', 'text', { placeholder: 'e.g. Rajesh Kumar' })}
 {field('Phone', 'phone', 'tel', { placeholder: '10-digit mobile' })}

 {/* Role dropdown */}
 <div className="flex flex-col gap-1 z-20">
 <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Role / Designation <span className="text-red-500">*</span></span>
 <CustomSelect
 value={formData.role}
 onChange={val => setFormData(p => ({ ...p, role: val }))}
 options={STAFF_ROLES}
 className="bg-white border-gray-200"
 />
 </div>

 {field('Department / Subject', 'department', 'text', { placeholder: 'e.g. Academics, Maths' })}
 {field('Qualification', 'qualification', 'text', { placeholder: 'e.g. M.Sc., B.Ed.' })}
 {field('Date of Joining', 'joinDate', 'date')}
 <div className="col-span-2">{field('Email (optional)', 'email', 'email', { placeholder: 'staff@school.edu' })}</div>
 </div>
 </div>

 {/* Salary */}
 <div>
 <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 pb-2 mb-4">Salary Structure</h4>
 <div className="grid grid-cols-2 gap-4">
 {field('Basic Pay (₹)', 'basic', 'number')}
 {field('HRA (₹)', 'hra', 'number')}
 {field('Allowances (₹)', 'allowances', 'number')}
 {field('Deductions (₹)', 'deductions', 'number')}
 </div>
 <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 p-3 rounded-lg mt-4">
 <span className="text-sm font-medium text-gray-600">Net Payable</span>
 <span className="text-lg font-brand font-bold text-emerald-600 font-mono">
 ₹{((Number(formData.basic)||0)+(Number(formData.hra)||0)+(Number(formData.allowances)||0)-(Number(formData.deductions)||0)).toLocaleString()}
 </span>
 </div>
 </div>
 </div>

 {/* Modal Footer - Fixed */}
 <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100 shrink-0 bg-gray-50/50">
 <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancel</button>
 <button onClick={handleSave} className="px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors">
 {editingId ? 'Update Profile' : 'Save Staff Member'}
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}

