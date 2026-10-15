import Link from "@/components/navigation-link";
import { redirect } from "next/navigation";
import {
  ASSISTANCE_QUEUE_STATUSES, assistanceQueueAge, assistanceQueueAssignmentWhere,
  assistanceQueueHref, parseAssistanceQueueFilters,
} from "@/lib/assistance-queue";
import { adminHomePathForPermissions } from "@/lib/admin-navigation";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import { hasPermission, permissionKeys, requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = { searchParams: Promise<{
  status?: string | string[]; page?: string | string[];
  assignment?: string | string[]; order?: string | string[];
}> };

export default async function AdminQueuePage({ searchParams }: Props) {
  const user = await requireAuthenticatedUser();
  if (!hasPermission(user, "assistance.view")) redirect(adminHomePathForPermissions(permissionKeys(user)));
  const params = await searchParams;
  const filters = parseAssistanceQueueFilters(params);
  const assignmentWhere = assistanceQueueAssignmentWhere(filters.assignment, user.id);
  const where = { ...assignmentWhere, ...(filters.status ? { status: filters.status } : {}) };
  const [totalItems, grouped] = await Promise.all([
    prisma.assistanceRequest.count({ where }),
    prisma.assistanceRequest.groupBy({ where: assignmentWhere, by: ["status"], _count: { _all: true } }),
  ]);
  const pagination = getAdminPagination(totalItems, parseAdminPage(typeof params.page === "string" ? params.page : undefined));
  const requests = await prisma.assistanceRequest.findMany({
    where,
    select: {
      id: true, referenceNumber: true, applicantName: true, city: true,
      category: true, status: true, createdAt: true,
      assignedTo: { select: { name: true } }, _count: { select: { documents: true } },
    },
    orderBy: filters.order === "oldest"
      ? [{ createdAt: "asc" }, { id: "asc" }]
      : [{ createdAt: "desc" }, { id: "desc" }],
    skip: pagination.skip,
    take: pagination.pageSize,
  });
  const counts = new Map(grouped.map(item => [item.status, item._count._all]));
  const now = new Date();
  const assignmentChoices = [
    { value: "all", label: "All assignments" },
    { value: "mine", label: "Assigned to me" },
    { value: "unassigned", label: "Unassigned" },
  ] as const;

  return <>
    <div className="admin-heading"><div><p className="eyebrow">Case management</p><h1>Assistance queue</h1></div></div>
    <p className="muted">Filter by assignment or review the oldest requests first. Request age is time since receipt, not a response deadline or urgency assessment.</p>
    <div className="filter-row" role="group" aria-label="Assistance request assignment filter"><strong>Assignment:</strong>{assignmentChoices.map(item => <Link key={item.value} href={assistanceQueueHref({ ...filters, assignment: item.value })} aria-current={filters.assignment === item.value ? "page" : undefined}>{item.label}</Link>)}</div>
    <div className="filter-row" role="group" aria-label="Assistance request order"><strong>Order:</strong>{(["newest", "oldest"] as const).map(order => <Link key={order} href={assistanceQueueHref({ ...filters, order })} aria-current={filters.order === order ? "page" : undefined}>{order === "oldest" ? "Oldest first" : "Newest first"}</Link>)}</div>
    <div className="filter-row" role="group" aria-label="Assistance request status filter"><strong>Status:</strong><Link href={assistanceQueueHref({ ...filters, status: undefined })} aria-current={!filters.status ? "page" : undefined}>All</Link>{ASSISTANCE_QUEUE_STATUSES.map(item => <Link key={item} href={assistanceQueueHref({ ...filters, status: item })} aria-current={filters.status === item ? "page" : undefined}>{item.replaceAll("_", " ")} ({counts.get(item) ?? 0})</Link>)}</div>
    <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Operational records"><table><thead><tr><th>Reference</th><th>Applicant</th><th>Category</th><th>Status</th><th>Assigned to</th><th>Documents</th><th>Received</th><th>Request age</th></tr></thead><tbody>{requests.map(item => <tr key={item.id}><td><Link href={`/admin/requests/${item.id}`}><strong>{item.referenceNumber}</strong></Link></td><td>{item.applicantName}<br/><small>{item.city}</small></td><td>{item.category.replaceAll("_", " ")}</td><td><span className="status-badge">{item.status.replaceAll("_", " ")}</span></td><td>{item.assignedTo?.name ?? "Unassigned"}</td><td>{item._count.documents}</td><td>{item.createdAt.toLocaleDateString("en-IN")}</td><td>{assistanceQueueAge(item.createdAt, now)}</td></tr>)}</tbody></table>{requests.length === 0 && <p className="empty-state">No requests match this view.</p>}</div>
    <nav className="filter-row" aria-label="Assistance request pagination">
      {pagination.hasPrevious && <Link href={assistanceQueueHref(filters, pagination.page - 1)}>Previous</Link>}
      <span>Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} records</span>
      {pagination.hasNext && <Link href={assistanceQueueHref(filters, pagination.page + 1)}>Next</Link>}
    </nav>
  </>;
}
