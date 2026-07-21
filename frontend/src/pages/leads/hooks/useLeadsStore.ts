import { useCallback, useEffect, useMemo, useState } from 'react';
import { leadsAdminApi } from '@/services/leads/leadService';
import {
  seedLeads,
  type Lead,
  type LeadStatus,
} from '../data';

function isDemoToken(): boolean {
  return localStorage.getItem('kadamba_token') === 'demo-admin-token';
}

/**
 * CRM store — backed by Phase 13 Leads API (seed fallback in DEV / demo unlock).
 */
export function useLeadsStore() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      if (isDemoToken() && import.meta.env.DEV) {
        setLeads(structuredClone(seedLeads));
        return;
      }
      const data = await leadsAdminApi.list({ limit: 200 });
      setLeads(
        data.items.length
          ? data.items
          : import.meta.env.DEV
            ? structuredClone(seedLeads)
            : [],
      );
    } catch (err) {
      console.warn('Leads API unavailable — using seed data', err);
      if (import.meta.env.DEV) {
        setLeads(structuredClone(seedLeads));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const getById = useCallback(
    (id: string) => leads.find((lead) => lead.id === id),
    [leads],
  );

  const updateStatus = useCallback(async (id: string, status: LeadStatus) => {
    if (isDemoToken() && import.meta.env.DEV) {
      setLeads((prev) =>
        prev.map((lead) => {
          if (lead.id !== id) return lead;
          return {
            ...lead,
            status,
            updatedAt: new Date().toISOString(),
            timeline: [
              ...lead.timeline,
              {
                id: `t-${Date.now()}`,
                type: 'status' as const,
                label: `Status → ${status}`,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }),
      );
      return;
    }
    const updated = await leadsAdminApi.update(id, { status });
    setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
  }, []);

  const updateAssignee = useCallback(async (id: string, assignee: string) => {
    if (isDemoToken() && import.meta.env.DEV) {
      setLeads((prev) =>
        prev.map((lead) => {
          if (lead.id !== id) return lead;
          return {
            ...lead,
            assignee,
            updatedAt: new Date().toISOString(),
            timeline: [
              ...lead.timeline,
              {
                id: `t-${Date.now()}`,
                type: 'assigned' as const,
                label: `Assigned to ${assignee}`,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }),
      );
      return;
    }
    const updated = await leadsAdminApi.update(id, { assignee });
    setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
  }, []);

  const addNote = useCallback(async (id: string, body: string, author = 'Studio Lead') => {
    const trimmed = body.trim();
    if (!trimmed) return;

    if (isDemoToken() && import.meta.env.DEV) {
      setLeads((prev) =>
        prev.map((lead) => {
          if (lead.id !== id) return lead;
          const now = new Date().toISOString();
          return {
            ...lead,
            notes: [
              ...lead.notes,
              { id: `n-${Date.now()}`, body: trimmed, author, createdAt: now },
            ],
            updatedAt: now,
            timeline: [
              ...lead.timeline,
              {
                id: `t-${Date.now()}`,
                type: 'note' as const,
                label: 'Note added',
                detail: trimmed.slice(0, 80),
                createdAt: now,
              },
            ],
          };
        }),
      );
      return;
    }

    const updated = await leadsAdminApi.addNote(id, trimmed, author);
    setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
  }, []);

  const resetToSeed = useCallback(() => {
    const next = structuredClone(seedLeads);
    setLeads(next);
  }, []);

  const stats = useMemo(() => {
    const open = leads.filter(
      (l) => l.status !== 'Completed' && l.status !== 'Rejected',
    ).length;
    const appointments = leads.filter((l) => l.status === 'Appointment').length;
    const newCount = leads.filter((l) => l.status === 'New').length;
    return {
      total: leads.length,
      open,
      appointments,
      newCount,
      completed: leads.filter((l) => l.status === 'Completed').length,
    };
  }, [leads]);

  return {
    leads,
    loading,
    stats,
    getById,
    updateStatus,
    updateAssignee,
    addNote,
    resetToSeed,
    refresh,
  };
}
