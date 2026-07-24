import type { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { Server, type Socket } from 'socket.io';
import { env } from '../config/env';
import { logger } from '../config/logger';
import type { AuthPayload } from '../middleware/auth';

let io: Server | null = null;

const ADMIN_NOTIFICATIONS = 'admin:notifications';
const ADMIN_PORTAL = 'admin:portal';

function customerRoom(customerId: string) {
  return `customer:${customerId}`;
}

function adminCustomerRoom(customerId: string) {
  return `admin:customer:${customerId}`;
}

export function initPortalSocket(server: HttpServer): Server {
  io = new Server(server, {
    path: '/socket.io',
    cors: {
      origin: env.allowedOrigins,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ||
        (typeof socket.handshake.headers.authorization === 'string' &&
        socket.handshake.headers.authorization.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.slice(7)
          : undefined);

      if (!token) {
        return next(new Error('Unauthorized'));
      }

      const payload = jwt.verify(token, env.jwtSecret) as AuthPayload;
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as AuthPayload | undefined;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    if (user.role === 'customer' && user.customerId) {
      void socket.join(customerRoom(user.customerId));
    }

    if (user.role === 'admin' || user.role === 'staff') {
      void socket.join(ADMIN_PORTAL);
      void socket.join(ADMIN_NOTIFICATIONS);
      socket.on('portal:watch', (customerId: string) => {
        if (typeof customerId === 'string' && customerId) {
          void socket.join(adminCustomerRoom(customerId));
        }
      });
    }

    logger.debug({ userId: user.id, role: user.role }, 'Portal socket connected');

    socket.on('disconnect', () => {
      logger.debug({ userId: user.id }, 'Portal socket disconnected');
    });
  });

  logger.info('Portal Socket.IO ready');
  return io;
}

export function emitPortalChatMessage(
  customerId: string,
  message: {
    id: string;
    orderId?: string;
    senderRole: string;
    body: string;
    attachments?: string[];
    createdAt: string;
  },
) {
  if (!io) return;
  const payload = { ...message, customerId };
  io.to(customerRoom(customerId)).emit('portal:chat', payload);
  io.to(ADMIN_PORTAL).emit('portal:chat', payload);
  io.to(adminCustomerRoom(customerId)).emit('portal:chat', payload);
  // Soft badge bump for both sides (chat unread)
  emitNotifyBadge({ scope: 'both', customerId, reason: 'chat' });
}

/** New lead / public or portal request */
export function emitNotifyLead(payload: Record<string, unknown>) {
  if (!io) return;
  io.to(ADMIN_NOTIFICATIONS).emit('notify:lead', payload);
}

/** Order status or payment-summary change */
export function emitNotifyOrder(payload: Record<string, unknown> & { customerId?: string }) {
  if (!io) return;
  io.to(ADMIN_NOTIFICATIONS).emit('notify:order', payload);
  if (payload.customerId) {
    io.to(customerRoom(String(payload.customerId))).emit('notify:order', payload);
  }
}

/** Measurement submitted / approved / status change */
export function emitNotifyMeasurement(payload: Record<string, unknown> & { customerId?: string }) {
  if (!io) return;
  io.to(ADMIN_NOTIFICATIONS).emit('notify:measurement', payload);
  if (payload.customerId) {
    io.to(customerRoom(String(payload.customerId))).emit('notify:measurement', payload);
  }
}

/** Payment recorded */
export function emitNotifyPayment(payload: Record<string, unknown> & { customerId?: string }) {
  if (!io) return;
  io.to(ADMIN_NOTIFICATIONS).emit('notify:payment', payload);
  if (payload.customerId) {
    io.to(customerRoom(String(payload.customerId))).emit('notify:payment', payload);
  }
}

/** Aggregate badge hint — clients refresh counts via REST */
export function emitNotifyBadge(payload: {
  scope: 'admin' | 'customer' | 'both';
  customerId?: string;
  reason?: string;
  leads?: number;
  measurements?: number;
  chat?: number;
}) {
  if (!io) return;
  if (payload.scope === 'admin' || payload.scope === 'both') {
    io.to(ADMIN_NOTIFICATIONS).emit('notify:badge', payload);
  }
  if ((payload.scope === 'customer' || payload.scope === 'both') && payload.customerId) {
    io.to(customerRoom(payload.customerId)).emit('notify:badge', payload);
  }
}

export function getPortalIo(): Server | null {
  return io;
}
