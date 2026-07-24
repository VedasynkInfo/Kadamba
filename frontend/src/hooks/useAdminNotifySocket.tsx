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
import { dashboardApi, type AdminBadges } from '@/services/dashboard/dashboardService';
import { socketOrigin } from './socketOrigin';

type SoftRefreshKind = 'leads' | 'orders' | 'measurements' | 'payments' | 'dashboard';

interface AdminNotifyStore {
  connected: boolean;
  badges: AdminBadges;
  refreshBadges: () => Promise<void>;
  /** Subscribe to soft-refresh hints for open list pages */
  onSoftRefresh: (fn: (kinds: SoftRefreshKind[]) => void) => () => void;
}

const AdminNotifyContext = createContext<AdminNotifyStore | null>(null);

const emptyBadges: AdminBadges = { leads: 0, measurements: 0, chat: 0 };

/**
 * Admin Socket.IO live notifications — toast + badge + soft-refresh.
 * Graceful when socket is down (HTTP badges still work).
 */
export function AdminNotifyProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [connected, setConnected] = useState(false);
  const [badges, setBadges] = useState<AdminBadges>(emptyBadges);
  const listeners = useRef(new Set<(kinds: SoftRefreshKind[]) => void>());
  const toastRef = useRef(toast);
  toastRef.current = toast;

  const refreshBadges = useCallback(async () => {
    try {
      const data = await dashboardApi.getBadges();
      setBadges(data);
    } catch {
      // REST fallback failed — keep last known
    }
  }, []);

  const bumpSoft = useCallback((kinds: SoftRefreshKind[]) => {
    listeners.current.forEach((fn) => fn(kinds));
  }, []);

  useEffect(() => {
    void refreshBadges();
  }, [refreshBadges]);

  useEffect(() => {
    const token = localStorage.getItem('kadamba_token');
    if (!token || token === 'demo-admin-token') return;

    const socket: Socket = io(socketOrigin(), {
      path: '/socket.io',
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1500,
    });

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('notify:lead', (payload: { name?: string; service?: string }) => {
      toastRef.current({
        tone: 'info',
        title: 'New enquiry',
        description: payload.name
          ? `${payload.name}${payload.service ? ` · ${payload.service}` : ''}`
          : 'A new consultation request arrived',
      });
      void refreshBadges();
      bumpSoft(['leads', 'dashboard']);
    });

    socket.on('notify:order', (payload: { status?: string; orderNumber?: number }) => {
      toastRef.current({
        tone: 'info',
        title: 'Order update',
        description: payload.orderNumber
          ? `#${payload.orderNumber}${payload.status ? ` → ${payload.status}` : ''}`
          : 'An order changed status',
      });
      bumpSoft(['orders', 'dashboard']);
    });

    socket.on(
      'notify:measurement',
      (payload: { status?: string; profileName?: string; productTypeCode?: string }) => {
        const pending = payload.status === 'pending_approval';
        toastRef.current({
          tone: pending ? 'info' : 'success',
          title: pending ? 'Measurement pending approval' : 'Measurement update',
          description: payload.profileName || payload.productTypeCode || 'Profile updated',
        });
        void refreshBadges();
        bumpSoft(['measurements', 'dashboard']);
      },
    );

    socket.on('notify:payment', (payload: { amount?: number; orderNumber?: number }) => {
      toastRef.current({
        tone: 'success',
        title: 'Payment recorded',
        description:
          payload.amount != null
            ? `₹${payload.amount}${payload.orderNumber ? ` · #${payload.orderNumber}` : ''}`
            : 'A payment was recorded',
      });
      bumpSoft(['payments', 'orders', 'dashboard']);
    });

    socket.on('notify:badge', (payload: Partial<AdminBadges>) => {
      if (payload.leads != null || payload.measurements != null || payload.chat != null) {
        setBadges((prev) => ({
          leads: payload.leads ?? prev.leads,
          measurements: payload.measurements ?? prev.measurements,
          chat: payload.chat ?? prev.chat,
        }));
      } else {
        void refreshBadges();
      }
    });

    socket.on('portal:chat', () => {
      void refreshBadges();
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      setConnected(false);
    };
  }, [bumpSoft, refreshBadges]);

  const onSoftRefresh = useCallback((fn: (kinds: SoftRefreshKind[]) => void) => {
    listeners.current.add(fn);
    return () => {
      listeners.current.delete(fn);
    };
  }, []);

  const value = useMemo(
    () => ({ connected, badges, refreshBadges, onSoftRefresh }),
    [connected, badges, refreshBadges, onSoftRefresh],
  );

  return (
    <AdminNotifyContext.Provider value={value}>{children}</AdminNotifyContext.Provider>
  );
}

export function useAdminNotify(): AdminNotifyStore {
  const ctx = useContext(AdminNotifyContext);
  if (!ctx) {
    throw new Error('useAdminNotify must be used within AdminNotifyProvider');
  }
  return ctx;
}

/** Optional — returns null outside provider (list pages may soft-refresh when available) */
export function useAdminNotifyOptional(): AdminNotifyStore | null {
  return useContext(AdminNotifyContext);
}
