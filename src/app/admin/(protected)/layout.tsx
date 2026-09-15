import Link from "next/link";
import { adminHomePathForPermissions } from "@/lib/admin-navigation";
import { hasPermission, permissionKeys, requireAuthenticatedUser } from "@/lib/auth";
import { logout } from "../login/actions";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuthenticatedUser();
  const homePath = adminHomePathForPermissions(permissionKeys(user));
  return <div className="admin-shell"><aside className="admin-sidebar"><Link className="brand" href={homePath}><span className="brand-mark">A</span><span>Amaana Admin</span></Link><nav aria-label="Admin navigation">{hasPermission(user, "assistance.view") && <Link href="/admin">Assistance queue</Link>}{hasPermission(user, "appeal.view") && <Link href="/admin/appeals">Appeals</Link>}{hasPermission(user, "content.view") && <Link href="/admin/media">Media review</Link>}{hasPermission(user, "assistance.approve") && <Link href="/admin/retention">Retention review</Link>}{hasPermission(user, "donation.view") && <Link href="/admin/donations">Donations</Link>}</nav><div className="admin-user"><span>{user.name}</span><small>{user.roles.map(item => item.role.name.replaceAll("_", " ")).join(", ")}</small><form action={logout}><button className="text-button" type="submit">Sign out</button></form></div></aside><div className="admin-content">{children}</div></div>;
}
