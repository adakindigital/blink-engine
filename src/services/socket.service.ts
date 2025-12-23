import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger.js';
import { Server as HttpServer } from 'http';

class SocketService {
    private io: Server | null = null;
    private userSockets: Map<string, string> = new Map(); // userId -> socketId

    initialize(httpServer: HttpServer, corsOrigins: string | string[]) {
        this.io = new Server(httpServer, {
            cors: {
                origin: corsOrigins,
                methods: ['GET', 'POST'],
                credentials: true
            }
        });

        this.io.on('connection', (socket: Socket) => {
            logger.info(`Socket connected: ${socket.id}`);

            // Auth (Simplified for now - in prod use middleware)
            // Client should join a room named "user:{userId}"
            socket.on('join', (userId: string) => {
                logger.info(`Socket ${socket.id} joined user room: ${userId}`);
                socket.join(`user:${userId}`);
                this.userSockets.set(userId, socket.id);
            });

            socket.on('disconnect', () => {
                logger.info(`Socket disconnected: ${socket.id}`);
                // Cleanup map if needed
            });
        });
    }

    /**
     * Emit an event to specific users
     */
    emitToUsers(userIds: string[], event: string, data: any) {
        if (!this.io) {
            logger.warn('SocketService not initialized');
            return;
        }

        userIds.forEach(userId => {
            this.io?.to(`user:${userId}`).emit(event, data);
        });
    }

    /**
     * Emit to all connected clients (use sparingly)
     */
    broadcast(event: string, data: any) {
        if (!this.io) return;
        this.io.emit(event, data);
    }
}

export const socketService = new SocketService();
