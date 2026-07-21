export interface PaginationInput {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * Parse page/limit from query (defaults 1/20, max 100).
 */
export function parsePagination(query: {
  page?: unknown;
  limit?: unknown;
}): PaginationInput {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    pages: Math.max(1, Math.ceil(total / limit) || 1),
  };
}
