import { useMemo } from 'react';
import type {
  MeasurementTemplate,
  MeasurementFieldDef,
} from '@/services/measurements/measurementsService';
import type { ProfileFormData } from './types';

interface MeasurementFormDimensionsTabProps {
  form: ProfileFormData;
  activeTemplate: MeasurementTemplate | null;
  onDimensionChange: (key: string, val: unknown) => void;
}

export function MeasurementFormDimensionsTab({
  form,
  activeTemplate,
  onDimensionChange,
}: MeasurementFormDimensionsTabProps) {
  const groupedFields = useMemo(() => {
    if (!activeTemplate || !activeTemplate.fieldDefs?.length) return {};
    const groups: Record<string, MeasurementFieldDef[]> = {};
    for (const field of activeTemplate.fieldDefs) {
      const groupName = field.group || 'General Specifications';
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(field);
    }
    return groups;
  }, [activeTemplate]);

  function renderFieldInput(def: MeasurementFieldDef) {
    const val = form.values?.[def.key];
    const baseInputClass =
      'w-full rounded-lg border py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-brand transition';
    const inputStyle = {
      backgroundColor: 'rgba(128, 128, 128, 0.05)',
      borderColor: 'var(--admin-border)',
      color: 'inherit',
    };

    switch (def.type) {
      case 'number':
        return (
          <input
            id={def.key}
            type="number"
            step="0.1"
            min={def.min}
            max={def.max}
            value={val === '' || typeof val === 'boolean' ? '' : ((val as number | string) ?? '')}
            onChange={(e) =>
              onDimensionChange(def.key, e.target.value !== '' ? parseFloat(e.target.value) : '')
            }
            placeholder={def.min !== undefined ? `Min ${def.min}` : '0.0'}
            className={baseInputClass}
            style={inputStyle}
          />
        );
      case 'boolean':
        return (
          <label className="flex items-center gap-2 text-xs cursor-pointer py-1">
            <input
              id={def.key}
              type="checkbox"
              checked={val === true}
              onChange={(e) => onDimensionChange(def.key, e.target.checked)}
              className="h-4 w-4 rounded accent-brand cursor-pointer"
            />
            <span>{def.label}</span>
          </label>
        );
      case 'enum':
        return (
          <select
            id={def.key}
            value={typeof val === 'string' ? val : ''}
            onChange={(e) => onDimensionChange(def.key, e.target.value)}
            className={`${baseInputClass} bg-surface-raised border-line`}
          >
            <option value="">— Select Option —</option>
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
            id={def.key}
            type="text"
            value={typeof val === 'string' ? val : ''}
            onChange={(e) => onDimensionChange(def.key, e.target.value)}
            placeholder={`Enter ${def.label}`}
            className={baseInputClass}
            style={inputStyle}
          />
        );
    }
  }

  return (
    <div className="space-y-6">
      <div
        className="flex items-center justify-between border-b pb-3 border-line"
      >
        <div>
          <span className="text-xs font-bold tracking-wide">
            Template: {activeTemplate ? activeTemplate.name : form.productTypeCode}
          </span>
          <span className="text-[10px] opacity-60 block mt-0.5">
            All dimensions recorded in {form.unit}. Maintain uniform tape tightness.
          </span>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-brand/15 text-brand">
          {Object.keys(form.values).length} values logged
        </span>
      </div>

      {Object.keys(groupedFields).length > 0 ? (
        Object.entries(groupedFields).map(([groupName, fields]) => (
          <fieldset
            key={groupName}
            className="rounded-xl border p-4 space-y-3.5 transition border-line bg-surface-sunken"
          >
            <legend className="px-2 font-heading text-xs font-bold uppercase tracking-[0.14em] text-brand">
              {groupName}
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {fields.map((def) => (
                <div key={def.key} className="space-y-1">
                  <label
                    htmlFor={def.key}
                    className="flex items-center justify-between text-[11px] font-medium opacity-80"
                  >
                    <span className="truncate">
                      {def.label} {def.required && <span className="text-amber-400">*</span>}
                    </span>
                    {def.unit && (
                      <span className="text-[9px] uppercase font-mono opacity-50">
                        ({def.unit})
                      </span>
                    )}
                  </label>
                  {renderFieldInput(def)}
                  {def.helpText && (
                    <p className="text-[9px] opacity-50 leading-tight">{def.helpText}</p>
                  )}
                </div>
              ))}
            </div>
          </fieldset>
        ))
      ) : (
        <div
          className="rounded-xl border p-5 text-center space-y-2 border-line bg-surface-sunken"
        >
          <p className="text-xs font-semibold">No custom template fields attached to this silhouette.</p>
          <p className="text-[11px] opacity-60">
            Switch to a defined silhouette (Bridal Lehenga, Blouse, Kurta) or record observations in tailor notes.
          </p>
        </div>
      )}
    </div>
  );
}
