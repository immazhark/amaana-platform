import { requirePermission } from "@/lib/auth";
import { TALEEM_FACTS, TALEEM_HIFDH_COMPLETIONS } from "@/content/taleem-facts";
import { filterRosterLearners, rosterLearnerFilters, rosterReview } from "@/lib/taleem-roster-review";
import { loadRoster } from "@/lib/taleem-roster-service";
import { parseCalendarDate } from "@/lib/taleem-roster-rules";
import { prisma } from "@/lib/prisma";
import { logServerError } from "@/lib/server-log";
import { historyBoundary, historyHref, historyPage, historyPeriodState, loadTaleemHistory, selectHistoryLearner } from "@/lib/taleem-roster-history";
import {
  assignLearnerAction, confirmHifdhEvidenceAction, createLearnerAction, createPlaceAction, endAssignmentAction, recordHifdhCompletionAction,
  setLearnerStatusAction, setPlaceStatusAction, startEnrolmentAction,
} from "./actions";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ notice?: string; programmeFilter?: string | string[]; statusFilter?: string | string[]; placementFilter?: string | string[]; historyLearner?: string | string[]; programmeBefore?: string | string[]; assignmentBefore?: string | string[] }> };

const PROGRAMME_LABEL = { QAIDA: "Qaida", NAZIRA: "Nazira", HIFDH: "Hifdh" } as const;
const LEARNER_STATUS_LABEL = { ACTIVE: "Active", ON_BREAK: "On break", LEFT: "Left", GRADUATED: "Graduated" } as const;
const PLACE_STATUS_LABEL = { MAINTAINED: "Maintained", SUSPENDED: "Suspended", RETIRED: "Retired" } as const;

// Dates are calendar days in India, the day the madarsah keeps its records.
const todayInIndia = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

