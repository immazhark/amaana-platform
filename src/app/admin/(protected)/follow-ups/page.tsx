import Link from "@/components/navigation-link";
import { AssistanceFollowUpState, AssistanceStatus, type Prisma } from "@prisma/client";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import { followUpDueLabel, indiaCalendarDay } from "@/lib/assistance-follow-up";

type Props = { searchParams: Promise<{
  view?: string | string[]; window?: string | string[]; page?: string | string[];
  state?: string | string[]; cases?: string | string[];
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
  const state = params.state === "COMPLETED" || params.state === "CANCELLED" ? params.state : "OPEN";
  const caseScope = params.cases === "active" || params.cases === "inactive" || params.cases === "all"
    ? params.cases : state === "OPEN" ? "active" : "all";
  const period = state !== "OPEN" ? "all" : params.window === "all" || params.window === "upcoming" ? params.window : "due";
  const today = indiaCalendarDay(new Date());
  const date = new Date(`${today}T00:00:00.000Z`);

  const where: Prisma.AssistanceFollowUpWhereInput = {
    state,
    assistanceRequest: caseScope === "active" ? {
      status: { in: activeCaseStatuses }, appealId: null,
    } : caseScope === "inactive" ? {
      OR: [{ status: { notIn: activeCaseStatuses } }, { appealId: { not: null } }],
    } : {},
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
      id: true, summary: true, dueOn: true, createdAt: true, state: true, resolvedAt: true,
      assignedTo: { select: { name: true } },
      assistanceRequest: {
        select: { id: true, referenceNumber: true, category: true, city: true, status: true },
      },
    },
    orderBy: state === "OPEN" ? [{ dueOn: "asc" }, { createdAt: "asc" }, { id: "asc" }]
      : [{ resolvedAt: { sort: "desc", nulls: "last" } }, { id: "desc" }],
    skip: pagination.skip, take: pagination.pageSize,
  });
  const destination = (next: { view?: "mine" | "team"; window?: "due" | "upcoming" | "all"; page?: number;
    state?: AssistanceFollowUpState; cases?: "active" | "inactive" | "all" }) => {
    const nextState = next.state ?? state;
    const nextCases = next.cases ?? (next.state && next.state !== state ? (nextState === "OPEN" ? "active" : "all") : caseScope);
    const nextWindow = nextState === "OPEN" ? next.window ?? (next.state && next.state !== state ? "due" : period) : "all";
    return {
      pathname: "/admin/follow-ups",
      query: {
        ...((next.view ?? view) === "team" ? { view: "team" } : {}),
        ...(nextState !== "OPEN" ? { state: nextState } : {}),
        ...(nextCases !== (nextState === "OPEN" ? "active" : "all") ? { cases: nextCases } : {}),
        ...(nextState === "OPEN" && nextWindow !== "due" ? { window: nextWindow } : {}),
        ...(next.page && next.page > 1 ? { page: next.page } : {}),
      },
    };
  };
  return <>
    <div className="admin-heading">
      <div>
        <p className="eyebrow">Private operational workboard</p>
        <h1>Next staff actions</h1>
        <p className="muted">Work selected by the team, not inferred urgency or an SLA.
          Open tasks default to active cases. Completed and cancelled history also includes closed or converted cases; filters never change a case or task.
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
    <nav className="filter-row" aria-label="Follow-up lifecycle">
      <strong>Task state:</strong>
      {(["OPEN", "COMPLETED", "CANCELLED"] as const).map(item => <Link key={item}
        href={destination({ state: item })} aria-current={state === item ? "page" : undefined}>
        {item === "OPEN" ? "Open" : item === "COMPLETED" ? "Completed" : "Cancelled"}
      </Link>)}
    </nav>
    <nav className="filter-row" aria-label="Follow-up case scope">
      <strong>Case scope:</strong>
      {(["active", "inactive", "all"] as const).map(item => <Link key={item}
        href={destination({ cases: item })} aria-current={caseScope === item ? "page" : undefined}>
        {item === "active" ? "Active cases" : item === "inactive" ? "Closed or converted cases" : "All cases"}
      </Link>)}
    </nav>
    {state === "OPEN" && <nav className="filter-row" aria-label="Staff-selected follow-up dates">
      <strong>Selected date:</strong>
      {(["due", "upcoming", "all"] as const).map(item =>
        <Link key={item} href={destination({ view, window: item })}
          aria-current={period === item ? "page" : undefined}>
          {item === "due" ? "Today or earlier" :
            item === "upcoming" ? "Upcoming" : "All open actions"}
        </Link>)}
    </nav>}
    {state !== "OPEN" && <p className="muted">History is ordered by recorded resolution time. Completion records a staff task outcome, not verified aid delivery or beneficiary impact.</p>}
    <div className="admin-table-wrap" tabIndex={0} role="region"
      aria-label="Private follow-up tasks">
      <table>
        <thead><tr><th>Staff-selected date</th><th>Private next action</th>
          <th>Case</th><th>Responsible staff</th><th>Task record</th><th>Open case</th></tr></thead>
        <tbody>{tasks.map(task => <tr key={task.id}>
          <td>{task.dueOn.toLocaleDateString("en-IN", { timeZone: "UTC", dateStyle: "medium" })}
            <small>{followUpDueLabel(task.state, task.dueOn, today)}</small></td>
          <td>{task.summary}</td>
          <td>{task.assistanceRequest.referenceNumber}
            <small>{task.assistanceRequest.category.replaceAll("_", " ")} · {task.assistanceRequest.city}</small>
            <small>{task.assistanceRequest.status?.replaceAll("_", " ")}</small></td>
          <td>{task.assignedTo.name}</td>
          <td>{task.state === "OPEN" ? "Open" : task.state === "COMPLETED" ? "Completed" : "Cancelled"}
            {task.state !== "OPEN" && <small>{task.resolvedAt ? task.resolvedAt.toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST" : "Resolution time not recorded"}</small>}
          </td>
          <td><Link href={`/admin/requests/${task.assistanceRequest.id}`}>View case</Link></td>
        </tr>)}</tbody>
      </table>
      {tasks.length === 0 && <p className="empty-state">No actions match this view.
        Change the task state, case scope or responsibility filter to see other tasks.</p>}
    </div>
    <nav className="filter-row" aria-label="Follow-up workboard pagination">
      {pagination.hasPrevious && <Link href={destination({ view, window: period, page: pagination.page - 1 })}>Previous</Link>}
      <span>Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} tasks</span>
      {pagination.hasNext && <Link href={destination({ view, window: period, page: pagination.page + 1 })}>Next</Link>}
    </nav>
  </>;
}
