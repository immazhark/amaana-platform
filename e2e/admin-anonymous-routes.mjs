// Shared by isolated Playwright checks and source-aware fast CI coverage verification.
// This file must remain inside e2e/: the browser fixture copies only that directory.
export const protectedAdminSurfaces = [
  "/admin",
  "/admin/appeals",
  "/admin/appeals/not-a-real-id",
  "/admin/audit",
  "/admin/donations",
  "/admin/donations/not-a-real-id",
  "/admin/home-carousel",
  "/admin/media",
  "/admin/team",
  "/admin/notifications",
  "/admin/requests/not-a-real-id",
  "/admin/retention",
  "/admin/documents/not-a-real-id",
];

export const mutatingAdminApiRoutes = [
  "/api/admin/media/curated-gallery/start",
  "/api/admin/media/curated-gallery/upload",
  "/api/admin/media/curated-gallery/publish",
];

export const readOnlyAdminApiRoutes = [
  "/api/admin/media/curated-gallery/status",
];
