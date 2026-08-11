import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import { logger } from '../config/logger.js';
import { SessionManager } from '../services/SessionManager.js';

export function setupSocketIO(server: HttpServer): SocketIOServer {
  const io = new SocketIOServer(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  SessionManager.setSocketIo(io);

  io.on('connection', (socket) => {
    logger.info(`Socket connected: ${socket.id}`);

    socket.on('join:workspace', (workspaceId: string) => {
      if (workspaceId) {
        socket.join(`workspace:${workspaceId}`);
        logger.info(`Socket ${socket.id} joined workspace:${workspaceId}`);
      }
    });

    socket.on('join:conversation', (conversationId: string) => {
      if (conversationId) {
        socket.join(`conversation:${conversationId}`);
        logger.info(`Socket ${socket.id} joined conversation:${conversationId}`);
      }
    });

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
}
