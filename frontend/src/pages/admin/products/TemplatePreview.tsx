import { Icon } from '@/components/icons';
import type { MeasurementTemplate } from '@/services/measurements/measurementsService';
import { cn } from '@/utils/cn';

interface TemplatePreviewProps {
  template?: MeasurementTemplate | null;
  className?: string;
}

/**
 * Live fit-card preview.
 *
 * Shows exactly what the linked measurement template will ask for, without
 * leaving the product editor. That is the difference between a real reference
 * and a code the desk has to remember.
 */
export function TemplatePreview({ template, className }: TemplatePreviewProps) {
  if (!template) {
    return (
      <div
        className={cn(
          'rounded-lg border border-dashed border-line p-4 text-sm opacity-70',
          className,
        )}
      >
        <div className="flex items-center gap-2 font-medium">
          <Icon name="measurements" size={16} />
          No measurement template linked
        </div>
        <p className="mt-1 text-xs">
          Orders for this garment will not offer a guided fit card until one is selected.
        </p>
      </div>
    );
  }

  const fields = [...(template.fieldDefs ?? [])].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
  );
  const groups = new Map<string, typeof fields>();
  for (const field of fields) {
    const group = field.group || 'Other';
    groups.set(group, [...(groups.get(group) ?? []), field]);
  }
  const shown = fields.slice(0, 8);

  return (
    <div className={cn('rounded-lg border border-line bg-surface-sunken/50 p-4', className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] opacity-70">
            Fit card preview
          </p>
          <p className="mt-1 text-sm font-semibold">
            {template.name}{' '}
            <span className="font-mono text-xs font-normal opacity-70">{template.code}</span>
          </p>
        </div>
        <span className="rounded-full border border-line px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
          v{template.version} / {template.category}
        </span>
      </div>

      {fields.length === 0 ? (
        <p className="mt-3 text-xs opacity-70">This template has no fields yet.</p>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {shown.map((field) => (
              <span
                key={field.key}
                className="inline-flex items-center gap-1 rounded-full border border-line bg-surface-raised px-2 py-0.5 text-[11px]"
              >
                {field.label}
                {field.unit ? <span className="opacity-55">({field.unit})</span> : null}
                {field.required ? <span className="text-danger">*</span> : null}
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs opacity-65">
            {fields.length} field{fields.length === 1 ? '' : 's'} across {groups.size} group
            {groups.size === 1 ? '' : 's'}
            {fields.length > shown.length ? `, showing the first ${shown.length}` : ''}.
          </p>
        </>
      )}
    </div>
  );
}
