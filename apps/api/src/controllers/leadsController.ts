import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';

export async function getLeadsPipeline(req: AuthenticatedRequest, res: Response) {
  try {
    const { data: contacts, error } = await supabaseAdmin
      .from('contacts')
      .select('id, name, phone_e164, company, lead_stage, customer_value, assigned_agent_id, created_at')
      .eq('workspace_id', req.workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({ success: true, data: contacts });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function updateLeadStage(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { lead_stage } = req.body;

    if (!lead_stage) {
      return res.status(400).json({ success: false, error: { message: 'lead_stage parameter is required.' } });
    }

    const { data: updated, error } = await supabaseAdmin
      .from('contacts')
      .update({ lead_stage, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', req.workspaceId)
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}
