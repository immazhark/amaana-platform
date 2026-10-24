import styles from "./verification-faq.module.css";
import { VERIFICATION_FAQ, serializeVerificationFaqSchema } from "@/lib/verification-faq";

/** Accessible source-of-truth FAQ with matching machine-readable answers.
 * FAQ schema does not guarantee a Google search enhancement. */
export function VerificationFaq() {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://amaanafoundation.org";
  return <section className={styles.root} aria-labelledby="verification-faq-heading" id="verification-faq">
    <div className={styles.heading}>
      <span>Common questions</span>
      <h2 id="verification-faq-heading">How verification and giving work.</h2>
      <p>Plain answers about what Amaana reviews, what stays private and what a donor can expect.</p>
    </div>
    <div className={styles.entries}>
      {VERIFICATION_FAQ.map(item =>
        <details key={item.question} className={styles.entry}>
          <summary>{item.question}</summary>
          <p>{item.answer}</p>
        </details>)}
    </div>
    <script type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeVerificationFaqSchema(siteUrl) }}/>
  </section>;
}
