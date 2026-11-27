import { AppealCategory, AssistanceStatus } from "@prisma/client";

type Filters = Record<string, string | string[] | undefined>;
const keys = ["status", "view", "page", "sort", "assignment", "category"] as const;
const detailKey = (key: typeof keys[number]) => `queue${key[0]!.toUpperCase()}${key.slice(1)}`;

export function assistanceQueueCategory(raw: unknown): AppealCategory | undefined {
  return typeof raw === "string" && Object.values(AppealCategory).includes(raw as AppealCategory) ? raw as AppealCategory : undefined;
}

/** Navigation state only: never accept a caller-supplied return URL or staff ID. */
function queueQuery(raw: Filters) {
  const query = new URLSearchParams();
  const { status, view, page, sort, assignment } = raw;
  const category = assistanceQueueCategory(raw.category);
  if (typeof status === "string" && Object.values(AssistanceStatus).includes(status as AssistanceStatus)) query.set("status", status);
  if (view === "tests") query.set("view", view);
  if (typeof page === "string" && /^[1-9][0-9]{0,4}$/.test(page)) query.set("page", page);
  if (sort === "oldest") query.set("sort", sort);
  if (assignment === "mine" || assignment === "unassigned") query.set("assignment", assignment);
  if (category) query.set("category", category);
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

/** Only validated queue fields belong in case action forms. */
export function assistanceQueueContext(raw: Filters): Record<string, string> {
  const accepted = queueQuery(raw);
  const fields: Record<string, string> = {};
  for (const key of keys) {
    const value = accepted.get(key);
    if (value !== null) fields[detailKey(key)] = value;
  }
  return fields;
}

/** Append navigation state to a server-generated case URL, preserving its notice and focus fragment. */
export function assistanceActionReturnHref(href: string, formData: FormData): string {
  const raw: Filters = {};
  for (const key of keys) {
    const name = detailKey(key);
    const values = formData.getAll(name);
    if (values.length === 1 && typeof values[0] === "string") raw[name] = values[0];
  }
  const query = new URLSearchParams(assistanceQueueContext(assistanceReturnFilters(raw)));
  if (!query.size) return href;
  const fragmentIndex = href.indexOf("#");
  const path = fragmentIndex === -1 ? href : href.slice(0, fragmentIndex);
  const fragment = fragmentIndex === -1 ? "" : href.slice(fragmentIndex);
  return `${path}${path.includes("?") ? "&" : "?"}${query.toString()}${fragment}`;
}
