import type { ReactNode } from "react";
import { PageHero, type PageHeroVariant } from "@/components/page-hero";
import "@/app/canonical-content.css";

export type ArticleBlock = {
  title: string;
  paragraphs?: string[];
  items?: string[];
  presentation?: "default" | "labelled" | "card-list";
};

export type ArticlePathway = {
  label: string;
  href: string;
  description: string;
};

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
  bodyClassName?: string;
  heroActions?: { label: string; href: string; secondary?: boolean }[];
  bodyId?: string;
  pathways?: ArticlePathway[];
};

function hasMeaningfulBlockContent(block: ArticleBlock) {
  return Boolean(block.paragraphs?.some(paragraph => paragraph.trim()) || block.items?.some(item => item.trim()));
}

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
  bodyClassName,
  heroActions,
  bodyId,
  pathways,
}: CanonicalArticleProps) {
  const visibleBlocks = blocks.filter(block => block.title.trim() && hasMeaningfulBlockContent(block));
  const visiblePathways = pathways?.filter(pathway => pathway.label.trim() && pathway.href.trim() && pathway.description.trim()) ?? [];

  return (
    <div className="v2-home canonical-article">
      <PageHero
        variant={heroVariant}
        eyebrow={heroVariant === "trust" ? "Trust & Policies" : eyebrow}
        title={title}
        description={<p>{intro}</p>}
        actions={heroActions ?? [
          { label: "Explore Our Work", href: "/our-work" },
          { label: "Contact Amaana", href: "/contact", secondary: true },
        ]}
        visual={heroVisual}
        visualKicker={heroVariant === "trust" ? eyebrow : "Amaana Foundation"}
        visualTitle={heroVisualTitle ?? title}
        visualNote={heroVisualNote ?? (heroVariant === "trust"
          ? "A public record of Amaana’s governance, accountability and responsible operating boundaries."
          : "Purpose, evidence and responsible service—presented with clarity.")}
      />

      <section className="v2-section paper" id={bodyId}>
        <div className={`v2-shell canonical-body${bodyClassName ? ` ${bodyClassName}` : ""}`}>
          {visibleBlocks.map((block, index) => (
            <section
              className={`canonical-block${block.presentation === "labelled" ? " canonical-block--labelled" : ""}${block.presentation === "card-list" ? " canonical-block--card-list" : ""}`}
              key={`${block.title}-${index}`}
            >
              <h2>{block.title}</h2>
              <div>
                {block.paragraphs?.filter(Boolean).map((paragraph, paragraphIndex) => <p key={paragraphIndex}>{paragraph}</p>)}
                {block.items && <ul>{block.items.filter(Boolean).map((item, itemIndex) => <li key={itemIndex}>{item}</li>)}</ul>}
              </div>
            </section>
          ))}

          {children}

          {visiblePathways.length > 0 && (
            <nav className="canonical-pathways" aria-label="Continue exploring Amaana">
              {visiblePathways.map(pathway => (
                <a className="canonical-pathway" href={pathway.href} key={pathway.href}>
                  <span>{pathway.label}</span>
                  <p>{pathway.description}</p>
                  <strong aria-hidden="true">Continue →</strong>
                </a>
              ))}
            </nav>
          )}
        </div>
      </section>
    </div>
  );
}
