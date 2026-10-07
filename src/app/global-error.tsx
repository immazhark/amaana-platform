"use client";

import { amaanaBodyFont, amaanaDisplayFont } from "./fonts";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en-IN" className={`${amaanaBodyFont.variable} ${amaanaDisplayFont.variable}`}>
      <head>
        <title>Temporary interruption | Amaana Foundation</title>
      </head>
      <body style={{ margin: 0, fontFamily: "var(--font-amaana-body), Arial, Helvetica, sans-serif", background: "#eee5d2", color: "#122239" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", boxSizing: "border-box", background: "url(/backgrounds/amaana-arch-emblem.svg) right 1rem top 1rem/clamp(6rem,12vw,11rem) auto no-repeat,url(/backgrounds/amaana-lattice-tile.svg) 0 0/104px 104px repeat,linear-gradient(235deg,#4575a1 16%,#91a6b0 34%,#cecfc0 48%,#eee5d2 70%)" }}>
          <section style={{ width: "min(900px,100%)", borderTop: "1px solid rgba(224,179,24,.55)", paddingTop: "2rem" }}>
            <p style={{ color: "#756349", fontSize: ".72rem", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase" }}>Amaana Foundation · temporary interruption</p>
            <h1 style={{ maxWidth: "760px", margin: "1rem 0 2rem", fontFamily: "var(--font-amaana-display), serif", fontSize: "clamp(3.3rem,9vw,8rem)", fontWeight: 400, lineHeight: .85, letterSpacing: "-.055em" }}>The platform is temporarily unavailable.</h1>
            <p style={{ maxWidth: "620px", color: "#4d5d72", fontSize: "1.08rem", lineHeight: 1.7 }}>Please try again. No payment password, OTP, UPI PIN or card credential is ever required to report a technical problem.</p>
            <button type="button" onClick={reset} style={{ marginTop: "1.5rem", border: 0, padding: ".95rem 1.35rem", background: "#e0b318", color: "#102039", font: "inherit", fontWeight: 800, cursor: "pointer" }}>Try again →</button>
          </section>
        </main>
      </body>
    </html>
  );
}
