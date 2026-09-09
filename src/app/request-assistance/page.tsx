import type { Metadata } from "next";
import { AssistanceForm } from "@/components/assistance-form";

export const metadata: Metadata = { title: "Request Assistance", description: "Submit an assistance request to Amaana Foundation for review." };

export default function RequestAssistancePage() {
  return <><section className="page-hero"><div className="container"><p className="eyebrow">Ask for help</p><h1>Request assistance</h1><p className="lead">Share the essential details below. Submission does not guarantee assistance; our team will contact you for proofs and verification.</p></div></section><section className="section"><div className="container"><AssistanceForm /></div></section></>;
}
