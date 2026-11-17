import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';
import test from 'node:test';
import { auditContactEmailLinks } from './contact-email-links.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const contact = readFileSync(join(root, 'src/app/contact/page.tsx'), 'utf8');
const footer = readFileSync(join(root, 'src/components/site-footer.tsx'), 'utf8');

const canonical = 'mailto:amaanafoundation24@gmail.com';
const donation = canonical + '?subject=Donation%20support';

test('AF-R076 preserves native canonical email links on Contact and footer', () => {
  assert.deepEqual(auditContactEmailLinks(contact, footer), []);
});

test('AF-R076 detects Cloudflare-obfuscated replacement even with other correct links', () => {
  const altered = contact.replace(`href: "${canonical}"`, 'href: "/cdn-cgi/l/email-protection#synthetic"');
  assert.notEqual(altered, contact);
  assert.match(auditContactEmailLinks(altered, footer).join('\n'), /Cloudflare email-protection/i);
});

test('AF-R076 detects JavaScript href with leading whitespace before the scheme', () => {
  const altered = contact.replace(`href: "${canonical}"`, 'href: " \\tJaVaScRiPt:alert(1)"');
  assert.notEqual(altered, contact);
  assert.match(auditContactEmailLinks(altered, footer).join('\\n'), /javascript: link/i);
});

test('AF-R076 rejects a wrong donation support email destination', () => {
  const altered = contact.replace(`href: "${donation}"`, 'href: "mailto:elsewhere@example.invalid?subject=Donation%20support"');
  assert.notEqual(altered, contact);
  assert.match(auditContactEmailLinks(altered, footer).join('\n'), /unapproved mailto/i);
});

test('AF-R076 detects a removed footer mailto link and malformed link target', () => {
  const altered = footer.replace(`href="${canonical}"`, 'href="/cdn-cgi/l/email-protection#synthetic"');
  assert.notEqual(altered, footer);
  const problems = auditContactEmailLinks(contact, altered).join('\n');
  assert.match(problems, /Cloudflare email-protection/i);
  assert.match(problems, /footer/i);
});

test('AF-R076 rejects unreviewed dynamic href object expressions and JSX template strings', () => {
  const dynamicObject = contact.replace(
    `href: "${canonical}"`,
    'href: `/cdn-cgi/l/email-protection#${syntheticToken}`',
  );
  assert.notEqual(dynamicObject, contact);
  assert.match(auditContactEmailLinks(dynamicObject, footer).join('\n'),
    /dynamic href.*cannot be verified/i);

  const dynamicJsx = footer.replace(
    `href="${canonical}"`,
    'href={`javascript:${syntheticScheme}`}',
  );
  assert.notEqual(dynamicJsx, footer);
  assert.match(auditContactEmailLinks(contact, dynamicJsx).join('\n'),
    /dynamic href.*cannot be verified/i);

  const dynamicFunction = contact.replace(
    `href: "${canonical}"`,
    'href: computeUnreviewedDestination()',
  );
  assert.notEqual(dynamicFunction, contact);
  assert.match(auditContactEmailLinks(dynamicFunction, footer).join('\n'),
    /dynamic href.*cannot be verified/i);

  const dynamicConcatenation = footer.replace(
    `href="${canonical}"`,
    'href={"mailto:" + unreviewedAddress}',
  );
  assert.notEqual(dynamicConcatenation, footer);
  assert.match(auditContactEmailLinks(contact, dynamicConcatenation).join('\n'),
    /dynamic href.*cannot be verified/i);

  const dynamicIdentifier = footer.replace(
    `href="${canonical}"`,
    'href={unreviewedDestination}',
  );
  assert.notEqual(dynamicIdentifier, footer);
  assert.match(auditContactEmailLinks(contact, dynamicIdentifier).join('\n'),
    /dynamic href.*cannot be verified/i);

  const dynamicMember = footer.replace(
    `href="${canonical}"`,
    'href={unreviewed.href}',
  );
  assert.notEqual(dynamicMember, footer);
  assert.match(auditContactEmailLinks(contact, dynamicMember).join('\n'),
    /dynamic href.*cannot be verified/i);

  const staticTemplate = contact.replace(
    `href: "${canonical}"`,
    'href: `mailto:amaanafoundation24@gmail.com`',
  );
  assert.deepEqual(auditContactEmailLinks(staticTemplate, footer), []);
});

test('AF-R076 fails closed on shorthand object destinations and valueless JSX hrefs', () => {
  const shorthand = contact + '\nconst unreviewedDestination = { href };\n';
  assert.match(auditContactEmailLinks(shorthand, footer).join('\n'),
    /dynamic href.*cannot be verified/i);

  const valueless = footer + '\nconst unreviewedDestination = <a href>Unreviewed link</a>;\n';
  assert.match(auditContactEmailLinks(contact, valueless).join('\n'),
    /dynamic href.*cannot be verified/i);

  const emptyExpression = footer + '\nconst unreviewedDestination = <a href={}>Unreviewed link</a>;\n';
  assert.match(auditContactEmailLinks(contact, emptyExpression).join('\n'),
    /dynamic href.*cannot be verified|cannot be parsed/i);
});
