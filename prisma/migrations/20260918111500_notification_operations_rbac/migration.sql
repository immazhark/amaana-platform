-- Production-safe RBAC data migration for notification operations.
-- Staging seed also upserts these records, but production startup does not run that seed.

INSERT INTO "Permission" ("id", "key", "description", "createdAt")
VALUES
  ('perm_notification_view_20260918', 'notification.view', 'View transactional email delivery status and failures', CURRENT_TIMESTAMP),
  ('perm_notification_manage_20260918', 'notification.manage', 'Requeue failed transactional email deliveries after operational review', CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE
SET "description" = EXCLUDED."description";

INSERT INTO "RolePermission" ("roleId", "permissionId")
SELECT role."id", permission."id"
FROM "Role" role
JOIN "Permission" permission ON permission."key" IN ('notification.view', 'notification.manage')
WHERE role."name" IN ('PRIMARY_APPROVER', 'BACKUP_APPROVER')
ON CONFLICT ("roleId", "permissionId") DO NOTHING;
