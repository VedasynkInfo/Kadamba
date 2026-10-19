export const CUSTOMER_SOURCES = [
  { value: 'walk-in', label: '🚶 Walk-In Atelier' },
  { value: 'referral', label: '🤝 Client Referral' },
  { value: 'instagram', label: '📸 Instagram' },
  { value: 'portal', label: '🌐 Customer Portal' },
  { value: 'phone', label: '📞 Phone Consultation' },
];

export interface CustomerFormData {
  name: string;
  phone: string;
  email: string;
  whatsapp: string;
  source: string;
  tagsInput: string;
  notes: string;
  line1: string;
  line2: string;
  landmark: string;
  locality: string;
  city: string;
  state: string;
  pincode: string;
}

export const createEmptyCustomerForm = (): CustomerFormData => ({
  name: '',
  phone: '',
  email: '',
  whatsapp: '',
  source: 'walk-in',
  tagsInput: '',
  notes: '',
  line1: '',
  line2: '',
  landmark: '',
  locality: '',
  city: 'Kurnool',
  state: 'Andhra Pradesh',
  pincode: '',
});

export interface CustomersMetricsData {
  total: number;
  portalActive: number;
  hasOpenOrders: number;
  repeatClients: number;
}
