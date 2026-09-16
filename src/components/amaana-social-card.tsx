export function AmaanaSocialCard() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        overflow: "hidden",
        background: "#466FAA",
        color: "#F9F7F0",
        padding: "72px 78px",
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          width: 430,
          height: 430,
          border: "2px solid rgba(224, 179, 24, 0.30)",
          borderRadius: 999,
          right: -110,
          top: -170,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 290,
          height: 290,
          border: "2px solid rgba(249, 247, 240, 0.14)",
          borderRadius: 999,
          right: 38,
          top: -18,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 12,
          height: 420,
          background: "#E0B318",
          left: 0,
          top: 105,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          zIndex: 1,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: "0.16em",
              color: "#E0B318",
              textTransform: "uppercase",
            }}
          >
            Amaana Foundation · Hyderabad
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              marginTop: 60,
              maxWidth: 880,
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.035em",
            }}
          >
            <span>Upholding Trust.</span>
            <span style={{ color: "#F9F7F0" }}>Serving With Compassion,</span>
            <span style={{ color: "#F9F7F0" }}>Dignity and Accountability.</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 25,
              lineHeight: 1.35,
              maxWidth: 720,
              color: "rgba(249, 247, 240, 0.88)",
            }}
          >
            Verified need. Responsible support. Dignified impact.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              fontWeight: 700,
              letterSpacing: "0.03em",
              color: "#E0B318",
            }}
          >
            amaanafoundation.org
          </div>
        </div>
      </div>
    </div>
  );
}
