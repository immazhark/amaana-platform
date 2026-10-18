import Link from "next/link";
import { buildSponsorshipEnquiry, parseSponsorshipEnquiry, SPONSORSHIP_PATHS, SPONSORSHIP_SUPPORT } from "@/lib/sponsorship-enquiry";

type Preferences = Record<string, string | string[] | undefined>;

/** No student or donor PII, client hydration, inventory reservations, recurring
 * mandates or site-side storage. Native GET fields contain reviewed categories
 * only; the visitor sends their own message after reviewing it. */
export function SponsorshipEnquiry({ preferences }: { preferences: Preferences }) {
  const requested = Object.keys(preferences).length > 0;
  const selection = requested ? parseSponsorshipEnquiry(preferences) : null;
  const prepared = selection ? buildSponsorshipEnquiry(selection) : null;

  return <section className="v2-shell taleem-process" id="sponsorship-enquiry" aria-labelledby="sponsorship-enquiry-title">
    <form className="taleem-path" method="get" action="/get-involved/sponsor-education#sponsorship-enquiry">
      <h2 id="sponsorship-enquiry-title">Prepare your sponsorship enquiry</h2>
      <p>Choose an education interest and how you may wish to contribute. Amaana must confirm the current need and cost before any decision.</p>
      {requested && !selection ? <p role="alert">These preferences could not be read. Choose from the options below and review again.</p> : null}
      <label style={{ display: "grid", gap: ".5rem", width: "100%" }}>
        Education pathway
        <select style={{ width: "100%", minHeight: "3rem" }} name="path" defaultValue={selection?.path ?? "discuss"}>
          {Object.entries(SPONSORSHIP_PATHS).map(([value, label]) =>
            <option value={value} key={value}>{label}</option>)}
        </select>
      </label>
      <label style={{ display: "grid", gap: ".5rem", width: "100%" }}>
        Support preference
        <select style={{ width: "100%", minHeight: "3rem" }} name="support" defaultValue={selection?.support ?? "discuss"}>
          {Object.entries(SPONSORSHIP_SUPPORT).map(([value, label]) =>
            <option value={value} key={value}>{label}</option>)}
        </select>
      </label>
      <label><input name="privateName" type="checkbox" value="yes"
        defaultChecked={selection?.privateName ?? false} />
        {" "}Ask to keep my name out of public recognition. Financial and receipt records may still need my details.
      </label>
      <button type="submit" className="v2-button">Review enquiry</button>
      <p>Only these fixed categories are included in the page request. Do not enter student names, documents or personal records.</p>
    </form>
    {prepared ? <div className="taleem-path" aria-labelledby="sponsorship-review-title">
      <h3 id="sponsorship-review-title">Review before opening your email</h3>
      {prepared.body.split("\n").filter(Boolean).map((line, index) => <p key={index}>{line}</p>)}
      <a className="v2-button" href={prepared.href}>Open email with these preferences</a>
      <p>Nothing has been sent. Review and send the message in your email application. If it does not open, copy the message above and email <a href="mailto:amaanafoundation24@gmail.com">amaanafoundation24@gmail.com</a>, or use the <Link href="/contact">official contact options</Link>.</p>
    </div> : null}
    <p>No student placement is reserved and no payment is authorized here. School and college support remain developing pathways. Keep student documents, bank details and photographs out of this enquiry.</p>
  </section>;
}
