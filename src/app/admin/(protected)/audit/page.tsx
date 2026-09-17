import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import { prisma } from "@/lib/prisma";

type Props = { searchParams: Promise<{ page?: string }> };

function formatMetadata(metadata: unknown) {
  if (metadata == null) return "—";
  try {
    return JSON.stringify(metadata);
  } catch {
    return "[unavailable]";
  }
}

export default async function AuditHistoryPage({ searchParams }: Props) {
  await requirePermission("rbac.manage");
  const { page: pageParam } = await searchParams;
  const totalItems = await prisma.auditEvent.count();
  const pagination = getAdminPagination(totalItems, parseAdminPage(pageParam));
  const events = await prisma.auditEvent.findMany({
    include: { actor: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    skip: pagination.skip,
    take: pagination.pageSize,
  });

  const pageHref = (targetPage: number) => ({ pathname: "/admin/audit", query: { page: targetPage } });

  return <>
    <div className="admin-heading">
      <div>
        <p className="eyebrow">Accountability</p>
        <h1>Audit history</h1>
        <p className="lead">Read-only history of sensitive administrative actions recorded by the platform.</p>
      </div>
    </div>
    <div className="admin-table-wrap">
      <table>
        <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
        <tbody>{events.map(event => <tr key={event.id}>
          <td>{event.createdAt.toLocaleString("en-IN")}</td>
          <td>{event.actor.name}<br/><small>{event.actor.email}</small></td>
          <td><strong>{event.action}</strong></td>
          <td>{event.entityType}<br/><small>{event.entityId}</small></td>
          <td><small>{formatMetadata(event.metadata)}</small></td>
        </tr>)}</tbody>
      </table>
      {events.length === 0 && <p className="empty-state">No audit events have been recorded yet.</p>}
    </div>
    <nav className="filter-row" aria-label="Audit history pagination">
      {pagination.hasPrevious && <Link href={pageHref(pagination.page - 1)}>Previous</Link>}
      <span>Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} records</span>
      {pagination.hasNext && <Link href={pageHref(pagination.page + 1)}>Next</Link>}
    </nav>
  </>;
}
