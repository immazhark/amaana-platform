import type { ReactNode } from "react";
import { PageHero, type PageHeroVariant } from "@/components/page-hero";
import "@/app/canonical-content.css";

export type ArticleBlock = { title: string; paragraphs?: string[]; items?: string[]; presentation?: "default" | "labelled" };

type CanonicalArticleProps = {
  title: string;
  intro: string;
  eyebrow: string;
  blocks: ArticleBlock[];
  children?: ReactNode;
  heroVariant?: PageHeroVariant;
  heroVisual?: ReactNode;
  heroVisualTitle?: string;
  heroVisualNote?: string;
};

export function CanonicalArticle({
  title,
  intro,
  eyebrow,
  blocks,
  children,
  heroVariant = "information",
  heroVisual,
  heroVisualTitle,
  heroVisualNote,
}: CanonicalArticleProps) {
  return (
    <div className="v2-home canonical-article">
      <PageHero
        variant={heroVariant}
        eyebrow={heroVariant === "trust" ? "Trust & Policies" : eyebrow}
        title={title}
        description={<p>{intro}</p>}
        actions={[
          { label: "Explore Our Work", href: "/our-work" },
          { label: "Contact Amaana", href: "/contact", secondary: true },
        ]}
        visual={heroVisual}
        visualKicker={heroVariant === "trust" ? eyebrow : "Amaana Foundation"}
        visualTitle={heroVisualTitle ?? title}
        visualNote={heroVisualNote ?? (heroVariant === "trust" ? "A public record of Amaana’s governance, accountability and responsible operating boundaries." : "Purpose, evidence and responsible service—presented with clarity.")}
      />
      <section className="v2-section paper">
        <div className="v2-shell canonical-body">
          {blocks.map((block, index) => (
            <section className={`canonical-block${block.presentation === "labelled" ? " canonical-block--labelled" : ""}`} key={index}>
              <h2>{block.title}</h2>
              <div>
                {block.paragraphs?.map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
                {block.items && <ul>{block.items.map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul>}
              </div>
            </section>
          ))}
          {children}
        </div>
      </section>
    </div>
  );
}
