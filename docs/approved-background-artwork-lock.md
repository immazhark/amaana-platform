# Amaana approved background artwork lock

The user approved revision 4 on 28 September 2026 and requested integration of all six SVGs. This approval supersedes the 18 September raster-backed package. Source: `output/amaana-refined/revision-4/Amaana-backgrounds-v4.zip` in the design workspace.

Preserve these files byte-for-byte. Do not regenerate, recolour or replace them without new approval. They are native vector artwork, with separate desktop/mobile compositions, the text-free Amaana emblem, a blue/champagne header, uniform ivory patterned body and tall blue footer.

| Canonical file under `public/backgrounds/` | SHA-256 |
| --- | --- |
| `Amaana_Website_Body_Background_Mobile.svg` | `3e742c3b1070e251eb86c1dfe52611490f72c595108d9f696a7b6ec9a36ab8c5` |
| `Amaana_Website_Body_Background.svg` | `cc3772feaf6935a9df65244dbb1da8842a9eb64f95e5b2cd2df7d47c7a82722d` |
| `Amaana_Website_Footer_Background_Mobile.svg` | `cfd3a290c70afcb68f67954f946890d19e6bd5163c2da1b6869f966da40c275e` |
| `Amaana_Website_Footer_Background.svg` | `93d6f8bf1d6e4dad77718b9b35e1f9b1c9ba74d648f3a62f88a62c4635baad0e` |
| `Amaana_Website_Header_Banner_Mobile.svg` | `5d9c865facaa9657427e23d3b0decceab653936ac546c1d5739a5b86543ac89f` |
| `Amaana_Website_Header_Banner.svg` | `5bc2669c19271b7497844ac083559916b57ad3a6af097223c4864631ea28f75b` |

Run `npm run backgrounds:verify` to verify the six locked assets. Footer height remains content-driven. Existing dark content sections retain contrast overlays; light body sections use the approved artwork without whitening gradients. Artwork approval does not replace final human review of the integrated website.

## 28 September correction — independent composition

The user's follow-up explicitly authorizes correcting cropped emblems and oversized/uneven body patterns. The six originals above remain unchanged as provenance sources, but public rendering now uses three transparent derivatives: `amaana-arch-emblem.svg`, `amaana-emblem-watermark.svg`, and `amaana-lattice-tile.svg`. The emblem paths, gold treatment and dissolving arch are extracted from the approved header without tracing or regeneration. The lattice remains 104 CSS pixels across section heights; opacity is reduced from .19 to .10, and the body watermark from .035 to .025. Continuous CSS blue/champagne and blue/navy fills scale independently; the entire identity element uses contain in a content-reserved region on desktop and above content on smaller screens. Footer height remains content-driven. Body backgrounds have no gradient.

`e2e/background-system.spec.mjs` checks real homepage and impact-page elements at nine widths for full ornament containment, content non-overlap, horizontal overflow and identical texture scale across different section heights. It no longer creates dummy elements or treats cover as a success criterion. Visual inspection remains required.
