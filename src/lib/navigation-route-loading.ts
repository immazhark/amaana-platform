/** Presentational descriptions for *client-initiated* route navigation.
 * Unlike App Router loading.tsx boundaries, this does not turn HTTP
 * redirects into streamed 200 responses or suppress initial metadata. */
type Layout = "cards" | "form" | "editorial";
export type NavigationLoadingView = { readonly label: string; readonly layout: Layout };

const ROUTES: readonly [string, NavigationLoadingView][] = [
  ["/donate", { label: "Loading donation options", layout: "form" }],
  ["/appeals", { label: "Loading appeals", layout: "cards" }],
  ["/impact", { label: "Loading impact", layout: "cards" }],
  ["/our-work", { label: "Loading programmes", layout: "cards" }],
  ["/request-assistance", { label: "Loading assistance request", layout: "form" }],
  ["/transparency", { label: "Loading transparency", layout: "editorial" }],
];

export function getNavigationLoadingView(pathname: string): NavigationLoadingView | null {
  for (const [prefix, view] of ROUTES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return view;
  }
  return null;
}
