import React, { Fragment } from 'react';
import { Listbox, Transition } from '@headlessui/react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ value, onChange, options, className = "", placeholder = "Select option", error = false }) {
 // options can be an array of strings ['A', 'B'] or objects [{label: 'A', value: 'a'}]
 const normalize = (opt) => {
 if (!opt) return { label: '', value: '' };
 if (typeof opt === 'object') return { label: opt.label || String(opt.value || ''), value: opt.value ?? opt.label };
 return { label: String(opt), value: String(opt) };
 };
 const normalizedOptions = (options || []).map(normalize);
 
 const selectedOption = normalizedOptions.find(o => String(o.value) === String(value)) || null;

 return (
 <Listbox value={value} onChange={onChange}>
 <div className="relative">
 <Listbox.Button className={`relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-navy/20 sm:text-sm ${
 error ? 'border-cta focus:border-cta' : 'border-gray-200 focus:border-navy hover:border-gray-300'
 } ${className}`}>
 <span className={`block truncate ${!selectedOption ? 'text-gray-400' : 'text-gray-900'}`}>
 {selectedOption ? selectedOption.label : placeholder}
 </span>
 <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
 <ChevronDown className="size-4 text-gray-400" aria-hidden="true" />
 </span>
 </Listbox.Button>
 <Transition
 as={Fragment}
 leave="transition ease-in duration-100"
 leaveFrom="opacity-100"
 leaveTo="opacity-0"
 >
 <Listbox.Options className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-modal ring-1 ring-black/5 focus:outline-none sm:text-sm">
 {normalizedOptions.map((opt, i) => (
 <Listbox.Option
 key={i}
 className={({ active }) =>
 `relative cursor-pointer select-none py-2 pl-10 pr-4 transition-colors ${
 active ? 'bg-navy/5 text-navy font-medium' : 'text-gray-900'
 }`
 }
 value={opt.value}
 >
 {({ selected }) => (
 <>
 <span className={`block truncate ${selected ? 'font-medium text-navy' : 'font-normal'}`}>
 {opt.label}
 </span>
 {selected ? (
 <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-navy">
 <Check className="size-4" aria-hidden="true" />
 </span>
 ) : null}
 </>
 )}
 </Listbox.Option>
 ))}
 </Listbox.Options>
 </Transition>
 </div>
 </Listbox>
 );
}
