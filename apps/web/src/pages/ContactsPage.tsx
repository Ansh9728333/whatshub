import React, { useState } from 'react';
import { Search, Plus, Upload, Download, Tag, Phone, Mail, Building } from 'lucide-react';

export const ContactsPage: React.FC = () => {
  const [showImportModal, setShowImportModal] = useState(false);
  const [search, setSearch] = useState('');

  const contacts = [
    {
      id: 'c1',
      name: 'Kendra Lord',
      phone: '+1 (415) 555-2671',
      email: 'kendra.lord@acmecorp.com',
      company: 'Acme Global Ltd',
      stage: 'Proposal Sent',
      owner: 'Alex Vance',
      value: 4250,
      optIn: true,
    },
    {
      id: 'c2',
      name: 'Jennifer Miller',
      phone: '+1 (415) 555-8910',
      email: 'j.miller@techcorp.io',
      company: 'TechCorp Systems',
      stage: 'Contacted',
      owner: 'Alex Vance',
      value: 1200,
      optIn: true,
    },
    {
      id: 'c3',
      name: 'Oscar Isaac',
      phone: '+1 (415) 555-3412',
      email: 'oscar@star.com',
      company: 'Star Inc',
      stage: 'Won',
      owner: 'Alex Vance',
      value: 8900,
      optIn: true,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-4">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Contacts CRM</h1>
          <p className="text-xs text-slate-500">
            Manage workspace customer profiles, lead stages, follow-ups, and opt-in consent status.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-2 rounded-md transition border border-slate-200"
          >
            <Upload size={14} />
            <span>Import CSV</span>
          </button>

          <button className="flex items-center space-x-1.5 bg-[#1B548C] hover:bg-[#173F68] text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition">
            <Plus size={14} />
            <span>Create Contact</span>
          </button>
        </div>
      </div>

      {/* Toolbar & Filters */}
      <div className="bg-white p-3 border border-[#E2E8F0] rounded-lg shadow-xs flex items-center justify-between">
        <div className="relative w-72">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, phone, company..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-[#F5F7F9] border border-slate-200 rounded-md focus:outline-none focus:border-[#1B548C]"
          />
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <select className="bg-[#F5F7F9] border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-600">
            <option value="">All Lead Stages</option>
            <option value="New Inquiry">New Inquiry</option>
            <option value="Proposal Sent">Proposal Sent</option>
            <option value="Won">Won</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Contact</th>
              <th className="py-3 px-4">Phone</th>
              <th className="py-3 px-4">Company</th>
              <th className="py-3 px-4">Lead Stage</th>
              <th className="py-3 px-4">Owner</th>
              <th className="py-3 px-4">Customer Value</th>
              <th className="py-3 px-4">Opt-In</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {contacts.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/80 transition">
                <td className="py-3 px-4 font-semibold text-slate-800">{c.name}</td>
                <td className="py-3 px-4 text-slate-600">{c.phone}</td>
                <td className="py-3 px-4 text-slate-600">{c.company}</td>
                <td className="py-3 px-4">
                  <span className="bg-blue-50 text-[#1B548C] font-semibold px-2 py-0.5 rounded text-[10px] border border-blue-200">
                    {c.stage}
                  </span>
                </td>
                <td className="py-3 px-4 text-slate-600">{c.owner}</td>
                <td className="py-3 px-4 font-bold text-emerald-600">${c.value.toLocaleString()}</td>
                <td className="py-3 px-4">
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    Opted In
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* CSV Import Modal Simulator */}
      {showImportModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-slate-800">Import Contacts CSV</h3>
            <p className="text-xs text-slate-500">
              Upload a CSV file containing contact details. Columns will be mapped automatically.
            </p>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center bg-slate-50 hover:bg-slate-100 transition cursor-pointer">
              <Upload size={24} className="mx-auto text-slate-400 mb-2" />
              <p className="text-xs font-medium text-slate-700">Click to upload or drag & drop CSV</p>
              <p className="text-[10px] text-slate-400">Supports .csv files up to 10MB</p>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowImportModal(false)}
                className="bg-slate-100 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={() => setShowImportModal(false)}
                className="bg-[#1B548C] text-white text-xs font-semibold px-4 py-1.5 rounded-md hover:bg-[#173F68]"
              >
                Start Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
