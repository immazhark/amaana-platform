import Link from "next/link";
import styles from "./mobile-support-bar.module.css";

type MobileSupportBarProps = {
  href: string;
  label: string;
  context?: string;
};

export function MobileSupportBar({ href, label, context }: MobileSupportBarProps) {
  return (
    <aside className={styles.root} aria-label="Quick support action">
      <div className={styles.inner}>
        {context ? <span className={styles.context}>{context}</span> : null}
        <Link className={styles.action} href={href}>{label}</Link>
      </div>
    </aside>
  );
}
