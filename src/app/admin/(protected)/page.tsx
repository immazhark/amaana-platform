import Link from "@/components/navigation-link";
import { redirect } from "next/navigation";
import {
  ASSISTANCE_QUEUE_STATUSES, assistanceQueueAge, assistanceQueueAgeWhere, assistanceQueueAssignmentWhere,
  assistanceQueueDeliveryWhere, assistanceQueueFollowUpWhere, assistanceQueueHref, assistanceQueueReviewWhere, assistanceQueueVerificationLabel, parseAssistanceQueueFilters,
} from "@/lib/assistance-queue";
import { adminHomePathForPermissions } from "@/lib/admin-navigation";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import { hasPermission, permissionKeys, requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PRIVATE_MILESTONE_ACTION } from "@/lib/assistance-private-milestone";
import { indiaCalendarDay } from "@/lib/assistance-follow-up";

type Props = { searchParams: Promise<{
  status?: string | string[]; page?: string | string[];
  assignment?: string | string[]; order?: string | string[]; age?: string | string[]; review?: string | string[]; city?: string | string[]; followUp?: string | string[]; delivery?: string | string[];
}> };

export default async function AdminQueuePage({ searchParams }: Props) {
  const user = await requireAuthenticatedUser();
  if (!hasPermission(user, "assistance.view")) redirect(adminHomePathForPermissions(permissionKeys(user)));
  const params = await searchParams;
  const filters = parseAssistanceQueueFilters(params);
  const now = new Date();
  const localToday = indiaCalendarDay(now);
  const assignmentWhere = assistanceQueueAssignmentWhere(filters.assignment, user.id);
  const scopedWhere = {
    ...assignmentWhere, ...assistanceQueueAgeWhere(filters.age, now),
    ...assistanceQueueReviewWhere(filters.review),
    ...assistanceQueueFollowUpWhere(filters.followUp, localToday, user.id),
    ...assistanceQueueDeliveryWhere(filters.delivery),
    ...(filters.city ? { city: filters.city } : {}),
  };
  const where = { ...scopedWhere, ...(filters.status ? { status: filters.status } : {}) };
  const [totalItems, grouped, cityCounts] = await Promise.all([
    prisma.assistanceRequest.count({ where }),
    prisma.assistanceRequest.groupBy({ where: scopedWhere, by: ["status"], _count: { _all: true } }),
    // Only self-reported city names within the operator's assignment scope.
    // Keep the selector bounded, and never fetch applicant names or addresses.
    prisma.assistanceRequest.groupBy({
      where: assignmentWhere, by: ["city"], orderBy: { city: "asc" },
      _count: { _all: true }, take: 100,
    }),
  ]);
  const pagination = getAdminPagination(totalItems, parseAdminPage(typeof params.page === "string" ? params.page : undefined));
  const requests = await prisma.assistanceRequest.findMany({
    where,
    select: {
      id: true, referenceNumber: true, applicantName: true, city: true,
      category: true, status: true, createdAt: true,
      assignedTo: { select: { name: true } },
      verification: { select: { decision: true, completedAt: true } },
      _count: { select: { documents: true } },
    },
    orderBy: filters.order === "oldest"
      ? [{ createdAt: "asc" }, { id: "asc" }]
      : [{ createdAt: "desc" }, { id: "desc" }],
    skip: pagination.skip,
    take: pagination.pageSize,
  });
  const dueTasks = requests.length ? await prisma.assistanceFollowUp.groupBy({
    by: ["assistanceRequestId"],
    where: { assistanceRequestId: { in: requests.map(request => request.id) }, state: "OPEN" },
    _count: { _all: true }, _min: { dueOn: true },
  }) : [];
  const tasksByCase = new Map(dueTasks.map(task => [task.assistanceRequestId, task]));
  const deliveryCounts = requests.length ? await prisma.assistanceDeliveryRecord.groupBy({
    by: ["assistanceRequestId", "state"],
    where: {
      assistanceRequestId: { in: requests.map(request => request.id) },
      state: { in: ["REPORTED", "CONFIRMED"] },
    },
    _count: { _all: true },
  }) : [];
  const deliveryByCase = new Map<string, { reported: number; confirmed: number }>();
  for (const row of deliveryCounts) {
    const counts = deliveryByCase.get(row.assistanceRequestId) ?? { reported: 0, confirmed: 0 };
    if (row.state === "REPORTED") counts.reported = row._count._all;
    if (row.state === "CONFIRMED") counts.confirmed = row._count._all;
    deliveryByCase.set(row.assistanceRequestId, counts);
  }
  const myOpenTasks = requests.length ? await prisma.assistanceFollowUp.groupBy({
    by: ["assistanceRequestId"],
    where: {
      assistanceRequestId: { in: requests.map(request => request.id) },
      assignedToId: user.id, state: "OPEN",
    },
    _count: { _all: true },
  }) : [];
  const myTasksByCase = new Map(myOpenTasks.map(task => [task.assistanceRequestId, task._count._all]));
  const recentFollowUps = requests.length ? await prisma.auditEvent.groupBy({
    by: ["entityId"],
    where: {
      entityType: "AssistanceRequest", action: PRIVATE_MILESTONE_ACTION,
      entityId: { in: requests.map(request => request.id) },
    },
    _count: { _all: true },
    _max: { createdAt: true },
  }) : [];
  const followUpsByCase = new Map(recentFollowUps.map(item => [item.entityId, item]));
  const counts = new Map(grouped.map(item => [item.status, item._count._all]));
  const assignmentChoices = [
    { value: "all", label: "All assignments" },
    { value: "mine", label: "Assigned to me" },
    { value: "unassigned", label: "Unassigned" },
  ] as const;

  return <>
    <div className="admin-heading"><div><p className="eyebrow">Case management</p><h1>Assistance queue</h1></div></div>
    <p className="muted"><Link href="/admin/follow-ups">Open the private next-action workboard</Link></p>
    <p className="muted">Filter by assignment, reported city, verification, private delivery evidence, follow-up dates or elapsed age. Review the oldest requests first when useful. Follow-up log counts include entries later redacted from case view. Age is time since receipt, not a response deadline, verified urgency, or SLA breach. City is not a verified service-zone assignment.</p>
    <div className="filter-row" role="group" aria-label="Assistance request assignment filter"><strong>Assignment:</strong>{assignmentChoices.map(item => <Link key={item.value} href={assistanceQueueHref({ ...filters, assignment: item.value })} aria-current={filters.assignment === item.value ? "page" : undefined}>{item.label}</Link>)}</div>
    <div className="filter-row" role="group" aria-label="Assistance request order"><strong>Order:</strong>{(["newest", "oldest"] as const).map(order => <Link key={order} href={assistanceQueueHref({ ...filters, order })} aria-current={filters.order === order ? "page" : undefined}>{order === "oldest" ? "Oldest first" : "Newest first"}</Link>)}</div>
    <form method="get" action="/admin" className="filter-row" aria-label="Filter assistance requests by reported city">
      <label htmlFor="assistance-queue-city"><strong>Reported city:</strong></label>
      {filters.status && <input type="hidden" name="status" value={filters.status}/>}
      {filters.assignment !== "all" && <input type="hidden" name="assignment" value={filters.assignment}/>}
      {filters.order !== "newest" && <input type="hidden" name="order" value={filters.order}/>}
      {filters.age !== "all" && <input type="hidden" name="age" value={filters.age}/>}
      {filters.review !== "all" && <input type="hidden" name="review" value={filters.review}/>}
      {filters.followUp !== "all" && <input type="hidden" name="followUp" value={filters.followUp}/>}
      {filters.delivery !== "all" && <input type="hidden" name="delivery" value={filters.delivery}/>}
      <select id="assistance-queue-city" name="city" defaultValue={filters.city ?? ""}>
        <option value="">All reported cities</option>
        {filters.city && !cityCounts.some(item => item.city === filters.city) &&
          <option value={filters.city}>{filters.city} (outside current selector)</option>}
        {cityCounts.map(item => <option key={item.city} value={item.city}>
          {item.city} ({item._count._all})
        </option>)}
      </select>
      <button type="submit" className="button secondary">Apply city</button>
    </form>
    <div className="filter-row" role="group" aria-label="Assistance request age filter">
      <strong>Received:</strong>{([
        { value: "all", label: "Any time" },
        { value: "7d", label: "At least 7 days ago" },
        { value: "30d", label: "At least 30 days ago" },
      ] as const).map(item => <Link key={item.value} href={assistanceQueueHref({ ...filters, age: item.value })} aria-current={filters.age === item.value ? "page" : undefined}>{item.label}</Link>)}
    </div>
    <div className="filter-row" role="group" aria-label="Assistance verification completion filter">
      <strong>Verification:</strong>{([
        { value: "all", label: "Any review state" },
        { value: "incomplete", label: "No completed review" },
        { value: "complete", label: "Review completed" },
      ] as const).map(item => <Link key={item.value} href={assistanceQueueHref({ ...filters, review: item.value })} aria-current={filters.review === item.value ? "page" : undefined}>{item.label}</Link>)}
    </div>
    <div className="filter-row" role="group" aria-label="Private follow-up task filter">
      <strong>Next actions:</strong>{([
        { value: "all", label: "All tasks" },
        { value: "due", label: "Selected date reached" },
        { value: "open", label: "Has open tasks" },
        { value: "mine", label: "My assigned tasks" },
        { value: "none", label: "No open tasks" },
      ] as const).map(item => <Link key={item.value}
        href={assistanceQueueHref({ ...filters, followUp: item.value })}
        aria-current={filters.followUp === item.value ? "page" : undefined}>{item.label}</Link>)}
    </div>
    <div className="filter-row" role="group" aria-label="Private delivery evidence review filter">
      <strong>Support evidence:</strong>{([
        { value: "all", label: "All delivery states" },
        { value: "reported", label: "Awaiting independent review" },
        { value: "confirmed", label: "Evidence reviewed" },
        { value: "none", label: "No active delivery record" },
      ] as const).map(item =>
        <Link key={item.value} href={assistanceQueueHref({ ...filters, delivery: item.value })}
          aria-current={filters.delivery === item.value ? "page" : undefined}>{item.label}</Link>)}
    </div>
    <div className="filter-row" role="group" aria-label="Assistance request status filter"><strong>Status:</strong><Link href={assistanceQueueHref({ ...filters, status: undefined })} aria-current={!filters.status ? "page" : undefined}>All</Link>{ASSISTANCE_QUEUE_STATUSES.map(item => <Link key={item} href={assistanceQueueHref({ ...filters, status: item })} aria-current={filters.status === item ? "page" : undefined}>{item.replaceAll("_", " ")} ({counts.get(item) ?? 0})</Link>)}</div>
    <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Operational records"><table><thead><tr><th>Reference</th><th>Applicant</th><th>Category</th><th>Status</th><th>Verification</th><th>Assigned to</th><th>Documents</th><th>Follow-up logs</th><th>Open tasks</th><th>My tasks</th><th>Delivery reports pending</th><th>Delivery reports historically reviewed</th><th>Next staff-set date</th><th>Received</th><th>Request age</th></tr></thead><tbody>{requests.map(item => {
      const tasks = tasksByCase.get(item.id);
      const due = tasks?._min.dueOn;
      const followUp = followUpsByCase.get(item.id);
      return <tr key={item.id}><td><Link href={`/admin/requests/${item.id}`}><strong>{item.referenceNumber}</strong></Link></td><td>{item.applicantName}<br/><small>{item.city}</small></td><td>{item.category.replaceAll("_", " ")}</td><td><span className="status-badge">{item.status.replaceAll("_", " ")}</span></td><td>{assistanceQueueVerificationLabel(item.verification)}</td><td>{item.assignedTo?.name ?? "Unassigned"}</td><td>{item._count.documents}</td>
          <td>{followUp?._count._all ?? 0} · {followUp?._max.createdAt?.toLocaleDateString("en-IN") ?? "No recent update"}</td>
          <td>{tasks?._count._all ?? 0}</td>
          <td>{myTasksByCase.get(item.id) ?? 0}</td>
          <td>{deliveryByCase.get(item.id)?.reported ?? 0}</td>
          <td>{deliveryByCase.get(item.id)?.confirmed ?? 0}</td>
          <td>{due
            ? <span>{due.toLocaleDateString("en-IN", { timeZone: "UTC" })}
                {" · "}{due.toISOString().slice(0, 10) < localToday ? "Past selected date" : "Upcoming / today"}</span>
            : "None"}</td>
          <td>{item.createdAt.toLocaleDateString("en-IN")}</td><td>{assistanceQueueAge(item.createdAt, now)}</td></tr>;
    })}</tbody></table>{requests.length === 0 && <p className="empty-state">No requests match this view.</p>}</div>
    <nav className="filter-row" aria-label="Assistance request pagination">
      {pagination.hasPrevious && <Link href={assistanceQueueHref(filters, pagination.page - 1)}>Previous</Link>}
      <span>Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} records</span>
      {pagination.hasNext && <Link href={assistanceQueueHref(filters, pagination.page + 1)}>Next</Link>}
    </nav>
  </>;
}
