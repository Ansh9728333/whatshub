import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { CreateContactSchema } from '@whatshub/shared';

export async function listContacts(req: AuthenticatedRequest, res: Response) {
  try {
    const { search, stage, page = '1', limit = '50' } = req.query;

    let query = supabaseAdmin
      .from('contacts')
      .select('*', { count: 'exact' })
      .eq('workspace_id', req.workspaceId)
      .order('created_at', { ascending: false });

    if (stage && typeof stage === 'string') {
      query = query.eq('lead_stage', stage);
    }

    if (search && typeof search === 'string') {
      query = query.or(`name.ilike.%${search}%,phone_e164.ilike.%${search}%,company.ilike.%${search}%`);
    }

    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const from = (pageNum - 1) * limitNum;
    const to = from + limitNum - 1;

    query = query.range(from, to);

    const { data: contacts, count, error } = await query;
    if (error) throw error;

    return res.json({
      success: true,
      data: contacts,
      meta: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function createContact(req: AuthenticatedRequest, res: Response) {
  try {
    const parse = CreateContactSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: { message: parse.error.message } });
    }

    const { name, phone, email, company, lead_stage, customer_value } = parse.data;

    // Normalize phone E.164
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneE164 = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

    const { data: contact, error } = await supabaseAdmin
      .from('contacts')
      .insert({
        workspace_id: req.workspaceId,
        name: name || phoneE164,
        phone_e164: phoneE164,
        phone_display: phoneE164,
        email,
        company,
        lead_stage,
        customer_value,
      })
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, data: contact });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function importContactsCsv(req: AuthenticatedRequest, res: Response) {
  try {
    const { rows } = req.body; // Array of { name, phone, email, company, lead_stage }

    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, error: { message: 'No valid rows provided for import.' } });
    }

    let importedCount = 0;
    let skippedCount = 0;

    for (const r of rows) {
      if (!r.phone) {
        skippedCount++;
        continue;
      }

      const cleanPhone = r.phone.toString().replace(/\D/g, '');
      const phoneE164 = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

      const { error } = await supabaseAdmin.from('contacts').upsert(
        {
          workspace_id: req.workspaceId,
          name: r.name || phoneE164,
          phone_e164: phoneE164,
          phone_display: phoneE164,
          email: r.email || null,
          company: r.company || null,
          lead_stage: r.lead_stage || 'New Inquiry',
        },
        { onConflict: 'workspace_id,phone_e164' }
      );

      if (!error) importedCount++;
      else skippedCount++;
    }

    return res.json({
      success: true,
      data: {
        imported: importedCount,
        skipped: skippedCount,
        total: rows.length,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}
