export const parsePagination = (query, { defaultLimit = 20, maxLimit = 100 } = {}) => {
  const page = Math.max(1, Number.parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, Number.parseInt(query.limit, 10) || defaultLimit));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

export const buildPagination = (total, page, limit) => {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

/** Safe sort parser — only allows whitelisted columns. */
export const parseSort = (query, allowed, fallback) => {
  const sortBy = allowed.includes(query.sortBy) ? query.sortBy : fallback.column;
  const sortDir = String(query.sortDir || fallback.dir).toLowerCase() === "asc" ? "ASC" : "DESC";
  return { sortBy, sortDir };
};
