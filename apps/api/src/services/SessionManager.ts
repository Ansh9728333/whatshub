import { supabaseAdmin } from '../config/supabase.js';
import { EncryptionService } from './EncryptionService.js';
import { logger } from '../config/logger.js';
import QRCode from 'qrcode';
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  WASocket,
} from '@whiskeysockets/baileys';
import fs from 'fs';
import path from 'path';

export interface ActiveSession {
  sessionId: string;
  workspaceId: string;
  status: string;
  qrCodeUrl?: string;
  socket?: WASocket;
}

export class SessionManager {
  private static activeSessions: Map<string, ActiveSession> = new Map();
  private static initializationLocks: Map<string, Promise<ActiveSession>> = new Map();
  private static socketIoInstance: any = null;

  public static setSocketIo(io: any) {
    this.socketIoInstance = io;
  }

  public static getSession(sessionId: string): ActiveSession | undefined {
    return this.activeSessions.get(sessionId);
  }

  public static getAllSessions(): ActiveSession[] {
    return Array.from(this.activeSessions.values());
  }

  /**
   * Initializes a real Baileys WhatsApp session with durable state restore & authentic QR generation.
   */
  public static async initializeSession(sessionId: string, workspaceId: string): Promise<ActiveSession> {
    if (this.initializationLocks.has(sessionId)) {
      console.log('[WA_DEBUG] initialize-session-locked', { sessionId });
      return this.initializationLocks.get(sessionId)!;
    }

    const initPromise = (async () => {
      try {
        return await this.performSessionInitialization(sessionId, workspaceId);
      } finally {
        this.initializationLocks.delete(sessionId);
      }
    })();

    this.initializationLocks.set(sessionId, initPromise);
    return initPromise;
  }

  private static async performSessionInitialization(sessionId: string, workspaceId: string): Promise<ActiveSession> {
    console.log('[WA_DEBUG] initialize-session', { sessionId, workspaceId });
    
    // Fetch session record from database
    const { data: dbSession } = await supabaseAdmin
      .from('whatsapp_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!dbSession) {
      throw new Error(`Session ${sessionId} not found in database.`);
    }

    // Clean up any existing socket before initializing a new one
    const existing = this.activeSessions.get(sessionId);
    if (existing && existing.socket) {
      try {
        existing.socket.end(undefined);
      } catch (e) {}
    }

    let activeSession: ActiveSession = {
      sessionId,
      workspaceId,
      status: 'INITIALIZING',
    };

    this.activeSessions.set(sessionId, activeSession);
    await this.updateSessionStatusInDb(sessionId, 'INITIALIZING');

    // Setup local temp auth directory for Baileys state - uniquely isolated per sessionId
    const tempAuthDir = path.join(process.cwd(), '.baileys-auth', sessionId);
    if (!fs.existsSync(tempAuthDir)) {
      fs.mkdirSync(tempAuthDir, { recursive: true });
    }

    // Check if durable encrypted auth state exists in Supabase
    const { data: authStateRow } = await supabaseAdmin
      .from('whatsapp_auth_states')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (authStateRow && authStateRow.encrypted_state) {
      try {
        console.log('[WA_DEBUG] restoring-auth-state', { sessionId });
        const decryptedJson = EncryptionService.decrypt(authStateRow.encrypted_state);
        const fileMap: Record<string, string> = JSON.parse(decryptedJson);

        for (const [filename, fileContent] of Object.entries(fileMap)) {
          fs.writeFileSync(path.join(tempAuthDir, filename), fileContent, 'utf-8');
        }
      } catch (err: any) {
        console.log('[WA_DEBUG] restore-auth-failed', { sessionId, message: err.message });
      }
    }

    // Connect Baileys WASocket
    try {
      const { state, saveCreds } = await useMultiFileAuthState(tempAuthDir);

      console.log('[WA_DEBUG] auth-state', {
        sessionId,
        registered: Boolean(state?.creds?.registered),
      });

      console.log('[WA_DEBUG] version-fetch-start');
      let version: [number, number, number] = [2, 3000, 1017531287];
      try {
        const fetched = await fetchLatestBaileysVersion();
        if (fetched && fetched.version) {
          version = fetched.version;
          console.log('[WA_DEBUG] version-fetch-success', { version: version.join('.') });
        }
      } catch (vErr: any) {
        console.error('[WA_DEBUG] version-fetch-failed', { message: vErr.message });
      }

      console.log('[WA_DEBUG] before-makeWASocket', { sessionId });

      const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: ['WhatsApp AI', 'Chrome', '1.0.0'],
      });

      console.log('[WA_DEBUG] after-makeWASocket', { sessionId });

      activeSession.socket = sock;

      // Handle Baileys credential persistence
      sock.ev.on('creds.update', async () => {
        console.log('[WA_DEBUG] creds.update', { sessionId });
        await saveCreds();
      });

      // Handle Connection Updates (QR Generation, Opened, Closed)
      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        const statusCode =
          (lastDisconnect?.error as any)?.output?.statusCode ??
          (lastDisconnect?.error as any)?.statusCode ??
          null;

