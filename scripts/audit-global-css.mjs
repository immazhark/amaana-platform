import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const layoutPath = path.join(root, 'src/app/layout.tsx');
const homePath = path.join(root, 'src/app/page.tsx');
const homeDocumentaryPath = path.join(root, 'src/app/home-documentary.css');
const retiredHomeMediaPolishPath = path.join(root, 'src/app/home-media-polish.css');
const brandExpressionPath = path.join(root, 'src/app/brand-expression.css');
const retiredIterationThreePath = path.join(root, 'src/app/iteration-three.css');
const layout = await readFile(layoutPath, 'utf8');
const home = await readFile(homePath, 'utf8');
const homeDocumentary = await readFile(homeDocumentaryPath, 'utf8');
const brandExpression = await readFile(brandExpressionPath, 'utf8');

const cssImports = [...layout.matchAll(/import\s+["']\.\/([^"']+\.css)["'];/g)].map(match => match[1]);
const uniqueImports = new Set(cssImports);
const failures = [];

if (cssImports.length !== uniqueImports.size) {
  failures.push('Root layout contains duplicate CSS imports.');
}

// The verified pre-hardening root had 19 stylesheet layers. Homepage-only layers,
 // brand-lockup.css and the adjacent iteration-three.css layer are now scoped or consolidated.
if (cssImports.filter(file => file !== 'site-chrome.css').length > 16) {
  failures.push(`Root layout imports ${cssImports.length} CSS files; expected no more than 16 foundational layers plus the canonical shared-chrome authority.`);
}

if (cssImports.indexOf('site-chrome.css') !== cssImports.indexOf('experience-finish.css') + 1) {
  failures.push('site-chrome.css must immediately follow experience-finish.css.');
}

// Appeal card/progress rules belong to both listing and detail routes, not every page.
if (cssImports.includes('appeal-card.css')) {
  failures.push('appeal-card.css must be owned by the appeals subtree layout.');
}
const appealsLayout = await readFile(path.join(root, 'src/app/appeals/layout.tsx'), 'utf8');
const appealImports = [...appealsLayout.matchAll(/import\s+["']\.\.\/([^"']+\.css)["'];/g)].map(match => match[1]);
if (appealImports.join(',') !== 'appeal-card.css,appeals.css,appeals-wow.css') {
  failures.push('Appeals layout must preserve card, route and polish stylesheet ordering.');
}

