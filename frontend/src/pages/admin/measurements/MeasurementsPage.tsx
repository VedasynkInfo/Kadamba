import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Drawer, Input, Select, Textarea, useToast } from '@/components/ui';
import { AdminHorizonBanner } from '../components/AdminHorizonBanner';
import { adminBanners } from '../data';
import { PageMeta, staticPageMeta } from '@/seo';
import { cn } from '@/utils/cn';
import { MediaUpload } from '../components/MediaUpload';
import { customerApi, type Customer } from '@/services/customers/customerService';
import {
  measurementApi,
  type MeasurementProfile,
  type MeasurementTemplate,
  type MeasurementFieldDef,
} from '@/services/measurements/measurementsService';

const units = [
  { value: 'inches', label: 'Inches' },
  { value: 'cm', label: 'Centimeters' },
];

const statuses = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
  { value: 'pending_approval', label: 'Pending Approval' },
];

type DeskTab = 'all' | 'pending';

function blankProfile(): Partial<MeasurementProfile> {
  return {
    productTypeCode: 'BR-LH',
    profileName: '',
    unit: 'inches',
    status: 'draft',
    values: {},
    notes: '',
    measuredAt: new Date().toISOString().split('T')[0],
    referenceImages: [],
  };
}

function fieldInput(
  def: MeasurementFieldDef,
  value: unknown,
  onChange: (key: string, value: unknown) => void,
) {
  const key = def.key;
  const val = (value as string | number | boolean) ?? '';
  const baseClass = 'w-full rounded-sm border border-black/15 bg-white px-3 py-2 text-sm';

  switch (def.type) {
    case 'number':
      return (
        <input
          id={key}
          type="number"
          step="0.1"
          min={def.min}
          max={def.max}
          value={val === '' || typeof val === 'boolean' ? '' : val}
          onChange={(e) => onChange(key, e.target.value ? parseFloat(e.target.value) : '')}
          className={baseClass}
        />
      );
    case 'boolean': {
      const checked = value === true;
      return (
        <label className="flex items-center gap-2 text-sm">
          <input
            id={key}
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(key, e.target.checked)}
            className="h-4 w-4"
          />
          {def.label}
        </label>
      );
    }
    case 'enum':
      return (
        <select
          id={key}
          value={typeof val === 'string' ? val : ''}
          onChange={(e) => onChange(key, e.target.value)}
          className={baseClass}
        >
          <option value="">— Select —</option>
          {(def.options ?? []).map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );
    default:
      return (
        <input
          id={key}
          type="text"
          value={typeof val === 'string' ? val : ''}
          onChange={(e) => onChange(key, e.target.value)}
          className={baseClass}
        />
      );
  }
}