        console.log('[WA_DEBUG] connection.update', {
          sessionId,
          connection: connection ?? null,
          hasQr: Boolean(qr),
          statusCode,
          hasLastDisconnect: Boolean(lastDisconnect),
        });

        if (qr) {
          console.log('[WA_DEBUG] REAL QR RECEIVED', {
            sessionId,
            qrLength: qr.length,
          });

          try {
            const qrDataUrl = await QRCode.toDataURL(qr);
            activeSession.status = 'QR_REQUIRED';
            activeSession.qrCodeUrl = qrDataUrl;

            await this.updateSessionStatusInDb(sessionId, 'QR_REQUIRED');

            const qrPayload = {
              sessionId,
              qr: qrDataUrl,
              expiresAt: new Date(Date.now() + 60000).toISOString(),
            };

            this.broadcastEvent(workspaceId, 'session:qr', qrPayload);
            this.broadcastEvent(workspaceId, 'session:update', { sessionId, status: 'QR_REQUIRED' });
            console.log('[WA_DEBUG] session:qr emitted', { sessionId, room: `workspace:${workspaceId}` });
          } catch (qrErr: any) {
            console.error('[WA_DEBUG] qr-data-url-failed', { message: qrErr.message });
          }
        }

        if (connection === 'open') {
          const userJid = sock.user?.id || '';
          const phoneE164 = userJid.split(':')[0] || 'connected';
          console.log('[WA_DEBUG] connection-open', { sessionId, phoneE164 });

          activeSession.status = 'CONNECTED';
          activeSession.qrCodeUrl = undefined;

          await this.updateSessionStatusInDb(sessionId, 'CONNECTED');
          await supabaseAdmin.from('whatsapp_sessions').update({
            phone_number: `+${phoneE164.replace(/\D/g, '')}`,
            connected_at: new Date().toISOString(),
            last_connected_at: new Date().toISOString(),
            is_active: true,
            last_error: null,
          }).eq('id', sessionId);

          await this.persistAuthStateToSupabase(sessionId, tempAuthDir);

          this.broadcastEvent(workspaceId, 'session:connected', {
            sessionId,
            phoneNumber: `+${phoneE164.replace(/\D/g, '')}`,
            status: 'CONNECTED',
          });
          this.broadcastEvent(workspaceId, 'session:update', { sessionId, status: 'CONNECTED' });
        }

