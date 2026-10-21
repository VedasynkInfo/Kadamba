/**
 * Cache identity for every server resource.
 *
 * Two rules keep invalidation honest:
 *
 * 1. **Every key starts with its domain.** `invalidateQueries({ queryKey: qk.leads.all })`
 *    therefore clears every lead view — list, detail, and any filtered list — in
 *    one call. Nothing needs to enumerate the shapes it happens to remember.
 * 2. **Filters are part of the key, normalised.** Object literals are hashed
 *    deterministically by TanStack Query, so callers may pass a fresh object
 *    each render. Pass `{}` rather than omitting, so `list()` and `list({})`
 *    share a cache entry.
 */

export type QueryFilters = Record<string, unknown>;

export const qk = {
  /** Session state for the signed-in admin. */
  auth: {
    all: ['auth'] as const,
    me: () => ['auth', 'me'] as const,
    sessions: () => ['auth', 'sessions'] as const,
    mfaStatus: () => ['auth', 'mfa-status'] as const,
  },

  /** Session state for the signed-in customer. */
  portalAuth: {
    all: ['portal-auth'] as const,
    me: () => ['portal-auth', 'me'] as const,
  },

  /**
   * Published content read by the public site. One domain, because a single
   * admin edit can invalidate all four collections plus settings.
   */
  publicContent: {
    all: ['public-content'] as const,
    gallery: (filters: QueryFilters = {}) => ['public-content', 'gallery', filters] as const,
    services: (filters: QueryFilters = {}) => ['public-content', 'services', filters] as const,
    portfolio: (filters: QueryFilters = {}) => ['public-content', 'portfolio', filters] as const,
    blogs: (filters: QueryFilters = {}) => ['public-content', 'blogs', filters] as const,
    settings: () => ['public-content', 'settings'] as const,
    products: () => ['public-content', 'products', 'list'] as const,
    product: (slug: string) => ['public-content', 'products', 'detail', slug] as const,
  },

  /** CMS collections as managed from the admin console. */
  cms: {
    all: ['cms'] as const,
    gallery: () => ['cms', 'gallery'] as const,
    services: () => ['cms', 'services'] as const,
    portfolio: () => ['cms', 'portfolio'] as const,
    blogs: () => ['cms', 'blogs'] as const,
    settings: () => ['cms', 'settings'] as const,
    slugAvailability: (collection: string, slug: string) =>
      ['cms', 'slug-available', collection, slug] as const,
  },

  leads: {
    all: ['leads'] as const,
    list: (filters: QueryFilters = {}) => ['leads', 'list', filters] as const,
    detail: (id: string) => ['leads', 'detail', id] as const,
    stats: () => ['leads', 'stats'] as const,
  },

  customers: {
    all: ['customers'] as const,
    list: (filters: QueryFilters = {}) => ['customers', 'list', filters] as const,
    detail: (id: string) => ['customers', 'detail', id] as const,
    search: (term: string) => ['customers', 'search', term] as const,
  },

  orders: {
    all: ['orders'] as const,
    list: (filters: QueryFilters = {}) => ['orders', 'list', filters] as const,
    detail: (id: string) => ['orders', 'detail', id] as const,
    /** The production board: every open order, by stage. */
    board: (filters: QueryFilters = {}) => ['orders', 'board', filters] as const,
  },

  products: {
    all: ['products'] as const,
    list: (filters: QueryFilters = {}) => ['products', 'list', filters] as const,
    categories: () => ['products', 'categories'] as const,
    templates: () => ['products', 'templates'] as const,
    types: () => ['products', 'types'] as const,
  },

  measurements: {
    all: ['measurements'] as const,
    list: (filters: QueryFilters = {}) => ['measurements', 'list', filters] as const,
    detail: (id: string) => ['measurements', 'detail', id] as const,
    templates: (filters: QueryFilters = {}) => ['measurements', 'templates', filters] as const,
    fields: (templateId: string) => ['measurements', 'fields', templateId] as const,
  },

  staff: {
    all: ['staff'] as const,
    list: (filters: QueryFilters = {}) => ['staff', 'list', filters] as const,
    detail: (id: string) => ['staff', 'detail', id] as const,
  },

  users: {
    all: ['users'] as const,
    list: (filters: QueryFilters = {}) => ['users', 'list', filters] as const,
    permissions: () => ['users', 'permissions'] as const,
  },

  audit: {
    all: ['audit'] as const,
    list: (filters: QueryFilters = {}) => ['audit', 'list', filters] as const,
  },

  finance: {
    all: ['finance'] as const,
    summary: (filters: QueryFilters = {}) => ['finance', 'summary', filters] as const,
    pnl: (filters: QueryFilters = {}) => ['finance', 'pnl', filters] as const,
    expenses: (filters: QueryFilters = {}) => ['finance', 'expenses', filters] as const,
    salaries: (filters: QueryFilters = {}) => ['finance', 'salaries', filters] as const,
    payments: (filters: QueryFilters = {}) => ['finance', 'payments', filters] as const,
    invoices: (filters: QueryFilters = {}) => ['finance', 'invoices', filters] as const,
    invoice: (id: string) => ['finance', 'invoices', 'detail', id] as const,
    staffList: () => ['finance', 'staff'] as const,
  },

  dashboard: {
    all: ['dashboard'] as const,
    summary: (filters: QueryFilters = {}) => ['dashboard', 'summary', filters] as const,
    badges: () => ['dashboard', 'badges'] as const,
  },

  reports: {
    all: ['reports'] as const,
    detail: (type: string, filters: QueryFilters = {}) => ['reports', type, filters] as const,
  },

  media: {
    all: ['media'] as const,
    library: (filters: QueryFilters = {}) => ['media', 'library', filters] as const,
    folders: () => ['media', 'folders'] as const,
    usage: (id: string) => ['media', 'usage', id] as const,
  },

  /** Customer-portal resources (scoped to the signed-in customer). */
  portal: {
    all: ['portal'] as const,
    dashboard: () => ['portal', 'dashboard'] as const,
    orders: (filters: QueryFilters = {}) => ['portal', 'orders', filters] as const,
    order: (id: string) => ['portal', 'orders', 'detail', id] as const,
    measurements: (filters: QueryFilters = {}) => ['portal', 'measurements', filters] as const,
    payments: (filters: QueryFilters = {}) => ['portal', 'payments', filters] as const,
    invoice: (id: string) => ['portal', 'invoice', id] as const,
    requests: () => ['portal', 'requests'] as const,
    chat: (threadId?: string) => ['portal', 'chat', threadId ?? 'default'] as const,
    chatUnread: () => ['portal', 'chat', 'unread'] as const,
  },
} as const;
