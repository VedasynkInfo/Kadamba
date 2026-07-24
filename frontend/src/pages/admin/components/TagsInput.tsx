import { useEffect, useState } from 'react';

export interface TagsInputProps {
  labels: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  label?: string;
}

/**
 * Chip tags input — controlled via `labels`.
 */
export function TagsInput({
  labels = [],
  onChange,
  placeholder = 'Add tag and press Enter',
  label,
}: TagsInputProps) {
  const [input, setInput] = useState('');
  const [tags, setTags] = useState<string[]>(labels);

  useEffect(() => {
    setTags(labels);
  }, [labels]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && input.trim()) {
      e.preventDefault();
      const newTag = input.trim();
      if (!tags.includes(newTag)) {
        const next = [...tags, newTag];
        setTags(next);
        onChange(next);
      }
      setInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const next = tags.filter((t) => t !== tagToRemove);
    setTags(next);
    onChange(next);
  };

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label ? <span className="text-sm font-medium text-black">{label}</span> : null}
      <div className="flex w-full flex-wrap items-start gap-2 rounded-md border border-black/15 bg-cream p-2.5">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center rounded-sm bg-gold/20 px-2 py-1 text-xs font-medium text-black"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1.5 text-black/40 hover:text-black"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="min-w-0 flex-1 bg-transparent text-sm text-black outline-none placeholder:text-black/40"
        />
      </div>
    </div>
  );
}
