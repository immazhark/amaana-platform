import Link from "next/link";
import { redirect } from "next/navigation";
import { AssistanceStatus } from "@prisma/client";
import { adminHomePathForPermissions } from "@/lib/admin-navigation";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import { hasPermission, permissionKeys, requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = { searchParams: Promise<{ status?: string; page?: string }> };
const allowed = Object.values(AssistanceStatus);

export default async function AdminQueuePage({ searchParams }: Props) {
  const user = await requireAuthenticatedUser();
  if (!hasPermission(user, "assistance.view")) redirect(adminHomePathForPermissions(permissionKeys(user)));
  const { status, page: pageParam } = await searchParams;
  const selected = allowed.includes(status as AssistanceStatus) ? status as AssistanceStatus : undefined;
  const where = selected ? { status: selected } : undefined;
  const [totalItems, grouped] = await Promise.all([
    prisma.assistanceRequest.count({ where }),
    prisma.assistanceRequest.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const pagination = getAdminPagination(totalItems, parseAdminPage(pageParam));
  const requests = await prisma.assistanceRequest.findMany({
    where,
    include: { assignedTo: true, _count: { select: { documents: true } } },
    orderBy: { createdAt: "desc" },
    skip: pagination.skip,
    take: pagination.pageSize,
  });
  const counts = new Map(grouped.map(item => [item.status, item._count._all]));
  const pageHref = (targetPage: number) => ({
    pathname: "/admin",
    query: { ...(selected ? { status: selected } : {}), page: targetPage },
  });

  return <>
    <div className="admin-heading"><div><p className="eyebrow">Case management</p><h1>Assistance queue</h1></div></div>
    <div className="filter-row" aria-label="Assistance request status filter"><strong>Status:</strong><Link href="/admin" aria-current={!selected ? "page" : undefined}>All</Link>{allowed.map(item => <Link key={item} href={`/admin?status=${item}`} aria-current={selected === item ? "page" : undefined}>{item.replaceAll("_", " ")} ({counts.get(item) ?? 0})</Link>)}</div>
    <div className="admin-table-wrap"><table><thead><tr><th>Reference</th><th>Applicant</th><th>Category</th><th>Status</th><th>Assigned to</th><th>Documents</th><th>Received</th></tr></thead><tbody>{requests.map(item => <tr key={item.id}><td><Link href={`/admin/requests/${item.id}`}><strong>{item.referenceNumber}</strong></Link></td><td>{item.applicantName}<br/><small>{item.city}</small></td><td>{item.category.replaceAll("_", " ")}</td><td><span className="status-badge">{item.status.replaceAll("_", " ")}</span></td><td>{item.assignedTo?.name ?? "Unassigned"}</td><td>{item._count.documents}</td><td>{item.createdAt.toLocaleDateString("en-IN")}</td></tr>)}</tbody></table>{requests.length === 0 && <p className="empty-state">No requests match this view.</p>}</div>
    <nav className="filter-row" aria-label="Assistance request pagination">
      {pagination.hasPrevious && <Link href={pageHref(pagination.page - 1)}>Previous</Link>}
      <span>Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} records</span>
      {pagination.hasNext && <Link href={pageHref(pagination.page + 1)}>Next</Link>}
    </nav>
  </>;
}
