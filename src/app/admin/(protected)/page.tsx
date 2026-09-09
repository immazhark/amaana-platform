import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Props = { searchParams: Promise<{ status?: string }> };
const allowed = ["SUBMITTED", "DOCUMENTS_REQUESTED", "UNDER_VERIFICATION", "APPROVED", "REJECTED", "CONVERTED_TO_APPEAL", "CLOSED"];

export default async function AdminQueuePage({ searchParams }: Props) {
  await requirePermission("assistance.view");
  const { status } = await searchParams; const selected = allowed.includes(status ?? "") ? status : undefined;
  const requests = await prisma.assistanceRequest.findMany({ where: selected ? { status: selected as never } : undefined, include: { assignedTo: true, _count: { select: { documents: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
  return <><div className="admin-heading"><div><p className="eyebrow">Case management</p><h1>Assistance queue</h1></div></div><div className="filter-row"><Link href="/admin">All</Link>{allowed.map(item => <Link key={item} href={`/admin?status=${item}`}>{item.replaceAll("_", " ")}</Link>)}</div><div className="admin-table-wrap"><table><thead><tr><th>Reference</th><th>Applicant</th><th>Category</th><th>Status</th><th>Assigned to</th><th>Documents</th><th>Received</th></tr></thead><tbody>{requests.map(item => <tr key={item.id}><td><Link href={`/admin/requests/${item.id}`}><strong>{item.referenceNumber}</strong></Link></td><td>{item.applicantName}<br/><small>{item.city}</small></td><td>{item.category.replaceAll("_", " ")}</td><td><span className="status-badge">{item.status.replaceAll("_", " ")}</span></td><td>{item.assignedTo?.name ?? "Unassigned"}</td><td>{item._count.documents}</td><td>{item.createdAt.toLocaleDateString("en-IN")}</td></tr>)}</tbody></table>{requests.length === 0 && <p className="empty-state">No requests match this view.</p>}</div></>;
}
