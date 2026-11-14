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
