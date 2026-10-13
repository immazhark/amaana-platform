// Vitest executes server modules in a plain Node condition rather than Next.js's
// React Server Component condition. Alias the server-only marker to this no-op
// in tests; production builds still resolve the real marker package and enforce
// the client/server import boundary.
export {};
