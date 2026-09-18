import Link from "next/link";
import { NotificationStatus } from "@prisma/client";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import { hasPermission, requirePermission } from "@/lib/auth";
import { requeueFailedNotification } from "./actions";
import { prisma } from "@/lib/prisma";

type Props = { searchParams: Promise<{ status?: string; page?: string }> };

const statusOrder = [
  NotificationStatus.FAILED,
  NotificationStatus.PROCESSING,
  NotificationStatus.PENDING,
  NotificationStatus.SENT,
  NotificationStatus.CANCELLED,
];

function formatDateTime(value: Date | null) {
  return value ? value.toLocaleString("en-IN") : "—";
}

function deliveryScheduleLabel(status: NotificationStatus, scheduledFor: Date, sentAt: Date | null) {
  if (status === NotificationStatus.SENT) return formatDateTime(sentAt);
  if (status === NotificationStatus.FAILED && scheduledFor.getUTCFullYear() >= 9999) return "Manual attention required";
  return formatDateTime(scheduledFor);
}

export default async function NotificationOperationsPage({ searchParams }: Props) {
  const user = await requirePermission("notification.view");
  const canManageNotifications = hasPermission(user, "notification.manage");
  const { status, page: pageParam } = await searchParams;
  const selected = Object.values(NotificationStatus).includes(status as NotificationStatus)
    ? status as NotificationStatus
    : undefined;
  const where = selected ? { status: selected } : undefined;

  const [totalItems, grouped] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.groupBy({
      by: ["status"],
      _count: { _all: true },
    }),
  ]);

  const pagination = getAdminPagination(totalItems, parseAdminPage(pageParam));
  const notifications = await prisma.notification.findMany({
    where,
    select: {
      id: true,
      status: true,
      recipient: true,
      templateKey: true,
      subject: true,
      attempts: true,
      failureReason: true,
      scheduledFor: true,
      sentAt: true,
      createdAt: true,
      assistanceRequestId: true,
      donationId: true,
      assistanceRequest: { select: { referenceNumber: true } },
      donation: { select: { referenceNumber: true } },
    },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    skip: pagination.skip,
    take: pagination.pageSize,
  });

  const counts = new Map(grouped.map(item => [item.status, item._count._all]));
  const pageHref = (targetPage: number) => ({
    pathname: "/admin/notifications",
    query: { ...(selected ? { status: selected } : {}), page: targetPage },
  });

  return <>
    <div className="admin-heading">
      <div>
        <p className="eyebrow">Operations</p>
        <h1>Notification delivery</h1>
        <p className="lead">Read-only visibility into queued transactional emails, retry attempts and terminal delivery failures.</p>
      </div>
    </div>

    <div className="filter-row">
      <Link href="/admin/notifications">All</Link>
      {statusOrder.map(item => (
        <Link key={item} href={"/admin/notifications?status=" + item}>
          {item} ({counts.get(item) ?? 0})
        </Link>
      ))}
    </div>

    <div className="admin-table-wrap">
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Recipient</th>
            <th>Message</th>
            <th>Related record</th>
            <th>Attempts</th>
            <th>Next / sent</th>
            <th>Failure</th>
          </tr>
        </thead>
        <tbody>
          {notifications.map(notification => {
            const related = notification.assistanceRequestId
              ? {
                  href: "/admin/requests/" + notification.assistanceRequestId,
                  label: notification.assistanceRequest?.referenceNumber ?? "Assistance request",
                }
              : notification.donationId
                ? {
                    href: "/admin/donations/" + notification.donationId,
                    label: notification.donation?.referenceNumber ?? "Donation",
                  }
                : null;

            return <tr key={notification.id}>
              <td><span className="status-badge">{notification.status}</span></td>
              <td>{notification.recipient}</td>
              <td>
                <strong>{notification.subject ?? notification.templateKey}</strong>
                <br/><small>{notification.templateKey}</small>
              </td>
              <td>{related ? <Link href={related.href}>{related.label}</Link> : "—"}</td>
              <td>{notification.attempts}</td>
              <td>{deliveryScheduleLabel(notification.status, notification.scheduledFor, notification.sentAt)}</td>
              <td>
                <small>{notification.failureReason ?? "—"}</small>
                {canManageNotifications && notification.status === NotificationStatus.FAILED && (
                  <form action={requeueFailedNotification} className="admin-inline-form">
                    <input type="hidden" name="id" value={notification.id} />
                    <label>
                      <span className="sr-only">Reason to requeue {notification.subject ?? notification.templateKey}</span>
                      <input
                        name="reason"
                        minLength={10}
                        maxLength={1000}
                        required
                        placeholder="Why is retry safe now?"
                      />
                    </label>
                    <button type="submit">Requeue</button>
                  </form>
                )}
              </td>
            </tr>;
          })}
        </tbody>
      </table>
      {notifications.length === 0 && <p className="empty-state">No notifications match this view.</p>}
    </div>

    <nav className="filter-row" aria-label="Notification pagination">
      {pagination.hasPrevious && <Link href={pageHref(pagination.page - 1)}>Previous</Link>}
      <span>Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} records</span>
      {pagination.hasNext && <Link href={pageHref(pagination.page + 1)}>Next</Link>}
    </nav>
  </>;
}
