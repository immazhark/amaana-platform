import Link from "@/components/navigation-link";
import { WorkVisualPlaceholder } from "@/components/work-visual-placeholder";
import type { PublicAppeal } from "@/lib/appeals";
import { getPublicAppealProgress } from "@/lib/public-appeal-progress";
import { PublicFundingMeter } from "@/components/public-funding-meter";

export function AppealCard({ appeal }: { appeal: PublicAppeal }) {
  const progress = getPublicAppealProgress(appeal.amountRaised, appeal.goalAmount);

  return (
    <article className="v2-appeal-card">
      <div className="v2-appeal-card-visual"><WorkVisualPlaceholder label={appeal.title} /></div>
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
          {progress ? <>
            <div className="v2-appeal-progress-meta"><strong>{progress.raisedLabel}</strong><span>of {progress.goalLabel}</span></div>
            <PublicFundingMeter progress={progress} title={appeal.title} trackClassName="v2-appeal-progress"/>
            <div className="v2-appeal-progress-foot"><span>{progress.percentage}% supported</span><span>Reviewed appeal figures</span></div>
          </> : <p role="status">Financial figures are under reconciliation. Review the case details before contributing.</p>}
        </div>
      </div>
      <Link href={`/appeals/${appeal.slug}`} className="v2-appeal-card-link" aria-label={`Understand this need: ${appeal.title}`}><span>Understand this need</span><strong aria-hidden="true">↗</strong></Link>
    </article>
  );
}
