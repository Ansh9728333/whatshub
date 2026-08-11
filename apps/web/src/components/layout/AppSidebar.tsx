import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MessageSquare,
  Users,
  Megaphone,
  Bot,
  Settings,
  CreditCard,
  PhoneCall,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Send,
  Zap,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AppSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();

  const navGroups = [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { label: 'WhatsApp Sessions', icon: PhoneCall, path: '/sessions' },
      ],
    },
    {
      title: 'MESSAGING & CRM',
      items: [
        { label: 'Inbox', icon: MessageSquare, path: '/inbox', badge: '7' },
        { label: 'Contacts CRM', icon: Users, path: '/contacts' },
        { label: 'Campaigns', icon: Megaphone, path: '/campaigns' },
        { label: 'Send Message', icon: Send, path: '/send' },
      ],
    },
    {
      title: 'AUTOMATION',
      items: [
        { label: 'Quick Replies', icon: Zap, path: '/quick-replies' },
        { label: 'Automation Rules', icon: Bot, path: '/automation' },
      ],
    },
    {
      title: 'MANAGEMENT',
      items: [
        { label: 'Billing & Plans', icon: CreditCard, path: '/billing' },
        { label: 'Audit Logs', icon: ShieldCheck, path: '/audit-logs' },
        { label: 'Settings', icon: Settings, path: '/settings' },
      ],
    },
  ];

  return (
    <aside
      className={`relative flex flex-col bg-[#1B548C] text-white transition-all duration-300 border-r border-[#173F68] z-30 select-none ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-14 px-4 border-b border-[#173F68]">
        {!collapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-white shadow">
              W
            </div>
            <span className="font-bold text-base tracking-tight text-white">WhatsApp AI</span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center font-bold text-white mx-auto shadow">
            W
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1 rounded hover:bg-[#173F68] text-slate-300 hover:text-white transition"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Navigation Groups */}
      <div className="flex-1 overflow-y-auto py-3 space-y-4 px-2">
        {navGroups.map((group, idx) => (
          <div key={idx}>
            {!collapsed && (
              <p className="px-3 text-[10px] font-bold text-blue-200/60 uppercase tracking-wider mb-1">
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-[#DCECF8] text-[#1B548C] font-semibold shadow-sm'
                        : 'text-blue-100 hover:bg-[#E8F2FA]/10 hover:text-white'
                    } ${collapsed ? 'justify-center' : 'justify-between'}`
                  }
                  title={collapsed ? item.label : undefined}
                >
                  <div className="flex items-center space-x-2.5">
                    <item.icon size={16} className="shrink-0" />
                    {!collapsed && <span>{item.label}</span>}
                  </div>
                  {!collapsed && item.badge && (
                    <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-[#173F68] flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-2 overflow-hidden">
            <img
              src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'}
              alt={user?.full_name}
              className="w-8 h-8 rounded-full border border-white/20 object-cover"
            />
            <div className="truncate">
              <p className="text-xs font-medium text-white truncate">{user?.full_name}</p>
              <p className="text-[10px] text-blue-200 truncate">{user?.email}</p>
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="p-1.5 rounded hover:bg-red-500/20 text-slate-300 hover:text-red-300 transition"
          title="Sign out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};
