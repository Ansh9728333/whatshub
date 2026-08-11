import React from 'react';
import { Megaphone, Plus, ShieldCheck, Play, Pause, AlertCircle } from 'lucide-react';

export const CampaignsPage: React.FC = () => {
  const campaigns = [
    {
      id: 'cmp-1',
      name: 'August Enterprise Promo',
      status: 'RUNNING',
      recipients: 1420,
      sent: 1100,
      delivered: 1089,
      read: 850,
      failed: 11,
      scheduledAt: 'Aug 11, 2026 10:00 AM',
    },
    {
      id: 'cmp-2',
      name: 'Product Update Announcement',
      status: 'COMPLETED',
      recipients: 890,
      sent: 890,
      delivered: 885,
      read: 720,
      failed: 5,
      scheduledAt: 'Aug 05, 2026 02:30 PM',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Broadcast Campaigns</h1>
          <p className="text-xs text-slate-500">
            Responsible bulk messaging queue with rate-limiting pacing and automated STOP opt-out handling.
          </p>
        </div>

        <button className="flex items-center space-x-2 bg-[#1B548C] hover:bg-[#173F68] text-white text-xs font-semibold px-4 py-2 rounded-md shadow-xs transition">
          <Plus size={14} />
          <span>Launch Campaign</span>
        </button>
      </div>

      {/* Safety & Pacing Banner */}
      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-center justify-between text-xs text-[#1B548C]">
        <div className="flex items-center space-x-2.5">
          <ShieldCheck size={18} className="text-[#1B548C]" />
          <div>
            <span className="font-bold">Responsible Traffic Control Active:</span> Inter-message delay set to 5–15 seconds jitter. Unsubscribed contacts ("STOP") are automatically suppressed.
          </div>
        </div>
      </div>

      {/* Campaign List */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3 px-4">Campaign Name</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Progress</th>
              <th className="py-3 px-4">Delivered</th>
              <th className="py-3 px-4">Read Rate</th>
              <th className="py-3 px-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {campaigns.map((cmp) => {
              const progressPct = Math.round((cmp.sent / cmp.recipients) * 100);
              return (
                <tr key={cmp.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-bold text-slate-800">{cmp.name}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cmp.status === 'RUNNING'
                          ? 'bg-emerald-100 text-emerald-700 animate-pulse'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {cmp.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 w-48">
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#1B548C] h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500">{progressPct}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700">
                    {cmp.delivered} / {cmp.recipients}
                  </td>
                  <td className="py-3 px-4 text-emerald-600 font-bold">
                    {Math.round((cmp.read / cmp.delivered) * 100)}%
                  </td>
                  <td className="py-3 px-4">
                    {cmp.status === 'RUNNING' ? (
                      <button className="flex items-center space-x-1 text-amber-700 font-semibold hover:underline">
                        <Pause size={12} /> <span>Pause</span>
                      </button>
                    ) : (
                      <button className="flex items-center space-x-1 text-[#1B548C] font-semibold hover:underline">
                        <Play size={12} /> <span>View Report</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
