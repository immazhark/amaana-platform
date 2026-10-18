import { RouteLoadingSkeleton } from "@/components/route-loading-skeleton";

/**
 * Universal server-rendered fallback for routes without a more specific
 * streaming boundary. Public navigation remains intelligible when a data
 * lookup stalls; no progress or financial outcome is invented.
 */
export default function Loading() {
  return <RouteLoadingSkeleton label="Loading the Amaana Foundation page" layout="editorial" />;
}