// AppealCard is shared by the homepage and /appeals. Route-scoping styles to
// /appeals alone silently breaks the homepage when a live appeal becomes visible.
if (!/import\s+["']\.\/appeal-card\.css["'];/.test(home)) {
  failures.push('Homepage must import appeal-card.css for live AppealCard rendering.');
}

// Guard audited multiline display leading at the actual route-level override
// owners. A component-only fix is insufficient if a later route sheet reverts it.
for (const [file, selectors] of [
  ['appeals.css', ['.v2-appeal-card h3', '.v2-appeals-empty h3', '.v2-appeal-story-grid h2']],
  ['stories.css', ['.v2-stories-feature-copy h2', '.v2-stories-card-copy h3']],
]) {
  const source = await readFile(path.join(root, 'src/app', file), 'utf8');
  for (const selector of selectors) {
    const declarations = source.split(`${selector}{`)[1]?.split('}')[0];
    const lineHeight = Number(declarations?.match(/(?:^|;)\s*line-height:\s*(\d*\.?\d+)(?:\s*;|$)/)?.[1]);
    if (!Number.isFinite(lineHeight) || lineHeight < 1.12) {
      failures.push(`${file}: ${selector} must retain multiline leading of at least 1.12.`);
    }
  }
}

// Tiny appeal-card captions must not regress to the former 3.54–3.78:1
// light-surface gray values. The shared semantic metadata ink meets AA on
// the approved ivory and muted-paper surfaces.
for (const file of ['appeal-card.css', 'appeals.css']) {
  const css = await readFile(path.join(root, 'src/app', file), 'utf8');
  for (const selector of [
    '.v2-appeal-card-head small',
    '.v2-appeal-progress-meta span',
    '.v2-appeal-progress-foot',
  ]) {
    const declarations = css.split(`${selector}{`)[1]?.split('}')[0];
    if (!declarations || !declarations.includes('color:var(--af-color-meta)')) {
      failures.push(`${file}: ${selector} must retain AA metadata ink.`);
    }
  }
}

// The appeal-detail funding strip renders its summary inside a first-child div.
// Direct child selectors on the aside are dead and silently drop the visual
// amount hierarchy. Mobile totals must fit a single owned grid column.
const appealDetailSource = await readFile(path.join(root, 'src/app/appeals/[slug]/page.tsx'), 'utf8');
if (!appealDetailSource.includes('<div><small>Appeal progress</small><strong>')) {
  failures.push('Appeal detail funding markup changed; update nested selector contract and rendered fixture.');
}
const appealRouteCss = await readFile(path.join(root, 'src/app/appeals.css'), 'utf8');
for (const expected of [
  '.v2-appeal-donation-panel>div:first-child>small{display:block;color:var(--af-color-gold-ink)',
  '.v2-appeal-donation-panel>div:first-child>strong{display:block;',
  'line-height:1.12;color:var(--af-color-navy-950)',
  '.v2-appeal-donation-panel>div:first-child>p{margin:.3rem 0 0;color:var(--af-color-muted)',
  '@media(max-width:620px){section.v2-appeal-funding-strip .v2-appeal-donation-panel{grid-template-columns:minmax(0,1fr)',
]) {
  if (!appealRouteCss.includes(expected)) failures.push(`Appeal funding styles missing: ${expected}`);
}
if (/\.v2-appeal-donation-panel>(?:small|strong|p)\s*\{/.test(appealRouteCss)) {
  failures.push('Appeals CSS contains obsolete direct-child funding summary selectors.');
}

// Transaction routes share control styles, while their layout/upload rules stay owned.
const sharedForms = await readFile(path.join(root, 'src/app/forms-experience.css'), 'utf8');
if (/\.v2-(?:donate-|assistance-|file-|amount-|consent-fieldset)/.test(sharedForms)) {
  failures.push('forms-experience.css must contain shared form controls only.');
}
for (const [route, kind] of [['donate', 'donate'], ['request-assistance', 'assistance']]) {
  const source = await readFile(path.join(root, 'src/app', route, 'layout.tsx'), 'utf8');
  const imports = [...source.matchAll(/import\s+["']\.\.\/([^"']+\.css)["'];/g)].map(match => match[1]);
  if (imports.join(',') !== `forms-experience.css,${kind}-structure.css,${kind}-wow.css`) {
    failures.push(`${route} must retain shared controls, owned structure and polish ordering.`);
  }
  if (cssImports.includes(`${kind}-structure.css`)) {
    failures.push(`${kind}-structure.css must remain transaction-route owned.`);
  }
}

// Transaction heroes use PageHero; absent legacy surfaces must not return as dead CSS.
const retiredTransaction = /\bv2-(?:donate-(?:hero(?:-grid)?|context(?:-float)?|back)|assistance-(?:hero(?:-grid)?|promise|before-grid))(?![\w-])/;
for (const file of ['donate-structure.css', 'donate-wow.css', 'assistance-structure.css', 'assistance-wow.css', 'experience-finish.css', 'accessibility.css']) {
  const source = await readFile(path.join(root, 'src/app', file), 'utf8');
  if (retiredTransaction.test(source)) failures.push(`${file} contains retired transaction selectors or animation.`);
}

// Error and 404 styles must remain route-owned instead of burdening every page.
if (cssImports.includes('error-experience.css')) {
  failures.push('error-experience.css must be imported by error and not-found boundaries, not the root layout.');
}
for (const boundary of ['error.tsx', 'not-found.tsx']) {
  const source = await readFile(path.join(root, 'src/app', boundary), 'utf8');
  if (!/import\s+["']\.\/error-experience\.css["'];/.test(source)) {
    failures.push(`${boundary} must import its boundary-only error-experience.css stylesheet.`);
  }
}

// Transaction error.tsx files do not inherit the root error.tsx component's
// imports. They reuse its classes and must explicitly load the boundary CSS.
for (const route of ['donate', 'request-assistance']) {
  const source = await readFile(path.join(root, 'src/app', route, 'error.tsx'), 'utf8');
  if (!/import\s+["']\.\.\/error-experience\.css["'];/.test(source)) {
    failures.push(`${route}/error.tsx must import shared error-experience.css.`);
  }
}

for (const routeOnly of ['home-documentary.css', 'home-media-polish.css']) {
  if (cssImports.includes(routeOnly)) {
    failures.push(`${routeOnly} is homepage-only and must not be imported by the root layout.`);
  }
}

if (cssImports.includes('brand-lockup.css')) {
  failures.push('brand-lockup.css was consolidated into brand-expression.css and must not return as a root layer.');
}

if (cssImports.includes('iteration-three.css')) {
  failures.push('iteration-three.css was consolidated into brand-expression.css and must not return as a root layer.');
}

for (const requiredRule of ['.v2-section-label', '.v2-closing', '.brand-official']) {
  if (!brandExpression.includes(requiredRule)) {
    failures.push(`brand-expression.css is missing consolidated rule ${requiredRule}.`);
  }
}

try {
  await stat(retiredIterationThreePath);
  failures.push('Retired src/app/iteration-three.css still exists; consolidated legacy layers must not remain as dead files.');
} catch (error) {
  if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'ENOENT') throw error;
}

if (!home.match(/import\s+["']\.\/home-documentary\.css["'];/)) {
  failures.push('Homepage must import its route-scoped home-documentary.css stylesheet.');
}

for (const requiredRule of [
  '.v3-home-banner-media{',
  '.v3-home-banner-media>.v2-media-item',
  '.v3-home-banner-media :is(img,video)',
]) {
  if (!homeDocumentary.includes(requiredRule)) {
    failures.push(`home-documentary.css is missing live homepage hero-media rule ${requiredRule}.`);
  }
}

try {
  await stat(retiredHomeMediaPolishPath);
  failures.push('Retired src/app/home-media-polish.css still exists; the live homepage hero-media layer now belongs directly to home-documentary.css.');
} catch (error) {
  if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 'ENOENT') throw error;
}

let sourceBytes = 0;
const rows = [];
for (const file of cssImports) {
  const filePath = path.join(root, 'src/app', file);
  try {
    const bytes = (await stat(filePath)).size;
    sourceBytes += bytes;
    rows.push({ file, bytes });
  } catch {
    failures.push(`Root CSS import does not resolve to src/app/${file}.`);
  }
}

console.log(`Root global CSS layers: ${cssImports.length}`);
console.log(`Root global CSS source bytes: ${sourceBytes}`);
for (const row of rows) console.log(`  ${row.file}: ${row.bytes}`);

if (failures.length) {
  for (const failure of failures) console.error(`CSS architecture failure: ${failure}`);
  process.exit(1);
}
