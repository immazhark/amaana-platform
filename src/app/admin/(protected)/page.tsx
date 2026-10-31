import Link from "next/link";
import { redirect } from "next/navigation";
import { AssistanceStatus } from "@prisma/client";
import { adminHomePathForPermissions } from "@/lib/admin-navigation";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import { adminRecordView, assistanceAdminWhere } from "@/lib/admin-record-visibility";
import { hasPermission, permissionKeys, requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = { searchParams: Promise<{ status?: string; page?: string; view?: string }> };
const allowed = Object.values(AssistanceStatus);

export default async function AdminQueuePage({ searchParams }: Props) {
  const user = await requireAuthenticatedUser();
  if (!hasPermission(user, "assistance.view")) redirect(adminHomePathForPermissions(permissionKeys(user)));
  const { status, page: pageParam, view: requestedView } = await searchParams;
  const view = adminRecordView(requestedView);
  const selected = allowed.includes(status as AssistanceStatus) ? status as AssistanceStatus : undefined;
  const scope = assistanceAdminWhere(view);
  const where = assistanceAdminWhere(view, selected);
  const [totalItems, grouped] = await Promise.all([
    prisma.assistanceRequest.count({ where }),
    prisma.assistanceRequest.groupBy({ by: ["status"], where: scope, _count: { _all: true } }),
  ]);
  const pagination = getAdminPagination(totalItems, parseAdminPage(pageParam));
  const requests = await prisma.assistanceRequest.findMany({
    where,
    include: { assignedTo: true, _count: { select: { documents: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: pagination.skip,
    take: pagination.pageSize,
  });
  const counts = new Map(grouped.map(item => [item.status, item._count._all]));
  const viewQuery = view === "tests" ? { view: "tests" } : {};
  const pageHref = (targetPage: number) => ({
    pathname: "/admin",
    query: { ...viewQuery, ...(selected ? { status: selected } : {}), page: targetPage },
  });

  return <>
    <div className="admin-heading"><div><p className="eyebrow">Case management</p><h1>Assistance queue</h1></div></div>
    <div className="filter-row" role="group" aria-label="Record visibility"><strong>Records:</strong><Link href="/admin" aria-current={view === "live" ? "page" : undefined}>Live records</Link><Link href="/admin?view=tests" aria-current={view === "tests" ? "page" : undefined}>Historical tests</Link></div>
    {view === "tests" && <p className="muted">Retained staging acceptance records only. Related payment and refund history remains available for audit.</p>}
    <div className="filter-row" role="group" aria-label="Assistance request status filter"><strong>Status:</strong><Link href={{ pathname: "/admin", query: viewQuery }} aria-current={!selected ? "page" : undefined}>All</Link>{allowed.map(item => <Link key={item} href={{ pathname: "/admin", query: { ...viewQuery, status: item } }} aria-current={selected === item ? "page" : undefined}>{item.replaceAll("_", " ")} ({counts.get(item) ?? 0})</Link>)}</div>
    <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Operational records"><table><thead><tr><th>Reference</th><th>Applicant</th><th>Category</th><th>Status</th><th>Assigned to</th><th>Documents</th><th>Received</th></tr></thead><tbody>{requests.map(item => <tr key={item.id}><td><Link href={`/admin/requests/${item.id}`}><strong>{item.referenceNumber}</strong></Link></td><td>{item.applicantName}<br/><small>{item.city}</small></td><td>{item.category.replaceAll("_", " ")}</td><td><span className="status-badge">{item.status.replaceAll("_", " ")}</span></td><td>{item.assignedTo?.name ?? "Unassigned"}</td><td>{item._count.documents}</td><td>{item.createdAt.toLocaleDateString("en-IN")}</td></tr>)}</tbody></table>{requests.length === 0 && <p className="empty-state">{view === "tests" ? "No historical test requests match this view." : "No requests match this view."}</p>}</div>
    <nav className="filter-row" aria-label="Assistance request pagination">
      {pagination.hasPrevious && <Link href={pageHref(pagination.page - 1)}>Previous</Link>}
      <span>Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} records</span>
      {pagination.hasNext && <Link href={pageHref(pagination.page + 1)}>Next</Link>}
    </nav>
  </>;
}
