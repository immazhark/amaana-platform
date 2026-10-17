"use client";

import { useState } from "react";
import Link from "next/link";
import {
  buildVolunteerEnquiryHref,
  VOLUNTEER_AVAILABILITY,
  VOLUNTEER_SKILLS,
  type VolunteerAvailability,
  type VolunteerSkill,
} from "@/lib/volunteer-enquiry";
import styles from "./volunteer-interest-builder.module.css";

/** Visitors select non-sensitive categories. Nothing is submitted to the site:
 * the prepared message is sent only if their email application sends it. */
export function VolunteerInterestBuilder() {
  const [skills, setSkills] = useState<VolunteerSkill[]>([]);
  const [availability, setAvailability] = useState<VolunteerAvailability | "">("");
  const href = buildVolunteerEnquiryHref(skills, availability);

  function toggleSkill(skill: VolunteerSkill, checked: boolean) {
    setSkills(current => checked
      ? current.includes(skill) ? current : [...current, skill]
      : current.filter(item => item !== skill));
  }

  return <div className={styles.builder}>
    <div className={styles.intro}>
      <h3>Prepare a volunteer enquiry</h3>
      <p>Choose what you could help with. These are interests, not advertised vacancies or confirmed placements. Amaana will check current needs, availability and safeguarding requirements before involving anyone.</p>
    </div>
    <fieldset className={styles.fieldset}>
      <legend>How could you contribute? <span>(choose any)</span></legend>
      <div className={styles.skills}>
        {VOLUNTEER_SKILLS.map(skill => (
          <label className={styles.skill} key={skill}>
            <input type="checkbox" checked={skills.includes(skill)}
              onChange={event => toggleSkill(skill, event.target.checked)}/>
            <span>{skill}</span>
          </label>
        ))}
      </div>
    </fieldset>
    <label className={styles.availability}>
      General availability <span>(optional)</span>
      <select value={availability} onChange={event => {
        const value = event.target.value;
        if (value === "" || VOLUNTEER_AVAILABILITY.some(option => option === value)) {
          setAvailability(value as VolunteerAvailability | "");
        }
      }}>
        <option value="">Discuss with the team</option>
        {VOLUNTEER_AVAILABILITY.map(option => <option value={option} key={option}>{option}</option>)}
      </select>
    </label>
    <div className={styles.action}>
      <a className="v2-button" href={href}>
        Prepare email to Amaana <span aria-hidden="true">↗</span>
      </a>
      <p>Opens your own email application with your chosen categories. Nothing is sent to Amaana until you review and send the email. If your email app does not open, use the <Link href="/contact">official contact options</Link>.</p>
    </div>
    <p className={styles.safety}>Please do not include ID documents, medical information, beneficiary photographs, bank details or other sensitive records in a volunteering enquiry. Participation is always voluntary.</p>
  </div>;
}
