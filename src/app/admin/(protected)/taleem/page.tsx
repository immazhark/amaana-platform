import { requirePermission } from "@/lib/auth";
import { TALEEM_FACTS } from "@/content/taleem-facts";
import { loadRoster } from "@/lib/taleem-roster-service";
import { parseCalendarDate } from "@/lib/taleem-roster-rules";
import {
  assignLearnerAction, createLearnerAction, createPlaceAction, endAssignmentAction, recordHifdhCompletionAction,
  setLearnerStatusAction, setPlaceStatusAction, startEnrolmentAction,
} from "./actions";

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<{ notice?: string }> };

const PROGRAMME_LABEL = { QAIDA: "Qaida", NAZIRA: "Nazira", HIFDH: "Hifdh" } as const;
const LEARNER_STATUS_LABEL = { ACTIVE: "Active", ON_BREAK: "On break", LEFT: "Left", GRADUATED: "Graduated" } as const;
const PLACE_STATUS_LABEL = { MAINTAINED: "Maintained", SUSPENDED: "Suspended", RETIRED: "Retired" } as const;

// Dates are calendar days in India, the day the madarsah keeps its records.
const todayInIndia = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());

export default async function TaleemRosterPage({ searchParams }: Props) {
  await requirePermission("assistance.approve");
  const { notice } = await searchParams;
  const today = todayInIndia();
  const roster = await loadRoster(parseCalendarDate(today) ?? new Date());
  const { counts } = roster;
  const vacant = roster.places.filter(place => place.status === "MAINTAINED" && place.holderAlias === null && !place.hasBlockingAssignment);
  const baseline = TALEEM_FACTS.sponsoredStudents;

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
        <div><dt>Places maintained in these records</dt><dd><strong>{counts.maintainedPlaces}</strong> <span className="muted">(published baseline: {baseline}, {TALEEM_FACTS.asOf.label}){counts.maintainedPlaces === baseline ? "" : counts.maintainedPlaces === 0 ? " — no places entered yet" : " — differs from the published baseline; reconcile before publishing anything"}</span></dd></div>
        <div><dt>Places with a learner today</dt><dd><strong>{counts.occupiedPlaces}</strong></dd></div>
        <div><dt>Vacant maintained places</dt><dd><strong>{counts.vacantPlaces}</strong></dd></div>
        <div><dt>Currently supported students</dt><dd><strong>{counts.currentlySupportedStudents}</strong></dd></div>
        <div><dt>Students supported since inception</dt><dd><strong>{counts.studentsSupportedSinceInception}</strong></dd></div>
        <div><dt>Verified Hifdh completions this year (support confirmed)</dt><dd><strong>{counts.hifdhCompletionsInYear}</strong></dd></div>
        <div><dt>Verified Hifdh completions, all time (support confirmed)</dt><dd><strong>{counts.hifdhCompletionsAllTime}</strong></dd></div>
      </dl>
    </section>

    <section className="card" aria-labelledby="places-heading">
      <h2 id="places-heading">Sponsored places</h2>
      {roster.places.length === 0 ? <p className="muted">No places yet. Add each approved sponsored place once; a place is the commitment, and different learners can hold it over time.</p> : <div className="admin-table-wrap" tabIndex={0} role="region" aria-label="Sponsored places and who holds each today"><table>
        <caption className="sr-only">Sponsored places and who holds each today</caption>
        <thead><tr><th scope="col">Place</th><th scope="col">Status</th><th scope="col">Held by</th><th scope="col">Change status</th></tr></thead>
        <tbody>{roster.places.map(place => <tr key={place.id}>
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

    <section className="card" aria-labelledby="learners-heading">
      <h2 id="learners-heading">Learners</h2>
      {roster.learners.length === 0 ? <p className="muted">No learners yet.</p> : roster.learners.map(learner => <details key={learner.id} className="card">
        <summary><strong>{learner.fullName}</strong> <small>{learner.publicAlias} · {LEARNER_STATUS_LABEL[learner.status]} · {learner.programme ? PROGRAMME_LABEL[learner.programme] : "No programme recorded"} · {learner.placeCode ?? "No place today"}{learner.openAssignmentStartsOn && learner.openAssignmentStartsOn > counts.asOf ? ` · Scheduled from ${learner.openAssignmentStartsOn}: ${learner.openAssignmentPlaceCode ?? "place recorded"}` : ""}{learner.completedHifdhOn ? ` · Hifdh completed ${learner.completedHifdhOn}` : ""}</small></summary>
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
