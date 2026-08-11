# WHATS HUB — SYSTEM ARCHITECTURE SPECIFICATION (ARCHITECTURE.md)

## 1. OVERVIEW & HIGH-LEVEL SYSTEM DIAGRAM

WhatsHub is a production-grade multi-tenant WhatsApp CRM, Shared Team Inbox, Campaign Automation, and API platform built with strict workspace isolation, durable session persistence, and provider abstraction.

```
+-----------------------------------------------------------------------+
|                           BROWSER / CLIENT                            |
|                     Vercel React 19 + Vite SPA                        |
+-----------------------------------------------------------------------+
                                |  ^
                   HTTP REST API|  | Socket.IO WSS
                                v  |
+-----------------------------------------------------------------------+
|                           RAILWAY BACKEND                             |
|               Node.js + Express + TypeScript Service                  |
|                                                                       |
|  +-------------------+  +-------------------+  +-------------------+  |
|  | Auth & RLS Guard  |  | MessagingProvider |  | SessionManager    |  |
|  +-------------------+  +-------------------+  +-------------------+  |
|  | Entitlement Engine|  | Campaign Queue    |  | Socket.IO Server  |  |
|  +-------------------+  +-------------------+  +-------------------+  |
+-----------------------------------------------------------------------+
           |                                       |
           v                                       v
+-----------------------+               +-----------------------+
|       SUPABASE        |               |      WHATSAPP WEB     |
| PostgreSQL + Auth     |               | Baileys / Meta API    |
| Storage + RLS Policies|               | Session Auth Engine   |
+-----------------------+               +-----------------------+
```

---

## 2. MONOREPO STRUCTURE

```
/
├── apps/
│   ├── web/                    # React 19 + Vite + Tailwind CSS Frontend
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components (Sidebar, Inbox, CRM, etc.)
│   │   │   ├── context/        # Auth and Workspace Context providers
│   │   │   ├── hooks/          # TanStack Query & Socket.IO hooks
│   │   │   ├── pages/          # Application routes (Dashboard, Inbox, Campaigns, etc.)
│   │   │   ├── services/       # API client & REST services
│   │   │   ├── styles/         # Centralized CSS Tokens & Tailwind theme
│   │   │   └── types/          # Shared frontend UI types
│   │   └── package.json
│   │
│   └── api/                    # Express + TypeScript Backend
│       ├── src/
│       │   ├── config/         # Environment & Supabase config
│       │   ├── controllers/    # API endpoint handlers
│       │   ├── middleware/     # Auth, Workspace Isolation, RBAC, Rate-limit
│       │   ├── providers/      # MessagingProvider (BaileysProvider, MetaCloudProvider)
│       │   ├── services/       # SessionManager, EntitlementService, CampaignWorker
│       │   ├── sockets/        # Socket.IO event handlers and rooms
│       │   └── index.ts        # Server entrypoint & Railway shutdown hooks
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared TypeScript interfaces, Zod schemas, constants
│       └── src/
│
├── supabase/
│   └── migrations/             # SQL Migrations for tables, functions, RLS policies
│
└── docs/                       # Architectural & API Documentation
```

---

## 3. MULTI-TENANT ISOLATION MODEL

### 3.1 Data Scoping
- Every business table in Supabase PostgreSQL includes a `workspace_id UUID NOT NULL REFERENCES workspaces(id)` column.
- Workspace A cannot access Workspace B data under any circumstances.

### 3.2 Enforcement Architecture
1. **Backend Middleware Enforcement**:
   - `requireAuth`: Validates Supabase Bearer JWT token.
   - `requireWorkspace`: Extracts `x-workspace-id` header, verifies user membership in `workspace_members`, attaches `req.workspaceId` and user role (`req.role`).
   - All backend SQL queries append `WHERE workspace_id = req.workspaceId`.
2. **Supabase Row Level Security (RLS)**:
   - PostgreSQL RLS policies enforce `workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid())`.

---

## 4. PROVIDER ABSTRACTION LAYER (`MessagingProvider`)

To ensure WhatsHub remains provider-agnostic, all communication modules (Inbox, Campaigns, Automations, API) interact strictly through the `MessagingProvider` interface:

```typescript
export interface MessagingProvider {
  connect(sessionId: string): Promise<void>;
  disconnect(sessionId: string): Promise<void>;
  logout(sessionId: string): Promise<void>;
  getStatus(sessionId: string): Promise<SessionStatus>;
  
  sendText(sessionId: string, to: string, text: string): Promise<MessageResult>;
  sendImage(sessionId: string, to: string, imageBuffer: Buffer, caption?: string): Promise<MessageResult>;
  sendDocument(sessionId: string, to: string, docBuffer: Buffer, fileName: string, caption?: string): Promise<MessageResult>;
  sendVideo(sessionId: string, to: string, videoBuffer: Buffer, caption?: string): Promise<MessageResult>;
  sendAudio(sessionId: string, to: string, audioBuffer: Buffer): Promise<MessageResult>;
  
  getGroups(sessionId: string): Promise<GroupMetadata[]>;
  createGroup(sessionId: string, title: string, participants: string[]): Promise<GroupMetadata>;
}
```

Implementations:
- `BaileysProvider`: Unofficial WhatsApp Web integration via scan QR.
- `MetaCloudProvider`: Official WhatsApp Cloud API (future integration).

---

## 5. BAILEYS SESSION PERSISTENCE & RAILWAY RECOVERY

### 5.1 The Problem
Railway containers deploy ephemerally. Local disk authentication state is wiped during redeploys, resulting in lost QR scans.

### 5.2 The Solution (`SessionManager` Architecture)
1. **Serialization & Encryption**:
   - Baileys auth credentials (`creds.json` and key stores) are captured via custom Baileys `useMultiFileAuthState` adapter.
   - Credentials are encrypted using **AES-256-GCM** with the server-side `SESSION_ENCRYPTION_KEY`.
2. **Durable Supabase Storage**:
   - Encrypted auth state is upserted into `whatsapp_auth_states (workspace_id, session_id, encrypted_state, updated_at)`.
3. **Startup Restoration Flow**:
   - On Railway backend boot:
     1. Database pool connects.
     2. `SessionManager.restoreAllSessions()` queries active sessions from `whatsapp_sessions WHERE is_active = true`.
     3. Encrypted payloads are fetched from `whatsapp_auth_states`, decrypted server-side, and restored into memory.
     4. Sockets initialize and reconnect without requiring user QR scan.

---

## 6. REALTIME EVENT ENGINE

Authenticated Socket.IO manages live updates across client sessions.
- **Rooms**:
  - `workspace:{workspaceId}`: Global workspace events (new contact, status changes).
  - `session:{sessionId}`: Session connection status and QR updates.
  - `conversation:{conversationId}`: Live chat messages, typing indicators, read receipts.
- **Events**: `whatsapp.qr`, `whatsapp.connected`, `message.new`, `message.update`, `conversation.typing`.

---

## 7. RESPONSIBLE CAMPAIGN PACING & OPT-OUT QUEUE

- **Queue Architecture**: Outbound campaigns create `campaign_recipients` and atomic `message_jobs`.
- **Duplicate Prevention**: Database uniqueness constraint `UNIQUE(campaign_id, phone_e164)` prevents double-sending.
- **Opt-Out Engine**: Incoming text matching `STOP`, `UNSUBSCRIBE`, or `CANCEL` triggers `marketing_opt_in = false` and adds contact to workspace suppression list automatically.
- **Responsible Traffic Control**: Configurable inter-message delay (e.g. 5–15s jitter), batch sizing, and automatic queue pause on session disconnect.
