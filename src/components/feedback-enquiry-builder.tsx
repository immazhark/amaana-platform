"use client";

import { useState } from "react";
import {
  buildFeedbackEnquiryHref,
  FEEDBACK_KINDS,
  FEEDBACK_TOPICS,
  MAX_FEEDBACK_NOTE_LENGTH,
  type FeedbackKind,
  type FeedbackTopic,
} from "@/lib/feedback-enquiry";
import styles from "./feedback-enquiry-builder.module.css";

/** Everything remains in the visitor's browser until the visitor explicitly
 * chooses to compose and send an email in their own email application. */
export function FeedbackEnquiryBuilder() {
  const [kind, setKind] = useState<FeedbackKind>("concern");
  const [topic, setTopic] = useState<FeedbackTopic>("general");
  const [note, setNote] = useState("");
  const active = FEEDBACK_KINDS.find(item => item.id === kind) ?? FEEDBACK_KINDS[0];
  const href = buildFeedbackEnquiryHref(kind, topic, note);

  return <div className={styles.panel}>
    <div className={styles.intro}>
      <h3>Prepare a private message</h3>
      <p>Select the type of feedback and the area it concerns. This does not post a public review or submit a report to the website.</p>
    </div>
    <fieldset className={styles.fieldset}>
      <legend>What would you like to share?</legend>
      <div className={styles.kindGrid}>
        {FEEDBACK_KINDS.map(option => (
          <label key={option.id} className={styles.kind}>
            <input type="radio" name="feedback-kind" value={option.id} checked={kind === option.id}
              onChange={() => setKind(option.id)}/>
            <span><strong>{option.label}</strong><small>{option.guidance}</small></span>
          </label>
        ))}
      </div>
    </fieldset>
    <label className={styles.topic}>
      Area of concern or feedback
      <select value={topic} onChange={event => {
        const selected = event.target.value;
        if (FEEDBACK_TOPICS.some(option => option.id === selected)) setTopic(selected as FeedbackTopic);
      }}>
        {FEEDBACK_TOPICS.map(option => <option key={option.id} value={option.id}>{option.label}</option>)}
      </select>
    </label>
    <label className={styles.message}>
      Optional message <span>(non-sensitive information only)</span>
      <textarea value={note} onChange={event => setNote([...event.target.value].slice(0, MAX_FEEDBACK_NOTE_LENGTH).join(""))}
        maxLength={MAX_FEEDBACK_NOTE_LENGTH} rows={4}
        aria-describedby="feedback-note-help"
        placeholder="Briefly describe the issue or improvement without names, case documents or account details."/>
    </label>
    <p id="feedback-note-help" className={styles.count}>{[...note].length} / {MAX_FEEDBACK_NOTE_LENGTH} characters. You can edit the prepared message before sending it.</p>
    <div className={styles.action}>
      <a className="v2-button" href={href}>Compose {active.id === "concern" ? "concern" : "feedback"} email <span aria-hidden="true">↗</span></a>
      <p>Opens your email app. Nothing is sent or stored by this page. <strong>You must review and send the email yourself.</strong> This does not create a tracked complaint or guarantee a reply time.</p>
    </div>
    <p className={styles.safety}>Do not include identity documents, medical reports, private beneficiary information, payment credentials or passwords. Email is not the secure assistance-document upload channel. A thank-you or appreciation message is never permission to publish your name or words.</p>
  </div>;
}
