export const ADMIN_PAGE_SIZE = 50;

export function parseAdminPage(value: string | string[] | undefined) {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return 1;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function getAdminPagination(totalItems: number, requestedPage: number, pageSize = ADMIN_PAGE_SIZE) {
  const safeTotal = Number.isFinite(totalItems) && totalItems > 0 ? Math.floor(totalItems) : 0;
  const safePageSize = Number.isSafeInteger(pageSize) && pageSize > 0 ? pageSize : ADMIN_PAGE_SIZE;
  const totalPages = Math.max(1, Math.ceil(safeTotal / safePageSize));
  const safeRequestedPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const page = Math.min(safeRequestedPage, totalPages);

  return {
    page,
    pageSize: safePageSize,
    totalItems: safeTotal,
    totalPages,
    skip: (page - 1) * safePageSize,
    hasPrevious: page > 1,
    hasNext: page < totalPages,
  };
}
