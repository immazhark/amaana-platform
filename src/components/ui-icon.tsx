/** Shared optical grid for functional icons; labels belong to the control. */
export function UIIcon({ name, className }: { name: "previous" | "next" | "play" | "pause" | "menu" | "close" | "up"; className?: string }) {
  const paths = {
    previous: "m14.5 5-7 7 7 7",
    next: "m9.5 5 7 7-7 7",
    play: "m8 5 11 7-11 7V5Z",
    pause: "M8 5v14M16 5v14",
    menu: "M4 7h16M4 12h16M4 17h16",
    close: "m6 6 12 12M18 6 6 18",
    up: "m5 14.5 7-7 7 7",
  };
  return <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={paths[name]} /></svg>;
}
