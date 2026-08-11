import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { SessionManager } from '../services/SessionManager.js';
import { supabaseAdmin } from '../config/supabase.js';
import { CreateSessionSchema } from '@whatshub/shared';

export async function listSessions(req: AuthenticatedRequest, res: Response) {
  try {
    const { data: sessions, error } = await supabaseAdmin
      .from('whatsapp_sessions')
      .select('*')
      .eq('workspace_id', req.workspaceId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return res.json({ success: true, data: sessions });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function createSession(req: AuthenticatedRequest, res: Response) {
  try {
    const parse = CreateSessionSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ success: false, error: { message: parse.error.message } });
    }

    const { display_name, provider } = parse.data;

    // Check count of active sessions for slot number
    const { count } = await supabaseAdmin
      .from('whatsapp_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('workspace_id', req.workspaceId);

    const slotNumber = (count || 0) + 1;

    const { data: session, error } = await supabaseAdmin
      .from('whatsapp_sessions')
      .insert({
        workspace_id: req.workspaceId,
        display_name,
        provider,
        slot_number: slotNumber,
        status: 'INITIALIZING',
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Initialize session engine
    await SessionManager.initializeSession(session.id, req.workspaceId!);

    const active = SessionManager.getSession(session.id);

    return res.status(201).json({
      success: true,
      data: {
        ...session,
        qrCodeUrl: active?.qrCodeUrl,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function getSessionHealth(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { data: session, error } = await supabaseAdmin
      .from('whatsapp_sessions')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', req.workspaceId)
      .single();

    if (error || !session) {
      return res.status(404).json({ success: false, error: { message: 'Session not found.' } });
    }

    const activeSession = SessionManager.getSession(id);
    return res.json({
      success: true,
      data: {
        session,
        activeInMemory: !!activeSession,
        qrCodeUrl: activeSession?.qrCodeUrl,
        qr: activeSession?.qrCodeUrl,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function getSessionQr(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { data: session, error } = await supabaseAdmin
      .from('whatsapp_sessions')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', req.workspaceId)
      .single();

    if (error || !session) {
      return res.status(404).json({ success: false, error: { message: 'Session not found or workspace unauthorized.' } });
    }

    const activeSession = SessionManager.getSession(id);
    return res.json({
      success: true,
      data: {
        sessionId: id,
        status: activeSession?.status || session.status,
        qr: activeSession?.qrCodeUrl || null,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function simulateQrScan(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { phone } = req.body;

    const session = SessionManager.getSession(id);
    if (!session) {
      return res.status(400).json({ success: false, error: { message: 'Session not actively initializing.' } });
    }

    await SessionManager.markSessionAuthenticated(id, phone || '+14155552671');
    return res.json({ success: true, message: 'Session successfully authenticated and encrypted auth state saved.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function disconnectSession(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    await SessionManager.disconnectSession(id);
    return res.json({ success: true, message: 'Session safely disconnected.' });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}
