import { redirect } from "next/navigation";
import { assistanceQueueHref } from "@/lib/assistance-queue-navigation";

// Keep older /admin/requests links functional inside the authenticated layout.
type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminRequestsAlias({ searchParams }: Props) {
  redirect(assistanceQueueHref(await searchParams));
}
