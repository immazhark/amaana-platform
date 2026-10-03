# Unified body carousel implementation

All body tracks begin at the container’s left edge. Hero banners retain their full-width slides. Static photo grids and their lightboxes retain their existing layouts.

## Shared contract

`BodyCarousel` accepts `label`, `heading`, `children`, `variant`, `autoAdvanceMs`, and `className`. Variants are `home-showcase`, `timeline-impact`, and `content-deck`. Server-rendered children allow custom cards without serializing render functions into a client boundary. `BodyCard` accepts a title, visual, metadata, and content; omitted visuals use the branded SVG fallback.

The shared engine is `src/components/scroll-carousel.tsx`; geometry and control styles live in its CSS module. Home, programme pathways (including two-item pathways), impact photographs, and story supporting media use this engine.

## Geometry and appearance

Use the existing foundation navy, blue, gold, surface, display font, and body font tokens. Controls have 44px circular targets and visible focus rings. Cards have 20px rounded corners, a subtle border, and a low ambient shadow. Image headers use 16:9, clipping, and cover photography. Text has 20px horizontal padding. No neighboring card is faded or scaled.

Card widths use the actual container width, not the screen width. Below 700px the track shows one card plus an 18% preview; from 700px it shows two plus a preview; from 1200px it shows three plus a preview. The gap is 16px. Leading padding is zero. Trailing space allows the final card to align at the same left reading position.

## Motion and navigation

Framer Motion’s native animation API drives shared card/action elevation and progress transitions. Elevation lasts 220ms using the cubic Bézier [0.2, 0.8, 0.2, 1]; progress lasts 240ms. Reduced motion disables animation and automatic advancement. Native horizontal scrolling and scroll snap preserve touch and trackpad behavior.

The heading and controls occupy a common header. Counter, arrows, and optional automatic-play toggle use one control cluster. A slim progress bar replaces dots. Arrow keys, Home, and End navigate when the viewport itself has focus. Links open directly on the first click. Manual pause remains independent of hover/focus pauses. Hidden documents never advance.

## Usage

```tsx
<BodyCarousel
  label="Featured programmes"
  heading={<h2>Different needs. One standard of care.</h2>}
  variant="home-showcase"
  autoAdvanceMs={6500}
>
  {programmes.map(programme => (
    <BodyCard key={programme.id} title={programme.title}
      visual={programme.approvedImage} meta={programme.category}>
      <p>{programme.summary}</p>
      <Link href={programme.href}>Explore programme</Link>
    </BodyCard>
  ))}
</BodyCarousel>
```

```tsx
<BodyCarousel label="Documented programme years"
  heading={<h2>Year-by-year impact</h2>} variant="timeline-impact">
  {years.map(year => (
    <BodyCard key={year.id} title={year.title}
      visual={year.approvedImage} meta={year.year}>
      <p>{year.summary}</p>
      <strong>{year.documentedMetric}</strong>
      <Link href={year.href}>Explore this programme</Link>
    </BodyCard>
  ))}
</BodyCarousel>
```

Only approved images may be passed as visuals. The fallback is decorative, never documentary evidence. Its SVG circles and geometric paths are resolution independent and use existing brand gradients. No new factual claims, identity exposures, or asset approvals are introduced.
