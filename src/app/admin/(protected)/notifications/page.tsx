import Link from "next/link";
import { NotificationStatus } from "@prisma/client";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import { hasPermission, requirePermission } from "@/lib/auth";
import { enqueueControlledEmailAcceptance, requeueFailedNotification } from "./actions";
import { prisma } from "@/lib/prisma";
import { notificationOperationalState } from "@/lib/operational-signals";
import { logServerError } from "@/lib/server-log";
import { notificationIssueWhere, notificationIssueFilter, notificationQueueOrder } from "@/lib/notification-review-queue";

type Props = { searchParams: Promise<{ status?: string | string[]; page?: string | string[]; issue?: string | string[] }> };

const statusOrder = [
  NotificationStatus.FAILED,
  NotificationStatus.PROCESSING,
  NotificationStatus.PENDING,
  NotificationStatus.SENT,
  NotificationStatus.CANCELLED,
];

function formatDateTime(value: Date | null) {
  return value ? value.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) : "—";
}

function deliveryScheduleLabel(status: NotificationStatus, scheduledFor: Date, sentAt: Date | null) {
  if (status === NotificationStatus.SENT) return formatDateTime(sentAt);
  if (status === NotificationStatus.FAILED && scheduledFor.getUTCFullYear() >= 9999) return "Manual attention required";
  return formatDateTime(scheduledFor);
}

