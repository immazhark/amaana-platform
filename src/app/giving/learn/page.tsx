import type { Metadata } from "next";
import Link from "@/components/navigation-link";
import { getReviewedGivingEducation } from "@/lib/public-charity-education";
import styles from "./charity-education.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Reviewed Islamic Giving Reflections",
  description: "Source-reviewed reflections on generosity and charitable giving, governed by Amaana's religious publication checks.",
  alternates: { canonical: "/giving/learn" },
  robots: { index: false, follow: true },
};

export default async function GivingEducationPage() {
  const items = await getReviewedGivingEducation();
  return <div className={styles.root}>
    <header className={styles.hero}>
      <div className="v2-shell">
        <p className={styles.kicker}>Learning · Verified before publication</p>
        <h1>Learn about giving with care.</h1>
        <p>Explore source-reviewed reflections on generosity, Zakat, Sadaqah and service when Amaana has published them. This library does not issue fatwas, determine Zakat liability or approve a donation destination.</p>
        <div className={styles.actions}>
          <Link className="v2-button" href="/faith-and-reflections">All Faith & Reflections</Link>
          <Link className="v2-text-link" href="/donate">Review currently approved giving routes →</Link>
        </div>
      </div>
    </header>
    <section className={styles.content} aria-labelledby="reviewed-education-heading">
      <div className="v2-shell">
        <div className={styles.intro}>
          <span>Source and publication discipline</span>
          <h2 id="reviewed-education-heading">Only reviewed, published material.</h2>
          <p>Items appear only when they pass the existing religious-review and editorial publication gates, have a verification date and source attribution. Drafts remain private.</p>
        </div>
        {items.length === 0
          ? <div className={styles.empty} role="status">
              <h3>Reviewed giving-specific reflections have not been published yet.</h3>
              <p>Amaana does not fill its educational pages with invented citations or unverified interpretations. Explore the broader reviewed library or ask the team about a programme.</p>
              <Link href="/faith-and-reflections">Explore the reviewed library ↗</Link>
            </div>
          : <ol className={styles.grid}>
              {items.map(item => <li key={item.id}>
                <article className={styles.card}>
                  <span className={styles.type}>{item.type.toLowerCase()} · religious review verified</span>
                  <h3><Link href={"/faith-and-reflections/" + item.slug}>{item.title}</Link></h3>
                  <p>{item.excerpt}</p>
                  <p className={styles.source}><strong>Source:</strong> {item.sourceCitation}</p>
                  <Link className={styles.open} href={"/faith-and-reflections/" + item.slug}>
                    Read reviewed reflection <span aria-hidden="true">↗</span>
                  </Link>
                </article>
              </li>)}
            </ol>}
        <p className={styles.boundary}>Religious learning and financial giving are separate. An article, calculator estimate or reflection never establishes that a particular appeal or fund may accept Zakat.</p>
      </div>
    </section>
  </div>;
}
