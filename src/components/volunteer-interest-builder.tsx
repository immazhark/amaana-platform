import Link from "next/link";
import { buildVolunteerEnquiryHref, VOLUNTEER_SKILLS } from "@/lib/volunteer-enquiry";

/** Native, server-rendered contact actions keep donor/volunteer data private.
 * A visitor edits availability and any extra interests in their own mail app.
 * No JavaScript bundle, API request, storage, or application submission. */
export function VolunteerInterestBuilder() {
  return (
    <div>
      <h3>Choose an area of volunteering</h3>
      <p>
        Select an interest to prepare a private email. You can add other skills
        and your availability before sending. These are interests, not advertised
        vacancies or confirmed placements.
      </p>
      <div className="v2-hero-actions" aria-label="Volunteer enquiry topics">
        {VOLUNTEER_SKILLS.map(skill => (
          <a className="v2-button v2-button--paper-secondary" href={buildVolunteerEnquiryHref([skill], "")} key={skill}>
            {skill}
          </a>
        ))}
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
