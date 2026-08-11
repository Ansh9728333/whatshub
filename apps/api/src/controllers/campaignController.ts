import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { CreateCampaignSchema } from '@whatshub/shared';

export async function listCampaigns(req: AuthenticatedRequest, res: Response) {
  try {
    const { data: campaigns, error } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('workspace_id', req.workspaceId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return res.json({ success: true, data: campaigns });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function createCampaign(req: AuthenticatedRequest, res: Response) {
  try {
    const parse = CreateCampaignSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: { message: parse.error.message } });
    }

    const { session_id, name, message, media_url, recipient_ids, scheduled_at } = parse.data;

    // Create campaign record
    const { data: campaign, error: campaignErr } = await supabaseAdmin
      .from('campaigns')
      .insert({
        workspace_id: req.workspaceId,
        session_id,
        name,
        message,
        media_url: media_url || null,
        scheduled_at: scheduled_at || null,
        status: scheduled_at ? 'SCHEDULED' : 'DRAFT',
        created_by: req.user.id,
      })
      .select()
      .single();

    if (campaignErr) throw campaignErr;

    // Filter recipients against marketing suppression (marketing_opt_in = true)
    const { data: validContacts } = await supabaseAdmin
      .from('contacts')
      .select('id, phone_e164, marketing_opt_in')
      .in('id', recipient_ids)
      .eq('workspace_id', req.workspaceId)
      .eq('marketing_opt_in', true);

    if (validContacts && validContacts.length > 0) {
      const recipientRows = validContacts.map((c) => ({
        campaign_id: campaign.id,
        contact_id: c.id,
        phone_e164: c.phone_e164,
        status: 'QUEUED',
      }));

      await supabaseAdmin.from('campaign_recipients').insert(recipientRows);
    }

    return res.status(201).json({
      success: true,
      data: {
        campaign,
        totalEligibleRecipients: validContacts?.length || 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function launchCampaign(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    // Set campaign status to RUNNING
    const { data: campaign, error } = await supabaseAdmin
      .from('campaigns')
      .update({ status: 'RUNNING', updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('workspace_id', req.workspaceId)
      .select()
      .single();

    if (error || !campaign) {
      return res.status(400).json({ success: false, error: { message: 'Failed to launch campaign.' } });
    }

    return res.json({ success: true, data: campaign, message: 'Campaign worker started with responsible pacing.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}
