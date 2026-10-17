import Link from "next/link";
import { ActionIcon } from "@/components/action-icon";
import {
  buildVolunteerEnquiryHref, parseVolunteerPreferences,
  VOLUNTEER_AVAILABILITY, VOLUNTEER_SKILLS,
} from "@/lib/volunteer-enquiry";
import styles from "./participation-card.module.css";

const skillDescriptions: Record<(typeof VOLUNTEER_SKILLS)[number], string> = {
  "Distribution and packing": "Offer practical help preparing or distributing approved relief items when a suitable need arises.",
  "Photography and documentation": "Discuss consent-aware photography or documentation of approved work, never private case records.",
  "Design and communication": "Offer responsible design, writing or communication skills for reviewed public material.",
  "Technology and website support": "Help improve accessible digital services, content quality or technical workflows.",
  "Event logistics": "Explore coordination and event-day support, subject to local needs and safeguarding.",
  "Other practical help": "Tell Amaana about another skill or the kind of contribution you can realistically offer.",
};
type Preferences = Record<string, string | string[] | undefined>;

/** Native fixed-choice GET review, then visitor-owned email. No client state,
 * automatic message delivery, user accounts or volunteer database. */
export function VolunteerInterestBuilder({ preferences = {} }: { preferences?: Preferences }) {
  const requested = Object.keys(preferences).length > 0;
  const selection = requested ? parseVolunteerPreferences(preferences) : null;
  return (
    <div>
      <h3>Choose an area of volunteering</h3>
      <p>
        Choose one or more areas and your availability, then review a private
        email before sending it. These are interests, not advertised vacancies
        or confirmed placements.
      </p>
      <form method="get" action="/get-involved/volunteer#volunteer-review">
        <input type="hidden" name="intent" value="review" />
        <fieldset>
          <legend>Volunteer enquiry topics</legend>
          <div className={styles.grid} role="group" aria-label="Volunteer enquiry topics">
            {VOLUNTEER_SKILLS.map((skill, index) => {
              const headingId = `volunteer-interest-${index + 1}`;
              const descriptionId = `volunteer-interest-description-${index + 1}`;
              return (
                <label className={styles.card} data-volunteer-skill={index + 1} key={skill}>
                  <input type="checkbox" name="skill" value={skill}
                    defaultChecked={selection?.skills.includes(skill) ?? false} />
                  <span className={styles.marker} aria-hidden="true"><ActionIcon kind="volunteer" /></span>
                  <div className={styles.copy}>
                    <h3 id={headingId}>{skill}</h3>
                    <p id={descriptionId}>{skillDescriptions[skill]}</p>
                  </div>
                  <span className={styles.action}>Add to my enquiry</span>
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="v2-hero-actions">
          <label htmlFor="volunteer-availability">Your availability</label>
          <select id="volunteer-availability" name="availability"
            defaultValue={selection?.availability ?? ""}>
            <option value="">Not specified yet</option>
            {VOLUNTEER_AVAILABILITY.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
          <button type="submit" className="v2-button">Review my volunteer enquiry</button>
        </div>
      </form>
      <div id="volunteer-review">
        {requested && !selection ? (
          <p role="alert">Those volunteer choices could not be read. Please select approved options and review again.</p>
        ) : selection ? (
          <div className={styles.card}>
            <h3>Review your volunteer enquiry</h3>
            <p>Areas: {selection.skills.length ? selection.skills.join(", ") : "Open to discussing available needs"}</p>
            <p>Availability: {selection.availability || "Not specified"}</p>
            <a className="v2-button" href={buildVolunteerEnquiryHref(selection.skills, selection.availability)}>
              Open prepared email
            </a>
            <p>Nothing has been sent. Review the message in your email application before sending it.</p>
          </div>
        ) : null}
      </div>
      <p>
        Not sure which category fits?{" "}
        <a href={buildVolunteerEnquiryHref([], "")}>Prepare a general volunteer enquiry</a>.
        You can clarify other interests and availability in your own email.
      </p>
      <p>
        Nothing is sent to Amaana until you review and send the email in your own
        mail application. If it does not open, use the{" "}
        <Link href="/contact">official contact options</Link>.
      </p>
      <p>
        Please do not include ID documents, medical information, beneficiary
        photographs, bank details or other sensitive records in a volunteering
        enquiry. Participation is always voluntary.
      </p>
    </div>
  );
}
