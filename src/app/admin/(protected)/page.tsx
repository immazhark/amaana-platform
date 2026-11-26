import Link from "next/link";
import { redirect } from "next/navigation";
import { AssistanceStatus } from "@prisma/client";
import { adminHomePathForPermissions } from "@/lib/admin-navigation";
import { getAdminPagination, parseAdminPage } from "@/lib/admin-pagination";
import { adminRecordView, assistanceAdminWhere } from "@/lib/admin-record-visibility";
import { hasPermission, permissionKeys, requireAuthenticatedUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assistanceWorkload } from "@/lib/assistance-workload";
import { DECISION_COHORT_DAYS, loadAssistanceDecisionReport } from "@/lib/assistance-decision-report";
import { capacityRemaining, capacityUsed, isIntakePaused } from "@/lib/assistance-capacity";
import { INDIVIDUAL_CASE_ANNUAL_CAPACITY } from "@/lib/assistance-policy";
import { setAssistanceIntakeAction } from "./intake-actions";

type Props = { searchParams: Promise<{ status?: string; page?: string; view?: string; sort?: string | string[]; assignment?: string | string[] }> };
const allowed = Object.values(AssistanceStatus);

export default async function AdminQueuePage({ searchParams }: Props) {
  const user = await requireAuthenticatedUser();
  if (!hasPermission(user, "assistance.view")) redirect(adminHomePathForPermissions(permissionKeys(user)));
  const { status, page: pageParam, view: requestedView, sort: requestedSort, assignment: requestedAssignment } = await searchParams;
  const view = adminRecordView(requestedView);
  const oldestFirst = requestedSort === "oldest";
  const direction = oldestFirst ? "asc" : "desc";
  const selected = allowed.includes(status as AssistanceStatus) ? status as AssistanceStatus : undefined;
  const unassignedOnly = requestedAssignment === "unassigned";
  const scope = { ...assistanceAdminWhere(view), ...(unassignedOnly ? { assignedToId: null } : {}) };
  const where = { ...scope, ...(selected ? { status: selected } : {}) };
  const [used, paused, workload, decisions] = await Promise.all([capacityUsed(prisma), isIntakePaused(prisma), assistanceWorkload(prisma, assistanceAdminWhere(view)), loadAssistanceDecisionReport(prisma, view)]);
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
  const assignmentQuery = unassignedOnly ? { assignment: "unassigned" } : {};
  const filterQuery = { ...viewQuery, ...sortQuery, ...assignmentQuery };
  const pageHref = (targetPage: number) => ({
    pathname: "/admin",
    query: { ...filterQuery, ...statusQuery, page: targetPage },
  });

  return <>
    <div className="admin-heading"><div><p className="eyebrow">Case management</p><h1>Assistance queue</h1></div></div>
    <section className="card" aria-labelledby="capacity-heading">
      <h2 id="capacity-heading">Intake and annual capacity</h2>
      <p>{used} of {INDIVIDUAL_CASE_ANNUAL_CAPACITY} individual cases taken up this calendar year ({capacityRemaining(used)} places left). A maximum, not a commitment. Counted when a case is approved; annual distributions and Taleem sponsorships are separate.</p>
      <p>{workload.submitted} submitted {workload.submitted === 1 ? "request" : "requests"}{workload.oldestSubmittedAgeDays !== null && <> (oldest received {workload.oldestSubmittedAgeDays} {workload.oldestSubmittedAgeDays === 1 ? "day" : "days"} ago)</>}; {workload.openUnassigned} of {workload.open} open requests have no assignee. Counts cover this record view before status and assignment filters. No response time is promised to applicants.</p>
      <p>New requests are <strong>{paused ? "paused" : "open"}</strong>. Intake never reopens by itself at a year boundary.</p>
      {canApprove && <form action={setAssistanceIntakeAction}><input type="hidden" name="paused" value={paused ? "false" : "true"} /><button className="button" type="submit">{paused ? "Reopen new requests" : "Pause new requests"}</button></form>}
    </section>
    <section className="admin-card" aria-labelledby="decision-report-heading">
      <h2 id="decision-report-heading">Recorded decision turnaround</h2>
      <p className="muted">Requests received in the last {DECISION_COHORT_DAYS} days in the selected record view, before queue filters. Time is measured from receipt to the earliest recorded approval or rejection evidence. This is not first-review time, case resolution, disbursement, or a promised response time. Reopened cases retain their recorded decision history. Older or missing evidence cannot be inferred.</p>
      {decisions.received === 0 ? <p>No requests in this receipt cohort.</p> : <>
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
    <div className="filter-row" role="group" aria-label="Record visibility"><strong>Records:</strong><Link href={{ pathname: "/admin", query: { ...sortQuery, ...assignmentQuery } }} aria-current={view === "live" ? "page" : undefined}>Live records</Link><Link href={{ pathname: "/admin", query: { ...sortQuery, ...assignmentQuery, view: "tests" } }} aria-current={view === "tests" ? "page" : undefined}>Historical tests</Link></div>
    {view === "tests" && <p className="muted">Retained staging acceptance records only. Related payment and refund history remains available for audit.</p>}
    <div className="filter-row" role="group" aria-label="Assistance request status filter"><strong>Status:</strong><Link href={{ pathname: "/admin", query: filterQuery }} aria-current={!selected ? "page" : undefined}>All</Link>{allowed.map(item => <Link key={item} href={{ pathname: "/admin", query: { ...filterQuery, status: item } }} aria-current={selected === item ? "page" : undefined}>{item.replaceAll("_", " ")} ({counts.get(item) ?? 0})</Link>)}</div>
    <div className="filter-row" role="group" aria-label="Assistance request ordering"><strong>Received:</strong><Link href={{ pathname: "/admin", query: { ...viewQuery, ...assignmentQuery, ...statusQuery } }} aria-current={!oldestFirst ? "page" : undefined}>Newest first</Link><Link href={{ pathname: "/admin", query: { ...viewQuery, ...assignmentQuery, ...statusQuery, sort: "oldest" } }} aria-current={oldestFirst ? "page" : undefined}>Oldest first</Link></div>
    <div className="filter-row" role="group" aria-label="Assistance request assignment filter"><strong>Assignment:</strong><Link href={{ pathname: "/admin", query: { ...viewQuery, ...sortQuery, ...statusQuery } }} aria-current={!unassignedOnly ? "page" : undefined}>All assignments</Link><Link href={{ pathname: "/admin", query: { ...viewQuery, ...sortQuery, ...statusQuery, assignment: "unassigned" } }} aria-current={unassignedOnly ? "page" : undefined}>Unassigned only</Link></div>
    <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Operational records"><table><thead><tr><th>Reference</th><th>Applicant</th><th>Category</th><th>Status</th><th>Assigned to</th><th>Documents</th><th>Received</th></tr></thead><tbody>{requests.map(item => <tr key={item.id}><td><Link href={`/admin/requests/${item.id}`}><strong>{item.referenceNumber}</strong></Link></td><td>{item.applicantName}<br/><small>{item.city}</small></td><td>{item.category.replaceAll("_", " ")}</td><td><span className="status-badge">{item.status.replaceAll("_", " ")}</span></td><td>{item.assignedTo?.name ?? "Unassigned"}</td><td>{item._count.documents}</td><td>{item.createdAt.toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" })}</td></tr>)}</tbody></table>{requests.length === 0 && <p className="empty-state">{view === "tests" ? "No historical test requests match this view." : "No requests match this view."}</p>}</div>
    <nav className="filter-row" aria-label="Assistance request pagination">
      {pagination.hasPrevious && <Link href={pageHref(pagination.page - 1)}>Previous</Link>}
      <span>Page {pagination.page} of {pagination.totalPages} · {pagination.totalItems} records</span>
      {pagination.hasNext && <Link href={pageHref(pagination.page + 1)}>Next</Link>}
    </nav>
  </>;
}
