import { createContext, useContext, type ReactNode } from 'react';
import { useLeadsStore } from './hooks/useLeadsStore';

type LeadsStore = ReturnType<typeof useLeadsStore>;

const LeadsContext = createContext<LeadsStore | null>(null);

export function LeadsProvider({ children }: { children: ReactNode }) {
  const store = useLeadsStore();
  return <LeadsContext.Provider value={store}>{children}</LeadsContext.Provider>;
}

export function useLeads(): LeadsStore {
  const ctx = useContext(LeadsContext);
  if (!ctx) {
    throw new Error('useLeads must be used within LeadsProvider');
  }
  return ctx;
}
