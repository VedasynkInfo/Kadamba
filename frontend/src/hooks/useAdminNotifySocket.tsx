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
import { getAdminToken } from '@/services/api/client';
import { dashboardApi, type AdminBadges } from '@/services/dashboard/dashboardService';
import { invalidateForRealtime } from '@/lib/realtimeInvalidation';
import { socketOrigin } from './socketOrigin';
import { useAuth } from './useAuth';

type SoftRefreshKind = 'leads' | 'orders' | 'measurements' | 'payments' | 'dashboard';

interface AdminNotifyStore {
  connected: boolean;
  badges: AdminBadges;
  refreshBadges: () => Promise<void>;
  /**
   * Legacy hint channel for pages that still own their own fetches.
   *
   * Query-driven surfaces do not need this: `invalidateForRealtime` refreshes
   * them by cache key, and a page cannot forget to listen. This stays only for
   * the hand-rolled desks (the dashboards today) until Phase 7 moves them onto
   * the query layer, at which point it can be deleted outright.
   */
  onSoftRefresh: (fn: (kinds: SoftRefreshKind[]) => void) => () => void;
}

const AdminNotifyContext = createContext<AdminNotifyStore | null>(null);

const emptyBadges: AdminBadges = { leads: 0, measurements: 0, chat: 0 };

/**
 * Admin Socket.IO live notifications — toast + badge + cache invalidation.
 *
 * Every event does three things: tells the operator (toast), makes the affected
 * query families stale (`invalidateForRealtime`, which is how a page that is
 * already mounted updates), and — until Phase 7 — nudges the desks that still
 * run their own fetches (`bumpSoft`). The socket never carries data the app
 * renders; it only says that something changed.
 *
 * Graceful when socket is down (HTTP badges still work).
 */
export function AdminNotifyProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const { user } = useAuth();
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
    // Connect only once an access token exists (auth restore may still be running).
    if (!user) return;
    const token = getAdminToken();
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

    socket.on('notify:lead', (payload: { name?: string; service?: string }) => {
      toastRef.current({
        tone: 'info',
        title: 'New enquiry',
        description: payload.name
          ? `${payload.name}${payload.service ? ` · ${payload.service}` : ''}`
          : 'A new consultation request arrived',
      });
      void refreshBadges();
      invalidateForRealtime('notify:lead');
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
      invalidateForRealtime('notify:order');
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
        invalidateForRealtime('notify:measurement');
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
      invalidateForRealtime('notify:payment');
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
      invalidateForRealtime('notify:badge');
    });

    socket.on('portal:chat', () => {
      void refreshBadges();
      invalidateForRealtime('portal:chat');
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      setConnected(false);
    };
  }, [bumpSoft, refreshBadges, user]);

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
