# WHATS HUB — UI DESIGN SYSTEM SPECIFICATION (UI_DESIGN_SYSTEM.md)

## 1. DESIGN PHILOSOPHY & VISUAL LANGUAGE

WhatsHub adopts a high-density, professional **B2B SaaS visual system** guided by modern customer-support workspace aesthetics. 

The color architecture is built on a clean **Navy Blue + Slate + White** foundation. Green is reserved intentionally for positive status badges, connected sessions, resolved chats, and primary success actions.

---

## 2. DESIGN TOKENS (CSS VARIABLES)

```css
:root {
  /* Primary Navy Brand & Nav Tokens */
  --app-navy: #1B548C;
  --app-navy-dark: #173F68;
  --navigation-hover: #E8F2FA;
  --navigation-selected: #DCECF8;

  /* Surfaces & Backgrounds */
  --app-background: #F5F7F9;
  --surface: #FFFFFF;
  --surface-secondary: #F8FAFC;

  /* Chat Bubble Tokens */
  --chat-outgoing: #C5E6F1;
  --chat-incoming: #F0F1F2;
  --chat-internal-note: #FEF3C7;

  /* Typography & Borders */
  --text-primary: #1F2937;
  --text-secondary: #667085;
  --text-muted: #9CA3AF;
  --border: #E2E8F0;
  --border-focus: #1B548C;

  /* Semantic Status Tokens */
  --brand-green: #10B981;
  --success: #55B82A;
  --warning: #F59E0B;
  --danger: #EF4444;
  --purple-ai: #7C3AED;
}
```

---

## 3. LAYOUT ARCHITECTURE

### 3.1 Inbox 5-Panel Desktop Layout
```
+---------------------------------------------------------------------------------------+
| MAIN NAV  | FILTERS      | CONVERSATION LIST | ACTIVE CHAT           | CUSTOMER PANEL |
| (64-220px)| (180-220px)  | (300-360px)       | (flex-1)              | (280-330px)    |
+---------------------------------------------------------------------------------------+
```

### 3.2 Responsive Behavior
- **Desktop (>= 1280px)**: Complete 5-panel layout visible.
- **Laptop (1024px - 1279px)**: Main Nav collapses to icons (64px). Right Customer Panel toggleable.
- **Tablet (768px - 1023px)**: Main Nav drawer. Inbox switches between List View and Active Chat.
- **Mobile (< 768px)**: Single column stack (Conversation List -> Chat -> Contact Drawer).

---

## 4. COMPONENT ARCHITECTURE & PATTERNS

### 4.1 Navigation Sidebars
- **AppSidebar**: Blue SaaS navigation with section headers (Overview, Messaging & CRM, Automation, Integrations, Management, Account). Collapsible with persistent user preference.
- **TopNavigation**: Compact top header with global search (Ctrl/Cmd + K), active workspace selector, status indicator badge, and user avatar menu.

### 4.2 Inbox Components
- **ConversationListItem**: Compact desktop rows displaying avatar, name/phone, last message snippet, timestamp, unread counter badge, and assigned agent avatar. Light blue background on selection.
- **MessageComposer**: Multi-tab composer (Reply, Internal Note, Quick Reply, Scheduled, AI Suggestion). Internal Note mode renders with warm yellow outline and distinct badge to prevent accidental sending to WhatsApp.
- **CustomerProfilePanel**: Right drawer/sidebar divided into structured sections (Information, Labels, Contact Details, CRM Lead Stage, Internal Notes, Custom Fields).

### 4.3 Data Density & Skeletons
- Compact table padding (`py-2.5 px-4`), clear status badges, zero blank white loading states (skeleton components utilized during queries).
