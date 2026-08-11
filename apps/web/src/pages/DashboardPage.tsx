import React, { useEffect, useState } from 'react';
import {
  PhoneCall,
  MessageCircle,
  Users,
  Megaphone,
  CheckCircle2,
  TrendingUp,
  ArrowUpRight,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchApi } from '../services/apiClient';

interface DashboardData {
  kpis: {
    connectedSessions: number;
    totalSlots: number;
    unreadConversations: number;
    activeConversations: number;
    totalContacts: number;
    messagesToday: number;
    deliveryRate: number;
  };
  sessions: Array<{
    id: string;
    display_name: string;
    phone_number?: string;
    status: string;
    slot_number: number;
  }>;
  recentConversations: Array<{
    id: string;
    last_message_text: string;
    last_message_at: string;
    unread_count: number;
    status: string;
    contact?: {
      name: string;
      phone_e164: string;
    };
  }>;
}

export const DashboardPage: React.FC = () => {
  const { currentWorkspace, token } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboard = async () => {
    if (!currentWorkspace || !token) return;
    setLoading(true);
    setError(null);

    const res = await fetchApi('/api/dashboard/stats', {
      workspaceId: currentWorkspace.id,
      token,
    });

    setLoading(false);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setError(res.error?.message || 'Unable to load dashboard data. Please retry.');
    }
  };

  useEffect(() => {
    loadDashboard();
  }, [currentWorkspace, token]);

  if (loading) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center space-x-2 text-slate-500 text-xs">
        <Loader2 size={18} className="animate-spin text-[#1B548C]" />
        <span>Loading real workspace metrics...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex-1 p-8 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 p-6 rounded-lg text-center max-w-md space-y-3">
          <AlertCircle size={28} className="text-red-500 mx-auto" />
          <h3 className="text-xs font-bold text-red-800">Dashboard Load Failure</h3>
          <p className="text-[11px] text-red-600">{error || 'Failed to fetch dashboard metrics.'}</p>
          <button
            onClick={loadDashboard}
            className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-4 py-2 rounded-md transition flex items-center justify-center space-x-1.5 mx-auto"
          >
            <RefreshCw size={13} />
            <span>Retry</span>
          </button>
        </div>
      </div>
    );
  }

  const kpiCards = [
    {
      title: 'WhatsApp Sessions',
      value: `${data.kpis.connectedSessions} / ${data.kpis.totalSlots} Connected`,
      subtitle: data.kpis.connectedSessions > 0 ? 'Baileys Socket Active' : 'No Active Session',
      icon: PhoneCall,
      color: 'text-[#1B548C]',
      bg: 'bg-blue-50',
    },
    {
      title: 'Unread Conversations',
      value: `${data.kpis.unreadConversations} Unread`,
      subtitle: `${data.kpis.activeConversations} Open / Pending`,
      icon: MessageCircle,
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    },
    {
      title: 'Total Contacts',
      value: `${data.kpis.totalContacts} Contacts`,
      subtitle: `${data.kpis.messagesToday} Messages Today`,
      icon: Users,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Campaign Delivery',
      value: `${data.kpis.deliveryRate}%`,
      subtitle: 'Database Verified',
      icon: Megaphone,
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Workspace Dashboard</h1>
          <p className="text-xs text-slate-500">
            Real-time database metrics for workspace <strong>{currentWorkspace?.name}</strong>.
          </p>
        </div>
        <button
          onClick={loadDashboard}
          className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-md transition"
        >
          <RefreshCw size={13} />
          <span>Refresh Data</span>
        </button>
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

      {/* WhatsApp Connection Slots Table */}
      <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
          <span>Active WhatsApp Connection Slots</span>
          <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Database Verified State
          </span>
        </h3>
        <div className="overflow-x-auto">
          {data.sessions.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No WhatsApp session connected. Go to <strong>WhatsApp Connections</strong> to pair your device.
            </div>
          ) : (
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Slot</th>
                  <th className="py-2.5 px-3">Display Name</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.sessions.map((session) => (
                  <tr key={session.id}>
                    <td className="py-2.5 px-3 font-semibold text-slate-700">Slot #{session.slot_number}</td>
                    <td className="py-2.5 px-3">{session.display_name}</td>
                    <td className="py-2.5 px-3">{session.phone_number || 'Unlinked'}</td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                          session.status === 'CONNECTED'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {session.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
