import Link from "next/link";
import { AppealStatus } from "@prisma/client";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import { adminRecordView, appealAdminWhere } from "@/lib/admin-record-visibility";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = { searchParams: Promise<{ page?: string; status?: string; view?: string }> };

export default async function AdminAppealsPage({ searchParams }: Props) {
  await requirePermission("appeal.view");
  const { page: pageParam, status, view: requestedView } = await searchParams;
  const view = adminRecordView(requestedView);
  const selected = Object.values(AppealStatus).includes(status as AppealStatus) ? status as AppealStatus : undefined;
  const scope = appealAdminWhere(view);
  const where = appealAdminWhere(view, selected);
  const [totalItems, grouped] = await Promise.all([
    prisma.appeal.count({ where }),
    prisma.appeal.groupBy({ by: ["status"], where: scope, _count: { _all: true } }),
  ]);
  const pagination = getAdminPagination(totalItems, parseAdminPage(pageParam));
  const appeals = await prisma.appeal.findMany({
    where,
    include: { createdBy: true, reviewedBy: true },
    orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
    skip: pagination.skip,
    take: pagination.pageSize,
  });

  const counts = new Map(grouped.map(item => [item.status, item._count._all]));
  const viewQuery = view === "tests" ? { view: "tests" } : {};
  const pageHref = (targetPage: number) => ({
    pathname: "/admin/appeals",
    query: { ...viewQuery, ...(selected ? { status: selected } : {}), page: targetPage },
  });

  return <>
    <div className="admin-heading"><div><p className="eyebrow">Publishing</p><h1>Appeals</h1><p className="muted">New public appeals begin from an approved, verified assistance request. This keeps private review and public fundraising connected.</p></div></div>
    <div className="filter-row" role="group" aria-label="Record visibility"><strong>Records:</strong><Link href="/admin/appeals" aria-current={view === "live" ? "page" : undefined}>Live records</Link><Link href="/admin/appeals?view=tests" aria-current={view === "tests" ? "page" : undefined}>Historical tests</Link></div>
    {view === "tests" && <p className="muted">Retained staging acceptance records only. Related payment and refund history remains available for audit.</p>}
    <div className="filter-row" role="group" aria-label="Appeal status filter"><strong>Status:</strong><Link href={{ pathname: "/admin/appeals", query: viewQuery }} aria-current={!selected ? "page" : undefined}>All</Link>{Object.values(AppealStatus).map(item => <Link key={item} href={{ pathname: "/admin/appeals", query: { ...viewQuery, status: item } }} aria-current={selected === item ? "page" : undefined}>{item.replaceAll("_", " ")} ({counts.get(item) ?? 0})</Link>)}</div>
    <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Appeals"><table><thead><tr><th>Appeal</th><th>Status</th><th>Goal</th><th>Created by</th><th>Approved by</th><th>Updated</th></tr></thead><tbody>{appeals.map(appeal => <tr key={appeal.id}><td><Link href={`/admin/appeals/${appeal.id}`}><strong>{appeal.title}</strong></Link><br/><small>/{appeal.slug}</small></td><td><span className="status-badge">{appeal.status.replaceAll("_", " ")}</span></td><td>₹{appeal.goalAmount.toNumber().toLocaleString("en-IN")}</td><td>{appeal.createdBy.name}</td><td>{appeal.reviewedBy?.name ?? "—"}</td><td>{appeal.updatedAt.toLocaleDateString("en-IN")}</td></tr>)}</tbody></table>{appeals.length === 0 && <p className="empty-state">{view === "tests" ? "No historical test appeals match this view." : "No appeals have been created. Approved assistance requests can be converted into draft appeals from the request workflow."}</p>}</div>
    <nav className="filter-row" aria-label="Appeal pagination">
      {pagination.hasPrevious && <Link href={pageHref(pagination.page - 1)}>Previous</Link>}
      <span>Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} records</span>
      {pagination.hasNext && <Link href={pageHref(pagination.page + 1)}>Next</Link>}
    </nav>
  </>;
}
