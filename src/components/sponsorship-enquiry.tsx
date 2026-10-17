import Link from "next/link";
import { buildSponsorshipEnquiry, parseSponsorshipEnquiry, SPONSORSHIP_PATHS, SPONSORSHIP_SUPPORT } from "@/lib/sponsorship-enquiry";
import styles from "./volunteer-interest-builder.module.css";

type Props = { preferences: Record<string, string | string[] | undefined> };

export function SponsorshipEnquiry({ preferences }: Props) {
  const requested = Object.keys(preferences).length > 0;
  const selection = requested ? parseSponsorshipEnquiry(preferences) : null;
  const prepared = selection ? buildSponsorshipEnquiry(selection) : null;
  return <section className="v2-shell" id="sponsorship-enquiry" aria-labelledby="sponsorship-enquiry-title">
    <form className={styles.builder} method="get" action="/get-involved/sponsor-education#sponsorship-enquiry">
      <div className={styles.intro}><h2 id="sponsorship-enquiry-title">Prepare your sponsorship enquiry</h2><p>Choose your interests, then review a message for the team. Amaana will confirm current need, scope and cost before you decide.</p></div>
      {requested && !selection ? <p role="alert">These preferences could not be read. Choose from the options below and review your enquiry again.</p> : null}
      <label className={styles.availability}>Education pathway
        <select name="path" defaultValue={selection?.path ?? "discuss"}>
          {Object.entries(SPONSORSHIP_PATHS).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
      </label>
      <label className={styles.availability}>Support preference
        <select name="support" defaultValue={selection?.support ?? "discuss"}>
          {Object.entries(SPONSORSHIP_SUPPORT).map(([value, label]) => <option value={value} key={value}>{label}</option>)}
        </select>
      </label>
      <label className={styles.skill}><input name="privateName" type="checkbox" value="yes" defaultChecked={selection?.privateName ?? false} /><span>Ask to keep my name out of public recognition. Financial and receipt records may still need my details.</span></label>
      <div className={styles.action}><button type="submit" className="v2-button">Review enquiry</button><p>Only these categories are included in the page request. Do not enter student details or personal records.</p></div>
    </form>
    {prepared ? <div className={styles.builder} aria-labelledby="sponsorship-review-title">
      <h3 id="sponsorship-review-title">Review before opening your email</h3>
      {prepared.body.split("\n").filter(Boolean).map((line, index) => <p key={index}>{line}</p>)}
      <div className={styles.action}><a className="v2-button" href={prepared.href}>Open email with these preferences</a><p>Nothing has been sent. Review and send the message in your email application. If it does not open, copy the message above and email <a href="mailto:amaanafoundation24@gmail.com">amaanafoundation24@gmail.com</a>, or use the <Link href="/contact" prefetch={false}>official contact options</Link>.</p></div>
    </div> : null}
    <p className={styles.safety}>No placement is reserved and no payment is authorized here. School and college support remain developing pathways. Please keep student names, documents, bank details and photographs out of this enquiry.</p>
  </section>;
}
