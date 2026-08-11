import React from 'react';
import {
  Inbox,
  Clock,
  MessageCircle,
  CheckCircle,
  UserCheck,
  Star,
  Users,
  Tag,
  Lock,
  Layers,
} from 'lucide-react';

interface FilterSidebarProps {
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const InboxFilterSidebar: React.FC<FilterSidebarProps> = ({
  activeFilter,
  onSelectFilter,
}) => {
  const mainFilters = [
    { id: 'all', label: 'All', icon: Inbox, count: 12 },
    { id: 'pending', label: 'Pending', icon: Clock, count: 4 },
    { id: 'unread', label: 'Unread', icon: MessageCircle, count: 7 },
    { id: 'not_replied', label: 'Not Replied', icon: UserCheck, count: 3 },
    { id: 'resolved', label: 'Resolved', icon: CheckCircle, count: 21 },
  ];

  const secondaryFilters = [
    { id: 'my_chats', label: 'My Chats', icon: UserCheck, count: 5 },
    { id: 'unassigned', label: 'Not Assigned', icon: Layers, count: 2 },
    { id: 'favorites', label: 'Favorite', icon: Star, count: 1 },
    { id: 'locked', label: 'Locked', icon: Lock, count: 0 },
    { id: 'groups', label: 'Groups', icon: Users, count: 3 },
  ];

  const labelFilters = [
    { id: 'label_vip', label: 'VIP Customer', color: '#EF4444' },
    { id: 'label_hot', label: 'Hot Lead', color: '#F59E0B' },
    { id: 'label_support', label: 'Support Ticket', color: '#10B981' },
    { id: 'label_payment', label: 'Payment Pending', color: '#7C3AED' },
  ];

  return (
    <div className="w-52 bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 text-xs select-none">
      {/* Header */}
      <div className="p-3 border-b border-[#E2E8F0] flex items-center justify-between">
        <h2 className="font-bold text-slate-800 text-sm">Chats</h2>
        <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
          12 Active
        </span>
      </div>

      <div className="flex-1 overflow-y-auto py-2 space-y-4 px-2">
        {/* Main Filters */}
        <div className="space-y-0.5">
          {mainFilters.map((item) => {
            const Icon = item.icon;
            const isSelected = activeFilter === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectFilter(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                  isSelected
                    ? 'bg-[#DCECF8] text-[#1B548C] font-semibold'
                    : 'text-slate-600 hover:bg-[#E8F2FA] hover:text-[#1B548C]'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <Icon size={14} className={isSelected ? 'text-[#1B548C]' : 'text-slate-400'} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && (
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                      isSelected ? 'bg-[#1B548C] text-white' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Secondary Views */}
        <div>
          <p className="px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            VIEWS
          </p>
          <div className="space-y-0.5">
            {secondaryFilters.map((item) => {
              const Icon = item.icon;
              const isSelected = activeFilter === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectFilter(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition ${
                    isSelected
                      ? 'bg-[#DCECF8] text-[#1B548C] font-semibold'
                      : 'text-slate-600 hover:bg-[#E8F2FA] hover:text-[#1B548C]'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Icon size={14} className={isSelected ? 'text-[#1B548C]' : 'text-slate-400'} />
                    <span>{item.label}</span>
                  </div>
                  {item.count !== undefined && (
                    <span className="text-[10px] text-slate-400">{item.count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Labels Section */}
        <div>
          <p className="px-2.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center justify-between">
            <span>LABELS</span>
            <Tag size={12} className="text-slate-400" />
          </p>
          <div className="space-y-0.5">
            {labelFilters.map((label) => (
              <button
                key={label.id}
                onClick={() => onSelectFilter(label.id)}
                className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:bg-[#E8F2FA] transition"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: label.color }}
                />
                <span className="truncate">{label.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
