import { TALEEM_HIFDH_COMPLETIONS, TALEEM_HIFDH_COMPLETIONS_SENTENCE } from "@/content/taleem-facts";

// Pages that may state the Hifdh completion figure: the overview and the Hifdh programme. Never the Qaida or Nazira pages.
const SLUGS = new Set(["taleem", "taleem-hifdh-sponsorship"]);

/** The owner-confirmed count of sponsored students who completed Hifdh this year, with what it does and does not count. It
 * is a separate figure from the number of sponsored students and is never added to it. */
export function TaleemMilestone({ slug }: { slug: string }) {
  if (!SLUGS.has(slug)) return null;
  return (
    <section className="v2-section" aria-labelledby="taleem-hifdh-completions">
      <div className="v2-shell">
        <h2 id="taleem-hifdh-completions">Hifdh completions in {TALEEM_HIFDH_COMPLETIONS.year}</h2>
        <p>{TALEEM_HIFDH_COMPLETIONS_SENTENCE}</p>
        <p className="muted">
          As of {TALEEM_HIFDH_COMPLETIONS.asOf.label}. This counts only students in Amaana’s sponsored cohort. It is a separate figure from the number of sponsored students and is not added to it. Students are not named or shown.
        </p>
      </div>
    </section>
  );
}