        if (connection === 'close') {
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          console.log('[WA_DEBUG] connection-closed', { sessionId, statusCode, shouldReconnect });

          if (shouldReconnect) {
            activeSession.status = 'RECONNECTING';
            await this.updateSessionStatusInDb(sessionId, 'RECONNECTING');
            this.broadcastEvent(workspaceId, 'session:update', { sessionId, status: 'RECONNECTING' });
            
            setTimeout(() => {
              this.initializeSession(sessionId, workspaceId).catch((e) => console.error('[WA_DEBUG] reconnect-failed', { message: e.message }));
            }, 5000);
          } else {
            activeSession.status = 'LOGGED_OUT';
            await this.updateSessionStatusInDb(sessionId, 'LOGGED_OUT');
            await supabaseAdmin.from('whatsapp_sessions').update({
              is_active: false,
              last_error: 'Logged out by user or WhatsApp server.',
            }).eq('id', sessionId);
            
            this.broadcastEvent(workspaceId, 'session:update', { sessionId, status: 'LOGGED_OUT' });
          }
        }
      });

      // Process incoming WhatsApp messages
      sock.ev.on('messages.upsert', async (m) => {
        if (m.type !== 'notify') return;
        for (const msg of m.messages) {
          if (!msg.message || msg.key.fromMe) continue;
          await this.handleIncomingMessage(sessionId, workspaceId, msg);
        }
      });

      return activeSession;
    } catch (err: any) {
      console.error('[WA_DEBUG] makeWASocket-failed', { sessionId, message: err.message });
      activeSession.status = 'ERROR';
      await this.updateSessionStatusInDb(sessionId, 'ERROR');
      this.broadcastEvent(workspaceId, 'session:update', { sessionId, status: 'ERROR' });
      throw err;
    }
  }

  private static async handleIncomingMessage(sessionId: string, workspaceId: string, msg: any) {
    try {
      const jid = msg.key.remoteJid || '';
      const rawPhone = jid.split('@')[0] || '';
      const phoneE164 = `+${rawPhone.replace(/\D/g, '')}`;
      const senderName = msg.pushName || phoneE164;
      const textContent =
        msg.message.conversation ||
        msg.message.extendedTextMessage?.text ||
        '[Media Message]';

      let { data: contact } = await supabaseAdmin
        .from('contacts')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('phone_e164', phoneE164)
        .single();

      if (!contact) {
        const { data: newContact } = await supabaseAdmin
          .from('contacts')
          .insert({
            workspace_id: workspaceId,
            phone_e164: phoneE164,
            name: senderName,
            lead_stage: 'NEW',
          })
          .select()
          .single();
        contact = newContact;
      }

      if (!contact) return;

      let { data: conversation } = await supabaseAdmin
        .from('conversations')
        .select('*')
        .eq('workspace_id', workspaceId)
        .eq('contact_id', contact.id)
        .single();

      if (!conversation) {
        const { data: newConv } = await supabaseAdmin
          .from('conversations')
          .insert({
            workspace_id: workspaceId,
            contact_id: contact.id,
            whatsapp_session_id: sessionId,
            status: 'OPEN',
            last_message_text: textContent,
            last_message_at: new Date().toISOString(),
            unread_count: 1,
          })
          .select()
          .single();
        conversation = newConv;
      } else {
        await supabaseAdmin
          .from('conversations')
          .update({
            last_message_text: textContent,
            last_message_at: new Date().toISOString(),
            unread_count: (conversation.unread_count || 0) + 1,
            status: conversation.status === 'RESOLVED' ? 'OPEN' : conversation.status,
          })
          .eq('id', conversation.id);
      }

      if (!conversation) return;

      const { data: savedMsg } = await supabaseAdmin
        .from('messages')
        .insert({
          workspace_id: workspaceId,
          conversation_id: conversation.id,
          whatsapp_session_id: sessionId,
          direction: 'INBOUND',
          content_type: 'text',
          text_body: textContent,
          status: 'DELIVERED',
          wa_message_id: msg.key.id || null,
        })
        .select()
        .single();

      this.broadcastEvent(workspaceId, 'message:new', {
        conversationId: conversation.id,
        message: savedMsg,
      });

      this.broadcastEvent(workspaceId, 'conversation:update', {
        conversationId: conversation.id,
        last_message_text: textContent,
      });
    } catch (err: any) {
      logger.error(`Error processing incoming message: ${err.message}`);
    }
  }

  private static async persistAuthStateToSupabase(sessionId: string, tempAuthDir: string) {
    try {
      const files = fs.readdirSync(tempAuthDir);
      const fileMap: Record<string, string> = {};

      for (const filename of files) {
        const filePath = path.join(tempAuthDir, filename);
        if (fs.statSync(filePath).isFile()) {
          fileMap[filename] = fs.readFileSync(filePath, 'utf-8');
        }
      }

      const jsonStr = JSON.stringify(fileMap);
      const encryptedState = EncryptionService.encrypt(jsonStr);

      await supabaseAdmin.from('whatsapp_auth_states').upsert(
        {
          session_id: sessionId,
          encrypted_state: encryptedState,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'session_id' }
      );
    } catch (err: any) {
      logger.error(`Failed persisting auth state to Supabase: ${err.message}`);
    }
  }

  public static async restoreAllSessions() {
    const { data: sessions } = await supabaseAdmin
      .from('whatsapp_sessions')
      .select('*')
      .eq('is_active', true);

    if (!sessions || sessions.length === 0) return;

    for (const session of sessions) {
      try {
        await this.initializeSession(session.id, session.workspace_id);
      } catch (err: any) {
        logger.error(`Failed to restore session ${session.id}: ${err.message}`);
      }
    }
  }

  public static async markSessionAuthenticated(sessionId: string, phone: string) {
    const activeSession = this.activeSessions.get(sessionId);
    if (!activeSession) return;

    activeSession.status = 'CONNECTED';
    activeSession.qrCodeUrl = undefined;

    await this.updateSessionStatusInDb(sessionId, 'CONNECTED');
    await supabaseAdmin.from('whatsapp_sessions').update({
      phone_number: phone,
      connected_at: new Date().toISOString(),
      last_connected_at: new Date().toISOString(),
      is_active: true,
    }).eq('id', sessionId);

    this.broadcastEvent(activeSession.workspaceId, 'session:connected', {
      sessionId,
      phoneNumber: phone,
      status: 'CONNECTED',
    });
  }

  public static async disconnectSession(sessionId: string) {
    const activeSession = this.activeSessions.get(sessionId);
    if (activeSession) {
      if (activeSession.socket) {
        try {
          activeSession.socket.end(undefined);
        } catch (e) {}
      }
      activeSession.status = 'DISCONNECTED';
      this.activeSessions.delete(sessionId);
    }

    await this.updateSessionStatusInDb(sessionId, 'DISCONNECTED');
    await supabaseAdmin.from('whatsapp_sessions').update({
      is_active: false,
    }).eq('id', sessionId);

    const tempAuthDir = path.join(process.cwd(), '.baileys-auth', sessionId);
    if (fs.existsSync(tempAuthDir)) {
      fs.rmSync(tempAuthDir, { recursive: true, force: true });
    }

    await supabaseAdmin.from('whatsapp_auth_states').delete().eq('session_id', sessionId);
  }

  private static async updateSessionStatusInDb(sessionId: string, status: string) {
    await supabaseAdmin.from('whatsapp_sessions').update({ status }).eq('id', sessionId);
  }

  private static broadcastEvent(workspaceId: string, event: string, payload: any) {
    if (this.socketIoInstance) {
      this.socketIoInstance.to(`workspace:${workspaceId}`).emit(event, payload);
    }
  }
}
