import Link from "@/components/navigation-link";
import { NotificationStatus, type Prisma } from "@prisma/client";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import { hasPermission, requirePermission } from "@/lib/auth";
import { enqueueControlledEmailAcceptance, requeueFailedNotification } from "./actions";
import { prisma } from "@/lib/prisma";
import {
  notificationAttentionQueries,
  notificationOperationalState,
} from "@/lib/operational-signals";

type Props = { searchParams: Promise<{ status?: string; page?: string; view?: string }> };

const statusOrder = [
  NotificationStatus.FAILED,
  NotificationStatus.PROCESSING,
  NotificationStatus.PENDING,
  NotificationStatus.SENT,
  NotificationStatus.CANCELLED,
];

function formatDateTime(value: Date | null) {
  return value ? value.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST" : "—";
}

function deliveryScheduleLabel(status: NotificationStatus, scheduledFor: Date, sentAt: Date | null) {
  if (status === NotificationStatus.SENT) return formatDateTime(sentAt);
  if (status === NotificationStatus.FAILED && scheduledFor.getUTCFullYear() >= 9999) return "Manual attention required";
  return formatDateTime(scheduledFor);
}

export default async function NotificationOperationsPage({ searchParams }: Props) {
  const user = await requirePermission("notification.view");
  const canManageNotifications = hasPermission(user, "notification.manage");
  const { status, page: pageParam, view: viewParam } = await searchParams;
  const selected = Object.values(NotificationStatus).includes(status as NotificationStatus)
    ? status as NotificationStatus
    : undefined;
  const attentionQueries = notificationAttentionQueries(new Date());
  const view = viewParam === "staleProcessing" || viewParam === "overdueDue" || viewParam === "terminalFailures" ? viewParam : undefined;
  const where: Prisma.NotificationWhereInput | undefined = view
    ? { AND: [attentionQueries[view], ...(selected ? [{ status: selected }] : [])] }
    : selected ? { status: selected } : undefined;
  const [totalItems, grouped, staleProcessing, overdueDue, terminalFailures] = await Promise.all([
    prisma.notification.count({ where }),
    prisma.notification.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.notification.count({ where: attentionQueries.staleProcessing }),
    prisma.notification.count({ where: attentionQueries.overdueDue }),
    prisma.notification.count({ where: attentionQueries.terminalFailures }),
  ]);
  const operational = notificationOperationalState({ staleProcessing, overdueDue, terminalFailures });

  const pagination = getAdminPagination(totalItems, parseAdminPage(pageParam));
  const notifications = await prisma.notification.findMany({
    where,
    select: {
      id: true,
      status: true,
      channel: true,
      recipient: true,
      templateKey: true,
      subject: true,
      attempts: true,
      failureReason: true,
      scheduledFor: true,
      sentAt: true,
      providerMessageId: true,
      updatedAt: true,
      assistanceRequestId: true,
      donationId: true,
      assistanceRequest: { select: { referenceNumber: true } },
      donation: { select: { referenceNumber: true } },
    },
    orderBy: view === "staleProcessing" ? [{ updatedAt: "asc" }, { id: "asc" }]
      : view === "overdueDue" ? [{ scheduledFor: "asc" }, { id: "asc" }]
      : view === "terminalFailures" ? [{ updatedAt: "desc" }, { id: "desc" }]
      : [{ status: "asc" }, { createdAt: "desc" }, { id: "desc" }],
    skip: pagination.skip,
    take: pagination.pageSize,
  });

  const counts = new Map(grouped.map(item => [item.status, item._count._all]));
  const pageHref = (targetPage: number) => ({
    pathname: "/admin/notifications",
    query: { ...(selected ? { status: selected } : {}), ...(view ? { view } : {}), page: targetPage },
  });

  const statusHref = (value?: NotificationStatus) => {
    const query = new URLSearchParams();
    if (view) query.set("view", view);
    if (value) query.set("status", value);
    return `/admin/notifications${query.size ? `?${query}` : ""}`;
  };
  const viewLabels = {
    staleProcessing: "Processing longer than 15 minutes",
    overdueDue: "Due email jobs overdue by 15+ minutes",
    terminalFailures: "Terminal failures requiring manual review",
  };
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
        <span className="status-badge">{operational.status === "healthy" ? "HEALTHY" : `${operational.attention} NEED ATTENTION`}</span>
      </div>
      <div className="card-grid">
        <article className="card"><strong>{operational.staleProcessing}</strong><p>Processing longer than 15 minutes</p><Link href="/admin/notifications?view=staleProcessing">Review stalled jobs</Link></article>
        <article className="card"><strong>{operational.overdueDue}</strong><p>Due email jobs overdue by 15+ minutes</p><Link href="/admin/notifications?view=overdueDue">Review overdue jobs</Link></article>
        <article className="card"><strong>{operational.terminalFailures}</strong><p>Terminal failures requiring manual review</p><Link href="/admin/notifications?view=terminalFailures">Review terminal failures</Link></article>
      </div>
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

    {view && <section className="admin-card" aria-label="Selected attention queue">
      <h2>{viewLabels[view]}</h2>
      <p>Showing {totalItems} matching records{selected ? ` with status ${selected}` : ""}. Status totals below cover all delivery records.</p>
      {view === "staleProcessing" && <p>Processing jobs require worker recovery and provider-state review. This view does not restart an in-flight delivery.</p>}
      <Link href="/admin/notifications">Show all delivery records</Link>
    </section>}
    <div className="filter-row" role="group" aria-label="Notification status filter">
      <strong>Status:</strong>
      <Link href={statusHref()} aria-current={!selected ? "page" : undefined}>All</Link>
      {statusOrder.map(item => (
        <Link key={item} href={statusHref(item)} aria-current={selected === item ? "page" : undefined}>
          {item} ({counts.get(item) ?? 0})
        </Link>
      ))}
    </div>

    <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Notification delivery records">
      <table>
        <thead>
          <tr>
            <th>Status</th>
            <th>Channel</th>
            <th>Recipient</th>
            <th>Message</th>
            <th>Related record</th>
            <th>Attempts</th>
            <th>Next / sent</th>
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
              <td>{notification.channel}</td>
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
                {canManageNotifications && notification.channel === "EMAIL" && notification.status === NotificationStatus.FAILED && (
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
