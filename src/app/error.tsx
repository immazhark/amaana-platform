"use client";

import { useEffect } from "react";
export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error("Application route failed", error.digest ?? error.message); }, [error]);
  return <section className="section"><div className="container"><div className="card form-card"><p className="eyebrow">Something went wrong</p><h1>We couldn’t load this page.</h1><p className="lead">Please try again. If the problem continues, contact Amaana Foundation without sharing passwords, OTPs or payment credentials.</p><button className="button" onClick={reset}>Try again</button></div></div></section>;
}