export default function MeasurementsPage() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [deskTab, setDeskTab] = useState<DeskTab>('all');
  const [profiles, setProfiles] = useState<MeasurementProfile[]>([]);
  const [templates, setTemplates] = useState<MeasurementTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<MeasurementProfile>>(blankProfile());
  const [selectedTemplate, setSelectedTemplate] = useState<MeasurementTemplate | null>(null);
  const [isNew, setIsNew] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  // Searchable customer picker
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [profileNameTouched, setProfileNameTouched] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profilesData, templatesData] = await Promise.all([
        measurementApi.list().catch(() => ({ items: [], pagination: { page: 1, limit: 50, total: 0 } })),
        measurementApi.listTemplates({ active: true }).catch(() => ({
          items: [],
          pagination: { page: 1, limit: 50, total: 0 },
        })),
      ]);
      setProfiles(profilesData.items ?? []);
      setTemplates(templatesData.items ?? []);
    } catch (err) {
      console.warn('Could not load measurement data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    const tpl = templates.find((t) => t.code === form.productTypeCode) ?? null;
    setSelectedTemplate(tpl);
  }, [form.productTypeCode, templates]);

  // Auto profile name from customer + product type (editable)
  useEffect(() => {
    if (!isNew || profileNameTouched) return;
    const productLabel =
      templates.find((t) => t.code === form.productTypeCode)?.name || form.productTypeCode || 'Fit';
    if (selectedCustomer?.name) {
      setForm((f) => ({ ...f, profileName: `${selectedCustomer.name} — ${productLabel}` }));
    }
  }, [selectedCustomer, form.productTypeCode, templates, isNew, profileNameTouched]);

  const productTypes = templates.map((t) => ({ value: t.code, label: t.name }));

  const pendingCount = useMemo(
    () => profiles.filter((p) => p.status === 'pending_approval').length,
    [profiles],
  );

  const filtered = useMemo(() => {
    let list = profiles;
    if (deskTab === 'pending') {
      list = list.filter((p) => p.status === 'pending_approval');
    }
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (p) =>
        p.profileName.toLowerCase().includes(q) ||
        p.productTypeCode.toLowerCase().includes(q) ||
        p.productTypeName?.toLowerCase().includes(q) ||
        p.customerName?.toLowerCase().includes(q) ||
        p.customerId?.toLowerCase().includes(q),
    );
  }, [profiles, query, deskTab]);

  function handleCustomerSearch(val: string) {
    setCustomerSearch(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!val.trim()) {
      setCustomerResults([]);
      return;
    }
    setSearchingCustomers(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const data = await customerApi.list({ q: val, limit: 8 });
        setCustomerResults(data.items);
      } catch (err) {
        console.error('Failed to search customers', err);
      } finally {
        setSearchingCustomers(false);
      }
    }, 280);
  }

  function selectCustomer(cust: Customer) {
    setSelectedCustomer(cust);
    setCustomerSearch(`${cust.name} · ${cust.phone}`);
    setCustomerResults([]);
    setForm((f) => ({ ...f, customerId: cust.id }));
    setProfileNameTouched(false);
  }

  function openCreate() {
    setIsNew(true);
    setForm(blankProfile());
    setSelectedCustomer(null);
    setCustomerSearch('');
    setCustomerResults([]);
    setProfileNameTouched(false);
    setOpen(true);
  }

  function openEdit(item: MeasurementProfile) {
    setIsNew(false);
    setForm(structuredClone(item));
    setSelectedCustomer(
      item.customerId
        ? ({
            id: item.customerId,
            name: item.customerName || item.customerId.slice(-6),
            phone: '',
            createdAt: '',
            updatedAt: '',
          } as Customer)
        : null,
    );
    setCustomerSearch(item.customerName || item.customerId || '');
    setCustomerResults([]);
    setProfileNameTouched(true);
    setOpen(true);
  }

  function handleFieldChange(key: string, value: unknown) {
    setForm((f) => ({
      ...f,
      values: { ...(f.values ?? {}), [key]: value },
    }));
  }

  const groupedFields = useMemo(() => {
    if (!selectedTemplate) return {};
    const groups: Record<string, MeasurementFieldDef[]> = {};
    for (const field of selectedTemplate.fieldDefs) {
      if (!groups[field.group]) groups[field.group] = [];
      groups[field.group].push(field);
    }
    return groups;
  }, [selectedTemplate]);

  async function save() {
    if (!form.profileName?.trim()) {
      toast({ tone: 'error', title: 'Missing fields', description: 'Profile name is required.' });
      return;
    }
    if (!form.customerId?.trim()) {
      toast({
        tone: 'error',
        title: 'Missing fields',
        description: 'Select a customer from the directory.',
      });
      return;
    }

    setSaving(true);
    try {
      if (isNew) {
        await measurementApi.create(form as Record<string, unknown>);
        toast({ tone: 'success', title: 'Measurement profile created' });
      } else {
        await measurementApi.update((form as MeasurementProfile).id, form as Record<string, unknown>);
        toast({ tone: 'success', title: 'Measurement profile updated' });
      }
      setOpen(false);
      void loadData();
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Save failed',
        description: err instanceof Error ? err.message : 'Unknown error',
      });
    } finally {
      setSaving(false);
    }
  }

  async function approveProfile(id: string) {
    setApprovingId(id);
    try {
      const result = await measurementApi.approve(id);
      toast({
        tone: 'success',
        title: 'Measurement approved',
        description: result.profileName
          ? `Saved as “${result.profileName}”`
          : 'Profile is now active',
      });
      void loadData();
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Approve failed',
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setApprovingId(null);
    }
  }

  async function archiveProfile(id: string) {
    try {
      await measurementApi.archive(id, true);
      toast({ tone: 'info', title: 'Profile archived' });
      void loadData();
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Archive failed',
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  async function duplicateProfile(id: string) {
    try {
      await measurementApi.duplicate(id);
      toast({ tone: 'success', title: 'Profile duplicated' });
      void loadData();
    } catch (err) {
      toast({
        tone: 'error',
        title: 'Duplicate failed',
        description: err instanceof Error ? err.message : undefined,
      });
    }
  }

  const statusBadge = (status: string) => {
    const base = 'inline-block rounded-sm px-2 py-0.5 text-[0.65rem]';
    const color =
      status === 'active'
        ? 'bg-green-100 text-green-800'
        : status === 'draft'
          ? 'bg-gray-100 text-gray-800'
          : status === 'archived'
            ? 'bg-red-100 text-red-800'
            : 'bg-yellow-100 text-yellow-800';
    return (
      <span className={cn(base, color)}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  return (
    <>
      <PageMeta {...staticPageMeta.admin} path="/admin/measurements" title="Measurements Admin" />
      <AdminHorizonBanner
        title={adminBanners.dashboard.title}
        copy="Track bridal and traditional measurements from first sitting to fitting."
        actionLabel="Add measurement"
        onAction={openCreate}
      />

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 md:px-10">
        <div className="flex flex-wrap items-end gap-4">
          <Input
            label="Search measurements"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-sm"
          />
          {!loading && (
            <button
              type="button"
              onClick={loadData}
              className="mt-6 shrink-0 rounded-sm border border-black/15 px-3 py-2 text-xs transition hover:bg-black/5"
            >
              Refresh
            </button>
          )}
        </div>

        <div className="mt-6 flex gap-2 border-b border-black/10">
          {(
            [
              { id: 'all' as const, label: 'All profiles' },
              {
                id: 'pending' as const,
                label: `Pending approval${pendingCount ? ` (${pendingCount})` : ''}`,
              },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setDeskTab(tab.id)}
              className={cn(
                'border-b-2 px-4 py-2.5 text-xs uppercase tracking-[0.16em] transition',
                deskTab === tab.id
                  ? 'border-gold text-black'
                  : 'border-transparent text-black/45 hover:text-black/70',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {deskTab === 'pending' ? (
          <p className="mt-4 text-sm text-black/55">
            Customer-submitted fits waiting for boutique approval. Approving saves the profile under
            the customer&apos;s name.
          </p>
        ) : null}

        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-black/15 text-[0.65rem] uppercase tracking-[0.18em] text-black/45">
                <th className="py-3 pr-4 font-medium">Customer</th>
                <th className="py-3 pr-4 font-medium">Product</th>
                <th className="py-3 pr-4 font-medium">Profile</th>
                <th className="py-3 pr-4 font-medium">Updated</th>
                <th className="py-3 pr-4 font-medium">Status</th>
                <th className="py-3 pr-4 font-medium">Version</th>
                <th className="py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-black/40">
                    Loading measurements...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-black/40">
                    {deskTab === 'pending'
                      ? 'No pending customer submissions.'
                      : profiles.length === 0
                        ? 'No measurements yet — add the first profile.'
                        : 'No results matching your search.'}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="border-b border-black/8 hover:bg-cream/30">
                    <td className="py-3 pr-4">
                      <p className="font-heading text-sm">
                        {item.customerName || item.customerId?.slice(-6) || '—'}
                      </p>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="inline-block rounded-sm bg-gold/10 px-2 py-0.5 text-xs text-gold">
                        {productTypes.find((p) => p.value === item.productTypeCode)?.label ??
                          item.productTypeCode}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <p className="font-heading text-sm">{item.profileName}</p>
                    </td>
                    <td className="py-3 pr-4 text-xs text-black/50">
                      {new Date(item.updatedAt ?? item.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 pr-4">{statusBadge(item.status)}</td>
                    <td className="py-3 pr-4 text-sm font-medium">v{item.currentVersion}</td>
                    <td className="py-3">
                      <div className="flex flex-wrap gap-2">
                        {item.status === 'pending_approval' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            loading={approvingId === item.id}
                            onClick={() => approveProfile(item.id)}
                          >
                            Approve
                          </Button>
                        ) : null}
                        <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => duplicateProfile(item.id)}>
                          Copy
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => archiveProfile(item.id)}>
                          Archive
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title={isNew ? 'Add measurement profile' : 'Edit measurement profile'}
        className="!max-w-2xl !bg-cream !text-black [&_h2]:!text-black"
      >
        <div className="max-h-[70vh] space-y-5 overflow-y-auto px-1">
          <div className="relative">
            <Input
              label="Customer"
              required
              placeholder="Search by name, phone, or email…"
              value={customerSearch}
              onChange={(e) => {
                handleCustomerSearch(e.target.value);
                if (selectedCustomer) setSelectedCustomer(null);
                setForm((f) => ({ ...f, customerId: undefined }));
              }}
              hint={
                searchingCustomers
                  ? 'Searching directory…'
                  : selectedCustomer
                    ? `Selected · ${selectedCustomer.name}`
                    : 'Pick from customers — do not type a raw ID'
              }
            />
            {customerResults.length > 0 ? (
              <ul className="absolute z-20 mt-1 max-h-48 w-full overflow-auto border border-black/15 bg-white shadow-md">
                {customerResults.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      className="w-full px-3 py-2.5 text-left text-sm hover:bg-cream/60"
                      onClick={() => selectCustomer(c)}
                    >
                      <span className="font-heading">{c.name}</span>
                      <span className="mt-0.5 block text-xs text-black/50">
                        {c.phone}
                        {c.email ? ` · ${c.email}` : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <Input
            label="Profile name"
            required
            value={form.profileName ?? ''}
            onChange={(e) => {
              setProfileNameTouched(true);
              setForm((f) => ({ ...f, profileName: e.target.value }));
            }}
            hint="Auto-filled from customer + product — edit anytime"
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Product type"
              required
              value={form.productTypeCode ?? ''}
              onChange={(e) => {
                setProfileNameTouched(false);
                setForm((f) => ({ ...f, productTypeCode: e.target.value }));
              }}
              options={
                productTypes.length > 0
                  ? productTypes
                  : [{ value: 'BR-LH', label: 'Bridal Lehenga (fallback)' }]
              }
            />
            <Select
              label="Unit"
              required
              value={form.unit ?? 'inches'}
              onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              options={units}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Status"
              required
              value={form.status ?? 'draft'}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  status: e.target.value as MeasurementProfile['status'],
                }))
              }
              options={statuses}
            />
            <Input
              label="Measured at"
              type="date"
              value={typeof form.measuredAt === 'string' ? form.measuredAt : ''}
              onChange={(e) => setForm((f) => ({ ...f, measuredAt: e.target.value }))}
            />
          </div>

          <Textarea
            label="Notes"
            rows={3}
            value={form.notes ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          />

          <div>
            <p className="mb-2 text-sm font-medium text-black">Reference images</p>
            <div className="flex flex-wrap gap-2">
              {(form.referenceImages ?? []).map((url, i) => (
                <div
                  key={i}
                  className="relative h-20 w-20 overflow-hidden rounded-sm border border-black/15"
                >
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    className="absolute right-0 top-0 bg-black/60 p-0.5 text-[0.5rem] text-white"
                    onClick={() =>
                      setForm((f) => ({
                        ...f,
                        referenceImages: (f.referenceImages ?? []).filter((_, idx) => idx !== i),
                      }))
                    }
                  >
                    ×
                  </button>
                </div>
              ))}
              <MediaUpload
                label=""
                folder="measurements"
                value=""
                onChange={(url) =>
                  setForm((f) => ({
                    ...f,
                    referenceImages: [...(f.referenceImages ?? []), url],
                  }))
                }
                hint="Upload sketches or reference photos"
              />
            </div>
          </div>

          {selectedTemplate && Object.keys(groupedFields).length > 0 ? (
            <div className="space-y-6">
              <p className="font-heading text-sm text-black/60">
                Measurement fields for <span className="text-gold">{selectedTemplate.name}</span>
              </p>
              {Object.entries(groupedFields).map(([groupName, fields]) => (
                <fieldset key={groupName} className="rounded-lg border border-black/10 p-4">
                  <legend className="font-heading text-xs uppercase tracking-[0.15em] text-black/50">
                    {groupName}
                  </legend>
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    {fields.map((def) => {
                      const val = form.values?.[def.key] ?? '';
                      return (
                        <div key={def.key}>
                          <label htmlFor={def.key} className="mb-1 block text-xs text-black/60">
                            {def.label}
                            {def.required && <span className="ml-0.5 text-gold">*</span>}
                            {def.unit && (
                              <span className="ml-1 text-[0.6rem] uppercase text-black/40">
                                ({def.unit})
                              </span>
                            )}
                          </label>
                          {fieldInput(def, val, handleFieldChange)}
                          {def.helpText && (
                            <p className="mt-0.5 text-[0.6rem] text-black/40">{def.helpText}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </fieldset>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-black/10 bg-cream/30 p-4">
              <p className="text-sm italic text-black/50">
                Select a product type to load its measurement fields
              </p>
            </div>
          )}

          <Button variant="primary" className="w-full" onClick={save} loading={saving}>
            Save profile
          </Button>
        </div>
      </Drawer>
    </>
  );
}
