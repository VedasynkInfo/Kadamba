import { Icon } from '@/components/icons';
import { Button, Checkbox, Input } from '@/components/ui';
import type { ProductVariant } from '@/services/products/productService';
import { nextVariantId } from './types';

interface VariantsEditorProps {
  variants: ProductVariant[];
  onChange: (variants: ProductVariant[]) => void;
}

/**
 * Optional product variants.
 *
 * These are storefront choices (neckline, sleeve, length), not inventory
 * units. The inventory seam is intentionally left for a later phase.
 */
export function VariantsEditor({ variants, onChange }: VariantsEditorProps) {
  function patch(id: string, updates: Partial<ProductVariant>) {
    onChange(variants.map((variant) => (variant.id === id ? { ...variant, ...updates } : variant)));
  }

  function add() {
    onChange([
      ...variants,
      {
        id: nextVariantId(variants),
        name: '',
        description: '',
        priceRange: '',
        active: true,
      },
    ]);
  }

  return (
    <div className="space-y-4">
      {variants.length === 0 ? (
        <div className="rounded-lg border border-dashed border-line p-8 text-center">
          <Icon name="thread" size={26} className="mx-auto mb-2 opacity-70" />
          <p className="text-sm font-medium">No variants</p>
          <p className="mt-1 text-xs opacity-70">
            Add a choice only when customers genuinely choose between versions of this garment.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div key={variant.id} className="rounded-xl border border-line bg-surface-raised p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
                  Variant {index + 1}
                </p>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => onChange(variants.filter((item) => item.id !== variant.id))}
                  aria-label={`Remove variant ${index + 1}`}
                >
                  <Icon name="delete" size={14} />
                </Button>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="Name"
                  value={variant.name}
                  onChange={(event) => patch(variant.id, { name: event.target.value })}
                  placeholder="Sweetheart neckline"
                  required
                />
                <Input
                  label="Price note"
                  value={variant.priceRange ?? ''}
                  onChange={(event) => patch(variant.id, { priceRange: event.target.value })}
                  placeholder="+ Rs 4,000"
                />
              </div>
              <div className="mt-3">
                <Input
                  label="Description"
                  value={variant.description ?? ''}
                  onChange={(event) => patch(variant.id, { description: event.target.value })}
                  placeholder="What changes in this version?"
                />
              </div>
              <div className="mt-3">
                <Checkbox
                  label="Show this variant on the website"
                  name={`variant-active-${variant.id}`}
                  checked={variant.active}
                  onChange={(event) => patch(variant.id, { active: event.target.checked })}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Button type="button" variant="secondary" size="sm" onClick={add}>
        <Icon name="add" size={14} />
        Add variant
      </Button>
    </div>
  );
}
