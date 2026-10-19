import { useCallback, useEffect, useMemo, useState } from 'react';
import { leadsAdminApi, submitLeadRequest } from '@/services/leads/leadService';
import {
  seedLeads,
  type Lead,
  type LeadStatus,
} from '../data';

export interface CreateLeadInput {
  name: string;
  phone: string;
  email?: string;
  city?: string;
  service: string;
  source?: string;
  assignee?: string;
  status?: LeadStatus;
  quality?: 'hot' | 'warm' | 'cold';
  notes?: string;
  eventDate?: string;
  occasion?: string;
  budget?: string;
  preferredDate?: string;
  message?: string;
}

/**
 * CRM store — backed by Phase 13 Leads API (seed fallback in DEV).
 */
export function useLeadsStore() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
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
    const updated = await leadsAdminApi.update(id, { status });
    setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
  }, []);

  const updateAssignee = useCallback(async (id: string, assignee: string) => {
    const updated = await leadsAdminApi.update(id, { assignee });
    setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
  }, []);

  const addNote = useCallback(async (id: string, body: string, author = 'Studio Lead') => {
    const trimmed = body.trim();
    if (!trimmed) return;

    const updated = await leadsAdminApi.addNote(id, trimmed, author);
    setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
  }, []);

  const scheduleFollowUp = useCallback(
    async (
      id: string,
      payload: {
        scheduledAt: string;
        type?: 'call' | 'whatsapp' | 'email' | 'in_person_consultation';
        notes?: string;
      },
    ) => {
      const updated = await leadsAdminApi.scheduleFollowUp(id, payload);
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
      return updated;
    },
    [],
  );

  const completeFollowUp = useCallback(
    async (
      id: string,
      followUpId: string,
      payload: { outcome?: string; notes?: string },
    ) => {
      const updated = await leadsAdminApi.completeFollowUp(id, followUpId, payload);
      setLeads((prev) => prev.map((l) => (l.id === id ? updated : l)));
      return updated;
    },
    [],
  );

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

  const addLead = useCallback(
    async (leadData: CreateLeadInput) => {
      try {
        await submitLeadRequest({
          name: leadData.name || '',
          phone: leadData.phone || '',
          email: leadData.email || '',
          city: leadData.city || '',
          service: leadData.service || '',
          occasion: leadData.occasion || 'Bridal',
          budget: leadData.budget || 'Standard',
          preferredDate: leadData.preferredDate || leadData.eventDate || new Date().toISOString(),
          message: leadData.message || leadData.notes || '',
        });
      } catch (err) {
        console.warn('submitLeadRequest error, falling back locally', err);
      }
      await refresh();
    },
    [refresh],
  );

  return {
    leads,
    loading,
    stats,
    getById,
    updateStatus,
    updateLeadStatus: updateStatus,
    updateAssignee,
    addNote,
    scheduleFollowUp,
    completeFollowUp,
    resetToSeed,
    refresh,
    addLead,
  };
}
