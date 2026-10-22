import { useEffect } from 'react';
import { isRouteErrorResponse, Link, useRouteError, useRevalidator } from 'react-router-dom';
import { PageMeta } from '@/seo';

/**
 * What the router renders when a route — or its loader — throws.
 *
 * This replaces nothing that existed before: a `createBrowserRouter` route has
 * no component-level equivalent, and without it React Router would show its bare
 * developer error screen in production. Two things matter here:
 *
 * 1. **It keeps the shell.** Placed on a layout route, an error inside a page
 *    renders *inside* that layout, so the navbar and footer survive and the
 *    visitor keeps a way out. The root-level copy is the fallback of last
 *    resort.
 * 2. **It says something true.** A 404, a 5xx and a thrown render error are
 *    different situations; flattening them into "Something went wrong" teaches
 *    the visitor nothing and gives support nothing to work with.
 *
 * Colours are the raw neutrals the rest of the public shell uses; Phase 6
 * replaces them with semantic surface tokens.
 */
export function RouteErrorPage() {
  const error = useRouteError();
  const revalidator = useRevalidator();
  const { status, headline, message } = describe(error);
  const missing = status === 404;

  useEffect(() => {
    if (import.meta.env.DEV) console.error('Route error:', error);
  }, [error]);

  return (
    <>
      <PageMeta
        title={headline}
        description={message}
        path="/error"
        robots="noindex, nofollow"
      />
      <section className="flex min-h-[70vh] flex-col items-center justify-center gap-5 bg-surface px-6 text-center">
        {status === undefined ? (
          <p className="font-heading text-xs uppercase tracking-[0.32em] text-gold">
            Kadamba&apos;s Designer Studio
          </p>
        ) : (
          <p className="font-heading text-6xl text-gold sm:text-7xl">{status}</p>
        )}
        <h1 className="font-heading text-3xl text-ink sm:text-4xl">{headline}</h1>
        <p className="max-w-md text-ink/70">{message}</p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          {!missing && (
            <button
              type="button"
              onClick={() => revalidator.revalidate()}
              className="on-dark rounded-md bg-espresso px-6 py-2.5 text-sm font-medium text-ink-inverse transition-colors hover:bg-espresso/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              Try again
            </button>
          )}
          <Link
            to="/"
            className={
              missing
                ? 'on-dark rounded-md bg-espresso px-6 py-2.5 text-sm font-medium text-ink-inverse transition-colors hover:bg-espresso/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus'
                : 'rounded-md border border-line-strong px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus'
            }
          >
            Back to home
          </Link>
          {missing && (
            <Link
              to="/gallery"
              className="rounded-md border border-line-strong px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
            >
              View gallery
            </Link>
          )}
        </div>

        {import.meta.env.DEV && <ErrorDetail error={error} />}
      </section>
    </>
  );
}

interface Description {
  status?: number;
  headline: string;
  message: string;
}

/** Turn whatever was thrown into a status, a headline and a sentence of help. */
function describe(error: unknown): Description {
  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return {
        status: 404,
        headline: 'Page not found',
        message: 'The page you are looking for may have moved. Explore our collections or return home.',
      };
    }
    if (error.status >= 500) {
      return {
        status: error.status,
        headline: 'This page is temporarily unavailable',
        message: 'Something went wrong at our end while loading this page. Trying again often clears it.',
      };
    }
    return {
      status: error.status,
      headline: 'This page could not be displayed',
      message: 'We could not open this page from the link you followed.',
    };
  }

  return {
    headline: 'Something went wrong',
    message: 'An unexpected error interrupted the page. Trying again often clears it.',
  };
}

/** Development-only: the raw error, so a failing route is diagnosable locally. */
function ErrorDetail({ error }: { error: unknown }) {
  const text =
    error instanceof Error
      ? `${error.name}: ${error.message}${error.stack ? `\n\n${error.stack}` : ''}`
      : JSON.stringify(error, null, 2);

  return (
    <pre className="mt-6 max-h-64 w-full max-w-2xl overflow-auto rounded-md bg-surface-sunken p-4 text-left text-xs text-ink/70">
      {text}
    </pre>
  );
}
