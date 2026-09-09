import type { Metadata } from "next";
import { AppealCard } from "@/components/appeal-card";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Appeals", description: "Explore current verified support appeals from Amaana Foundation." };

export const dynamic = "force-dynamic";
export default async function AppealsPage() {
  const appeals = await prisma.appeal.findMany({ where: { status: { in: ["PUBLISHED", "FUNDED"] } }, orderBy: [{ isFeatured: "desc" }, { featuredOrder: "asc" }, { publishedAt: "desc" }] });
  return <><section className="page-hero"><div className="container"><p className="eyebrow">Verified needs</p><h1>Current appeals</h1><p className="lead">Every published case has passed our internal review process. Choose a cause and contribute with confidence.</p></div></section><section className="section"><div className="container">{appeals.length ? <div className="grid appeal-grid">{appeals.map(appeal => <AppealCard key={appeal.slug} appeal={appeal} />)}</div> : <div className="card"><h2>No active appeals</h2><p className="muted">Please check again soon for newly verified cases.</p></div>}</div></section></>;
}
