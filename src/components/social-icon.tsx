export type SocialNetwork = "instagram" | "facebook" | "youtube" | "threads" | "linkedin";


export function SocialIcon({ network }: { network: SocialNetwork }) {
  if (network === "instagram") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5.1" /><circle cx="12" cy="12" r="4.15" /><circle cx="17.55" cy="6.55" r="1.05" className="social-icon-fill" /></svg>;
  if (network === "facebook") return <svg viewBox="0 0 24 24" aria-hidden="true"><path className="social-icon-fill" d="M13.7 21v-8h2.75l.42-3.13H13.7V7.88c0-.9.26-1.52 1.6-1.52h1.7V3.58c-.3-.04-1.3-.13-2.48-.13-2.45 0-4.13 1.46-4.13 4.15v2.27H7.62V13h2.77v8h3.31Z" /></svg>;
  if (network === "youtube") return <svg viewBox="0 0 24 24" aria-hidden="true"><path className="social-icon-fill" d="M21.35 7.2a2.95 2.95 0 0 0-2.08-2.09C17.43 4.6 12 4.6 12 4.6s-5.43 0-7.27.5A2.95 2.95 0 0 0 2.65 7.2 30.8 30.8 0 0 0 2.15 12c0 1.62.17 3.24.5 4.8a2.95 2.95 0 0 0 2.08 2.09c1.84.5 7.27.5 7.27.5s5.43 0 7.27-.5a2.95 2.95 0 0 0 2.08-2.09c.33-1.56.5-3.18.5-4.8s-.17-3.24-.5-4.8Z" /><path className="social-icon-cutout" d="m10.05 15.45 5.08-3.45-5.08-3.45v6.9Z" /></svg>;
  if (network === "threads") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.12 3.25c4.95 0 8.07 3.12 8.2 8.08.12 4.7-2.7 8.22-7.06 8.42-3.1.14-5.53-1.42-5.61-4.12-.07-2.3 1.73-3.94 4.42-4.04 1.25-.05 2.46.2 3.55.72-.14-2.05-1.4-3.19-3.57-3.19-1.55 0-2.83.55-3.82 1.64L6.7 8.92c1.45-1.53 3.23-2.3 5.35-2.3 3.9 0 6.2 2.26 6.29 6.18.08 3.12-1.8 4.93-4.84 5.05-1.99.08-3.33-.8-3.37-2.2-.04-1.13.86-1.84 2.24-1.9 1.2-.04 2.32.3 3.36 1.02.24-.58.35-1.25.33-2.01-.1-3.77-2.32-5.86-6.06-5.86-3.94 0-6.54 2.67-6.54 6.7 0 4.31 3.06 7.16 7.6 7.16 2.37 0 4.39-.74 5.92-2.16" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path className="social-icon-fill" d="M5.4 8.1H2.3V21h3.1V8.1ZM3.85 3A1.85 1.85 0 1 0 3.85 6.7 1.85 1.85 0 0 0 3.85 3Zm4.2 5.1V21h3.1v-6.4c0-1.7.32-3.35 2.44-3.35 2.1 0 2.12 1.96 2.12 3.46V21h3.1v-7.1c0-3.49-.75-6.17-4.82-6.17-1.95 0-3.26 1.07-3.79 2.08h-.04V8.1H8.05Z" /></svg>;
}

