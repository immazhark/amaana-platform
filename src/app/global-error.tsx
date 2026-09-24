"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, Helvetica, sans-serif", background: "#102039", color: "#fffaf1" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: "2rem", boxSizing: "border-box", background: "radial-gradient(circle at 78% 18%, rgba(224,179,24,.14), transparent 24%), linear-gradient(135deg,#102039,#1d3150)" }}>
          <section style={{ width: "min(900px,100%)", borderTop: "1px solid rgba(224,179,24,.55)", paddingTop: "2rem" }}>
            <p style={{ color: "#f4e9b5", fontSize: ".72rem", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase" }}>Amaana Foundation · temporary interruption</p>
            <h1 style={{ maxWidth: "760px", margin: "1rem 0 2rem", fontFamily: "Georgia, 'Times New Roman', serif", fontSize: "clamp(3.3rem,9vw,8rem)", fontWeight: 400, lineHeight: .85, letterSpacing: "-.055em" }}>The platform is temporarily unavailable.</h1>
            <p style={{ maxWidth: "620px", color: "rgba(255,250,241,.66)", fontSize: "1.08rem", lineHeight: 1.7 }}>Please try again. No payment password, OTP, UPI PIN or card credential is ever required to report a technical problem.</p>
            <button type="button" onClick={reset} style={{ marginTop: "1.5rem", border: 0, padding: ".95rem 1.35rem", background: "#e0b318", color: "#102039", font: "inherit", fontWeight: 800, cursor: "pointer" }}>Try again →</button>
          </section>
        </main>
      </body>
    </html>
  );
}
