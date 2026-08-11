import React from 'react';
import {
  PhoneCall,
  MessageCircle,
  Users,
  Megaphone,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const kpiCards = [
    {
      title: 'WhatsApp Sessions',
      value: '2 Connected',
      subtitle: 'Slot 1 & Slot 2 Active',
      icon: PhoneCall,
      color: 'text-[#1B548C]',
      bg: 'bg-blue-50',
    },
    {
      title: 'Unread Conversations',
      value: '7 Unread',
      subtitle: '3 Highest Priority',
      icon: MessageCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Total Contacts',
      value: '1,420 Contacts',
      subtitle: '+12% this week',
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Campaign Delivery',
      value: '99.4%',
      subtitle: 'Responsible Pacing Active',
      icon: Megaphone,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-800">Workspace Dashboard</h1>
        <p className="text-xs text-slate-500">
          Real-time overview of WhatsApp connections, team inbox metrics, and contact activity.
        </p>
      </div>

      {/* Onboarding Checklist Card */}
      <div className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-xs flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
            4/6
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-800">Onboarding Setup Progress</h3>
            <p className="text-[11px] text-slate-500">
              Complete initial setup steps to maximize campaign delivery performance.
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="bg-[#1B548C] hover:bg-[#173F68] text-white text-xs font-semibold px-3 py-1.5 rounded-md shadow-xs transition">
            Continue Setup
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white border border-[#E2E8F0] p-4 rounded-lg shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-500">{card.title}</span>
                <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <h2 className="text-lg font-bold text-slate-800 mb-1">{card.value}</h2>
              <p className="text-[11px] text-slate-400 flex items-center">
                <TrendingUp size={12} className="mr-1 text-emerald-500" />
                {card.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Activity & Connections Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
          <span>Active WhatsApp Connection Slots</span>
          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Durable Recovery Enabled
          </span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Slot</th>
                <th className="py-2.5 px-3">Display Name</th>
                <th className="py-2.5 px-3">Phone</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Last Activity</th>
                <th className="py-2.5 px-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-700">Slot #1</td>
                <td className="py-2.5 px-3">Primary Support Line</td>
                <td className="py-2.5 px-3">+1 (415) 555-0199</td>
                <td className="py-2.5 px-3">
                  <span className="bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                    CONNECTED
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-500">2 mins ago</td>
                <td className="py-2.5 px-3">
                  <button className="text-[#1B548C] font-semibold hover:underline flex items-center">
                    Open Inbox <ArrowUpRight size={12} className="ml-0.5" />
                  </button>
                </td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-semibold text-slate-700">Slot #2</td>
                <td className="py-2.5 px-3">Sales & Inquiries</td>
                <td className="py-2.5 px-3">+1 (415) 555-0288</td>
                <td className="py-2.5 px-3">
                  <span className="bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded text-[10px]">
                    CONNECTED
                  </span>
                </td>
                <td className="py-2.5 px-3 text-slate-500">14 mins ago</td>
                <td className="py-2.5 px-3">
                  <button className="text-[#1B548C] font-semibold hover:underline flex items-center">
                    Open Inbox <ArrowUpRight size={12} className="ml-0.5" />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
