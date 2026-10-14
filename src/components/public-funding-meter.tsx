import type { PublicAppealProgress } from "@/lib/public-appeal-progress";

type Props = {
  progress: PublicAppealProgress;
  title: string;
  trackClassName: string;
  label?: string;
};

/** Shared, accessible financial progress semantics. The parent controls
 * visual geometry; every page uses the same percentage and exact paise text.
 * This is a reviewed funding snapshot, not real-time banking evidence. */
export function PublicFundingMeter({ progress, title, trackClassName, label = "funding progress" }: Props) {
  return <div className={trackClassName} role="progressbar"
    aria-label={`${title} ${label}`} aria-valuemin={0} aria-valuemax={100}
    aria-valuenow={progress.percentage}
    aria-valuetext={`${progress.raisedLabel} raised of ${progress.goalLabel}; ${progress.percentage}% supported`}>
    <span aria-hidden="true" style={{ width: `${progress.percentage}%` }}/>
  </div>;
}
