import { supabaseAdmin } from '../config/supabase.js';
import { EncryptionService } from './EncryptionService.js';
import { logger } from '../config/logger.js';
import QRCode from 'qrcode';

export interface ActiveSession {
  sessionId: string;
  workspaceId: string;
  status: string;
  qrCodeUrl?: string;
  socket?: any;
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
   * Initializes a WhatsApp session and sets up event listeners.
   */
  public static async initializeSession(sessionId: string, workspaceId: string): Promise<ActiveSession> {
    logger.info(`Initializing session ${sessionId} for workspace ${workspaceId}`);
    
    // Check if session exists in DB
    const { data: dbSession } = await supabaseAdmin
      .from('whatsapp_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (!dbSession) {
      throw new Error(`Session ${sessionId} not found in database.`);
    }

    let activeSession: ActiveSession = {
      sessionId,
      workspaceId,
      status: 'INITIALIZING',
    };

    this.activeSessions.set(sessionId, activeSession);
    await this.updateSessionStatusInDb(sessionId, 'INITIALIZING');

    // Simulate / Connect Baileys Socket Engine
    this.simulateBaileysConnection(sessionId, workspaceId);

    return activeSession;
  }

  /**
   * Simulates Baileys connection state machine & QR code generation.
   * In full production deployment, @whiskeysockets/baileys makeWASocket connects here.
   */
  private static async simulateBaileysConnection(sessionId: string, workspaceId: string) {
    try {
      // Check if durable auth state exists in Supabase
      const { data: authStateRow } = await supabaseAdmin
        .from('whatsapp_auth_states')
        .select('*')
        .eq('session_id', sessionId)
        .single();

      if (authStateRow && authStateRow.encrypted_state) {
        logger.info(`Durable encrypted auth state found for session ${sessionId}. Restoring...`);
        try {
          const decryptedJson = EncryptionService.decrypt(authStateRow.encrypted_state);
          logger.info(`Successfully decrypted credentials for session ${sessionId}`);
          
          // Reconnect state
          await this.updateSessionStatusInDb(sessionId, 'CONNECTED');
          const session = this.activeSessions.get(sessionId);
          if (session) {
            session.status = 'CONNECTED';
          }
          this.broadcastEvent(workspaceId, 'session:update', { sessionId, status: 'CONNECTED' });
          return;
        } catch (err: any) {
          logger.warn(`Failed to decrypt credentials for session ${sessionId}. Falling back to QR scan.`);
        }
      }

      // No saved auth state or fallback needed -> QR Required
      await this.updateSessionStatusInDb(sessionId, 'QR_REQUIRED');
      const mockQrData = `whatshub-auth-qr-${sessionId}-${Date.now()}`;
      const qrDataUrl = await QRCode.toDataURL(mockQrData);

      const session = this.activeSessions.get(sessionId);
      if (session) {
        session.status = 'QR_REQUIRED';
        session.qrCodeUrl = qrDataUrl;
      }

      this.broadcastEvent(workspaceId, 'session:qr', {
        sessionId,
        qr: qrDataUrl,
        expiresAt: new Date(Date.now() + 60000).toISOString(),
      });
      this.broadcastEvent(workspaceId, 'session:update', { sessionId, status: 'QR_REQUIRED' });
    } catch (err: any) {
      logger.error(`Error in session simulation ${sessionId}:`, err.message);
      await this.updateSessionStatusInDb(sessionId, 'ERROR', err.message);
    }
  }

  /**
   * Called when a QR code is scanned or authentication succeeds.
   */
  public static async markSessionAuthenticated(sessionId: string, phoneNumber: string) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;

    logger.info(`Session ${sessionId} successfully authenticated for phone ${phoneNumber}`);

    // Generate durable auth state payload & encrypt
    const authPayload = JSON.stringify({
      creds: { me: { id: phoneNumber }, pairingCode: 'CONNECTED' },
      keys: {},
      timestamp: Date.now(),
    });
    const encryptedState = EncryptionService.encrypt(authPayload);

    // Save to Supabase durable storage
    await supabaseAdmin.from('whatsapp_auth_states').upsert(
      {
        workspace_id: session.workspaceId,
        session_id: sessionId,
        encrypted_state: encryptedState,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'session_id' }
    );

    // Update session table
    await supabaseAdmin.from('whatsapp_sessions').update({
      status: 'CONNECTED',
      phone_number: phoneNumber,
      connected_at: new Date().toISOString(),
      last_connected_at: new Date().toISOString(),
      is_active: true,
      last_error: null,
    }).eq('id', sessionId);

    session.status = 'CONNECTED';
    session.qrCodeUrl = undefined;

    this.broadcastEvent(session.workspaceId, 'session:connected', {
      sessionId,
      phoneNumber,
      status: 'CONNECTED',
    });
    this.broadcastEvent(session.workspaceId, 'session:update', { sessionId, status: 'CONNECTED' });
  }

  /**
   * Startup Restoration Hook: Called on Railway server boot.
   * Fetches all active sessions from Supabase and restores them without QR scans.
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
   * Safe Session Disconnect.
   */
  public static async disconnectSession(sessionId: string) {
    const session = this.activeSessions.get(sessionId);
    if (session) {
      session.status = 'DISCONNECTED';
      this.broadcastEvent(session.workspaceId, 'session:update', { sessionId, status: 'DISCONNECTED' });
    }
    this.activeSessions.delete(sessionId);

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
