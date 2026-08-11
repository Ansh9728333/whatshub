# WHATS HUB — MASTER IMPLEMENTATION PLAN (IMPLEMENTATION_PLAN.md)

## IMPLEMENTATION PHASES OVERVIEW

```
PHASE 0: Repository Audit & Monorepo Initialization
   │
   ▼
PHASE 1: Database Schema & Supabase RLS Migration
   │
   ▼
PHASE 2: Design Tokens & Responsive Desktop App Shell
   │
   ▼
PHASE 3: Authentication & Multi-Tenant Isolation Middleware
   │
   ▼
PHASE 4: Baileys Session Manager & Railway Startup Restoration Engine
   │
   ▼
PHASE 5: Realtime Socket.IO Communications Engine
   │
   ▼
PHASE 6: 5-Panel Shared Team Inbox Experience
   │
   ▼
PHASE 7: Contacts CRM, Leads Kanban & Follow-up Manager
   │
   ▼
PHASE 8: Responsible Campaign Queue, Message Pacing & Opt-out Processing
   │
   ▼
PHASE 9: Automation Rules Engine & Quick Replies
   │
   ▼
PHASE 10: External REST API v1 & HMAC Signed Webhooks
   │
   ▼
PHASE 11: Teams, RBAC & Audit Log Engine
   │
   ▼
PHASE 12: Billing, Usage Meters & Entitlements Service
   │
   ▼
PHASE 13: Analytics & Reporting Engine
   │
   ▼
PHASE 14: AI Bot Studio Abstraction & Inbox Copilot
   │
   ▼
PHASE 15: Security Audit, E2E Verification & Production Release
```

---

## DETAILED PHASE BREAKDOWN

### Phase 0: Repository Audit & Monorepo Setup
- Audit legacy `d:\whatsapp` repository and document findings in `docs/ANTIGRAVITY_AUDIT.md`.
- Initialize standard monorepo structure in `d:\whatsappmeta` with npm workspaces (`apps/web`, `apps/api`, `packages/shared`, `supabase/migrations`).

### Phase 1: Database Schema & Supabase RLS Migration
- Execute SQL migrations creating all multi-tenant tables (`workspaces`, `whatsapp_sessions`, `whatsapp_auth_states`, `contacts`, `conversations`, `messages`, `campaigns`, `automation_rules`, `audit_logs`).
- Apply PostgreSQL RLS policies with `has_workspace_access()` helper function.

### Phase 2: Design Tokens & Responsive Desktop App Shell
- Implement CSS variables for Navy Blue SaaS visual tokens.
- Build responsive `AppSidebar` with expandable/collapsible state and tooltips.
- Build `TopNavigation` with Cmd+K global search modal, notification drawer, and workspace switcher.

### Phase 3: Authentication & Multi-Tenant Security
- Connect Supabase Auth in `apps/web` (Signup, Login, Password Reset, Profile).
- Build Node.js backend middleware (`requireAuth`, `requireWorkspace`, `checkRole`).
- Implement automatic workspace provisioning on user registration (workspace, owner assignment, default settings).

### Phase 4: Baileys Session Persistence & Railway Recovery (TOP PRIORITY P0)
- Build `SessionManager` class with `MessagingProvider` interface implementation (`BaileysProvider`).
- Implement server-side AES-256-GCM encryption/decryption of auth states stored in `whatsapp_auth_states`.
- Build backend boot hook `restoreAllSessions()` to automatically reconnect all active sessions after Railway container redeployments.

### Phase 5: Realtime Socket.IO Communications Engine
- Setup Socket.IO server with JWT authentication.
- Implement room join/leave logic for `workspace:{id}`, `session:{id}`, and `conversation:{id}`.
- Emit live events (`session:qr`, `session:status`, `message:new`, `conversation:typing`).

### Phase 6: 5-Panel Shared Team Inbox Experience
- Build desktop 5-panel inbox layout (Main Nav | Filter Sidebar | Conversation List | Active Chat | Customer Profile Panel).
- Implement multi-tab message composer (Reply, Internal Note, Quick Reply, Scheduled, AI Suggestion).
- Build agent chat assignment, resolve/reopen lifecycle, and chat lock features.

### Phase 7: Contacts CRM & Leads Pipeline
- Build paginated Contacts table (50/page) with column sorting, filters, and CSV export.
- Build CSV Import Wizard with header mapping, preview, validation, and duplicate detection.
- Build Kanban Leads Pipeline with drag-and-drop stage updates.
- Build Follow-Up Manager with due date reminders.

### Phase 8: Responsible Campaign Queue & Opt-Out Handler
- Build Campaign creation wizard with audience filtering and message preview.
- Implement atomic message job queue worker with traffic pacing (inter-message delay, batch size, pause/resume).
- Enforce idempotency via composite unique key `(campaign_id, phone_e164)`.
- Build incoming message "STOP" / "UNSUBSCRIBE" keyword handler for automated marketing suppression.

### Phase 9: Automation Rules Engine & Quick Replies
- Build rule-based automation processor for incoming message triggers and workspace actions.
- Build workspace Quick Replies library with variables (`{{first_name}}`, `{{phone}}`).

### Phase 10: External REST API v1 & Webhook Engine
- Build `X-API-Key` authentication middleware with key hashing (`wh_live_...`).
- Implement external REST endpoints (`/api/v1/messages/send`, `/api/v1/contacts`).
- Build HMAC SHA-256 Webhook dispatch worker with retries and signature header `X-WhatsHub-Signature`.

### Phase 11: Teams, RBAC & Audit Logs
- Implement backend authorization guards for roles (`PLATFORM_SUPER_ADMIN`, `WORKSPACE_OWNER`, `WORKSPACE_ADMIN`, `MANAGER`, `AGENT`, `VIEWER`).
- Build searchable Audit Log recorder for security-sensitive workspace actions.

### Phase 12: Billing & Entitlements
- Implement `EntitlementService` to enforce workspace plan limits (WhatsApp slots, contact limits, monthly campaigns, API keys).
- Build Billing & Subscription UI with live usage progress meters.

### Phase 13: Analytics Engine
- Build real data-driven analytics dashboard (Message volume, Inbound vs Outbound, Response time, Agent performance).

### Phase 14: AI Bot Studio Abstraction
- Implement `AIProvider` abstraction with fallback agent handoff.
- Build Inbox Copilot for reply suggestions and chat summaries (with explicit human approval before send).

### Phase 15: Production Verification & QA
- Run full automated build (`npm run build`), linting (`npm run lint`), and E2E acceptance tests.
