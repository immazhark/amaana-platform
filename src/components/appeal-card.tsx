import Link from "next/link";
import { formatINR, type PublicAppeal } from "@/lib/appeals";

export function AppealCard({ appeal }: { appeal: PublicAppeal }) {
  const raised = typeof appeal.amountRaised === "number" ? appeal.amountRaised : appeal.amountRaised.toNumber();
  const goal = typeof appeal.goalAmount === "number" ? appeal.goalAmount : appeal.goalAmount.toNumber();
  const progress = goal > 0 ? Math.min(100, Math.round((raised / goal) * 100)) : 0;
  return <article className="card appeal-card">
    <div className="appeal-visual"><span className="tag">{appeal.category.replaceAll("_", " ")}</span></div>
    <div className="appeal-body"><p className="muted">{appeal.beneficiaryLocation}</p><h3>{appeal.title}</h3><p>{appeal.summary}</p><div className="progress" aria-label={`${progress}% funded`}><span style={{width: `${progress}%`}} /></div><p><strong>{formatINR(raised)}</strong> raised of {formatINR(goal)}</p><Link className="button secondary" href={`/appeals/${appeal.slug}`}>View appeal</Link></div>
  </article>;
}
