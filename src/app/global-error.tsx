"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) { return <html lang="en"><body><main className="section"><div className="container"><h1>Amaana Foundation is temporarily unavailable.</h1><p>Please try again shortly.</p><button className="button" onClick={reset}>Try again</button></div></main></body></html>; }
