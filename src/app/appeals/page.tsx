import type { Metadata } from "next";
import { AppealCard } from "@/components/appeal-card";
import { appeals } from "@/lib/appeals";

export const metadata: Metadata = { title: "Appeals", description: "Explore current verified support appeals from Amaana Foundation." };

export default function AppealsPage() {
  return <><section className="page-hero"><div className="container"><p className="eyebrow">Verified needs</p><h1>Current appeals</h1><p className="lead">Every published case has passed our internal review process. Choose a cause and contribute with confidence.</p></div></section><section className="section"><div className="container"><div className="grid appeal-grid">{appeals.map(appeal => <AppealCard key={appeal.slug} appeal={appeal} />)}</div></div></section></>;
}
