// Keep the former shared geometry ahead of route detail and card refinements.
import "./appeal-funding-geometry.css";
import "../appeal-card.css";
import "../appeals.css";
import "../appeals-wow.css";

export default function AppealsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
