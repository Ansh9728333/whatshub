import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { SessionManager } from '../services/SessionManager.js';

export async function getDashboardStats(req: AuthenticatedRequest, res: Response) {
  try {
    const workspaceId = req.workspaceId!;

    // 1. Connected WhatsApp Sessions (from SessionManager in-memory status + DB validation)
    const { data: dbSessions } = await supabaseAdmin
      .from('whatsapp_sessions')
      .select('id, status, phone_number, display_name, slot_number')
      .eq('workspace_id', workspaceId)
      .eq('is_active', true);

    const connectedSessionsCount = (dbSessions || []).filter((s) => {
      const active = SessionManager.getSession(s.id);
      return (active && active.status === 'CONNECTED') || s.status === 'CONNECTED';
    }).length;

    // 2. Unread Conversations Count
    const { count: unreadCount } = await supabaseAdmin
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gt('unread_count', 0);

    // 3. Active Conversations (OPEN or PENDING)
    const { count: activeConversationsCount } = await supabaseAdmin
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .in('status', ['OPEN', 'PENDING']);

    // 4. Total Contacts Count
    const { count: totalContactsCount } = await supabaseAdmin
      .from('contacts')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId);

    // 5. Messages Sent/Received Today
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const { count: messagesTodayCount } = await supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .gte('created_at', startOfDay.toISOString());

    // 6. Campaign Delivery Rate Statistics
    const { data: campaignStats } = await supabaseAdmin
      .from('campaign_recipients')
      .select('status');

    let totalRecipients = campaignStats?.length || 0;
    let deliveredCount = campaignStats?.filter((r) => r.status === 'DELIVERED' || r.status === 'READ').length || 0;
    const deliveryRate = totalRecipients > 0 ? Math.round((deliveredCount / totalRecipients) * 100) : 100;

    // 7. Recent Conversations
    const { data: recentConversations } = await supabaseAdmin
      .from('conversations')
      .select('id, last_message_text, last_message_at, unread_count, status, contact:contacts(name, phone_e164)')
      .eq('workspace_id', workspaceId)
      .order('last_message_at', { ascending: false })
      .limit(5);

    return res.json({
      success: true,
      data: {
        kpis: {
          connectedSessions: connectedSessionsCount,
          totalSlots: dbSessions?.length || 0,
          unreadConversations: unreadCount || 0,
          activeConversations: activeConversationsCount || 0,
          totalContacts: totalContactsCount || 0,
          messagesToday: messagesTodayCount || 0,
          deliveryRate: deliveryRate,
        },
        sessions: dbSessions || [],
        recentConversations: recentConversations || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}
