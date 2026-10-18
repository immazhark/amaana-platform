/** Presentational descriptions for *client-initiated* route navigation.
 * Unlike App Router loading.tsx boundaries, this does not turn HTTP
 * redirects into streamed 200 responses or suppress initial metadata. */
type Layout = "cards" | "form" | "editorial";
export type NavigationLoadingView = { readonly label: string; readonly layout: Layout };

const ROUTES: readonly [string, NavigationLoadingView][] = [
  ["/donate", { label: "Loading donation options", layout: "form" }],
  ["/appeals", { label: "Loading verified appeals", layout: "cards" }],
  ["/impact", { label: "Loading documented impact", layout: "cards" }],
  ["/our-work", { label: "Loading published programmes", layout: "cards" }],
  ["/request-assistance", { label: "Loading the private assistance request", layout: "form" }],
  ["/transparency", { label: "Loading transparency information", layout: "editorial" }],
];

export function getNavigationLoadingView(pathname: string): NavigationLoadingView | null {
  for (const [prefix, view] of ROUTES) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return view;
  }
  return null;
}
