import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import { prisma } from "@/lib/prisma";

type Props = { searchParams: Promise<{ page?: string; action?: string; entityType?: string }> };

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
  const { page: pageParam, action: actionParam, entityType: entityTypeParam } = await searchParams;
  const action = actionParam?.trim().slice(0, 120) || undefined;
  const entityType = entityTypeParam?.trim().slice(0, 120) || undefined;
  const where = {
    ...(action ? { action } : {}),
    ...(entityType ? { entityType } : {}),
  };
  const [totalItems, facets] = await Promise.all([
    prisma.auditEvent.count({ where }),
    prisma.auditEvent.groupBy({ by: ["entityType"], _count: { _all: true }, orderBy: { entityType: "asc" } }),
  ]);
  const pagination = getAdminPagination(totalItems, parseAdminPage(pageParam));
  const events = await prisma.auditEvent.findMany({
    where,
    include: { actor: { select: { name: true, email: true } } },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    skip: pagination.skip,
    take: pagination.pageSize,
  });

  const pageHref = (targetPage: number) => ({
    pathname: "/admin/audit",
    query: { ...(action ? { action } : {}), ...(entityType ? { entityType } : {}), page: targetPage },
  });
  const entityHref = (nextEntityType?: string) => ({
    pathname: "/admin/audit",
    query: { ...(action ? { action } : {}), ...(nextEntityType ? { entityType: nextEntityType } : {}) },
  });

  return <>
    <div className="admin-heading">
      <div>
        <p className="eyebrow">Accountability</p>
        <h1>Audit history</h1>
        <p className="lead">Read-only history of sensitive administrative actions recorded by the platform.</p>
      </div>
    </div>
    <div className="filter-row" aria-label="Audit entity filter">
      <strong>Entity:</strong>
      <Link href={entityHref()} aria-current={!entityType ? "page" : undefined}>All</Link>
      {facets.map(item => <Link key={item.entityType} href={entityHref(item.entityType)} aria-current={entityType === item.entityType ? "page" : undefined}>
        {item.entityType} ({item._count._all})
      </Link>)}
    </div>
    {action && <p className="muted">Showing exact action <strong>{action}</strong>. <Link href={entityHref(entityType)}>Clear action filter</Link></p>}
    <div className="admin-table-wrap">
      <table>
        <thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Entity</th><th>Details</th></tr></thead>
        <tbody>{events.map(event => <tr key={event.id}>
          <td>{event.createdAt.toLocaleString("en-IN")}</td>
          <td>{event.actor.name}<br/><small>{event.actor.email}</small></td>
          <td><Link href={{ pathname: "/admin/audit", query: { action: event.action, ...(entityType ? { entityType } : {}) } }}><strong>{event.action}</strong></Link></td>
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