export default async function TaleemRosterPage({ searchParams }: Props) {
  await requirePermission("assistance.approve");
  const { notice, historyLearner, programmeBefore: rawProgrammeBefore, assignmentBefore: rawAssignmentBefore, ...requestedFilters } = await searchParams;
  const filters = rosterLearnerFilters(requestedFilters);
  const filtered = Object.values(filters).some(value => value !== "ALL");
  const today = todayInIndia();
  const roster = await loadRoster(parseCalendarDate(today) ?? new Date());
  const { counts } = roster;
  const selectedHistory = selectHistoryLearner(roster.learners, historyLearner);
  const programmeBefore = historyBoundary(rawProgrammeBefore);
  const assignmentBefore = historyBoundary(rawAssignmentBefore);
  const invalidHistoryPage = (rawProgrammeBefore !== undefined && !programmeBefore) || (rawAssignmentBefore !== undefined && !assignmentBefore);
  const history = selectedHistory && !invalidHistoryPage ? await loadTaleemHistory(prisma, selectedHistory.id, programmeBefore, assignmentBefore).catch(() => {
    logServerError("taleem.history_unavailable");
    return null;
  }) : null;
  const programmeHistory = history ? historyPage(history.enrolments) : null;
  const assignmentHistory = history ? historyPage(history.assignments) : null;
  const historyDay = parseCalendarDate(counts.asOf) ?? new Date();
  const dayLabel = (date: Date | null) => date ? date.toISOString().slice(0, 10) : "No end recorded";
  const vacant = roster.places.filter(place => place.status === "MAINTAINED" && place.holderAlias === null && !place.hasBlockingAssignment);
  const baseline = TALEEM_FACTS.sponsoredStudents;
  const review = rosterReview(roster.learners, roster.places);
  const visibleLearners = filterRosterLearners(roster.learners, filters);
  const reviewGroups = [
    { label: "Maintained places available for assignment", values: review.assignableVacancies, target: "place" },
    { label: "Vacant today but already reserved", values: review.reservedVacancies, target: "place" },
    { label: "Assigned learners without a recorded current programme", values: review.missingProgramme, target: "learner" },
    { label: "Assigned learners marked Left or Graduated", values: review.inactiveHolders, target: "learner" },
    { label: "Assignments needing place-status or holder reconciliation", values: review.placeConflicts, target: "learner" },
    { label: "Occupied maintained places without a matching learner", values: review.unmatchedOccupiedPlaces, target: "place" },
    { label: "Recorded Hifdh milestones with evidence not fully confirmed", values: review.pendingMilestones, target: "learner" },
  ];

  return <>
    <div className="admin-heading">
      <div>
        <p className="eyebrow">Taleem</p>
        <h1>Learners and sponsored places</h1>
        <p className="muted">Private records. Names appear only here, never on the public site, in an email or in the audit history. A learner is one person for life: changing programme, leaving and returning, or completing Hifdh never creates or removes a learner. Every change is audited.</p>
      </div>
    </div>
    {notice ? <p className="status-badge" role="status">{notice.slice(0, 200)}</p> : null}

    <section className="card" aria-labelledby="counts-heading">
      <h2 id="counts-heading">Counts as of {counts.asOf}</h2>
      <p className="muted">These are separate figures from separate rules. Do not add them together or publish one as another.</p>
      <dl className="details">
        <div><dt>Places maintained in these records</dt><dd><strong>{counts.maintainedPlaces}</strong>{counts.maintainedPlaces === 0 ? <span className="muted"> — no places entered yet</span> : null}</dd></div>
        <div><dt>Places with a learner today</dt><dd><strong>{counts.occupiedPlaces}</strong></dd></div>
        <div><dt>Vacant maintained places</dt><dd><strong>{counts.vacantPlaces}</strong></dd></div>
        <div><dt>Currently supported students</dt><dd><strong>{counts.currentlySupportedStudents}</strong></dd></div>
        <div><dt>Students supported since inception</dt><dd><strong>{counts.studentsSupportedSinceInception}</strong></dd></div>
        <div><dt>Verified Hifdh completions this year (support confirmed)</dt><dd><strong>{counts.hifdhCompletionsInYear}</strong></dd></div>
        <div><dt>Verified Hifdh completions, all time (support confirmed)</dt><dd><strong>{counts.hifdhCompletionsAllTime}</strong></dd></div>
      </dl>
    </section>

    <section className="card" aria-labelledby="roster-review-heading">
      <h2 id="roster-review-heading">Sponsorship reconciliation workbench</h2>
      <p className="muted">Compare like with like. The published figure is a dated owner-confirmed Nazira / Hifdh student count, not the number of maintained places. This private view does not certify a new public count or assign a sponsor.</p>
      <dl className="details">
        <div><dt>Published student baseline</dt><dd>{baseline} ({TALEEM_FACTS.asOf.label})</dd></div>
        <div><dt>Recorded Nazira / Hifdh learners in matched maintained places today</dt><dd><strong>{review.naziraHifdhStudents}</strong> — {review.naziraHifdhStudents === baseline ? "numerical match only; confirm the underlying records" : "differs from the dated student baseline; review the records and any later changes"}</dd></div>
        <div><dt>Published Hifdh completions in {TALEEM_HIFDH_COMPLETIONS.year}</dt><dd>{TALEEM_HIFDH_COMPLETIONS.sponsored} ({TALEEM_HIFDH_COMPLETIONS.asOf.label})</dd></div>
        {counts.asOf.startsWith(String(TALEEM_HIFDH_COMPLETIONS.year) + "-") && <div><dt>Recorded verified, support-associated completions this year</dt><dd>{counts.hifdhCompletionsInYear} — {counts.hifdhCompletionsInYear === TALEEM_HIFDH_COMPLETIONS.sponsored ? "numerical match only" : "review difference from the dated completion baseline"}</dd></div>}
      </dl>
      <h3>Programme and learner status</h3>
      <p className="muted">Matched maintained places today, grouped by the learner&apos;s recorded programme and status. Left or graduated learners with a recorded place are shown separately for review. Unmatched occupied places are excluded from this table and listed below. These counts are not funded capacity, verified programme impact or new public figures.</p>
      <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Matched maintained places by programme and learner status">
        <table>
          <thead><tr><th scope="col">Programme</th><th scope="col">Active</th><th scope="col">On break</th><th scope="col">Left / graduated</th><th scope="col">Unknown status</th><th scope="col">Matched places</th></tr></thead>
          <tbody>{review.programmeStatus.map(row => <tr key={row.programme}>
            <th scope="row">{row.programme === "UNCLASSIFIED" ? "No known programme" : PROGRAMME_LABEL[row.programme]}</th>
            <td>{row.active}</td><td>{row.onBreak}</td><td>{row.inactive}</td><td>{row.unknownStatus}</td><td>{row.active + row.onBreak + row.inactive + row.unknownStatus}</td>
          </tr>)}</tbody>
        </table>
      </div>
      <p className="muted">Review groups can overlap. A vacancy does not establish available funding; a review prompt does not change a learner, place, or public figure.</p>
      {reviewGroups.map(group => <details key={group.label}>
        <summary>{group.label}: <strong>{group.values.length}</strong></summary>
        {group.values.length ? <ul>{group.values.map(reference => <li key={reference}><a href={`${filtered && group.target === "learner" ? "/admin/taleem" : ""}#${group.target}-${reference}`}>{reference}</a></li>)}</ul> : <p className="muted">None recorded in this group.</p>}
      </details>)}
    </section>

    <section className="card" aria-labelledby="places-heading">
      <h2 id="places-heading">Sponsored places</h2>
      {roster.places.length === 0 ? <p className="muted">No places yet. Add each approved sponsored place once; a place is the commitment, and different learners can hold it over time.</p> : <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Sponsored places and who holds each today"><table>
        <caption className="sr-only">Sponsored places and who holds each today</caption>
        <thead><tr><th scope="col">Place</th><th scope="col">Status</th><th scope="col">Held by</th><th scope="col">Change status</th></tr></thead>
        <tbody>{roster.places.map(place => <tr key={place.id} id={`place-${place.placeCode}`}>
          <th scope="row">{place.placeCode}</th>
          <td>{PLACE_STATUS_LABEL[place.status]}</td>
          <td>{place.holderAlias ?? <span className="muted">{place.hasBlockingAssignment ? "Vacant today — future assignment recorded" : "Vacant"}</span>}</td>
          <td><form action={setPlaceStatusAction} className="admin-inline-form">
            <input type="hidden" name="placeId" value={place.id} />
            <label htmlFor={`pstatus-${place.id}`} className="sr-only">Status for {place.placeCode}</label>
            <select id={`pstatus-${place.id}`} name="status" defaultValue={place.status}>{Object.entries(PLACE_STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <button className="button" type="submit">Save</button>
          </form></td>
        </tr>)}</tbody>
      </table></div>}
      <form action={createPlaceAction} className="form-grid">
        <div className="field"><label htmlFor="place-approved">Approved on <span className="muted">optional</span></label><input id="place-approved" name="approvedOn" type="date" /></div>
        <div className="field"><label htmlFor="place-note">Note <span className="muted">optional, private</span></label><input id="place-note" name="note" maxLength={300} /></div>
        <div className="field full"><button className="button" type="submit">Add a sponsored place</button></div>
      </form>
    </section>

    {historyLearner !== undefined && <section className="card" aria-labelledby="learner-history-heading">
      <h2 id="learner-history-heading">Learner programme and place history{selectedHistory ? ` — ${selectedHistory.publicAlias}` : ""}</h2>
      <p><a href={historyHref(filters)}>Return to learner directory</a></p>
      {!selectedHistory ? <p role="status">No learner history matches this selection.</p> : invalidHistoryPage ? <p role="status">Invalid history page. <a href={historyHref(filters, selectedHistory.publicAlias)}>Return to latest history</a></p> : !programmeHistory || !assignmentHistory ? <p role="status">Learner history temporarily unavailable. This does not mean there are no records.</p> : <>
        <p className="muted">Private recorded periods, newest start date first. Each list displays up to 25 periods. End dates are inclusive. Period state is relative to {counts.asOf}, not proof of funding or verified attendance. This view does not edit records or change published figures.</p>
        <h3>Programme history</h3>
        {programmeHistory.rows.length ? <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Learner programme history"><table>
          <thead><tr><th scope="col">Programme</th><th scope="col">From</th><th scope="col">Through</th><th scope="col">Period state</th></tr></thead>
          <tbody>{programmeHistory.rows.map(row => <tr key={row.id}><th scope="row">{PROGRAMME_LABEL[row.programme]}</th><td>{dayLabel(row.startedOn)}</td><td>{dayLabel(row.endedOn)}</td><td>{historyPeriodState(row, historyDay)}</td></tr>)}</tbody>
        </table></div> : <p>{programmeBefore ? "No older programme periods in this page." : "No programme periods recorded."}</p>}
        <p>{programmeBefore && <a href={historyHref(filters, selectedHistory.publicAlias, null, assignmentBefore)}>Latest programme periods</a>} {programmeHistory.older && <a href={historyHref(filters, selectedHistory.publicAlias, programmeHistory.older, assignmentBefore)}>Older programme periods</a>}</p>
        <h3>Sponsored place history</h3>
        {assignmentHistory.rows.length ? <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Learner sponsored place history"><table>
          <thead><tr><th scope="col">Place</th><th scope="col">From</th><th scope="col">Through</th><th scope="col">Period state</th></tr></thead>
          <tbody>{assignmentHistory.rows.map(row => <tr key={row.id}><th scope="row">{row.place.placeCode}</th><td>{dayLabel(row.startedOn)}</td><td>{dayLabel(row.endedOn)}</td><td>{historyPeriodState(row, historyDay)}</td></tr>)}</tbody>
        </table></div> : <p>{assignmentBefore ? "No older place periods in this page." : "No sponsored place periods recorded."}</p>}
        <p>{assignmentBefore && <a href={historyHref(filters, selectedHistory.publicAlias, programmeBefore, null)}>Latest place periods</a>} {assignmentHistory.older && <a href={historyHref(filters, selectedHistory.publicAlias, programmeBefore, assignmentHistory.older)}>Older place periods</a>}</p>
      </>}
    </section>}

    <section className="card" aria-labelledby="learners-heading">
      <h2 id="learners-heading">Learners</h2>
      <form action="/admin/taleem#learners-heading" method="get" className="form-grid" aria-label="Filter private learner records">
        <div className="field"><label htmlFor="roster-programme-filter">Programme</label><select id="roster-programme-filter" name="programmeFilter" defaultValue={filters.programme}>
          <option value="ALL">All programmes</option>{Object.entries(PROGRAMME_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}<option value="UNCLASSIFIED">No recorded programme</option>
        </select></div>
        <div className="field"><label htmlFor="roster-status-filter">Learner status</label><select id="roster-status-filter" name="statusFilter" defaultValue={filters.status}>
          <option value="ALL">All statuses</option>{Object.entries(LEARNER_STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select></div>
        <div className="field"><label htmlFor="roster-placement-filter">Place assignment</label><select id="roster-placement-filter" name="placementFilter" defaultValue={filters.placement}>
          <option value="ALL">All assignments</option><option value="CURRENT">Place recorded today</option><option value="RESERVED">Future assignment only</option><option value="UNASSIGNED">No current or future assignment</option>
        </select></div>
        <div className="field full"><button className="button" type="submit">Apply learner filters</button>{filtered && <> <a href="/admin/taleem#learners-heading">Clear filters</a></>}</div>
      </form>
      <p className="muted">Showing {visibleLearners.length} of {roster.learners.length} learner records. Counts and reconciliation above always include the full roster.</p>
      {roster.learners.length === 0 ? <p className="muted">No learners yet.</p> : visibleLearners.length === 0 ? <p className="muted">No learners match these filters.</p> : visibleLearners.map(learner => <details key={learner.id} id={`learner-${learner.publicAlias}`} className="card">
        <summary><strong>{learner.fullName}</strong> <small>{learner.publicAlias} · {LEARNER_STATUS_LABEL[learner.status]} · {learner.programme ? PROGRAMME_LABEL[learner.programme] : "No programme recorded"} · {learner.placeCode ?? "No place today"}{learner.openAssignmentStartsOn && learner.openAssignmentStartsOn > counts.asOf ? ` · Scheduled from ${learner.openAssignmentStartsOn}: ${learner.openAssignmentPlaceCode ?? "place recorded"}` : ""}{learner.completedHifdhOn ? ` · Hifdh completion recorded ${learner.completedHifdhOn}` : ""}</small></summary>
        <p><a href={historyHref(filters, learner.publicAlias)}>Review programme and place history</a></p>
        <form action={setLearnerStatusAction} className="form-grid">
          <input type="hidden" name="learnerId" value={learner.id} />
          <div className="field"><label htmlFor={`lstatus-${learner.id}`}>Status</label><select id={`lstatus-${learner.id}`} name="status" defaultValue={learner.status}>{Object.entries(LEARNER_STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div className="field"><button className="button" type="submit">Save status</button></div>
        </form>
        <form action={startEnrolmentAction} className="form-grid">
          <input type="hidden" name="learnerId" value={learner.id} />
          <div className="field"><label htmlFor={`prog-${learner.id}`}>Programme</label><select id={`prog-${learner.id}`} name="programme" defaultValue={learner.programme ?? "QAIDA"}>{Object.entries(PROGRAMME_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
          <div className="field"><label htmlFor={`progstart-${learner.id}`}>From</label><input id={`progstart-${learner.id}`} name="startedOn" type="date" defaultValue={today} required /></div>
          <div className="field full"><button className="button" type="submit">Record programme (closes the previous one the day before)</button></div>
        </form>
        {learner.assignmentId ? <form action={endAssignmentAction} className="form-grid">
          <input type="hidden" name="assignmentId" value={learner.assignmentId} />
          <div className="field"><label htmlFor={`end-${learner.id}`}>End open assignment for {learner.openAssignmentPlaceCode ?? "recorded place"} on</label><input id={`end-${learner.id}`} name="endedOn" type="date" defaultValue={today} required /></div>
          <div className="field"><label htmlFor={`endwhy-${learner.id}`}>Reason <span className="muted">optional, private</span></label><input id={`endwhy-${learner.id}`} name="reason" maxLength={300} /></div>
          <div className="field full"><button className="button" type="submit">End this assignment (history is kept)</button></div>
        </form> : !learner.hasBlockingAssignment && vacant.length > 0 && (learner.status === "ACTIVE" || learner.status === "ON_BREAK") ? <form action={assignLearnerAction} className="form-grid">
          <input type="hidden" name="learnerId" value={learner.id} />
          <div className="field"><label htmlFor={`place-${learner.id}`}>Vacant place</label><select id={`place-${learner.id}`} name="placeId" required>{vacant.map(place => <option key={place.id} value={place.id}>{place.placeCode}</option>)}</select></div>
          <div className="field"><label htmlFor={`pstart-${learner.id}`}>From</label><input id={`pstart-${learner.id}`} name="startedOn" type="date" defaultValue={today} required /></div>
          <div className="field full"><button className="button" type="submit">Assign this place</button></div>
        </form> : null}
        {!learner.assignmentId && learner.hasBlockingAssignment ? <p className="muted">A current or future dated assignment is already recorded. A new open assignment would overlap.</p> : null}
        {learner.completedHifdhOn && <section aria-label="Hifdh milestone evidence">
          <p>Completion recorded on {learner.completedHifdhOn}. {learner.completionReview?.verified ? "Completion evidence verified." : "Completion evidence not confirmed."} {learner.completionReview?.supportAssociated ? "Amaana support association confirmed." : "Amaana support association not confirmed."}</p>
          {learner.completionReview && (!learner.completionReview.verified || !learner.completionReview.supportAssociated) && learner.completedHifdhOn <= counts.asOf && <form action={confirmHifdhEvidenceAction} className="form-grid">
            <input type="hidden" name="learnerId" value={learner.id} />
            {!learner.completionReview.verified && <label><input type="checkbox" name="verified" /> I reviewed evidence of the recorded completion.</label>}
            {!learner.completionReview.supportAssociated && <label><input type="checkbox" name="supportAssociated" /> I confirmed Amaana support association.</label>}
            <p className="muted full">Confirm only evidence you have reviewed. The existing date and previous confirmations stay unchanged. This does not publish a new figure or end support.</p>
            <div className="field full"><button className="button" type="submit">Confirm selected Hifdh evidence</button></div>
          </form>}
        </section>}
        {learner.completedHifdhOn ? null : <form action={recordHifdhCompletionAction} className="form-grid">
          <input type="hidden" name="learnerId" value={learner.id} />
          <div className="field"><label htmlFor={`done-${learner.id}`}>Hifdh completed on</label><input id={`done-${learner.id}`} name="completedOn" type="date" required /></div>
          <div className="field"><label htmlFor={`ver-${learner.id}`}>Verified</label><select id={`ver-${learner.id}`} name="verified" defaultValue="no"><option value="no">Not yet verified</option><option value="yes">Verified</option></select></div>
          <div className="field"><label htmlFor={`sup-${learner.id}`}>Amaana support confirmed</label><select id={`sup-${learner.id}`} name="supportAssociated" defaultValue="no"><option value="no">Not confirmed</option><option value="yes">Confirmed</option></select></div>
          <div className="field full"><button className="button" type="submit">Record Hifdh completion</button></div>
        </form>}
      </details>)}
      <form action={createLearnerAction} className="form-grid">
        <div className="field"><label htmlFor="learner-name">Full name <span className="muted">private, never published</span></label><input id="learner-name" name="fullName" maxLength={200} required /></div>
        <div className="field"><label htmlFor="learner-source">Where this record came from <span className="muted">optional</span></label><input id="learner-source" name="provenance" maxLength={300} /></div>
        <div className="field full"><button className="button" type="submit">Add a learner</button></div>
      </form>
    </section>
  </>;
}
