import { useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { PORTAL_TOKEN_KEY, type PortalMessage } from '@/services/portal/portalService';

function socketUrl() {
  const api = import.meta.env.VITE_API_URL as string | undefined;
  if (api) {
    try {
      return new URL(api).origin;
    } catch {
      return window.location.origin;
    }
  }
  return window.location.origin;
}

/**
 * Realtime portal chat — joins customer room via JWT auth handshake.
 */
export function usePortalChatSocket(onMessage: (msg: PortalMessage) => void) {
  const [connected, setConnected] = useState(false);
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    const token = localStorage.getItem(PORTAL_TOKEN_KEY);
    if (!token) return;

    const socket: Socket = io(socketUrl(), {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1200,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('portal:chat', (payload: PortalMessage) => {
      handlerRef.current(payload);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      setConnected(false);
    };
  }, []);

  return { connected };
}
