import React, { useState } from 'react';
import {
  CheckCircle2,
  UserPlus,
  MoreVertical,
  Paperclip,
  Smile,
  Send,
  Sparkles,
  Clock,
  Zap,
  MessageSquare,
  FileText,
  Lock,
} from 'lucide-react';

export interface ChatMessageItem {
  id: string;
  sender: 'contact' | 'agent' | 'system';
  senderName?: string;
  text: string;
  timestamp: string;
  status?: 'sent' | 'delivered' | 'read';
  mediaUrl?: string;
  isNote?: boolean;
}

interface ActiveChatPanelProps {
  conversationId: string;
  contactName: string;
  contactPhone: string;
  contactAvatar: string;
  status: string;
  messages: ChatMessageItem[];
  onSendMessage: (text: string, isNote?: boolean) => void;
  onResolve: () => void;
}

export const ActiveChatPanel: React.FC<ActiveChatPanelProps> = ({
  contactName,
  contactPhone,
  contactAvatar,
  messages,
  onSendMessage,
  onResolve,
}) => {
  const [composerMode, setComposerMode] = useState<'reply' | 'note' | 'quick' | 'schedule' | 'ai'>('reply');
  const [messageText, setMessageText] = useState('');
  const [noteText, setNoteText] = useState('');

  const handleSend = () => {
    if (composerMode === 'note') {
      if (!noteText.trim()) return;
      onSendMessage(noteText, true);
      setNoteText('');
    } else {
      if (!messageText.trim()) return;
      onSendMessage(messageText, false);
      setMessageText('');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#F5F7F9] min-w-0 border-r border-[#E2E8F0]">
      {/* Chat Header */}
      <div className="h-14 bg-white border-b border-[#E2E8F0] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-3">
          <img
            src={contactAvatar}
            alt={contactName}
            className="w-8 h-8 rounded-full object-cover border border-slate-200"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xs font-bold text-slate-800">{contactName}</h2>
              <span className="bg-emerald-100 text-emerald-700 text-[10px] font-medium px-1.5 py-0.2 rounded">
                WhatsApp Online
              </span>
            </div>
            <p className="text-[10px] text-slate-400">{contactPhone}</p>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onResolve}
            className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-md text-xs font-medium transition"
          >
            <CheckCircle2 size={14} className="text-emerald-600" />
            <span>Resolve</span>
          </button>

          <button className="flex items-center space-x-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-1.5 rounded-md text-xs font-medium transition">
            <UserPlus size={14} />
            <span>Assign</span>
          </button>

          <button className="p-1.5 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-600">
            <MoreVertical size={16} />
          </button>
        </div>
      </div>

      {/* Messages Thread Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          if (msg.isNote) {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <div className="bg-[#FEF3C7] border border-amber-200 text-amber-900 px-3 py-2 rounded-lg text-xs max-w-md w-full shadow-xs">
                  <div className="flex items-center justify-between mb-1 font-semibold text-[10px] text-amber-700">
                    <span className="flex items-center space-x-1">
                      <Lock size={12} />
                      <span>Internal Team Note</span>
                    </span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{msg.text}</p>
                </div>
              </div>
            );
          }

          const isOutgoing = msg.sender === 'agent';
          return (
            <div
              key={msg.id}
              className={`flex ${isOutgoing ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-md px-3.5 py-2.5 rounded-2xl shadow-xs text-xs leading-relaxed ${
                  isOutgoing
                    ? 'bg-[#C5E6F1] text-slate-800 rounded-br-none'
                    : 'bg-[#F0F1F2] text-slate-800 rounded-bl-none'
                }`}
              >
                {msg.senderName && (
                  <p className="text-[10px] font-bold text-slate-500 mb-0.5">{msg.senderName}</p>
                )}
                <p>{msg.text}</p>
                <div className="flex items-center justify-end space-x-1 mt-1 text-[9px] text-slate-400">
                  <span>{msg.timestamp}</span>
                  {isOutgoing && (
                    <span className="text-sky-600 font-bold">✓✓</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi-Tab Composer Box */}
      <div className="bg-white border-t border-[#E2E8F0] p-3 shrink-0">
        {/* Composer Tabs */}
        <div className="flex items-center space-x-1 border-b border-slate-100 pb-2 mb-2 text-xs">
          <button
            onClick={() => setComposerMode('reply')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-medium transition ${
              composerMode === 'reply'
                ? 'bg-[#DCECF8] text-[#1B548C] font-semibold'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <MessageSquare size={13} />
            <span>Reply</span>
          </button>

          <button
            onClick={() => setComposerMode('note')}
            className={`flex items-center space-x-1.5 px-3 py-1 rounded-md font-medium transition ${
              composerMode === 'note'
                ? 'bg-amber-100 text-amber-800 font-semibold'
                : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <FileText size={13} />
            <span>Internal Note</span>
          </button>

          <button
            onClick={() => setComposerMode('quick')}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-slate-500 hover:bg-slate-100 font-medium"
          >
            <Zap size={13} className="text-amber-500" />
            <span>Quick Reply</span>
          </button>

          <button
            onClick={() => setComposerMode('ai')}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-purple-600 hover:bg-purple-50 font-medium"
          >
            <Sparkles size={13} />
            <span>AI Suggest</span>
          </button>

          <button
            onClick={() => setComposerMode('schedule')}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-md text-slate-500 hover:bg-slate-100 font-medium"
          >
            <Clock size={13} />
            <span>Schedule</span>
          </button>
        </div>

        {/* Input Area */}
        <div className="space-y-2">
          {composerMode === 'note' ? (
            <textarea
              rows={2}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add an internal note visible only to your team..."
              className="w-full text-xs p-2.5 bg-amber-50/50 border border-amber-200 rounded-md focus:outline-none focus:border-amber-400 text-amber-900"
            />
          ) : (
            <textarea
              rows={2}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              placeholder="Type your WhatsApp message..."
              className="w-full text-xs p-2.5 bg-[#F5F7F9] border border-slate-200 rounded-md focus:outline-none focus:border-[#1B548C] transition"
            />
          )}

          {/* Action Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-400">
              <button className="p-1.5 hover:text-slate-600 rounded">
                <Paperclip size={16} />
              </button>
              <button className="p-1.5 hover:text-slate-600 rounded">
                <Smile size={16} />
              </button>
            </div>

            <button
              onClick={handleSend}
              className={`flex items-center space-x-1.5 px-4 py-1.5 rounded-md text-xs font-semibold text-white shadow-xs transition ${
                composerMode === 'note'
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-[#1B548C] hover:bg-[#173F68]'
              }`}
            >
              <span>{composerMode === 'note' ? 'Add Note' : 'Send'}</span>
              <Send size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
