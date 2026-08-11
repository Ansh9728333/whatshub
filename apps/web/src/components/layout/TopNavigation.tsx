import React from 'react';
import { Search, Bell, HelpCircle, ChevronDown, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const TopNavigation: React.FC = () => {
  const { currentWorkspace } = useAuth();

  return (
    <header className="h-14 bg-white border-b border-[#E2E8F0] px-4 flex items-center justify-between shrink-0 z-20">
      {/* Search Input & Cmd+K Shortcut */}
      <div className="flex items-center space-x-3 w-80">
        <div className="relative w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search contacts, messages (Ctrl+K)..."
            className="w-full pl-9 pr-12 py-1.5 text-xs bg-[#F5F7F9] border border-slate-200 rounded-md focus:outline-none focus:border-[#1B548C] transition"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-medium text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
            ⌘K
          </span>
        </div>
      </div>

      {/* Right Controls: Status, Workspace, Help, Notifications */}
      <div className="flex items-center space-x-4 text-slate-600">
        {/* Connection Status Badge */}
        <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-medium">
          <CheckCircle2 size={13} className="text-emerald-500" />
          <span>WhatsApp Connected</span>
        </div>

        {/* Workspace Switcher */}
        <button className="flex items-center space-x-2 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-700 transition">
          <span className="truncate max-w-[120px]">{currentWorkspace?.name}</span>
          <ChevronDown size={14} className="text-slate-400" />
        </button>

        {/* Notifications & Help */}
        <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 relative">
          <Bell size={16} />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500"></span>
        </button>
        <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700">
          <HelpCircle size={16} />
        </button>
      </div>
    </header>
  );
};
