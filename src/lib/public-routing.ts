export const PRIVATE_ROUTE_PREFIXES = [
  "/admin",
  "/api",
  "/donate",
  "/donations",
  "/request-assistance/status",
  "/request-assistance/received",
] as const;

export const PUBLIC_STATIC_ROUTES = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/our-work", changeFrequency: "weekly", priority: 0.95 },
  { path: "/recognition", changeFrequency: "yearly", priority: 0.65 },
  { path: "/partner", changeFrequency: "monthly", priority: 0.65 },
  { path: "/get-involved/sponsor-education", changeFrequency: "monthly", priority: 0.75 },
  { path: "/programmes/medical-financial-relief", changeFrequency: "monthly", priority: 0.8 },
  { path: "/programmes/emergency-relief", changeFrequency: "monthly", priority: 0.8 },
  { path: "/programmes/ramadan-eid", changeFrequency: "monthly", priority: 0.8 },
  { path: "/programmes/seasonal-relief", changeFrequency: "monthly", priority: 0.8 },
  { path: "/impact", changeFrequency: "weekly", priority: 0.9 },
  { path: "/stories", changeFrequency: "weekly", priority: 0.85 },
  { path: "/faith-and-reflections", changeFrequency: "weekly", priority: 0.8 },
  { path: "/appeals", changeFrequency: "daily", priority: 0.95 },
  { path: "/about", changeFrequency: "monthly", priority: 0.8 },
  { path: "/get-involved", changeFrequency: "monthly", priority: 0.75 },
  { path: "/request-assistance", changeFrequency: "monthly", priority: 0.7 },
  { path: "/how-we-verify", changeFrequency: "monthly", priority: 0.75 },
  { path: "/transparency", changeFrequency: "monthly", priority: 0.75 },
  { path: "/governance", changeFrequency: "monthly", priority: 0.7 },
  { path: "/compliance", changeFrequency: "monthly", priority: 0.7 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/privacy", changeFrequency: "yearly", priority: 0.3 },
  { path: "/terms", changeFrequency: "yearly", priority: 0.3 },
  { path: "/donation-policy", changeFrequency: "yearly", priority: 0.35 },
  { path: "/refund-policy", changeFrequency: "yearly", priority: 0.35 },
] as const;

export function isPrivateRoute(path: string) {
  return PRIVATE_ROUTE_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`));
}
