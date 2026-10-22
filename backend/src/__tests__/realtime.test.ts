import http from 'http';
import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  emitNotifyBadge,
  emitNotifyLead,
  emitNotifyMeasurement,
  emitNotifyOrder,
  emitNotifyPayment,
  emitPortalChatMessage,
  getPortalIo,
  initPortalSocket,
} from '../realtime/portalSocket';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler';
import { ApiError } from '../utils/ApiError';
import multer from 'multer';

/** A minimal Express-like response that records what was sent. */
function fakeRes() {
  const state = {
    statusCode: 0,
    body: undefined as unknown,
    headersSent: false,
    headers: {} as Record<string, unknown>,
  };
  return {
    state,
    headersSent: false,
    status(code: number) {
      state.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      state.body = payload;
      this.headersSent = true;
      return this;
    },
    getHeader(name: string) {
      return state.headers[name];
    },
  };
}

/**
 * Run the socket's connection middleware against a fake handshake.
 *
 * `Namespace.run` is the public entry point Socket.IO itself uses, so this
 * exercises the real authentication chain without needing a live client.
 */
function runSocketMiddleware(
  io: unknown,
  handshake: { auth?: Record<string, unknown>; headers?: Record<string, unknown> },
  done: (err?: Error) => void,
) {
  const namespace = (io as { of: (name: string) => { run: (s: unknown, fn: (e?: Error) => void) => void } }).of('/');
  namespace.run({ handshake, data: {}, _onconnect: () => {} }, done);
}

describe('portal socket', () => {
  let adminToken = '';

  beforeEach(async () => {
    // The socket accepts the same access token as the HTTP API.
    const { registerAdminAndGetToken } = await import('./helpers/auth');
    const { createApp } = await import('../app');
    adminToken = await registerAdminAndGetToken(createApp());
  });

  it('starts a server and exposes it', () => {
    const server = http.createServer();
    const io = initPortalSocket(server);
    expect(io).toBeTruthy();
    expect(getPortalIo()).toBe(io);
    io.close();
  });

  it('refuses a connection without a token', () => {
    const server = http.createServer();
    const io = initPortalSocket(server);

    let error: Error | undefined;
    runSocketMiddleware(io, { auth: {}, headers: {} }, (err) => {
      error = err;
    });

    expect(error?.message).toBe('Unauthorized');
    io.close();
  });

  it('refuses a connection with a token that cannot be verified', () => {
    const server = http.createServer();
    const io = initPortalSocket(server);

    let error: Error | undefined;
    runSocketMiddleware(io, { auth: { token: 'not-a-real-token' }, headers: {} }, (err) => {
      error = err;
    });

    expect(error?.message).toBe('Unauthorized');
    io.close();
  });

  it('accepts a valid bearer token', () => {
    const server = http.createServer();
    const io = initPortalSocket(server);

    let error: Error | undefined;
    runSocketMiddleware(
      io,
      { auth: {}, headers: { authorization: `Bearer ${adminToken}` } },
      (err) => {
        error = err;
      },
    );

    expect(error).toBeUndefined();
    io.close();
  });

  it('emits to the admin room when a lead arrives', () => {
    const server = http.createServer();
    const io = initPortalSocket(server);
    const to = vi.spyOn(io, 'to').mockReturnValue({ emit: vi.fn() } as never);

    emitNotifyLead({ leadId: '1', name: 'Anita' });

    expect(to).toHaveBeenCalledWith('admin:notifications');
    io.close();
  });

  it('emits an order notification to the admin room and the customer room', () => {
    const server = http.createServer();
    const io = initPortalSocket(server);
    const to = vi.spyOn(io, 'to').mockReturnValue({
      emit: vi.fn(),
    } as never);

    emitNotifyOrder({ orderId: '1', customerId: 'c1', status: 'confirmed' });

    expect(to).toHaveBeenCalledWith('admin:notifications');
    expect(to).toHaveBeenCalledWith('customer:c1');
    io.close();
  });

  it('emits a measurement notification to both rooms', () => {
    const server = http.createServer();
    const io = initPortalSocket(server);
    const to = vi.spyOn(io, 'to').mockReturnValue({ emit: vi.fn() } as never);

    emitNotifyMeasurement({ profileId: 'p1', customerId: 'c1' });
    expect(to).toHaveBeenCalledWith('admin:notifications');
    expect(to).toHaveBeenCalledWith('customer:c1');
    io.close();
  });

  it('emits a payment notification to both rooms', () => {
    const server = http.createServer();
    const io = initPortalSocket(server);
    const to = vi.spyOn(io, 'to').mockReturnValue({ emit: vi.fn() } as never);

    emitNotifyPayment({ paymentId: 'pay1', customerId: 'c1' });
    expect(to).toHaveBeenCalledWith('admin:notifications');
    expect(to).toHaveBeenCalledWith('customer:c1');
    io.close();
  });

  it('emits a chat message to the customer, admin and watching rooms', () => {
    const server = http.createServer();
    const io = initPortalSocket(server);
    const to = vi.spyOn(io, 'to').mockReturnValue({ emit: vi.fn() } as never);

    emitPortalChatMessage('c1', {
      id: 'm1',
      senderRole: 'customer',
      body: 'When is my trial?',
      createdAt: new Date().toISOString(),
    });

    expect(to).toHaveBeenCalledWith('customer:c1');
    expect(to).toHaveBeenCalledWith('admin:portal');
    expect(to).toHaveBeenCalledWith('admin:customer:c1');
    io.close();
  });

  it('emits a badge to the admin and the customer according to the scope', () => {
    const server = http.createServer();
    const io = initPortalSocket(server);
    const to = vi.spyOn(io, 'to').mockReturnValue({ emit: vi.fn() } as never);

    emitNotifyBadge({ scope: 'admin', reason: 'lead' });
    expect(to).toHaveBeenCalledWith('admin:notifications');
    expect(to).not.toHaveBeenCalledWith('customer:c1');

    to.mockClear();
    emitNotifyBadge({ scope: 'customer', customerId: 'c1', reason: 'chat' });
    expect(to).toHaveBeenCalledWith('customer:c1');
    expect(to).not.toHaveBeenCalledWith('admin:notifications');

    to.mockClear();
    emitNotifyBadge({ scope: 'both', customerId: 'c1' });
    expect(to).toHaveBeenCalledWith('admin:notifications');
    expect(to).toHaveBeenCalledWith('customer:c1');
    io.close();
  });
});

