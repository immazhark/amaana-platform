export function ActionIcon({ kind = "arrow" }: { kind?: "arrow" | "work" | "support" | "assistance" | "volunteer" | "contact" }) {
  const paths = {
    arrow: "M5 12h14m-6-6 6 6-6 6",
    work: "M4 7h16v13H4zM9 7V4h6v3M4 12h16M10 12v3h4v-3",
    support: "M12 20 4 12a5 5 0 0 1 8-6 5 5 0 0 1 8 6z",
    assistance: "M12 3 4 6v6c0 4 4 7 8 9 4-2 8-5 8-9V6zM12 8v8M8 12h8",
    volunteer: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2",
    contact: "M3 5h18v14H3zM3 6l9 7 9-7",
  };
  return <svg className="af-action-icon" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[kind]} /></svg>;
}
