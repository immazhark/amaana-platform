import { TALEEM_CATALOGUE, type TaleemCatalogue, type TaleemProgrammeId } from "@/content/taleem-catalogue";
import styles from "./taleem-fees.module.css";

// Which programmes' fees each Taleem page states. The overview shows all three; a programme page shows its own.
const PROGRAMMES_FOR_SLUG: Record<string, readonly TaleemProgrammeId[]> = {
  taleem: ["qaida", "nazira", "hifdh-day-scholar"],
  "taleem-nazira-sponsorship": ["nazira"],
  "taleem-hifdh-sponsorship": ["hifdh-day-scholar"],
};

const rupees = (amount: number) => `₹${amount.toLocaleString("en-IN")}`;

/** The fee rows for a Taleem page, from the one versioned price source. Only programmes that are available and
 * owner-approved are shown, and amounts that are not whole rupees are never rounded into a claim. */
export function taleemFeeRows(slug: string, catalogue: TaleemCatalogue = TALEEM_CATALOGUE) {
  const wanted = PROGRAMMES_FOR_SLUG[slug];
  if (!wanted) return [];
  return catalogue.programmes
    .filter(item => wanted.includes(item.id) && item.available && item.approval === "APPROVED" && item.monthlyPaise > 0 && item.monthlyPaise % 100 === 0)
    .map(item => ({ id: item.id, name: item.name, monthlyRupees: item.monthlyPaise / 100 }));
}

export function TaleemFees({ slug, catalogue }: { slug: string; catalogue?: TaleemCatalogue }) {
  const rows = taleemFeeRows(slug, catalogue);
  if (rows.length === 0) return null;
  return (
    <section className="v2-section paper" aria-labelledby="taleem-fees">
      <div className="v2-shell">
        <h2 id="taleem-fees">{rows.length === 1 ? "The programme fee" : "Programme fees"}</h2>
        <ul className={styles.fees}>
          {rows.map(row => (
            <li className={styles.fee} key={row.id}>
              <span className={styles.name}>{row.name}</span>
              <span className={styles.amount}>{rupees(row.monthlyRupees)}</span>
              <span className={styles.per}>a month for each student</span>
            </li>
          ))}
        </ul>
        <p className={styles.note}>These are programme-level sponsorship contributions per student per month. They are not a statement of what the Madarsah itself charges.</p>
      </div>
    </section>
  );
}
