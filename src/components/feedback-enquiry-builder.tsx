import Link from "next/link";
import { ActionIcon } from "@/components/action-icon";
import {
  buildFeedbackEnquiryHref, FEEDBACK_KINDS, FEEDBACK_TOPICS,
  parseFeedbackPreferences,
} from "@/lib/feedback-enquiry";
import styles from "@/components/participation-card.module.css";

type Preferences = Record<string, string | string[] | undefined>;

/** Native server-reviewed fixed-choice contact. No client hydration, stored
 * complaint records or automatic email; the visitor decides whether to send. */
export function FeedbackEnquiryBuilder({ preferences = {} }: { preferences?: Preferences }) {
  const requested = Object.keys(preferences).length > 0;
  const selection = requested ? parseFeedbackPreferences(preferences) : null;
  const selectedKind = selection ? FEEDBACK_KINDS.find(kind => kind.id === selection.kind) : null;
  const selectedTopic = selection ? FEEDBACK_TOPICS.find(topic => topic.id === selection.topic) : null;

  return <div>
    <h3>Choose your conversation</h3>
    <p>Choose a type of message and the area it concerns. You can explain your
      experience in your own email application before sending. Amaana does not
      receive or store anything from this page.</p>
    <form method="get" action="/contact/feedback#feedback-review">
      <input type="hidden" name="intent" value="review" />
      <fieldset style={{ minWidth: 0, padding: 0, margin: 0, border: 0 }}>
        <legend>Private feedback email topics</legend>
        <div className={styles.grid} role="group" aria-label="Private feedback email topics">
          {FEEDBACK_KINDS.map(kind =>
            <label key={kind.id} className={styles.card} data-feedback-kind={kind.id}>
              <input type="radio" name="kind" value={kind.id} required
                aria-labelledby={`feedback-kind-${kind.id}`}
                aria-describedby={`feedback-description-${kind.id}`}
                defaultChecked={selection?.kind === kind.id} />
              <span className={styles.marker} aria-hidden="true"><ActionIcon kind="message" /></span>
              <div className={styles.copy}>
                <h3 id={`feedback-kind-${kind.id}`}>{kind.label}</h3>
                <p id={`feedback-description-${kind.id}`}>{kind.guidance}</p>
              </div>
              <span className={styles.action}>Select this conversation</span>
            </label>)}
        </div>
      </fieldset>
      <div className="v2-hero-actions">
        <label htmlFor="feedback-topic">Feedback topic</label>
        <select id="feedback-topic" name="topic" defaultValue={selection?.topic ?? "general"}>
          {FEEDBACK_TOPICS.map(topic => <option key={topic.id} value={topic.id}>{topic.label}</option>)}
        </select>
        <button type="submit" className="v2-button">Review feedback</button>
      </div>
    </form>
    <div id="feedback-review">
      {requested && !selection ? (
        <p role="alert">These feedback preferences could not be read. Choose approved options to review again.</p>
      ) : selectedKind && selectedTopic && selection ? (
        <div className={styles.card}>
          <h3>Review your feedback</h3>
          <p>Conversation: {selectedKind.label}</p>
          <p>Topic: {selectedTopic.label}</p>
          <a className="v2-button" href={buildFeedbackEnquiryHref(selection.kind, selection.topic)}>
            Open prepared feedback email
          </a>
          <p>Nothing has been sent. Review, add your own explanation and send in your email application.</p>
        </div>
      ) : null}
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