describe('error handler', () => {
  it('sends an API error with its code and field detail', () => {
    const res = fakeRes();
    errorHandler(
      new ApiError(400, 'Validation failed', [{ field: 'name' }], 'VALIDATION_FAILED'),
      {} as never,
      res as never,
      {} as never,
    );

    expect(res.state.statusCode).toBe(400);
    expect(res.state.body).toMatchObject({
      success: false,
      code: 'VALIDATION_FAILED',
      message: 'Validation failed',
    });
    expect((res.state.body as { errors?: unknown[] }).errors).toHaveLength(1);
  });

  it('turns a duplicate key into a 409', () => {
    const res = fakeRes();
    errorHandler(
      { code: 11000, keyValue: { email: 'a@b.com' } },
      {} as never,
      res as never,
      {} as never,
    );

    expect(res.state.statusCode).toBe(409);
    expect(res.state.body).toMatchObject({ code: 'CONFLICT' });
  });

  it('turns a validation error into a 400 with the field messages', () => {
    const res = fakeRes();
    const error = new Error('Validation failed');
    error.name = 'ValidationError';
    (error as Error & { errors?: Record<string, { message: string }> }).errors = {
      email: { message: 'Email is required' },
    };

    errorHandler(error, {} as never, res as never, {} as never);

    expect(res.state.statusCode).toBe(400);
    expect(res.state.body).toMatchObject({ code: 'VALIDATION_FAILED' });
  });

  it('turns a cast error into a 400', () => {
    const res = fakeRes();
    const error = new Error('Cast to ObjectId failed');
    error.name = 'CastError';

    errorHandler(error, {} as never, res as never, {} as never);

    expect(res.state.statusCode).toBe(400);
    expect(res.state.body).toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('rejects a spoofed upload with the upload code', () => {
    const res = fakeRes();
    errorHandler(
      new Error('Only image uploads are allowed'),
      {} as never,
      res as never,
      {} as never,
    );

    expect(res.state.statusCode).toBe(400);
    expect(res.state.body).toMatchObject({ code: 'UPLOAD_INVALID' });
  });

  it('rejects a multer file-size error with a friendly message', () => {
    const res = fakeRes();
    const error = new multer.MulterError('LIMIT_FILE_SIZE');
    errorHandler(error, {} as never, res as never, {} as never);

    expect(res.state.statusCode).toBe(400);
    expect(res.state.body).toMatchObject({ code: 'UPLOAD_INVALID' });
    expect((res.state.body as { message: string }).message).toContain('25MB');
  });

  it('rejects a multer file-count error with a friendly message', () => {
    const res = fakeRes();
    const error = new multer.MulterError('LIMIT_FILE_COUNT');
    errorHandler(error, {} as never, res as never, {} as never);

    expect(res.state.statusCode).toBe(400);
    expect((res.state.body as { message: string }).message).toContain('one file');
  });

  it('falls back to a 500 with a readable message', () => {
    const res = fakeRes();
    errorHandler(new Error('Something broke'), {} as never, res as never, {} as never);

    expect(res.state.statusCode).toBe(500);
    expect(res.state.body).toMatchObject({ code: 'INTERNAL' });
    expect((res.state.body as { message: string }).message).toBe('Something broke');
  });

  it('does not send a second response once the headers are out', () => {
    const res = fakeRes();
    res.headersSent = true;
    errorHandler(new Error('late'), {} as never, res as never, {} as never);
    expect(res.state.statusCode).toBe(0);
  });

  it('answers an unknown route with the not-found envelope', () => {
    const res = fakeRes();
    notFoundHandler({} as never, res as never);
    expect(res.state.statusCode).toBe(404);
    expect(res.state.body).toMatchObject({ code: 'NOT_FOUND' });
  });
});
