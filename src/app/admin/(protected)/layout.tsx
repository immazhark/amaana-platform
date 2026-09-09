import Link from "next/link";
import { requirePermission } from "@/lib/auth";
import { logout } from "../login/actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePermission("assistance.view");
  return <div className="admin-shell"><aside className="admin-sidebar"><Link className="brand" href="/admin"><span className="brand-mark">A</span><span>Amaana Admin</span></Link><nav aria-label="Admin navigation"><Link href="/admin">Assistance queue</Link></nav><div className="admin-user"><span>{user.name}</span><small>{user.roles.map(item => item.role.name.replaceAll("_", " ")).join(", ")}</small><form action={logout}><button className="text-button" type="submit">Sign out</button></form></div></aside><div className="admin-content">{children}</div></div>;
}
