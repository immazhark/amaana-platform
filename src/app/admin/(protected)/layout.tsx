import { AdminShell } from "@/components/admin-shell";
import { permissionKeys, requireAuthenticatedUser } from "@/lib/auth";
import { logout } from "../login/actions";
import { allocationPlanningEnabled } from "@/lib/allocation-proposal-operations";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAuthenticatedUser();
  return (
    <AdminShell
      userName={user.name}
      roleNames={user.roles.map(item => item.role.name.replaceAll("_", " "))}
      permissions={permissionKeys(user)}
      allocationEnabled={allocationPlanningEnabled()}
      logoutAction={logout}
    >
      {children}
    </AdminShell>
  );
}
