import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const layoutPath = path.join(root, 'src/app/layout.tsx');
const homePath = path.join(root, 'src/app/page.tsx');
const layout = await readFile(layoutPath, 'utf8');
const home = await readFile(homePath, 'utf8');

const cssImports = [...layout.matchAll(/import\s+["']\.\/([^"']+\.css)["'];/g)].map(match => match[1]);
const uniqueImports = new Set(cssImports);
const failures = [];

if (cssImports.length !== uniqueImports.size) {
  failures.push('Root layout contains duplicate CSS imports.');
}

// The verified pre-hardening root had 19 stylesheet layers. This pass must not drift above 18.
if (cssImports.length > 18) {
  failures.push(`Root layout imports ${cssImports.length} CSS files; expected no more than 18.`);
}

if (cssImports.includes('home-documentary.css')) {
  failures.push('home-documentary.css is homepage-only and must not be imported by the root layout.');
}

if (cssImports.includes('brand-lockup.css')) {
  failures.push('brand-lockup.css was consolidated into brand-expression.css and must not return as a root layer.');
}

if (!home.match(/import\s+["']\.\/home-documentary\.css["'];/)) {
  failures.push('Homepage must import its route-scoped home-documentary.css stylesheet.');
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
