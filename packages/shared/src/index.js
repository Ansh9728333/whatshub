"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCampaignSchema = exports.CreateContactSchema = exports.SendMessageSchema = exports.CreateSessionSchema = void 0;
const zod_1 = require("zod");
// =====================================================================
// ZOD VALIDATION SCHEMAS
// =====================================================================
exports.CreateSessionSchema = zod_1.z.object({
    display_name: zod_1.z.string().min(1, 'Display name is required'),
    provider: zod_1.z.enum(['baileys', 'meta_cloud']).default('baileys'),
});
exports.SendMessageSchema = zod_1.z.object({
    session_id: zod_1.z.string().uuid(),
    to: zod_1.z.string().min(5, 'Recipient phone number is required'),
    type: zod_1.z.enum(['text', 'image', 'document', 'video', 'audio']).default('text'),
    message: zod_1.z.string().optional(),
    media_url: zod_1.z.string().url().optional(),
});
exports.CreateContactSchema = zod_1.z.object({
    name: zod_1.z.string().optional(),
    phone: zod_1.z.string().min(5, 'Valid phone number is required'),
    email: zod_1.z.string().email().optional().or(zod_1.z.literal('')),
    company: zod_1.z.string().optional(),
    lead_stage: zod_1.z.string().default('New Inquiry'),
    customer_value: zod_1.z.number().default(0),
});
exports.CreateCampaignSchema = zod_1.z.object({
    session_id: zod_1.z.string().uuid(),
    name: zod_1.z.string().min(1, 'Campaign name is required'),
    message: zod_1.z.string().min(1, 'Message content is required'),
    media_url: zod_1.z.string().url().optional().or(zod_1.z.literal('')),
    recipient_ids: zod_1.z.array(zod_1.z.string().uuid()).min(1, 'Select at least one recipient'),
    scheduled_at: zod_1.z.string().optional(),
});