export default async function NotificationOperationsPage({ searchParams }: Props) {
  const user = await requirePermission("notification.view");
  const canManageNotifications = hasPermission(user, "notification.manage");
  const { status, page: pageParam, issue: issueParam } = await searchParams;
  const selected = typeof status === "string" && Object.values(NotificationStatus).includes(status as NotificationStatus)
    ? status as NotificationStatus
    : undefined;
  const now = new Date();
  const filter = notificationIssueFilter(issueParam, now);
  const where = filter.where
    ? selected ? { AND: [filter.where, { status: selected }] } : filter.where
    : selected ? { status: selected } : undefined;

  const [grouped, operational] = await Promise.all([
    prisma.notification.groupBy({ by: ["status"], where: filter.where, _count: { _all: true } }),
    Promise.all([
      prisma.notification.count({ where: notificationIssueWhere("stale-processing", now) }),
      prisma.notification.count({ where: notificationIssueWhere("overdue", now) }),
      prisma.notification.count({ where: notificationIssueWhere("terminal", now) }),
    ]).then(([staleProcessing, overdueDue, terminalFailures]) =>
      notificationOperationalState({ staleProcessing, overdueDue, terminalFailures }),
    ).catch(() => {
      logServerError("notifications.operational_summary_unavailable");
      return null;
    }),
  ]);
  const counts = new Map(grouped.map(item => [item.status, item._count._all]));
  const totalItems = selected ? counts.get(selected) ?? 0 : grouped.reduce((sum, item) => sum + item._count._all, 0);

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
      providerMessageId: true,
      createdAt: true,
      updatedAt: true,
      assistanceRequestId: true,
      donationId: true,
      assistanceRequest: { select: { referenceNumber: true } },
      donation: { select: { referenceNumber: true } },
    },
    orderBy: notificationQueueOrder(filter.issue),
    skip: pagination.skip,
    take: pagination.pageSize,
  });

  const pageHref = (targetPage: number) => ({
    pathname: "/admin/notifications",
    query: { ...(selected ? { status: selected } : {}), ...filter.query, page: targetPage },
  });

  return <>
    <div className="admin-heading">
      <div>
        <p className="eyebrow">Operations</p>
        <h1>Notification delivery</h1>
        <p className="lead">Operational visibility into queued transactional emails, retry attempts and terminal failures, with audited manual recovery for authorised approvers.</p>
      </div>
    </div>

    <section className="admin-card" aria-labelledby="notification-health-heading">
      <div className="admin-heading">
        <div>
          <p className="eyebrow">Delivery health</p>
          <h2 id="notification-health-heading">Operational signals</h2>
          <p className="muted">
            Queue degradation is tracked separately from infrastructure readiness so a healthy server cannot hide stuck or terminal email delivery.
          </p>
        </div>
        <span className="status-badge">{operational === null ? "UNAVAILABLE" : operational.status === "healthy" ? "HEALTHY" : `${operational.attention} NEED ATTENTION`}</span>
      </div>
      {operational === null ? <p role="status">Operational signals temporarily unavailable. The delivery records below remain available; their presence does not establish delivery health.</p> : <div className="card-grid">
        <article className="card"><strong>{operational.staleProcessing}</strong><p>Processing longer than 15 minutes</p>{operational.staleProcessing > 0 && <Link href={{ pathname: "/admin/notifications", query: { issue: "stale-processing" } }}>Review stuck processing jobs</Link>}</article>
        <article className="card"><strong>{operational.overdueDue}</strong><p>Due email jobs overdue by 15+ minutes</p>{operational.overdueDue > 0 && <Link href={{ pathname: "/admin/notifications", query: { issue: "overdue" } }}>Review overdue email jobs</Link>}</article>
        <article className="card"><strong>{operational.terminalFailures}</strong><p>Terminal failures requiring manual review</p>{operational.terminalFailures > 0 && <Link href={{ pathname: "/admin/notifications", query: { issue: "terminal" } }}>Review terminal failures</Link>}</article>
      </div>}
    </section>

    {canManageNotifications && (
      <section className="admin-card" aria-labelledby="email-acceptance-heading">
        <h2 id="email-acceptance-heading">Controlled email acceptance</h2>
        <p>
          Queue one synthetic transactional email to your own authorised staff account.
          This message contains no donor, beneficiary, payment or assistance-case data.
          In staging, delivery remains disabled and the row stays queued until the approved production acceptance.
        </p>
        <form action={enqueueControlledEmailAcceptance}>
          <button type="submit">Queue acceptance email to my staff account</button>
        </form>
      </section>
    )}

    {(filter.issue || filter.invalid) && <section className="admin-card" aria-labelledby="notification-review-heading">
      <h2 id="notification-review-heading">Delivery exception review</h2>
      {filter.invalid ? <p role="status">Unsupported review filter. No notifications were matched.</p> : <p role="status">{filter.issue === "overdue" ? "Oldest scheduled jobs first." : "Oldest attention first by last update."} Status counts below apply to this review filter. Review the record before deciding whether retry is appropriate; opening this queue does not send anything.</p>}
      <Link href={{ pathname: "/admin/notifications", query: selected ? { status: selected } : {} }}>Clear exception review</Link>
    </section>}
    <div className="filter-row" role="group" aria-label="Notification status filter">
      <strong>Status:</strong>
      <Link href={{ pathname: "/admin/notifications", query: filter.query }} aria-current={!selected ? "page" : undefined}>All</Link>
      {statusOrder.map(item => (
        <Link key={item} href={{ pathname: "/admin/notifications", query: { status: item, ...filter.query } }} aria-current={selected === item ? "page" : undefined}>
          {item} ({counts.get(item) ?? 0})
        </Link>
      ))}
    </div>

    <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Notification delivery records">
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Recipient</th>
            <th>Message</th>
            <th>Related record</th>
            <th>Attempts</th>
            <th>Next / sent (IST)</th>
            <th>Provider ID</th>
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
              <td><small>{notification.providerMessageId ?? "—"}</small></td>
              <td>
                <small>{notification.failureReason ?? "—"}</small>
                {canManageNotifications && notification.status === NotificationStatus.FAILED && (
                  <form action={requeueFailedNotification} className="admin-inline-form">
                    <input type="hidden" name="id" value={notification.id} />
                    <input type="hidden" name="expectedUpdatedAt" value={notification.updatedAt.toISOString()} />
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
