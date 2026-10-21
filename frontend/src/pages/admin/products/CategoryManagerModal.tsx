import { useEffect, useState } from 'react';
import { Icon } from '@/components/icons';
import { Button, Checkbox, Input, Modal } from '@/components/ui';
import type { ProductCategory } from '@/services/products/productService';

interface CategoryManagerModalProps {
  open: boolean;
  categories: ProductCategory[];
  saving: boolean;
  onClose: () => void;
  onSave: (
    id: string | null,
    payload: { code: string; name: string; sortOrder: number; active: boolean },
  ) => Promise<void>;
}

const blank = { code: '', name: '', sortOrder: '0', active: true };

export function CategoryManagerModal({
  open,
  categories,
  saving,
  onClose,
  onSave,
}: CategoryManagerModalProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setEditingId(null);
      setForm(blank);
      setError(null);
    }
  }, [open]);

  function edit(category: ProductCategory) {
    setEditingId(category.id);
    setForm({
      code: category.code,
      name: category.name,
      sortOrder: String(category.sortOrder ?? 0),
      active: category.active,
    });
    setError(null);
  }

  function reset() {
    setEditingId(null);
    setForm(blank);
    setError(null);
  }

  async function save() {
    if (!form.code.trim() || !form.name.trim()) {
      setError('A code and a name are required.');
      return;
    }
    setError(null);
    try {
      await onSave(editingId, {
        code: form.code.trim().toUpperCase(),
        name: form.name.trim(),
        sortOrder: Number(form.sortOrder) || 0,
        active: form.active,
      });
      reset();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'The category was not saved.');
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Product categories"
      description="Categories drive catalogue filters and the public collection labels."
      size="lg"
      footer={
        <Button type="button" variant="secondary" size="sm" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div className="space-y-4">
        <div className="max-h-56 divide-y divide-line overflow-auto rounded-lg border border-line">
          {categories.length === 0 ? (
            <p className="p-4 text-sm opacity-65">No categories yet. Create the first one below.</p>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="flex items-center gap-3 px-3 py-2">
                <span className="w-16 font-mono text-[11px] opacity-60">{category.code}</span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{category.name}</span>
                <span className="text-[10px] uppercase tracking-wide opacity-50">
                  {category.active ? 'Active' : 'Hidden'} / {category.sortOrder}
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => edit(category)}
                  aria-label={`Edit ${category.name}`}
                >
                  <Icon name="edit" size={14} />
                </Button>
              </div>
            ))
          )}
        </div>

        <div className="rounded-lg border border-line p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">
              {editingId ? 'Edit category' : 'Add a category'}
            </p>
            {editingId ? (
              <button type="button" className="text-xs font-semibold underline" onClick={reset}>
                New category
              </button>
            ) : null}
          </div>

          <div className="grid gap-3 sm:grid-cols-[8rem_1fr_5rem]">
            <Input
              label="Code"
              value={form.code}
              onChange={(event) => setForm((current) => ({ ...current, code: event.target.value }))}
              placeholder="BRIDAL"
              disabled={saving}
            />
            <Input
              label="Name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Bridal Collection"
              disabled={saving}
            />
            <Input
              label="Order"
              type="number"
              value={form.sortOrder}
              onChange={(event) =>
                setForm((current) => ({ ...current, sortOrder: event.target.value }))
              }
              disabled={saving}
            />
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <Checkbox
              label="Active and visible on the website"
              name="category-active"
              checked={form.active}
              onChange={(event) =>
                setForm((current) => ({ ...current, active: event.target.checked }))
              }
              disabled={saving}
            />
            <Button
              type="button"
              variant="admin"
              size="sm"
              onClick={() => void save()}
              loading={saving}
            >
              {saving ? null : <Icon name="save" size={14} />}
              {editingId ? 'Save category' : 'Add category'}
            </Button>
          </div>
          {error ? (
            <p role="alert" className="mt-2 text-xs text-danger">
              {error}
            </p>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
