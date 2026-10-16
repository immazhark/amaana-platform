import Link from "@/components/navigation-link";
import { AssistanceFollowUpState, AssistanceStatus, type Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import { followUpDueLabel, indiaCalendarDay } from "@/lib/assistance-follow-up";

type Props = { searchParams: Promise<{
  view?: string | string[]; window?: string | string[]; page?: string | string[];
}> };

const activeCaseStatuses = [
  AssistanceStatus.SUBMITTED,
  AssistanceStatus.DOCUMENTS_REQUESTED,
  AssistanceStatus.UNDER_VERIFICATION,
  AssistanceStatus.APPROVED,
];

export default async function AssistanceFollowUpWorkboard({ searchParams }: Props) {
  const user = await requirePermission("assistance.view");
  const params = await searchParams;
  const view = params.view === "team" ? "team" : "mine";
  const period = params.window === "all" || params.window === "upcoming" ? params.window : "due";
  const today = indiaCalendarDay(new Date());
  const date = new Date(`${today}T00:00:00.000Z`);

  const where: Prisma.AssistanceFollowUpWhereInput = {
    state: AssistanceFollowUpState.OPEN,
    assistanceRequest: {
      status: { in: activeCaseStatuses },
      appealId: null,
    },
    ...(view === "mine" ? { assignedToId: user.id } : {}),
    ...(period === "due" ? { dueOn: { lte: date } } :
      period === "upcoming" ? { dueOn: { gt: date } } : {}),
  };
  const count = await prisma.assistanceFollowUp.count({ where });
  const pagination = getAdminPagination(count,
    parseAdminPage(typeof params.page === "string" ? params.page : undefined), 25);
  const tasks = await prisma.assistanceFollowUp.findMany({
    where,
    select: {
      id: true, summary: true, dueOn: true, createdAt: true, state: true,
      assignedTo: { select: { name: true } },
      assistanceRequest: {
        select: { id: true, referenceNumber: true, category: true, city: true },
      },
    },
    orderBy: [{ dueOn: "asc" }, { createdAt: "asc" }, { id: "asc" }],
    skip: pagination.skip, take: pagination.pageSize,
  });
  const destination = (next: { view?: "mine" | "team"; window?: "due" | "upcoming" | "all"; page?: number }) => ({
    pathname: "/admin/follow-ups",
    query: {
      ...(next.view === "team" ? { view: "team" } : {}),
      ...(next.window !== "due" ? { window: next.window } : {}),
      ...(next.page && next.page > 1 ? { page: next.page } : {}),
    },
  });
  return <>
    <div className="admin-heading">
      <div>
        <p className="eyebrow">Private operational workboard</p>
        <h1>Next staff actions</h1>
        <p className="muted">Work selected by the team, not inferred urgency or an SLA.
          Only unresolved actions on active assistance cases are displayed.
          Full records and changes remain inside the protected case view.</p>
      </div>
      <Link className="button secondary" href="/admin">Assistance queue</Link>
    </div>
    <nav className="filter-row" aria-label="Workboard owner view">
      <strong>Responsibility:</strong>
      {(["mine", "team"] as const).map(item =>
        <Link key={item} href={destination({ view: item, window: period })}
          aria-current={view === item ? "page" : undefined}>
          {item === "mine" ? "Assigned to me" : "Whole team"}
        </Link>)}
    </nav>
    <nav className="filter-row" aria-label="Staff-selected follow-up dates">
      <strong>Selected date:</strong>
      {(["due", "upcoming", "all"] as const).map(item =>
        <Link key={item} href={destination({ view, window: item })}
          aria-current={period === item ? "page" : undefined}>
          {item === "due" ? "Today or earlier" :
            item === "upcoming" ? "Upcoming" : "All open actions"}
        </Link>)}
    </nav>
    <div className="admin-table-wrap" tabIndex={0} role="region"
      aria-label="Private follow-up tasks">
      <table>
        <thead><tr><th>Staff-selected date</th><th>Private next action</th>
          <th>Case</th><th>Responsible staff</th><th>Open case</th></tr></thead>
        <tbody>{tasks.map(task => <tr key={task.id}>
          <td>{task.dueOn.toLocaleDateString("en-IN", { timeZone: "UTC", dateStyle: "medium" })}
            <small>{followUpDueLabel(task.state, task.dueOn, today)}</small></td>
          <td>{task.summary}</td>
          <td>{task.assistanceRequest.referenceNumber}
            <small>{task.assistanceRequest.category.replaceAll("_", " ")} · {task.assistanceRequest.city}</small></td>
          <td>{task.assignedTo.name}</td>
          <td><Link href={`/admin/requests/${task.assistanceRequest.id}`}>View case</Link></td>
        </tr>)}</tbody>
      </table>
      {tasks.length === 0 && <p className="empty-state">No open actions match this view.
        Change the selected date or responsibility filter to see other tasks.</p>}
    </div>
    <nav className="filter-row" aria-label="Follow-up workboard pagination">
      {pagination.hasPrevious && <Link href={destination({ view, window: period, page: pagination.page - 1 })}>Previous</Link>}
      <span>Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} tasks</span>
      {pagination.hasNext && <Link href={destination({ view, window: period, page: pagination.page + 1 })}>Next</Link>}
    </nav>
  </>;
}
