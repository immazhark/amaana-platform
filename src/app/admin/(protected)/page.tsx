import Link from "next/link";
import { redirect } from "next/navigation";
import { AppealCategory, AssistanceStatus } from "@prisma/client";
import { adminHomePathForPermissions } from "@/lib/admin-navigation";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import { adminRecordView, assistanceAdminWhere } from "@/lib/admin-record-visibility";
import { hasPermission, permissionKeys, requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import { assistanceWorkload } from "@/lib/assistance-workload";
import { assistanceCaseHref, assistanceQueueCategory } from "@/lib/assistance-queue-navigation";
import { DECISION_COHORT_DAYS, loadAssistanceDecisionBreakdown } from "@/lib/assistance-decision-report";
import { capacityRemaining, capacityUsed, isIntakePaused } from "@/lib/assistance-capacity";
import { INDIVIDUAL_CASE_ANNUAL_CAPACITY } from "@/lib/assistance-policy";
import { setAssistanceIntakeAction } from "./intake-actions";

type Props = { searchParams: Promise<{ status?: string; page?: string; view?: string; sort?: string | string[]; assignment?: string | string[]; category?: string | string[] }> };
const allowed = Object.values(AssistanceStatus);

export default async function AdminQueuePage({ searchParams }: Props) {
  const user = await requireAuthenticatedUser();
  if (!hasPermission(user, "assistance.view")) redirect(adminHomePathForPermissions(permissionKeys(user)));
  const { status, page: pageParam, view: requestedView, sort: requestedSort, assignment: requestedAssignment, category: requestedCategory } = await searchParams;
  const view = adminRecordView(requestedView);
  const oldestFirst = requestedSort === "oldest";
  const direction = oldestFirst ? "asc" : "desc";
  const selected = allowed.includes(status as AssistanceStatus) ? status as AssistanceStatus : undefined;
  const unassignedOnly = requestedAssignment === "unassigned";
  const mineOnly = requestedAssignment === "mine";
  const category = assistanceQueueCategory(requestedCategory);
  const categoryScope = { ...assistanceAdminWhere(view), ...(category ? { category } : {}) };
  const scope = { ...categoryScope, ...(unassignedOnly ? { assignedToId: null } : mineOnly ? { assignedToId: user.id } : {}) };
  const where = { ...scope, ...(selected ? { status: selected } : {}) };
  const [used, paused, workload, report] = await Promise.all([capacityUsed(prisma), isIntakePaused(prisma), assistanceWorkload(prisma, categoryScope, user.id), loadAssistanceDecisionBreakdown(prisma, view).catch(() => {
    logServerError("assistance.decision_report_unavailable");
    return null;
  })]);
  const decisions = report?.totals ?? null;
  const decisionCategories = report?.categories ?? null;
  const canApprove = hasPermission(user, "assistance.approve");
  const [totalItems, grouped] = await Promise.all([
    prisma.assistanceRequest.count({ where }),
    prisma.assistanceRequest.groupBy({ by: ["status"], where: scope, _count: { _all: true } }),
  ]);
  const pagination = getAdminPagination(totalItems, parseAdminPage(pageParam));
  const requests = await prisma.assistanceRequest.findMany({
    where,
    select: {
      id: true,
      referenceNumber: true,
      applicantName: true,
      city: true,
      category: true,
      status: true,
      createdAt: true,
      assignedTo: { select: { name: true } },
      _count: { select: { documents: true } },
    },
    orderBy: [{ createdAt: direction }, { id: direction }],
    skip: pagination.skip,
    take: pagination.pageSize,
  });
  const counts = new Map(grouped.map(item => [item.status, item._count._all]));
  const viewQuery = view === "tests" ? { view: "tests" } : {};
  const sortQuery = oldestFirst ? { sort: "oldest" } : {};
  const statusQuery = selected ? { status: selected } : {};
  const assignmentQuery = unassignedOnly ? { assignment: "unassigned" } : mineOnly ? { assignment: "mine" } : {};
  const categoryQuery = category ? { category } : {};
  const filterQuery = { ...viewQuery, ...sortQuery, ...assignmentQuery, ...categoryQuery };
  const caseFilters = { ...filterQuery, ...statusQuery, ...(pagination.page > 1 ? { page: String(pagination.page) } : {}) };
  const pageHref = (targetPage: number) => ({
    pathname: "/admin",
    query: { ...filterQuery, ...statusQuery, page: targetPage },
  });

  const stageHref = (stage: AssistanceStatus, assignment?: "mine" | "unassigned") => ({
    pathname: "/admin",
    query: { ...viewQuery, ...categoryQuery, sort: "oldest", ...(assignment ? { assignment } : {}), status: stage },
  });
  const stageLabels = { SUBMITTED: "Submitted", DOCUMENTS_REQUESTED: "Documents requested", UNDER_VERIFICATION: "Under verification" } as const;
  const ageLabel = (days: number | null) => days === null ? "No receipt age" : `Oldest received ${days} ${days === 1 ? "day" : "days"} ago`;

  return <>
    <div className="admin-heading"><div><p className="eyebrow">Case management</p><h1>Assistance queue</h1></div></div>
    <section className="card" aria-labelledby="capacity-heading">
      <h2 id="capacity-heading">Intake and annual capacity</h2>
      <p>{used} of {INDIVIDUAL_CASE_ANNUAL_CAPACITY} individual cases taken up this calendar year ({capacityRemaining(used)} places left). A maximum, not a commitment. Counted when a case is approved; annual distributions and Taleem sponsorships are separate.</p>
      <p>{workload.submitted} submitted {workload.submitted === 1 ? "request" : "requests"}{workload.oldestSubmittedAgeDays !== null && <> (oldest received {workload.oldestSubmittedAgeDays} {workload.oldestSubmittedAgeDays === 1 ? "day" : "days"} ago)</>}; {workload.openUnassigned} of {workload.open} open requests have no assignee. Workload counts cover this record view and selected category before status and assignment filters; annual capacity remains foundation-wide. No response time is promised to applicants.</p>
      <p>New requests are <strong>{paused ? "paused" : "open"}</strong>. Intake never reopens by itself at a year boundary.</p>
      {canApprove && <form action={setAssistanceIntakeAction}><input type="hidden" name="paused" value={paused ? "false" : "true"} /><button className="button" type="submit">{paused ? "Reopen new requests" : "Pause new requests"}</button></form>}
    </section>
    <section className="admin-card" aria-labelledby="reviewer-workbench-heading">
      <h2 id="reviewer-workbench-heading">Reviewer workbench</h2>
      <p className="muted">{workload.openMine} open {workload.openMine === 1 ? "request" : "requests"} assigned to you. Counts cover the selected record view and category. Open a stage to review the oldest received cases first. Receipt age is not time in the current stage or a promised response time.</p>
      <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Open assistance workload by stage">
        <table className="admin-table">
          <thead><tr><th scope="col">Current stage</th><th scope="col">All open</th><th scope="col">Assigned to me</th><th scope="col">Unassigned</th></tr></thead>
          <tbody>{workload.stages.map(stage => <tr key={stage.status}>
            <th scope="row">{stageLabels[stage.status]}</th>
            {(["total", "mine", "unassigned"] as const).map(kind => <td key={kind}>
              {stage[kind].count > 0 ? <Link href={stageHref(stage.status, kind === "total" ? undefined : kind)} aria-label={`${stage[kind].count} ${stageLabels[stage.status]} requests, ${kind === "total" ? "all assignments" : kind === "mine" ? "assigned to me" : "unassigned"}, oldest first`}>{stage[kind].count}</Link> : "0"}
              <br /><small>{ageLabel(stage[kind].oldestAgeDays)}</small>
            </td>)}
          </tr>)}</tbody>
        </table>
      </div>
    </section>
    <div className="filter-row" role="group" aria-label="Record visibility"><strong>Records:</strong><Link href={{ pathname: "/admin", query: { ...sortQuery, ...assignmentQuery, ...categoryQuery } }} aria-current={view === "live" ? "page" : undefined}>Live records</Link><Link href={{ pathname: "/admin", query: { ...sortQuery, ...assignmentQuery, ...categoryQuery, view: "tests" } }} aria-current={view === "tests" ? "page" : undefined}>Historical tests</Link></div>
    {view === "tests" && <p className="muted">Retained staging acceptance records only. Related payment and refund history remains available for audit.</p>}
    <div className="filter-row" role="group" aria-label="Assistance request status filter"><strong>Status:</strong><Link href={{ pathname: "/admin", query: filterQuery }} aria-current={!selected ? "page" : undefined}>All</Link>{allowed.map(item => <Link key={item} href={{ pathname: "/admin", query: { ...filterQuery, status: item } }} aria-current={selected === item ? "page" : undefined}>{item.replaceAll("_", " ")} ({counts.get(item) ?? 0})</Link>)}</div>
    <div className="filter-row" role="group" aria-label="Assistance request ordering"><strong>Received:</strong><Link href={{ pathname: "/admin", query: { ...viewQuery, ...assignmentQuery, ...categoryQuery, ...statusQuery } }} aria-current={!oldestFirst ? "page" : undefined}>Newest first</Link><Link href={{ pathname: "/admin", query: { ...viewQuery, ...assignmentQuery, ...categoryQuery, ...statusQuery, sort: "oldest" } }} aria-current={oldestFirst ? "page" : undefined}>Oldest first</Link></div>
    <div className="filter-row" role="group" aria-label="Assistance request assignment filter"><strong>Assignment:</strong><Link href={{ pathname: "/admin", query: { ...viewQuery, ...sortQuery, ...categoryQuery, ...statusQuery } }} aria-current={!unassignedOnly && !mineOnly ? "page" : undefined}>All assignments</Link><Link href={{ pathname: "/admin", query: { ...viewQuery, ...sortQuery, ...categoryQuery, ...statusQuery, assignment: "mine" } }} aria-current={mineOnly ? "page" : undefined}>Assigned to me</Link><Link href={{ pathname: "/admin", query: { ...viewQuery, ...sortQuery, ...categoryQuery, ...statusQuery, assignment: "unassigned" } }} aria-current={unassignedOnly ? "page" : undefined}>Unassigned only</Link></div>
    <div className="filter-row" role="group" aria-label="Requested assistance category"><strong>Category:</strong><Link href={{ pathname: "/admin", query: { ...viewQuery, ...sortQuery, ...assignmentQuery, ...statusQuery } }} aria-current={!category ? "page" : undefined}>All categories</Link>{Object.values(AppealCategory).map(item => <Link key={item} href={{ pathname: "/admin", query: { ...viewQuery, ...sortQuery, ...assignmentQuery, ...statusQuery, category: item } }} aria-current={category === item ? "page" : undefined}>{item.replaceAll("_", " ")}</Link>)}</div>
    <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Operational records"><table><thead><tr><th>Reference</th><th>Applicant</th><th>Category</th><th>Status</th><th>Assigned to</th><th>Documents</th><th>Received</th></tr></thead><tbody>{requests.map(item => <tr key={item.id}><td><Link href={assistanceCaseHref(item.id, caseFilters)}><strong>{item.referenceNumber}</strong></Link></td><td>{item.applicantName}<br/><small>{item.city}</small></td><td>{item.category.replaceAll("_", " ")}</td><td><span className="status-badge">{item.status.replaceAll("_", " ")}</span></td><td>{item.assignedTo?.name ?? "Unassigned"}</td><td>{item._count.documents}</td><td>{item.createdAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</td></tr>)}</tbody></table>{requests.length === 0 && <p className="empty-state">{view === "tests" ? "No historical test requests match this view." : "No requests match this view."}</p>}</div>
    <nav className="filter-row" aria-label="Assistance request pagination">
      {pagination.hasPrevious && <Link href={pageHref(pagination.page - 1)}>Previous</Link>}
      <span>Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} records</span>
      {pagination.hasNext && <Link href={pageHref(pagination.page + 1)}>Next</Link>}
    </nav>
    <section className="admin-card" aria-labelledby="decision-report-heading">
      <h2 id="decision-report-heading">Recorded decision turnaround</h2>
      <p className="muted">Requests received in the last {DECISION_COHORT_DAYS} days in the selected record view, before queue filters, including category. Time is measured from receipt to the earliest recorded approval or rejection evidence. This is not first-review time, case resolution, disbursement, or a promised response time. Reopened cases retain their recorded decision history. Older or missing evidence cannot be inferred.</p>
      {decisions === null ? <p role="status">Report temporarily unavailable. This is not a zero count. You can continue reviewing requests above.</p> : decisions.received === 0 ? <p>No requests in this receipt cohort.</p> : <>
        <p><strong>{decisions.recorded} of {decisions.received}</strong> requests have recorded decision evidence.</p>
        <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Recorded decision turnaround counts">
          <table className="admin-table">
            <thead><tr><th scope="col">Recorded outcome or evidence gap</th><th scope="col">Requests</th></tr></thead>
            <tbody>
              <tr><th scope="row">Decision within 24 hours</th><td>{decisions.withinDay}</td></tr>
              <tr><th scope="row">Decision after 24 hours, within 7 days</th><td>{decisions.withinWeek}</td></tr>
              <tr><th scope="row">Decision after 7 days</th><td>{decisions.overWeek}</td></tr>
              <tr><th scope="row">Open, no recorded decision</th><td>{decisions.openWithoutDecision}</td></tr>
              <tr><th scope="row">Other status, no recorded decision</th><td>{decisions.otherWithoutDecision}</td></tr>
            </tbody>
          </table>
        </div>
      </>}
    </section>
    <section className="admin-card" aria-labelledby="verification-report-heading">
      <h2 id="verification-report-heading">Recorded verification activity</h2>
      <p className="muted">Same {DECISION_COHORT_DAYS}-day receipt cohort as the decision report. Measured to the earliest saved verification record or verification audit event. A saved record does not establish a completed review, first human contact or a response-time commitment. Missing evidence does not establish that nobody reviewed the case.</p>
      {decisions === null ? <p role="status">Report temporarily unavailable. This is not a zero count. You can continue reviewing requests above.</p> : decisions.received === 0 ? <p>No requests in this receipt cohort.</p> : <>
        <p><strong>{decisions.verificationRecorded} of {decisions.received}</strong> requests have saved verification evidence.</p>
        <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Recorded verification activity counts">
          <table className="admin-table">
            <thead><tr><th scope="col">Earliest recorded verification evidence</th><th scope="col">Requests</th></tr></thead>
            <tbody>
              <tr><th scope="row">Within 24 hours</th><td>{decisions.verificationWithinDay}</td></tr>
              <tr><th scope="row">After 24 hours, within 7 days</th><td>{decisions.verificationWithinWeek}</td></tr>
              <tr><th scope="row">After 7 days</th><td>{decisions.verificationOverWeek}</td></tr>
              <tr><th scope="row">No recorded verification evidence</th><td>{decisions.verificationMissing}</td></tr>
            </tbody>
          </table>
        </div>
      </>}
    </section>
    <section className="admin-card" aria-labelledby="decision-category-heading">
      <h2 id="decision-category-heading">Request categories and evidence coverage</h2>
      <p className="muted">Same {DECISION_COHORT_DAYS}-day receipt cohort and selected record view. Compare demand and saved evidence by requested category, not confirmed need or priority. Missing decision and verification counts can overlap. No response-time commitment is implied.</p>
      {decisionCategories === null ? <p role="status">Report temporarily unavailable. This is not a zero count. You can continue reviewing requests above.</p> : decisionCategories.length === 0 ? <p>No requests in this receipt cohort.</p> : <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Request category evidence coverage">
        <table className="admin-table">
          <thead><tr><th scope="col">Requested category</th><th scope="col">Received</th><th scope="col">Recorded decision</th><th scope="col">Open, no decision</th><th scope="col">Other, no decision</th><th scope="col">Saved verification</th><th scope="col">No verification evidence</th></tr></thead>
          <tbody>{decisionCategories.map(row => <tr key={row.category}>
            <th scope="row">{row.category.replaceAll("_", " ")}</th><td>{row.received}</td><td>{row.recorded}</td><td>{row.openWithoutDecision}</td><td>{row.otherWithoutDecision}</td><td>{row.verificationRecorded}</td><td>{row.verificationMissing}</td>
          </tr>)}</tbody>
        </table>
      </div>}
    </section>
  </>;
}
