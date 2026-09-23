import Link from "next/link";
import { AppealStatus } from "@prisma/client";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = { searchParams: Promise<{ page?: string; status?: string }> };

export default async function AdminAppealsPage({ searchParams }: Props) {
  await requirePermission("appeal.view");
  const { page: pageParam, status } = await searchParams;
  const selected = Object.values(AppealStatus).includes(status as AppealStatus) ? status as AppealStatus : undefined;
  const where = selected ? { status: selected } : undefined;
  const [totalItems, grouped] = await Promise.all([
    prisma.appeal.count({ where }),
    prisma.appeal.groupBy({ by: ["status"], _count: { _all: true } }),
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
  const pageHref = (targetPage: number) => ({
    pathname: "/admin/appeals",
    query: { ...(selected ? { status: selected } : {}), page: targetPage },
  });

  return <>
    <div className="admin-heading"><div><p className="eyebrow">Publishing</p><h1>Appeals</h1><p className="muted">New public appeals begin from an approved, verified assistance request. This keeps private review and public fundraising connected.</p></div></div>
    <div className="filter-row" aria-label="Appeal status filter"><strong>Status:</strong><Link href="/admin/appeals" aria-current={!selected ? "page" : undefined}>All</Link>{Object.values(AppealStatus).map(item => <Link key={item} href={{ pathname: "/admin/appeals", query: { status: item } }} aria-current={selected === item ? "page" : undefined}>{item.replaceAll("_", " ")} ({counts.get(item) ?? 0})</Link>)}</div>
    <div className="admin-table-wrap"><table><thead><tr><th>Appeal</th><th>Status</th><th>Goal</th><th>Created by</th><th>Approved by</th><th>Updated</th></tr></thead><tbody>{appeals.map(appeal => <tr key={appeal.id}><td><Link href={`/admin/appeals/${appeal.id}`}><strong>{appeal.title}</strong></Link><br/><small>/{appeal.slug}</small></td><td><span className="status-badge">{appeal.status.replaceAll("_", " ")}</span></td><td>₹{appeal.goalAmount.toNumber().toLocaleString("en-IN")}</td><td>{appeal.createdBy.name}</td><td>{appeal.reviewedBy?.name ?? "—"}</td><td>{appeal.updatedAt.toLocaleDateString("en-IN")}</td></tr>)}</tbody></table>{appeals.length === 0 && <p className="empty-state">No appeals have been created. Approved assistance requests can be converted into draft appeals from the request workflow.</p>}</div>
    <nav className="filter-row" aria-label="Appeal pagination">
      {pagination.hasPrevious && <Link href={pageHref(pagination.page - 1)}>Previous</Link>}
      <span>Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} records</span>
      {pagination.hasNext && <Link href={pageHref(pagination.page + 1)}>Next</Link>}
    </nav>
  </>;
}
