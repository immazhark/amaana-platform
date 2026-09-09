import { notFound } from "next/navigation";
import { DonationForm } from "@/components/donation-form";
import { prisma } from "@/lib/prisma";

type Props = { params: Promise<{ slug: string }> };
export const dynamic = "force-dynamic";
export default async function DonatePage({ params }: Props) {
  const { slug } = await params; const appeal = await prisma.appeal.findFirst({ where: { slug, status: "PUBLISHED" }, select: { id: true, title: true, summary: true } }); if (!appeal) notFound();
  return <><section className="page-hero"><div className="container"><p className="eyebrow">Domestic donation</p><h1>Support this appeal</h1><h2>{appeal.title}</h2><p className="lead">{appeal.summary}</p></div></section><section className="section"><div className="container"><DonationForm appealId={appeal.id} appealTitle={appeal.title}/></div></section></>;
}
