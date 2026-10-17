// Archive-only callout styling no longer loads on unrelated pages.
import "./story-archive-polish.css";
import "../stories.css";
import "../stories-wow.css";

export default function StoriesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
