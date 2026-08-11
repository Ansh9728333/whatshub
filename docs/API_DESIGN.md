# WHATS HUB — API DESIGN SPECIFICATION (API_DESIGN.md)

## 1. OVERVIEW & PROTOCOL STANDARDS

WhatsHub REST API follows strict RESTful conventions, JSON request/response envelopes, and workspace multi-tenancy headers.

### 1.1 Headers
- **User Session Auth**: `Authorization: Bearer <supabase_jwt_token>`
- **Workspace Scoping**: `x-workspace-id: <workspace_uuid>`
- **Public API Key Auth**: `X-API-Key: wh_live_xxxxxxxxxxxxxxxx`

### 1.2 Standard Envelopes
**Success Response (200/201)**:
```json
{
  "success": true,
  "data": {
    "id": "c1a2b3c4-...",
    "status": "CONNECTED"
  }
}
```

**Error Response (400/401/403/404/500)**:
```json
{
  "success": false,
  "error": {
    "code": "SESSION_DISCONNECTED",
    "message": "WhatsApp session is currently disconnected. Re-authenticate to send messages."
  }
}
```

---

## 2. API ENDPOINTS REFERENCE

### 2.1 WhatsApp Sessions
- `GET /api/whatsapp/sessions` - List workspace active WhatsApp connections
- `POST /api/whatsapp/sessions` - Provision a new WhatsApp session slot
- `GET /api/whatsapp/sessions/:id/health` - Retrieve real backend status & metrics
- `POST /api/whatsapp/sessions/:id/reconnect` - Trigger session reconnection
- `POST /api/whatsapp/sessions/:id/disconnect` - Safe disconnect and state cleanup

### 2.2 Shared Team Inbox
- `GET /api/inbox/conversations` - Paginated conversation list with filters (unread, unassigned, status)
- `GET /api/inbox/conversations/:id/messages` - Fetch message thread (load newest first, cursor pagination)
- `POST /api/inbox/conversations/:id/messages` - Send outbound message (text, media, quick reply)
- `POST /api/inbox/conversations/:id/notes` - Add team-only internal note (never sent to WhatsApp)
- `PATCH /api/inbox/conversations/:id/assign` - Reassign conversation agent

### 2.3 Contacts CRM
- `GET /api/contacts` - Search and list workspace contacts (50/page)
- `POST /api/contacts` - Create single contact with phone E.164 normalization
- `POST /api/contacts/import` - Bulk CSV import with duplicate detection

### 2.4 Campaigns Engine
- `GET /api/campaigns` - List campaign broadcasts
- `POST /api/campaigns` - Create campaign broadcast
- `POST /api/campaigns/:id/launch` - Start message queue worker
- `POST /api/campaigns/:id/pause` - Safely pause running campaign queue
- `POST /api/campaigns/:id/resume` - Resume unsent recipient queue

### 2.5 Public External API v1 (`X-API-Key` Authenticated)
- `POST /api/v1/messages/send` - Send outbound text/media message externally
- `GET /api/v1/sessions` - Get active session status
- `POST /api/v1/contacts` - Upsert contact externally

---

## 3. WEBHOOKS & SECURITY DISPATCH

Clients can register webhook URLs for real-time external event notifications.

### 3.1 Webhook Headers
- `X-WhatsHub-Signature`: HMAC SHA-256 signature calculated over the payload using client's webhook secret.
- `X-WhatsHub-Event`: Event identifier (`message.received`, `session.connected`, `campaign.completed`).

### 3.2 Webhook Payload Structure
```json
{
  "event": "message.received",
  "workspace_id": "ws_12345",
  "timestamp": "2026-08-11T12:00:00Z",
  "data": {
    "message_id": "msg_98765",
    "from": "+1234567890",
    "text": "Hello, I would like to inquire about your product pricing."
  }
}
```
