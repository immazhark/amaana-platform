const ADMIN_DESTINATIONS = [
  { permission: "assistance.view", path: "/admin" },
  { permission: "appeal.view", path: "/admin/appeals" },
  { permission: "content.view", path: "/admin/media" },
  { permission: "donation.view", path: "/admin/donations" },
] as const;

export function adminHomePathForPermissions(permissions: Iterable<string>) {
  const allowed = new Set(permissions);
  return ADMIN_DESTINATIONS.find(item => allowed.has(item.permission))?.path ?? "/admin/forbidden";
}
