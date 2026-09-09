import Link from "next/link";
import { formatINR, type PublicAppeal } from "@/lib/appeals";

export function AppealCard({ appeal }: { appeal: PublicAppeal }) {
  const progress = Math.min(100, Math.round((appeal.raised / appeal.goal) * 100));
  return <article className="card appeal-card">
    <div className="appeal-visual"><span className="tag">{appeal.category}</span></div>
    <div className="appeal-body"><p className="muted">{appeal.location}</p><h3>{appeal.title}</h3><p>{appeal.summary}</p><div className="progress" aria-label={`${progress}% funded`}><span style={{width: `${progress}%`}} /></div><p><strong>{formatINR(appeal.raised)}</strong> raised of {formatINR(appeal.goal)}</p><Link className="button secondary" href={`/appeals/${appeal.slug}`}>View appeal</Link></div>
  </article>;
}
