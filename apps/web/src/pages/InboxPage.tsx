import React, { useState } from 'react';
import { InboxFilterSidebar } from '../components/inbox/InboxFilterSidebar';
import { ConversationList, ConversationItemData } from '../components/inbox/ConversationList';
import { ActiveChatPanel, ChatMessageItem } from '../components/inbox/ActiveChatPanel';
import { CustomerProfilePanel } from '../components/inbox/CustomerProfilePanel';

const INITIAL_CONVERSATIONS: ConversationItemData[] = [
  {
    id: 'conv-1',
    name: 'Kendra Lord',
    phone: '+1 (415) 555-2671',
    lastMessage: 'Mark is typing in this chat...',
    timestamp: '17h',
    unreadCount: 3,
    isTyping: true,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80',
    assignedAgentAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
    status: 'OPEN',
  },
  {
    id: 'conv-2',
    name: 'Jennifer Miller',
    phone: '+1 (415) 555-8910',
    lastMessage: 'Could you send the invoice for last month?',
    timestamp: '1d',
    unreadCount: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
    status: 'OPEN',
  },
  {
    id: 'conv-3',
    name: 'Oscar Isaac',
    phone: '+1 (415) 555-3412',
    lastMessage: 'Thank you for resolving my ticket so quickly!',
    timestamp: '2d',
    unreadCount: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    status: 'RESOLVED',
  },
  {
    id: 'conv-4',
    name: 'Tim Cook',
    phone: '+1 (415) 555-9081',
    lastMessage: 'When is our demo scheduled for?',
    timestamp: '3d',
    unreadCount: 1,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
    status: 'PENDING',
  },
  {
    id: 'conv-5',
    name: 'Mateo Kovacic',
    phone: '+1 (415) 555-1122',
    lastMessage: 'Looking forward to trying out WhatsHub.',
    timestamp: '4d',
    unreadCount: 0,
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=200&q=80',
    status: 'OPEN',
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessageItem[]> = {
  'conv-1': [
    {
      id: 'm1',
      sender: 'contact',
      text: 'Hello Alex! I am interested in setting up 25 WhatsApp slots for our customer support team.',
      timestamp: '10:14 AM',
    },
    {
      id: 'm2',
      sender: 'agent',
      senderName: 'Alex Vance',
      text: 'Hi Kendra! Absolutely. WhatsHub supports durable session restoration across all slots. Would you like me to send over our enterprise proposal?',
      timestamp: '10:16 AM',
      status: 'read',
    },
    {
      id: 'm3',
      sender: 'agent',
      isNote: true,
      text: 'Note: Client requested official enterprise proposal for 25 WhatsApp slots before Friday.',
      timestamp: '10:18 AM',
    },
    {
      id: 'm4',
      sender: 'contact',
      text: 'Yes please! That would be fantastic.',
      timestamp: '10:20 AM',
    },
  ],
};

export const InboxPage: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedConvId, setSelectedConvId] = useState('conv-1');
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState(INITIAL_CONVERSATIONS);
  const [messagesMap, setMessagesMap] = useState(INITIAL_MESSAGES);

  const selectedConv = conversations.find((c) => c.id === selectedConvId) || conversations[0];
  const currentMessages = messagesMap[selectedConvId] || [];

  const handleSendMessage = (text: string, isNote = false) => {
    const newMsg: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      sender: isNote ? 'agent' : 'agent',
      senderName: 'Alex Vance',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isNote,
    };

    setMessagesMap((prev) => ({
      ...prev,
      [selectedConvId]: [...(prev[selectedConvId] || []), newMsg],
    }));

    if (!isNote) {
      setConversations((prev) =>
        prev.map((c) =>
          c.id === selectedConvId ? { ...c, lastMessage: text, timestamp: 'Just now' } : c
        )
      );
    }
  };

  const handleResolve = () => {
    setConversations((prev) =>
      prev.map((c) => (c.id === selectedConvId ? { ...c, status: 'RESOLVED' } : c))
    );
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Panel 2: Chat Filters */}
      <InboxFilterSidebar activeFilter={activeFilter} onSelectFilter={setActiveFilter} />

      {/* Panel 3: Conversation List */}
      <ConversationList
        conversations={conversations}
        selectedId={selectedConvId}
        onSelect={setSelectedConvId}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Panel 4: Active Chat Thread */}
      <ActiveChatPanel
        conversationId={selectedConvId}
        contactName={selectedConv.name}
        contactPhone={selectedConv.phone}
        contactAvatar={selectedConv.avatarUrl}
        status={selectedConv.status}
        messages={currentMessages}
        onSendMessage={handleSendMessage}
        onResolve={handleResolve}
      />

      {/* Panel 5: Customer CRM Profile */}
      <CustomerProfilePanel
        contactName={selectedConv.name}
        contactPhone={selectedConv.phone}
      />
    </div>
  );
};
