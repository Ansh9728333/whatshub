import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { supabaseAdmin } from '../config/supabase.js';
import { SendMessageSchema } from '@whatshub/shared';

export async function listConversations(req: AuthenticatedRequest, res: Response) {
  try {
    const { status, filter, search } = req.query;

    let query = supabaseAdmin
      .from('conversations')
      .select(`
        *,
        contact:contacts(*),
        assigned_agent:profiles(*)
      `)
      .eq('workspace_id', req.workspaceId)
      .order('last_message_at', { ascending: false });

    if (status && typeof status === 'string') {
      query = query.eq('status', status.toUpperCase());
    }

    if (filter === 'unread') {
      query = query.gt('unread_count', 0);
    } else if (filter === 'my_chats') {
      query = query.eq('assigned_agent_id', req.user.id);
    } else if (filter === 'unassigned') {
      query = query.is('assigned_agent_id', null);
    }

    const { data: conversations, error } = await query;
    if (error) throw error;

    return res.json({ success: true, data: conversations });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function getConversationMessages(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;

    // Fetch conversation details
    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('*, contact:contacts(*), assigned_agent:profiles(*)')
      .eq('id', id)
      .eq('workspace_id', req.workspaceId)
      .single();

    if (!conversation) {
      return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
    }

    // Fetch messages
    const { data: messages, error } = await supabaseAdmin
      .from('messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Fetch internal notes
    const { data: notes } = await supabaseAdmin
      .from('internal_notes')
      .select('*, author:profiles(*)')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    // Mark unread count as zero
    await supabaseAdmin
      .from('conversations')
      .update({ unread_count: 0 })
      .eq('id', id);

    return res.json({
      success: true,
      data: {
        conversation,
        messages: messages || [],
        notes: notes || [],
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function sendMessage(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { text, type, media_url } = req.body;

    const { data: conversation } = await supabaseAdmin
      .from('conversations')
      .select('*')
      .eq('id', id)
      .eq('workspace_id', req.workspaceId)
      .single();

    if (!conversation) {
      return res.status(404).json({ success: false, error: { message: 'Conversation not found.' } });
    }

    // Insert message into DB
    const { data: newMessage, error } = await supabaseAdmin
      .from('messages')
      .insert({
        workspace_id: req.workspaceId,
        session_id: conversation.session_id,
        conversation_id: id,
        contact_id: conversation.contact_id,
        direction: 'OUTBOUND',
        message_type: type || 'text',
        text,
        media_url,
        status: 'SENT',
        sender_user_id: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Update conversation last message timestamp
    await supabaseAdmin
      .from('conversations')
      .update({
        last_message_text: text || '[Media]',
        last_message_at: new Date().toISOString(),
      })
      .eq('id', id);

    return res.status(201).json({ success: true, data: newMessage });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function addInternalNote(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ success: false, error: { message: 'Note text is required.' } });
    }

    const { data: newNote, error } = await supabaseAdmin
      .from('internal_notes')
      .insert({
        workspace_id: req.workspaceId,
        conversation_id: id,
        author_id: req.user.id,
        note,
      })
      .select('*, author:profiles(*)')
      .single();

    if (error) throw error;

    return res.status(201).json({ success: true, data: newNote });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}

export async function updateConversationStatus(req: AuthenticatedRequest, res: Response) {
  try {
    const { id } = req.params;
    const { status, assigned_agent_id } = req.body;

    const updates: any = {};
    if (status) updates.status = status;
    if (assigned_agent_id !== undefined) updates.assigned_agent_id = assigned_agent_id;

    const { data: updated, error } = await supabaseAdmin
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .eq('workspace_id', req.workspaceId)
      .select('*, contact:contacts(*), assigned_agent:profiles(*)')
      .single();

    if (error) throw error;

    return res.json({ success: true, data: updated });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: { message: err.message } });
  }
}
