import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Lets the command palette ask a desk to open its create form.
 *
 * The palette navigates to `/admin/orders?new=1`; the desk sees the intent,
 * opens the form it already owns, and drops the parameter again so a refresh
 * does not reopen it. The alternative — a shell-level "open the order modal"
 * event bus — would give the shell a handle on every desk's internals.
 */
export function useCreateIntent(setOpen: (open: boolean) => void) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('new') !== '1') return;
    setOpen(true);
    const next = new URLSearchParams(searchParams);
    next.delete('new');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, setOpen]);
}
