import React from 'react';
import { Search, Filter } from 'lucide-react';

export interface ConversationItemData {
  id: string;
  name: string;
  phone: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  isTyping?: boolean;
  avatarUrl: string;
  assignedAgentAvatar?: string;
  status: string;
}

interface ConversationListProps {
  conversations: ConversationItemData[];
  selectedId: string;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({
  conversations,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <div className="w-80 bg-white border-r border-[#E2E8F0] flex flex-col shrink-0">
      {/* Search Header */}
      <div className="p-3 border-b border-[#E2E8F0] flex items-center space-x-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#F5F7F9] border border-slate-200 rounded-md focus:outline-none focus:border-[#1B548C] transition"
          />
        </div>
        <button className="p-1.5 rounded border border-slate-200 text-slate-500 hover:bg-slate-50">
          <Filter size={14} />
        </button>
      </div>

      {/* Conversation List Rows */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">No conversations found.</div>
        ) : (
          conversations.map((item) => {
            const isSelected = item.id === selectedId;
            return (
              <div
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={`p-3 flex items-start space-x-3 cursor-pointer transition select-none ${
                  isSelected ? 'bg-[#DCECF8] border-l-4 border-[#1B548C]' : 'hover:bg-[#F5F7F9]'
                }`}
              >
                {/* Contact Avatar */}
                <div className="relative shrink-0">
                  <img
                    src={item.avatarUrl}
                    alt={item.name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200"
                  />
                  {item.unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
                      {item.unreadCount}
                    </span>
                  )}
                </div>

                {/* Content Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <h3
                      className={`text-xs font-semibold truncate ${
                        isSelected ? 'text-[#1B548C]' : 'text-slate-800'
                      }`}
                    >
                      {item.name}
                    </h3>
                    <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                      {item.timestamp}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 truncate leading-tight">
                    {item.isTyping ? (
                      <span className="text-emerald-600 font-medium italic">
                        typing in chat...
                      </span>
                    ) : (
                      item.lastMessage
                    )}
                  </p>
                </div>

                {/* Assigned Agent Avatar if present */}
                {item.assignedAgentAvatar && (
                  <img
                    src={item.assignedAgentAvatar}
                    alt="Agent"
                    className="w-4 h-4 rounded-full border border-white shrink-0 self-center"
                    title="Assigned Agent"
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
