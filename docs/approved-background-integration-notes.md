# Approved background integration architecture

The approved Amaana background system is integrated through three CSS custom properties, one for each semantic role: hero, body and footer. Desktop/mobile switching belongs in the token layer so consuming components do not hard-code alternate asset paths.

- Hero/banner consumer: `.page-hero--level1` / `.amaana-bg-hero`
- Body consumers: `.v3-work`, `.v3-origin`, `.paper` / `.amaana-bg-body`
- Footer consumer: `.site-footer` / `.amaana-bg-footer`

At `max-width: 768px`, all three tokens switch to the supplied mobile SVG variants. Header/footer mobile positioning remains upper-right; body remains centred. Backgrounds are decorative CSS only and add no semantic image nodes or JavaScript switching logic.

The approved-artwork lock and SHA-256 values are recorded in `docs/approved-background-artwork-lock.md`.
