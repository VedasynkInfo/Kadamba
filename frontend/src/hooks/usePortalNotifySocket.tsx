import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { io, type Socket } from 'socket.io-client';
import { useToast } from '@/components/ui/Toast';
import { PORTAL_TOKEN_KEY } from '@/services/portal/portalService';
import { socketOrigin } from './socketOrigin';

type SoftRefreshKind = 'orders' | 'measurements' | 'payments' | 'dashboard' | 'chat';

interface PortalNotifyStore {
  connected: boolean;
  refreshTick: number;
  onSoftRefresh: (fn: (kinds: SoftRefreshKind[]) => void) => () => void;
}

const PortalNotifyContext = createContext<PortalNotifyStore | null>(null);

/**
 * Portal Socket.IO live notifications — toast + soft-refresh dashboard/lists.
 */
export function PortalNotifyProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);
  const listeners = useRef(new Set<(kinds: SoftRefreshKind[]) => void>());
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const bumpSoft = useCallback((kinds: SoftRefreshKind[]) => {
    setRefreshTick((t) => t + 1);
    listeners.current.forEach((fn) => fn(kinds));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(PORTAL_TOKEN_KEY);
    if (!token) return;

    const socket: Socket = io(socketOrigin(), {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1500,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('notify:order', (payload: { status?: string; title?: string }) => {
      toastRef.current({
        tone: 'info',
        title: 'Order update',
        description: payload.title
          ? `${payload.title}${payload.status ? ` · ${payload.status}` : ''}`
          : 'Your order status changed',
      });
      bumpSoft(['orders', 'dashboard']);
    });

    socket.on('notify:measurement', (payload: { status?: string }) => {
      toastRef.current({
        tone: payload.status === 'active' ? 'success' : 'info',
        title:
          payload.status === 'active'
            ? 'Measurements approved'
            : 'Measurement update',
        description:
          payload.status === 'active'
            ? 'Your fitting measurements were approved by the boutique.'
            : 'Your measurement profile was updated.',
      });
      bumpSoft(['measurements', 'dashboard']);
    });

    socket.on('notify:payment', (payload: { amount?: number }) => {
      toastRef.current({
        tone: 'success',
        title: 'Payment received',
        description:
          payload.amount != null
            ? `₹${payload.amount} recorded on your order`
            : 'A payment was recorded',
      });
      bumpSoft(['payments', 'orders', 'dashboard']);
    });

    socket.on('notify:badge', () => {
      bumpSoft(['dashboard', 'chat']);
    });

    socket.on('portal:chat', () => {
      bumpSoft(['chat', 'dashboard']);
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      setConnected(false);
    };
  }, [bumpSoft]);

  const onSoftRefresh = useCallback((fn: (kinds: SoftRefreshKind[]) => void) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);

  const value = useMemo(
    () => ({ connected, refreshTick, onSoftRefresh }),
    [connected, refreshTick, onSoftRefresh],
  );

  return (
    <PortalNotifyContext.Provider value={value}>{children}</PortalNotifyContext.Provider>
  );
}

export function usePortalNotify(): PortalNotifyStore {
  const ctx = useContext(PortalNotifyContext);
  if (!ctx) {
    throw new Error('usePortalNotify must be used within PortalNotifyProvider');
  }
  return ctx;
}

export function usePortalNotifyOptional(): PortalNotifyStore | null {
  return useContext(PortalNotifyContext);
}
