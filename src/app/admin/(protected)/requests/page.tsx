import { AssistanceStatus } from "@prisma/client";
import { redirect } from "next/navigation";

// The assistance queue lives at /admin. Keep older /admin/requests links
// functional inside the existing authenticated admin layout.
type FilterValue = string | string[] | undefined;
type Props = {
  searchParams: Promise<{
    status?: FilterValue;
    view?: FilterValue;
    page?: FilterValue;
  }>;
};

export default async function AdminRequestsAlias({ searchParams }: Props) {
  const { status, view, page } = await searchParams;
  const query = new URLSearchParams();

  // Forward only values already accepted by the real assistance queue.
  if (typeof status === "string" && Object.values(AssistanceStatus).includes(status as AssistanceStatus)) {
    query.set("status", status);
  }
  if (view === "tests") query.set("view", "tests");
  if (typeof page === "string" && /^[1-9][0-9]{0,4}$/.test(page)) query.set("page", page);

  redirect(query.size ? `/admin?${query.toString()}` : "/admin");
}
