import Link from "next/link";
import { formatINR, type PublicAppeal } from "@/lib/appeals";

export function AppealCard({ appeal }: { appeal: PublicAppeal }) {
  const raised = typeof appeal.amountRaised === "number" ? appeal.amountRaised : appeal.amountRaised.toNumber();
  const goal = typeof appeal.goalAmount === "number" ? appeal.goalAmount : appeal.goalAmount.toNumber();
  const progress = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;

  return (
    <article className="v2-appeal-card">
      <div className="v2-appeal-card-head">
        <span>{appeal.category.replaceAll("_", " ")}</span>
        <small>{appeal.beneficiaryLocation || "Location withheld"}</small>
      </div>
      <div className="v2-appeal-card-body">
        <div>
          <h3>{appeal.title}</h3>
          <p>{appeal.summary}</p>
        </div>
        <div className="v2-appeal-card-progress">
          <div className="v2-appeal-progress-meta"><strong>{formatINR(raised)}</strong><span>of {formatINR(goal)}</span></div>
          <div className="v2-appeal-progress" aria-label={`${progress}% funded`}><span style={{ width: `${progress}%` }} /></div>
          <div className="v2-appeal-progress-foot"><span>{progress}% supported</span><span>Verified appeal</span></div>
        </div>
      </div>
      <Link href={`/appeals/${appeal.slug}`} className="v2-appeal-card-link"><span>Understand this need</span><strong>↗</strong></Link>
    </article>
  );
}
