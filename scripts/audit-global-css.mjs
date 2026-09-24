import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const layoutPath = path.join(root, 'src/app/layout.tsx');
const homePath = path.join(root, 'src/app/page.tsx');
const homeDocumentaryPath = path.join(root, 'src/app/home-documentary.css');
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
if (cssImports.length > 16) {
  failures.push(`Root layout imports ${cssImports.length} CSS files; expected no more than 16.`);
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

for (const requiredRule of ['.v2-kicker,.v2-section-label', '.v2-closing', '.brand-official']) {
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

if (!homeDocumentary.match(/@import\s+["']\.\/home-media-polish\.css["'];/)) {
  failures.push('home-documentary.css must carry the homepage-only hero media layer.');
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
