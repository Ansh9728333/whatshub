import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';

export async function getAnalyticsData(req: AuthenticatedRequest, res: Response) {
  try {
    const workspaceId = req.workspaceId!;

    // Total Inbound vs Outbound
    const { count: inboundCount } = await supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('direction', 'INBOUND');

    const { count: outboundCount } = await supabaseAdmin
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('direction', 'OUTBOUND');

    // Conversation Status Counts
    const { count: openCount } = await supabaseAdmin
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'OPEN');

    const { count: pendingCount } = await supabaseAdmin
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'PENDING');

    const { count: resolvedCount } = await supabaseAdmin
      .from('conversations')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspaceId)
      .eq('status', 'RESOLVED');

    return res.json({
      success: true,
      data: {
        messages: {
          inbound: inboundCount || 0,
          outbound: outboundCount || 0,
          total: (inboundCount || 0) + (outboundCount || 0),
        },
        conversations: {
          open: openCount || 0,
          pending: pendingCount || 0,
          resolved: resolvedCount || 0,
        },
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}
