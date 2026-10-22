import { Link } from 'react-router-dom';
import { PageMeta } from '@/seo';

/**
 * Branded 404 — replaces the silent redirect so deep-link typos are clear
 * and search engines see a real not-found (noindex) response.
 */
export default function NotFoundPage() {
  return (
    <>
      <PageMeta
        title="Page not found"
        description="The page you are looking for could not be found."
        path="/404"
        robots="noindex, nofollow"
      />
      <section className="flex min-h-[70vh] flex-col items-center justify-center gap-5 px-6 text-center">
        <p className="font-heading text-6xl text-gold sm:text-7xl">404</p>
        <h1 className="font-heading text-3xl text-ink sm:text-4xl">Page not found</h1>
        <p className="max-w-md text-ink/70">
          The page you are looking for may have moved. Explore our collections or return home.
        </p>
        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link
            to="/"
            className="rounded-md bg-espresso px-6 py-2.5 text-sm font-medium text-ink-inverse transition-colors hover:bg-espresso/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            Back to home
          </Link>
          <Link
            to="/gallery"
            className="rounded-md border border-line-strong px-6 py-2.5 text-sm font-medium text-ink transition-colors hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            View gallery
          </Link>
        </div>
      </section>
    </>
  );
}
