import Link from "next/link";
import { hasPermission, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAppeal } from "./actions";

export default async function AdminAppealsPage() {
  const user = await requirePermission("appeal.view");
  const appeals = await prisma.appeal.findMany({ include: { createdBy: true, reviewedBy: true }, orderBy: { updatedAt: "desc" } });
  return <><div className="admin-heading"><div><p className="eyebrow">Publishing</p><h1>Appeals</h1></div>{hasPermission(user, "appeal.create") && <form action={createAppeal}><button className="button">New appeal</button></form>}</div><div className="admin-table-wrap"><table><thead><tr><th>Appeal</th><th>Status</th><th>Goal</th><th>Created by</th><th>Approved by</th><th>Updated</th></tr></thead><tbody>{appeals.map(appeal => <tr key={appeal.id}><td><Link href={`/admin/appeals/${appeal.id}`}><strong>{appeal.title}</strong></Link><br/><small>/{appeal.slug}</small></td><td><span className="status-badge">{appeal.status.replaceAll("_", " ")}</span></td><td>₹{appeal.goalAmount.toNumber().toLocaleString("en-IN")}</td><td>{appeal.createdBy.name}</td><td>{appeal.reviewedBy?.name ?? "—"}</td><td>{appeal.updatedAt.toLocaleDateString("en-IN")}</td></tr>)}</tbody></table>{appeals.length === 0 && <p className="empty-state">No appeals have been created.</p>}</div></>;
}
