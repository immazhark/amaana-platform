export const ADMIN_NAV_ITEMS = [
  { permission: "assistance.view", path: "/admin", label: "Assistance queue" },
  { permission: "assistance.view", path: "/admin/follow-ups", label: "Next staff actions" },
  { permission: "appeal.view", path: "/admin/appeals", label: "Appeals" },
  { permission: "content.view", path: "/admin/media", label: "Media review" },
  { permission: "content.update", path: "/admin/home-carousel", label: "Home carousel" },
  { permission: "assistance.approve", path: "/admin/retention", label: "Retention review" },
  { permission: "fund.view", path: "/admin/giving-funds", label: "Giving fund registry" },
  { permission: "donation.view", path: "/admin/donations", label: "Donations" },
  { permission: "donation.view", path: "/admin/allocations", label: "Allocation proposals" },
  { permission: "notification.view", path: "/admin/notifications", label: "Notification delivery" },
  { permission: "rbac.manage", path: "/admin/audit", label: "Audit history" },
] as const;

const ADMIN_HOME_DESTINATIONS = [
  { permission: "assistance.view", path: "/admin" },
  { permission: "assistance.approve", path: "/admin/retention" },
  { permission: "appeal.view", path: "/admin/appeals" },
  { permission: "content.view", path: "/admin/media" },
  { permission: "content.update", path: "/admin/home-carousel" },
  { permission: "fund.view", path: "/admin/giving-funds" },
  { permission: "donation.view", path: "/admin/donations" },
  { permission: "notification.view", path: "/admin/notifications" },
  { permission: "rbac.manage", path: "/admin/audit" },
] as const;

export function adminNavigationForPermissions(
  permissions: Iterable<string>,
  options: { allocationEnabled?: boolean } = {},
) {
  const allowed = new Set(permissions);
  return ADMIN_NAV_ITEMS.filter(item => allowed.has(item.permission) &&
    (item.path !== "/admin/allocations" || options.allocationEnabled === true));
}

export function adminHomePathForPermissions(permissions: Iterable<string>) {
  const allowed = new Set(permissions);
  return ADMIN_HOME_DESTINATIONS.find(item => allowed.has(item.permission))?.path ?? "/admin/forbidden";
}


export function isAdminNavigationActive(pathname: string | null, path: string) {
  if (!pathname) return false;
  if (path === "/admin") return pathname === "/admin" || pathname.startsWith("/admin/requests/");
  return pathname === path || pathname.startsWith(`${path}/`);
}
