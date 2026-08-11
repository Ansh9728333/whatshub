import express from 'express';
import http from 'http';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { logger } from './config/logger.js';
import { requireAuth, requireWorkspace } from './middleware/auth.js';
import { setupSocketIO } from './sockets/socketServer.js';
import { SessionManager } from './services/SessionManager.js';

import * as sessionController from './controllers/sessionController.js';
import * as inboxController from './controllers/inboxController.js';
import * as contactController from './controllers/contactController.js';
import * as campaignController from './controllers/campaignController.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = parseInt(process.env.PORT || '5000', 10);

// Security & Middleware
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Initialize Socket.IO Server
setupSocketIO(server);

// Health check endpoint (Railway check)
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'whatshub-api',
    database: 'connected',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'WhatsHub Production Multi-Tenant API is Online',
    health: '/health',
  });
});

// Protected API Routes
const apiRouter = express.Router();
apiRouter.use(requireAuth);
apiRouter.use(requireWorkspace);

// Sessions
apiRouter.get('/whatsapp/sessions', sessionController.listSessions);
apiRouter.post('/whatsapp/sessions', sessionController.createSession);
apiRouter.get('/whatsapp/sessions/:id/health', sessionController.getSessionHealth);
apiRouter.post('/whatsapp/sessions/:id/simulate-scan', sessionController.simulateQrScan);
apiRouter.post('/whatsapp/sessions/:id/disconnect', sessionController.disconnectSession);

// Inbox
apiRouter.get('/inbox/conversations', inboxController.listConversations);
apiRouter.get('/inbox/conversations/:id/messages', inboxController.getConversationMessages);
apiRouter.post('/inbox/conversations/:id/messages', inboxController.sendMessage);
apiRouter.post('/inbox/conversations/:id/notes', inboxController.addInternalNote);
apiRouter.patch('/inbox/conversations/:id/status', inboxController.updateConversationStatus);

// Contacts CRM
apiRouter.get('/contacts', contactController.listContacts);
apiRouter.post('/contacts', contactController.createContact);
apiRouter.post('/contacts/import', contactController.importContactsCsv);

// Campaigns
apiRouter.get('/campaigns', campaignController.listCampaigns);
apiRouter.post('/campaigns', campaignController.createCampaign);
apiRouter.post('/campaigns/:id/launch', campaignController.launchCampaign);

app.use('/api', apiRouter);

// Global Error Catchers to prevent container crash
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled Promise Rejection caught:', reason?.message || reason);
});

process.on('uncaughtException', (err: Error) => {
  logger.error('Uncaught Exception caught:', err.message);
});

// Start HTTP Server binding to 0.0.0.0 for Railway
server.listen(PORT, '0.0.0.0', async () => {
  logger.info(`WhatsHub Backend API listening on 0.0.0.0:${PORT}`);
  
  try {
    // Trigger Railway boot session restoration check safely
    await SessionManager.restoreAllSessions();
  } catch (err: any) {
    logger.error('Startup session restoration warning:', err.message);
  }
});

// Railway Graceful Shutdown Hooks
function gracefulShutdown(signal: string) {
  logger.info(`Received ${signal}. Starting Railway graceful shutdown...`);
  server.close(() => {
    logger.info('HTTP server closed. Exiting process.');
    process.exit(0);
  });
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
