import Link from "next/link";
import { buildFeedbackEnquiryHref, FEEDBACK_KINDS } from "@/lib/feedback-enquiry";

/** No client data capture: the visitor's own mail application owns any draft.
 * The approved message text explicitly rejects implied testimonial consent. */
export function FeedbackEnquiryBuilder() {
  return <div>
    <h3>Choose your conversation</h3>
    <p>Choose the type of message to prepare. You can explain your experience
      in your own email application before sending. Amaana does not receive
      or store anything from this page.</p>
    <div className="v2-hero-actions" role="group" aria-label="Private feedback email topics">
      {FEEDBACK_KINDS.map(kind =>
        <a key={kind.id} className="v2-button"
          href={buildFeedbackEnquiryHref(kind.id, "general")}>{kind.label}</a>)}
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
