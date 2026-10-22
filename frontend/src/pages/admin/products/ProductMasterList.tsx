import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Icon } from '@/components/icons';
import { OptimizedImage } from '@/components/media/OptimizedImage';
import { Button, Select } from '@/components/ui';
import type { ProductCategory, ProductType } from '@/services/products/productService';
import { cn } from '@/utils/cn';
import { coverImage } from './types';

interface ProductMasterListProps {
  products: ProductType[];
  categories: ProductCategory[];
  selectedId: string | null;
  selectedKeys: string[];
  canReorder: boolean;
  onSelect: (id: string) => void;
  onSelectionChange: (keys: string[]) => void;
  onReorder: (orderedIds: string[]) => void;
  onBulk: (updates: { active?: boolean; featured?: boolean; categoryId?: string }) => void;
}

function SortableProductRow({
  product,
  selected,
  checked,
  canReorder,
  onSelect,
  onToggle,
}: {
  product: ProductType;
  selected: boolean;
  checked: boolean;
  canReorder: boolean;
  onSelect: () => void;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
    disabled: !canReorder,
  });
  const image = coverImage(product);
  const template = product.measurementTemplate;

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group flex items-center gap-2 border-b border-line/70 px-2 py-2 last:border-b-0',
        selected ? 'bg-brand/10' : 'hover:bg-current/[0.035]',
        isDragging && 'relative z-10 rounded-lg bg-surface-raised shadow-soft',
      )}
    >
      <button
        type="button"
        className={cn(
          'shrink-0 rounded p-1.5 text-ink/70 transition-colors',
          canReorder
            ? 'cursor-grab hover:bg-current/[0.06] hover:text-ink'
            : 'cursor-not-allowed opacity-25',
        )}
        aria-label={`Reorder ${product.name}`}
        title={canReorder ? 'Drag to reorder' : 'Clear search and filters to reorder'}
        disabled={!canReorder}
        {...attributes}
        {...listeners}
      >
        <Icon name="sortable" size={15} />
      </button>

      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        aria-label={`Select ${product.name}`}
        className="size-4 shrink-0 cursor-pointer appearance-none rounded border border-line-strong bg-surface-field checked:border-gold checked:bg-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      />

      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? 'true' : undefined}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-md px-1 py-0.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
      >
        <span className="relative flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-surface-sunken">
          {image ? (
            <OptimizedImage
              src={image}
              alt=""
              className="h-full w-full object-cover"
              sizes="44px"
            />
          ) : (
            <Icon name="garment" size={18} className="opacity-40" />
          )}
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5">
            <span className="truncate text-sm font-semibold">{product.name}</span>
            {product.featured ? (
              <Icon
                name="featured"
                size={12}
                className="shrink-0 text-gold"
                aria-label="Featured"
              />
            ) : null}
            {!product.active ? (
              <span className="shrink-0 rounded-full border border-line px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide opacity-65">
                Draft
              </span>
            ) : null}
          </span>
          <span className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] opacity-65">
            <span className="font-mono">{product.code}</span>
            <span aria-hidden>.</span>
            <span>{product.categoryId?.name ?? 'Uncategorised'}</span>
            {template ? (
              <>
                <span aria-hidden>.</span>
                <span>Fit {template.code}</span>
              </>
            ) : null}
          </span>
        </span>
      </button>
    </li>
  );
}

/**
 * The catalogue's left-hand master list.
 *
 * Reordering is deliberately switched off while a search or filter is active:
 * dragging a filtered subset must not silently reshuffle unseen products.
 */
export function ProductMasterList({
  products,
  categories,
  selectedId,
  selectedKeys,
  canReorder,
  onSelect,
  onSelectionChange,
  onReorder,
  onBulk,
}: ProductMasterListProps) {
  const selected = new Set(selectedKeys);
  const allSelected = products.length > 0 && products.every((product) => selected.has(product.id));
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function toggleAll() {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(products.map((product) => product.id));
    }
  }

  function toggle(id: string) {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange([...next]);
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = products.findIndex((product) => product.id === active.id);
    const newIndex = products.findIndex((product) => product.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const next = [...products];
    const [item] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, item);
    onReorder(next.map((product) => product.id));
  }

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface-raised text-ink">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-3 py-2">
        <label className="inline-flex items-center gap-2 text-xs font-medium">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            aria-label="Select all visible products"
            className="size-4 cursor-pointer appearance-none rounded border border-line-strong bg-surface-field checked:border-gold checked:bg-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          />
          {products.length} product{products.length === 1 ? '' : 's'}
        </label>
        <span className="ml-auto text-[10px] uppercase tracking-wide opacity-55">
          {canReorder ? 'Drag to reorder' : 'Filtered order'}
        </span>
      </div>

      {selectedKeys.length > 0 ? (
        <div
          role="region"
          aria-label="Bulk product actions"
          className="flex flex-wrap items-center gap-1.5 border-b border-line bg-brand/10 px-3 py-2"
        >
          <span className="mr-auto text-xs font-semibold" aria-live="polite">
            {selectedKeys.length} selected
          </span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => onBulk({ active: true })}
          >
            Activate
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => onBulk({ active: false })}
          >
            Draft
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => onBulk({ featured: true })}
          >
            Feature
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => onBulk({ featured: false })}
          >
            Unfeature
          </Button>
          <Select
            aria-label="Move selected products to category"
            value=""
            onChange={(value) => {
              if (value) onBulk({ categoryId: value });
            }}
            options={categories.map((category) => ({
              value: category.id,
              label: category.name,
            }))}
            placeholder="Move to category..."
            className="w-44 py-1 text-xs"
          />
          <Button type="button" size="sm" variant="ghost" onClick={() => onSelectionChange([])}>
            Clear
          </Button>
        </div>
      ) : null}

      {products.length === 0 ? (
        <div className="p-10 text-center">
          <Icon name="products" size={26} className="mx-auto mb-2 opacity-70" />
          <p className="text-sm font-medium">No products match this view</p>
          <p className="mt-1 text-xs opacity-65">
            Try another category or clear the search. A new catalogue can be seeded from the empty
            state.
          </p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext
            items={products.map((product) => product.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="max-h-[62vh] overflow-auto">
              {products.map((product) => (
                <SortableProductRow
                  key={product.id}
                  product={product}
                  selected={selectedId === product.id}
                  checked={selected.has(product.id)}
                  canReorder={canReorder}
                  onSelect={() => onSelect(product.id)}
                  onToggle={() => toggle(product.id)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}
