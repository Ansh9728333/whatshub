import { z } from 'zod';
export type UserRole = 'PLATFORM_SUPER_ADMIN' | 'WORKSPACE_OWNER' | 'WORKSPACE_ADMIN' | 'MANAGER' | 'AGENT' | 'VIEWER';
export interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
    phone_number?: string;
    created_at: string;
    updated_at: string;
}
export interface Workspace {
    id: string;
    name: string;
    slug: string;
    owner_id: string;
    logo_url?: string;
    created_at: string;
    updated_at: string;
}
export interface WorkspaceMember {
    id: string;
    workspace_id: string;
    user_id: string;
    role: UserRole;
    created_at: string;
    profile?: UserProfile;
}
export type SessionStatus = 'EMPTY' | 'INITIALIZING' | 'QR_REQUIRED' | 'PAIRING' | 'CONNECTED' | 'RECONNECTING' | 'DISCONNECTED' | 'LOGGED_OUT' | 'ERROR';
export interface WhatsAppSession {
    id: string;
    workspace_id: string;
    provider: 'baileys' | 'meta_cloud';
    slot_number: number;
    display_name: string;
    phone_number?: string;
    status: SessionStatus;
    is_active: boolean;
    connected_at?: string;
    last_connected_at?: string;
    last_disconnected_at?: string;
    last_activity_at?: string;
    last_error?: string;
    reconnect_attempts: number;
    created_by?: string;
    created_at: string;
    updated_at: string;
}
export interface WhatsAppAuthState {
    id: string;
    workspace_id: string;
    session_id: string;
    encrypted_state: string;
    version: number;
    created_at: string;
    updated_at: string;
}
export interface SendMessagePayload {
    to: string;
    type?: 'text' | 'image' | 'document' | 'video' | 'audio';
    text?: string;
    mediaUrl?: string;
    fileName?: string;
    caption?: string;
}
export interface MessageResult {
    success: boolean;
    waMessageId?: string;
    timestamp?: string;
    error?: string;
}
export interface MessagingProvider {
    connect(sessionId: string): Promise<void>;
    disconnect(sessionId: string): Promise<void>;
    logout(sessionId: string): Promise<void>;
    getStatus(sessionId: string): Promise<SessionStatus>;
    sendMessage(sessionId: string, payload: SendMessagePayload): Promise<MessageResult>;
}
export type ConversationStatus = 'OPEN' | 'PENDING' | 'RESOLVED';
export type MessageDirection = 'INBOUND' | 'OUTBOUND';
export type MessageStatus = 'QUEUED' | 'SENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
export interface Conversation {
    id: string;
    workspace_id: string;
    session_id: string;
    contact_id: string;
    status: ConversationStatus;
    assigned_agent_id?: string;
    unread_count: number;
    last_message_text?: string;
    last_message_at?: string;
    locked_by?: string;
    locked_at?: string;
    created_at: string;
    updated_at: string;
    contact?: Contact;
    assigned_agent?: UserProfile;
}
export interface Message {
    id: string;
    workspace_id: string;
    session_id: string;
    conversation_id: string;
    contact_id: string;
    wa_message_id?: string;
    direction: MessageDirection;
    message_type: string;
    text?: string;
    media_url?: string;
    reply_to_message_id?: string;
    status: MessageStatus;
    error_message?: string;
    sender_user_id?: string;
    provider_timestamp?: string;
    created_at: string;
}
export interface InternalNote {
    id: string;
    workspace_id: string;
    conversation_id: string;
    author_id: string;
    note: string;
    created_at: string;
    author?: UserProfile;
}
export interface Contact {
    id: string;
    workspace_id: string;
    name?: string;
    phone_e164: string;
    phone_display?: string;
    email?: string;
    company?: string;
    designation?: string;
    city?: string;
    country: string;
    source: string;
    assigned_agent_id?: string;
    lead_stage: string;
    status: string;
    customer_value: number;
    next_follow_up?: string;
    notes?: string;
    marketing_opt_in: boolean;
    opt_in_source?: string;
    opt_in_at?: string;
    opt_out_at?: string;
    created_at: string;
    updated_at: string;
    tags?: Tag[];
}
export interface Tag {
    id: string;
    workspace_id: string;
    name: string;
    color: string;
    description?: string;
    created_at: string;
}
export interface FollowUp {
    id: string;
    workspace_id: string;
    contact_id: string;
    conversation_id?: string;
    assigned_user_id?: string;
    follow_up_at: string;
    note: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    created_at: string;
}
export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'FAILED';
export interface Campaign {
    id: string;
    workspace_id: string;
    session_id: string;
    name: string;
    message: string;
    media_url?: string;
    scheduled_at?: string;
    status: CampaignStatus;
    created_by: string;
    created_at: string;
    updated_at: string;
    total_recipients?: number;
    sent_count?: number;
    delivered_count?: number;
    read_count?: number;
    failed_count?: number;
}
export interface CampaignRecipient {
    id: string;
    campaign_id: string;
    contact_id: string;
    phone_e164: string;
    status: MessageStatus;
    sent_at?: string;
    delivered_at?: string;
    read_at?: string;
    error_message?: string;
}
export interface QuickReply {
    id: string;
    workspace_id: string;
    shortcut: string;
    title: string;
    message: string;
    category?: string;
    media_url?: string;
    active: boolean;
    created_at: string;
}
export interface AutomationRule {
    id: string;
    workspace_id: string;
    name: string;
    trigger_event: string;
    conditions: any[];
    actions: any[];
    is_active: boolean;
    created_at: string;
}
export interface ApiKey {
    id: string;
    workspace_id: string;
    name: string;
    key_prefix: string;
    key_hash: string;
    scopes: string[];
    last_used_at?: string;
    expires_at?: string;
    revoked_at?: string;
    created_by: string;
    created_at: string;
}
export interface Webhook {
    id: string;
    workspace_id: string;
    url: string;
    secret: string;
    events: string[];
    is_active: boolean;
    created_at: string;
}
export declare const CreateSessionSchema: z.ZodObject<{
    display_name: z.ZodString;
    provider: z.ZodDefault<z.ZodEnum<["baileys", "meta_cloud"]>>;
}, "strip", z.ZodTypeAny, {
    display_name: string;
    provider: "baileys" | "meta_cloud";
}, {
    display_name: string;
    provider?: "baileys" | "meta_cloud" | undefined;
}>;
export declare const SendMessageSchema: z.ZodObject<{
    session_id: z.ZodString;
    to: z.ZodString;
    type: z.ZodDefault<z.ZodEnum<["text", "image", "document", "video", "audio"]>>;
    message: z.ZodOptional<z.ZodString>;
    media_url: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    type: "text" | "image" | "document" | "video" | "audio";
    session_id: string;
    to: string;
    message?: string | undefined;
    media_url?: string | undefined;
}, {
    session_id: string;
    to: string;
    message?: string | undefined;
    type?: "text" | "image" | "document" | "video" | "audio" | undefined;
    media_url?: string | undefined;
}>;
export declare const CreateContactSchema: z.ZodObject<{
    name: z.ZodOptional<z.ZodString>;
    phone: z.ZodString;
    email: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    company: z.ZodOptional<z.ZodString>;
    lead_stage: z.ZodDefault<z.ZodString>;
    customer_value: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    phone: string;
    lead_stage: string;
    customer_value: number;
    name?: string | undefined;
    email?: string | undefined;
    company?: string | undefined;
}, {
    phone: string;
    name?: string | undefined;
    email?: string | undefined;
    company?: string | undefined;
    lead_stage?: string | undefined;
    customer_value?: number | undefined;
}>;
export declare const CreateCampaignSchema: z.ZodObject<{
    session_id: z.ZodString;
    name: z.ZodString;
    message: z.ZodString;
    media_url: z.ZodUnion<[z.ZodOptional<z.ZodString>, z.ZodLiteral<"">]>;
    recipient_ids: z.ZodArray<z.ZodString, "many">;
    scheduled_at: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    message: string;
    session_id: string;
    name: string;
    recipient_ids: string[];
    media_url?: string | undefined;
    scheduled_at?: string | undefined;
}, {
    message: string;
    session_id: string;
    name: string;
    recipient_ids: string[];
    media_url?: string | undefined;
    scheduled_at?: string | undefined;
}>;
