import Link from "next/link";
import { adminHomePathForPermissions, adminNavigationForPermissions } from "@/lib/admin-navigation";

type Props = {
  children: React.ReactNode;
  userName: string;
  roleNames: string[];
  permissions: Iterable<string>;
  logoutAction?: () => Promise<void>;
  fixtureLabel?: string;
};

export function AdminShell({ children, userName, roleNames, permissions, logoutAction, fixtureLabel }: Props) {
  const permissionList = [...permissions];
  const homePath = adminHomePathForPermissions(permissionList);
  const navigation = adminNavigationForPermissions(permissionList);

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="brand" href={homePath}>
          <span className="brand-mark">A</span>
          <span style={{ color: "#ffffff" }}>Amaana Admin</span>
        </Link>
        <nav aria-label="Admin navigation">
          {navigation.map(item => <Link href={item.path} key={item.path}>{item.label}</Link>)}
        </nav>
        <div className="admin-user">
          <span>{userName}</span>
          <small>{roleNames.join(", ")}</small>
          {logoutAction ? (
            <form action={logoutAction}><button className="text-button" type="submit">Sign out</button></form>
          ) : fixtureLabel ? <small>{fixtureLabel}</small> : null}
        </div>
      </aside>
      <div className="admin-content">{children}</div>
    </div>
  );
}
