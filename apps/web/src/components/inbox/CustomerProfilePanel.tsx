import React from 'react';
import {
  User,
  Phone,
  Mail,
  Building,
  Tag,
  Calendar,
  DollarSign,
  Briefcase,
  FileText,
  Clock,
  Plus,
} from 'lucide-react';

interface CustomerProfilePanelProps {
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  company?: string;
  leadStage?: string;
  ownerName?: string;
  customerValue?: number;
  labels?: string[];
}

export const CustomerProfilePanel: React.FC<CustomerProfilePanelProps> = ({
  contactName,
  contactPhone,
  contactEmail = 'kendra.lord@acmecorp.com',
  company = 'Acme Global Ltd',
  leadStage = 'Proposal Sent',
  ownerName = 'Alex Vance',
  customerValue = 4250,
  labels = ['VIP Customer', 'Hot Lead'],
}) => {
  return (
    <div className="w-72 bg-white border-l border-[#E2E8F0] flex flex-col shrink-0 overflow-y-auto text-xs select-none">
      {/* Header Profile Summary */}
      <div className="p-4 border-b border-[#E2E8F0] text-center bg-slate-50/50">
        <div className="w-16 h-16 rounded-full mx-auto mb-2 overflow-hidden border-2 border-white shadow-sm">
          <img
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"
            alt={contactName}
            className="w-full h-full object-cover"
          />
        </div>
        <h3 className="font-bold text-slate-800 text-sm">{contactName}</h3>
        <p className="text-slate-400 text-[11px] mb-2">{company}</p>

        <span className="inline-block bg-blue-50 text-[#1B548C] border border-blue-200 px-2.5 py-0.5 rounded-full font-semibold text-[10px]">
          {leadStage}
        </span>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* Section 1: Information */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            INFORMATION
          </h4>
          <div className="space-y-2 text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Channel</span>
              <span className="font-medium text-slate-800">WhatsApp Web</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Country</span>
              <span className="font-medium text-slate-800">United States (+1)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">First Contact</span>
              <span className="font-medium text-slate-800">Aug 02, 2026</span>
            </div>
          </div>
        </div>

        {/* Section 2: Labels */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              LABELS
            </h4>
            <button className="text-[10px] text-[#1B548C] font-semibold flex items-center hover:underline">
              <Plus size={10} className="mr-0.5" /> Add
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {labels.map((label, idx) => (
              <span
                key={idx}
                className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-medium flex items-center"
              >
                <Tag size={10} className="mr-1 text-amber-600" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Section 3: Contact Details */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            CONTACT DETAILS
          </h4>
          <div className="space-y-2.5 text-slate-600">
            <div className="flex items-center space-x-2">
              <Phone size={13} className="text-slate-400 shrink-0" />
              <span className="truncate">{contactPhone}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail size={13} className="text-slate-400 shrink-0" />
              <span className="truncate">{contactEmail}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Building size={13} className="text-slate-400 shrink-0" />
              <span className="truncate">{company}</span>
            </div>
          </div>
        </div>

        {/* Section 4: CRM Pipeline */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            CRM METRICS
          </h4>
          <div className="bg-[#F5F7F9] p-3 rounded-md space-y-2 border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center">
                <Briefcase size={12} className="mr-1 text-slate-400" /> Owner
              </span>
              <span className="font-semibold text-slate-800">{ownerName}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center">
                <DollarSign size={12} className="mr-1 text-slate-400" /> Value
              </span>
              <span className="font-bold text-emerald-600">${customerValue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center">
                <Calendar size={12} className="mr-1 text-slate-400" /> Follow-Up
              </span>
              <span className="font-medium text-amber-700">Tomorrow 10:00 AM</span>
            </div>
          </div>
        </div>

        {/* Section 5: Notes & Metadata */}
        <div>
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            INTERNAL NOTES
          </h4>
          <div className="bg-amber-50/60 border border-amber-200 p-2.5 rounded-md text-[11px] text-amber-900 leading-normal">
            Client requested official enterprise pricing proposal for 25 WhatsApp slots before Friday.
          </div>
        </div>
      </div>
    </div>
  );
};
