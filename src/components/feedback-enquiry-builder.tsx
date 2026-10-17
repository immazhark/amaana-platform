import Link from "next/link";
import { ActionIcon } from "@/components/action-icon";
import { buildFeedbackEnquiryHref, FEEDBACK_KINDS } from "@/lib/feedback-enquiry";
import styles from "@/components/participation-card.module.css";

/** Private pre-contact choice: no stored submission, automatic email or testimonial consent. */
export function FeedbackEnquiryBuilder() {
  return <div>
    <h3>Choose your conversation</h3>
    <p>Choose the type of message to prepare. You can explain your experience
      in your own email application before sending. Amaana does not receive
      or store anything from this page.</p>
    <div className={styles.grid} role="group" aria-label="Private feedback email topics">
      {FEEDBACK_KINDS.map((kind, index) => <a
        key={kind.id}
        className={styles.card}
        data-feedback-kind={kind.id}
        href={buildFeedbackEnquiryHref(kind.id, "general")}
        aria-labelledby={`feedback-kind-${kind.id}`}
        aria-describedby={`feedback-description-${kind.id}`}
      >
        <span className={styles.marker} aria-hidden="true"><ActionIcon kind="message" /></span>
        <div className={styles.copy}>
          <h3 id={`feedback-kind-${kind.id}`}>{kind.label}</h3>
          <p id={`feedback-description-${kind.id}`}>{kind.guidance}</p>
        </div>
        <span className={styles.action}>Prepare private message
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </a>)}
    </div>
    <p>Concern or complaint: raise service, safety or conduct issues without
      publicly identifying anyone. Suggestions help improve the work.
      Private appreciation is never permission to publish names, quotes or testimonials.</p>
    <p>This is <strong>not a tracked complaint ticket</strong> or an emergency contact
      channel. Nothing is sent until you review and send the email yourself.
      For other ways to reach us, see the <Link href="/contact">official contact options</Link>.</p>
    <p>Do not include identity documents, medical reports, private beneficiary details,
      bank credentials, passwords or OTPs in general feedback emails.
      For a support request, use the <Link href="/request-assistance">private assistance route</Link>.</p>
  </div>;
}
