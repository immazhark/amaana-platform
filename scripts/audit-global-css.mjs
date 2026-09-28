import { readFile, stat, readdir } from 'node:fs/promises';
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

// ProgrammeDetail replaced these legacy route designs. Their scoped selectors
// have no current markup; importing them again silently bloats production CSS.
const retiredProgrammeStyles = new Set([
  'dates.css', 'flood.css', 'medical.css', 'qurbani.css',
  'taleem.css', 'winter.css', 'initiative-experience.css',
]);
async function inspectStyleImports(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await inspectStyleImports(file);
    } else if (/\.(?:tsx?|css)$/.test(entry.name)) {
      const source = await readFile(file, 'utf8');
      for (const match of source.matchAll(/(?:import\s*|@import\s*)["']([^"']+\.css)["']/g)) {
        if (retiredProgrammeStyles.has(path.basename(match[1]))) {
          failures.push(`${path.relative(root, file)} imports retired programme stylesheet ${match[1]}.`);
        }
      }
    }
  }
}
await inspectStyleImports(path.join(root, 'src'));

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
