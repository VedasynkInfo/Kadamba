import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon, type GlyphName } from '@/components/icons';
import { cn } from '@/utils/cn';

export interface RowAction<T> {
  /** Stable identity, used as the React key. */
  id: string;
  label: string;
  /** The icon that labels the action. */
  icon?: GlyphName;
  /**
   * An icon that depends on the row — the publish action shows a rocket for a
   * draft and an archive for a live item.
   */
  iconFor?: (row: T) => GlyphName;
  onSelect: (row: T) => void;
  /** `danger` is for the one action that destroys something. */
  tone?: 'default' | 'danger';
  /** Draw a rule above this action. */
  divider?: boolean;
  /**
   * Leave the action out for rows where it does not apply.
   *
   * A reminder action on an invoice that is fully paid is not a disabled
   * action; it is an action that has no meaning for that row.
   */
  hidden?: (row: T) => boolean;
}

export interface RowActionsMenuProps<T> {
  /** The actions, in the order they should read. */
  actions: RowAction<T>[];
  /**
   * The accessible name of the trigger.
   *
   * It must say *which* row it belongs to: "Actions for Bridal lehenga".
   * A table of forty rows with forty triggers called "Actions" is unusable
   * with a screen reader, and the icon carries no name of its own.
   */
  label: string;
  /** The row the actions apply to. */
  row: T;
  className?: string;
}

interface Anchor {
  top: number;
  right: number;
  /** Open upwards when there is not enough room below. */
  showAbove: boolean;
}

/**
 * The row menu.
 *
 * Every desk in the console has the same shape: a list of things, and a row
 * that can be viewed, edited, published, copied or deleted. That menu was
 * written out by hand in eleven tables, and each copy drifted — different
 * labels, different icons, a different divider, and a raw `⋮` glyph for the
 * trigger that no icon system could restyle.
 *
 * This is the one version. It is anchored to the viewport rather than to the
 * table, because a table scrolls horizontally and a menu inside one is
 * clipped by it; and it is a menu in the accessibility sense — a labelled
 * button that opens a list of actions, dismissible with Escape, with the
 * arrow keys moving between them.
 */
export function RowActionsMenu<T>({ actions, label, row, className }: RowActionsMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // An action that does not apply to this row is not drawn, and does not
  // count towards the height used to decide whether the menu opens upwards.
  const visibleActions = actions.filter((action) => !action.hidden?.(row));

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) triggerRef.current?.focus();
  }, []);

  const place = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const menuHeight = 44 * visibleActions.length + 12;
    const spaceBelow = window.innerHeight - rect.bottom;
    setAnchor({
      top: rect.bottom + 6,
      right: Math.max(12, window.innerWidth - rect.right),
      showAbove: spaceBelow < menuHeight && rect.top > spaceBelow,
    });
  }, [visibleActions.length]);

  useLayoutEffect(() => {
    if (open) place();
  }, [open, place]);

  // A resize or a scroll moves the trigger, so the menu has to move with it.
  useEffect(() => {
    if (!open) return;
    const onReflow = () => place();
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    return () => {
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
  }, [open, place]);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      close(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [close, open]);

  function focusItem(index: number) {
    const count = visibleActions.length;
    if (count === 0) return;
    const next = (index + count) % count;
    itemRefs.current[next]?.focus();
  }

  function onMenuKeyDown(event: React.KeyboardEvent) {
    const current = itemRefs.current.findIndex((node) => node === document.activeElement);
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusItem(current + 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusItem(current - 1);
    } else if (event.key === 'Home') {
      event.preventDefault();
      focusItem(0);
    } else if (event.key === 'End') {
      event.preventDefault();
      focusItem(visibleActions.length - 1);
    }
  }

  if (visibleActions.length === 0) return null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => (open ? close() : setOpen(true))}
        className={cn(
          'inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line transition',
          'hover:bg-current/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus',
          open && 'border-brand bg-brand/15 text-brand-strong',
          className,
        )}
      >
        <Icon name="moreVertical" size={15} />
      </button>

      {open && anchor ? (
        <>
          <div className="fixed inset-0 z-40 bg-transparent" onClick={() => close(false)} />

          <div
            ref={menuRef}
            role="menu"
            aria-label={label}
            onKeyDown={onMenuKeyDown}
            className="fixed z-50 w-52 animate-fade-in rounded-xl border border-line bg-surface-raised p-1 text-left text-xs text-ink-raised shadow-2xl"
            style={{
              top: anchor.showAbove ? undefined : `${anchor.top}px`,
              bottom: anchor.showAbove ? `${window.innerHeight - anchor.top}px` : undefined,
              right: `${anchor.right}px`,
            }}
          >
            {visibleActions.map((action, index) => {
              const icon = action.iconFor ? action.iconFor(row) : action.icon;
              return (
                <div key={action.id}>
                  {action.divider ? <div className="my-1 border-t border-line" aria-hidden /> : null}
                  <button
                    ref={(node) => {
                      itemRefs.current[index] = node;
                    }}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setOpen(false);
                      action.onSelect(row);
                    }}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 font-medium transition hover:bg-current/[0.06]',
                      action.tone === 'danger'
                        ? 'text-rose-600 hover:bg-rose-500/10'
                        : 'text-inherit',
                    )}
                  >
                    {icon ? <Icon name={icon} size={14} /> : null}
                    <span>{action.label}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : null}
    </>
  );
}
