/**
 * Shared pagination helpers so every list endpoint (events, lives, news, ...)
 * parses/validates `page` and `limit` query params the same way, instead of
 * each route re-implementing (and sometimes forgetting) min/max clamping.
 */

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parses page/limit from an Express `req.query`-like object, clamping to
 * sane bounds. Invalid/non-numeric input falls back to defaults rather than
 * producing a negative OFFSET or an unbounded LIMIT.
 */
export function parsePagination(
  query: Record<string, unknown>,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {}
): PaginationParams {
  const defaultPage = defaults.page ?? DEFAULT_PAGE;
  const defaultLimit = defaults.limit ?? DEFAULT_LIMIT;
  const maxLimit = defaults.maxLimit ?? MAX_LIMIT;

  const rawPage = Number(query.page);
  const rawLimit = Number(query.limit);

  const page = Number.isFinite(rawPage) && rawPage >= 1 ? Math.floor(rawPage) : defaultPage;
  const limit = Number.isFinite(rawLimit) && rawLimit >= 1
    ? Math.min(maxLimit, Math.floor(rawLimit))
    : defaultLimit;

  return { page, limit, offset: (page - 1) * limit };
}

export function buildPaginationMeta(params: PaginationParams, total: number): PaginationMeta {
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / params.limit)),
  };
}
