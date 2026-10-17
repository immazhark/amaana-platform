import Link from "next/link";
import { ActionIcon } from "@/components/action-icon";
import { buildVolunteerEnquiryHref, VOLUNTEER_SKILLS } from "@/lib/volunteer-enquiry";
import styles from "./participation-card.module.css";

const skillDescriptions: Record<(typeof VOLUNTEER_SKILLS)[number], string> = {
  "Distribution and packing": "Offer practical help preparing or distributing approved relief items when a suitable need arises.",
  "Photography and documentation": "Discuss consent-aware photography or documentation of approved work, never private case records.",
  "Design and communication": "Offer responsible design, writing or communication skills for reviewed public material.",
  "Technology and website support": "Help improve accessible digital services, content quality or technical workflows.",
  "Event logistics": "Explore coordination and event-day support, subject to local needs and safeguarding.",
  "Other practical help": "Tell Amaana about another skill or the kind of contribution you can realistically offer.",
};

/** Visitor-owned email links: no on-site submission, account, or volunteer database.
 * Reuse the reviewed participation-card design so choice geometry stays consistent
 * with Get Involved and Contact without increasing the CSS/JS bundle budgets. */
export function VolunteerInterestBuilder() {
  return (
    <div>
      <h3>Choose an area of volunteering</h3>
      <p>
        Select an interest to prepare a private email. You can add other skills
        and your availability before sending. These are interests, not advertised
        vacancies or confirmed placements.
      </p>
      <div className={styles.grid} role="group" aria-label="Volunteer enquiry topics">
        {VOLUNTEER_SKILLS.map((skill, index) => {
          const headingId = `volunteer-interest-${index + 1}`;
          const descriptionId = `volunteer-interest-description-${index + 1}`;
          return (
            <a
              key={skill}
              className={styles.card}
              href={buildVolunteerEnquiryHref([skill], "")}
              data-volunteer-skill={index + 1}
              aria-labelledby={headingId}
              aria-describedby={descriptionId}
            >
              <span className={styles.marker} aria-hidden="true"><ActionIcon kind="volunteer" /></span>
              <div className={styles.copy}>
                <h3 id={headingId}>{skill}</h3>
                <p id={descriptionId}>{skillDescriptions[skill]}</p>
              </div>
              <span className={styles.action}>
                Prepare private enquiry
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
            </a>
          );
        })}
      </div>
      <p>
        Not sure which category fits?{" "}
        <a href={buildVolunteerEnquiryHref([], "")}>Prepare a general volunteer enquiry</a>.
        Your email draft asks you to clarify availability and any other interests.
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
