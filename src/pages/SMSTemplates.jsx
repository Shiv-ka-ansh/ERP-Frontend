import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2, X, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { api } from '../api/client';

const VARIABLE_CHIPS = ['[STUDENT_NAME]', '[CLASS]', '[AMOUNT]', '[MONTH]', '[DATE]', '[PARENT_NAME]'];

export default function SMSTemplates() {
 const navigate = useNavigate();
 const { showToast, showConfirm } = useAppContext();
 const [templates, setTemplates] = useState([]);

 const [showModal, setShowModal] = useState(false);
 const [editingId, setEditingId] = useState(null);
 const [formTitle, setFormTitle] = useState('');
 const [formContent, setFormContent] = useState('');
 const textareaRef = useRef(null);

 // Load templates from backend
 useEffect(() => {
 api.communication.templates.list()
 .then(res => {
 const data = res?.data || [];
 return setTemplates(data.map(t => ({ id: t._id, title: t.title || t.name, content: t.content || t.body })));
 })
 .catch(() => setTemplates([]));
 }, []);

 const openAddModal = () => {
 setEditingId(null);
 setFormTitle('');
 setFormContent('');
 setShowModal(true);
 };

 const openEditModal = (template) => {
 setEditingId(template.id);
 setFormTitle(template.title);
 setFormContent(template.content);
 setShowModal(true);
 };

 const insertVariable = (variable) => {
 const ta = textareaRef.current;
 if (!ta) return;
 const start = ta.selectionStart;
 const end = ta.selectionEnd;
 const newContent = formContent.substring(0, start) + variable + formContent.substring(end);
 setFormContent(newContent);
 setTimeout(() => {
 ta.focus();
 ta.setSelectionRange(start + variable.length, start + variable.length);
 }, 0);
 };

 const handleSave = async () => {
 if (!formTitle.trim()) {
 showToast('error', 'Please enter a template title');
 return;
 }
 if (!formContent.trim()) {
 showToast('error', 'Please enter message content');
 return;
 }
 try {
 if (editingId) {
 await api.communication.templates.update(editingId, { title: formTitle.trim(), content: formContent.trim() });
 setTemplates(prev => prev.map(t => t.id === editingId ? { ...t, title: formTitle.trim(), content: formContent.trim() } : t));
 showToast('success', 'Template updated successfully');
 } else {
 const res = await api.communication.templates.create({ title: formTitle.trim(), content: formContent.trim() });
 const created = res?.data || res;
 setTemplates(prev => [...prev, { id: created?._id || Date.now(), title: formTitle.trim(), content: formContent.trim() }]);
 showToast('success', 'Template created successfully');
 }
 setShowModal(false);
 } catch {
 showToast('error', 'Failed to save template');
 }
 };

 const handleDelete = (id) => {
 showConfirm('Are you sure you want to delete this template?', async () => {
 try {
 await api.communication.templates.remove(id);
 setTemplates(prev => prev.filter(t => t.id !== id));
 showToast('success', 'Template deleted');
 } catch {
 showToast('error', 'Failed to delete template');
 }
 });
 };

 return (
 <div className="min-h-screen">
 <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-navy mb-4 transition-colors">
 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg> Back
 </button>
 <div className="flex items-center justify-between mb-6">
 <h1 className="text-xl font-bold text-navy font-brand">SMS Templates</h1>
 <button onClick={openAddModal} className="inline-flex items-center gap-2 px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark transition-colors">
 <Plus size={18} /> New Template
 </button>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
 {templates.length === 0 && (
 <div className="col-span-full text-center py-12 text-gray-400 text-sm">No templates found. Click "New Template" to create one.</div>
 )}
 {templates.map(t => (
 <div key={t.id} className="bg-white rounded-xl shadow-card p-5">
 <div className="flex justify-between mb-4">
 <h3 className="font-brand font-semibold text-navy">{t.title}</h3>
 <div className="flex gap-2">
 <button onClick={() => openEditModal(t)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"><Edit2 size={14} /></button>
 <button onClick={() => handleDelete(t.id)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-cta"><Trash2 size={14} /></button>
 </div>
 </div>
 <p className="text-gray-500 text-sm leading-relaxed min-h-[60px]">{t.content}</p>
 <div className="flex items-center justify-between mt-4">
 <span className="text-gray-400 font-mono text-[11px]">Length: {t.content.length} chars</span>
 {t.content.length > 160 && (
 <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-600 rounded-full px-2 py-0.5 text-[10px] font-medium">
 <AlertTriangle size={10} /> Multi-SMS
 </span>
 )}
 </div>
 </div>
 ))}
 </div>

 {/* Add/Edit Modal */}
 {showModal && (
 <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
 <div className="bg-white rounded-2xl shadow-modal w-full max-w-md">
 <div className="flex items-center justify-between p-6 bg-navy rounded-t-2xl">
 <h3 className="font-brand text-white text-sm font-semibold">{editingId ? 'Edit Template' : 'New Template'}</h3>
 <button onClick={() => setShowModal(false)}><X size={20} className="text-white/70 hover:text-white" /></button>
 </div>
 <div className="p-6">
 <div className="flex flex-col gap-1 mb-4">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Template Title</label>
 <input type="text" placeholder="e.g. Fee Reminder" value={formTitle} onChange={e => setFormTitle(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors" />
 </div>
 <div className="flex flex-col gap-1 mb-3">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Message Body</label>
 <textarea ref={textareaRef} rows={4} placeholder="Type your message here..." value={formContent} onChange={e => setFormContent(e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-cta focus:ring-2 focus:ring-cta/20 transition-colors resize-none" />
 </div>
 <div className="flex items-center justify-between mb-3">
 <span className={`font-mono text-xs ${formContent.length > 160 ? 'text-amber-600 font-bold' : 'text-gray-400'}`}>{formContent.length}/160 chars</span>
 {formContent.length > 160 && (
 <span className="inline-flex items-center gap-1 text-amber-600 text-xs font-medium"><AlertTriangle size={12} /> Will send as {Math.ceil(formContent.length / 160)} SMS</span>
 )}
 </div>
 <div className="flex flex-col gap-1">
 <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Available Variables (click to insert)</label>
 <div className="flex flex-wrap gap-1.5 mt-1">
 {VARIABLE_CHIPS.map(v => (
 <button key={v} onClick={() => insertVariable(v)} className="px-2.5 py-1 bg-cta/10 text-cta rounded-full text-xs font-mono font-medium hover:bg-cta/20 transition-colors">
 {v}
 </button>
 ))}
 </div>
 </div>
 </div>
 <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-100">
 <button onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-medium">Cancel</button>
 <button onClick={handleSave} className="px-4 py-2 bg-cta text-white rounded-lg text-sm font-medium hover:bg-cta-dark">{editingId ? 'Update' : 'Save'}</button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
}
