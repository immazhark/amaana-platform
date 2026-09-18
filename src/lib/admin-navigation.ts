export const ADMIN_NAV_ITEMS = [
  { permission: "assistance.view", path: "/admin", label: "Assistance queue" },
  { permission: "appeal.view", path: "/admin/appeals", label: "Appeals" },
  { permission: "content.view", path: "/admin/media", label: "Media review" },
  { permission: "assistance.approve", path: "/admin/retention", label: "Retention review" },
  { permission: "donation.view", path: "/admin/donations", label: "Donations" },
  { permission: "notification.view", path: "/admin/notifications", label: "Notification delivery" },
  { permission: "rbac.manage", path: "/admin/audit", label: "Audit history" },
] as const;

const ADMIN_HOME_DESTINATIONS = [
  { permission: "assistance.view", path: "/admin" },
  { permission: "assistance.approve", path: "/admin/retention" },
  { permission: "appeal.view", path: "/admin/appeals" },
  { permission: "content.view", path: "/admin/media" },
  { permission: "donation.view", path: "/admin/donations" },
  { permission: "notification.view", path: "/admin/notifications" },
  { permission: "rbac.manage", path: "/admin/audit" },
] as const;

export function adminNavigationForPermissions(permissions: Iterable<string>) {
  const allowed = new Set(permissions);
  return ADMIN_NAV_ITEMS.filter(item => allowed.has(item.permission));
}

export function adminHomePathForPermissions(permissions: Iterable<string>) {
  const allowed = new Set(permissions);
  return ADMIN_HOME_DESTINATIONS.find(item => allowed.has(item.permission))?.path ?? "/admin/forbidden";
}
