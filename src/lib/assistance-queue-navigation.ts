import { AssistanceStatus } from "@prisma/client";

type Filters = Record<string, string | string[] | undefined>;
const keys = ["status", "view", "page", "sort", "assignment"] as const;
const detailKey = (key: typeof keys[number]) => `queue${key[0]!.toUpperCase()}${key.slice(1)}`;

/** Navigation state only: never accept a caller-supplied return URL or staff ID. */
function queueQuery(raw: Filters) {
  const query = new URLSearchParams();
  const { status, view, page, sort, assignment } = raw;
  if (typeof status === "string" && Object.values(AssistanceStatus).includes(status as AssistanceStatus)) query.set("status", status);
  if (view === "tests") query.set("view", view);
  if (typeof page === "string" && /^[1-9][0-9]{0,4}$/.test(page)) query.set("page", page);
  if (sort === "oldest") query.set("sort", sort);
  if (assignment === "mine" || assignment === "unassigned") query.set("assignment", assignment);
  return query;
}

function withQuery(path: string, query: URLSearchParams) {
  return query.size ? `${path}?${query.toString()}` : path;
}

export function assistanceQueueHref(raw: Filters) {
  return withQuery("/admin", queueQuery(raw));
}

export function assistanceCaseHref(id: string, raw: Filters) {
  const query = new URLSearchParams();
  const accepted = queueQuery(raw);
  for (const key of keys) {
    const value = accepted.get(key);
    if (value !== null) query.set(detailKey(key), value);
  }
  return withQuery(`/admin/requests/${encodeURIComponent(id)}`, query);
}

export function assistanceReturnFilters(raw: Filters): Filters {
  // Prefixed query keys cannot collide with action success/error notices.
  const candidate = Object.fromEntries(keys.map(key => [key, raw[detailKey(key)]]));
  return Object.fromEntries(queueQuery(candidate));
}
