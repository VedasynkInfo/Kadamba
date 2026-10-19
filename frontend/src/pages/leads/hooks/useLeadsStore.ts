import { useCallback, useMemo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { leadsAdminApi, submitLeadRequest } from '@/services/leads/leadService';
import { qk } from '@/lib/queryKeys';
import { toAppError, type AppError } from '@/lib/apiError';
import type { Lead, LeadStatus } from '../data';

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

const LEADS_FILTERS = { limit: 200 } as const;

/**
 * CRM store backed by the Leads API.
 *
 * This used to substitute bundled demo leads whenever the API returned nothing
 * or failed (development only), and `addLead` swallowed its own error — so the
 * caller toasted a success that never happened. Reads now surface `error`, and
 * a failed create rejects so the form can report it.
 */
export function useLeadsStore() {
  const queryClient = useQueryClient();

  const leadsQuery = useQuery({
    queryKey: qk.leads.list(LEADS_FILTERS),
    queryFn: () => leadsAdminApi.list(LEADS_FILTERS),
    select: (page) => (Array.isArray(page?.items) ? page.items : []),
  });

  // Stable identity: `leads` feeds memo/useCallback deps below.
  const leads = useMemo<Lead[]>(() => leadsQuery.data ?? [], [leadsQuery.data]);

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: qk.leads.all }),
    [queryClient],
  );

  const updateMutation = useMutation({
    mutationFn: (args: { id: string; patch: { status?: LeadStatus; assignee?: string } }) =>
      leadsAdminApi.update(args.id, args.patch),
    onSuccess: invalidate,
  });

  const noteMutation = useMutation({
    mutationFn: (args: { id: string; body: string; author: string }) =>
      leadsAdminApi.addNote(args.id, args.body, args.author),
    onSuccess: invalidate,
  });

  const followUpMutation = useMutation({
    mutationFn: (args: {
      id: string;
      payload: {
        scheduledAt: string;
        type?: 'call' | 'whatsapp' | 'email' | 'in_person_consultation';
        notes?: string;
      };
    }) => leadsAdminApi.scheduleFollowUp(args.id, args.payload),
    onSuccess: invalidate,
  });

  const completeFollowUpMutation = useMutation({
    mutationFn: (args: {
      id: string;
      followUpId: string;
      payload: { outcome?: string; notes?: string };
    }) => leadsAdminApi.completeFollowUp(args.id, args.followUpId, args.payload),
    onSuccess: invalidate,
  });

  const createMutation = useMutation({
    mutationFn: (input: CreateLeadInput) =>
      submitLeadRequest({
        name: input.name || '',
        phone: input.phone || '',
        email: input.email || '',
        city: input.city || '',
        service: input.service || '',
        occasion: input.occasion || 'Bridal',
        budget: input.budget || 'Standard',
        preferredDate: input.preferredDate || input.eventDate || new Date().toISOString(),
        message: input.message || input.notes || '',
      }),
    onSuccess: invalidate,
  });

  const { mutateAsync: updateAsync } = updateMutation;
  const { mutateAsync: noteAsync } = noteMutation;
  const { mutateAsync: followUpAsync } = followUpMutation;
  const { mutateAsync: completeFollowUpAsync } = completeFollowUpMutation;
  const { mutateAsync: createAsync } = createMutation;

  const getById = useCallback((id: string) => leads.find((lead) => lead.id === id), [leads]);

  const updateStatus = useCallback(
    async (id: string, status: LeadStatus) => {
      await updateAsync({ id, patch: { status } });
    },
    [updateAsync],
  );

  const updateAssignee = useCallback(
    async (id: string, assignee: string) => {
      await updateAsync({ id, patch: { assignee } });
    },
    [updateAsync],
  );

  const addNote = useCallback(
    async (id: string, body: string, author = 'Studio Lead') => {
      const trimmed = body.trim();
      if (!trimmed) return;
      await noteAsync({ id, body: trimmed, author });
    },
    [noteAsync],
  );

  const scheduleFollowUp = useCallback(
    async (
      id: string,
      payload: {
        scheduledAt: string;
        type?: 'call' | 'whatsapp' | 'email' | 'in_person_consultation';
        notes?: string;
      },
    ) => followUpAsync({ id, payload }),
    [followUpAsync],
  );

  const completeFollowUp = useCallback(
    async (id: string, followUpId: string, payload: { outcome?: string; notes?: string }) =>
      completeFollowUpAsync({ id, followUpId, payload }),
    [completeFollowUpAsync],
  );

  const addLead = useCallback(
    async (leadData: CreateLeadInput) => {
      await createAsync(leadData);
    },
    [createAsync],
  );

  const refresh = useCallback(() => {
    void invalidate();
  }, [invalidate]);

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
    loading: leadsQuery.isPending,
    error: leadsQuery.error ? toAppError(leadsQuery.error) : (null as AppError | null),
    stats,
    getById,
    updateStatus,
    updateLeadStatus: updateStatus,
    updateAssignee,
    addNote,
    scheduleFollowUp,
    completeFollowUp,
    refresh,
    addLead,
  };
}
