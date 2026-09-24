
import styles from "./policy-toc.module.css";

export type PolicyTocItem = { id: string; label: string };

export function PolicyToc({ items }: { items: readonly PolicyTocItem[] }) {
  return (
    <nav className={styles.nav} aria-label="On this page">
      <span className={styles.kicker}>On this page</span>
      <ol>
        {items.map((item, index) => (
          <li key={item.id}>
            <a href={`#${item.id}`}>
              <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
              {item.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
