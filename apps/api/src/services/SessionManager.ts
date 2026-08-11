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
    logger.info(`Initializing Baileys session ${sessionId} for workspace ${workspaceId}`);
    
    // Fetch session record from database
    const { data: dbSession } = await supabaseAdmin
      .from('whatsapp_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!dbSession) {
      throw new Error(`Session ${sessionId} not found in database.`);
    }

    let activeSession: ActiveSession = this.activeSessions.get(sessionId) || {
      sessionId,
      workspaceId,
      status: 'INITIALIZING',
    };

    this.activeSessions.set(sessionId, activeSession);
    await this.updateSessionStatusInDb(sessionId, 'INITIALIZING');

    // Setup local temp auth directory for Baileys state
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
        logger.info(`Durable encrypted auth state found for session ${sessionId}. Restoring into temp filesystem...`);
        const decryptedJson = EncryptionService.decrypt(authStateRow.encrypted_state);
        const fileMap: Record<string, string> = JSON.parse(decryptedJson);

        for (const [filename, fileContent] of Object.entries(fileMap)) {
          fs.writeFileSync(path.join(tempAuthDir, filename), fileContent, 'utf-8');
        }
        logger.info(`Successfully restored ${Object.keys(fileMap).length} auth files for session ${sessionId}`);
      } catch (err: any) {
        logger.warn(`Failed restoring durable auth state for session ${sessionId}: ${err.message}. Falling back to new QR scan.`);
      }
    }

    // Connect Baileys WASocket
    try {
      const { state, saveCreds } = await useMultiFileAuthState(tempAuthDir);
      const { version } = await fetchLatestBaileysVersion();

      logger.info(`Connecting Baileys socket for session ${sessionId} using WhatsApp Web v${version.join('.')}`);

      const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        browser: ['WhatsHub Business CRM', 'Chrome', '1.0.0'],
      });

      activeSession.socket = sock;

      // Handle Connection Updates (QR Generation, Opened, Closed)
      sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          logger.info(`Authentic Baileys QR code generated for session ${sessionId}`);
          try {
            const qrDataUrl = await QRCode.toDataURL(qr);
            activeSession.status = 'QR_REQUIRED';
            activeSession.qrCodeUrl = qrDataUrl;

            await this.updateSessionStatusInDb(sessionId, 'QR_REQUIRED');
            this.broadcastEvent(workspaceId, 'session:qr', {
              sessionId,
              qr: qrDataUrl,
              expiresAt: new Date(Date.now() + 60000).toISOString(),
            });
            this.broadcastEvent(workspaceId, 'session:update', { sessionId, status: 'QR_REQUIRED' });
          } catch (qrErr: any) {
            logger.error(`Error converting Baileys QR code to image: ${qrErr.message}`);
          }
        }

        if (connection === 'open') {
          const userJid = sock.user?.id || '';
          const phoneE164 = userJid.split(':')[0] || 'connected';
          logger.info(`WhatsApp session ${sessionId} successfully connected for account ${phoneE164}`);

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

          this.broadcastEvent(workspaceId, 'session:connected', {
            sessionId,
            phoneNumber: `+${phoneE164.replace(/\D/g, '')}`,
            status: 'CONNECTED',
          });
          this.broadcastEvent(workspaceId, 'session:update', { sessionId, status: 'CONNECTED' });
        }

        if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

          logger.warn(`WhatsApp session ${sessionId} connection closed. StatusCode: ${statusCode}. Reconnecting: ${shouldReconnect}`);

          if (shouldReconnect) {
            activeSession.status = 'RECONNECTING';
            await this.updateSessionStatusInDb(sessionId, 'RECONNECTING');
            this.broadcastEvent(workspaceId, 'session:update', { sessionId, status: 'RECONNECTING' });
            
            setTimeout(() => {
              this.initializeSession(sessionId, workspaceId).catch((e) => logger.error(`Reconnect error: ${e.message}`));
            }, 5000);
          } else {
            activeSession.status = 'LOGGED_OUT';
            await this.updateSessionStatusInDb(sessionId, 'LOGGED_OUT');
            this.broadcastEvent(workspaceId, 'session:update', { sessionId, status: 'LOGGED_OUT' });
          }
        }
      });

      // Handle Credentials Persistence to Supabase
      sock.ev.on('creds.update', async () => {
        await saveCreds();
        try {
          const files = fs.readdirSync(tempAuthDir);
          const fileMap: Record<string, string> = {};
          for (const f of files) {
            const filePath = path.join(tempAuthDir, f);
            if (fs.statSync(filePath).isFile()) {
              fileMap[f] = fs.readFileSync(filePath, 'utf-8');
            }
          }

          const encryptedState = EncryptionService.encrypt(JSON.stringify(fileMap));
          await supabaseAdmin.from('whatsapp_auth_states').upsert(
            {
              workspace_id: workspaceId,
              session_id: sessionId,
              encrypted_state: encryptedState,
              updated_at: new Date().toISOString(),
            },
            { onConflict: 'session_id' }
          );
          logger.info(`Durable encrypted auth state updated in Supabase for session ${sessionId}`);
        } catch (err: any) {
          logger.error(`Failed to save encrypted auth state to Supabase: ${err.message}`);
        }
      });

    } catch (err: any) {
      logger.error(`Error connecting Baileys socket for session ${sessionId}:`, err.message);
      await this.updateSessionStatusInDb(sessionId, 'ERROR', err.message);
    }

    return activeSession;
  }

  /**
   * Startup Restoration Hook: Called on Railway server boot.
   */
  public static async restoreAllSessions() {
    logger.info('Starting Railway startup session restoration check...');
    try {
      const { data: activeDbSessions, error } = await supabaseAdmin
        .from('whatsapp_sessions')
        .select('*')
        .eq('is_active', true);

      if (error) {
        logger.error('Failed to query active sessions for restoration:', error.message);
        return;
      }

      if (!activeDbSessions || activeDbSessions.length === 0) {
        logger.info('No active WhatsApp sessions found to restore.');
        return;
      }

      logger.info(`Found ${activeDbSessions.length} active sessions to restore on boot.`);
      for (const s of activeDbSessions) {
        this.initializeSession(s.id, s.workspace_id).catch((err) => {
          logger.error(`Failed restoring session ${s.id}:`, err.message);
        });
      }
    } catch (err: any) {
      logger.error('Startup session restore failure:', err.message);
    }
  }

  /**
   * Called when authentication succeeds or during test verification.
   */
  public static async markSessionAuthenticated(sessionId: string, phoneNumber: string) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    logger.info(`Session ${sessionId} marked authenticated for phone ${phoneNumber}`);

    session.status = 'CONNECTED';
    session.qrCodeUrl = undefined;

    await this.updateSessionStatusInDb(sessionId, 'CONNECTED');
    await supabaseAdmin.from('whatsapp_sessions').update({
      phone_number: phoneNumber,
      connected_at: new Date().toISOString(),
      last_connected_at: new Date().toISOString(),
      is_active: true,
      last_error: null,
    }).eq('id', sessionId);

    this.broadcastEvent(session.workspaceId, 'session:connected', {
      sessionId,
      phoneNumber,
      status: 'CONNECTED',
    });
    this.broadcastEvent(session.workspaceId, 'session:update', { sessionId, status: 'CONNECTED' });
  }

  /**
   * Safe Session Disconnect & Logout.
   */
  public static async disconnectSession(sessionId: string) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      try {
        if (session.socket) {
          await session.socket.logout();
        }
      } catch (e) {}

      session.status = 'DISCONNECTED';
      this.broadcastEvent(session.workspaceId, 'session:update', { sessionId, status: 'DISCONNECTED' });
    }
    this.activeSessions.delete(sessionId);

    // Clean temp filesystem
    const tempAuthDir = path.join(process.cwd(), '.baileys-auth', sessionId);
    try {
      if (fs.existsSync(tempAuthDir)) {
        fs.rmSync(tempAuthDir, { recursive: true, force: true });
      }
    } catch (e) {}

    await this.updateSessionStatusInDb(sessionId, 'DISCONNECTED');
  }

  private static async updateSessionStatusInDb(sessionId: string, status: string, lastError?: string) {
    await supabaseAdmin
      .from('whatsapp_sessions')
      .update({
        status,
        last_error: lastError || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', sessionId);
  }

  private static broadcastEvent(workspaceId: string, eventName: string, payload: any) {
    if (this.socketIoInstance) {
      this.socketIoInstance.to(`workspace:${workspaceId}`).emit(eventName, payload);
    }
  }
}
