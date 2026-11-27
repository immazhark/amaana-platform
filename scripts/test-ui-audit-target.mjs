import assert from 'node:assert/strict';
import { test } from 'node:test';
import { assertDisposableUiAuditTarget } from './ui-audit-target.mjs';
const valid = { CI: 'true', AMAANA_UI_AUDIT_TARGET: 'isolated-ci', DATABASE_URL: 'postgresql://postgres:synthetic@postgres:5432/amaana?schema=public' };
test('accepts the exact disposable browser database configuration', () => assert.doesNotThrow(() => assertDisposableUiAuditTarget(valid)));
const cases = [
  ['missing CI', { CI: undefined }], ['wrong target', { AMAANA_UI_AUDIT_TARGET: 'other' }],
  ['wrong port', { DATABASE_URL: valid.DATABASE_URL.replace(':5432', ':6432') }],
  ['missing port', { DATABASE_URL: valid.DATABASE_URL.replace(':5432', '') }],
  ['wrong user', { DATABASE_URL: valid.DATABASE_URL.replace('postgres:synthetic', 'other:synthetic') }],
  ['wrong host', { DATABASE_URL: valid.DATABASE_URL.replace('@postgres:', '@outside.invalid:') }],
  ['wrong database', { DATABASE_URL: valid.DATABASE_URL.replace('/amaana', '/other') }],
  ['wrong schema', { DATABASE_URL: valid.DATABASE_URL.replace('public', 'other') }],
  ['duplicate schema', { DATABASE_URL: valid.DATABASE_URL + '&schema=other' }],
  ['additional connection option', { DATABASE_URL: valid.DATABASE_URL + '&host=outside.invalid' }],
  ['fragment', { DATABASE_URL: valid.DATABASE_URL + '#unexpected' }],
  ['surrounding whitespace', { DATABASE_URL: ' ' + valid.DATABASE_URL }],
  ['malformed', { DATABASE_URL: 'PRIVATE_SYNTHETIC_INVALID_URL' }],
];
for (const [name, override] of cases) test(`refuses ${name} without logging connection details`, () => {
  assert.throws(() => assertDisposableUiAuditTarget({ ...valid, ...override }), error => error.message === 'UI audit records may only be created in the disposable GitHub CI PostgreSQL service.');
});
