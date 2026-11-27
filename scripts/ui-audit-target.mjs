export function assertDisposableUiAuditTarget(env) {
  const refused = () => new Error('UI audit records may only be created in the disposable GitHub CI PostgreSQL service.');
  if (env.CI !== 'true' || env.AMAANA_UI_AUDIT_TARGET !== 'isolated-ci' || typeof env.DATABASE_URL !== 'string') throw refused();
  let database;
  try { database = new URL(env.DATABASE_URL); } catch { throw refused(); }
  if (database.protocol !== 'postgresql:' || database.hostname !== 'postgres' || database.port !== '5432' || database.pathname !== '/amaana' || database.username !== 'postgres' || !database.password || database.search !== '?schema=public' || database.hash || database.href !== env.DATABASE_URL) throw refused();
}
