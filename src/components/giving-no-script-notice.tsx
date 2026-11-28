import styles from "./donation-methods.module.css";

/** Native recovery links only: never starts or represents a donation. */
export function GivingNoScriptNotice() {
  return <noscript>
    <div className={styles.noScript}>
      <p><strong>Interactive payment options require JavaScript.</strong></p>
      <p>Enable JavaScript, or contact Amaana to discuss currently approved donation options. If you already paid, keep your payment confirmation and contact the team before paying again.</p>
      <p className={styles.noScriptLinks}>
        <a href="/contact">Contact Amaana</a>
        <a href="/donation-policy">Read donation policy</a>
      </p>
    </div>
  </noscript>;
}
